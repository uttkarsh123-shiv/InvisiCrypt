#include "Stego.h"
#include <stdexcept>
#include <string>

using namespace std;

static const char* ZWSP = "\u200B"; // zero width space -> we'll map to '0' (but embedding will add bytes directly)
static const char* ZWNJ = "\u200C"; // zero width non-joiner -> map to '1'

// In C++ string literal above may be encoded in UTF-8. We'll append the UTF-8 byte sequences directly.

// Helper: append UTF-8 zero-width char sequences
static const string ZWSP_UTF8 = "\xE2\x80\x8B"; // U+200B
static const string ZWNJ_UTF8 = "\xE2\x80\x8C"; // U+200C

string Stego::embed_zero_width(const string& cover, const string& bits) {
    // We'll insert one zero-width char after each character in cover until bits exhausted.
    if (bits.empty()) return cover;
    // capacity = number of characters in cover (not counting multibyte sequences) -> approximate with cover.size()
    size_t capacity = cover.size();
    if (bits.size() > capacity) throw runtime_error("Cover text too short to hide message (need more characters)");

    string out;
    size_t bitIndex = 0;
    for (size_t i = 0; i < cover.size(); ++i) {
        out.push_back(cover[i]);
        if (bitIndex < bits.size()) {
            if (bits[bitIndex] == '1') out += ZWNJ_UTF8;
            else out += ZWSP_UTF8;
            ++bitIndex;
        }
    }
    // if bits exhausted, append remaining of cover (already done)
    return out;
}

string Stego::extract_zero_width(const string& stego) {
    // Scan bytes and detect the UTF-8 sequences U+200B and U+200C following characters.
    string bits;
    for (size_t i = 0; i < stego.size(); ++i) {
        // If we encounter the ZW sequences, record them and continue.
        // Because we inserted zero-width sequences immediately after characters,
        // they will appear in the byte stream where we can detect the UTF-8 sequences.
        // Check for 3-byte sequences E2 80 8B (ZWSP) and E2 80 8C (ZWNJ)
        if (i + 2 < stego.size()) {
            unsigned char b1 = (unsigned char)stego[i];
            unsigned char b2 = (unsigned char)stego[i+1];
            unsigned char b3 = (unsigned char)stego[i+2];
            if (b1 == 0xE2 && b2 == 0x80 && b3 == 0x8B) { bits.push_back('0'); i += 2; continue; }
            if (b1 == 0xE2 && b2 == 0x80 && b3 == 0x8C) { bits.push_back('1'); i += 2; continue; }
        }
        // else just move on
    }
    return bits;
}
