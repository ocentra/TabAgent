// src/Controllers/adapters/GoogleDriveAdapter.ts
import browser from 'webextension-polyfill';
import { RuntimeMessageTypes } from '../../events/eventNames';
import { FileItem } from '../FileBrowserDisplay';

const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export class GoogleDriveAdapter {
    private filesCache: Record<string, any[]> = {};
    private isFetching = false;

    async fetchFiles(folderId: string): Promise<FileItem[]> {
        if (this.isFetching) {
            return [];
        }

        this.isFetching = true;
        
        try {
            // Check cache first
            if (this.filesCache[folderId]) {
                this.isFetching = false;
                return this.convertDriveItemsToFileItems(this.filesCache[folderId]);
            }

            // Fetch from Google Drive API
            const response = await browser.runtime.sendMessage({
                type: RuntimeMessageTypes.GET_DRIVE_FILE_LIST,
                folderId: folderId
            });

            this.isFetching = false;

            if (response && response.success && response.files) {
                this.filesCache[folderId] = response.files;
                return this.convertDriveItemsToFileItems(response.files);
            } else {
                const errorMsg = response?.error || 'Unknown error fetching Google Drive files';
                throw new Error(errorMsg);
            }
        } catch (error) {
            this.isFetching = false;
            throw error;
        }
    }

    private convertDriveItemsToFileItems(driveItems: any[]): FileItem[] {
        return driveItems.map(item => ({
            id: item.id,
            name: item.name,
            type: item.mimeType === GOOGLE_FOLDER_MIME_TYPE ? 'folder' : 'file',
            mimeType: item.mimeType,
            size: item.size ? parseInt(item.size) : undefined,
            modifiedTime: item.modifiedTime,
            icon: item.iconLink,
            path: item.id // Use Google Drive ID as path
        }));
    }

    clearCache(): void {
        this.filesCache = {};
    }

    isFolder(item: FileItem): boolean {
        return item.type === 'folder';
    }

    getFolderId(item: FileItem): string {
        return item.id;
    }
}
