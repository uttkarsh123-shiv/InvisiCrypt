#ifndef ENCRYPTOR_H
#define ENCRYPTOR_H

#include <string>
#include <vector>

enum class Algo { CAESAR, AES256 };

class Encryptor {
public:
    // Caesar: plaintext -> ciphertext using shift derived from password
    static std::string caesar_encrypt(const std::string& plaintext, const std::string& password);
    static std::string caesar_decrypt(const std::string& ciphertext, const std::string& password);

    // AES-256-CBC using SHA-256(password) -> key. Returns vector bytes: IV(16) + ciphertext
    static std::vector<unsigned char> aes_encrypt_bytes(const std::string& plaintext, const std::string& password);
    // Input: bytes (IV + ciphertext). Returns plaintext string (throws on failure)
    static std::string aes_decrypt_bytes(const std::vector<unsigned char>& data, const std::string& password);
};

#endif
