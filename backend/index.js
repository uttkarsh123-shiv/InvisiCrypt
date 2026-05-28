require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const multer    = require('multer');
const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');
const os        = require('os');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Multer — OS temp dir, PNG/BMP only, 10 MB max
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/png', 'image/bmp', 'image/x-bmp'];
        allowed.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Only PNG and BMP are supported. JPEG is lossy and will corrupt hidden data.'));
    }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const getBinaryPath = () => {
    const name = process.platform === 'win32' ? 'textstego.exe' : 'textstego';
    const p    = path.join(__dirname, name);
    if (!fs.existsSync(p)) throw new Error(`Binary not found at ${p}. Run 'npm run build' first.`);
    return p;
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

const runBinary = (args, stdinData = null) => new Promise((resolve) => {
    const proc = spawn(getBinaryPath(), args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    if (stdinData !== null) {
        const buf = Buffer.isBuffer(stdinData) ? stdinData : Buffer.from(stdinData, 'utf8');
        if (!proc.stdin.write(buf)) {
            proc.stdin.once('drain', () => proc.stdin.end());
        } else {
            proc.stdin.end();
        }
        proc.stdin.on('error', () => {});
    }

    proc.on('close', code => resolve({ stdout, stderr, code }));
    proc.on('error', err  => resolve({ stdout: '', stderr: err.message, code: -1 }));
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (_req, res) => res.render('index', { title: 'InvisiCrypt' }));

// ── Text stego endpoints (disabled — image mode only) ─────────────────────────
// To re-enable, uncomment and restore the handler bodies.
//
// app.post('/api/hide',    async (req, res) => { /* text hide logic */ });
// app.post('/api/extract', async (req, res) => { /* text extract logic */ });

// ── Image: capacity ───────────────────────────────────────────────────────────
app.post('/api/image-capacity', upload.single('image'), async (req, res) => {
    const tmp = req.file?.path;
    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { stdout, stderr, code } = await runBinary(['image-capacity', tmp]);
        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(400).json({ error: 'Invalid image', details: msg.trim() });
        }
        res.json({ capacityBytes: parseInt(stdout.trim(), 10) });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmp) fs.unlink(tmp, () => {});
    }
});

// ── Image: hide ───────────────────────────────────────────────────────────────
app.post('/api/image-hide', upload.single('image'), async (req, res) => {
    const tmpIn  = req.file?.path;
    const tmpOut = tmpIn ? tmpIn + '_stego.png' : null;

    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { secretMessage, algorithm, key } = req.body;

        if (!secretMessage || secretMessage.trim() === '')
            return res.status(400).json({ error: 'secretMessage is required' });
        if (secretMessage.length > 50000)
            return res.status(400).json({ error: 'secretMessage too large (max 50,000 chars)' });
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stderr, code } = await runBinary(
            ['image-hide', tmpIn, tmpOut, algorithm, key],
            secretMessage
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to hide message in image', details: msg.trim() });
        }
        if (!fs.existsSync(tmpOut))
            return res.status(500).json({ error: 'Output image was not created' });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'attachment; filename="stego.png"');
        const stream = fs.createReadStream(tmpOut);
        stream.pipe(res);
        stream.on('end', () => fs.unlink(tmpOut, () => {}));

    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmpIn) fs.unlink(tmpIn, () => {});
    }
});

// ── Image: extract ────────────────────────────────────────────────────────────
app.post('/api/image-extract', upload.single('image'), async (req, res) => {
    const tmp = req.file?.path;
    try {
        if (!req.file) return res.status(400).json({ error: 'image file is required' });

        const { algorithm, key } = req.body;
        if (!validateAlgorithmKey(algorithm, key, res)) return;

        const { stdout, stderr, code } = await runBinary(
            ['image-extract', tmp, algorithm, key]
        );

        if (code !== 0) {
            const msg = stderr.match(/ERROR:\s*(.+)/)?.[1] || stderr || 'Unknown error';
            return res.status(500).json({ error: 'Failed to extract message from image', details: msg.trim() });
        }
        if (!stdout)
            return res.status(500).json({ error: 'No message extracted — check algorithm and key' });

        res.json({ secretMessage: stdout });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error', details: err.message });
    } finally {
        if (tmp) fs.unlink(tmp, () => {});
    }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    try {
        res.json({ status: 'ok', binary_exists: fs.existsSync(getBinaryPath()) });
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
