# InvisiCrypt – Phase 1: Text Steganography

**MediaCrypt** is a multi-phase steganography project designed to hide secret messages in various types of media. Phase 1 focuses on **text-based steganography** using zero-width character embedding combined with encryption. Future phases will include **image and video steganography**.

---

## Features

- **Hide messages in plain text** using zero-width characters.
- **Encryption support**:
  - **Caesar Cipher** – simple substitution cipher.
  - **AES-256** – strong encryption for secure hiding.
- **Extract messages** using the same key.
- **Invisible to normal users** – hidden messages do not affect visible text.
- **Works across platforms** – text appears normal on web browsers, chat apps, and editors supporting UTF-8.

---

## How it Works

### Hiding a message:

1. Enter a cover text (the normal-looking visible text).  
2. Enter a secret message.  
3. Choose an encryption algorithm (Caesar or AES-256).  
4. Enter a secret key (used for encryption).  
5. The program outputs **stego text** with invisible characters embedded.

**Limitation:**  
- The **cover text must be sufficiently long** to hide the secret message.  
- The minimum length of the cover text depends on the **combined length of the secret message and the encryption key**.  
- If the cover text is too short, the program will display an **error** and ask for a longer text.

### Extracting a message:

1. Paste the stego text into the tool.  
2. Choose the encryption algorithm used.  
3. Enter the secret key.  
4. The original message is recovered.

> Note: Terminals may display garbled characters due to zero-width characters. Copying the text to a browser or chat app preserves invisibility.

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/uttkarsh123-shiv/InvisiCrypt.git
cd InvisiCrypt
 g++ src/*.cpp -I. -std=c++17 -O2 -lssl -lcrypto -o textstego
./textstego





