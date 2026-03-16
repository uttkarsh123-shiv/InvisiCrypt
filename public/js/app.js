// ── Utilities (global for onclick handlers) ──────────────────────────────────

function copyToClipboard(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
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
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showError(msg) {
    const box = document.getElementById('error-box');
    box.textContent = msg;
    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    const box = document.getElementById('error-box');
    if (box) box.style.display = 'none';
}

// ── Switch active view ────────────────────────────────────────────────────────

function switchView(viewName) {
    // views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${viewName}-view`).classList.add('active');

    // all tab controls (navbar + tool section)
    document.querySelectorAll('[data-view]').forEach(el => {
        el.classList.toggle('active', el.dataset.view === viewName);
    });

    hideError();
}

// ── DOM Ready ─────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

    // Wire up every element with data-view (navbar tabs + tool tabs)
    document.querySelectorAll('[data-view]').forEach(el => {
        el.addEventListener('click', () => switchView(el.dataset.view));
    });

    // ── File uploads ──────────────────────────────────────────────────────────

    document.getElementById('cover-file').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            document.getElementById('cover-text').value = ev.target.result;
            updateCounts();
        };
        reader.readAsText(file);
    });

    document.getElementById('stego-file').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => { document.getElementById('stego-text').value = ev.target.result; };
        reader.readAsText(file);
    });

    // ── Character counts ──────────────────────────────────────────────────────

    function updateCounts() {
        const coverLen  = document.getElementById('cover-text').value.length;
        const secretLen = document.getElementById('secret-message').value.length;
        const capacity  = Math.max(0, Math.floor((coverLen - 1) / 2));

        document.getElementById('max-capacity').textContent    = capacity;
        document.getElementById('secret-char-count').textContent = secretLen;

        const status = document.getElementById('capacity-status');
        if (!coverLen || !secretLen) {
            status.textContent = '';
            status.className = 'hint';
        } else if (secretLen > capacity) {
            const over = secretLen - capacity;
            status.textContent = `⚠ Too long by ${over} char${over > 1 ? 's' : ''}`;
            status.className = 'hint error-text';
        } else {
            const left = capacity - secretLen;
            status.textContent = `✓ ${left} char${left !== 1 ? 's' : ''} remaining`;
            status.className = 'hint success-text';
        }
    }

    document.getElementById('cover-text').addEventListener('input', updateCounts);
    document.getElementById('secret-message').addEventListener('input', updateCounts);
    updateCounts();

    // ── Hide form ─────────────────────────────────────────────────────────────

    document.getElementById('hide-form').addEventListener('submit', async e => {
        e.preventDefault();
        hideError();

        const coverText     = document.getElementById('cover-text').value;
        const secretMessage = document.getElementById('secret-message').value;
        const algorithm     = document.getElementById('hide-algorithm').value;
        const key           = document.getElementById('hide-key').value;

        if (!coverText)     return showError('Please provide cover text or upload a file.');
        if (!secretMessage) return showError('Please enter a secret message.');
        if (!key)           return showError('Please enter an encryption key.');

        const btn = e.target.querySelector('button[type="submit"]');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Hiding…';
        btn.disabled = true;

        try {
            const res  = await fetch('/api/hide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ coverText, secretMessage, algorithm, key })
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('stego-output').value = data.stegoText;
                const result = document.getElementById('hide-result');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showError(data.error || 'Failed to hide message.');
            }
        } catch (err) {
            showError('Network error: ' + err.message);
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled  = false;
        }
    });

    // ── Extract form ──────────────────────────────────────────────────────────

    document.getElementById('extract-form').addEventListener('submit', async e => {
        e.preventDefault();
        hideError();

        const stegoText = document.getElementById('stego-text').value;
        const algorithm = document.getElementById('extract-algorithm').value;
        const key       = document.getElementById('extract-key').value;

        if (!stegoText) return showError('Please provide stego text or upload a file.');
        if (!key)       return showError('Please enter the encryption key.');

        const btn = e.target.querySelector('button[type="submit"]');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .7s linear infinite"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Extracting…';
        btn.disabled = true;

        try {
            const res  = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stegoText, algorithm, key })
            });
            const data = await res.json();

            if (res.ok) {
                document.getElementById('extracted-output').value = data.secretMessage;
                const result = document.getElementById('extract-result');
                result.style.display = 'block';
                result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showError(data.error || 'Failed to extract message.');
            }
        } catch (err) {
            showError('Network error: ' + err.message);
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled  = false;
        }
    });

});
