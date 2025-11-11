#ifndef STEGO_H
#define STEGO_H

#include <string>
#include <vector>

namespace Stego {
    // Zero-width characters
    const char32_t ZWSP = 0x200B;  // Zero Width Space (UTF-8: E2 80 8B)
    const char32_t ZWNJ = 0x200C;  // Zero Width Non-Joiner (UTF-8: E2 80 8C)
    
    // Hide binary data in cover text
    std::string hide(const std::string& cover_text, const std::vector<unsigned char>& data);
    
    // Extract binary data from stego text
    std::vector<unsigned char> extract(const std::string& stego_text);
    
    // Debug: Count zero-width characters in text
    size_t count_zero_width_chars(const std::string& text);
    
    // Debug: Get binary representation of stego text
    std::string get_binary_from_stego(const std::string& stego_text);
}

#endif // STEGO_H

