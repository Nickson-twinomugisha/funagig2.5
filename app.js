// Core JavaScript utilities for FunaGig
// Shared utilities, API calls, localStorage management

// API Configuration - Auto-detect from current location
function getApiBaseUrl() {
    // Try to auto-detect from current page location
    const currentPath = window.location.pathname;
    
    // If we're in a subdirectory, try to find api.php relative to current location
    // Common patterns:
    // - /funagig/api.php (root level)
    // - /funagig/some-page.html -> /funagig/api.php
    // - /some-path/funagig/api.php -> /some-path/funagig/api.php
    
    // Remove filename from path
    const pathParts = currentPath.split('/').filter(p => p);
    const fileName = pathParts[pathParts.length - 1];
    
    // If last part is a file (has extension), remove it
    if (fileName && fileName.includes('.')) {
        pathParts.pop();
    }
    
    // Reconstruct path to api.php
    const basePath = pathParts.length > 0 ? '/' + pathParts.join('/') : '';
    const apiPath = basePath + '/api.php';
    
    // Fallback to default if auto-detection fails
    return apiPath || '/funagig/api.php';
}

const API_BASE_URL = getApiBaseUrl();
const WEBSOCKET_URL = 'http://localhost:3001';

// CSRF Token Management
const CSRF = {
    token: null,
    tokenPromise: null,
    
    // Get CSRF token (with caching)
    async getToken() {
        // Return cached token if available
        if (this.token) {
            return this.token;
        }
        
        // If token is being fetched, return the existing promise
        if (this.tokenPromise) {
            return this.tokenPromise;
        }
        
        // Fetch new token
        this.tokenPromise = (async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/csrf-token`);
                const data = await response.json();
                
                if (data.success && data.csrf_token) {
                    this.token = data.csrf_token;
                    return this.token;
                } else {
                    console.warn('Failed to fetch CSRF token');
                    return null;
                }
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
                return null;
            } finally {
                this.tokenPromise = null;
            }
        })();
        
        return this.tokenPromise;
    },
    
    // Refresh CSRF token
    async refreshToken() {
        this.token = null;
        this.tokenPromise = null;
        return await this.getToken();
    },
    
    // Clear token (useful on logout)
    clearToken() {
        this.token = null;
        this.tokenPromise = null;
    }
};

// Loading State Utilities
const Loading = {
    show(element, text = 'Loading...') {
        if (!element) return;
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div style="text-align: center;">
                <div class="loading-spinner" style="margin: 0 auto 12px;"></div>
                <div class="subtle">${text}</div>
            </div>
        `;
        
        // Make parent relative if not already
        const position = window.getComputedStyle(element).position;
        if (position === 'static') {
            element.style.position = 'relative';
        }
        
        element.appendChild(overlay);
        return overlay;
    },
    
    hide(element) {
        if (!element) return;
        const overlay = element.querySelector('.loading-overlay');
        if (overlay) {
            overlay.remove();
        }
    },
    
    setButtonLoading(button, isLoading) {
        if (!button) return;
        
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
            button.dataset.originalText = button.textContent;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }
};

// Confirmation Dialog Utilities
const Confirm = {
    show(options) {
        return new Promise((resolve) => {
            // Create modal if it doesn't exist
            let modal = document.getElementById('confirmationModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'confirmationModal';
                modal.className = 'confirmation-modal';
                modal.innerHTML = `
                    <div class="confirmation-modal-content">
                        <div class="confirmation-modal-icon" id="confirmIcon">⚠️</div>
                        <div class="confirmation-modal-title" id="confirmTitle">Confirm Action</div>
                        <div class="confirmation-modal-message" id="confirmMessage">Are you sure you want to proceed?</div>
                        <div class="confirmation-modal-actions">
                            <button class="btn secondary" id="confirmCancel">Cancel</button>
                            <button class="btn" id="confirmOk">Confirm</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // Event listeners will be set up per-show() call
                // They're handled in the show() method itself
            }
            
            // Update modal content
            const icon = document.getElementById('confirmIcon');
            const title = document.getElementById('confirmTitle');
            const message = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('confirmOk');
            const cancelBtn = document.getElementById('confirmCancel');
            
            icon.textContent = options.icon || '⚠️';
            title.textContent = options.title || 'Confirm Action';
            message.textContent = options.message || 'Are you sure you want to proceed?';
            okBtn.textContent = options.okText || 'Confirm';
            cancelBtn.textContent = options.cancelText || 'Cancel';
            
            // Style OK button based on type
            if (options.type === 'danger') {
                okBtn.classList.add('btn-danger');
                okBtn.classList.remove('btn');
            } else {
                okBtn.classList.remove('btn-danger');
                okBtn.classList.add('btn');
            }
            
            // Store resolve for cleanup
            modal._currentResolve = resolve;
            
            // Initialize handlers if first time
            if (!modal._initialized) {
                // Setup permanent button handlers
                document.getElementById('confirmCancel').addEventListener('click', () => {
                    if (modal._currentResolve) {
                        modal.classList.remove('active');
                        if (modal._escapeHandler) {
                            document.removeEventListener('keydown', modal._escapeHandler);
                            modal._escapeHandler = null;
                        }
                        modal._currentResolve(false);
                        modal._currentResolve = null;
                    }
                });
                
                document.getElementById('confirmOk').addEventListener('click', () => {
                    if (modal._currentResolve) {
                        modal.classList.remove('active');
                        if (modal._escapeHandler) {
                            document.removeEventListener('keydown', modal._escapeHandler);
                            modal._escapeHandler = null;
                        }
                        modal._currentResolve(true);
                        modal._currentResolve = null;
                    }
                });
                
                // Backdrop click
                modal.addEventListener('click', (e) => {
                    if (e.target === modal && modal._currentResolve) {
                        modal.classList.remove('active');
                        if (modal._escapeHandler) {
                            document.removeEventListener('keydown', modal._escapeHandler);
                            modal._escapeHandler = null;
                        }
                        modal._currentResolve(false);
                        modal._currentResolve = null;
                    }
                });
                
                modal._initialized = true;
            }
            
            // Store resolve for this instance
            modal._currentResolve = resolve;
            
            // Setup escape key handler
            const handleEscape = (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active') && modal._currentResolve) {
                    modal.classList.remove('active');
                    document.removeEventListener('keydown', handleEscape);
                    modal._currentResolve(false);
                    modal._currentResolve = null;
                    modal._escapeHandler = null;
                }
            };
            
            // Remove previous escape handler if exists
            if (modal._escapeHandler) {
                document.removeEventListener('keydown', modal._escapeHandler);
            }
            modal._escapeHandler = handleEscape;
            document.addEventListener('keydown', handleEscape);
            
            // Show modal
            modal.classList.add('active');
        });
    },
    
    delete(message = 'This action cannot be undone.') {
        return this.show({
            icon: '🗑️',
            title: 'Confirm Delete',
            message: message,
            okText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
    },
    
    action(title, message, okText = 'Confirm') {
        return this.show({
            title: title,
            message: message,
            okText: okText,
            cancelText: 'Cancel'
        });
    }
};

// Application Modal Utilities
const ApplicationModal = {
    show(gigTitle, gigId, placeholder = 'Tell the business why you\'re interested in this gig...') {
        return new Promise((resolve) => {
            // Create modal if it doesn't exist
            let modal = document.getElementById('applicationModal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'applicationModal';
                modal.className = 'application-modal';
                modal.innerHTML = `
                    <div class="application-modal-content">
                        <div class="application-modal-title" id="applicationModalTitle">Apply to Gig</div>
                        <div class="application-modal-message" id="applicationModalMessage"></div>
                        <textarea id="applicationMessage" placeholder="${placeholder}" required></textarea>
                        
                        <div class="application-modal-file-upload">
                            <label for="applicationResume" class="file-upload-label" id="applicationResumeLabel">
                                <span class="file-upload-icon">📄</span>
                                <span class="file-upload-text">Upload Resume/CV (Optional)</span>
                                <span class="file-upload-hint">PDF, DOC, DOCX (Max 5MB)</span>
                            </label>
                            <input type="file" id="applicationResume" accept=".pdf,.doc,.docx" style="display: none;" />
                            <div id="applicationResumePreview" class="file-upload-preview" style="display: none;">
                                <span class="file-upload-name" id="applicationResumeName"></span>
                                <button type="button" class="file-upload-remove" id="applicationResumeRemove">×</button>
                            </div>
                            <div id="applicationResumeProgress" class="file-upload-progress" style="display: none;">
                                <div class="progress-bar">
                                    <div class="progress-fill" id="applicationResumeProgressFill"></div>
                                </div>
                                <span class="progress-text">Uploading...</span>
                            </div>
                        </div>
                        
                        <div class="application-modal-actions">
                            <button class="btn secondary" id="applicationCancel">Cancel</button>
                            <button class="btn" id="applicationSubmit">Submit Application</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // Setup event listeners using event delegation to ensure they always work
                const modalContent = modal.querySelector('.application-modal-content');
                
                // Use event delegation for all button clicks
                modalContent.addEventListener('click', (e) => {
                    // Handle cancel button
                    if (e.target.id === 'applicationCancel' || e.target.closest('#applicationCancel')) {
                        e.preventDefault();
                        e.stopPropagation();
                        modal.classList.remove('active');
                        // Reset form
                        const messageField = document.getElementById('applicationMessage');
                        const resumeInput = document.getElementById('applicationResume');
                        const resumeLabel = document.getElementById('applicationResumeLabel');
                        const resumePreview = document.getElementById('applicationResumePreview');
                        const resumeProgress = document.getElementById('applicationResumeProgress');
                        
                        if (messageField) messageField.value = '';
                        if (resumeInput) resumeInput.value = '';
                        if (resumeLabel) resumeLabel.style.display = 'flex';
                        if (resumePreview) resumePreview.style.display = 'none';
                        if (resumeProgress) resumeProgress.style.display = 'none';
                        delete modal._resumeFile;
                        
                        // Resolve with null to indicate cancellation
                        if (modal._currentResolve) {
                            modal._currentResolve(null);
                            modal._currentResolve = null;
                        }
                        return;
                    }
                    
                    // Handle resume remove button
                    if (e.target.id === 'applicationResumeRemove' || e.target.closest('#applicationResumeRemove')) {
                        e.preventDefault();
                        e.stopPropagation();
                        const resumeInput = document.getElementById('applicationResume');
                        const resumeLabel = document.getElementById('applicationResumeLabel');
                        const resumePreview = document.getElementById('applicationResumePreview');
                        const resumeProgress = document.getElementById('applicationResumeProgress');
                        
                        if (resumeInput) resumeInput.value = '';
                        if (resumeLabel) resumeLabel.style.display = 'flex';
                        if (resumePreview) resumePreview.style.display = 'none';
                        if (resumeProgress) resumeProgress.style.display = 'none';
                        delete modal._resumeFile;
                        return;
                    }
                    
                    // Handle resume label click
                    if (e.target.id === 'applicationResumeLabel' || e.target.closest('#applicationResumeLabel')) {
                        const resumeInput = document.getElementById('applicationResume');
                        if (resumeInput && e.target.id !== 'applicationResume') {
                            e.preventDefault();
                            resumeInput.click();
                        }
                        return;
                    }
                });
                
                // Setup file input change handler
                modal.addEventListener('change', async (e) => {
                    if (e.target.id === 'applicationResume') {
                        const file = e.target.files[0];
                        if (!file) return;
                        
                        const resumeInput = document.getElementById('applicationResume');
                        const resumeLabel = document.getElementById('applicationResumeLabel');
                        const resumePreview = document.getElementById('applicationResumePreview');
                        const resumeName = document.getElementById('applicationResumeName');
                        
                        // Validate file type
                        const allowedExtensions = ['pdf', 'doc', 'docx'];
                        const fileExt = file.name.split('.').pop().toLowerCase();
                        
                        if (!allowedExtensions.includes(fileExt)) {
                            Toast.error('Invalid file type. Please upload PDF, DOC, or DOCX files only.');
                            if (resumeInput) resumeInput.value = '';
                            return;
                        }
                        
                        // Validate file size (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                            Toast.error('File size must be less than 5MB');
                            if (resumeInput) resumeInput.value = '';
                            return;
                        }
                        
                        // Hide label, show preview
                        if (resumeLabel) resumeLabel.style.display = 'none';
                        if (resumeName) resumeName.textContent = file.name;
                        if (resumePreview) resumePreview.style.display = 'flex';
                        
                        // Store file for later upload
                        modal._resumeFile = file;
                    }
                });
                
                // Setup submit button handler
                modalContent.addEventListener('click', async (e) => {
                    if (e.target.id === 'applicationSubmit' || e.target.closest('#applicationSubmit')) {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        const message = document.getElementById('applicationMessage')?.value.trim();
                        if (!message) {
                            Toast.error('Please add a message to your application');
                            return;
                        }
                        
                        const submitBtn = document.getElementById('applicationSubmit');
                        const originalText = submitBtn?.textContent;
                        if (submitBtn) {
                            submitBtn.disabled = true;
                            submitBtn.textContent = 'Submitting...';
                        }
                        
                        let resumePath = null;
                        
                        // Upload resume if provided
                        if (modal._resumeFile) {
                            try {
                                const resumeProgress = document.getElementById('applicationResumeProgress');
                                const resumeProgressFill = document.getElementById('applicationResumeProgressFill');
                                
                                if (resumeProgress) resumeProgress.style.display = 'block';
                                if (resumeProgressFill) resumeProgressFill.style.width = '0%';
                                
                                const uploadResponse = await FileUpload.upload(modal._resumeFile, 'resume', {
                                    onProgress: (loaded, total) => {
                                        const percent = Math.round((loaded / total) * 100);
                                        if (resumeProgressFill) resumeProgressFill.style.width = percent + '%';
                                    },
                                    gigId: modal._gigId
                                });
                                
                                if (uploadResponse.success) {
                                    resumePath = uploadResponse.file_path;
                                    if (resumeProgress) resumeProgress.style.display = 'none';
                                } else {
                                    throw new Error(uploadResponse.error || 'Failed to upload resume');
                                }
                            } catch (error) {
                                console.error('Resume upload error:', error);
                                Toast.error('Failed to upload resume: ' + (error.message || 'Unknown error'));
                                const resumeProgress = document.getElementById('applicationResumeProgress');
                                if (resumeProgress) resumeProgress.style.display = 'none';
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.textContent = originalText;
                                }
                                return;
                            }
                        }
                        
                        modal.classList.remove('active');
                        
                        // Resolve with application data
                        if (modal._currentResolve) {
                            modal._currentResolve({
                                message: message,
                                resume_path: resumePath
                            });
                            modal._currentResolve = null;
                        }
                    }
                });
                
                // Close on backdrop click (but not on content click)
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        e.preventDefault();
                        e.stopPropagation();
                        modal.classList.remove('active');
                        // Reset form
                        const messageField = document.getElementById('applicationMessage');
                        const resumeInputReset = document.getElementById('applicationResume');
                        const resumeLabelReset = document.getElementById('applicationResumeLabel');
                        const resumePreviewReset = document.getElementById('applicationResumePreview');
                        const resumeProgressReset = document.getElementById('applicationResumeProgress');
                        
                        if (messageField) messageField.value = '';
                        if (resumeInputReset) resumeInputReset.value = '';
                        if (resumeLabelReset) resumeLabelReset.style.display = 'flex';
                        if (resumePreviewReset) resumePreviewReset.style.display = 'none';
                        if (resumeProgressReset) resumeProgressReset.style.display = 'none';
                        delete modal._resumeFile;
                        
                        // Resolve with null to indicate cancellation
                        if (modal._currentResolve) {
                            modal._currentResolve(null);
                            modal._currentResolve = null;
                        }
                    }
                });
                
                // Prevent modal content clicks from closing modal
                const modalContent2 = modal.querySelector('.application-modal-content');
                if (modalContent2) {
                    modalContent2.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                }
                
                // Submit on Enter+Ctrl/Cmd in textarea
                modal.addEventListener('keydown', (e) => {
                    if (e.target.id === 'applicationMessage' && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        const submitBtn = document.getElementById('applicationSubmit');
                        if (submitBtn) submitBtn.click();
                    }
                });
            }
            
            // Store gigId and update resolve function for this modal instance
            modal._gigId = gigId;
            // Always update the resolve function so cancel/submit work correctly
            modal._currentResolve = resolve;
            
            // Update modal content
            document.getElementById('applicationModalTitle').textContent = `Apply to "${gigTitle}"`;
            document.getElementById('applicationModalMessage').textContent = 'Add a message to your application:';
            document.getElementById('applicationMessage').value = '';
            document.getElementById('applicationMessage').placeholder = placeholder;
            
            // Reset file upload
            const resumeInputReset = document.getElementById('applicationResume');
            const resumeLabelReset = document.getElementById('applicationResumeLabel');
            const resumePreviewReset = document.getElementById('applicationResumePreview');
            const resumeProgressReset = document.getElementById('applicationResumeProgress');
            if (resumeInputReset) resumeInputReset.value = '';
            if (resumeLabelReset) resumeLabelReset.style.display = 'flex';
            if (resumePreviewReset) resumePreviewReset.style.display = 'none';
            if (resumeProgressReset) resumeProgressReset.style.display = 'none';
            delete modal._resumeFile;
            
            // Focus on textarea
            setTimeout(() => {
                document.getElementById('applicationMessage').focus();
            }, 100);
            
            // Show modal
            modal.classList.add('active');
        });
    }
};

