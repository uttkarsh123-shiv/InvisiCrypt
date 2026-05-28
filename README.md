# InvisiCrypt

> Image steganography meets encryption. Hide secrets inside images — invisibly.

InvisiCrypt embeds encrypted messages inside PNG or BMP images by manipulating the Least Significant Bits (LSBs) of pixel channels. The output image is visually identical to the original. Only someone with the correct key and cipher can extract the hidden message.

---

## How it works

### Hiding a message

1. The secret message is encrypted using the chosen cipher (Caesar or XOR)
2. The encrypted bytes are converted to a binary bit stream
3. A 32-bit length header is prepended so extraction knows how many bits to read
4. The C++ engine loads the cover image pixel by pixel
5. Each pixel has 3 channels: **B**, **G**, **R** — each channel is 1 byte (0–255)
6. The LSB (bit 0) of each channel is replaced with one bit of the payload
7. A pixel value changes by at most **±1** — completely imperceptible to the human eye
8. The modified image is written as a lossless **PNG**

```
Original pixel:  R=11001010  G=00110101  B=11100011
                                ↑              ↑              ↑
                              LSB            LSB            LSB

After embedding 3 bits (1, 0, 1):
Modified pixel:  R=1100101[1]  G=0011010[0]  B=1110001[1]
```

### Extracting a message

1. The stego image is loaded
2. LSBs are read from each pixel channel in order
3. The first 32 bits reconstruct the length header
4. The next N bits (as specified by the header) are reconstructed into bytes
5. The bytes are decrypted using the same cipher and key
6. The original secret message is recovered

---

## Capacity

Each pixel stores **3 bits** (one per channel). A 1000×1000 PNG has:

```
1,000,000 pixels × 3 channels = 3,000,000 bits = ~375 KB capacity
```

The app checks capacity before embedding and rejects messages that are too large.

---

## Why PNG and not JPEG

JPEG uses lossy compression — it rewrites pixel values during encoding, which destroys the embedded LSB data. PNG is lossless, so pixel values are preserved exactly. **Always use PNG or BMP.**

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | EJS, HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express |
| Core engine | C++ (compiled binary via CMake) |
| Image processing | OpenCV 4 (imgcodecs, imgproc, core) |
| Encryption | Caesar Cipher, XOR Stream Cipher |
| File uploads | Multer |
| Containerization | Docker |
| API testing | Postman |

---

## Getting started

### Prerequisites

- Node.js v14+
- CMake v3.10+
- C++ compiler (GCC / Clang / MSVC)
- OpenCV 4
  - **Windows (MSYS2/MinGW):** `pacman -S mingw-w64-x86_64-opencv`
  - **Ubuntu/Debian:** `apt install libopencv-dev`
  - **macOS:** `brew install opencv`

### Install & run

```bash
# Install Node.js dependencies
npm install

# Build the C++ binary (requires OpenCV)
npm run build

# Start the server
npm start
```

Open [http://localhost:3000](http://localhost:3000)

### Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `RENDER_EXTERNAL_URL` | — | Set by Render for keep-alive pings |

### Docker

```bash
docker build -t invisicrypt .
docker run -p 3000:3000 invisicrypt
```

> Note: The Dockerfile installs OpenCV in the build stage.

---

## API

All endpoints use `multipart/form-data` for image uploads. Tested with Postman.

### `POST /api/image-capacity`

Validates an image and returns its embedding capacity.

**Form fields**
| Field | Type | Description |
|---|---|---|
| `image` | file | PNG or BMP image |

**Response**
```json
{
  "capacityBytes": 375000
}
```

---

### `POST /api/image-hide`

Encrypts a secret message and embeds it into the cover image via LSB steganography.

**Form fields**
| Field | Type | Description |
|---|---|---|
| `image` | file | PNG or BMP cover image |
| `secretMessage` | string | The message to hide |
| `algorithm` | string | `"caesar"` or `"xor"` |
| `key` | string | Encryption key |

**Response**

Returns the stego image as a PNG file download (`Content-Type: image/png`).

---

### `POST /api/image-extract`

Extracts and decrypts the hidden message from a stego image.

**Form fields**
| Field | Type | Description |
|---|---|---|
| `image` | file | The stego PNG |
| `algorithm` | string | `"caesar"` or `"xor"` — must match what was used to hide |
| `key` | string | Encryption key — must match what was used to hide |

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
  "binary_exists": true
}
```

---

## Encryption modes

**Caesar Cipher** — each byte of the encrypted message is shifted by a value derived from the key (sum of key char codes mod 256). Simple, fast, good for demos.

**XOR Stream Cipher** — each byte is XORed against a derived key stream. The key is repeated and mixed with byte position. Stronger than Caesar. Use any string as the key.

> Neither cipher is cryptographically strong by modern standards. For sensitive data, layer this on top of proper end-to-end encryption (e.g. AES-256-GCM).

---

## Project structure

```
InvisiCrypt/
├── backend/
│   ├── src/
│   │   ├── main.cpp              # CLI entry point (image-hide, image-extract, image-capacity)
│   │   ├── ImageStego.cpp/.h     # LSB embed/extract using OpenCV
│   │   ├── Encryptor.cpp/.h      # Caesar and XOR cipher implementations
│   │   ├── stego_lib.cpp/.h      # Glue layer — validates, encrypts, calls ImageStego
│   │   ├── Stego.cpp/.h          # (text stego — disabled, kept for reference)
│   │   └── Utils.cpp/.h          # Binary/byte/string conversion helpers
│   ├── CMakeLists.txt            # Build config — links OpenCV
│   ├── build.js                  # Node.js CMake build script
│   └── index.js                  # Express server — image API endpoints
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

**Build fails — OpenCV not found**
- Ensure OpenCV is installed and `pkg-config --modversion opencv4` returns a version
- On Windows with MSYS2, make sure you're building with the MinGW toolchain

**Build fails — stale CMake cache**
- Delete `backend/build/` and run `npm run build` again
- This happens when the project is moved to a different directory

**Extraction returns wrong result or garbage**
- The cipher and key must exactly match what was used when hiding
- The image must not have been re-saved as JPEG — JPEG destroys LSB data
- Ensure the image was not resized or processed after the stego PNG was generated

**Port 3000 in use**
- Set a different port in `.env`: `PORT=3001`

---

## Security notes

- This is a steganography tool, not a replacement for end-to-end encryption
- LSB steganography can be detected by statistical steganalysis tools
- Use strong, unique keys — especially with the XOR mode
- PNG files preserve LSBs; always share the stego image as PNG, never convert to JPEG
- For sensitive data, combine this with proper encryption before embedding

---

## License

MIT
