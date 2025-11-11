#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>

namespace Utils {
    // Convert bytes to binary string
    std::string bytes_to_binary(const std::vector<unsigned char>& bytes);
    
    // Convert binary string to bytes
    std::vector<unsigned char> binary_to_bytes(const std::string& binary);
    
    // Convert string to bytes
    std::vector<unsigned char> string_to_bytes(const std::string& str);
    
    // Convert bytes to string
    std::string bytes_to_string(const std::vector<unsigned char>& bytes);
    
    // Debug: Print hex representation
    std::string bytes_to_hex(const std::vector<unsigned char>& bytes);
}

#endif // UTILS_H

