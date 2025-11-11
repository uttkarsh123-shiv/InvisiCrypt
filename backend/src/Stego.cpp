#include "Stego.h"
#include "Utils.h"
#include <iostream>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <vector>

namespace Stego {
    std::string hide(const std::string& cover_text, const std::vector<unsigned char>& data) {
        // Convert data to binary
        std::string binary = Utils::bytes_to_binary(data);
        
        // Add length prefix (32 bits = 4 bytes) to know how many bits to extract
        size_t data_length = binary.length();
        std::string length_binary;
        for (int i = 31; i >= 0; --i) {
            length_binary += ((data_length >> i) & 1) ? '1' : '0';
        }
        
        // Combine length + data
        std::string full_binary = length_binary + binary;
        
        // Handle empty cover text
        if (cover_text.empty()) {
            // If cover is empty, create a minimal cover
            std::string result = " ";
            for (char bit : full_binary) {
                if (bit == '0') {
                    result += static_cast<char>(0xE2);
                    result += static_cast<char>(0x80);
                    result += static_cast<char>(0x8B);
                } else {
                    result += static_cast<char>(0xE2);
                    result += static_cast<char>(0x80);
                    result += static_cast<char>(0x8C);
                }
            }
            return result;
        }
        
        // Embed into cover text - simple sequential insertion
        // Build result by inserting bits after characters, cycling through cover text
        std::string result;
        result.reserve(cover_text.length() + full_binary.length() * 3);
        
        size_t cover_length = cover_text.length();
        size_t bits_inserted = 0;
        
        // Insert bits sequentially, distributing them through the cover text
        for (size_t i = 0; i < cover_length && bits_inserted < full_binary.length(); ++i) {
            // Add cover character
            result += cover_text[i];
            
            // Calculate how many bits should be inserted after this character
            // Distribute bits evenly: character i should have bits from
            // (i * total_bits / cover_length) to ((i+1) * total_bits / cover_length)
            size_t start_bit = (i * full_binary.length()) / cover_length;
            size_t end_bit = ((i + 1) * full_binary.length()) / cover_length;
            
            // Insert bits for this character (use j to index into full_binary correctly)
            for (size_t j = start_bit; j < end_bit && j < full_binary.length() && bits_inserted < full_binary.length(); ++j) {
                char bit = full_binary[j];  // CRITICAL: Use j, not a separate counter!
                if (bit == '0') {
                    // ZWSP for 0
                    result += static_cast<char>(0xE2);
                    result += static_cast<char>(0x80);
                    result += static_cast<char>(0x8B);
                } else {
                    // ZWNJ for 1
                    result += static_cast<char>(0xE2);
                    result += static_cast<char>(0x80);
                    result += static_cast<char>(0x8C);
                }
                bits_inserted++;
            }
        }
        
        // Append any remaining bits at the end (due to integer division rounding)
        while (bits_inserted < full_binary.length()) {
            char bit = full_binary[bits_inserted];
            if (bit == '0') {
                result += static_cast<char>(0xE2);
                result += static_cast<char>(0x80);
                result += static_cast<char>(0x8B);
            } else {
                result += static_cast<char>(0xE2);
                result += static_cast<char>(0x80);
                result += static_cast<char>(0x8C);
            }
            bits_inserted++;
        }
        
        return result;
    }
    
