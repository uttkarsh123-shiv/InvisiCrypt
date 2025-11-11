#include "stego_lib.h"
#include "Stego.h"
#include "Encryptor.h"
#include "Utils.h"
#include <stdexcept>
#include <iostream>
#include <sstream>

std::string hide_message(const std::string& cover_text, 
                        const std::string& secret_message,
                        const std::string& algorithm,
                        const std::string& key) {
    try {
        // Convert secret message to bytes
        std::vector<unsigned char> secret_bytes = Utils::string_to_bytes(secret_message);
        
        // Encrypt the secret
        std::vector<unsigned char> encrypted_bytes;
        
        if (algorithm == "caesar") {
            int shift = 0;
            if (!key.empty()) {
                // Use key hash as shift value
                for (char c : key) {
                    shift += static_cast<int>(c);
                }
                shift = shift % 256;
            }
            encrypted_bytes = Encryptor::caesar_encrypt(secret_bytes, shift);
        } else if (algorithm == "aes") {
            encrypted_bytes = Encryptor::aes_encrypt(secret_bytes, key);
        } else {
            throw std::runtime_error("Unknown algorithm: " + algorithm);
        }
        
        // Hide in cover text
        std::string stego_text = Stego::hide(cover_text, encrypted_bytes);
        
        return stego_text;
    } catch (const std::exception& e) {
        std::cerr << "ERROR in hide_message: " << e.what() << std::endl;
        throw;
    }
}

std::string extract_message(const std::string& stego_text,
                           const std::string& algorithm,
                           const std::string& key) {
    try {
        // Debug: Count zero-width characters
        size_t zw_count = Stego::count_zero_width_chars(stego_text);
        std::cerr << "DEBUG: Found " << zw_count << " zero-width characters in stego text" << std::endl;
        std::cerr << "DEBUG: Stego text length: " << stego_text.length() << " bytes" << std::endl;
        
        // Extract encrypted bytes from stego text
        std::vector<unsigned char> encrypted_bytes = Stego::extract(stego_text);
        
        std::cerr << "DEBUG: Extracted " << encrypted_bytes.size() << " encrypted bytes" << std::endl;
        
        if (encrypted_bytes.empty()) {
            throw std::runtime_error("No data extracted from stego text");
        }
        
        // Decrypt
        std::vector<unsigned char> decrypted_bytes;
        
        if (algorithm == "caesar") {
            int shift = 0;
            if (!key.empty()) {
                for (char c : key) {
                    shift += static_cast<int>(c);
                }
                shift = shift % 256;
            }
            std::cerr << "DEBUG: Caesar shift: " << shift << std::endl;
            decrypted_bytes = Encryptor::caesar_decrypt(encrypted_bytes, shift);
        } else if (algorithm == "aes") {
            std::cerr << "DEBUG: Using AES decryption" << std::endl;
            decrypted_bytes = Encryptor::aes_decrypt(encrypted_bytes, key);
        } else {
            throw std::runtime_error("Unknown algorithm: " + algorithm);
        }
        
        std::cerr << "DEBUG: Decrypted " << decrypted_bytes.size() << " bytes" << std::endl;
        
        // Convert to string
        std::string secret = Utils::bytes_to_string(decrypted_bytes);
        
        std::cerr << "DEBUG: Secret message length: " << secret.length() << " characters" << std::endl;
        
        return secret;
    } catch (const std::exception& e) {
        std::cerr << "ERROR in extract_message: " << e.what() << std::endl;
        throw;
    }
}

