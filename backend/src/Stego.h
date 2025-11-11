#ifndef STEGO_H
#define STEGO_H

#include <string>
#include <vector>

class Stego {
public:
    // embed bits (string of '0'/'1') into cover text using zero-width chars.
    // returns stego text. throws if not enough capacity.
    static std::string embed_zero_width(const std::string& cover, const std::string& bits);

    // extract bits from stego text (reads zero-width chars)
    static std::string extract_zero_width(const std::string& stego);
};

#endif
