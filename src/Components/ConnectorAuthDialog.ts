// src/Components/ConnectorAuthDialog.ts
// Generic connector authentication dialog system

import { ConnectorConfig, ConnectorAuthConfig } from '../DB/idbConnectors';

export interface AuthCredentials {
    token?: string;
    username?: string;
    password?: string;
    customFields?: Record<string, string>;
    mcpConfig?: Record<string, any>;
}

export interface IConnectorAuthDialog {
    show(connector: ConnectorConfig): Promise<AuthCredentials | null>;
}

/**
 * Generic Token-based Auth Dialog
 * Works for HuggingFace, GitHub, and other token-based auth
 */
export class TokenAuthDialog implements IConnectorAuthDialog {
    private dialog: HTMLDialogElement | null = null;
    private resolve: ((credentials: AuthCredentials | null) => void) | null = null;

    async show(connector: ConnectorConfig): Promise<AuthCredentials | null> {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.createDialog(connector);
            this.dialog?.showModal();
        });
    }

    private createDialog(connector: ConnectorConfig) {
        // Remove existing dialog if any
        this.dialog?.remove();

        const authConfig = connector.authConfig;
        const tokenName = authConfig?.tokenName || 'API Token';
        const fields = authConfig?.customFields || [];

        this.dialog = document.createElement('dialog');
        this.dialog.className = 'connector-auth-dialog';
        this.dialog.innerHTML = `
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>${connector.icon} ${connector.name} Authentication</h3>
                    <button class="close-btn" type="button">&times;</button>
                </div>
                <div class="dialog-body">
                    <div class="connector-info">
                        <p>Enter your ${tokenName.toLowerCase()} to connect to ${connector.name}.</p>
                    </div>
                    
                    <div class="auth-form">
                        ${fields.map(field => `
                            <div class="form-field">
                                <label for="auth-${field.key}">${field.label}:</label>
                                <input 
                                    type="${field.type}" 
                                    id="auth-${field.key}" 
                                    data-key="${field.key}"
                                    placeholder="${field.placeholder || ''}" 
                                />
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="info-box">
                        <p><strong>🔒 Security:</strong> Your credentials are stored locally and encrypted. They are never shared with third parties.</p>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="cancel-auth">Cancel</button>
                    <button class="btn btn-primary" id="submit-auth">Connect</button>
                </div>
            </div>
        `;

        this.addStyles();
        this.addEventListeners(connector);
        document.body.appendChild(this.dialog);
    }

    private addStyles() {
        if (document.getElementById('connector-auth-dialog-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'connector-auth-dialog-styles';
        style.textContent = `
            .connector-auth-dialog {
                border: none;
                border-radius: 12px;
                padding: 0;
                max-width: 500px;
                width: 90vw;
                background: var(--bg-primary);
                color: var(--text-primary);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            }
            
            .connector-auth-dialog::backdrop {
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(4px);
            }
            
            .connector-auth-dialog .dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 24px;
                border-bottom: 1px solid var(--border-color);
            }
            
            .connector-auth-dialog .dialog-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .connector-auth-dialog .close-btn {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-secondary);
                padding: 4px;
                border-radius: 4px;
                transition: background-color 0.2s;
            }
            
            .connector-auth-dialog .close-btn:hover {
                background-color: var(--bg-secondary);
            }
            
            .connector-auth-dialog .dialog-body {
                padding: 24px;
            }
            
            .connector-auth-dialog .connector-info {
                background: var(--bg-secondary);
                padding: 16px;
                border-radius: 8px;
                margin-bottom: 24px;
            }
            
            .connector-auth-dialog .connector-info p {
                margin: 0;
                font-size: 0.875rem;
            }
            
            .connector-auth-dialog .auth-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .connector-auth-dialog .form-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .connector-auth-dialog .form-field label {
                font-weight: 500;
                font-size: 0.875rem;
            }
            
            .connector-auth-dialog .form-field input {
                padding: 10px 12px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--bg-primary);
                color: var(--text-primary);
                font-family: monospace;
                font-size: 0.875rem;
            }
            
            .connector-auth-dialog .form-field input:focus {
                outline: none;
                border-color: var(--accent-color);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
            
            .connector-auth-dialog .info-box {
                background: #dbeafe;
                border: 1px solid #93c5fd;
                border-radius: 8px;
                padding: 12px;
                color: #1e40af;
            }
            
            .connector-auth-dialog .info-box p {
                margin: 0;
                font-size: 0.75rem;
            }
            
            .connector-auth-dialog .dialog-footer {
                display: flex;
                justify-content: flex-end;
                gap: 12px;
                padding: 20px 24px;
                border-top: 1px solid var(--border-color);
            }
            
            .connector-auth-dialog .btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                font-size: 0.875rem;
            }
            
            .connector-auth-dialog .btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .connector-auth-dialog .btn-secondary {
                background: var(--bg-secondary);
                color: var(--text-primary);
                border: 1px solid var(--border-color);
            }
            
            .connector-auth-dialog .btn-secondary:hover:not(:disabled) {
                background: var(--bg-tertiary);
            }
            
            .connector-auth-dialog .btn-primary {
                background: var(--accent-color);
                color: white;
            }
            
            .connector-auth-dialog .btn-primary:hover:not(:disabled) {
                background: var(--accent-hover);
            }
        `;
        
        document.head.appendChild(style);
    }

    private addEventListeners(connector: ConnectorConfig) {
        if (!this.dialog) return;

        const submitBtn = this.dialog.querySelector('#submit-auth') as HTMLButtonElement;
        const cancelBtn = this.dialog.querySelector('#cancel-auth') as HTMLButtonElement;
        const closeBtn = this.dialog.querySelector('.close-btn') as HTMLButtonElement;
        const inputs = this.dialog.querySelectorAll('.form-field input') as NodeListOf<HTMLInputElement>;

        submitBtn?.addEventListener('click', () => {
            const credentials: AuthCredentials = {
                customFields: {}
            };

            let valid = true;
            inputs.forEach(input => {
                const key = input.dataset.key;
                const value = input.value.trim();
                
                if (!value) {
                    valid = false;
                    input.setCustomValidity('This field is required');
                    input.reportValidity();
                } else if (key) {
                    credentials.customFields![key] = value;
                    
                    // Also set as top-level field for common cases
                    if (key === 'token') credentials.token = value;
                    if (key === 'username') credentials.username = value;
                }
            });

            if (valid) {
                this.close(credentials);
            }
        });

        cancelBtn?.addEventListener('click', () => this.close(null));
        closeBtn?.addEventListener('click', () => this.close(null));

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                input.setCustomValidity('');
            });
        });

        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) this.close(null);
        });

        this.dialog.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close(null);
            if (e.key === 'Enter') submitBtn?.click();
        });
    }

    private close(result: AuthCredentials | null) {
        this.dialog?.close();
        this.dialog?.remove();
        this.dialog = null;
        
        if (this.resolve) {
            this.resolve(result);
            this.resolve = null;
        }
    }
}

/**
 * Auth Dialog Registry
 * Maps connector types to their auth dialog implementations
 */
export class AuthDialogRegistry {
    private static dialogs: Map<string, new () => IConnectorAuthDialog> = new Map();
    private static genericTokenDialog = new TokenAuthDialog();

    static register(type: string, dialogClass: new () => IConnectorAuthDialog): void {
        this.dialogs.set(type, dialogClass);
    }

    static async showAuthDialog(connector: ConnectorConfig): Promise<AuthCredentials | null> {
        // Check if we have a specific dialog for this connector type
        const DialogClass = this.dialogs.get(connector.type);
        
        if (DialogClass) {
            const dialog = new DialogClass();
            return await dialog.show(connector);
        }

        // Fall back to generic dialog based on auth type
        if (connector.authConfig?.type === 'token' || connector.authConfig?.type === 'custom') {
            return await this.genericTokenDialog.show(connector);
        }

        // For OAuth, we'd need a different flow
        if (connector.authConfig?.type === 'oauth') {
            // TODO: Implement OAuth flow
            alert('OAuth authentication not yet implemented');
            return null;
        }

        return null;
    }
}

// Export convenience function
export async function showConnectorAuthDialog(connector: ConnectorConfig): Promise<AuthCredentials | null> {
    return await AuthDialogRegistry.showAuthDialog(connector);
}
