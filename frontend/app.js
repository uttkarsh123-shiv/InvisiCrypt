// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Clear results
        hideError();
        clearResults();
    });
});

// Character counters
const coverText = document.getElementById('coverText');
const secretText = document.getElementById('secretText');
const coverCount = document.getElementById('coverCount');
const secretCount = document.getElementById('secretCount');

coverText.addEventListener('input', () => {
    coverCount.textContent = coverText.value.length;
    if (coverText.value.length > 5000) {
        coverCount.style.color = '#e74c3c';
    } else {
        coverCount.style.color = '#999';
    }
});

secretText.addEventListener('input', () => {
    secretCount.textContent = secretText.value.length;
    if (secretText.value.length > 500) {
        secretCount.style.color = '#e74c3c';
    } else {
        secretCount.style.color = '#999';
    }
});

// Hide message
document.getElementById('hideBtn').addEventListener('click', async () => {
    const coverTextValue = coverText.value.trim();
    const secretTextValue = secretText.value.trim();
    const algo = document.getElementById('algo').value;
    const key = document.getElementById('key').value.trim();

    // Validation
    if (!coverTextValue) {
        showError('Cover text is required');
        return;
    }
    if (!secretTextValue) {
        showError('Secret message is required');
        return;
    }
    if (!key) {
        showError('Encryption key is required');
        return;
    }
    if (coverTextValue.length > 5000) {
        showError('Cover text must be 5000 characters or less');
        return;
    }
    if (secretTextValue.length > 500) {
        showError('Secret message must be 500 characters or less');
        return;
    }

    hideError();
    showLoading();

    try {
        const response = await fetch('/stego', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mode: 'hide',
                coverText: coverTextValue,
                secretText: secretTextValue,
                algo: algo,
                key: key
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to hide message');
        }

        // Show result
        document.getElementById('stegoOutput').value = data.result;
        document.getElementById('hideResult').style.display = 'block';
        document.getElementById('hideResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Extract message
document.getElementById('extractBtn').addEventListener('click', async () => {
    const stegoTextValue = document.getElementById('stegoText').value.trim();
    const algo = document.getElementById('extractAlgo').value;
    const key = document.getElementById('extractKey').value.trim();

    // Validation
    if (!stegoTextValue) {
        showError('Stego text is required');
        return;
    }
    if (!key) {
        showError('Encryption key is required');
        return;
    }

    hideError();
    showLoading();

    try {
        const response = await fetch('/stego', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mode: 'extract',
                stegoText: stegoTextValue,
                algo: algo,
                key: key
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to extract message');
        }

        // Show result
        document.getElementById('secretOutput').value = data.result;
        document.getElementById('extractResult').style.display = 'block';
        document.getElementById('extractResult').scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
});

// Copy to clipboard functions
document.getElementById('copyStegoBtn').addEventListener('click', () => {
    const stegoOutput = document.getElementById('stegoOutput');
    stegoOutput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyStegoBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = '#27ae60';
    btn.style.color = 'white';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
});

document.getElementById('copySecretBtn').addEventListener('click', () => {
    const secretOutput = document.getElementById('secretOutput');
    secretOutput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copySecretBtn');
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.style.background = '#27ae60';
    btn.style.color = 'white';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 2000);
});

// Utility functions
function showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    document.getElementById('errorBox').style.display = 'none';
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function clearResults() {
    document.getElementById('hideResult').style.display = 'none';
    document.getElementById('extractResult').style.display = 'none';
    document.getElementById('stegoOutput').value = '';
    document.getElementById('secretOutput').value = '';
}

