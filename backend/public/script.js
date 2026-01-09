document.querySelectorAll('.nav-tab').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        document.querySelectorAll('.tab-panel').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        clearResults();
    });
});

function clearResults() {
    document.getElementById('hide-result').style.display = 'none';
    document.getElementById('extract-result').style.display = 'none';
    document.getElementById('hide-error').style.display = 'none';
    document.getElementById('extract-error').style.display = 'none';
}

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('stego-file');

if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('stego-input').value = event.target.result;
                uploadZone.classList.add('file-loaded');
            };
            reader.readAsText(file, 'UTF-8');
        }
    });

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
}

let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
    const root = document.documentElement;
    if (theme === 'light') {
        root.style.setProperty('--bg-primary', '#f7fafc');
        root.style.setProperty('--bg-secondary', '#edf2f7');
        root.style.setProperty('--bg-tertiary', '#e2e8f0');
        root.style.setProperty('--bg-hover', '#cbd5e0');
        root.style.setProperty('--border-color', '#cbd5e0');
        root.style.setProperty('--text-primary', '#1a202c');
        root.style.setProperty('--text-secondary', '#2d3748');
        root.style.setProperty('--text-tertiary', '#4a5568');
        root.style.setProperty('--crypto-blue', '#2b6cb0');
        root.style.setProperty('--steganography-teal', '#319795');
        root.style.setProperty('--security-purple', '#553c9a');
    } else {
        root.style.setProperty('--bg-primary', '#0a0e1a');
        root.style.setProperty('--bg-secondary', '#151b2d');
        root.style.setProperty('--bg-tertiary', '#1e2640');
        root.style.setProperty('--bg-hover', '#252d47');
        root.style.setProperty('--border-color', '#2d3748');
        root.style.setProperty('--text-primary', '#e2e8f0');
        root.style.setProperty('--text-secondary', '#a0aec0');
        root.style.setProperty('--text-tertiary', '#718096');
        root.style.setProperty('--crypto-blue', '#4299e1');
        root.style.setProperty('--steganography-teal', '#319795');
        root.style.setProperty('--security-purple', '#553c9a');
    }
}

const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', currentTheme);
        applyTheme(currentTheme);
        
        const icon = themeToggle.querySelector('svg path');
        if (icon) {
            if (currentTheme === 'light') {
                icon.setAttribute('d', 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z');
            } else {
                icon.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
            }
        }
    });
}

applyTheme(currentTheme);

function checkPasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Special character');
    
    const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
    const color = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981'][score];
    
    return { score, strength, color, feedback };
}

function updatePasswordStrength(inputId, strengthId) {
    const input = document.getElementById(inputId);
    const strengthDiv = document.getElementById(strengthId);
    
    if (!input || !strengthDiv) return;
    
    input.addEventListener('input', () => {
        const password = input.value;
        if (!password) {
            strengthDiv.style.display = 'none';
            return;
        }
        
        const result = checkPasswordStrength(password);
        strengthDiv.style.display = 'block';
        strengthDiv.innerHTML = `
            <div class="strength-bar">
                <div class="strength-fill" style="width: ${result.score * 20}%; background: ${result.color}"></div>
            </div>
            <div class="strength-text" style="color: ${result.color}">${result.strength}</div>
            ${result.feedback.length > 0 ? `<div class="strength-feedback">Missing: ${result.feedback.join(', ')}</div>` : ''}
        `;
    });
}

let analytics = {
    hideOperations: 0,
    extractOperations: 0,
    totalCharactersHidden: 0,
    totalCharactersExtracted: 0,
    averageProcessingTime: 0,
    operationHistory: []
};

function trackOperation(type, data) {
    const timestamp = new Date().toISOString();
    const operation = { type, timestamp, ...data };
    
    analytics.operationHistory.push(operation);
    if (analytics.operationHistory.length > 100) {
        analytics.operationHistory.shift();
    }
    
    if (type === 'hide') {
        analytics.hideOperations++;
        analytics.totalCharactersHidden += data.messageLength || 0;
    } else if (type === 'extract') {
        analytics.extractOperations++;
        analytics.totalCharactersExtracted += data.messageLength || 0;
    }
    
    localStorage.setItem('invisicrypt_analytics', JSON.stringify(analytics));
    updateAnalyticsDisplay();
}

