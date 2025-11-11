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
- Approximate formula:

\[
\text{Minimum Cover Text Length} \ge (\text{Length of Secret Message} + \text{Length of Key}) \times X
\]

Where:  
- **Length of Secret Message** = number of characters in the secret text.  
- **Length of Key** = number of characters in the encryption key.  
- **X** = factor depending on the encryption method:  
  - Caesar Cipher → X ≈ 1  
  - AES-256 → X ≈ 3–4 (more space required for encryption)

- If the cover text is too short, the program will display an **error** and ask for a longer text.


### Extracting a message:

1. Paste the stego text into the tool.  
2. Choose the encryption algorithm used.  
3. Enter the secret key.  
4. The original message is recovered.

> Note: Terminals may display garbled characters due to zero-width characters. Copying the text to a browser or chat app preserves invisibility.

---

## Installation

### Prerequisites

- **Node.js** (v14 or higher)
- **CMake** (v3.10 or higher)
- **OpenSSL** development libraries
  - On Ubuntu/Debian: `sudo apt-get install libssl-dev cmake`
  - On macOS: `brew install openssl cmake`
  - On Windows: Install OpenSSL and CMake from their official websites

### Local Setup

1. Clone the repository:

```bash
git clone https://github.com/uttkarsh123-shiv/InvisiCrypt.git
cd InvisiCrypt
```

2. Install dependencies and build:

```bash
cd backend
npm install
```

The `postinstall` script will automatically build the C++ binary using CMake.

3. Start the server:

```bash
npm start
```

4. Open your browser and navigate to:

```
http://localhost:3000
```

### Manual Build (if needed)

If you need to rebuild the C++ binary manually:

```bash
cd backend
npm run build
```

Or manually with CMake:

```bash
cd backend
mkdir -p build
cd build
cmake ..
cmake --build .
```

## Deployment on Render

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your GitHub repository
4. Use these settings:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node

The build process will automatically:
- Install Node.js dependencies
- Build the C++ binary using CMake (via `postinstall` script)
- Start the Express server

**Note**: Make sure CMake and OpenSSL are available in Render's build environment (they should be by default).






