// Utility Functions (must be global for onclick handlers)
function copyToClipboard(elementId) {
    const textarea = document.getElementById(elementId);
    textarea.select();
    navigator.clipboard.writeText(textarea.value).then(() => {
        // Visual feedback
        const btn = window.event.target.closest('button');
        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Copied!</span>';
        setTimeout(() => {
            btn.innerHTML = originalHTML;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
}

function downloadText(elementId, filename) {
    const text = document.getElementById(elementId).value;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function showError(message) {
    const errorBox = document.getElementById('error-box');
    errorBox.textContent = message;
    errorBox.style.display = 'block';
    errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideError() {
    const errorBox = document.getElementById('error-box');
    if (errorBox) {
        errorBox.style.display = 'none';
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {

    // View Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const viewName = btn.dataset.view;
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding view
            document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
            document.getElementById(`${viewName}-view`).classList.add('active');
            
            // Hide error box when switching views
            hideError();
        });
    });

    // File Upload Handlers
    document.getElementById('cover-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('cover-text').value = event.target.result;
                updateCharacterCounts();
            };
            reader.readAsText(file);
        }
    });

    document.getElementById('stego-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('stego-text').value = event.target.result;
            };
            reader.readAsText(file);
        }
    });

    // Character count and capacity calculation
    function updateCharacterCounts() {
        const coverText = document.getElementById('cover-text').value;
        const secretMessage = document.getElementById('secret-message').value;
        
        const coverLength = coverText.length;
        const secretLength = secretMessage.length;
        
        // Calculate max capacity
        // Conservative estimate: roughly (coverLength - 1) / 2 characters can be hidden
        const maxCapacity = Math.floor((coverLength - 1) / 2);
        
        // Update cover text capacity display
        document.getElementById('max-capacity').textContent = maxCapacity > 0 ? maxCapacity : 0;
        
        // Update secret message character count
        document.getElementById('secret-char-count').textContent = secretLength;
        
        // Update capacity status
        const statusElement = document.getElementById('capacity-status');
        if (coverLength === 0 || secretLength === 0) {
            statusElement.textContent = '';
            statusElement.className = 'hint';
        } else if (secretLength > maxCapacity) {
            const excess = secretLength - maxCapacity;
            statusElement.textContent = '⚠️ Too long! Reduce by ' + excess + ' character' + (excess > 1 ? 's' : '');
            statusElement.className = 'hint error-text';
        } else {
            const remaining = maxCapacity - secretLength;
            statusElement.textContent = '✓ ' + remaining + ' character' + (remaining !== 1 ? 's' : '') + ' remaining';
            statusElement.className = 'hint success-text';
        }
    }

    // Add event listeners for real-time updates
    document.getElementById('cover-text').addEventListener('input', updateCharacterCounts);
    document.getElementById('secret-message').addEventListener('input', updateCharacterCounts);

    // Initialize counts
    updateCharacterCounts();

    // Hide Message Form
    document.getElementById('hide-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Hide form submitted');
        hideError();
        
        const coverText = document.getElementById('cover-text').value;
        const secretMessage = document.getElementById('secret-message').value;
        const algorithm = document.getElementById('hide-algorithm').value;
        const key = document.getElementById('hide-key').value;
        
        console.log('Form data:', { coverText, secretMessage, algorithm, key });
        
        if (!coverText) {
            showError('Please provide cover text or upload a file');
            return;
        }
        
        if (!secretMessage) {
            showError('Please provide secret message');
            return;
        }
        
        if (!key) {
            showError('Please provide encryption key');
            return;
        }
        
        const formData = {
            coverText: coverText,
            secretMessage: secretMessage,
            algorithm: algorithm,
            key: key
        };
        
        console.log('Sending request to /api/hide');
        
        try {
            const response = await fetch('/api/hide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            console.log('Response status:', response.status);
            const data = await response.json();
            // console.log('Response data:', data);
            
            if (response.ok) {
                document.getElementById('stego-output').value = data.stegoText;
                document.getElementById('hide-result').style.display = 'block';
                document.getElementById('hide-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                showError(data.error || 'Failed to hide message');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error: ' + error.message);
        }
    });

    // Extract Message Form
    document.getElementById('extract-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        hideError();
        
        const formData = {
            stegoText: document.getElementById('stego-text').value,
            algorithm: document.getElementById('extract-algorithm').value,
            key: document.getElementById('extract-key').value
        };
        
        if (!formData.stegoText) {
            showError('Please provide stego text or upload a file');
            return;
        }
        
        try {
            const response = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                document.getElementById('extracted-output').value = data.secretMessage;
                document.getElementById('extract-result').style.display = 'block';
            } else {
                showError(data.error || 'Failed to extract message');
            }
        } catch (error) {
            showError('Network error: ' + error.message);
        }
    });

}); // End of DOMContentLoaded
