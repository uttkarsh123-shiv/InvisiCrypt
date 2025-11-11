cmake_minimum_required(VERSION 3.10)
project(textstego)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find OpenSSL
find_package(OpenSSL REQUIRED)

# Source files
set(SOURCES
    src/main.cpp
    src/Encryptor.cpp
    src/Stego.cpp
    src/stego_lib.cpp
    src/Utils.cpp
)

# Header files
set(HEADERS
    src/Encryptor.h
    src/Stego.h
    src/stego_lib.h
    src/Utils.h
)

# Create executable
add_executable(textstego ${SOURCES} ${HEADERS})

# Link OpenSSL libraries
target_link_libraries(textstego 
    OpenSSL::SSL 
    OpenSSL::Crypto
)

# Set output directory
set_target_properties(textstego PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
)

