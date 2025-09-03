#ifndef UTILS_H
#define UTILS_H

#include <string>
#include <vector>

class Utils {
public:
    // SHA-256 of a string -> returns 32 bytes
    static std::vector<unsigned char> sha256_bytes(const std::string& input);

    // bytes -> binary string "0101..."
    static std::string bytes_to_binary(const std::vector<unsigned char>& bytes);

    // binary string "0101..." -> bytes
    static std::vector<unsigned char> binary_to_bytes(const std::string& binary);
};

#endif
