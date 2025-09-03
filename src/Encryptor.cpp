#include "Encryptor.h"
#include "Utils.h"
#include <openssl/evp.h>
#include <openssl/rand.h>
#include <openssl/err.h>
#include <cstring>
#include <stdexcept>

using namespace std;

/* ---------- Caesar ---------- */
static int derive_caesar_shift(const string& password) {
    unsigned long sum = 0;
    for (unsigned char c : password) sum += c;
    return sum % 26;
}

string Encryptor::caesar_encrypt(const string& plaintext, const string& password) {
    int shift = derive_caesar_shift(password);
    string out = plaintext;
    for (size_t i = 0; i < out.size(); ++i) {
        char c = out[i];
        if ('a' <= c && c <= 'z') out[i] = char('a' + (c - 'a' + shift) % 26);
        else if ('A' <= c && c <= 'Z') out[i] = char('A' + (c - 'A' + shift) % 26);
    }
    return out;
}

string Encryptor::caesar_decrypt(const string& ciphertext, const string& password) {
    int shift = derive_caesar_shift(password);
    string out = ciphertext;
    for (size_t i = 0; i < out.size(); ++i) {
        char c = out[i];
        if ('a' <= c && c <= 'z') out[i] = char('a' + (c - 'a' - shift + 26) % 26);
        else if ('A' <= c && c <= 'Z') out[i] = char('A' + (c - 'A' - shift + 26) % 26);
    }
    return out;
}

/* ---------- AES-256-CBC (EVP API) ----------
   - Key = SHA-256(password)
   - IV = 16 random bytes (prepended to output)
   - Output bytes: IV || ciphertext
*/
vector<unsigned char> Encryptor::aes_encrypt_bytes(const string& plaintext, const string& password) {
    vector<unsigned char> key = Utils::sha256_bytes(password); // 32 bytes
    unsigned char iv[16];
    if (RAND_bytes(iv, sizeof(iv)) != 1) throw runtime_error("RAND_bytes failed");

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) throw runtime_error("EVP_CIPHER_CTX_new failed");

    if (EVP_EncryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key.data(), iv) != 1)
        throw runtime_error("EVP_EncryptInit_ex failed");

    vector<unsigned char> ciphertext;
    ciphertext.resize(plaintext.size() + EVP_CIPHER_block_size(EVP_aes_256_cbc()));
    int outlen1 = 0;
    if (EVP_EncryptUpdate(ctx, ciphertext.data(), &outlen1, (const unsigned char*)plaintext.data(), (int)plaintext.size()) != 1)
        throw runtime_error("EVP_EncryptUpdate failed");

    int outlen2 = 0;
    if (EVP_EncryptFinal_ex(ctx, ciphertext.data() + outlen1, &outlen2) != 1)
        throw runtime_error("EVP_EncryptFinal_ex failed");

    ciphertext.resize(outlen1 + outlen2);
    EVP_CIPHER_CTX_free(ctx);

    // Prepend IV
    vector<unsigned char> out;
    out.insert(out.end(), iv, iv + sizeof(iv));
    out.insert(out.end(), ciphertext.begin(), ciphertext.end());
    return out;
}

string Encryptor::aes_decrypt_bytes(const vector<unsigned char>& data, const string& password) {
    if (data.size() < 16) throw runtime_error("Data too short for IV");

    vector<unsigned char> key = Utils::sha256_bytes(password); // 32 bytes
    const unsigned char* iv = data.data();
    const unsigned char* cipherstart = data.data() + 16;
    int cipherlen = (int)data.size() - 16;

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) throw runtime_error("EVP_CIPHER_CTX_new failed");

    if (EVP_DecryptInit_ex(ctx, EVP_aes_256_cbc(), NULL, key.data(), iv) != 1)
        throw runtime_error("EVP_DecryptInit_ex failed");

    vector<unsigned char> plaintext;
    plaintext.resize(cipherlen + EVP_CIPHER_block_size(EVP_aes_256_cbc()));
    int outlen1 = 0;
    if (EVP_DecryptUpdate(ctx, plaintext.data(), &outlen1, cipherstart, cipherlen) != 1)
        throw runtime_error("EVP_DecryptUpdate failed");

    int outlen2 = 0;
    if (EVP_DecryptFinal_ex(ctx, plaintext.data() + outlen1, &outlen2) != 1) {
        EVP_CIPHER_CTX_free(ctx);
        throw runtime_error("EVP_DecryptFinal_ex failed (wrong key or corrupted data)");
    }

    plaintext.resize(outlen1 + outlen2);
    EVP_CIPHER_CTX_free(ctx);
    return string(plaintext.begin(), plaintext.end());
}
