#include <iostream>
#include <string>
#include <stdexcept>
#include "stego_lib.h"

/*
  Commands:
    hide    <cover_text> <secret_message> <algorithm> <key>
    extract <algorithm> <key>                              (stego text via stdin)
    image-hide    <input.png> <output.png> <algorithm> <key>  (message via stdin)
    image-extract <stego.png> <algorithm> <key>               (outputs message)
    image-capacity <image.png>                                 (outputs byte count)
*/

int main(int argc, char* argv[]) {
    std::cerr.setf(std::ios::unitbuf);
    std::cout.setf(std::ios::unitbuf);

    if (argc < 2) {
        std::cerr << "Usage: textstego <command> [args...]" << std::endl;
        return 1;
    }

    std::string command = argv[1];

    // ── Text: hide (disabled — image mode only) ──────────────────────────────
    // if (command == "hide") { ... }

    // ── Text: extract (disabled — image mode only) ────────────────────────────
    // else if (command == "extract") { ... }

    // ── Image: hide ───────────────────────────────────────────────────────────
    if (command == "image-hide") {
        if (argc < 6) {
            std::cerr << "Usage: textstego image-hide <input.png> <output.png> <algorithm> <key>" << std::endl;
            return 1;
        }
        std::string input_image  = argv[2];
        std::string output_image = argv[3];
        std::string algorithm    = argv[4];
        std::string key          = argv[5];

        // Read secret message from stdin
        std::string secret_message;
        char ch;
        while (std::cin.get(ch)) secret_message += ch;

        if (secret_message.empty()) {
            std::cerr << "ERROR: No secret message provided via stdin" << std::endl;
            return 1;
        }

        try {
            hide_message_in_image(input_image, output_image, secret_message, algorithm, key);
            std::cout << "OK";
            return 0;
        } catch (const std::exception& e) {
            std::cerr << "ERROR: " << e.what() << std::endl;
            return 1;
        }
    }

    else if (command == "image-extract") {
        if (argc < 5) {
            std::cerr << "Usage: textstego image-extract <stego.png> <algorithm> <key>" << std::endl;
            return 1;
        }
        std::string stego_image = argv[2];
        std::string algorithm   = argv[3];
        std::string key         = argv[4];

        try {
            std::string secret = extract_message_from_image(stego_image, algorithm, key);
            std::cout << secret;
            return 0;
        } catch (const std::exception& e) {
            std::cerr << "ERROR: " << e.what() << std::endl;
            return 1;
        }
    }

    // ── Image: capacity ───────────────────────────────────────────────────────
    else if (command == "image-capacity") {
        if (argc < 3) {
            std::cerr << "Usage: textstego image-capacity <image.png>" << std::endl;
            return 1;
        }
        std::string image_path = argv[2];

        try {
            size_t cap = image_capacity(image_path);
            std::cout << cap;
            return 0;
        } catch (const std::exception& e) {
            std::cerr << "ERROR: " << e.what() << std::endl;
            return 1;
        }
    }

    else {
        std::cerr << "Unknown command: " << command << std::endl;
        std::cerr << "Commands: image-hide, image-extract, image-capacity" << std::endl;
        return 1;
    }
}
