// Tamil AI Song Generator - Complete Script
// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8000' 
    : 'https://your-railway-app.railway.app'; // Replace with your Railway URL

// Global State Management
class TamilSongGenerator {
    constructor() {
        this.selectedModel = 'musicgen';
        this.selectedInstruments = ['tabla', 'veena', 'flute', 'keyboard'];
        this.isGenerating = false;
        this.currentSongId = null;
        this.sampleIndex = 0;
        
        // Sample kavithai collection
        this.sampleKavithai = [
            {
                title: "Morning Peace",
                text: `காலை வேளையில் சூரியன் உதிக்கும்
கனவுகள் நனவாகும் நேரம்
பறவைகள் பாடும் இசையில்
புதிய நாள் ஆரம்பமாகும்

தென்றல் காற்று வீசும் போது
மனதில் அமைதி நிறைகிறது
இயற்கையின் அழகு கண்டு
உள்ளம் மகிழ்ச்சி அடைகிறது`
            },
            {
                title: "Tamil Beauty",
                text: `தமிழ் மொழியின் இனிமை
தென்றல் காற்றின் குளுமை
இசையில் கலந்து வரும்
நம் மனதில் அமைதி

செம்மொழியின் பெருமை
சங்க காலம் தொட்டு
இன்றும் நம்மோடு வாழும்
தமிழின் புகழ் மாளாது`
            },
            {
                title: "Divine Love",
                text: `அன்பே சிவம் என்ற வாக்கில்
அழகான உலகம் படைக்கும்
தமிழ் இசையின் மகிமையில்
தெய்வீக அனுபவம் பெறுவோம்

பக்தியின் வழியில் நடந்து
பரம்பொருளை அடைவோம்
இசையே இறைவனின் கொடை
அதில் மனம் ஆழ்ந்திடுவோம்`
            }
        ];

        this.progressMessages = [
            "Processing your beautiful kavithai...",
            "Analyzing Tamil phonetics and rhythm...",
            "Selecting appropriate raga and instruments...",
            "Generating base music with AI...",
            "Adding traditional Tamil instruments...",
            "Enhancing with vocals and harmonies...",
            "Applying final touches and mastering...",
            "Your Tamil song is almost ready!"
        ];

        this.init();
    }

    // Initialize the application
    init() {
        this.bindEvents();
        this.setupModelSelection();
        this.setupInstrumentSelection();
        this.setupFormValidation();
        this.setupResponsiveFeatures();
        this.checkAPIHealth();
    }

