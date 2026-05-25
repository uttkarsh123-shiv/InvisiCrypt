#ifndef STEGO_LIB_H
#define STEGO_LIB_H

#include <string>

std::string hide_message(const std::string& cover_text, 
                        const std::string& secret_message,
                        const std::string& algorithm,
                        const std::string& key);

std::string extract_message(const std::string& stego_text,
                           const std::string& algorithm,
                           const std::string& key);

#endif 

