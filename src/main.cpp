#include <iostream>
#include <string>
#include <vector>
#include "Encryptor.h"
#include "Stego.h"
#include "Utils.h"

using namespace std;

int main() {
    cout << "Text Stego (Caesar | AES-256) with zero-width embedding\n";
    cout << "1. Hide message\n2. Extract message\nChoose: ";
    int choice;
    cin >> choice;
    cin.ignore();

    if (choice == 1) {
        cout << "Enter cover text (the visible message to send):\n";
        string cover;
        getline(cin, cover);

        cout << "Enter secret message to hide:\n";
        string secret;
        getline(cin, secret);

        cout << "Choose algorithm: 1=Caesar  2=AES-256\n";
        int algoChoice; cin >> algoChoice; cin.ignore();

        cout << "Enter secret key (any text like hello@123):\n";
        string password; getline(cin, password);

        string ciphertext_text;
        vector<unsigned char> ciphertext_bytes;

        if (algoChoice == 1) {
            // Caesar -> ciphertext is text bytes (we'll embed text bytes)
            ciphertext_text = Encryptor::caesar_encrypt(secret, password);
            ciphertext_bytes = vector<unsigned char>(ciphertext_text.begin(), ciphertext_text.end());
        } else {
            // AES -> get bytes (IV + ciphertext)
            ciphertext_bytes = Encryptor::aes_encrypt_bytes(secret, password);
        }

        string bits = Utils::bytes_to_binary(ciphertext_bytes);
        try {
            string stego = Stego::embed_zero_width(cover, bits);
            cout << "\nStego text (send this in group):\n" << stego << "\n\n";
            cout << "Note: invisible characters inserted. Copy-paste may strip them on some platforms.\n";
        } catch (exception& e) {
            cerr << "Error: " << e.what() << endl;
        }
    }
    else if (choice == 2) {
        cout << "Paste stego text (the message you received):\n";
        string stego;
        getline(cin, stego);

        cout << "Choose algorithm used (1=Caesar 2=AES-256): ";
        int algoChoice; cin >> algoChoice; cin.ignore();

        cout << "Enter secret key: ";
        string password; getline(cin, password);

        string bits = Stego::extract_zero_width(stego);
        try {
            vector<unsigned char> bytes = Utils::binary_to_bytes(bits);
            if (algoChoice == 1) {
                string cipherText(bytes.begin(), bytes.end());
                string plain = Encryptor::caesar_decrypt(cipherText, password);
                cout << "\nRecovered secret: " << plain << "\n";
            } else {
                string plain = Encryptor::aes_decrypt_bytes(bytes, password);
                cout << "\nRecovered secret: " << plain << "\n";
            }
        } catch (exception& e) {
            cerr << "Error: " << e.what() << "\n";
            cerr << "Possible reasons: wrong key, wrong algorithm selected, or stego text altered/stripped.\n";
        }
    } else {
        cout << "Invalid choice.\n";
    }

    return 0;
}