function updateAnalyticsDisplay() {
    const statsDiv = document.getElementById('analytics-stats');
    if (statsDiv) {
        statsDiv.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${analytics.hideOperations}</span>
                <span class="stat-label">Messages Hidden</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${analytics.extractOperations}</span>
                <span class="stat-label">Messages Extracted</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${analytics.totalCharactersHidden}</span>
                <span class="stat-label">Characters Hidden</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${analytics.operationHistory.length}</span>
                <span class="stat-label">Total Operations</span>
            </div>
        `;
    }
    
    const historyDiv = document.getElementById('operation-list');
    if (historyDiv) {
        if (analytics.operationHistory.length === 0) {
            historyDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-tertiary);">No operations yet</div>';
        } else {
            historyDiv.innerHTML = analytics.operationHistory
                .slice(-10)
                .reverse()
                .map(op => `
                    <div class="history-item">
                        <span>${op.type}</span>
                        <span>${op.algorithm || 'N/A'}</span>
                        <span>${op.messageLength || 0} chars</span>
                        <span>${op.processingTime || 0}ms</span>
                        <span>${new Date(op.timestamp).toLocaleString()}</span>
                    </div>
                `).join('');
        }
    }
}

const savedAnalytics = localStorage.getItem('invisicrypt_analytics');
if (savedAnalytics) {
    analytics = { ...analytics, ...JSON.parse(savedAnalytics) };
}

function analyzeText(text) {
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgCharsPerWord = words.length > 0 ? text.replace(/\s/g, '').length / words.length : 0;
    
    const embeddingCapacity = Math.floor(text.length * 0.1);
    
    return {
        characters: text.length,
        words: words.length,
        sentences: sentences.length,
        avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
        avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
        embeddingCapacity
    };
}

function showTextAnalysis(text, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !text) {
        if (container) container.style.display = 'none';
        return;
    }
    
    const analysis = analyzeText(text);
    container.style.display = 'block';
    container.innerHTML = `
        <div class="capacity-info">
            <span class="capacity-value">${analysis.embeddingCapacity}</span>
            <span class="capacity-label">characters can be hidden</span>
        </div>
    `;
}

const hideBtn = document.getElementById('hide-btn');
if (hideBtn) {
    hideBtn.addEventListener('click', async () => {
        const startTime = Date.now();
        const coverText = document.getElementById('cover-text').value;
        const secretMessage = document.getElementById('secret-message').value;
        const algorithm = document.getElementById('algorithm').value;
        const key = document.getElementById('key').value;
        
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
        
        const analysis = analyzeText(coverText);
        if (secretMessage.length > analysis.embeddingCapacity) {
            showError('hide-error', `Message too long! Maximum ${analysis.embeddingCapacity} characters allowed for this cover text.`);
            return;
        }
        
        document.getElementById('hide-error').style.display = 'none';
        const originalText = hideBtn.textContent;
        hideBtn.textContent = 'Hiding...';
        hideBtn.disabled = true;
        
        try {
            const response = await fetch('/api/hide', {
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
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response. Make sure the server is running. Response: ${text.substring(0, 100)}`);
            }
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.details || 'Failed to hide message');
            }
            
            const processingTime = Date.now() - startTime;
            
            trackOperation('hide', {
                messageLength: secretMessage.length,
                coverTextLength: coverText.length,
                algorithm: algorithm,
                processingTime: processingTime
            });
            
            document.getElementById('stego-output').value = data.stego_text;
            document.getElementById('hide-result').style.display = 'block';
            
        } catch (error) {
            showError('hide-error', error.message);
        } finally {
            hideBtn.textContent = originalText;
            hideBtn.disabled = false;
        }
    });
}

