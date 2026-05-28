cmake_minimum_required(VERSION 3.10)
project(InvisiCrypt)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ── Dependencies ──────────────────────────────────────────────────────────────
# OpenCV is required for image steganography (LSB embedding/extraction).
# Install: https://opencv.org/releases/
# Windows (MSYS2/MinGW): pacman -S mingw-w64-x86_64-opencv
# Ubuntu/Debian:         apt install libopencv-dev
# macOS (Homebrew):      brew install opencv

find_package(OpenCV REQUIRED COMPONENTS core imgcodecs imgproc)

message(STATUS "OpenCV version: ${OpenCV_VERSION}")
message(STATUS "OpenCV libs: ${OpenCV_LIBS}")

# ── Source files ──────────────────────────────────────────────────────────────
set(SOURCES
    src/main.cpp
    src/Stego.cpp
    src/ImageStego.cpp
    src/Encryptor.cpp
    src/Utils.cpp
    src/stego_lib.cpp
)

set(HEADERS
    src/Stego.h
    src/ImageStego.h
    src/Encryptor.h
    src/Utils.h
    src/stego_lib.h
)

# ── Binary ────────────────────────────────────────────────────────────────────
add_executable(textstego ${SOURCES} ${HEADERS})

target_include_directories(textstego PRIVATE ${OpenCV_INCLUDE_DIRS})
target_link_libraries(textstego PRIVATE ${OpenCV_LIBS})

# ── Windows output paths ──────────────────────────────────────────────────────
if(WIN32)
    set_target_properties(textstego PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY         ${CMAKE_BINARY_DIR}
        RUNTIME_OUTPUT_DIRECTORY_DEBUG   ${CMAKE_BINARY_DIR}
        RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_BINARY_DIR}
    )
endif()
