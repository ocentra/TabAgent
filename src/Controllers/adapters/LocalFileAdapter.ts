// src/Controllers/adapters/LocalFileAdapter.ts
import { FileItem } from '../FileBrowserDisplay';

// Simple local file adapter - just opens native file picker
export class LocalFileAdapter {
    private selectedFiles: File[] = [];
    
    // Supported file types for RAG/document processing
    private readonly ACCEPTED_TYPES = [
        '.pdf',
        '.txt', '.md', '.markdown',
        '.doc', '.docx',
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.json', '.csv',
        '.html', '.htm'
    ].join(',');

    async fetchFiles(path: string): Promise<FileItem[]> {
        // For local files, we always show a prompt to select files
        return [{
            id: 'select-files',
            name: '📁 Click here to select files from your computer',
            type: 'folder',
            mimeType: 'folder',
            size: 0,
            modifiedTime: new Date().toISOString(),
            path: 'select-files'
        }];
    }

    async openFilePicker(): Promise<File[]> {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = this.ACCEPTED_TYPES;
            
            input.onchange = (e: Event) => {
                const target = e.target as HTMLInputElement;
                const files = Array.from(target.files || []);
                
                if (files.length > 0) {
                    console.log(`LocalFileAdapter: Selected ${files.length} files`);
                    this.selectedFiles.push(...files);
                    resolve(files);
                } else {
                    resolve([]);
                }
                
                // Clean up
                input.remove();
            };
            
            input.oncancel = () => {
                console.log('LocalFileAdapter: File selection cancelled');
                resolve([]);
                input.remove();
            };
            
            // Trigger the file picker
            input.click();
        });
    }

    async getSelectedFiles(): Promise<FileItem[]> {
        return this.selectedFiles.map((file, index) => ({
            id: `local-${Date.now()}-${index}`,
            name: file.name,
            type: 'file',
            mimeType: file.type || this.getMimeType(file.name),
            size: file.size,
            modifiedTime: new Date(file.lastModified).toISOString(),
            path: file.name,
            _file: file // Store the actual File object for attachment conversion
        }));
    }

    private getMimeType(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();
        
        const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'md': 'text/markdown',
            'markdown': 'text/markdown',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'json': 'application/json',
            'csv': 'text/csv',
            'html': 'text/html',
            'htm': 'text/html'
        };

        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    isFolder(item: FileItem): boolean {
        return item.type === 'folder' || item.id === 'select-files';
    }

    getFolderId(item: FileItem): string {
        return item.id;
    }

    clearCache(): void {
        this.selectedFiles = [];
    }

    // Get file content for insertion
    async getFileContent(fileId: string, files: FileItem[]): Promise<File | null> {
        // Find the file in our selected files
        const fileItem = files.find(f => f.id === fileId);
        if (!fileItem) return null;
        
        const file = this.selectedFiles.find(f => f.name === fileItem.name);
        return file || null;
    }
}
