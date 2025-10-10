/**
 * Full Screen Component Template
 * 
 * A reusable template for creating full-screen overlay components in the extension.
 * Since we can't create new HTML files, this generates the layout dynamically.
 * 
 * Usage:
 * const template = new FullScreenTemplate('My Component', {
 *   headerContent: 'Custom Header Content',
 *   bodyContent: 'Custom Body Content', 
 *   footerButtons: [{ text: 'Save', action: () => {}, primary: true }]
 * });
 * 
 * template.show();
 * template.hide();
 */

export interface FullScreenTemplateConfig {
    id?: string;
    title: string;
    subtitle?: string;
    headerContent?: string | HTMLElement;
    bodyContent?: string | HTMLElement;
    footerContent?: string | HTMLElement;
    footerButtons?: Array<{
        id: string;
        text: string;
        icon?: string; // SVG or icon class
        action: () => void;
        primary?: boolean;
        disabled?: boolean;
        hidden?: boolean;
    }>;
    showFooter?: boolean;
    showHeader?: boolean;
    bodyClass?: string; // Custom CSS classes for body
    headerClass?: string; // Custom CSS classes for header
    footerClass?: string; // Custom CSS classes for footer
    overlayClass?: string; // Custom CSS classes for overlay
    onShow?: () => void;
    onHide?: () => void;
    onDestroy?: () => void;
}

export class FullScreenTemplate {
    private config: FullScreenTemplateConfig;
    private overlayElement: HTMLElement | null = null;
    private isVisible: boolean = false;

    constructor(config: FullScreenTemplateConfig) {
        this.config = {
            id: `fullscreen-${Date.now()}`,
            showHeader: true,
            showFooter: true,
            ...config
        };
    }

    /**
     * Create the full-screen overlay structure
     */
    private createOverlay(): HTMLElement {
        const overlay = document.createElement('div');
        overlay.id = this.config.id!;
        overlay.className = `fixed inset-0 bg-gray-900 dark:bg-gray-900 z-50 hidden flex flex-col ${this.config.overlayClass || ''}`;
        
        // Header (optional)
        if (this.config.showHeader) {
            const header = document.createElement('div');
            header.className = `flex items-center justify-between px-3 py-2 bg-gray-800 dark:bg-gray-800 border-b border-gray-700 ${this.config.headerClass || ''}`;
            
            const titleContainer = document.createElement('div');
            titleContainer.className = 'flex flex-col';
            
            const title = document.createElement('h3');
            title.className = 'text-sm font-medium text-gray-200';
            title.textContent = this.config.title;
            titleContainer.appendChild(title);
            
            if (this.config.subtitle) {
                const subtitle = document.createElement('p');
                subtitle.className = 'text-xs text-gray-400';
                subtitle.textContent = this.config.subtitle;
                titleContainer.appendChild(subtitle);
            }
            
            header.appendChild(titleContainer);
            
            // Add custom header content if provided
            if (this.config.headerContent) {
                const customHeader = document.createElement('div');
                if (typeof this.config.headerContent === 'string') {
                    customHeader.innerHTML = this.config.headerContent;
                } else {
                    customHeader.appendChild(this.config.headerContent);
                }
                header.appendChild(customHeader);
            }
            
            overlay.appendChild(header);
        }
        
        // Body
        const body = document.createElement('div');
        body.className = `flex-1 overflow-hidden ${this.config.bodyClass || 'p-2'}`;
        
        if (this.config.bodyContent) {
            if (typeof this.config.bodyContent === 'string') {
                body.innerHTML = this.config.bodyContent;
            } else {
                body.appendChild(this.config.bodyContent);
            }
        } else {
            body.innerHTML = '<div class="text-gray-400 text-center py-8">No content provided</div>';
        }
        
        overlay.appendChild(body);
        
        // Footer (optional)
        if (this.config.showFooter && (this.config.footerButtons?.length || this.config.footerContent)) {
            const footer = document.createElement('div');
            footer.className = `flex justify-between items-center px-3 py-2 bg-gray-800 dark:bg-gray-800 border-t border-gray-700 ${this.config.footerClass || ''}`;
            
            // Footer content
            if (this.config.footerContent) {
                const footerContent = document.createElement('div');
                if (typeof this.config.footerContent === 'string') {
                    footerContent.innerHTML = this.config.footerContent;
                } else {
                    footerContent.appendChild(this.config.footerContent);
                }
                footer.appendChild(footerContent);
            }
            
            // Footer buttons
            if (this.config.footerButtons && this.config.footerButtons.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.className = 'flex gap-2';
                
                this.config.footerButtons.forEach(buttonConfig => {
                    if (buttonConfig.hidden) return;
                    
                    const button = document.createElement('button');
                    button.id = buttonConfig.id;
                    button.className = `px-3 py-1.5 rounded text-sm flex items-center gap-1.5 ${
                        buttonConfig.primary 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`;
                    
                    if (buttonConfig.icon) {
                        if (buttonConfig.icon.includes('<svg')) {
                            button.innerHTML = buttonConfig.icon + ' ' + buttonConfig.text;
                        } else {
                            const icon = document.createElement('span');
                            icon.className = buttonConfig.icon;
                            button.appendChild(icon);
                            button.appendChild(document.createTextNode(' ' + buttonConfig.text));
                        }
                    } else {
                        button.textContent = buttonConfig.text;
                    }
                    
                    button.disabled = buttonConfig.disabled || false;
                    
                    button.addEventListener('click', () => {
                        buttonConfig.action();
                    });
                    
                    buttonContainer.appendChild(button);
                });
                
                footer.appendChild(buttonContainer);
            }
            
            overlay.appendChild(footer);
        }
        
        return overlay;
    }

