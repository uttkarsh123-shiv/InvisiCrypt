# InvisiCrypt

> Hide secrets in plain sight. Steganography meets encryption.

InvisiCrypt embeds encrypted messages inside ordinary-looking text using invisible zero-width Unicode characters. The output is indistinguishable from normal text — paste it anywhere.

---

## How it works

1. Your secret message is encrypted (Caesar Cipher or AES/XOR)
2. The encrypted bytes are converted to binary
3. Each bit is encoded as a zero-width character:
   - `0` → Zero Width Space (`U+200B`)
   - `1` → Zero Width Non-Joiner (`U+200C`)
4. These invisible characters are woven between the letters of your cover text
5. To extract, the process is reversed — only someone with the correct key can decrypt it

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | EJS, HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express |
| Core engine | C++ (compiled binary) |
| Encryption | Caesar Cipher, AES (XOR-based) |
| Containerization | Docker |

---

## Getting started

### Prerequisites

- Node.js v14+
- CMake v3.10+
- C++ compiler (GCC / Clang / MSVC)

### Install & run

```bash
# Install dependencies
npm install

# Build the C++ binary
npm run build

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Docker

```bash
docker build -t invisicrypt .
docker run -p 3000:3000 invisicrypt
```

---

## API

### `POST /api/hide`

Hides a secret message inside cover text.

**Body**
```json
{
  "coverText": "The weather today is quite pleasant...",
  "secretMessage": "Meet me at midnight.",
  "algorithm": "aes",
  "key": "mysecretkey"
}
```

**Response**
```json
{
  "stegoText": "The weather today is quite pleasant..."
}
```

---

### `POST /api/extract`

Extracts and decrypts a hidden message from stego text.

**Body**
```json
{
  "stegoText": "The weather today is quite pleasant...",
  "algorithm": "aes",
  "key": "mysecretkey"
}
```

**Response**
```json
{
  "secretMessage": "Meet me at midnight."
}
```

---

### `GET /api/health`

Returns server and binary status.

---

## Encryption modes

**Caesar Cipher** — classic shift cipher. Use a numeric key (e.g. `13`). Simple, fast, good for demos.

**AES (XOR)** — XOR-based stream cipher keyed with any string. Stronger protection for real use cases.

---

## Troubleshooting

**Extraction returns empty / wrong result**
- Key must be identical to the one used when hiding
- Algorithm must match
- Stego text must not be modified after generation (some platforms strip invisible characters)
- Ensure files are saved as UTF-8

**Build fails**
- CMake not found → install CMake and add it to PATH
- No compiler → install Visual Studio Build Tools (Windows) or GCC/Clang (Linux/Mac)

**Port 3000 in use**
- Change `PORT` in `backend/index.js`

---

## Security notes

- This is a steganography tool, not a replacement for end-to-end encryption
- Zero-width characters can be detected by tools that inspect raw Unicode
- Use strong, unique keys — especially with the AES mode
- For sensitive data, layer this on top of proper encryption

---

## License

MIT
