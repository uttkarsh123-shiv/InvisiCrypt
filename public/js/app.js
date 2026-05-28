// ── Utilities ─────────────────────────────────────────────────────────────────

function copyToClipboard(elementId) {
    const el = document.getElementById(elementId);
    el.select();
    navigator.clipboard.writeText(el.value).then(() => {
        const btn = window.event.target.closest('button');
        const orig = btn.innerHTML;
        btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!';
        setTimeout(() => { btn.innerHTML = orig; }, 2000);
    }).catch(console.error);
}

function downloadText(elementId, filename) {
    const text = document.getElementById(elementId).value;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
}

function setLoading(btn, loading, loadingText) {
    if (loading) {
        btn._orig = btn.innerHTML;
        btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${loadingText}`;
        btn.disabled = true;
    } else {
        btn.innerHTML = btn._orig;
        btn.disabled = false;
    }
}

function showError(boxId, msg) {
    const box = document.getElementById(boxId);
    box.textContent = msg;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError(boxId) {
    const box = document.getElementById(boxId);
    if (box) box.style.display = 'none';
}

// ── Mode switching (Text / Image) ─────────────────────────────────────────────

function switchMode(mode) {
    document.querySelectorAll('.mode-tab').forEach(t => t.classList.toggle('active', t.dataset.mode === mode));
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.toggle('active', p.id === `${mode}-mode`));
}

// ── View switching (hide / extract within a mode) ─────────────────────────────

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(`${viewName}-view`);
    if (target) target.classList.add('active');

    document.querySelectorAll('[data-view]').forEach(el => {
        el.classList.toggle('active', el.dataset.view === viewName);
    });

    hideError('error-box');
    hideError('image-error-box');
}

// ── DOM Ready ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // Mode tabs (disabled — image only, no switcher needed)
    // document.querySelectorAll('.mode-tab').forEach(...)

    // View tabs + navbar pills
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', () => switchView(el.dataset.view));
    });

    // Start on image-hide
    switchView('image-hide');

    // ── Text stego handlers disabled ──────────────────────────────────────────
    // Text file uploads, char counts, hide form, extract form removed.
    // Re-enable by restoring handlers for cover-file, stego-file,
    // cover-text input, hide-form submit, extract-form submit.

    // ── Image: cover upload + capacity check ──────────────────────────────────

    let imageCapacityBytes = 0;
    let stegoImageBlob     = null;

    document.getElementById('cover-image').addEventListener('change', async e => {
        const file = e.target.files[0]; if (!file) return;
        document.getElementById('cover-image-name').textContent = file.name;
        document.getElementById('image-capacity').textContent = 'checking…';
        document.getElementById('image-capacity-status').textContent = '';

        const fd = new FormData();
        fd.append('image', file);

        try {
            const res  = await fetch('/api/image-capacity', { method: 'POST', body: fd });
            const data = await res.json();
            if (res.ok) {
                imageCapacityBytes = data.capacityBytes;
                document.getElementById('image-capacity').textContent =
                    imageCapacityBytes.toLocaleString() + ' bytes';
                updateImageCounts();
            } else {
                document.getElementById('image-capacity').textContent = 'invalid image';
                showError('image-error-box', data.error + (data.details ? ': ' + data.details : ''));
            }
        } catch (err) {
            document.getElementById('image-capacity').textContent = 'error';
        }
    });

    document.getElementById('stego-image-input').addEventListener('change', e => {
        const file = e.target.files[0]; if (!file) return;
        document.getElementById('stego-image-name').textContent = file.name;
    });

    // ── Image: message char count vs capacity ─────────────────────────────────

    function updateImageCounts() {
        const msgLen = document.getElementById('image-secret-message').value.length;
        document.getElementById('image-secret-count').textContent = msgLen;

        const status = document.getElementById('image-capacity-status');
        if (!imageCapacityBytes || !msgLen) { status.textContent = ''; status.className = 'hint'; return; }

        // Rough estimate: each char ~1 byte after encryption
        if (msgLen > imageCapacityBytes) {
            status.textContent = `⚠ Exceeds capacity by ${msgLen - imageCapacityBytes} bytes`;
            status.className = 'hint error-text';
        } else {
            const left = imageCapacityBytes - msgLen;
            status.textContent = `✓ ${left.toLocaleString()} bytes remaining`;
            status.className = 'hint success-text';
        }
    }

    document.getElementById('image-secret-message').addEventListener('input', updateImageCounts);

    // ── Image: hide ───────────────────────────────────────────────────────────

    document.getElementById('image-hide-form').addEventListener('submit', async e => {
        e.preventDefault();
        hideError('image-error-box');

        const imageFile     = document.getElementById('cover-image').files[0];
        const secretMessage = document.getElementById('image-secret-message').value;
        const algorithm     = document.getElementById('image-hide-algorithm').value;
        const key           = document.getElementById('image-hide-key').value;

        if (!imageFile)     return showError('image-error-box', 'Please upload a cover image.');
        if (!secretMessage) return showError('image-error-box', 'Please enter a secret message.');
        if (!key)           return showError('image-error-box', 'Please enter an encryption key.');

        const btn = e.target.querySelector('button[type="submit"]');
        setLoading(btn, true, 'Embedding…');

        try {
            const fd = new FormData();
            fd.append('image', imageFile);
            fd.append('secretMessage', secretMessage);
            fd.append('algorithm', algorithm);
            fd.append('key', key);

            const res = await fetch('/api/image-hide', { method: 'POST', body: fd });

            if (res.ok) {
                stegoImageBlob = await res.blob();
                const url = URL.createObjectURL(stegoImageBlob);

                document.getElementById('stego-image-preview').src = url;
                document.getElementById('download-stego-image').onclick = () => {
                    const a = Object.assign(document.createElement('a'), { href: url, download: 'stego.png' });
                    document.body.appendChild(a); a.click(); document.body.removeChild(a);
                };

                const result = document.getElementById('image-hide-result');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                const data = await res.json();
                showError('image-error-box', data.error + (data.details ? ': ' + data.details : ''));
            }
        } catch (err) {
            showError('image-error-box', 'Network error: ' + err.message);
        } finally {
            setLoading(btn, false);
        }
    });

    // ── Image: extract ────────────────────────────────────────────────────────

    document.getElementById('image-extract-form').addEventListener('submit', async e => {
        e.preventDefault();
        hideError('image-error-box');

        const imageFile = document.getElementById('stego-image-input').files[0];
        const algorithm = document.getElementById('image-extract-algorithm').value;
        const key       = document.getElementById('image-extract-key').value;

        if (!imageFile) return showError('image-error-box', 'Please upload a stego image.');
        if (!key)       return showError('image-error-box', 'Please enter the encryption key.');

        const btn = e.target.querySelector('button[type="submit"]');
        setLoading(btn, true, 'Extracting…');

        try {
            const fd = new FormData();
            fd.append('image', imageFile);
            fd.append('algorithm', algorithm);
            fd.append('key', key);

            const res  = await fetch('/api/image-extract', { method: 'POST', body: fd });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('image-extracted-output').value = data.secretMessage;
                const result = document.getElementById('image-extract-result');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showError('image-error-box', data.error + (data.details ? ': ' + data.details : ''));
            }
        } catch (err) {
            showError('image-error-box', 'Network error: ' + err.message);
        } finally {
            setLoading(btn, false);
        }
    });

});
