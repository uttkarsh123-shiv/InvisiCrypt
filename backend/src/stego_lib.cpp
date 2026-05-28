#include "stego_lib.h"
#include "Stego.h"
#include "ImageStego.h"
#include "Encryptor.h"
#include "Utils.h"
#include <stdexcept>
#include <iostream>

// ── Shared helper: encrypt bytes ──────────────────────────────────────────────

static std::vector<unsigned char> encrypt_bytes(
    const std::vector<unsigned char>& secret_bytes,
    const std::string& algorithm,
    const std::string& key)
{
    if (algorithm == "caesar") {
        int shift = 0;
        for (char c : key) shift += static_cast<int>(static_cast<unsigned char>(c));
        shift %= 256;
        return Encryptor::caesar_encrypt(secret_bytes, shift);
    } else if (algorithm == "xor") {
        return Encryptor::xor_encrypt(secret_bytes, key);
    } else {
        throw std::runtime_error("Unknown algorithm: " + algorithm);
    }
}

static std::vector<unsigned char> decrypt_bytes(
    const std::vector<unsigned char>& encrypted_bytes,
    const std::string& algorithm,
    const std::string& key)
{
    if (algorithm == "caesar") {
        int shift = 0;
        for (char c : key) shift += static_cast<int>(static_cast<unsigned char>(c));
        shift %= 256;
        return Encryptor::caesar_decrypt(encrypted_bytes, shift);
    } else if (algorithm == "xor") {
        return Encryptor::xor_decrypt(encrypted_bytes, key);
    } else {
        throw std::runtime_error("Unknown algorithm: " + algorithm);
    }
}

// ── Text steganography ────────────────────────────────────────────────────────

std::string hide_message(const std::string& cover_text,
                         const std::string& secret_message,
                         const std::string& algorithm,
                         const std::string& key) {
    try {
        std::vector<unsigned char> secret_bytes   = Utils::string_to_bytes(secret_message);
        std::vector<unsigned char> encrypted_bytes = encrypt_bytes(secret_bytes, algorithm, key);
        return Stego::hide(cover_text, encrypted_bytes);
    } catch (const std::exception& e) {
        std::cerr << "ERROR in hide_message: " << e.what() << std::endl;
        throw;
    }
}

std::string extract_message(const std::string& stego_text,
                            const std::string& algorithm,
                            const std::string& key) {
    try {
        std::vector<unsigned char> encrypted_bytes = Stego::extract(stego_text);
        if (encrypted_bytes.empty())
            throw std::runtime_error("No data extracted from stego text.");

        std::vector<unsigned char> decrypted_bytes = decrypt_bytes(encrypted_bytes, algorithm, key);
        return Utils::bytes_to_string(decrypted_bytes);
    } catch (const std::exception& e) {
        std::cerr << "ERROR in extract_message: " << e.what() << std::endl;
        throw;
    }
}

// ── Image steganography ───────────────────────────────────────────────────────

size_t image_capacity(const std::string& image_path) {
    ImageStego::ImageInfo info = ImageStego::validate_image(image_path);
    return info.capacity_bytes;
}

void hide_message_in_image(const std::string& input_image,
                           const std::string& output_image,
                           const std::string& secret_message,
                           const std::string& algorithm,
                           const std::string& key) {
    try {
        // Validate image and check capacity
        ImageStego::ImageInfo info = ImageStego::validate_image(input_image);

        std::vector<unsigned char> secret_bytes    = Utils::string_to_bytes(secret_message);
        std::vector<unsigned char> encrypted_bytes = encrypt_bytes(secret_bytes, algorithm, key);

        if (encrypted_bytes.size() > info.capacity_bytes) {
            throw std::runtime_error(
                "Message too large for this image. "
                "Encrypted size: " + std::to_string(encrypted_bytes.size()) +
                " bytes, capacity: " + std::to_string(info.capacity_bytes) + " bytes.");
        }

        ImageStego::hide(input_image, output_image, encrypted_bytes);
    } catch (const std::exception& e) {
        std::cerr << "ERROR in hide_message_in_image: " << e.what() << std::endl;
        throw;
    }
}

std::string extract_message_from_image(const std::string& stego_image,
                                       const std::string& algorithm,
                                       const std::string& key) {
    try {
        std::vector<unsigned char> encrypted_bytes = ImageStego::extract(stego_image);
        if (encrypted_bytes.empty())
            throw std::runtime_error("No hidden data found in image.");

        std::vector<unsigned char> decrypted_bytes = decrypt_bytes(encrypted_bytes, algorithm, key);
        return Utils::bytes_to_string(decrypted_bytes);
    } catch (const std::exception& e) {
        std::cerr << "ERROR in extract_message_from_image: " << e.what() << std::endl;
        throw;
    }
}
