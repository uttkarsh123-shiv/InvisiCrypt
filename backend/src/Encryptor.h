#ifndef ENCRYPTOR_H
#define ENCRYPTOR_H

#include <string>
#include <vector>

using namespace std;
enum class Algo { CAESAR, AES256 };

class Encryptor {
public:
    // Caesar: plaintext -> ciphertext using shift derived from password
    static string caesar_encrypt(const string& plaintext, const string& password);
    static string caesar_decrypt(const string& ciphertext, const string& password);

    // AES-256-CBC using SHA-256(password) -> key. Returns vector bytes: IV(16) + ciphertext
    static vector<unsigned char> aes_encrypt_bytes(const string& plaintext, const string& password);
    // Input: bytes (IV + ciphertext). Returns plaintext string (throws on failure)
    static string aes_decrypt_bytes(const vector<unsigned char>& data, const string& password);
};

#endif
