#include "ImageStego.h"
#include <opencv2/opencv.hpp>
#include <stdexcept>
#include <iostream>

namespace ImageStego {

    // ── Helpers ──────────────────────────────────────────────────────────────

    // Encode a 32-bit unsigned integer as 4 bytes, big-endian
    static std::vector<unsigned char> encode_length(uint32_t len) {
        return {
            static_cast<unsigned char>((len >> 24) & 0xFF),
            static_cast<unsigned char>((len >> 16) & 0xFF),
            static_cast<unsigned char>((len >>  8) & 0xFF),
            static_cast<unsigned char>( len        & 0xFF)
        };
    }

    // Decode 4 big-endian bytes to uint32_t
    static uint32_t decode_length(const std::vector<unsigned char>& bytes, size_t offset) {
        return (static_cast<uint32_t>(bytes[offset])     << 24) |
               (static_cast<uint32_t>(bytes[offset + 1]) << 16) |
               (static_cast<uint32_t>(bytes[offset + 2]) <<  8) |
               (static_cast<uint32_t>(bytes[offset + 3]));
    }

    // ── Public API ────────────────────────────────────────────────────────────

    ImageInfo validate_image(const std::string& image_path) {
        cv::Mat img = cv::imread(image_path, cv::IMREAD_COLOR);

        if (img.empty()) {
            throw std::runtime_error("Cannot read image: " + image_path +
                ". Ensure it is a valid PNG or BMP file.");
        }

        if (img.channels() < 3) {
            throw std::runtime_error("Image must have at least 3 channels (RGB). "
                "Grayscale images are not supported.");
        }

        ImageInfo info;
        info.width    = img.cols;
        info.height   = img.rows;
        info.channels = img.channels();

        // Each pixel channel holds 1 bit. We use 3 channels (BGR).
        // Reserve first 32 bits (4 bytes × 8 bits = 32 pixel-channels) for length header.
        size_t total_bits      = static_cast<size_t>(info.width) * info.height * 3;
        size_t header_bits     = 32; // 4-byte length prefix
        size_t available_bits  = total_bits - header_bits;
        info.capacity_bytes    = available_bits / 8;

        std::cerr << "Image: " << info.width << "x" << info.height
                  << " | capacity: " << info.capacity_bytes << " bytes" << std::endl;

        return info;
    }

    void hide(const std::string& input_path,
              const std::string& output_path,
              const std::vector<unsigned char>& data) {

        cv::Mat img = cv::imread(input_path, cv::IMREAD_COLOR);
        if (img.empty()) {
            throw std::runtime_error("Cannot read image: " + input_path);
        }

        // Build payload: 4-byte length header + data
        std::vector<unsigned char> length_bytes = encode_length(static_cast<uint32_t>(data.size()));
        std::vector<unsigned char> payload;
        payload.insert(payload.end(), length_bytes.begin(), length_bytes.end());
        payload.insert(payload.end(), data.begin(), data.end());

        // Check capacity
        size_t total_bits     = static_cast<size_t>(img.cols) * img.rows * 3;
        size_t required_bits  = payload.size() * 8;

        if (required_bits > total_bits) {
            throw std::runtime_error(
                "Image too small. Need " + std::to_string(required_bits / 8) +
                " bytes capacity, image has " + std::to_string(total_bits / 8) + " bytes.");
        }

        // Embed: iterate pixels row by row, channels B G R
        size_t bit_index = 0;
        size_t total_bits_to_write = required_bits;

        for (int row = 0; row < img.rows && bit_index < total_bits_to_write; ++row) {
            for (int col = 0; col < img.cols && bit_index < total_bits_to_write; ++col) {
                cv::Vec3b& pixel = img.at<cv::Vec3b>(row, col);

                for (int ch = 0; ch < 3 && bit_index < total_bits_to_write; ++ch) {
                    size_t byte_idx = bit_index / 8;
                    size_t bit_pos  = 7 - (bit_index % 8); // MSB first within each byte

                    unsigned char bit = (payload[byte_idx] >> bit_pos) & 1;

                    // Replace LSB of this channel
                    pixel[ch] = (pixel[ch] & 0xFE) | bit;

                    ++bit_index;
                }
            }
        }

        // Write output as PNG (lossless — required to preserve LSBs)
        if (!cv::imwrite(output_path, img)) {
            throw std::runtime_error("Failed to write output image: " + output_path);
        }

        std::cerr << "Embedded " << data.size() << " bytes into " << output_path << std::endl;
    }

    std::vector<unsigned char> extract(const std::string& image_path) {
        cv::Mat img = cv::imread(image_path, cv::IMREAD_COLOR);
        if (img.empty()) {
            throw std::runtime_error("Cannot read image: " + image_path);
        }

        // Step 1: Read first 32 bits to get payload length
        std::vector<unsigned char> length_bytes(4, 0);
        size_t bit_index = 0;

        for (int row = 0; row < img.rows && bit_index < 32; ++row) {
            for (int col = 0; col < img.cols && bit_index < 32; ++col) {
                const cv::Vec3b& pixel = img.at<cv::Vec3b>(row, col);

                for (int ch = 0; ch < 3 && bit_index < 32; ++ch) {
                    size_t byte_idx = bit_index / 8;
                    size_t bit_pos  = 7 - (bit_index % 8);

                    unsigned char bit = pixel[ch] & 1;
                    length_bytes[byte_idx] |= (bit << bit_pos);

                    ++bit_index;
                }
            }
        }

        uint32_t data_length = decode_length(length_bytes, 0);

        std::cerr << "Extracted length header: " << data_length << " bytes" << std::endl;

        if (data_length == 0) {
            throw std::runtime_error("No hidden data found (length header is 0).");
        }

        size_t total_bits     = static_cast<size_t>(img.cols) * img.rows * 3;
        size_t required_bits  = 32 + static_cast<size_t>(data_length) * 8;

        if (required_bits > total_bits) {
            throw std::runtime_error(
                "Corrupt data: length header claims " + std::to_string(data_length) +
                " bytes but image can only hold " + std::to_string((total_bits - 32) / 8) + " bytes.");
        }

        // Step 2: Read data_length bytes worth of bits
        std::vector<unsigned char> data(data_length, 0);
        size_t data_bit_index = 0;
        size_t total_bits_to_read = 32 + data_length * 8;

        // Reset and re-scan from beginning, skipping header bits
        bit_index = 0;

        for (int row = 0; row < img.rows && bit_index < total_bits_to_read; ++row) {
            for (int col = 0; col < img.cols && bit_index < total_bits_to_read; ++col) {
                const cv::Vec3b& pixel = img.at<cv::Vec3b>(row, col);

                for (int ch = 0; ch < 3 && bit_index < total_bits_to_read; ++ch) {
                    if (bit_index >= 32) {
                        // Past the header — reading data
                        size_t byte_idx = data_bit_index / 8;
                        size_t bit_pos  = 7 - (data_bit_index % 8);

                        unsigned char bit = pixel[ch] & 1;
                        data[byte_idx] |= (bit << bit_pos);

                        ++data_bit_index;
                    }
                    ++bit_index;
                }
            }
        }

        std::cerr << "Extracted " << data.size() << " bytes from image" << std::endl;

        return data;
    }

} // namespace ImageStego