// Sort Utilities
const Sort = {
    byDate(array, field = 'created_at', order = 'desc') {
        return [...array].sort((a, b) => {
            const dateA = new Date(a[field] || 0);
            const dateB = new Date(b[field] || 0);
            return order === 'asc' ? dateA - dateB : dateB - dateA;
        });
    },
    
    byNumber(array, field, order = 'desc') {
        return [...array].sort((a, b) => {
            const numA = parseFloat(a[field] || 0);
            const numB = parseFloat(b[field] || 0);
            return order === 'asc' ? numA - numB : numB - numA;
        });
    },
    
    byString(array, field, order = 'asc') {
        return [...array].sort((a, b) => {
            const strA = (a[field] || '').toLowerCase();
            const strB = (b[field] || '').toLowerCase();
            if (order === 'asc') {
                return strA.localeCompare(strB);
            } else {
                return strB.localeCompare(strA);
            }
        });
    },
    
    custom(array, sortFn) {
        return [...array].sort(sortFn);
    },
    
    byField(array, field, order = 'asc', type = 'auto') {
        if (array.length === 0) return array;
        
        const firstValue = array[0][field];
        let detectedType = type;
        
        if (type === 'auto') {
            if (firstValue instanceof Date || (typeof firstValue === 'string' && !isNaN(Date.parse(firstValue)))) {
                detectedType = 'date';
            } else if (typeof firstValue === 'number' || !isNaN(parseFloat(firstValue))) {
                detectedType = 'number';
            } else {
                detectedType = 'string';
            }
        }
        
        switch (detectedType) {
            case 'date':
                return this.byDate(array, field, order);
            case 'number':
                return this.byNumber(array, field, order);
            case 'string':
            default:
                return this.byString(array, field, order);
        }
    }
};

