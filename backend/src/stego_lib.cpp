#include "stego_lib.h"
#include "Encryptor.h"
#include "Stego.h"
#include "Utils.h"

using namespace std;

string hide_message(
    const string &cover,
    const string &secret,
    const string &algo,
    const string &key
){
    vector<unsigned char> ciphertext_bytes;

    if (algo == "caesar") {
        string cipher = Encryptor::caesar_encrypt(secret, key);
        ciphertext_bytes.assign(cipher.begin(), cipher.end());
    } else {
        ciphertext_bytes = Encryptor::aes_encrypt_bytes(secret, key);
    }

    string bits = Utils::bytes_to_binary(ciphertext_bytes);
    return Stego::embed_zero_width(cover, bits);
}

string extract_message(
    const string &stegoText,
    const string &algo,
    const string &key
){
    string bits = Stego::extract_zero_width(stegoText);
    
    vector<unsigned char> bytes = Utils::binary_to_bytes(bits);

    if (algo == "caesar") {
        string cipherText(bytes.begin(), bytes.end());
        return Encryptor::caesar_decrypt(cipherText, key);
    }
    return Encryptor::aes_decrypt_bytes(bytes, key);
}
