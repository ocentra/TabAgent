export class HuggingFaceLoginDialog {
    private dialog: HTMLDialogElement | null = null;
    private resolve: ((token: string | null) => void) | null = null;

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
        this.dialog.className = 'huggingface-login-dialog';
        this.dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>HuggingFace Authentication</h3>
                    <button class="close-btn" type="button">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="model-info">
                        <p><strong>Model:</strong> ${modelId}</p>
                        <p>This Google model requires HuggingFace authentication to access.</p>
                        <p><strong>Important:</strong> You must accept Google's terms on HuggingFace first!</p>
                    </div>
                    
                    <div class="auth-methods">
                        <div class="auth-method active" data-method="token">
                            <div class="method-header">
                                <h4>🔑 API Token</h4>
                                <span class="method-badge recommended">Recommended</span>
                            </div>
                            <div class="method-content">
                                <p>Enter your HuggingFace API token to access this model.</p>
                                <div class="token-form">
                                    <label for="hf-token">API Token:</label>
                                    <input type="password" id="hf-token" placeholder="hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
                                    <div class="token-help">
                                        <p><strong>Step 1: Accept Google Terms</strong></p>
                                        <p>1. Go to <a href="https://huggingface.co/${modelId}" target="_blank">this Google model on HuggingFace</a></p>
                                        <p>2. Click "Accept Google's Terms" and sign in to your HF account</p>
                                        <p>3. Complete the terms acceptance process</p>
                                        <br>
                                        <p><strong>Step 2: Get Your API Token</strong></p>
                                        <p>4. Go to <a href="https://huggingface.co/settings/tokens" target="_blank">HuggingFace Settings → Tokens</a></p>
                                        <p>5. Create a new token with "Read" permissions</p>
                                        <p>6. Copy the token and paste it here</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-box">
                        <p><strong>🔒 Security:</strong> Your token is stored locally and only used to access HuggingFace APIs. It's never shared with third parties.</p>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="cancel-login">Cancel</button>
                    <button class="btn btn-primary" id="submit-login">Connect to HuggingFace</button>
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
        if (document.getElementById('huggingface-login-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'huggingface-login-dialog-styles';
        style.textContent = `
            .huggingface-login-dialog {
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
            
            .huggingface-login-dialog::backdrop {
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
            
            .auth-methods {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .auth-method {
                border: 2px solid var(--border-color);
                border-radius: 12px;
                padding: 20px;
                transition: all 0.2s;
                background: var(--bg-primary);
            }
            
            .auth-method.active {
                border-color: var(--accent-color);
                background: var(--bg-secondary);
            }
            
            .method-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            
            .method-header h4 {
                margin: 0;
                font-size: 1.125rem;
                font-weight: 600;
            }
            
            .method-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .method-badge.recommended {
                background: #10b981;
                color: white;
            }
            
            .method-badge.coming-soon {
                background: #6b7280;
                color: white;
            }
            
            .method-content p {
                margin: 0 0 16px 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .token-form {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .token-form label {
                font-weight: 500;
                color: var(--text-primary);
            }
            
            .token-form input {
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: monospace;
                font-size: 0.875rem;
            }
            
            .token-form input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .token-help {
                background: var(--bg-tertiary);
                padding: 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            .token-help p {
                margin: 0 0 4px 0;
            }
            
            .token-help p:last-child {
                margin-bottom: 0;
            }
            
            .token-help a {
                color: var(--accent-color);
                text-decoration: none;
            }
            
            .token-help a:hover {
                text-decoration: underline;
            }
            
            .username-form {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            
            .username-form label {
                font-weight: 500;
                color: var(--text-primary);
            }
            
            .username-form input {
                padding: 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-size: 0.875rem;
            }
            
            .username-form input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .username-help {
                background: var(--bg-tertiary);
                padding: 12px;
                border-radius: 6px;
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
            
            .username-help p {
                margin: 0;
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
            
            .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .btn-secondary:hover:not(:disabled) {
                background: var(--bg-tertiary);
            }
            
            .btn-primary {
                background: var(--accent-color);
                color: white;
            }
            
            .btn-primary:hover:not(:disabled) {
                background: var(--accent-hover);
            }
        `;
        
        document.head.appendChild(style);
    }

    private addEventListeners() {
        if (!this.dialog) return;

        const submitBtn = this.dialog.querySelector('#submit-login') as HTMLButtonElement;
        const cancelBtn = this.dialog.querySelector('#cancel-login') as HTMLButtonElement;
        const closeBtn = this.dialog.querySelector('.close-btn') as HTMLButtonElement;
        const tokenInput = this.dialog.querySelector('#hf-token') as HTMLInputElement;

        submitBtn?.addEventListener('click', () => {
            const token = tokenInput?.value?.trim();
            if (token && token.startsWith('hf_')) {
                this.close(token);
            } else {
                // Show error
                tokenInput?.setCustomValidity('Please enter a valid HuggingFace API token (starts with hf_)');
                tokenInput?.reportValidity();
            }
        });

        cancelBtn?.addEventListener('click', () => {
            this.close(null);
        });

        closeBtn?.addEventListener('click', () => {
            this.close(null);
        });

        tokenInput?.addEventListener('input', () => {
            tokenInput.setCustomValidity('');
        });

        // Add event listeners for auth method selection
        const authMethods = this.dialog.querySelectorAll('.auth-method');
        authMethods.forEach(method => {
            method.addEventListener('click', () => {
                // Remove active class from all methods
                authMethods.forEach(m => m.classList.remove('active'));
                // Add active class to clicked method
                method.classList.add('active');
            });
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
            if (e.key === 'Enter' && e.target === tokenInput) {
                submitBtn?.click();
            }
        });
    }

    private close(result: string | null) {
        this.dialog?.close();
        this.dialog?.remove();
        this.dialog = null;
        
        if (this.resolve) {
            this.resolve(result);
            this.resolve = null;
        }
    }
}
