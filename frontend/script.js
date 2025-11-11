// Tab switching
document.querySelectorAll('.nav-tab').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-panel').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Clear previous results
        clearResults();
    });
});

function clearResults() {
    // Hide results
    document.getElementById('hide-result').style.display = 'none';
    document.getElementById('extract-result').style.display = 'none';
    document.getElementById('hide-error').style.display = 'none';
    document.getElementById('extract-error').style.display = 'none';
}

// File upload for stego text
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('stego-file');

// Click to upload
uploadZone.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('stego-input').value = event.target.result;
            uploadZone.classList.add('file-loaded');
        };
        // Read as UTF-8 to preserve zero-width characters
        reader.readAsText(file, 'UTF-8');
    }
});

// Drag and drop
uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
            document.getElementById('stego-input').value = event.target.result;
            uploadZone.classList.add('file-loaded');
        };
        reader.readAsText(file, 'UTF-8');
    }
});

// Hide message
document.getElementById('hide-btn').addEventListener('click', async () => {
    const coverText = document.getElementById('cover-text').value;
    const secretMessage = document.getElementById('secret-message').value;
    const algorithm = document.getElementById('algorithm').value;
    const key = document.getElementById('key').value;
    
    // Validation
    if (!coverText.trim()) {
        showError('hide-error', 'Cover text is required');
        return;
    }
    if (!secretMessage.trim()) {
        showError('hide-error', 'Secret message is required');
        return;
    }
    if (!key.trim()) {
        showError('hide-error', 'Encryption key is required');
        return;
    }
    
    // Hide error and show loading
    document.getElementById('hide-error').style.display = 'none';
    const btn = document.getElementById('hide-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Hiding...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:5000/api/hide', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                cover_text: coverText,
                secret_message: secretMessage,
                algorithm: algorithm,
                key: key
            })
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response. Make sure the server is running on port 5000. Response: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.details || 'Failed to hide message');
        }
        
        // Show result
        document.getElementById('stego-output').value = data.stego_text;
        document.getElementById('hide-result').style.display = 'block';
        
    } catch (error) {
        showError('hide-error', error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Extract message
document.getElementById('extract-btn').addEventListener('click', async () => {
    const stegoText = document.getElementById('stego-input').value;
    const algorithm = document.getElementById('extract-algorithm').value;
    const key = document.getElementById('extract-key').value;
    
    // Validation
    if (!stegoText.trim()) {
        showError('extract-error', 'Stego text is required');
        return;
    }
    if (!key.trim()) {
        showError('extract-error', 'Encryption key is required');
        return;
    }
    
    // Hide error and show loading
    document.getElementById('extract-error').style.display = 'none';
    const btn = document.getElementById('extract-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Extracting...';
    btn.disabled = true;
    
    try {
        const response = await fetch('http://localhost:5000/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stego_text: stegoText,
                algorithm: algorithm,
                key: key
            })
        });
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Server returned non-JSON response. Make sure the server is running on port 5000. Response: ${text.substring(0, 100)}`);
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            let errorMsg = data.error || 'Failed to extract message';
            if (data.details) {
                errorMsg += ': ' + data.details;
            }
            if (data.debug && data.debug.stderr) {
                errorMsg += '\n\nError details: ' + data.debug.stderr;
            }
            throw new Error(errorMsg);
        }
        
        if (!data.secret_message) {
            throw new Error('No message extracted. Please verify the stego text, algorithm, and key are correct.');
        }
        
        // Show result
        document.getElementById('secret-output').value = data.secret_message;
        document.getElementById('extract-result').style.display = 'block';
        
    } catch (error) {
        showError('extract-error', error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Download functions
document.getElementById('download-stego').addEventListener('click', () => {
    const content = document.getElementById('stego-output').value;
    downloadFile(content, 'stego.txt');
});

document.getElementById('download-secret').addEventListener('click', () => {
    const content = document.getElementById('secret-output').value;
    downloadFile(content, 'secret.txt');
});

function downloadFile(content, filename) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showError(elementId, message) {
    const errorBox = document.getElementById(elementId);
    errorBox.innerHTML = `<strong>Error:</strong> ${message.replace(/\n/g, '<br>')}`;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Theme toggle (placeholder - can be enhanced)
document.getElementById('theme-toggle')?.addEventListener('click', () => {
    // Theme toggle functionality can be added here
    console.log('Theme toggle clicked');
});