// Pagination Utilities
const Pagination = {
    create(currentPage, totalPages, onPageChange, options = {}) {
        if (totalPages <= 1 && !options.alwaysShow) {
            return '';
        }
        
        const maxVisible = options.maxVisible || 5;
        const container = document.createElement('div');
        container.className = 'pagination';
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }
        
        let html = '';
        
        // First page button
        if (startPage > 1) {
            html += `<button class="pagination-btn" data-page="1" ${currentPage === 1 ? 'disabled' : ''}>First</button>`;
        }
        
        // Previous button
        html += `<button class="pagination-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        
        // Next button
        html += `<button class="pagination-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`;
        
        // Last page button
        if (endPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${totalPages}" ${currentPage === totalPages ? 'disabled' : ''}>Last</button>`;
        }
        
        // Page info
        html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;
        
        container.innerHTML = html;
        
        // Add event listeners
        container.querySelectorAll('.pagination-btn').forEach(btn => {
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    const page = parseInt(btn.dataset.page);
                    if (page !== currentPage && page >= 1 && page <= totalPages) {
                        onPageChange(page);
                    }
                });
            }
        });
        
        return container;
    },
    
    paginate(array, page, perPage) {
        const start = (page - 1) * perPage;
        const end = start + perPage;
        return {
            data: array.slice(start, end),
            total: array.length,
            page: page,
            perPage: perPage,
            totalPages: Math.ceil(array.length / perPage),
            hasNext: end < array.length,
            hasPrev: page > 1
        };
    }
};

// Debounce Utility with loading indicator support
const Debounce = {
    create(func, wait = 300, options = {}) {
        let timeout;
        const loadingElement = options.loadingElement || null;
        const showLoading = options.showLoading === true;
        
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                
                // Show loading indicator if option is provided
                if (showLoading && loadingElement) {
                    loadingElement.classList.add('loading');
                }
                
                // Execute the function
                const result = func(...args);
                
                // Hide loading indicator after a short delay
                if (showLoading && loadingElement) {
                    setTimeout(() => {
                        if (loadingElement) {
                            loadingElement.classList.remove('loading');
                        }
                    }, 300);
                }
                
                return result;
            };
            
            clearTimeout(timeout);
            
            // Clear loading if user continues typing
            if (showLoading && loadingElement) {
                loadingElement.classList.remove('loading');
            }
            
            timeout = setTimeout(later, wait);
        };
    }
};

