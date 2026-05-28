#include <opencv2/opencv.hpp>
#include <iostream>

int main() {
    cv::Mat img = cv::imread("image.png");

    if (img.empty()) {
        std::cout << "Failed to load image\n";
        return 1;
    }

    int width = img.cols;
    int height = img.rows;

    long long totalPixels = (long long)width * height;

    std::cout << "Width  : " << width << '\n';
    std::cout << "Height : " << height << '\n';
    std::cout << "Total Pixels : " << totalPixels << '\n';

    return 0;
}