#include "Utils.h"
#include <openssl/sha.h>
#include <bitset>
#include <stdexcept>
#include <vector>
#include <string>

using namespace std;

vector<unsigned char> Utils::sha256_bytes(const string& input) {
    vector<unsigned char> out(SHA256_DIGEST_LENGTH);
    SHA256_CTX ctx;
    SHA256_Init(&ctx);
    SHA256_Update(&ctx, (const unsigned char*)input.data(), input.size());
    SHA256_Final(out.data(), &ctx);
    return out;
}

string Utils::bytes_to_binary(const vector<unsigned char>& bytes) {
    string s;
    s.reserve(bytes.size() * 8);
    for (unsigned char b : bytes) {
        bitset<8> bs(b);
        s += bs.to_string();
    }
    return s;
}

vector<unsigned char> Utils::binary_to_bytes(const string& binary) {
    if (binary.size() % 8 != 0) throw runtime_error("binary length not multiple of 8");
    vector<unsigned char> out;
    out.reserve(binary.size() / 8);
    for (size_t i = 0; i < binary.size(); i += 8) {
        string byteStr = binary.substr(i, 8);
        unsigned char val = (unsigned char) stoi(byteStr, nullptr, 2);
        out.push_back(val);
    }
    return out;
}