    /**
     * Show the full-screen overlay
     */
    public show(): void {
        if (this.isVisible) return;
        
        // Remove existing overlay if it exists
        this.destroy();
        
        // Create and show new overlay
        this.overlayElement = this.createOverlay();
        document.body.appendChild(this.overlayElement);
        
        // Show with animation
        requestAnimationFrame(() => {
            if (this.overlayElement) {
                this.overlayElement.classList.remove('hidden');
                this.isVisible = true;
                
                // Call onShow callback
                if (this.config.onShow) {
                    this.config.onShow();
                }
            }
        });
    }

    /**
     * Hide the full-screen overlay
     */
    public hide(): void {
        if (!this.isVisible || !this.overlayElement) return;
        
        this.overlayElement.classList.add('hidden');
        this.isVisible = false;
        
        // Call onHide callback
        if (this.config.onHide) {
            this.config.onHide();
        }
    }

    /**
     * Toggle visibility
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update button state
     */
    public updateButton(buttonId: string, updates: { text?: string; disabled?: boolean }): void {
        if (!this.overlayElement) return;
        
        const button = this.overlayElement.querySelector(`#${buttonId}`) as HTMLButtonElement;
        if (button) {
            if (updates.text !== undefined) button.textContent = updates.text;
            if (updates.disabled !== undefined) button.disabled = updates.disabled;
        }
    }

    /**
     * Update body content
     */
    public updateBodyContent(content: string | HTMLElement): void {
        if (!this.overlayElement) return;
        
        const body = this.overlayElement.querySelector('.flex-1') as HTMLElement;
        if (body) {
            body.innerHTML = '';
            if (typeof content === 'string') {
                body.innerHTML = content;
            } else {
                body.appendChild(content);
            }
        }
    }

    /**
     * Get body element for direct manipulation
     */
    public getBodyElement(): HTMLElement | null {
        if (!this.overlayElement) return null;
        return this.overlayElement.querySelector('.flex-1') as HTMLElement;
    }

    /**
     * Get header element for direct manipulation
     */
    public getHeaderElement(): HTMLElement | null {
        if (!this.overlayElement) return null;
        return this.overlayElement.querySelector('div:first-child') as HTMLElement;
    }

    /**
     * Get footer element for direct manipulation
     */
    public getFooterElement(): HTMLElement | null {
        if (!this.overlayElement) return null;
        return this.overlayElement.querySelector('div:last-child') as HTMLElement;
    }

