#ifndef ENCRYPTOR_H
#define ENCRYPTOR_H

#include <string>
#include <vector>

namespace Encryptor {
    // Caesar cipher
    std::vector<unsigned char> caesar_encrypt(const std::vector<unsigned char>& data, int shift);
    std::vector<unsigned char> caesar_decrypt(const std::vector<unsigned char>& data, int shift);
    
    // AES encryption (using OpenSSL-compatible approach)
    // For simplicity, we'll use a basic XOR-based encryption with key derivation
    std::vector<unsigned char> aes_encrypt(const std::vector<unsigned char>& data, const std::string& key);
    std::vector<unsigned char> aes_decrypt(const std::vector<unsigned char>& data, const std::string& key);
    
    // Helper: Derive key from string
    std::vector<unsigned char> derive_key(const std::string& key, size_t length);
}

#endif // ENCRYPTOR_H

