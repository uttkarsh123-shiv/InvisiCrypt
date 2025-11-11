const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');
const isWindows = process.platform === 'win32';
const executableName = isWindows ? 'textstego.exe' : 'textstego';
const executablePath = path.join(buildDir, executableName);

console.log('Building C++ binary with CMake...');
console.log(`Platform: ${process.platform}`);
console.log(`Build directory: ${buildDir}`);

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

try {
  // Check if CMake is available
  try {
    execSync('cmake --version', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('CMake is not installed or not in PATH. Please install CMake first.');
  } 

  // Run CMake configuration
  console.log('📋 Configuring CMake...');
  // Try default generator first, fallback to Unix Makefiles on Linux/Mac
  let cmakeConfig = 'cmake ..';
  if (!isWindows) {
    // On Linux/Mac, explicitly use Unix Makefiles
    cmakeConfig = 'cmake .. -G "Unix Makefiles"';
  }
  
  execSync(cmakeConfig, { 
    cwd: buildDir, 
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PATH: process.env.PATH }
  });

  // Build the project
  console.log('🔧 Building project...');
  execSync('cmake --build .', { 
    cwd: buildDir, 
    stdio: 'inherit',
    shell: isWindows,
    env: { ...process.env, PATH: process.env.PATH }
  });

  // Check if binary was created
  if (fs.existsSync(executablePath)) {
    console.log(`✅ Build successful! Binary created at: ${executablePath}`);
  } else {
    throw new Error(`Binary not found at ${executablePath}`);
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

