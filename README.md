# InvisiCrypt 🔐

A text steganography tool that hides secret messages inside normal-looking text using invisible zero-width Unicode characters.

## Features

- **Invisible Steganography**: Uses Zero Width Space (ZWSP) and Zero Width Non-Joiner (ZWNJ) characters
- **Encryption Support**: Caesar Cipher or AES (XOR-based) encryption before hiding
- **Web Interface**: Modern, user-friendly web UI
- **File Support**: Download stego text and upload for extraction
- **Robust Error Handling**: Comprehensive debugging and error messages

## Architecture

- **Frontend**: HTML/CSS/JavaScript web interface
- **Backend**: Node.js + Express server
- **Core**: C++ binary for steganography operations

## Prerequisites

- Node.js (v14 or higher)
- CMake (v3.10 or higher)
- C++ compiler (GCC, Clang, or MSVC)
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the C++ binary:
```bash
npm run build
```

This will compile the C++ code and create `backend/textstego.exe` (Windows) or `backend/textstego` (Linux/Mac).

## Usage

1. Start the server:
```bash
npm start
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. **Hide a message**:
   - Enter cover text (normal-looking text)
   - Enter secret message
   - Select encryption algorithm (Caesar or AES)
   - Enter encryption key
   - Click "Hide Message"
   - Download the stego text

4. **Extract a message**:
   - Upload stego.txt file or paste stego text
   - Select the same encryption algorithm used for hiding
   - Enter the same encryption key
   - Click "Extract Message"
   - View or download the extracted secret

## How It Works

### Hiding Process

1. Secret message is encrypted using the selected algorithm and key
2. Encrypted data is converted to binary (0s and 1s)
3. A 32-bit length prefix is added to know how many bits to extract
4. Each binary bit is embedded as:
   - `0` → Zero Width Space (ZWSP, UTF-8: E2 80 8B)
   - `1` → Zero Width Non-Joiner (ZWNJ, UTF-8: E2 80 8C)
5. Zero-width characters are inserted between characters in the cover text

### Extraction Process

1. Stego text is scanned for zero-width character sequences
2. Each sequence is converted back to a binary bit
3. Length prefix is read to determine how many bits to extract
4. Binary data is converted back to bytes
5. Bytes are decrypted using the algorithm and key
6. Original secret message is recovered

## Troubleshooting

### Extraction returns empty string

1. **Verify the key**: Make sure you're using the exact same key used for hiding
2. **Check the algorithm**: The algorithm must match (Caesar or AES)
3. **Verify stego text**: Ensure the stego text wasn't modified or corrupted
4. **Check file encoding**: When uploading files, ensure they're saved as UTF-8

### Build errors

- **CMake not found**: Install CMake and ensure it's in your PATH
- **Compiler not found**: Install a C++ compiler (Visual Studio Build Tools on Windows, GCC/Clang on Linux/Mac)
- **Binary not created**: Check the build output for errors

### Server errors

- **Port 3000 in use**: Change the port in `backend/index.js`
- **Binary not found**: Run `npm run build` first

## Debugging

The application includes comprehensive error handling:

- **C++ errors**: Printed to stderr with detailed messages
- **Backend errors**: Returned as JSON with error details
- **Frontend errors**: Displayed in error boxes with debug information

## Security Notes

- This is a steganography tool, not a security tool
- The encryption is basic (Caesar/XOR) - use proper encryption for real security
- Zero-width characters can be detected by analyzing the text
- Always use strong, unique keys

## For any Queries
- MailID: uttkarshsingh450@gmail.com


