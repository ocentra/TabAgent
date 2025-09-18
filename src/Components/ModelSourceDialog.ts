export class ModelSourceDialog {
    private dialog: HTMLDialogElement | null = null;
    private resolve: ((source: string | null) => void) | null = null;

    show(modelId: string): Promise<string | null> {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.createDialog(modelId);
            this.dialog?.showModal();
        });
    }

    private createDialog(modelId: string) {
        // Remove existing dialog if any
        this.dialog?.remove();

        this.dialog = document.createElement('dialog');
        this.dialog.className = 'model-source-dialog';
        this.dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Download ${modelId}</h3>
                    <button class="close-btn" type="button">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="model-info">
                        <p>This model requires authentication and accepting Google's terms.</p>
                        <p>Choose your preferred source to download from:</p>
                    </div>
                    
                    <div class="source-options">
                        <div class="source-option" data-source="huggingface">
                            <div class="source-icon">🤗</div>
                            <div class="source-info">
                                <h4>HuggingFace</h4>
                                <p>Most popular platform with extensive model collection</p>
                                <small>Requires HuggingFace account and API token</small>
                            </div>
                            <div class="source-status">
                                <span class="status-badge recommended">Recommended</span>
                            </div>
                        </div>
                        
                        <div class="source-option" data-source="kaggle">
                            <div class="source-icon">🏆</div>
                            <div class="source-info">
                                <h4>Kaggle</h4>
                                <p>Alternative source with competitive datasets</p>
                                <small>Requires Kaggle account and API key</small>
                            </div>
                            <div class="source-status">
                                <span class="status-badge alternative">Alternative</span>
                            </div>
                        </div>
                        
                        <div class="source-option" data-source="google">
                            <div class="source-icon">🔍</div>
                            <div class="source-info">
                                <h4>Google AI Studio</h4>
                                <p>Direct from Google with native integration</p>
                                <small>Requires Google account and API key</small>
                            </div>
                            <div class="source-status">
                                <span class="status-badge official">Official</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <p><strong>💡 Tip:</strong> Your choice will be remembered for future downloads. You can change it anytime in settings.</p>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="cancel-source">Cancel</button>
                </div>
            </div>
        `;

        // Add styles
        this.addStyles();
        
        // Add event listeners
        this.addEventListeners();
        
        document.body.appendChild(this.dialog);
    }

    private addStyles() {
        if (document.getElementById('model-source-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'model-source-dialog-styles';
        style.textContent = `
            .model-source-dialog {
                border: none;
                border-radius: 12px;
                padding: 0;
                max-width: 700px;
                width: 90vw;
                max-height: 80vh;
                background: var(--bg-primary);
                color: var(--text-primary);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            .model-source-dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .dialog-content {
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            
            .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .dialog-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--text-primary);
            }
            
            .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .close-btn:hover {
                background-color: var(--bg-secondary);
            }
            
            .dialog-body {
                flex: 1;
                padding: 24px;
                overflow-y: auto;
            }
            
            .model-info {
                background: var(--bg-secondary);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 24px;
            }
            
            .model-info p {
                margin: 0 0 8px 0;
            }
            
            .model-info p:last-child {
                margin-bottom: 0;
            }
            
            .source-options {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .source-option {
                display: flex;
                align-items: center;
                padding: 20px;
                border: 2px solid var(--border-color);
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                background: var(--bg-primary);
            }
            
            .source-option:hover {
                border-color: var(--accent-color);
                background: var(--bg-secondary);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .source-option.selected {
                border-color: var(--accent-color);
                background: var(--accent-color);
                color: white;
            }
            
            .source-icon {
                font-size: 2rem;
                margin-right: 16px;
                min-width: 48px;
                text-align: center;
            }
            
            .source-info {
                flex: 1;
            }
            
            .source-info h4 {
                margin: 0 0 8px 0;
                font-size: 1.125rem;
                font-weight: 600;
            }
            
            .source-info p {
                margin: 0 0 4px 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .source-info small {
                color: var(--text-tertiary);
                font-size: 0.75rem;
            }
            
            .source-status {
                margin-left: 16px;
            }
            
            .status-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-badge.recommended {
                background: #10b981;
                color: white;
            }
            
            .status-badge.alternative {
                background: #f59e0b;
                color: white;
            }
            
            .status-badge.official {
                background: #3b82f6;
                color: white;
            }
            
            .info-box {
                background: #dbeafe;
                border: 1px solid #93c5fd;
                border-radius: 8px;
                padding: 16px;
                color: #1e40af;
            }
            
            .info-box p {
                margin: 0;
                font-size: 0.875rem;
            }
            
            .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
            }
            
            .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.875rem;
            }
            
            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .btn-secondary:hover {
                background: var(--bg-tertiary);
            }
        `;
        
        document.head.appendChild(style);
    }

    private addEventListeners() {
        if (!this.dialog) return;

        const sourceOptions = this.dialog.querySelectorAll('.source-option');
        const cancelBtn = this.dialog.querySelector('#cancel-source') as HTMLButtonElement;
        const closeBtn = this.dialog.querySelector('.close-btn') as HTMLButtonElement;

        sourceOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selection
                sourceOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selection to clicked option
                option.classList.add('selected');
                
                // Get the source value
                const source = option.getAttribute('data-source');
                if (source) {
                    setTimeout(() => this.close(source), 200); // Small delay for visual feedback
                }
            });
        });

        cancelBtn?.addEventListener('click', () => {
            this.close(null);
        });

        closeBtn?.addEventListener('click', () => {
            this.close(null);
        });

        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.close(null);
            }
        });

        this.dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close(null);
            }
        });
    }

    private close(source: string | null) {
        this.dialog?.close();
        this.dialog?.remove();
        this.dialog = null;
        
        if (this.resolve) {
            this.resolve(source);
            this.resolve = null;
        }
    }
}
