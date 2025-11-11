#include "Utils.h"
#include <sstream>
#include <iomanip>
#include <stdexcept>

namespace Utils {
    std::string bytes_to_binary(const std::vector<unsigned char>& bytes) {
        std::string binary;
        binary.reserve(bytes.size() * 8);
        
        for (unsigned char byte : bytes) {
            for (int i = 7; i >= 0; --i) {
                binary += ((byte >> i) & 1) ? '1' : '0';
            }
        }
        
        return binary;
    }
    
    std::vector<unsigned char> binary_to_bytes(const std::string& binary) {
        if (binary.length() % 8 != 0) {
            throw std::runtime_error("Binary string length must be multiple of 8");
        }
        
        std::vector<unsigned char> bytes;
        bytes.reserve(binary.length() / 8);
        
        for (size_t i = 0; i < binary.length(); i += 8) {
            unsigned char byte = 0;
            for (int j = 0; j < 8; ++j) {
                if (binary[i + j] == '1') {
                    byte |= (1 << (7 - j));
                } else if (binary[i + j] != '0') {
                    throw std::runtime_error("Invalid binary character: " + std::string(1, binary[i + j]));
                }
            }
            bytes.push_back(byte);
        }
        
        return bytes;
    }
    
    std::vector<unsigned char> string_to_bytes(const std::string& str) {
        return std::vector<unsigned char>(str.begin(), str.end());
    }
    
    std::string bytes_to_string(const std::vector<unsigned char>& bytes) {
        return std::string(bytes.begin(), bytes.end());
    }
    
    std::string bytes_to_hex(const std::vector<unsigned char>& bytes) {
        std::ostringstream oss;
        oss << std::hex << std::setfill('0');
        for (unsigned char byte : bytes) {
            oss << std::setw(2) << static_cast<int>(byte) << " ";
        }
        return oss.str();
    }
}

