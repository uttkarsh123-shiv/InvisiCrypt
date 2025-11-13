const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.text({ limit: '50mb' }));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static assets
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.render('index');
});

// Get binary path
const getBinaryPath = () => {
    const exeName = process.platform === 'win32' ? 'textstego.exe' : 'textstego';
    const binaryPath = path.join(__dirname, exeName);
    
    if (!fs.existsSync(binaryPath)) {
        throw new Error(`Binary not found at ${binaryPath}. Please run 'npm run build' first.`);
    }
    
    return binaryPath;
};

// Hide endpoint
app.post('/api/hide', (req, res) => {
    try {
        const { cover_text, secret_message, algorithm, key } = req.body;
        
        // Validate inputs
        if (!cover_text || typeof cover_text !== 'string') {
            return res.status(400).json({ error: 'cover_text is required and must be a string' });
        }
        if (!secret_message || typeof secret_message !== 'string') {
            return res.status(400).json({ error: 'secret_message is required and must be a string' });
        }
        if (!algorithm || !['caesar', 'aes'].includes(algorithm)) {
            return res.status(400).json({ error: 'algorithm must be "caesar" or "aes"' });
        }
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'key is required and must be a string' });
        }
        
        const binaryPath = getBinaryPath();
        
        // Spawn process
        const process = spawn(binaryPath, ['hide', cover_text, secret_message, algorithm, key], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        process.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        process.on('close', (code) => {
            if (code !== 0) {
                console.error('Hide error:', stderr);
                return res.status(500).json({ 
                    error: 'Failed to hide message',
                    details: stderr || 'Unknown error',
                    code: code
                });
            }
            
            if (!stdout) {
                return res.status(500).json({ 
                    error: 'No output from binary',
                    details: 'Binary returned empty result'
                });
            }
            
            res.json({ stego_text: stdout });
        });
        
        process.on('error', (err) => {
            console.error('Process error:', err);
            res.status(500).json({ 
                error: 'Failed to execute binary',
                details: err.message
            });
        });
        
    } catch (error) {
        console.error('Hide endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Extract endpoint
app.post('/api/extract', (req, res) => {
    try {
        const { stego_text, algorithm, key } = req.body;
        
        // Validate inputs
        if (!stego_text || typeof stego_text !== 'string') {
            return res.status(400).json({ error: 'stego_text is required and must be a string' });
        }
        if (!algorithm || !['caesar', 'aes'].includes(algorithm)) {
            return res.status(400).json({ error: 'algorithm must be "caesar" or "aes"' });
        }
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'key is required and must be a string' });
        }
        
        const binaryPath = getBinaryPath();
        
        // Spawn process with stdin
        const process = spawn(binaryPath, ['extract', algorithm, key], {
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf8'
        });
        
        let stdout = '';
        let stderr = '';
        let stdinError = null;
        
        process.stdout.on('data', (data) => {
            stdout += data.toString('utf8');
        });
        
        process.stderr.on('data', (data) => {
            stderr += data.toString('utf8');
        });
        
        // Handle stdin errors
        process.stdin.on('error', (err) => {
            stdinError = err;
            console.error('Stdin error:', err);
        });
        
        // Write stego_text to stdin with proper error handling
        try {
            const buffer = Buffer.from(stego_text, 'utf8');
            if (!process.stdin.write(buffer)) {
                process.stdin.once('drain', () => {
                    process.stdin.end();
                });
            } else {
                process.stdin.end();
            }
        } catch (err) {
            console.error('Error writing to stdin:', err);
            process.kill();
            return res.status(500).json({ 
                error: 'Failed to write stego text to process',
                details: err.message
            });
        }
        
        process.on('close', (code) => {
            if (stdinError) {
                return res.status(500).json({ 
                    error: 'Failed to write to process stdin',
                    details: stdinError.message
                });
            }
            
            if (code !== 0) {
                console.error('Extract error (code ' + code + '):', stderr);
                // Parse stderr to get the actual error message
                const errorMatch = stderr.match(/ERROR:\s*(.+)/);
                const errorDetails = errorMatch ? errorMatch[1] : (stderr || 'Unknown error');
                
                return res.status(500).json({ 
                    error: 'Failed to extract message',
                    details: errorDetails.trim(),
                    code: code,
                    debug: {
                        stego_length: stego_text.length,
                        algorithm: algorithm,
                        key_provided: key.length > 0,
                        stderr: stderr
                    }
                });
            }
            
            if (!stdout) {
                return res.status(500).json({ 
                    error: 'No message extracted',
                    details: 'Extraction returned empty result. Check that the stego text, algorithm, and key are correct.',
                    debug: {
                        stego_length: stego_text.length,
                        algorithm: algorithm,
                        key_provided: key.length > 0,
                        stderr: stderr
                    }
                });
            }
            
            res.json({ secret_message: stdout });
        });
        
        process.on('error', (err) => {
            console.error('Process error:', err);
            res.status(500).json({ 
                error: 'Failed to execute binary',
                details: err.message
            });
        });
        
    } catch (error) {
        console.error('Extract endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    try {
        const binaryPath = getBinaryPath();
        res.json({ 
            status: 'ok',
            binary_exists: fs.existsSync(binaryPath),
            binary_path: binaryPath
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'error',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`InvisiCrypt server running on http://localhost:${PORT}`);
    console.log(`Make sure the C++ binary is built (run 'npm run build')`);
});

