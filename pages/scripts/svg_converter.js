        const imageUpload = document.getElementById('imageUpload');
        const imageUrlInput = document.getElementById('imageUrlInput');
        const loadImageFromUrlBtn = document.getElementById('loadImageFromUrlBtn');
        const imageCanvas = document.getElementById('imageCanvas');
        const canvasContainer = document.getElementById('canvasContainer');
        const ctx = imageCanvas.getContext('2d');
        const convertBtn = document.getElementById('convertBtn');
        const messageBox = document.getElementById('messageBox');
        const downloadArea = document.getElementById('downloadArea');
        const downloadLink = document.getElementById('downloadLink');
        const svgCodePreviewArea = document.getElementById('svgCodePreviewArea');
        const svgCode = document.getElementById('svgCode');

        let originalImage = null;
        const MAX_DIMENSION = 200; 

        
        function resetUI() {
            hideMessage();
            convertBtn.disabled = true;
            canvasContainer.classList.add('hidden');
            downloadArea.classList.add('hidden');
            svgCodePreviewArea.classList.add('hidden');
            originalImage = null; 
        }

        
        function showMessage(message, isError = false) {
            messageBox.textContent = message;
            messageBox.classList.remove('hidden', 'message-box', 'error-message');
            messageBox.classList.add(isError ? 'error-message' : 'message-box');
            messageBox.style.display = 'block'; 
        }

        
        function hideMessage() {
            messageBox.classList.add('hidden');
        }

        
        function loadImage(src, fromUrl = false) {
            resetUI(); 

            showMessage('Loading image...');
            convertBtn.disabled = true;

            const img = new Image();

            if (fromUrl) {
                img.crossOrigin = 'Anonymous';
            }

            img.onload = () => {
                originalImage = img;
                drawResizedImageToCanvas(img);
                showMessage('Image loaded. Ready for conversion.');
                convertBtn.disabled = false;
            };
            img.onerror = () => {
                let errorMessage = 'Could not load image. Please try another file/URL.';
                if (fromUrl) {
                    errorMessage += ' (Possible CORS issue for external URLs)';
                }
                showMessage(errorMessage, true);
                convertBtn.disabled = true;
                originalImage = null;
            };
            img.src = src;
        }

        
        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) {
                resetUI();
                return;
            }

            if (!file.type.startsWith('image/')) {
                showMessage('Please upload a valid image file (e.g., JPG, PNG, GIF).', true);
                resetUI();
                return;
            }

          
            imageUrlInput.value = '';

            const reader = new FileReader();
            reader.onload = (e) => loadImage(e.target.result, false);
            reader.onerror = () => {
                showMessage('Error reading file. Please try again.', true);
                resetUI();
            };
            reader.readAsDataURL(file);
        });

        
        loadImageFromUrlBtn.addEventListener('click', () => {
            const imageUrl = imageUrlInput.value.trim();
            if (!imageUrl) {
                showMessage('Please enter an image URL.', true);
                resetUI();
                return;
            }

            
            imageUpload.value = '';

            loadImage(imageUrl, true);
        });

        
        function drawResizedImageToCanvas(img) {
            let width = img.width;
            let height = img.height;

            
            if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
                if (width > height) {
                    height = Math.round(height * (MAX_DIMENSION / width));
                    width = MAX_DIMENSION;
                } else {
                    width = Math.round(width * (MAX_DIMENSION / height));
                    height = MAX_DIMENSION;
                }
            }

            imageCanvas.width = width;
            imageCanvas.height = height;
            ctx.clearRect(0, 0, width, height); 
            ctx.drawImage(img, 0, 0, width, height);
            canvasContainer.classList.remove('hidden');
        }

       
        function getAverageColor(imageData, x, y, blockSize) {
            const data = imageData.data;
            let r = 0, g = 0, b = 0, count = 0;

            for (let i = 0; i < blockSize; i++) {
                for (let j = 0; j < blockSize; j++) {
                    const pixelX = x + j;
                    const pixelY = y + i;
                    if (pixelX < imageData.width && pixelY < imageData.height) {
                        const index = (pixelY * imageData.width + pixelX) * 4;
                        r += data[index];
                        g += data[index + 1];
                        b += data[index + 2];
                        count++;
                    }
                }
            }

            if (count === 0) return 'rgb(0,0,0)'; 
            return `rgb(${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)})`;
        }

        
        convertBtn.addEventListener('click', () => {
            if (!originalImage) {
                showMessage('No image loaded to convert.', true);
                return;
            }

            showMessage('Converting image to SVG...');
            convertBtn.disabled = true;
            downloadArea.classList.add('hidden');
            svgCodePreviewArea.classList.add('hidden');

            
            setTimeout(() => {
                try {
                    const imageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
                    const pixelSize = Math.max(1, Math.floor(Math.min(imageCanvas.width, imageCanvas.height) / 50)); 

                    let svgContent = '';
                    for (let y = 0; y < imageCanvas.height; y += pixelSize) {
                        for (let x = 0; x < imageCanvas.width; x += pixelSize) {
                            const color = getAverageColor(imageData, x, y, pixelSize);
                         
                            svgContent += `<rect x="${x}" y="${y}" width="${pixelSize}" height="${pixelSize}" fill="${color}" />`;
                        }
                    }

                    const svgString = `
                        <svg width="${imageCanvas.width}" height="${imageCanvas.height}" viewBox="0 0 ${imageCanvas.width} ${imageCanvas.height}" xmlns="http://www.w3.org/2000/svg">
                            <!-- Generated by Simple Image to SVG Converter -->
                            ${svgContent}
                        </svg>
                    `;

                    const blob = new Blob([svgString], { type: 'image/svg+xml' });
                    const url = URL.createObjectURL(blob);
                    downloadLink.href = url;
                    downloadArea.classList.remove('hidden');
                    svgCodePreviewArea.classList.remove('hidden');
                    svgCode.textContent = svgString; 

                    showMessage('Conversion complete! You can now download your SVG.', false);

                } catch (error) {
                    console.error('SVG conversion error:', error);
                    showMessage('Error during SVG conversion: ' + error.message, true);
                } finally {
                    convertBtn.disabled = false;
                }
            }, 100); 
        });

        window.addEventListener('beforeunload', () => {
            if (downloadLink.href && downloadLink.href.startsWith('blob:')) {
                URL.revokeObjectURL(downloadLink.href);
            }
        });