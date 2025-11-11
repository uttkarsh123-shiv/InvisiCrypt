#include <iostream>
#include <string>
#include <sstream>
#include <stdexcept>
#include "stego_lib.h"

int main(int argc, char* argv[]) {
    // Enable error output
    std::cerr.setf(std::ios::unitbuf);
    std::cout.setf(std::ios::unitbuf);
    
    if (argc < 2) {
        std::cerr << "Usage: textstego <hide|extract> [args...]" << std::endl;
        return 1;
    }
    
    std::string command = argv[1];
    
    if (command == "hide") {
        if (argc < 6) {
            std::cerr << "Usage: textstego hide <cover_text> <secret_message> <algorithm> <key>" << std::endl;
            return 1;
        }
        
        std::string cover_text = argv[2];
        std::string secret_message = argv[3];
        std::string algorithm = argv[4];
        std::string key = argv[5];
        
        try {
            std::string stego_text = hide_message(cover_text, secret_message, algorithm, key);
            std::cout << stego_text;
            return 0;
        } catch (const std::exception& e) {
            std::cerr << "ERROR: " << e.what() << std::endl;
            return 1;
        }
    }
    else if (command == "extract") {
        if (argc < 4) {
            std::cerr << "Usage: textstego extract <algorithm> <key> [stego_text from stdin]" << std::endl;
            return 1;
        }
        
        std::string algorithm = argv[2];
        std::string key = argv[3];
        
        // Read entire input from stdin (preserve all bytes including nulls)
        std::string stego_text;
        char ch;
        while (std::cin.get(ch)) {
            stego_text += ch;
        }
        
        if (stego_text.empty()) {
            std::cerr << "ERROR: No input provided via stdin" << std::endl;
            return 1;
        }
        
        try {
            std::string secret = extract_message(stego_text, algorithm, key);
            std::cout << secret;
            return 0;
        } catch (const std::exception& e) {
            std::cerr << "ERROR: " << e.what() << std::endl;
            return 1;
        }
    }
    else {
        std::cerr << "Unknown command: " << command << std::endl;
        std::cerr << "Usage: textstego <hide|extract> [args...]" << std::endl;
        return 1;
    }
}

