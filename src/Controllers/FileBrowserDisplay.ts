// src/Controllers/FileBrowserDisplay.ts
// Common file browser display logic for all sources

export interface FileItem {
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
    size?: number;
    modifiedTime?: string;
    icon?: string;
    path: string;
}

export interface BreadcrumbItem {
    id: string;
    name: string;
}

export interface FileBrowserCallbacks {
    onFileSelect: (fileId: string, selected: boolean) => void;
    onFolderNavigate: (folderId: string) => void;
    onBreadcrumbClick: (folderId: string, index: number) => void;
    onSearch: (query: string) => void;
}

export class FileBrowserDisplay {
    private container: HTMLElement;
    private callbacks: FileBrowserCallbacks;
    private selectedFiles: Set<string> = new Set();
    private breadcrumbs: BreadcrumbItem[] = [];
    private searchQuery: string = '';

    constructor(container: HTMLElement, callbacks: FileBrowserCallbacks) {
        this.container = container;
        this.callbacks = callbacks;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Search input
        const searchInput = this.container.querySelector('#attachment-search') as HTMLInputElement;
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = (e.target as HTMLInputElement).value;
                this.callbacks.onSearch(this.searchQuery);
            });
        }
    }

    renderFiles(files: FileItem[]): void {
        const fileBrowser = this.container.querySelector('#attachment-file-browser');
        if (!fileBrowser) return;

        // Filter files based on search query
        const filteredFiles = this.searchQuery
            ? files.filter(file => file.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
            : files;

        if (filteredFiles.length === 0) {
            fileBrowser.innerHTML = `
                <div class="p-4 text-center text-gray-500 dark:text-gray-400">
                    ${this.searchQuery ? 'No results found.' : 'No files found.'}
                </div>
            `;
            return;
        }

        fileBrowser.innerHTML = filteredFiles.map(file => this.createFileItemHTML(file)).join('');

        // Add event listeners to file items
        this.attachFileItemListeners(fileBrowser as HTMLElement, filteredFiles);
    }

    private createFileItemHTML(file: FileItem): string {
        const isSelected = this.selectedFiles.has(file.id);
        const icon = this.getFileIcon(file);
        const sizeInfo = file.type === 'file' && file.size ? `(${this.formatFileSize(file.size)})` : '';

        return `
            <div class="attachment-file-item flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}" data-file-id="${file.id}">
                <div class="flex items-center space-x-2 flex-1 min-w-0">
                    <span class="text-lg">${icon}</span>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm text-gray-800 dark:text-gray-200 truncate">${file.name}</div>
                        ${sizeInfo ? `<div class="text-xs text-gray-500 dark:text-gray-400">${sizeInfo}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-1">
                    ${file.type === 'file' ? `
                        <input type="checkbox" class="file-checkbox" data-file-id="${file.id}" ${isSelected ? 'checked' : ''}>
                    ` : ''}
                </div>
            </div>
        `;
    }

    private getFileIcon(file: FileItem): string {
        if (file.icon) {
            return `<img src="${file.icon}" alt="${file.type}" class="w-5 h-5">`;
        }
        
        if (file.type === 'folder') {
            return '📁';
        }
        
        // File type icons based on mime type
        if (file.mimeType) {
            if (file.mimeType.includes('pdf')) return '📄';
            if (file.mimeType.includes('image')) return '🖼️';
            if (file.mimeType.includes('video')) return '🎥';
            if (file.mimeType.includes('audio')) return '🎵';
            if (file.mimeType.includes('text')) return '📝';
            if (file.mimeType.includes('spreadsheet')) return '📊';
            if (file.mimeType.includes('presentation')) return '📽️';
        }
        
        return '📄';
    }

    private attachFileItemListeners(container: HTMLElement, files: FileItem[]): void {
        // File/folder click handlers
        container.querySelectorAll('.attachment-file-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.target as Element;
                if (target.classList.contains('file-checkbox')) return;

                const fileId = item.getAttribute('data-file-id');
                const file = files.find(f => f.id === fileId);

                if (file?.type === 'folder') {
                    this.callbacks.onFolderNavigate(file.id);
                }
            });
        });

        // Checkbox handlers
        container.querySelectorAll('.file-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const target = e.target as HTMLInputElement;
                const fileId = target.getAttribute('data-file-id');
                
                if (fileId) {
                    this.callbacks.onFileSelect(fileId, target.checked);
                }
            });
        });
    }

    setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
        this.breadcrumbs = breadcrumbs;
        this.renderBreadcrumbs();
    }

    private renderBreadcrumbs(): void {
        const breadcrumbContainer = this.container.querySelector('#breadcrumb-container');
        const breadcrumbsDiv = this.container.querySelector('#attachment-breadcrumbs');
        
        if (!breadcrumbContainer || !breadcrumbsDiv) return;

        if (this.breadcrumbs.length <= 1) {
            breadcrumbsDiv.classList.add('hidden');
            return;
        }

        breadcrumbsDiv.classList.remove('hidden');
        breadcrumbContainer.innerHTML = '';

        this.breadcrumbs.forEach((crumb, index) => {
            const isLast = index === this.breadcrumbs.length - 1;
            const crumbElement = document.createElement(isLast ? 'span' : 'button');
            crumbElement.textContent = crumb.name;
            crumbElement.dataset.id = crumb.id;
            crumbElement.dataset.index = String(index);

            if (!isLast) {
                crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer';
                crumbElement.addEventListener('click', () => {
                    this.callbacks.onBreadcrumbClick(crumb.id, index);
                });

                const separator = document.createElement('span');
                separator.textContent = ' / ';
                separator.className = 'mx-1 text-gray-400';
                breadcrumbContainer.appendChild(crumbElement);
                breadcrumbContainer.appendChild(separator);
            } else {
                crumbElement.className = 'font-semibold';
                breadcrumbContainer.appendChild(crumbElement);
            }
        });
    }

    selectFile(fileId: string, selected: boolean): void {
        if (selected) {
            this.selectedFiles.add(fileId);
        } else {
            this.selectedFiles.delete(fileId);
        }
        this.updateFileSelection(fileId, selected);
    }

    private updateFileSelection(fileId: string, selected: boolean): void {
        const fileItem = this.container.querySelector(`[data-file-id="${fileId}"]`);
        const checkbox = fileItem?.querySelector('.file-checkbox') as HTMLInputElement;
        
        if (fileItem) {
            if (selected) {
                fileItem.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
            } else {
                fileItem.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
            }
        }
        
        if (checkbox) {
            checkbox.checked = selected;
        }
    }

    getSelectedFiles(): string[] {
        return Array.from(this.selectedFiles);
    }

    clearSelection(): void {
        this.selectedFiles.clear();
        this.container.querySelectorAll('.attachment-file-item').forEach(item => {
            item.classList.remove('bg-blue-50', 'dark:bg-blue-900/20');
        });
        this.container.querySelectorAll('.file-checkbox').forEach(checkbox => {
            (checkbox as HTMLInputElement).checked = false;
        });
    }

    setLoading(loading: boolean): void {
        const fileBrowser = this.container.querySelector('#attachment-file-browser');
        if (!fileBrowser) return;

        if (loading) {
            fileBrowser.innerHTML = '<div class="p-4 text-center text-gray-500 dark:text-gray-400">Loading files...</div>';
        }
    }

    setError(message: string): void {
        const fileBrowser = this.container.querySelector('#attachment-file-browser');
        if (!fileBrowser) return;

        fileBrowser.innerHTML = `<div class="p-4 text-center text-red-500">${message}</div>`;
    }

    private formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}
