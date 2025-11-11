const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building InvisiCrypt C++ binary...');

const buildDir = path.join(__dirname, 'build');
const srcDir = path.join(__dirname, 'src');

// Create build directory
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

try {
    // Configure CMake
    console.log('Configuring CMake...');
    execSync('cmake -B build -S .', { 
        cwd: __dirname, 
        stdio: 'inherit',
        shell: true
    });
    
    // Build
    console.log('Building...');
    execSync('cmake --build build --config Release', { 
        cwd: __dirname, 
        stdio: 'inherit',
        shell: true
    });
    
    // Copy executable to backend directory
    const exeName = process.platform === 'win32' ? 'textstego.exe' : 'textstego';
    const exePath = path.join(buildDir, 'Release', exeName);
    const exePathDebug = path.join(buildDir, 'Debug', exeName);
    const exePathNoConfig = path.join(buildDir, exeName);
    const targetPath = path.join(__dirname, exeName);
    
    // Try different possible locations
    if (fs.existsSync(exePath)) {
        fs.copyFileSync(exePath, targetPath);
        console.log(`✓ Binary created: ${targetPath}`);
    } else if (fs.existsSync(exePathDebug)) {
        fs.copyFileSync(exePathDebug, targetPath);
        console.log(`✓ Binary created: ${targetPath}`);
    } else if (fs.existsSync(exePathNoConfig)) {
        fs.copyFileSync(exePathNoConfig, targetPath);
        console.log(`✓ Binary created: ${targetPath}`);
    } else {
        console.error('✗ Executable not found in expected locations');
        console.error('  Tried:', exePath);
        console.error('  Tried:', exePathDebug);
        console.error('  Tried:', exePathNoConfig);
        process.exit(1);
    }
    
    console.log('Build complete!');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}

