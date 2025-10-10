// src/Controllers/adapters/LocalFileAdapter.ts
import { FileItem } from '../FileBrowserDisplay';

export class LocalFileAdapter {
    private filesCache: Record<string, FileItem[]> = {};
    private currentDirectoryHandle: FileSystemDirectoryHandle | null = null;

    async fetchFiles(path: string): Promise<FileItem[]> {
        try {
            // Check cache first
            if (this.filesCache[path]) {
                return this.filesCache[path];
            }

            let files: FileItem[] = [];

            if (path === 'root' || path === '') {
                // Request directory access
                if (!this.currentDirectoryHandle) {
                    this.currentDirectoryHandle = await this.requestDirectoryAccess();
                }
                files = await this.readDirectory(this.currentDirectoryHandle);
            } else {
                // Navigate to specific folder
                const folderHandle = await this.getFolderHandle(path);
                files = await this.readDirectory(folderHandle);
            }

            this.filesCache[path] = files;
            return files;
        } catch (error) {
            console.error('LocalFileAdapter: Error fetching files:', error);
            throw error;
        }
    }

    private async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle> {
        if (!('showDirectoryPicker' in window)) {
            throw new Error('File System Access API not supported in this browser');
        }

        try {
            return await (window as any).showDirectoryPicker({
                mode: 'read'
            });
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw new Error('Directory access cancelled by user');
            }
            throw error;
        }
    }

    private async getFolderHandle(folderId: string): Promise<FileSystemDirectoryHandle> {
        // This would need to be implemented based on how we store folder references
        // For now, we'll need to maintain a mapping of folder IDs to handles
        throw new Error('Folder navigation not yet implemented');
    }

    private async readDirectory(directoryHandle: FileSystemDirectoryHandle): Promise<FileItem[]> {
        const files: FileItem[] = [];
        
        for await (const [name, handle] of (directoryHandle as any).entries()) {
            const isDirectory = handle.kind === 'directory';
            
            files.push({
                id: `${handle.name}_${Date.now()}`, // Generate unique ID
                name: name,
                type: isDirectory ? 'folder' : 'file',
                mimeType: isDirectory ? 'folder' : this.getMimeType(name),
                size: isDirectory ? undefined : await this.getFileSize(handle),
                modifiedTime: new Date().toISOString(), // File System API doesn't provide this easily
                path: name
            });
        }

        return files.sort((a, b) => {
            // Folders first, then files, both alphabetically
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }

    private getMimeType(filename: string): string {
        const extension = filename.split('.').pop()?.toLowerCase();
        
        const mimeTypes: Record<string, string> = {
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls': 'application/vnd.ms-excel',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'mp4': 'video/mp4',
            'mp3': 'audio/mpeg',
            'zip': 'application/zip',
            'json': 'application/json',
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript'
        };

        return mimeTypes[extension || ''] || 'application/octet-stream';
    }

    private async getFileSize(handle: FileSystemFileHandle): Promise<number> {
        try {
            const file = await handle.getFile();
            return file.size;
        } catch (error) {
            return 0;
        }
    }

    isFolder(item: FileItem): boolean {
        return item.type === 'folder';
    }

    getFolderId(item: FileItem): string {
        return item.id;
    }

    clearCache(): void {
        this.filesCache = {};
    }

    // Get file content for insertion
    async getFileContent(fileId: string, files: FileItem[]): Promise<File | null> {
        // TODO: Implement file content retrieval
        // This would require storing file handles or re-requesting access
        console.warn('File content retrieval not yet implemented for local files');
        return null;
    }
}
