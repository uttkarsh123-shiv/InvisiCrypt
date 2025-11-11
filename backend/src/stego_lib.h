#pragma once
#include <string>

using namespace std;

string hide_message(
    const string &cover,
    const string &secret,
    const string &algo,   // "caesar" or "aes"
    const string &key
);

string extract_message(
    const string &stegoText,
    const string &algo,
    const string &key
);
