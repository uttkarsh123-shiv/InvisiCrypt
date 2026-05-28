#ifndef IMAGE_STEGO_H
#define IMAGE_STEGO_H

#include <string>
#include <vector>

namespace ImageStego {

    struct ImageInfo {
        int width;
        int height;
        int channels;
        size_t capacity_bytes; // max bytes that can be hidden
    };

    // Validate image and return info. Throws on invalid image.
    ImageInfo validate_image(const std::string& image_path);

    // Embed encrypted bytes into image LSBs. Writes output PNG.
    void hide(const std::string& input_path,
              const std::string& output_path,
              const std::vector<unsigned char>& data);

    // Extract embedded bytes from image LSBs.
    std::vector<unsigned char> extract(const std::string& image_path);

}

#endif // IMAGE_STEGO_H
