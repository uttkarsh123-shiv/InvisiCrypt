#ifndef STEGO_LIB_H
#define STEGO_LIB_H

#include <string>

// ── Text steganography (zero-width Unicode) ───────────────────────────────────
std::string hide_message(const std::string& cover_text,
                         const std::string& secret_message,
                         const std::string& algorithm,
                         const std::string& key);

std::string extract_message(const std::string& stego_text,
                            const std::string& algorithm,
                            const std::string& key);

// ── Image steganography (LSB via OpenCV) ──────────────────────────────────────
// Returns capacity in bytes for the given image.
size_t image_capacity(const std::string& image_path);

// Hides secret_message in input_image, writes result to output_image.
void hide_message_in_image(const std::string& input_image,
                           const std::string& output_image,
                           const std::string& secret_message,
                           const std::string& algorithm,
                           const std::string& key);

// Extracts and decrypts the hidden message from stego_image.
std::string extract_message_from_image(const std::string& stego_image,
                                       const std::string& algorithm,
                                       const std::string& key);

#endif

