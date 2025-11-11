#include "Encryptor.h"
#include <algorithm>
#include <numeric>

namespace Encryptor {
    std::vector<unsigned char> caesar_encrypt(const std::vector<unsigned char>& data, int shift) {
        std::vector<unsigned char> result;
        result.reserve(data.size());
        
        for (unsigned char byte : data) {
            result.push_back((byte + shift) % 256);
        }
        
        return result;
    }
    
    std::vector<unsigned char> caesar_decrypt(const std::vector<unsigned char>& data, int shift) {
        std::vector<unsigned char> result;
        result.reserve(data.size());
        
        for (unsigned char byte : data) {
            int decrypted = (static_cast<int>(byte) - shift) % 256;
            if (decrypted < 0) decrypted += 256;
            result.push_back(static_cast<unsigned char>(decrypted));
        }
        
        return result;
    }
    
    std::vector<unsigned char> derive_key(const std::string& key, size_t length) {
        std::vector<unsigned char> derived;
        derived.reserve(length);
        
        if (key.empty()) {
            // Default key if empty
            derived.assign(length, 0x42);
            return derived;
        }
        
        // Simple key derivation: repeat and hash
        size_t key_len = key.length();
        for (size_t i = 0; i < length; ++i) {
            unsigned char k = static_cast<unsigned char>(key[i % key_len]);
            // Mix with position
            k ^= static_cast<unsigned char>(i % 256);
            derived.push_back(k);
        }
        
        return derived;
    }
    
    std::vector<unsigned char> aes_encrypt(const std::vector<unsigned char>& data, const std::string& key) {
        std::vector<unsigned char> key_bytes = derive_key(key, data.size());
        std::vector<unsigned char> result;
        result.reserve(data.size());
        
        for (size_t i = 0; i < data.size(); ++i) {
            result.push_back(data[i] ^ key_bytes[i]);
        }
        
        return result;
    }
    
    std::vector<unsigned char> aes_decrypt(const std::vector<unsigned char>& data, const std::string& key) {
        // XOR is symmetric, so decryption is the same as encryption
        return aes_encrypt(data, key);
    }
}

