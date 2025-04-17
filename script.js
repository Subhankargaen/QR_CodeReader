document.addEventListener('DOMContentLoaded', () => {
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        // Clear both localStorage and sessionStorage
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('userEmail');
        
        // Redirect to login page
        window.location.href = 'login.html';
    });

    // Dark mode functionality
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use system preference
    const currentTheme = localStorage.getItem('theme') || 
                        (prefersDarkScheme.matches ? 'dark' : 'light');
    
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    darkModeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        darkModeToggle.innerHTML = newTheme === 'dark' ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    });

    // QR Code Scanner functionality
    const fileInput = document.getElementById('file-input');
    const imagePreview = document.getElementById('image-preview');
    const uploadBtn = document.getElementById('upload-btn');
    const startCameraBtn = document.getElementById('start-camera');
    const stopCameraBtn = document.getElementById('stop-camera');
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const resultsDiv = document.getElementById('results');
    
    let stream = null;
    let scanning = false;

    const successSound = document.getElementById('success-sound');
    const ctx = canvas.getContext('2d');
    let isScanning = false;

    // Function to stop camera
    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            startCameraBtn.style.display = 'inline-block';
            stopCameraBtn.style.display = 'none';
            isScanning = false;
        }
    }

    // Function to play success sound
    function playSuccessSound() {
        if (successSound) {
            successSound.currentTime = 0;
            successSound.play().catch(error => {
                console.log('Error playing sound:', error);
                document.addEventListener('click', function playAfterInteraction() {
                    successSound.play().catch(console.error);
                    document.removeEventListener('click', playAfterInteraction);
                });
            });
        }
    }

    // Function to display the scanned result with confirmation
    function displayResult(data) {
        resultsDiv.innerHTML = '';
        
        const resultCard = document.createElement('div');
        resultCard.className = 'result-card';
        
        // Check if the data is a URL
        if (data.startsWith('http://') || data.startsWith('https://')) {
            const link = document.createElement('a');
            link.href = data;
            link.target = '_blank';
            link.textContent = data;
            link.className = 'result-link';
            resultCard.appendChild(link);
        } else {
            const text = document.createElement('p');
            text.textContent = data;
            resultCard.appendChild(text);
        }
        
        resultsDiv.appendChild(resultCard);
    }

    // Function to scan QR code
    function scanQRCode() {
        try {
            isScanning = true;
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                playSuccessSound(); // Play sound immediately when QR code is found
                stopCamera(); // Stop the camera
                displayResult(code.data);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error scanning QR code:', error);
            isScanning = false;
            return false;
        }
    }

    // Handle file selection
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Check if file is an image
            if (!file.type.startsWith('image/')) {
                showMessage('Please select an image file', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    imagePreview.innerHTML = '';
                    imagePreview.appendChild(img);
                    
                    // Add delete button
                    const deleteBtn = document.createElement('button');
                    deleteBtn.className = 'delete-btn';
                    deleteBtn.innerHTML = '<i class="fas fa-trash"></i> Delete Image';
                    deleteBtn.onclick = function() {
                        imagePreview.innerHTML = '';
                        fileInput.value = '';
                        resultsDiv.innerHTML = '';
                        showMessage('Image deleted successfully', 'success');
                    };
                    imagePreview.appendChild(deleteBtn);
                    
                    // Set canvas size to match image
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    // Draw image on canvas
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    
                    // Try to scan QR code immediately
                    try {
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const code = jsQR(imageData.data, imageData.width, imageData.height, {
                            inversionAttempts: "dontInvert",
                        });

                        if (code) {
                            // Play success sound
                            successSound.play();
                            
                            // Display result
                            displayResult(code.data);
                            
                            // Show success message
                            showMessage('QR Code scanned successfully!', 'success');
                        } else {
                            showMessage('No QR code found in the image', 'error');
                        }
                    } catch (error) {
                        showMessage('Error scanning QR code: ' + error.message, 'error');
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle scan button click
    uploadBtn.addEventListener('click', function() {
        const img = imagePreview.querySelector('img');
        if (!img) {
            showMessage('Please select an image first', 'error');
            return;
        }

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        // Try to scan QR code
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                // Play success sound
                successSound.play();
                
                // Display result
                displayResult(code.data);
                
                // Show success message
                showMessage('QR Code scanned successfully!', 'success');
            } else {
                showMessage('No QR code found in the image', 'error');
            }
        } catch (error) {
            showMessage('Error scanning QR code: ' + error.message, 'error');
        }
    });

    // Start camera
    startCameraBtn.addEventListener('click', async () => {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            video.srcObject = stream;
            video.play();
            startCameraBtn.style.display = 'none';
            stopCameraBtn.style.display = 'inline-block';
            isScanning = true;
            scanFromCamera();
        } catch (err) {
            console.error('Error accessing camera:', err);
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = `
                <div class="result-content">
                    <h3>Camera Error</h3>
                    <p>Unable to access camera. Please check permissions and try again.</p>
                </div>
            `;
        }
    });

    // Stop camera
    stopCameraBtn.addEventListener('click', () => {
        stopCamera();
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="result-content">
                <h3>Camera Stopped</h3>
                <p>Click "Start Camera" to begin scanning again.</p>
            </div>
        `;
    });

    // Scan QR code from camera
    function scanFromCamera() {
        if (!isScanning) return;

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            scanQRCode();
        }

        if (isScanning) {
            requestAnimationFrame(scanFromCamera);
        }
    }

    // Function to show messages
    function showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Remove any existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());
        
        // Add new message
        document.body.appendChild(messageDiv);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // Add styles for messages
    const style = document.createElement('style');
    style.textContent = `
        .message {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }
        
        .message.success {
            background-color: rgba(34, 197, 94, 0.9);
        }
        
        .message.error {
            background-color: rgba(239, 68, 68, 0.9);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        .result-card {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            box-shadow: var(--card-shadow);
        }
        
        .result-link {
            color: var(--primary-color);
            text-decoration: none;
            word-break: break-all;
        }
        
        .result-link:hover {
            text-decoration: underline;
        }
        
        .delete-btn {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background-color: rgba(239, 68, 68, 0.9);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background-color 0.3s ease;
        }
        
        .delete-btn:hover {
            background-color: rgba(220, 38, 38, 0.9);
        }
        
        .delete-btn i {
            font-size: 14px;
        }
        
        #image-preview {
            position: relative;
        }
    `;
    document.head.appendChild(style);
}); 