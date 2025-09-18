export class GoogleTermsDialog {
    private dialog: HTMLDialogElement | null = null;
    private resolve: ((accepted: boolean) => void) | null = null;

    show(modelId: string): Promise<boolean> {
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
        this.dialog.className = 'google-terms-dialog';
        this.dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>Google Gemma License Agreement</h3>
                    <button class="close-btn" type="button">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="model-info">
                        <p><strong>Model:</strong> ${modelId}</p>
                        <p>Before downloading Google Gemma models, you must accept their license terms.</p>
                    </div>
                    
                    <div class="terms-content">
                        <h4>Key Terms:</h4>
                        <ul>
                            <li><strong>Commercial Use:</strong> Subject to Google's Gemma license restrictions</li>
                            <li><strong>Attribution:</strong> Must provide proper attribution to Google</li>
                            <li><strong>Usage Limitations:</strong> Follow Google's acceptable use policy</li>
                            <li><strong>Data Privacy:</strong> Your data may be processed by Google services</li>
                        </ul>
                        
                        <div class="terms-links">
                            <a href="https://huggingface.co/${modelId}" target="_blank" class="terms-link">
                                📄 Read Full Terms on HuggingFace
                            </a>
                            <a href="https://ai.google.dev/gemma/terms" target="_blank" class="terms-link">
                                📄 Google's Official Terms
                            </a>
                        </div>
                    </div>
                    
                    <div class="warning-box">
                        <p><strong>⚠️ Important:</strong> This is a one-time requirement. After accepting, you can download from any source without re-accepting.</p>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="decline-terms">Cancel</button>
                    <button class="btn btn-primary" id="accept-terms">I Accept Terms</button>
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
        if (document.getElementById('google-terms-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'google-terms-dialog-styles';
        style.textContent = `
            .google-terms-dialog {
                border: none;
                border-radius: 12px;
                padding: 0;
                max-width: 600px;
                width: 90vw;
                max-height: 80vh;
                background: var(--bg-primary);
                color: var(--text-primary);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            }
            
            .google-terms-dialog::backdrop {
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
                margin-bottom: 20px;
            }
            
            .model-info p {
                margin: 0 0 8px 0;
            }
            
            .model-info p:last-child {
                margin-bottom: 0;
            }
            
            .terms-content h4 {
                margin: 0 0 12px 0;
                color: var(--text-primary);
            }
            
            .terms-content ul {
                margin: 0 0 20px 0;
                padding-left: 20px;
            }
            
            .terms-content li {
                margin-bottom: 8px;
                line-height: 1.5;
            }
            
            .terms-links {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 20px;
            }
            
            .terms-link {
                color: var(--accent-color);
                text-decoration: none;
                padding: 8px 12px;
                border: 1px solid var(--accent-color);
                border-radius: 6px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .terms-link:hover {
                background-color: var(--accent-color);
                color: white;
            }
            
            .warning-box {
                background: #fef3cd;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                color: #92400e;
            }
            
            .warning-box p {
                margin: 0;
                font-weight: 500;
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
            
            .btn-primary {
                background: var(--accent-color);
                color: white;
            }
            
            .btn-primary:hover {
                background: var(--accent-hover);
            }
        `;
        
        document.head.appendChild(style);
    }

    private addEventListeners() {
        if (!this.dialog) return;

        const acceptBtn = this.dialog.querySelector('#accept-terms') as HTMLButtonElement;
        const declineBtn = this.dialog.querySelector('#decline-terms') as HTMLButtonElement;
        const closeBtn = this.dialog.querySelector('.close-btn') as HTMLButtonElement;

        acceptBtn?.addEventListener('click', () => {
            this.close(true);
        });

        declineBtn?.addEventListener('click', () => {
            this.close(false);
        });

        closeBtn?.addEventListener('click', () => {
            this.close(false);
        });

        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) {
                this.close(false);
            }
        });

        this.dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.close(false);
            }
        });
    }

    private close(accepted: boolean) {
        this.dialog?.close();
        this.dialog?.remove();
        this.dialog = null;
        
        if (this.resolve) {
            this.resolve(accepted);
            this.resolve = null;
        }
    }
}