    /**
     * Update title
     */
    public updateTitle(newTitle: string): void {
        if (!this.overlayElement) return;
        
        const titleElement = this.overlayElement.querySelector('h3');
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    /**
     * Update subtitle
     */
    public updateSubtitle(newSubtitle: string): void {
        if (!this.overlayElement) return;
        
        let subtitleElement = this.overlayElement.querySelector('p.text-xs.text-gray-400');
        if (!subtitleElement && newSubtitle) {
            // Create subtitle if it doesn't exist
            const titleContainer = this.overlayElement.querySelector('.flex.flex-col');
            if (titleContainer) {
                subtitleElement = document.createElement('p');
                subtitleElement.className = 'text-xs text-gray-400';
                titleContainer.appendChild(subtitleElement);
            }
        }
        
        if (subtitleElement) {
            subtitleElement.textContent = newSubtitle;
        }
    }

    /**
     * Destroy the overlay and clean up
     */
    public destroy(): void {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
            this.overlayElement = null;
            this.isVisible = false;
            
            // Call onDestroy callback
            if (this.config.onDestroy) {
                this.config.onDestroy();
            }
        }
    }

    /**
     * Check if overlay is currently visible
     */
    public isShowing(): boolean {
        return this.isVisible;
    }
}

/**
 * Convenience function to create a textarea-based full screen component
 * (like our current compose message functionality)
 */
export function createTextareaFullScreen(
    title: string,
    placeholder: string = 'Enter text...',
    onSend?: (text: string) => void,
    onMinimize?: () => void
): FullScreenTemplate {
    
    const textarea = document.createElement('textarea');
    textarea.className = 'w-full h-full p-3 border-0 bg-gray-900 dark:bg-gray-900 text-gray-100 resize-none focus:outline-none focus:ring-0 overflow-y-auto';
    textarea.style.minHeight = '200px';
    textarea.style.maxHeight = 'calc(100vh - 120px)';
    textarea.placeholder = placeholder;

    const template = new FullScreenTemplate({
        title,
        bodyContent: textarea,
        footerButtons: [
            {
                id: 'minimize-btn',
                text: 'Minimize',
                action: () => {
                    if (onMinimize) onMinimize();
                    template.hide();
                }
            },
            {
                id: 'send-btn',
                text: 'Send',
                icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>',
                action: () => {
                    if (onSend) onSend(textarea.value);
                    template.hide();
                },
                primary: true,
                disabled: true
            }
        ],
        onShow: () => {
            textarea.focus();
        }
    });

    // Auto-enable/disable send button based on text content
    textarea.addEventListener('input', () => {
        template.updateButton('send-btn', { disabled: textarea.value.trim() === '' });
    });

    return template;
}

/**
 * Convenience function to create a file browser full screen component
 * (like Google Drive viewer)
 */
export function createFileBrowserFullScreen(
    title: string,
    subtitle?: string,
    onClose?: () => void,
    onInsert?: (selectedFiles: any[]) => void
): FullScreenTemplate {
    
    // Create file browser structure
    const browserContainer = document.createElement('div');
    browserContainer.className = 'flex flex-col h-full';
    
    // Breadcrumbs
    const breadcrumbs = document.createElement('div');
    breadcrumbs.className = 'mb-2 text-xs text-gray-600 dark:text-gray-400';
    breadcrumbs.innerHTML = '<span id="breadcrumb-container">Root</span>';
    
    // Search bar
    const searchBar = document.createElement('div');
    searchBar.className = 'mb-3';
    searchBar.innerHTML = '<input type="text" id="file-search" placeholder="Search files..." class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"/>';
    
    // Selected files counter
    const counter = document.createElement('div');
    counter.className = 'mb-3 text-xs text-gray-600 dark:text-gray-400';
    counter.innerHTML = 'Selected: <span id="selected-count">0</span> files';
    
    // File list
    const fileList = document.createElement('div');
    fileList.id = 'file-browser-list';
    fileList.className = 'flex-1 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2 min-h-[200px]';
    fileList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Select a source to browse files.</div>';
    
    browserContainer.appendChild(breadcrumbs);
    browserContainer.appendChild(searchBar);
    browserContainer.appendChild(counter);
    browserContainer.appendChild(fileList);

    const template = new FullScreenTemplate({
        title,
        subtitle,
        bodyContent: browserContainer,
        bodyClass: 'p-2',
        footerButtons: [
            {
                id: 'cancel-btn',
                text: 'Cancel',
                action: () => {
                    if (onClose) onClose();
                    template.hide();
                }
            },
            {
                id: 'insert-btn',
                text: 'Insert',
                action: () => {
                    // Get selected files logic would go here
                    if (onInsert) onInsert([]);
                    template.hide();
                },
                primary: true,
                disabled: true
            }
        ]
    });

    return template;
}
