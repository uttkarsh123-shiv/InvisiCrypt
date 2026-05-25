# InvisiCrypt

> Text steganography meets encryption. Hide secrets in plain sight.

InvisiCrypt embeds encrypted messages inside ordinary-looking text using invisible zero-width Unicode characters. The output is indistinguishable from normal text — paste it anywhere.

---

## How it works

1. The secret message is encrypted (Caesar Cipher or XOR Stream Cipher)
2. The encrypted bytes are converted to binary
3. Each bit is encoded as a zero-width character:
   - `0` → Zero Width Space (`U+200B`)
   - `1` → Zero Width Non-Joiner (`U+200C`)
4. A 32-bit length header is prepended so extraction knows how many bits to read
5. These invisible characters are woven between the letters of the cover text
6. To extract, the process is reversed — only someone with the correct key and cipher can decrypt it

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | EJS, HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express |
| Core engine | C++ (compiled binary via CMake) |
| Encryption | Caesar Cipher, XOR Stream Cipher |
| Containerization | Docker |
| API testing | Postman |

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

### Environment variables

Copy `.env.example` to `.env` and set values as needed:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `RENDER_EXTERNAL_URL` | — | Set automatically by Render for keep-alive pings |

### Docker

```bash
docker build -t invisicrypt .
docker run -p 3000:3000 invisicrypt
```

---

## API

All endpoints accept and return JSON. Tested with Postman.

### `POST /api/hide`

Encrypts a secret message and hides it inside cover text.

**Body**
```json
{
  "coverText": "The weather today is quite pleasant...",
  "secretMessage": "Meet me at midnight.",
  "algorithm": "xor",
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
  "algorithm": "xor",
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

```json
{
  "status": "ok",
  "binary_exists": true,
  "binary_path": "/app/backend/textstego"
}
```

---

## Encryption modes

**Caesar Cipher** — byte shift cipher. Use a numeric key (e.g. `13`). Simple, fast, good for demos. The key string is hashed to a single shift value (sum of char codes mod 256).

**XOR Stream Cipher** — each byte of the message is XORed against a derived key stream. Use any string as the key. Stronger than Caesar — same key + same input always required to decrypt.

> Note: The XOR implementation uses a custom key derivation (repeat + position mix), not a cryptographic KDF. It is not equivalent to AES. For sensitive data, layer this on top of proper end-to-end encryption.

---

## Project structure

```
InvisiCrypt/
├── backend/
│   ├── src/
│   │   ├── main.cpp          # CLI entry point (hide / extract commands)
│   │   ├── Stego.cpp/.h      # Zero-width char embedding & extraction
│   │   ├── Encryptor.cpp/.h  # Caesar and XOR cipher implementations
│   │   ├── stego_lib.cpp/.h  # Glue layer — algorithm dispatch
│   │   └── Utils.cpp/.h      # Binary/byte/string conversion helpers
│   ├── CMakeLists.txt        # Build config (no external dependencies)
│   ├── build.js              # Node.js CMake build script
│   └── index.js              # Express server
├── public/
│   ├── css/style.css
│   └── js/app.js
├── views/
│   └── index.ejs
├── .env.example
├── Dockerfile
└── package.json
```

---

## Troubleshooting

**Extraction returns empty or wrong result**
- Key must be identical to the one used when hiding
- Algorithm must match
- Stego text must not be modified after generation — some platforms strip invisible characters
- Ensure files are saved as UTF-8

**Build fails — stale CMake cache**
- Delete `backend/build/` and run `npm run build` again
- This happens when the project is moved to a different directory

**Port 3000 in use**
- Set a different port in `.env`: `PORT=3001`

---

## Security notes

- This is a steganography tool, not a replacement for end-to-end encryption
- Zero-width characters can be detected by tools that inspect raw Unicode
- Use strong, unique keys — especially with the XOR mode
- For sensitive data, layer this on top of proper encryption (e.g. AES-256-GCM)

---

## License

MIT