    std::vector<unsigned char> extract(const std::string& stego_text) {
        std::string binary;
        binary.reserve(stego_text.length() * 2); // Reserve space
        
        // Scan for zero-width characters
        for (size_t i = 0; i < stego_text.length(); ) {
            // Check for ZWSP (E2 80 8B) = 0
            if (i + 2 < stego_text.length() &&
                static_cast<unsigned char>(stego_text[i]) == 0xE2 &&
                static_cast<unsigned char>(stego_text[i + 1]) == 0x80 &&
                static_cast<unsigned char>(stego_text[i + 2]) == 0x8B) {
                binary += '0';
                i += 3;
            }
            // Check for ZWNJ (E2 80 8C) = 1
            else if (i + 2 < stego_text.length() &&
                     static_cast<unsigned char>(stego_text[i]) == 0xE2 &&
                     static_cast<unsigned char>(stego_text[i + 1]) == 0x80 &&
                     static_cast<unsigned char>(stego_text[i + 2]) == 0x8C) {
                binary += '1';
                i += 3;
            } else {
                // Regular character, skip
                i++;
            }
        }
        
        std::cerr << "DEBUG extract: Found " << binary.length() << " bits from zero-width characters" << std::endl;
        
        if (binary.empty()) {
            throw std::runtime_error("No zero-width characters found in stego text. Make sure the text contains hidden data.");
        }
        
        if (binary.length() < 32) {
            throw std::runtime_error("Not enough data extracted. Found " + std::to_string(binary.length()) + 
                                   " bits, need at least 32 for length prefix. The stego text may be corrupted or incomplete.");
        }
        
        // Extract length (first 32 bits)
        size_t data_length = 0;
        for (int i = 0; i < 32; ++i) {
            if (binary[i] == '1') {
                data_length |= (1ULL << (31 - i));
            }
        }
        
        std::cerr << "DEBUG extract: Length prefix indicates " << data_length << " bits of data" << std::endl;
        std::cerr << "DEBUG extract: Available bits after length: " << (binary.length() - 32) << std::endl;
        
        // Validate length
        if (data_length == 0) {
            throw std::runtime_error("Invalid data length: 0. The stego text may be corrupted or the wrong key/algorithm was used.");
        }
        
        if (data_length > binary.length() - 32) {
            throw std::runtime_error("Invalid data length: " + std::to_string(data_length) + 
                                   ". Available bits: " + std::to_string(binary.length() - 32) + 
                                   ". The stego text may be truncated or corrupted.");
        }
        
        // Extract actual data (after length prefix)
        std::string data_binary = binary.substr(32, data_length);
        
        std::cerr << "DEBUG extract: Extracted " << data_binary.length() << " bits of data" << std::endl;
        
        if (data_binary.length() % 8 != 0) {
            throw std::runtime_error("Data binary length is not multiple of 8: " + std::to_string(data_binary.length()));
        }
        
        // Convert to bytes
        std::vector<unsigned char> bytes = Utils::binary_to_bytes(data_binary);
        std::cerr << "DEBUG extract: Converted to " << bytes.size() << " bytes" << std::endl;
        
        return bytes;
    }
    
    size_t count_zero_width_chars(const std::string& text) {
        size_t count = 0;
        for (size_t i = 0; i < text.length(); ) {
            if (i + 2 < text.length() &&
                static_cast<unsigned char>(text[i]) == 0xE2 &&
                static_cast<unsigned char>(text[i + 1]) == 0x80) {
                if (static_cast<unsigned char>(text[i + 2]) == 0x8B || 
                    static_cast<unsigned char>(text[i + 2]) == 0x8C) {
                    count++;
                    i += 3;
                    continue;
                }
            }
            i++;
        }
        return count;
    }
    
    std::string get_binary_from_stego(const std::string& stego_text) {
        std::string binary;
        for (size_t i = 0; i < stego_text.length(); ) {
            if (i + 2 < stego_text.length() &&
                static_cast<unsigned char>(stego_text[i]) == 0xE2 &&
                static_cast<unsigned char>(stego_text[i + 1]) == 0x80) {
                if (static_cast<unsigned char>(stego_text[i + 2]) == 0x8B) {
                    binary += '0';
                    i += 3;
                    continue;
                } else if (static_cast<unsigned char>(stego_text[i + 2]) == 0x8C) {
                    binary += '1';
                    i += 3;
                    continue;
                }
            }
            i++;
        }
        return binary;
    }
}