    // Bind all event listeners
    bindEvents() {
        // Form submission
        const songForm = document.getElementById('songForm');
        if (songForm) {
            songForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generateSong();
            });
        }

        // Sample button
        const sampleBtn = document.getElementById('sampleBtn');
        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => this.loadRandomSample());
        }

        // Textarea auto-resize
        const kavithaiTextarea = document.getElementById('kavithai');
        if (kavithaiTextarea) {
            kavithaiTextarea.addEventListener('input', this.autoResizeTextarea);
            kavithaiTextarea.addEventListener('paste', () => {
                setTimeout(() => this.autoResizeTextarea.call(kavithaiTextarea), 10);
            });
        }

        // Download buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'downloadWav') {
                this.downloadSong('wav');
            } else if (e.target.id === 'downloadMp3') {
                this.downloadSong('mp3');
            } else if (e.target.id === 'shareBtn') {
                this.shareSong();
            }
        });

        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleResize();
        }, 250));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.code) {
                    case 'Enter':
                        if (!this.isGenerating) {
                            e.preventDefault();
                            this.generateSong();
                        }
                        break;
                    case 'KeyS':
                        e.preventDefault();
                        this.loadRandomSample();
                        break;
                }
            }
        });
    }

    // Setup model selection functionality
    setupModelSelection() {
        const modelCards = document.querySelectorAll('.model-card');
        modelCards.forEach(card => {
            card.addEventListener('click', () => {
                // Remove active class from all cards
                modelCards.forEach(c => c.classList.remove('active'));
                
                // Add active class to clicked card
                card.classList.add('active');
                
                // Update selected model
                this.selectedModel = card.dataset.model;
                
                // Visual feedback
                this.showToast(`Selected model: ${card.querySelector('h3').textContent}`, 'success');
            });
        });
    }

    // Setup instrument selection functionality
    setupInstrumentSelection() {
        const instrumentCards = document.querySelectorAll('.instrument-card');
        instrumentCards.forEach(card => {
            card.addEventListener('click', () => {
                const instrument = card.dataset.instrument;
                
                if (card.classList.contains('active')) {
                    // Deselect instrument
                    card.classList.remove('active');
                    this.selectedInstruments = this.selectedInstruments.filter(i => i !== instrument);
                } else {
                    // Select instrument
                    card.classList.add('active');
                    this.selectedInstruments.push(instrument);
                }
                
                // Update UI feedback
                this.updateInstrumentFeedback();
            });
        });
    }

    // Update instrument selection feedback
    updateInstrumentFeedback() {
        const count = this.selectedInstruments.length;
        const instrumentLabel = document.querySelector('label[for="instruments"]') || 
                               document.querySelector('label:contains("Traditional Instruments")');
        
        if (instrumentLabel) {
            const originalText = instrumentLabel.textContent.split(' (')[0];
            instrumentLabel.innerHTML = `<i class="fas fa-drum"></i> Traditional Instruments (${count} selected)`;
        }
    }

    // Setup form validation
    setupFormValidation() {
        const form = document.getElementById('songForm');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    // Validate individual form field
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        switch (field.id) {
            case 'kavithai':
                if (!value) {
                    isValid = false;
                    errorMessage = 'Please enter your kavithai (Tamil poetry)';
                } else if (value.length < 10) {
                    isValid = false;
                    errorMessage = 'Kavithai should be at least 10 characters long';
                }
                break;
            case 'duration':
                const duration = parseInt(value);
                if (duration > 300) {
                    isValid = false;
                    errorMessage = 'Maximum duration is 5 minutes';
                }
                break;
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        } else {
            this.clearFieldError(field);
        }

        return isValid;
    }

    // Show field error
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        field.classList.add('error');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
    }

    // Setup responsive features
    setupResponsiveFeatures() {
        // Mobile-specific enhancements
        if (this.isMobile()) {
            document.body.classList.add('mobile');
            
            // Optimize textarea for mobile
            const textarea = document.getElementById('kavithai');
            if (textarea) {
                textarea.style.fontSize = '16px'; // Prevent zoom on iOS
            }
        }
    }

    // Check API health
    async checkAPIHealth() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                console.log('✅ API is healthy');
                this.showToast('Connected to Tamil AI Song Generator', 'success');
            } else {
                throw new Error('API health check failed');
            }
        } catch (error) {
            console.warn('⚠️ API connection issue:', error);
            this.showToast('Working in demo mode - API unavailable', 'warning');
        }
    }

    // Main song generation function
    async generateSong() {
        if (this.isGenerating) return;

        // Validate form
        if (!this.validateForm()) return;

        // Collect form data
        const formData = this.collectFormData();
        
        // Start generation process
        await this.startGeneration(formData);
    }

    // Validate entire form
    validateForm() {
        const kavithai = document.getElementById('kavithai').value.trim();
        
        if (!kavithai) {
            this.showToast('Please enter your kavithai (Tamil poetry)', 'error');
            document.getElementById('kavithai').focus();
            return false;
        }

        if (this.selectedInstruments.length === 0) {
            this.showToast('Please select at least one instrument', 'error');
            return false;
        }

        return true;
    }

    // Collect form data
    collectFormData() {
        return {
            kavithai: document.getElementById('kavithai').value.trim(),
            genre: document.getElementById('genre').value,
            mood: document.getElementById('mood').value,
            voice: document.getElementById('voice').value,
            duration: parseInt(document.getElementById('duration').value),
            model: this.selectedModel,
            instruments: [...this.selectedInstruments]
        };
    }

    // Start generation process
    async startGeneration(formData) {
        this.isGenerating = true;
        
        // Update UI
        this.showGenerationUI();
        this.showLoadingModal();
        
        try {
            // Start progress animation
            this.startProgressAnimation();
            
            // Make API call
            const result = await this.callGenerationAPI(formData);
            
            // Handle success
            await this.handleGenerationSuccess(result, formData);
            
        } catch (error) {
            // Handle error
            this.handleGenerationError(error);
        } finally {
            // Cleanup
            this.isGenerating = false;
            this.hideGenerationUI();
            this.hideLoadingModal();
        }
    }

    // Show generation UI state
    showGenerationUI() {
        const generateBtn = document.getElementById('generateBtn');
        const progressContainer = document.getElementById('progressContainer');
        
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.classList.add('loading');
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Generating...</span>';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
    }

    // Hide generation UI state
    hideGenerationUI() {
        const generateBtn = document.getElementById('generateBtn');
        const progressContainer = document.getElementById('progressContainer');
        
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
            generateBtn.innerHTML = '<i class="fas fa-magic"></i> <span>Generate Tamil Song</span>';
        }
        
        if (progressContainer) {
            progressContainer.style.display = 'none';
            document.getElementById('progressFill').style.width = '0%';
        }
    }

    // Start progress animation
    startProgressAnimation() {
        let progress = 0;
        let messageIndex = 0;
        
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const loadingText = document.getElementById('loadingText');
        
        this.progressInterval = setInterval(() => {
            progress += Math.random() * 12 + 3; // Random progress increment
            
            if (progress > 95) progress = 95; // Cap at 95% until completion
            
            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
            
            // Update progress message
            if (messageIndex < this.progressMessages.length - 1 && progress > (messageIndex + 1) * 12) {
                messageIndex++;
                const message = this.progressMessages[messageIndex];
                
                if (progressText) progressText.textContent = message;
                if (loadingText) loadingText.textContent = message;
            }
        }, 800);
    }

    // Stop progress animation
    stopProgressAnimation() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        // Complete progress
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = '100%';
        }
    }

    // Call generation API
    async callGenerationAPI(formData) {
        const response = await fetch(`${API_BASE_URL}/generate-song`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }

    // Handle successful generation
    async handleGenerationSuccess(result, formData) {
        this.stopProgressAnimation();
        
        // Small delay for better UX
        await this.delay(500);
        
        this.currentSongId = result.song_id;
        this.displayResults(result, formData);
        this.showToast('Tamil song generated successfully! 🎵', 'success');
        
        // Analytics
        this.trackGeneration(result, formData);
    }

    // Handle generation error
    handleGenerationError(error) {
        console.error('Generation error:', error);
        this.stopProgressAnimation();
        
        let errorMessage = 'Failed to generate song. Please try again.';
        
        if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Generation timed out. Please try with shorter content.';
        }
        
        this.showToast(errorMessage, 'error');
        
        // Show error in result area
        this.showErrorInResults(errorMessage);
    }

    // Display generation results
    displayResults(result, formData) {
        const resultCard = document.getElementById('resultCard');
        const songInfo = document.getElementById('songInfo');
        const audioPlayer = document.getElementById('audioPlayer');
        const downloadButtons = document.getElementById('downloadButtons');
        
        if (!resultCard) return;
        
        // Show result card
        resultCard.style.display = 'block';
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update song info
        if (songInfo) {
            songInfo.innerHTML = this.generateSongInfoHTML(result, formData);
        }
        
        // Setup audio player
        if (audioPlayer && result.download_url) {
            audioPlayer.src = `${API_BASE_URL}${result.download_url}`;
            audioPlayer.style.display = 'block';
            
            // Add audio event listeners
            this.setupAudioPlayer(audioPlayer);
        }
        
        // Show download buttons
        if (downloadButtons) {
            downloadButtons.style.display = 'flex';
        }
    }

    // Generate song info HTML
    generateSongInfoHTML(result, formData) {
        const metadata = result.metadata;
        
        return `
            <div class="song-details">
                <h4><i class="fas fa-music"></i> Song Details</h4>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Model:</span>
                        <span class="detail-value">${this.capitalizeFirst(metadata.model)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Genre:</span>
                        <span class="detail-value">${this.capitalizeFirst(metadata.genre)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Mood:</span>
                        <span class="detail-value">${this.capitalizeFirst(metadata.mood)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Voice:</span>
                        <span class="detail-value">${this.capitalizeFirst(metadata.voice)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duration:</span>
                        <span class="detail-value">${metadata.duration}s</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Instruments:</span>
                        <span class="detail-value">${metadata.instruments.join(', ')}</span>
                    </div>
                </div>
            </div>
            
            <div class="kavithai-preview">
                <h4><i class="fas fa-feather"></i> Your Kavithai</h4>
                <div class="kavithai-text">"${metadata.kavithai}"</div>
            </div>
        `;
    }

    // Setup audio player
    setupAudioPlayer(audioPlayer) {
        audioPlayer.addEventListener('loadstart', () => {
            this.showToast('Loading audio...', 'info');
        });
        
        audioPlayer.addEventListener('canplay', () => {
            this.showToast('Your Tamil song is ready to play! 🎧', 'success');
        });
        
        audioPlayer.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            this.showToast('Error loading audio. Please try downloading instead.', 'error');
        });
        
        audioPlayer.addEventListener('ended', () => {
            this.showToast('Enjoyed your Tamil song? Share it with others! 🎵', 'info');
        });
    }

    // Show error in results area
    showErrorInResults(errorMessage) {
        const resultCard = document.getElementById('resultCard');
        const songInfo = document.getElementById('songInfo');
        
        if (resultCard && songInfo) {
            resultCard.style.display = 'block';
            songInfo.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Generation Failed</h4>
                    <p>${errorMessage}</p>
                    <button onclick="location.reload()" class="retry-btn">
                        <i class="fas fa-redo"></i> Try Again
                    </button>
                </div>
            `;
        }
    }

    // Download song functionality
    async downloadSong(format = 'wav') {
        if (!this.currentSongId) {
            this.showToast('No song available for download', 'error');
            return;
        }
        
        try {
            this.showToast(`Preparing ${format.toUpperCase()} download...`, 'info');
            
            const response = await fetch(`${API_BASE_URL}/download/${this.currentSongId}`);
            
            if (!response.ok) {
                throw new Error('Download failed');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            a.href = url;
            a.download = `tamil_song_${this.currentSongId}.${format}`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showToast(`${format.toUpperCase()} download started! 📥`, 'success');
            
        } catch (error) {
            console.error('Download error:', error);
            this.showToast('Download failed. Please try again.', 'error');
        }
    }

    // Share song functionality
    shareSong() {
        if (!this.currentSongId) {
            this.showToast('No song available to share', 'error');
            return;
        }
        
        const shareData = {
            title: 'My Tamil AI Generated Song',
            text: 'Check out this amazing Tamil song I created with AI from my kavithai!',
            url: `${window.location.origin}?song=${this.currentSongId}`
        };
        
        if (navigator.share) {
            navigator.share(shareData).then(() => {
                this.showToast('Song shared successfully! 📤', 'success');
            }).catch((error) => {
                console.log('Share failed:', error);
                this.fallbackShare(shareData);
            });
        } else {
            this.fallbackShare(shareData);
        }
    }

    // Fallback share functionality
    fallbackShare(shareData) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareData.url).then(() => {
                this.showToast('Song link copied to clipboard! 📋', 'success');
            }).catch(() => {
                this.showShareModal(shareData);
            });
        } else {
            this.showShareModal(shareData);
        }
    }

    // Show share modal
    showShareModal(shareData) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-share"></i> Share Your Song</h3>
                <p>Copy this link to share your Tamil song:</p>
                <input type="text" value="${shareData.url}" readonly class="share-link">
                <div class="modal-buttons">
                    <button onclick="this.closest('.modal').remove()" class="secondary-btn">Close</button>
                    <button onclick="navigator.clipboard.writeText('${shareData.url}').then(() => {
                        window.tamilGenerator.showToast('Link copied!', 'success');
                        this.closest('.modal').remove();
                    })" class="primary-btn">Copy Link</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-select link text
        const linkInput = modal.querySelector('.share-link');
        linkInput.select();
        linkInput.focus();
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // Load random sample kavithai
    loadRandomSample() {
        const kavithaiTextarea = document.getElementById('kavithai');
        if (!kavithaiTextarea) return;
        
        const sample = this.sampleKavithai[this.sampleIndex % this.sampleKavithai.length];
        kavithaiTextarea.value = sample.text;
        
        // Auto-resize textarea
        this.autoResizeTextarea.call(kavithaiTextarea);
        
        // Increment index for next time
        this.sampleIndex++;
        
        // Show feedback
        this.showToast(`Loaded sample: "${sample.title}"`, 'success');
        
        // Focus on textarea
        kavithaiTextarea.focus();
    }

    // Load specific example by index
    loadExample(index) {
        if (index >= 0 && index < this.sampleKavithai.length) {
            const kavithaiTextarea = document.getElementById('kavithai');
            if (kavithaiTextarea) {
                const sample = this.sampleKavithai[index];
                kavithaiTextarea.value = sample.text;
                this.autoResizeTextarea.call(kavithaiTextarea);
                kavithaiTextarea.focus();
                this.showToast(`Loaded: "${sample.title}"`, 'success');
            }
        }
    }

    // Auto-resize textarea
    autoResizeTextarea() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    }

    // Show loading modal
    showLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // Hide loading modal
    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 4000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => toast.remove());
        
        // Create toast
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Get toast icon based on type
    getToastIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    // Handle window resize
    handleResize() {
        // Update mobile class
        if (this.isMobile()) {
            document.body.classList.add('mobile');
        } else {
            document.body.classList.remove('mobile');
        }
        
        // Adjust layout if needed
        this.adjustResponsiveLayout();
    }

    // Adjust responsive layout
    adjustResponsiveLayout() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent && window.innerWidth <= 768) {
            mainContent.style.gridTemplateColumns = '1fr';
        } else if (mainContent) {
            mainContent.style.gridTemplateColumns = '2fr 1fr';
        }
    }

    // Track generation for analytics
    trackGeneration(result, formData) {
        // Analytics tracking (implement as needed)
        const event = {
            type: 'song_generated',
            model: formData.model,
            genre: formData.genre,
            mood: formData.mood,
            instruments: formData.instruments,
            duration: formData.duration,
            timestamp: new Date().toISOString()
        };
        
        console.log('Analytics:', event);
        
        // Send to analytics service if available
        if (window.gtag) {
            window.gtag('event', 'song_generated', {
                custom_parameter_model: formData.model,
                custom_parameter_genre: formData.genre
            });
        }
    }

    // Utility functions
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    isMobile() {
        return window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML onclick handlers
window.loadExample = function(index) {
    window.tamilGenerator.loadExample(index);
};

window.showAbout = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-info-circle"></i> About Tamil AI Song Generator</h3>
            <div class="about-content">
                <p>Transform your Tamil kavithai (poetry) into beautiful music using advanced AI models and traditional South Indian instruments.</p>
                
                <h4>Features:</h4>
                <ul>
                    <li>Multiple AI models (MusicGen, AudioLDM, MusicLM)</li>
                    <li>Traditional Tamil instruments</li>
                    <li>Carnatic raga-based compositions</li>
                    <li>Tamil voice synthesis</li>
                    <li>Professional audio quality</li>
                </ul>
                
                <h4>Technology:</h4>
                <ul>
                    <li>Frontend: HTML5, CSS3, JavaScript</li>
                    <li>Backend: Python Flask, PyTorch</li>
                    <li>AI: Transformers, LibROSA, SoundFile</li>
                    <li>Deployment: Netlify + Railway</li>
                </ul>
            </div>
            <button onclick="this.closest('.modal').remove()" class="primary-btn">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

window.showTechDetails = function() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-code"></i> Technical Implementation</h3>
            <div class="tech-details">
                <div class="tech-section">
                    <h4>🤖 AI Models</h4>
                    <p>MusicGen (Meta), AudioLDM, Custom Tamil synthesis models with traditional instrument sampling</p>
                </div>
                
                <div class="tech-section">
                    <h4>🎵 Music Processing</h4>
                    <p>Real-time audio processing, MIDI generation, multi-track mixing, raga-based scale generation</p>
                </div>
                
                <div class="tech-section">
                    <h4>🗣️ Tamil Voice Synthesis</h4>
                    <p>Advanced phonetic processing, prosody control, emotion mapping, multi-speaker support</p>
                </div>
                
                <div class="tech-section">
                    <h4>🎛️ Audio Pipeline</h4>
                    <p>Real-time processing, multi-format export, quality enhancement, noise reduction</p>
                </div>
            </div>
            <button onclick="this.closest('.modal').remove()" class="primary-btn">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.tamilGenerator = new TamilSongGenerator();
    console.log('🎵 Tamil AI Song Generator initialized successfully!');
});

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden - pause any ongoing operations if needed
        console.log('Page hidden');
    } else {
        // Page is visible - resume operations
        console.log('Page visible');
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TamilSongGenerator;
}
