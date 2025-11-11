#include "stego_lib.h"
#include <iostream>
using namespace std;
int main(int argc, char* argv[]) {
    if(argc < 2) return 1;

    string mode = argv[1]; // "hide" or "extract"

    if (mode == "hide") {
        if(argc < 6) return 1;
        string cover = argv[2];
        string secret = argv[3];
        string algo = argv[4];
        string key = argv[5];
        cout << hide_message(cover, secret, algo, key) << "\n";
    } else if (mode == "extract") {
        if(argc < 5) return 1;
        string stegoText = argv[2];
        string algo = argv[3];
        string key = argv[4];
        cout << extract_message(stegoText, algo, key) << "\n";
    } else {
        return 1;
    }

    return 0;
}

