document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const fileInput = document.getElementById('file-input');
    const resultsDiv = document.getElementById('results');
    const successSound = document.getElementById('success-sound');
    const logoutBtn = document.getElementById('logout-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const zoomLevelDisplay = document.getElementById('zoom-level');
    const toggleFocusBtn = document.getElementById('toggle-focus');

    // Initialize variables
    let stream = null;
    let zoomLevel = 1;
    let isAutoFocus = true;
    let isScanning = false;
    let scanInterval = null;

    // Initialize ZXing barcode reader
    const codeReader = new ZXing.BrowserMultiFormatReader();

    // Initialize the scanner
    async function initializeScanner() {
        try {
            // Get available video devices
            const videoInputDevices = await codeReader.listVideoInputDevices();
            
            if (videoInputDevices.length > 0) {
                // Use the first available camera
                const deviceId = videoInputDevices[0].deviceId;
                await startScanning(deviceId);
            } else {
                showError('No camera devices found');
            }
        } catch (error) {
            showError('Error initializing scanner: ' + error.message);
        }
    }

    // Start scanning with the selected camera
    async function startScanning(deviceId) {
        try {
            stream = await codeReader.decodeFromVideoDevice(deviceId, video, (result, err) => {
                if (result) {
                    handleScanResult(result);
                }
                if (err && !(err instanceof ZXing.NotFoundException)) {
                    console.error('Scan error:', err);
                }
            });

            isScanning = true;
            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'block';
            
            // Set up camera constraints
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            // Enable zoom if supported
            if (capabilities.zoom) {
                track.applyConstraints({
                    advanced: [{ zoom: zoomLevel }]
                });
            }
            
            // Enable autofocus if supported
            if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                track.applyConstraints({
                    advanced: [{ focusMode: isAutoFocus ? 'continuous' : 'manual' }]
                });
            }
        } catch (error) {
            showError('Error starting camera: ' + error.message);
        }
    }

    // Stop scanning
    function stopScanning() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            stream = null;
        }
        
        if (scanInterval) {
            clearInterval(scanInterval);
            scanInterval = null;
        }
        
        isScanning = false;
        startCameraBtn.style.display = 'block';
        stopCameraBtn.style.display = 'none';
        video.srcObject = null;
    }

    // Handle scan results
    function handleScanResult(result) {
        // Play success sound
        successSound.currentTime = 0;
        successSound.play();
        
        // Display results
        const resultHTML = `
            <div class="scan-result">
                <div class="result-header">
                    <i class="fas fa-check-circle success-icon"></i>
                    <span class="result-type">${result.format}</span>
                </div>
                <div class="result-content">
                    <p class="result-text">${result.text}</p>
                    <div class="result-actions">
                        <button class="copy-btn" onclick="copyToClipboard('${result.text}')">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="search-btn" onclick="searchOnline('${result.text}')">
                            <i class="fas fa-search"></i> Search
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = resultHTML;
    }

    // Handle image upload
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const result = await codeReader.decodeFromImage(undefined, e.target.result);
                handleScanResult(result);
            } catch (error) {
                showError('Error decoding image: ' + error.message);
            }
        };
        reader.readAsDataURL(file);
    }

    // Zoom controls
    function updateZoom() {
        if (stream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.zoom) {
                track.applyConstraints({
                    advanced: [{ zoom: zoomLevel }]
                });
                zoomLevelDisplay.textContent = `${zoomLevel}x`;
            }
        }
    }

    // Focus controls
    function toggleFocus() {
        isAutoFocus = !isAutoFocus;
        if (stream) {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.focusMode) {
                track.applyConstraints({
                    advanced: [{ focusMode: isAutoFocus ? 'continuous' : 'manual' }]
                });
                toggleFocusBtn.classList.toggle('active', isAutoFocus);
            }
        }
    }

    // Utility functions
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showMessage('Copied to clipboard!', 'success');
        }).catch(err => {
            showError('Failed to copy: ' + err.message);
        });
    }

    function searchOnline(text) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, '_blank');
    }

    function showMessage(message, type = 'success') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    function showError(message) {
        showMessage(message, 'error');
    }

    // Event listeners
    startCameraBtn.addEventListener('click', initializeScanner);
    stopCameraBtn.addEventListener('click', stopScanning);

    zoomInBtn.addEventListener('click', () => {
        if (zoomLevel < 3) {
            zoomLevel += 0.5;
            updateZoom();
        }
    });

    zoomOutBtn.addEventListener('click', () => {
        if (zoomLevel > 1) {
            zoomLevel -= 0.5;
            updateZoom();
        }
    });

    toggleFocusBtn.addEventListener('click', toggleFocus);
    fileInput.addEventListener('change', handleImageUpload);

    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('isLoggedIn');
        window.location.href = 'login.html';
    });

    // Dark mode toggle
    darkModeToggle.addEventListener('click', function() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('theme', isDark ? 'light' : 'dark');
        darkModeToggle.innerHTML = isDark ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    });

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    darkModeToggle.innerHTML = savedTheme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        stopScanning();
    });
});
