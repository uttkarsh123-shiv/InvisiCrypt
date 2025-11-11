cmake_minimum_required(VERSION 3.10)
project(InvisiCrypt)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Source files
set(SOURCES
    src/Stego.cpp
    src/Encryptor.cpp
    src/Utils.cpp
    src/stego_lib.cpp
    src/main.cpp
)

# Header files
set(HEADERS
    src/Stego.h
    src/Encryptor.h
    src/Utils.h
    src/stego_lib.h
)

# Create executable
add_executable(textstego ${SOURCES} ${HEADERS})

# Windows-specific settings
if(WIN32)
    set_target_properties(textstego PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
        RUNTIME_OUTPUT_DIRECTORY_DEBUG ${CMAKE_BINARY_DIR}
        RUNTIME_OUTPUT_DIRECTORY_RELEASE ${CMAKE_BINARY_DIR}
    )
endif()