// URL State Management Utility
const URLState = {
    // Get URL parameter value
    get(key, defaultValue = null) {
        const params = new URLSearchParams(window.location.search);
        return params.get(key) || defaultValue;
    },
    
    // Set URL parameter (updates URL without reload)
    set(key, value, options = {}) {
        const params = new URLSearchParams(window.location.search);
        
        if (value === null || value === '' || value === undefined) {
            params.delete(key);
        } else {
            params.set(key, value);
        }
        
        // Update URL
        const newUrl = options.replace !== false 
            ? `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`
            : window.location.href.split('?')[0] + (params.toString() ? '?' + params.toString() : '') + window.location.hash;
        
        if (options.push !== false) {
            window.history.pushState({}, '', newUrl);
        } else {
            window.history.replaceState({}, '', newUrl);
        }
        
        // Trigger custom event for state change
        window.dispatchEvent(new CustomEvent('urlstatechange', { 
            detail: { key, value, params: Object.fromEntries(params) } 
        }));
    },
    
    // Set multiple parameters at once
    setMultiple(paramsObj, options = {}) {
        Object.entries(paramsObj).forEach(([key, value]) => {
            this.set(key, value, { ...options, push: false }); // Only push on last update
        });
        // Push state once after all updates
        if (options.push !== false) {
            const params = new URLSearchParams(window.location.search);
            const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}${window.location.hash}`;
            window.history.pushState({}, '', newUrl);
        }
    },
    
    // Remove URL parameter
    remove(key) {
        this.set(key, null);
    },
    
    // Get all URL parameters as object
    getAll() {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params);
    },
    
    // Clear all URL parameters
    clear() {
        window.history.pushState({}, '', window.location.pathname + window.location.hash);
    },
    
    // Sync form fields with URL parameters
    syncFromURL(fieldMapping, options = {}) {
        const params = this.getAll();
        Object.entries(fieldMapping).forEach(([urlKey, fieldSelector]) => {
            const value = params[urlKey];
            if (value !== undefined) {
                const field = document.querySelector(fieldSelector);
                if (field) {
                    field.value = value;
                    // Trigger change event if option is set
                    if (options.triggerChange) {
                        field.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        });
    },
    
    // Sync form fields to URL parameters
    syncToURL(fieldMapping, options = {}) {
        const updates = {};
        Object.entries(fieldMapping).forEach(([urlKey, fieldSelector]) => {
            const field = document.querySelector(fieldSelector);
            if (field) {
                const value = field.value || null;
                if (value) {
                    updates[urlKey] = value;
                } else {
                    updates[urlKey] = null; // Remove from URL
                }
            }
        });
        this.setMultiple(updates, options);
    },
    
    // Watch for URL changes (e.g., browser back/forward)
    watch(callback) {
        window.addEventListener('popstate', callback);
        window.addEventListener('urlstatechange', callback);
    }
};

// Error Recovery Utility
const ErrorRecovery = {
    // Create retry button
    createRetryButton(onRetry, label = 'Retry') {
        const button = document.createElement('button');
        button.className = 'btn';
        button.textContent = label;
        button.onclick = () => {
            button.disabled = true;
            button.textContent = 'Retrying...';
            onRetry().finally(() => {
                button.disabled = false;
                button.textContent = label;
            });
        };
        return button;
    },
    
    // Show error with retry option
    showError(container, error, onRetry, customMessage = null) {
        if (!container) return;
        
        const errorMessage = customMessage || error.message || 'An error occurred. Please try again.';
        
        EmptyState.show(
            container,
            '⚠️',
            'Something Went Wrong',
            errorMessage,
            onRetry ? this.createRetryButton(onRetry).outerHTML : null
        );
    },
    
    // Handle API error with automatic retry option
    handleApiError(error, container, retryFn, options = {}) {
        const maxRetries = options.maxRetries || 3;
        const retryCount = options.retryCount || 0;
        
        if (retryCount < maxRetries && error.status >= 500) {
            // Server error - offer retry
            return this.showError(
                container,
                error,
                () => {
                    return retryFn().catch(err => {
                        return this.handleApiError(err, container, retryFn, {
                            ...options,
                            retryCount: retryCount + 1
                        });
                    });
                },
                `Server error (${error.status}). Would you like to try again?`
            );
        } else if (error.status === 0 || error.message?.includes('Failed to fetch')) {
            // Network error
            return this.showError(
                container,
                error,
                () => {
                    return retryFn().catch(err => {
                        return this.handleApiError(err, container, retryFn, {
                            ...options,
                            retryCount: retryCount + 1
                        });
                    });
                },
                'Unable to connect to server. Please check your internet connection.'
            );
        } else {
            // Other errors - show without retry
            return this.showError(
                container,
                error,
                null,
                error.message || 'An error occurred. Please refresh the page.'
            );
        }
    }
};

// Keyboard Shortcuts Utility
const KeyboardShortcuts = {
    shortcuts: new Map(),
    
    register(key, handler, options = {}) {
        const combo = {
            key: key.toLowerCase(),
            ctrl: options.ctrl || false,
            shift: options.shift || false,
            alt: options.alt || false,
            meta: options.meta || false,
            handler: handler,
            preventDefault: options.preventDefault !== false, // Default to true
            target: options.target || document
        };
        
        const keyId = `${combo.ctrl ? 'ctrl+' : ''}${combo.shift ? 'shift+' : ''}${combo.alt ? 'alt+' : ''}${combo.meta ? 'meta+' : ''}${combo.key}`;
        this.shortcuts.set(keyId, combo);
        
        // Add event listener
        combo.target.addEventListener('keydown', (e) => {
            // Skip if user is typing in input, textarea, or contenteditable
            if (options.ignoreInputs !== false) {
                const target = e.target;
                if (target.tagName === 'INPUT' || 
                    target.tagName === 'TEXTAREA' || 
                    target.isContentEditable ||
                    target.closest('[contenteditable="true"]')) {
                    return;
                }
            }
            
            const pressedKey = e.key.toLowerCase();
            const matchCtrl = !combo.ctrl || e.ctrlKey;
            const matchShift = !combo.shift || e.shiftKey;
            const matchAlt = !combo.alt || e.altKey;
            const matchMeta = !combo.meta || e.metaKey;
            const matchKey = pressedKey === combo.key;
            
            if (matchKey && matchCtrl && matchShift && matchAlt && matchMeta) {
                if (combo.preventDefault) {
                    e.preventDefault();
                }
                combo.handler(e);
            }
        });
    },
    
    unregister(keyId) {
        this.shortcuts.delete(keyId);
    },
    
    init() {
        // Register global shortcuts
        this.register('k', () => {
            // Focus search input if available
            const searchInputs = document.querySelectorAll('input[type="text"][placeholder*="Search" i], input[type="text"][id*="search" i]');
            if (searchInputs.length > 0) {
                searchInputs[0].focus();
            }
        }, { ctrl: true, meta: true, ignoreInputs: false });
        
        // Escape to close modals
        this.register('Escape', () => {
            // Close confirmation modal
            const confirmModal = document.getElementById('confirmationModal');
            if (confirmModal && confirmModal.classList.contains('active')) {
                confirmModal.classList.remove('active');
            }
            
            // Close application modal
            const appModal = document.getElementById('applicationModal');
            if (appModal && appModal.classList.contains('active')) {
                appModal.classList.remove('active');
            }
            
            // Close any other modals with class 'active'
            document.querySelectorAll('.modal.active, [class*="modal"].active').forEach(modal => {
                modal.classList.remove('active');
            });
        }, { ignoreInputs: false });
    }
};

// Retry Utility for API calls
const Retry = {
    async execute(fn, maxRetries = 3, delay = 1000, backoff = true) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                    throw error;
                }
                
                // Don't retry on last attempt
                if (attempt === maxRetries) {
                    break;
                }
                
                // Calculate delay with exponential backoff if enabled
                const waitTime = backoff ? delay * Math.pow(2, attempt - 1) : delay;
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        throw lastError;
    }
};

// Empty State Utilities
const EmptyState = {
    create(icon = '📭', title = 'No items found', message = 'There are no items to display at this time.', actionButton = null) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon">${icon}</div>
            <div class="empty-state-title">${title}</div>
            <div class="empty-state-message">${message}</div>
            ${actionButton ? `<div class="empty-state-action">${actionButton}</div>` : ''}
        `;
        return emptyState;
    },
    
    show(container, icon, title, message, actionButton = null) {
        if (!container) return;
        container.innerHTML = '';
        container.appendChild(this.create(icon, title, message, actionButton));
    }
};

