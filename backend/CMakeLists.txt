cmake_minimum_required(VERSION 3.10)
project(InvisiCrypt)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# -------------------------------------------------
# Find OpenSSL (Required for AES Encryption)
# -------------------------------------------------
find_package(OpenSSL REQUIRED)

# -------------------------------------------------
# Source and header files
# -------------------------------------------------
set(SOURCES
    src/Stego.cpp
    src/Encryptor.cpp
    src/Utils.cpp
    src/stego_lib.cpp
    src/main.cpp
)

set(HEADERS
    src/Stego.h
    src/Encryptor.h
    src/Utils.h
    src/stego_lib.h
)

# -------------------------------------------------
# Create executable
# -------------------------------------------------
add_executable(textstego ${SOURCES} ${HEADERS})

# Link OpenSSL (AES-256 Support)
target_link_libraries(textstego PRIVATE OpenSSL::Crypto)

# Allow #include "file.h" without full path
target_include_directories(textstego PRIVATE src)

# -------------------------------------------------
# Output directory for Windows + Linux + Mac
# -------------------------------------------------
set_target_properties(textstego PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
)