const extractBtn = document.getElementById('extract-btn');
if (extractBtn) {
    extractBtn.addEventListener('click', async () => {
        const startTime = Date.now();
        const stegoText = document.getElementById('stego-input').value;
        const algorithm = document.getElementById('extract-algorithm').value;
        const key = document.getElementById('extract-key').value;
        
        if (!stegoText.trim()) {
            showError('extract-error', 'Stego text is required');
            return;
        }
        if (!key.trim()) {
            showError('extract-error', 'Encryption key is required');
            return;
        }
        
        document.getElementById('extract-error').style.display = 'none';
        const originalText = extractBtn.textContent;
        extractBtn.textContent = 'Extracting...';
        extractBtn.disabled = true;
        
        try {
            const response = await fetch('/api/extract', {
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
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Server returned non-JSON response. Make sure the server is running. Response: ${text.substring(0, 100)}`);
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
            
            const processingTime = Date.now() - startTime;
            
            trackOperation('extract', {
                messageLength: data.secret_message.length,
                stegoTextLength: stegoText.length,
                algorithm: algorithm,
                processingTime: processingTime
            });
            
            document.getElementById('secret-output').value = data.secret_message;
            document.getElementById('extract-result').style.display = 'block';
            
        } catch (error) {
            showError('extract-error', error.message);
        } finally {
            extractBtn.textContent = originalText;
            extractBtn.disabled = false;
        }
    });
}

const downloadStego = document.getElementById('download-stego');
if (downloadStego) {
    downloadStego.addEventListener('click', () => {
        const content = document.getElementById('stego-output').value;
        downloadFile(content, 'stego.txt');
    });
}

const downloadSecret = document.getElementById('download-secret');
if (downloadSecret) {
    downloadSecret.addEventListener('click', () => {
        const content = document.getElementById('secret-output').value;
        downloadFile(content, 'secret.txt');
    });
}

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
    if (errorBox) {
        errorBox.innerHTML = `<strong>Error:</strong> ${message.replace(/\n/g, '<br>')}`;
        errorBox.style.display = 'block';
        errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

async function generateCoverText() {
    const templates = [
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
        "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet at least once. It is commonly used for testing fonts and keyboards.",
        "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole, filled with the ends of worms and an oozy smell, nor yet a dry, bare, sandy hole with nothing in it to sit down on or to eat.",
        "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity.",
        "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles."
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    const coverTextElement = document.getElementById('cover-text');
    if (coverTextElement) {
        coverTextElement.value = randomTemplate;
        showTextAnalysis(randomTemplate, 'cover-analysis');
    }
}

function exportData(format) {
    const data = {
        timestamp: new Date().toISOString(),
        analytics: analytics,
        version: '1.0.0'
    };
    
    let content, filename, mimeType;
    
    switch (format) {
        case 'json':
            content = JSON.stringify(data, null, 2);
            filename = 'invisicrypt-data.json';
            mimeType = 'application/json';
            break;
        case 'csv':
            const csvRows = [
                ['Timestamp', 'Type', 'Algorithm', 'Message Length', 'Processing Time'],
                ...analytics.operationHistory.map(op => [
                    op.timestamp,
                    op.type,
                    op.algorithm || '',
                    op.messageLength || '',
                    op.processingTime || ''
                ])
            ];
            content = csvRows.map(row => row.join(',')).join('\n');
            filename = 'invisicrypt-history.csv';
            mimeType = 'text/csv';
            break;
        default:
            return;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
    updatePasswordStrength('key', 'key-strength');
    updatePasswordStrength('extract-key', 'extract-key-strength');
    
    const coverTextElement = document.getElementById('cover-text');
    if (coverTextElement) {
        coverTextElement.addEventListener('input', (e) => {
            showTextAnalysis(e.target.value, 'cover-analysis');
        });
    }
    
    const secretMessageElement = document.getElementById('secret-message');
    const charCountElement = document.getElementById('secret-char-count');
    
    if (secretMessageElement && charCountElement) {
        secretMessageElement.addEventListener('input', (e) => {
            const length = e.target.value.length;
            charCountElement.textContent = `${length} character${length !== 1 ? 's' : ''}`;
            
            const container = document.getElementById('secret-analysis');
            if (container) {
                container.style.display = 'none';
            }
        });
    }
    
    updateAnalyticsDisplay();
    
    const generateCoverBtn = document.getElementById('generate-cover');
    if (generateCoverBtn) {
        generateCoverBtn.addEventListener('click', generateCoverText);
    }
    
    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => exportData('json'));
    }
    
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportData('csv'));
    }
    
    const clearHistoryBtn = document.getElementById('clear-history');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all analytics data?')) {
                analytics = {
                    hideOperations: 0,
                    extractOperations: 0,
                    totalCharactersHidden: 0,
                    totalCharactersExtracted: 0,
                    averageProcessingTime: 0,
                    operationHistory: []
                };
                localStorage.removeItem('invisicrypt_analytics');
                updateAnalyticsDisplay();
            }
        });
    }
});