// Toast Notification System
const Toast = {
    notifications: [],
    container: null,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 12px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000, options = {}) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        toast.innerHTML = `
            <div class="toast-icon" style="background: ${colors[type] || colors.info}20; color: ${colors[type] || colors.info};">
                ${icons[type] || icons.info}
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            ${options.closable !== false ? '<button class="toast-close" onclick="this.parentElement.remove()">×</button>' : ''}
        `;
        
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: white;
            color: var(--text);
        border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            min-width: 300px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
            pointer-events: auto;
            border-left: 4px solid ${colors[type] || colors.info};
        `;
        
        this.container.appendChild(toast);
        this.notifications.push(toast);
        
        // Auto remove after duration
        if (duration > 0) {
    setTimeout(() => {
                this.remove(toast);
            }, duration);
        }
        
        return toast;
    },
    
    remove(toast) {
        if (toast && toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
                this.notifications = this.notifications.filter(n => n !== toast);
            }, 300);
        }
    },
    
    success(message, duration = 3000) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration = 4000) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration = 3500) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration = 3000) {
        return this.show(message, 'info', duration);
    },
    
    clear() {
        this.notifications.forEach(toast => this.remove(toast));
    }
};

// Backward compatibility
function showNotification(message, type = 'info') {
    Toast.show(message, type);
}

// API Fetch wrapper with retry logic
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Extract retry options from config
    const retryDisabled = options.retry === false;
    const maxRetries = options.maxRetries || 3;
    const showErrorNotification = options.showError !== false; // Default to true
    const silent = options.silent === true;
    const skipCSRF = options.skipCSRF === true; // Allow skipping CSRF for specific requests
    
    // Remove custom options from fetch config
    const fetchOptions = { ...options };
    delete fetchOptions.retry;
    delete fetchOptions.maxRetries;
    delete fetchOptions.showError;
    delete fetchOptions.silent;
    delete fetchOptions.skipCSRF;
    
    // Setup headers
    const defaultHeaders = {
            'Content-Type': 'application/json',
    };
    
    // Add CSRF token for state-changing requests (POST, PUT, DELETE)
    const method = (options.method || 'GET').toUpperCase();
    if (!skipCSRF && (method === 'POST' || method === 'PUT' || method === 'DELETE')) {
        // Skip CSRF for login, signup, forgot-password, reset-password
        const skipEndpoints = ['/login', '/signup', '/auth/forgot-password', '/auth/reset-password'];
        const shouldSkip = skipEndpoints.some(skipEndpoint => endpoint.includes(skipEndpoint));
        
        if (!shouldSkip) {
            try {
                const csrfToken = await CSRF.getToken();
                if (csrfToken) {
                    defaultHeaders['X-CSRF-Token'] = csrfToken;
                }
            } catch (error) {
                console.warn('Failed to get CSRF token:', error);
                // Continue without CSRF token if fetch fails (will be validated server-side)
            }
        }
    }
    
    const config = {
        ...fetchOptions,
        headers: {
            ...defaultHeaders,
            ...(fetchOptions.headers || {})
        }
    };
    
    const fetchFn = async () => {
        const response = await fetch(url, config);
        
        // Check if response is ok
        if (!response.ok) {
            let errorMessage = 'Request failed';
            let errorData = null;
            
            try {
                errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
                errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            }
            
            // Handle rate limit errors (429)
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After');
                const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
                const rateLimitReset = response.headers.get('X-RateLimit-Reset');
                
                // Enhance error message with rate limit info if available
                if (retryAfter) {
                    const seconds = parseInt(retryAfter);
                    if (seconds > 60) {
                        const minutes = Math.ceil(seconds / 60);
                        errorMessage = errorMessage || `Rate limit exceeded. Please try again in ${minutes} minute(s).`;
                    } else {
                        errorMessage = errorMessage || `Rate limit exceeded. Please try again in ${seconds} second(s).`;
                    }
                }
            }
            
            // Handle CSRF token errors - refresh token and retry once
            if (response.status === 403 && errorMessage.includes('CSRF')) {
                // Clear cached token and try to refresh
                CSRF.clearToken();
                const newToken = await CSRF.getToken();
                
                if (newToken && config.method && config.method !== 'GET') {
                    // Retry the request once with new token
                    config.headers['X-CSRF-Token'] = newToken;
                    const retryResponse = await fetch(url, config);
                    
                    if (retryResponse.ok) {
                        return await retryResponse.json();
                    }
                }
            }
            
            const error = new Error(errorMessage);
            error.status = response.status;
            error.data = errorData;
            throw error;
        }
        
        // Try to parse JSON response
        try {
            return await response.json();
        } catch (parseError) {
            const error = new Error('Invalid response format from server');
            error.status = 0; // Indicates parsing error
            throw error;
        }
    };
    
    try {
        let data;
        if (retryDisabled) {
            data = await fetchFn();
        } else {
            data = await Retry.execute(fetchFn, maxRetries, 1000, true);
        }
        return data;
    } catch (error) {
        console.error('API Fetch Error:', error);
        
        // Only show notification if enabled and it's the final error
        if (showErrorNotification && !silent) {
        // Show user-friendly error message
        let userMessage = 'Network error. Please try again.';
            const errorStatus = error.status || 0;
            const errorMsg = error.message || '';
            
            if (errorMsg.includes('Failed to fetch') || errorStatus === 0) {
            userMessage = 'Unable to connect to server. Please check your internet connection.';
            } else if (errorMsg.includes('Invalid response format')) {
            userMessage = 'Server returned invalid data. Please try again.';
            } else if (errorMsg) {
                userMessage = errorMsg;
        }
        
            Toast.error(userMessage);
        }
        
        throw error;
    }
}

// Local Storage utilities
const Storage = {
    set(key, value) {
        try {
            if (typeof key !== 'string') {
                throw new Error('Storage key must be a string');
            }
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            showNotification('Failed to save data locally', 'error');
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            if (typeof key !== 'string') {
                throw new Error('Storage key must be a string');
            }
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage error:', error);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            if (typeof key !== 'string') {
                throw new Error('Storage key must be a string');
            }
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },
    
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage error:', error);
            return false;
        }
    },
    
    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
};

// Authentication utilities
const Auth = {
    isLoggedIn() {
        try {
            const user = Storage.get('user');
            return user !== null && typeof user === 'object';
        } catch (error) {
            console.error('Auth check error:', error);
            return false;
        }
    },
    
    getUser() {
        try {
            const user = Storage.get('user');
            if (user && typeof user === 'object') {
                return user;
            }
            return null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    },
    
    setUser(user) {
        try {
            if (!user || typeof user !== 'object') {
                throw new Error('Invalid user data');
            }
            Storage.set('user', user);
            return true;
        } catch (error) {
            console.error('Set user error:', error);
            showNotification('Failed to save user data', 'error');
            return false;
        }
    },
    
    logout() {
        try {
            // Disconnect WebSocket
            if (WebSocketClient) {
                WebSocketClient.disconnect();
            }
            
            // Call server logout
            apiFetch('/logout', {
                method: 'POST',
                skipCSRF: true // Logout endpoint may not require CSRF
            }).catch(error => {
                console.error('Server logout error:', error);
                // Continue with client logout even if server call fails
            });
            
            // Clear CSRF token
            CSRF.clearToken();
            
            // Clear local storage
            Storage.remove('user');
            Storage.remove('userType');
            Storage.remove('isLoggedIn');
            Storage.clear(); // Clear all stored data
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if storage fails
            window.location.href = 'index.html';
        }
    },
    
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'auth.html';
            return false;
        }
        return true;
    },
    
    requireUserType(userType) {
        if (!this.requireAuth()) {
            return false;
        }
        
        const user = this.getUser();
        const storedUserType = localStorage.getItem('userType');
        
        if (user && user.type !== userType && storedUserType !== userType) {
            // Redirect to appropriate dashboard
            if (userType === 'business') {
                window.location.href = 'student-dashboard.html';
            } else {
                window.location.href = 'business-dashboard.html';
            }
            return false;
        }
        
        return true;
    },
    
    async verifySession() {
        try {
            const response = await apiFetch('/profile');
            if (response.success && response.user) {
                this.setUser(response.user);
                localStorage.setItem('userType', response.user.type);
                return response.user;
            }
            return null;
        } catch (error) {
            // Session invalid, logout
            this.logout();
            return null;
        }
    }
};

// Form validation utilities
const Validation = {
    email(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },
    
    password(password) {
        return password.length >= 6;
    },
    
    required(value) {
        return value && value.trim().length > 0;
    }
};

// UI utilities
const UI = {
    showLoading(element) {
        element.innerHTML = '<div class="loading">Loading...</div>';
    },
    
    hideLoading(element, content) {
        element.innerHTML = content;
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-UG', {
            style: 'currency',
            currency: 'UGX'
        }).format(amount);
    }
};

// Sidebar toggle functionality for mobile
const Sidebar = {
    init() {
        const sidebar = document.querySelector('.sidebar');
        const toggleBtn = document.querySelector('.sidebar-toggle');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (!sidebar) return;
        
        // Create toggle button if it doesn't exist
        if (!toggleBtn && window.innerWidth <= 900) {
            this.createToggleButton();
        }
        
        // Create overlay if it doesn't exist
        if (!overlay) {
            this.createOverlay();
        }
        
        // Handle toggle button click
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }
        
        // Handle overlay click
        if (overlay) {
            overlay.addEventListener('click', () => {
                this.close();
            });
        }
        
        // Close sidebar when clicking on nav items (mobile only)
        if (window.innerWidth <= 900) {
            const navItems = sidebar.querySelectorAll('.navitem');
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    this.close();
                });
            });
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 900) {
                this.close();
            }
        });
    },
    
    createToggleButton() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;
        
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '☰';
        toggleBtn.setAttribute('aria-label', 'Toggle menu');
        navbar.appendChild(toggleBtn);
    },
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    },
    
    toggle() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
            if (overlay) {
                overlay.classList.toggle('active');
            }
        }
    },
    
    open() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.add('open');
            if (overlay) {
                overlay.classList.add('active');
            }
        }
    },
    
    close() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.remove('open');
            if (overlay) {
                overlay.classList.remove('active');
            }
        }
    }
};

// Notification badge management
const NotificationBadge = {
    refreshInterval: null,
    
    init() {
        // Setup WebSocket notification handler
        if (WebSocketClient) {
            WebSocketClient.on('notification_received', (notification) => {
                // Refresh notification count
                this.loadCount();
                
                // Show toast notification
                if (notification.title && notification.message) {
                    Toast.info(notification.message, notification.title);
                }
            });
        }
        
        // Add badge HTML to navbar if it doesn't exist
        const navbar = document.querySelector('.navbar');
        if (navbar && !document.getElementById('notificationBadge')) {
            const navbarActions = navbar.querySelector('.navbar-actions');
            if (!navbarActions) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'navbar-actions';
                navbar.appendChild(actionsDiv);
            }
            
            const badgeContainer = document.createElement('div');
            badgeContainer.className = 'notification-badge-container';
            badgeContainer.id = 'notificationBadge';
            badgeContainer.style.display = 'none';
            badgeContainer.onclick = () => {
                // Scroll to notifications section or navigate to dashboard
                const notificationsSection = document.querySelector('#notifications, .section:has(#notifications)');
                if (notificationsSection) {
                    notificationsSection.scrollIntoView({ behavior: 'smooth' });
                } else {
                    // Navigate to dashboard if not on dashboard page
                    const userType = localStorage.getItem('userType');
                    if (userType === 'business') {
                        window.location.href = 'business-dashboard.html';
                    } else if (userType === 'student') {
                        window.location.href = 'student-dashboard.html';
                    }
                }
            };
            
            const badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.id = 'notificationCount';
            badge.textContent = '0';
            
            badgeContainer.appendChild(badge);
            const actionsDiv = navbar.querySelector('.navbar-actions') || navbar.appendChild(document.createElement('div'));
            actionsDiv.className = 'navbar-actions';
            actionsDiv.appendChild(badgeContainer);
        }
        
        // Load notification count if user is logged in
        if (Auth.isLoggedIn()) {
            this.loadCount();
            
            // Refresh notification count every 30 seconds
            this.refreshInterval = setInterval(() => {
                this.loadCount();
            }, 30000);
        }
    },
    
    async loadCount() {
        try {
            const response = await apiFetch('/notifications');
            if (response.success) {
                this.updateCount(response.unread_count || 0);
            }
        } catch (error) {
            console.error('Failed to load notification count:', error);
        }
    },
    
    updateCount(count) {
        const badgeContainer = document.getElementById('notificationBadge');
        const badgeCount = document.getElementById('notificationCount');
        
        if (badgeContainer && badgeCount) {
            if (count > 0) {
                badgeContainer.style.display = 'block';
                badgeCount.textContent = count > 99 ? '99+' : count;
            } else {
                badgeContainer.style.display = 'none';
            }
        }
    },
    
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
};

// File Upload Utility
const FileUpload = {
    async upload(file, uploadType, options = {}) {
        if (!file) throw new Error('No file provided');
        
        const allowedTypes = {
            profile: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
            resume: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            portfolio: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            message: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            gig: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };
        
        if (allowedTypes[uploadType] && !allowedTypes[uploadType].includes(file.type)) {
            throw new Error(`File type not allowed for ${uploadType} upload`);
        }
        
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        }
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_type', uploadType);
        if (options.applicationId) formData.append('application_id', options.applicationId);
        if (options.messageId) formData.append('message_id', options.messageId);
        if (options.gigId) formData.append('gig_id', options.gigId);
        if (options.category) formData.append('category', options.category);
        if (options.description) formData.append('description', options.description);
        
        return new Promise(async (resolve, reject) => {
            // Get CSRF token for the upload
            let csrfToken = null;
            try {
                csrfToken = await CSRF.getToken();
            } catch (error) {
                console.warn('Failed to get CSRF token for upload:', error);
                // Continue without token - server will validate
            }
            
            const xhr = new XMLHttpRequest();
            
            if (options.onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) options.onProgress(e.loaded, e.total);
                });
            }
            
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        response.success ? resolve(response) : reject(new Error(response.error || 'Upload failed'));
                    } catch (e) {
                        reject(new Error('Invalid response from server'));
                    }
                } else if (xhr.status === 403) {
                    // Handle CSRF token error - try to refresh and retry once
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        if (errorResponse.error && errorResponse.error.includes('CSRF')) {
                            // Clear token and retry upload
                            CSRF.clearToken();
                            CSRF.getToken().then(newToken => {
                                if (newToken) {
                                    // Retry upload with new token
                                    const retryXhr = new XMLHttpRequest();
                                    if (options.onProgress) {
                                        retryXhr.upload.addEventListener('progress', (e) => {
                                            if (e.lengthComputable) options.onProgress(e.loaded, e.total);
                                        });
                                    }
                                    retryXhr.addEventListener('load', () => {
                                        if (retryXhr.status >= 200 && retryXhr.status < 300) {
                                            try {
                                                const response = JSON.parse(retryXhr.responseText);
                                                response.success ? resolve(response) : reject(new Error(response.error || 'Upload failed'));
                                            } catch (e) {
                                                reject(new Error('Invalid response from server'));
                                            }
                                        } else {
                                            try {
                                                const error = JSON.parse(retryXhr.responseText);
                                                reject(new Error(error.error || `Upload failed with status ${retryXhr.status}`));
                                            } catch (e) {
                                                reject(new Error(`Upload failed with status ${retryXhr.status}`));
                                            }
                                        }
                                    });
                                    retryXhr.addEventListener('error', () => reject(new Error('Network error during upload')));
                                    retryXhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));
                                    retryXhr.open('POST', `${API_BASE_URL}/upload`);
                                    retryXhr.setRequestHeader('X-CSRF-Token', newToken);
                                    retryXhr.send(formData);
                                    return;
                                }
                            });
                        }
                    } catch (e) {
                        // Fall through to normal error handling
                    }
                    // Normal error handling for 403
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
                    } catch (e) {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                } else {
                    try {
                        const error = JSON.parse(xhr.responseText);
                        reject(new Error(error.error || `Upload failed with status ${xhr.status}`));
                    } catch (e) {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                }
            });
            xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
            xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled')));
            xhr.open('POST', `${API_BASE_URL}/upload`);
            
            // Set CSRF token header if available
            if (csrfToken) {
                xhr.setRequestHeader('X-CSRF-Token', csrfToken);
            }
            
            xhr.send(formData);
        });
    },
    
    createInput(options = {}) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        if (options.accept) input.accept = options.accept;
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const response = await this.upload(file, options.uploadType, { ...options.uploadOptions, onProgress: options.onProgress });
                if (options.onSuccess) options.onSuccess(response, file);
            } catch (error) {
                if (options.onError) options.onError(error);
                else Toast.error(error.message || 'Upload failed');
            } finally {
                input.value = '';
            }
        });
        return input;
    },
    
    async previewImage(file) {
        if (!file.type.startsWith('image/')) throw new Error('File is not an image');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read image file'));
            reader.readAsDataURL(file);
        });
    }
};

// WebSocket Client Utility
const WebSocketClient = {
    socket: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 3000,
    eventHandlers: {},
    
    // Initialize WebSocket connection
    init() {
        if (!Auth.isLoggedIn()) {
            return;
        }
        
        const user = Auth.getUser();
        if (!user || !user.id) {
            return;
        }
        
        this.connect();
    },
    
    // Connect to WebSocket server
    connect() {
        try {
            // Import Socket.io client library (CDN)
            if (typeof io === 'undefined') {
                console.warn('Socket.io not loaded. Please include the Socket.io client library.');
                return;
            }
            
            this.socket = io(WEBSOCKET_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: this.maxReconnectAttempts
            });
            
            // Connection events
            this.socket.on('connect', () => {
                console.log('WebSocket connected');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.authenticate();
            });
            
            this.socket.on('disconnect', (reason) => {
                console.log('WebSocket disconnected:', reason);
                this.connected = false;
                
                // Attempt to reconnect if it was an unexpected disconnect
                if (reason === 'io server disconnect') {
                    // Server disconnected the socket, don't reconnect automatically
                    console.log('Server disconnected socket. Manual reconnection may be required.');
                } else {
                    // Client-side disconnect or network error - attempt reconnection
                    this.reconnectAttempts++;
                    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                        const delay = this.reconnectDelay * this.reconnectAttempts;
                        console.log(`Attempting to reconnect in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                        setTimeout(() => {
                            if (!this.connected) {
                                this.connect();
                            }
                        }, delay);
                    } else {
                        console.error('Max reconnection attempts reached. WebSocket connection failed.');
                        if (typeof Toast !== 'undefined') {
                            Toast.warning('Real-time features unavailable. Please refresh the page.');
                        }
                    }
                }
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.connected = false;
                this.reconnectAttempts++;
                
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    const delay = this.reconnectDelay * this.reconnectAttempts;
                    console.log(`Will retry connection in ${delay}ms... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                    setTimeout(() => {
                        if (!this.connected) {
                            this.connect();
                        }
                    }, delay);
                } else {
                    console.error('Max reconnection attempts reached. WebSocket connection failed.');
                    if (typeof Toast !== 'undefined') {
                        Toast.warning('Unable to connect to real-time server. Some features may be limited.');
                    }
                }
            });
            
            this.socket.on('authenticated', (data) => {
                console.log('WebSocket authenticated:', data);
                this.emit('authenticated', data);
            });
            
            this.socket.on('authentication_error', (error) => {
                console.error('WebSocket authentication error:', error);
                this.connected = false;
                this.emit('authentication_error', error);
                
                // Disconnect and don't attempt to reconnect if authentication fails
                if (this.socket) {
                    this.socket.disconnect();
                }
                
                // Show user-friendly error message
                if (typeof Toast !== 'undefined') {
                    Toast.error('WebSocket authentication failed. Please refresh the page.');
                }
            });
            
            // Message events
            this.socket.on('message_received', (data) => {
                this.emit('message_received', data);
            });
            
            this.socket.on('new_message_notification', (data) => {
                this.emit('new_message_notification', data);
            });
            
            // Typing events
            this.socket.on('user_typing', (data) => {
                this.emit('user_typing', data);
            });
            
            // Notification events
            this.socket.on('notification_received', (data) => {
                this.emit('notification_received', data);
            });
            
            // Online/offline events
            this.socket.on('user_online', (data) => {
                this.emit('user_online', data);
            });
            
            this.socket.on('user_offline', (data) => {
                this.emit('user_offline', data);
            });
            
            // Messages read events
            this.socket.on('messages_read', (data) => {
                this.emit('messages_read', data);
            });
            
            // Pong response
            this.socket.on('pong', () => {
                // Connection is alive
            });
            
        } catch (error) {
            console.error('Error initializing WebSocket:', error);
        }
    },
    
    // Get PHP session ID from cookie
    getSessionId() {
        // PHP session cookie is typically named PHPSESSID
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'PHPSESSID') {
                return value;
            }
        }
        return null;
    },
    
    // Authenticate with WebSocket server
    authenticate() {
        if (!this.socket || !this.connected) {
            return;
        }
        
        const user = Auth.getUser();
        if (!user || !user.id) {
            console.warn('Cannot authenticate WebSocket: User not logged in');
            return;
        }
        
        // Get PHP session ID from cookie
        const sessionToken = this.getSessionId();
        if (!sessionToken) {
            console.error('Cannot authenticate WebSocket: Session ID not found');
            this.socket.emit('authentication_error', { message: 'Session ID not found' });
            return;
        }
        
        // Send authentication with session token
        this.socket.emit('authenticate', {
            userId: user.id,
            sessionToken: sessionToken
        });
    },
    
    // Join a conversation room
    joinConversation(conversationId) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('join_conversation', { conversationId });
    },
    
    // Leave a conversation room
    leaveConversation(conversationId) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('leave_conversation', { conversationId });
    },
    
    // Send new message event
    sendMessageEvent(conversationId, messageId, senderId, content) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('new_message', {
            conversationId,
            messageId,
            senderId,
            content
        });
    },
    
    // Send typing indicator
    sendTyping(conversationId, isTyping, userName) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('typing', {
            conversationId,
            isTyping,
            userName
        });
    },
    
    // Mark messages as read
    markMessagesRead(conversationId) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('mark_read', { conversationId });
    },
    
    // Send notification event
    sendNotification(userId, notification) {
        if (!this.socket || !this.connected) {
            return;
        }
        
        this.socket.emit('new_notification', {
            userId,
            notification
        });
    },
    
    // Register event handler
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    },
    
    // Remove event handler
    off(event, handler) {
        if (!this.eventHandlers[event]) {
            return;
        }
        this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    },
    
    // Emit event to registered handlers
    emit(event, data) {
        if (!this.eventHandlers[event]) {
            return;
        }
        this.eventHandlers[event].forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    },
    
    // Disconnect
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    },
    
    // Check if connected
    isConnected() {
        return this.connected && this.socket && this.socket.connected;
    }
};

// Breadcrumb Navigation Utility
const Breadcrumb = {
    // Page configuration mapping
    pageConfig: {
        // Student pages
        'student-dashboard.html': { label: 'Dashboard', path: ['Dashboard'] },
        'student-gigs.html': { label: 'Gigs', path: ['Dashboard', 'Gigs'] },
        'student-messaging.html': { label: 'Messages', path: ['Dashboard', 'Messages'] },
        'student-profile.html': { label: 'Profile', path: ['Dashboard', 'Profile'] },
        
        // Business pages
        'business-dashboard.html': { label: 'Dashboard', path: ['Dashboard'] },
        'business-post-gig.html': { label: 'Post Gig', path: ['Dashboard', 'Post Gig'] },
        'business-posted-gigs.html': { label: 'My Gigs', path: ['Dashboard', 'My Gigs'] },
        'business-applicants.html': { label: 'Applicants', path: ['Dashboard', 'Applicants'] },
        'business-messaging.html': { label: 'Messages', path: ['Dashboard', 'Messages'] },
        'business-profile.html': { label: 'Profile', path: ['Dashboard', 'Profile'] },
        
        // Public pages
        'index.html': { label: 'Home', path: ['Home'] },
        'home-gigs.html': { label: 'Browse Gigs', path: ['Home', 'Browse Gigs'] },
        'auth.html': { label: 'Login', path: ['Login'] },
        'signup.html': { label: 'Sign Up', path: ['Sign Up'] },
        'forgot-password.html': { label: 'Forgot Password', path: ['Login', 'Forgot Password'] },
        'reset-password.html': { label: 'Reset Password', path: ['Login', 'Reset Password'] }
    },
    
    // Generate breadcrumb HTML
    generate(items, containerId = 'breadcrumb') {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (!items || items.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        const breadcrumbHtml = `
            <nav class="breadcrumb" aria-label="Breadcrumb">
                <ol class="breadcrumb-list">
                    ${items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const separator = index < items.length - 1 ? '<span class="breadcrumb-separator">›</span>' : '';
                        
                        if (isLast) {
                            return `<li class="breadcrumb-item active" aria-current="page">${this.escapeHtml(item.label)}</li>`;
                        } else {
                            return `<li class="breadcrumb-item"><a href="${item.url || '#'}" class="breadcrumb-link">${this.escapeHtml(item.label)}</a></li>${separator}`;
                        }
                    }).join('')}
                </ol>
            </nav>
        `;
        
        container.innerHTML = breadcrumbHtml;
    },
    
    // Auto-generate breadcrumb based on current page
    autoGenerate(containerId = 'breadcrumb', customItems = null) {
        if (customItems) {
            this.generate(customItems, containerId);
            return;
        }
        
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const config = this.pageConfig[currentPage];
        
        if (!config) {
            // Try to generate from URL
            this.generateFromURL(containerId);
            return;
        }
        
        const items = config.path.map((label, index) => {
            let url = null;
            
            // Generate URLs for navigation
            if (index === 0) {
                // First item - link to dashboard or home
                if (currentPage.startsWith('student-')) {
                    url = 'student-dashboard.html';
                } else if (currentPage.startsWith('business-')) {
                    url = 'business-dashboard.html';
                } else {
                    url = 'index.html';
                }
            } else if (index < config.path.length - 1) {
                // Intermediate items - try to find matching page
                const pageName = this.findPageForLabel(label, currentPage);
                if (pageName) url = pageName;
            }
            // Last item has no URL (current page)
            
            return { label, url };
        });
        
        this.generate(items, containerId);
    },
    
    // Generate breadcrumb from URL path
    generateFromURL(containerId = 'breadcrumb') {
        const path = window.location.pathname;
        const hash = window.location.hash.substring(1);
        
        // Parse path segments
        const segments = path.split('/').filter(s => s && !s.endsWith('.html'));
        const filename = path.split('/').pop() || 'index.html';
        
        const items = [];
        
        // Add home/dashboard
        if (filename.startsWith('student-') || filename.startsWith('business-')) {
            const dashboardPage = filename.startsWith('student-') ? 'student-dashboard.html' : 'business-dashboard.html';
            items.push({ label: 'Dashboard', url: dashboardPage });
        } else {
            items.push({ label: 'Home', url: 'index.html' });
        }
        
        // Add current page
        const config = this.pageConfig[filename];
        if (config) {
            items.push({ label: config.label });
        } else {
            // Fallback: use filename
            const label = filename.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            items.push({ label });
        }
        
        // Add hash if present (e.g., #applications)
        if (hash) {
            const hashLabel = hash.charAt(0).toUpperCase() + hash.slice(1);
            items.push({ label: hashLabel });
        }
        
        this.generate(items, containerId);
    },
    
    // Find page name for a given label
    findPageForLabel(label, currentPage) {
        const prefix = currentPage.startsWith('student-') ? 'student-' : 
                      currentPage.startsWith('business-') ? 'business-' : '';
        
        const labelLower = label.toLowerCase().replace(/\s+/g, '-');
        const possiblePage = prefix + labelLower + '.html';
        
        // Check if page exists in config
        if (this.pageConfig[possiblePage]) {
            return possiblePage;
        }
        
        // Try alternative mappings
        const mappings = {
            'gigs': prefix + 'gigs.html',
            'messages': prefix + 'messaging.html',
            'profile': prefix + 'profile.html',
            'post-gig': prefix + 'post-gig.html',
            'post gig': prefix + 'post-gig.html',
            'my-gigs': prefix + 'posted-gigs.html',
            'my gigs': prefix + 'posted-gigs.html',
            'posted-gigs': prefix + 'posted-gigs.html'
        };
        
        return mappings[labelLower] || null;
    },
    
    // Escape HTML
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // Initialize breadcrumb on page load
    init(containerId = 'breadcrumb', customItems = null) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.autoGenerate(containerId, customItems);
            });
        } else {
            this.autoGenerate(containerId, customItems);
        }
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Initialize sidebar toggle
    Sidebar.init();
    
    // Initialize notification badge
    NotificationBadge.init();
    
    // Initialize keyboard shortcuts
    KeyboardShortcuts.init();
    
    // Initialize toast notification system
    Toast.init();
    
    // Breadcrumb initialization removed per user request
    
    // Initialize CSRF token on page load (if user is logged in)
    if (Auth.isLoggedIn()) {
        CSRF.getToken().catch(err => {
            console.warn('Failed to initialize CSRF token:', err);
        });
    }
    
    // Initialize tooltips and other UI enhancements
    initializeTooltips();
    
    // Initialize WebSocket connection if user is logged in
    if (Auth.isLoggedIn()) {
        WebSocketClient.init();
    }
});

function initializeTooltips() {
    // Add tooltip functionality if needed
    console.log('App initialized');
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { apiFetch, Storage, Auth, Validation, UI, showNotification };
}

