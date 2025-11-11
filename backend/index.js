const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
app.use(express.json());

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const MAX_COVER_LENGTH = 5000;
const MAX_SECRET_LENGTH = 500;
const ALLOWED_MODES = ['hide', 'extract'];
const ALLOWED_ALGOS = ['caesar', 'aes'];

function findBinaryPath() {
  const executableName = process.platform === 'win32' ? 'textstego.exe' : 'textstego';
  const candidates = [
    path.join(__dirname, 'build', executableName), // CMake build directory (preferred)
    path.join(__dirname, 'bin', executableName),
    path.join(__dirname, 'src', executableName),
    path.join(__dirname, executableName)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function runStegoProcess(args) {
  return new Promise((resolve, reject) => {
    const binaryPath = findBinaryPath();

    if (!binaryPath) {
      return reject(
        new Error(
          'C++ binary not found. Build the sources in backend/src (e.g. "g++ -std=c++17 src/*.cpp -o bin/textstego").'
        )
      );
    }

    const child = spawn(binaryPath, args, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', err => reject(err));

    child.on('close', code => {
      if (code !== 0) {
        return reject(new Error(stderr.trim() || stdout.trim() || `Process exited with code ${code}`));
      }
      resolve(stdout.trim());
    });
  });
}

app.post('/stego', async (req, res) => {
  const { mode, coverText, secretText, stegoText, algo, key } = req.body || {};

  if (!mode || !ALLOWED_MODES.includes(mode)) {
    return res.status(400).json({ error: 'mode must be "hide" or "extract"' });
  }

  if (!algo || !ALLOWED_ALGOS.includes(algo)) {
    return res.status(400).json({ error: 'algo must be "caesar" or "aes"' });
  }

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'key is required' });
  }

  let args;

  if (mode === 'hide') {
    if (!coverText || !secretText) {
      return res.status(400).json({ error: 'coverText and secretText are required for hide' });
    }

    if (coverText.length > MAX_COVER_LENGTH) {
      return res.status(400).json({ error: `coverText must be <= ${MAX_COVER_LENGTH} characters` });
    }

    if (secretText.length > MAX_SECRET_LENGTH) {
      return res.status(400).json({ error: `secretText must be <= ${MAX_SECRET_LENGTH} characters` });
    }

    args = ['hide', coverText, secretText, algo, key];
  } else {
    if (!stegoText) {
      return res.status(400).json({ error: 'stegoText is required for extract' });
    }

    args = ['extract', stegoText, algo, key];
  }

  try {
    const result = await runStegoProcess(args);
    res.json({ result });
  } catch (error) {
    console.error('Error running stego binary:', error);
    res.status(500).json({ error: error.message });
  }
});

// Root route - serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Frontend available at http://localhost:${PORT}`);
});