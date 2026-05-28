require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const multer   = require('multer');
const { spawn } = require('child_process');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Multer — store uploads in OS temp dir, accept only PNG/BMP
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        const allowed = ['image/png', 'image/bmp', 'image/x-bmp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PNG and BMP images are supported. JPEG is lossy and will corrupt hidden data.'));
        }
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const getBinaryPath = () => {
    const exeName    = process.platform === 'win32' ? 'textstego.exe' : 'textstego';
    const binaryPath = path.join(__dirname, exeName);
    if (!fs.existsSync(binaryPath)) {
        throw new Error(`Binary not found at ${binaryPath}. Run 'npm run build' first.`);
    }
    return binaryPath;
};

const VALID_ALGORITHMS = ['caesar', 'xor'];

const validateAlgorithmKey = (algorithm, key, res) => {
    if (!algorithm || !VALID_ALGORITHMS.includes(algorithm)) {
        res.status(400).json({ error: 'algorithm must be "caesar" or "xor"' });
        return false;
    }
    if (!key || typeof key !== 'string' || key.trim() === '') {
        res.status(400).json({ error: 'key is required' });
        return false;
    }
    return true;
};

// Run binary, collect stdout/stderr, resolve with { stdout, stderr, code }
const runBinary = (args, stdinData = null) => new Promise((resolve) => {
    const proc = spawn(getBinaryPath(), args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    if (stdinData !== null) {
        const buf = Buffer.isBuffer(stdinData) ? stdinData : Buffer.from(stdinData, 'utf8');
        if (!proc.stdin.write(buf)) {
            proc.stdin.once('drain', () => proc.stdin.end());
        } else {
            proc.stdin.end();
        }
        proc.stdin.on('error', () => {}); // suppress EPIPE
    }

    proc.on('close', code => resolve({ stdout, stderr, code }));
    proc.on('error', err  => resolve({ stdout: '', stderr: err.message, code: -1 }));
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.render('index', { title: 'InvisiCrypt' }));

// ── Text: hide ────────────────────────────────────────────────────────────────
app.post('/api/hide', async (req, res) => {
    try {
        const { coverText, secretMessage, algorithm, key } = req.body;

        if (!coverText  || typeof coverText  !== 'string') return res.status(400).json({ error: 'coverText is required' });
        if (!secretMessage || typeof secretMessage !== 'string') return res.status(400).json({ error: 'secretMessage is required' });
        if (coverText.length  > 100000) return res.status(400).json({ error: 'coverText too large (max 100,000 chars)' });
        if (secretMessage.length > 10000)  return res.status(400).json({ error: 'secretMessage too large (max 10,000 chars)' });
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stdout, stderr, code } = await runBinary(
            ['hide', coverText, secretMessage, algorithm, key]
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to hide message', details: msg.trim() });
        }
        if (!stdout) return res.status(500).json({ error: 'Binary returned empty output' });

        res.json({ stegoText: stdout });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ── Text: extract ─────────────────────────────────────────────────────────────
app.post('/api/extract', async (req, res) => {
    try {
        const { stegoText, algorithm, key } = req.body;

        if (!stegoText || typeof stegoText !== 'string') return res.status(400).json({ error: 'stegoText is required' });
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stdout, stderr, code } = await runBinary(
            ['extract', algorithm, key],
            stegoText
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to extract message', details: msg.trim() });
        }
        if (!stdout) return res.status(500).json({ error: 'No message extracted — check stego text, algorithm, and key' });

        res.json({ secretMessage: stdout });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});

// ── Image: capacity check ─────────────────────────────────────────────────────
app.post('/api/image-capacity', upload.single('image'), async (req, res) => {
    const tmpPath = req.file?.path;
    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { stdout, stderr, code } = await runBinary(['image-capacity', tmpPath]);

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(400).json({ error: 'Invalid image', details: msg.trim() });
        }

        res.json({ capacityBytes: parseInt(stdout.trim(), 10) });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmpPath) fs.unlink(tmpPath, () => {});
    }
});

// ── Image: hide ───────────────────────────────────────────────────────────────
app.post('/api/image-hide', upload.single('image'), async (req, res) => {
    const tmpInput  = req.file?.path;
    const tmpOutput = tmpInput ? tmpInput + '_stego.png' : null;

    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { secretMessage, algorithm, key } = req.body;

        if (!secretMessage || typeof secretMessage !== 'string' || secretMessage.trim() === '') {
            return res.status(400).json({ error: 'secretMessage is required' });
        }
        if (secretMessage.length > 50000) {
            return res.status(400).json({ error: 'secretMessage too large (max 50,000 chars)' });
        }
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stdout, stderr, code } = await runBinary(
            ['image-hide', tmpInput, tmpOutput, algorithm, key],
            secretMessage
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to hide message in image', details: msg.trim() });
        }

        if (!fs.existsSync(tmpOutput)) {
            return res.status(500).json({ error: 'Output image was not created' });
        }

        // Stream the stego PNG back to the client
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename="stego.png"');

        const stream = fs.createReadStream(tmpOutput);
        stream.pipe(res);
        stream.on('end', () => {
            fs.unlink(tmpOutput, () => {});
        });

    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmpInput) fs.unlink(tmpInput, () => {});
    }
});

// ── Image: extract ────────────────────────────────────────────────────────────
app.post('/api/image-extract', upload.single('image'), async (req, res) => {
    const tmpPath = req.file?.path;
    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { algorithm, key } = req.body;
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stdout, stderr, code } = await runBinary(
            ['image-extract', tmpPath, algorithm, key]
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to extract message from image', details: msg.trim() });
        }
        if (!stdout) return res.status(500).json({ error: 'No message extracted — check algorithm and key' });

        res.json({ secretMessage: stdout });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmpPath) fs.unlink(tmpPath, () => {});
    }
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    try {
        const binaryPath = getBinaryPath();
        res.json({ status: 'ok', binary_exists: fs.existsSync(binaryPath) });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\nInvisiCrypt running on http://localhost:${PORT}\n`);

    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
        const https = require('https');
        setInterval(() => {
            https.get(`${RENDER_URL}/api/health`, r => {
                console.log(`[keep-alive] ${r.statusCode}`);
            }).on('error', e => console.warn(`[keep-alive] ${e.message}`));
        }, 14 * 60 * 1000);
    }
});
