// src/Controllers/adapters/BaseAdapter.ts
import { FileItem } from '../FileBrowserDisplay';

export interface BaseAdapter {
    fetchFiles(path: string): Promise<FileItem[]>;
    isFolder(item: FileItem): boolean;
    getFolderId(item: FileItem): string;
    clearCache(): void;
}

export interface FileContentAdapter extends BaseAdapter {
    getFileContent(fileId: string, files: FileItem[]): Promise<File | Blob | null>;
}
