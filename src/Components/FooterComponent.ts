// FooterComponent.ts
// Beautiful footer with version info, branding, and update button

import { CURRENT_VERSION, checkExtensionUpdate, checkNativeHostUpdate, getNativeHostVersion } from '../version';

export class FooterComponent {
    private updateCheckInProgress = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        // Update version numbers in HTML
        this.updateVersionNumbers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Check for updates on startup
        setTimeout(() => this.checkForUpdates(), 2000);
    }

    private updateVersionNumbers(): void {
        const extensionVersion = document.getElementById('extension-version');
        
        if (extensionVersion) {
            extensionVersion.textContent = `v${CURRENT_VERSION.extension}`;
        }
    }

    private setupEventListeners(): void {
        const checkBtn = document.getElementById('check-updates-btn');
        if (checkBtn) {
            checkBtn.addEventListener('click', () => this.checkForUpdates());
        }
    }

    private async checkForUpdates(): Promise<void> {
        if (this.updateCheckInProgress) return;

        this.updateCheckInProgress = true;
        this.updateButtonState('checking');

        try {
            // Check native host version first
            const nativeVersion = await getNativeHostVersion();
            if (nativeVersion) {
                this.updateNativeVersion(nativeVersion);
            }

            // Check for extension updates
            const extensionUpdate = await checkExtensionUpdate();
            
            // Check for native host updates
            let nativeUpdate = null;
            if (nativeVersion) {
                nativeUpdate = await checkNativeHostUpdate(nativeVersion);
            }

            // Show results
            if (extensionUpdate.hasUpdate || (nativeUpdate?.hasUpdate)) {
                this.showUpdateNotification(extensionUpdate, nativeUpdate);
                this.updateButtonState('available');
            } else {
                this.updateButtonState('up-to-date');
                setTimeout(() => this.updateButtonState('idle'), 3000);
            }

        } catch (error) {
            console.error('Update check failed:', error);
            this.updateButtonState('error');
            setTimeout(() => this.updateButtonState('idle'), 3000);
        } finally {
            this.updateCheckInProgress = false;
        }
    }

    private updateNativeVersion(version: string): void {
        const versionEl = document.getElementById('native-version');
        const statusEl = document.getElementById('native-status-indicator');
        
        if (versionEl) {
            versionEl.textContent = `v${version}`;
            CURRENT_VERSION.nativeHost = version;
        }
        
        if (statusEl) {
            statusEl.className = 'inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse';
            statusEl.title = 'Connected';
        }
    }

    private updateButtonState(state: 'idle' | 'checking' | 'available' | 'up-to-date' | 'error'): void {
        const btn = document.getElementById('check-updates-btn') as HTMLButtonElement;
        const icon = document.getElementById('update-btn-icon') as HTMLImageElement;
        
        if (!btn || !icon) return;

        switch (state) {
            case 'checking':
                btn.disabled = true;
                btn.className = 'text-gray-500 dark:text-gray-500 cursor-not-allowed';
                btn.title = 'Checking for updates...';
                // Keep the same icon but with disabled styling
                break;
            
            case 'available':
                btn.disabled = false;
                btn.className = 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors animate-pulse';
                btn.title = 'Update available!';
                // Keep the same icon but with green styling
                break;
            
            case 'up-to-date':
                btn.disabled = false;
                btn.className = 'text-green-600 dark:text-green-400';
                btn.title = 'Up to date';
                // Keep the same icon but with green styling
                break;
            
            case 'error':
                btn.disabled = false;
                btn.className = 'text-red-600 dark:text-red-400';
                btn.title = 'Update check failed';
                // Keep the same icon but with red styling
                break;
            
            case 'idle':
            default:
                btn.disabled = false;
                btn.className = 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors';
                btn.title = 'Check for Updates';
                // Keep the default update icon
                break;
        }
    }

    private showUpdateNotification(extensionUpdate: any, nativeUpdate: any): void {
        const notification = document.getElementById('update-notification');
        if (!notification) return;

        notification.classList.remove('hidden');

        // Create update modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 p-6">
                <div class="flex items-start gap-3 mb-4">
                    <span class="text-4xl">🎉</span>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Updates Available!</h2>
                        <p class="text-gray-600 dark:text-gray-400">New versions are ready to download</p>
                    </div>
                </div>

                <div class="space-y-4 mb-6">
                    ${extensionUpdate.hasUpdate ? `
                        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold text-blue-900 dark:text-blue-100">🔌 Extension Update</h3>
                                <span class="text-sm text-blue-600 dark:text-blue-400">
                                    v${extensionUpdate.currentVersion} → v${extensionUpdate.latestVersion}
                                </span>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                ${extensionUpdate.releaseNotes || 'New features and improvements available'}
                            </p>
                            <a href="${extensionUpdate.downloadUrl || 'https://github.com/ocentra/TabAgent/releases/latest'}" 
                               target="_blank"
                               class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
                                Download Extension Update
                            </a>
                        </div>
                    ` : ''}

                    ${nativeUpdate?.hasUpdate ? `
                        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                            <div class="flex items-center justify-between mb-2">
                                <h3 class="font-semibold text-purple-900 dark:text-purple-100">⚡ Native Host Update</h3>
                                <span class="text-sm text-purple-600 dark:text-purple-400">
                                    v${nativeUpdate.currentVersion} → v${nativeUpdate.latestVersion}
                                </span>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">
                                ${nativeUpdate.releaseNotes || 'Performance improvements and bug fixes'}
                            </p>
                            <a href="${nativeUpdate.downloadUrl || 'https://github.com/ocentra/TabAgentDist/releases/latest'}" 
                               target="_blank"
                               class="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors">
                                Download Native Host Update
                            </a>
                        </div>
                    ` : ''}
                </div>

                <div class="flex justify-end gap-3">
                    <button id="close-update-modal" 
                            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors">
                        Close
                    </button>
                    <a href="https://github.com/ocentra/TabAgent" 
                       target="_blank"
                       class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        View on GitHub
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal handlers
        const closeBtn = modal.querySelector('#close-update-modal');
        closeBtn?.addEventListener('click', () => {
            modal.remove();
            notification.classList.add('hidden');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                notification.classList.add('hidden');
            }
        });
    }

    public destroy(): void {
        // No cleanup needed since we don't create the container
    }
}

// Initialize footer on page load
let footerInstance: FooterComponent | null = null;

export function initializeFooter(): void {
    if (!footerInstance) {
        footerInstance = new FooterComponent();
    }
}

export function destroyFooter(): void {
    if (footerInstance) {
        footerInstance.destroy();
        footerInstance = null;
    }
}
