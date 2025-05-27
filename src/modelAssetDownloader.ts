import browser from 'webextension-polyfill';
import { UIEventNames } from './events/eventNames';
import { sendDbRequestSmart } from './sidepanel';
import { Contexts } from './events/eventNames';
import { DbAddModelAssetRequest,      
     DbCreateAllFileManifestsForRepoRequest, 
     DbListModelFilesRequest, 
     DbUpdateManifestRequest } from './DB/dbEvents';
import { fetchModelMetadataInternal, filterAndValidateFilesInternal } from './Utilities/modelMetadata';
// @ts-ignore: If using JS/TS without types for spark-md5
import SparkMD5 from 'spark-md5';
import { ModelAssetManifest } from './DB/idbModelAsset';

// Constants
const prefix = '[Downloader]';
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_RETRIES = 3; // Max retries for fetch within streamAndStoreFileWithProgress
const PROGRESS_THROTTLE_MS = 1000;
const CHUNK_PROCESSED_FOR_PAUSE = 10;
const PAUSE_BYTES_THRESHOLD = 100 * 1024 * 1024; // 100MB
const LARGE_FILE_THRESHOLD = 500 * 1024 * 1024; // 500MB
const PAUSE_DURATION_MS = 200; // 200ms for normal files
const LARGE_FILE_PAUSE_DURATION_MS = 1000; // 1000ms for files >500MB
const LOG_GENERAL = true;
const LOG_CHUNK = LOG_GENERAL && true;
const LOG_MEMORY = LOG_GENERAL && false;
const LOG_ERROR = true;
const USE_MD5_CHECKSUM = false;


// --- Global State & Controller ---
interface GlobalDownloadQueueItem {
    manager: DownloadManager;
    filePlan: FilePlan;
    retries: number;
}

class GlobalDownloadController {
    private activeDownload: GlobalDownloadQueueItem | null = null;
    private queue: GlobalDownloadQueueItem[] = [];
    private static MAX_GLOBAL_RETRIES = 1; // Max retries for a file at the global queue level

    public requestDownload(manager: DownloadManager, filePlan: FilePlan) {
        if (this.queue.some(item => item.manager.modelId === manager.modelId && item.filePlan.manifest.id === filePlan.manifest.id) ||
            (this.activeDownload?.manager.modelId === manager.modelId && this.activeDownload?.filePlan.manifest.id === filePlan.manifest.id)) {
            if (LOG_GENERAL) console.log(prefix, `[GlobalController] File ${filePlan.manifest.fileName} for ${manager.modelId} already in global queue or active.`);
            return;
        }

        if (LOG_GENERAL) console.log(prefix, `[GlobalController] Queuing download for ${filePlan.manifest.fileName} from manager ${manager.modelId}`);
        this.queue.push({ manager, filePlan, retries: 0 });
        this.tryProcessNext();
    }

    private tryProcessNext() {
        if (this.activeDownload || this.queue.length === 0) {
            return;
        }
        this.activeDownload = this.queue.shift()!;
        if (LOG_GENERAL) console.log(prefix, `[GlobalController] Starting download for ${this.activeDownload.filePlan.manifest.fileName} from manager ${this.activeDownload.manager.modelId}`);

        sendUpdateToPopup(this.activeDownload.manager.modelId, {
            type: 'file_update',
            fileName: this.activeDownload.filePlan.manifest.fileName,
            status: 'downloading',
            progress: 0
        });

        this.activeDownload.manager.executeFileDownload(this.activeDownload.filePlan)
            .then(success => {
                if (LOG_GENERAL) console.log(prefix, `[GlobalController] Download finished for ${this.activeDownload!.filePlan.manifest.fileName} (manager ${this.activeDownload!.manager.modelId}). Success: ${success}`);
                this.notifyDownloadComplete(this.activeDownload!.manager, this.activeDownload!.filePlan, success);
            });
    }

    public notifyDownloadComplete(manager: DownloadManager, filePlan: FilePlan, success: boolean) {
        if (!this.activeDownload || this.activeDownload.manager.modelId !== manager.modelId || this.activeDownload.filePlan.manifest.id !== filePlan.manifest.id) {
            if (LOG_ERROR) console.error(prefix, `[GlobalController] Mismatched notifyDownloadComplete. Expected ${this.activeDownload?.filePlan.manifest.fileName} for ${this.activeDownload?.manager.modelId}, got ${filePlan.manifest.fileName} for ${manager.modelId}`);
            if (this.activeDownload && this.activeDownload.manager.modelId === manager.modelId) {
                 // If manager is the same but file different, it's an internal error in that manager.
                 // Mark current activeDownload as done to unblock queue.
            }
            this.activeDownload = null;
            this.tryProcessNext();
            return;
        }

        const completedItem = this.activeDownload;
        this.activeDownload = null;

        if (!success && completedItem.retries < GlobalDownloadController.MAX_GLOBAL_RETRIES) {
            completedItem.retries++;
            if (LOG_GENERAL) console.log(prefix, `[GlobalController] Re-queuing ${filePlan.manifest.fileName} for ${manager.modelId}, global attempt ${completedItem.retries + 1}`);
            this.queue.unshift(completedItem); // Add to front for immediate retry
        } else if (!success) {
             if (LOG_ERROR) console.error(prefix, `[GlobalController] Download failed permanently for ${filePlan.manifest.fileName} (manager ${manager.modelId}) after ${completedItem.retries + 1} global attempts.`);
        }
        this.tryProcessNext();
    }
}
const globalController = new GlobalDownloadController();
const downloadManagers: Map<string, DownloadManager> = new Map();
let globalPopupCallback: ((update: any) => void) | null = null;

export interface FilePlan {
    manifest: ModelAssetManifest;
    isONNX: boolean;
    fullDownloadUrl: string;
    fileIdx: number;
}

interface DownloadProgress {
    totalFiles: number;
    totalBytes: number;
    currentFileIndex: number;
    currentFile: string;
    currentFileSize: number;
    currentFileDownloaded: number;
    totalDownloaded: number;
    done: boolean;
    error: string | null;
    message?: string;
    filesSuccessfullyProcessedCount: number;
    totalFilesToAttempt: number;
    progress?: number;
}

interface BadChunkInfo {
    fileName: string;
    chunkIndex: number;
    reason: string;
    chunkLength?: number;
    payload?: any;
}

export interface FileState {
    status: 'unknown' | 'present' | 'queued' | 'downloading' | 'downloaded' | 'failed';
    progress: number;
}

class DownloadError extends Error {
    constructor(message: string, public context?: any) {
        super(message);
        this.name = 'DownloadError';
    }
}

class ProgressManager {
    private progress: DownloadProgress;
    private lastSentPercent: number = 0;
    private lastSentTime: number = 0;

    constructor(private managerModelId: string) {
        this.progress = this.createInitialState();
    }

    private createInitialState(): DownloadProgress {
        return {
            totalFiles: 0,
            totalBytes: 0,
            currentFileIndex: 0,
            currentFile: '',
            currentFileSize: 0,
            currentFileDownloaded: 0,
            totalDownloaded: 0,
            done: false,
            error: null,
            filesSuccessfullyProcessedCount: 0,
            totalFilesToAttempt: 0,
        };
    }

    reset() {
        this.progress = this.createInitialState();
        this.lastSentPercent = 0;
        this.lastSentTime = 0;
        if (LOG_GENERAL) console.log(prefix, `[${this.managerModelId}] ProgressManager reset`);
    }

    incrementTotalDownloaded(bytes: number) {
        this.progress.totalDownloaded += bytes;
    }

    updateProgress(update: Partial<DownloadProgress>) {
        this.progress = { ...this.progress, ...update };
        const percent = this.progress.totalBytes > 0
            ? Math.floor((this.progress.totalDownloaded / this.progress.totalBytes) * 100)
            : 0;
        this.progress.progress = percent;
        const now = Date.now();

        let message = '';
        if (this.progress.error) {
            message = `Error: ${this.progress.error}`;
        } else if (this.progress.done) {
            message = `Download complete: ${this.progress.filesSuccessfullyProcessedCount} of ${this.progress.totalFilesToAttempt} files. Total: ${formatBytes(this.progress.totalDownloaded)}.`;
        } else {
            message = `Downloading ${this.progress.currentFile || 'N/A'} (${formatBytes(this.progress.currentFileDownloaded)} of ${formatBytes(this.progress.currentFileSize)}) — Overall: ${formatBytes(this.progress.totalDownloaded)} of ${formatBytes(this.progress.totalBytes)} (${percent}%)`;
        }
        this.progress.message = message;

        const shouldSend = this.progress.done || this.progress.error || percent > this.lastSentPercent || now - this.lastSentTime >= PROGRESS_THROTTLE_MS;
        if (shouldSend) {
            sendUiGlobalProgress(this.managerModelId, this.progress);
            this.lastSentPercent = percent;
            this.lastSentTime = now;
            if (LOG_GENERAL && (this.progress.done || this.progress.error || this.progress.progress === 0 || this.progress.progress === 100 || (this.progress.progress && this.progress.progress % 10 === 0))) { // Throttle logging
                 console.log(prefix, `[${this.managerModelId}] Progress update sent: ${message}`);
            }
        }
    }

    getProgress(): Readonly<DownloadProgress> {
        return { ...this.progress };
    }
}

class DownloadManager {
    public modelId: string;
    private baseDownloadUrl: string;
    public filePlans: FilePlan[] = [];
    public fileStates: { [fileName: string]: FileState } = {};
    private localDownloadQueue: FilePlan[] = [];
    public nonOnnxTotalSize: number = 0;
    public nonOnnxDownloadedSize: number = 0;
    private successfullyProcessedCount: number = 0;
    private metadata: any = null;
    private progressManager: ProgressManager;
    public manifests: ModelAssetManifest[] = [];

    constructor(modelId: string, manifestsFromUI: ModelAssetManifest[] | null = null) {
        this.modelId = modelId;
        this.baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;
        this.progressManager = new ProgressManager(this.modelId);
        this.manifests = manifestsFromUI || [];
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] DownloadManager initialized.`);
    }

    async initAndProcessDownloads(selectedOnnxFile: string | null = null) {
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Initializing and processing downloads. Selected ONNX: ${selectedOnnxFile}`);
        this.resetInternalState();
        return this.fetchAndProcessManifests(selectedOnnxFile);
    }

    private resetInternalState() {
        this.filePlans = [];
        this.localDownloadQueue = [];
        this.nonOnnxTotalSize = 0;
        this.nonOnnxDownloadedSize = 0;
        this.successfullyProcessedCount = 0;
        this.metadata = null;
        this.progressManager.reset();
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Internal state reset for new operation.`);
    }

    private async fetchAndProcessManifests(selectedOnnxFile: string | null) {
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Fetching manifests.`);
        let req: any;
        let manifestResult: any;

        if (this.manifests.length > 0) {
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Using ${this.manifests.length} manifests provided from UI.`);
        } else {
            req = new DbListModelFilesRequest({ folder: this.modelId, returnObjects: true });
            manifestResult = await sendDbRequestSmart(req);
            this.manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Read ${this.manifests.length} manifests from DB.`);
        }

        if (this.manifests.length === 0) {
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] No manifests locally, fetching metadata from remote.`);
            try {
                this.metadata = await fetchModelMetadataInternal(this.modelId);
                if (!this.metadata) {
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Failed to fetch metadata.`);
                    throw new DownloadError("Failed to fetch metadata");
                }
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Fetched metadata.`, this.metadata);

                const { neededFileEntries, message: filterMessage } = await filterAndValidateFilesInternal(this.metadata, this.modelId, this.baseDownloadUrl);
                if (filterMessage || neededFileEntries.length === 0) {
                    const msg = filterMessage || `No usable files found for ${this.modelId}.`;
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] ${msg}`);
                    this.progressManager.updateProgress({ error: msg, done: true });
                    return { success: false, message: msg };
                }
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Filtered and validated ${neededFileEntries.length} files.`);

                const createReq = new DbCreateAllFileManifestsForRepoRequest(neededFileEntries);
                await sendDbRequestSmart(createReq);
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Stored manifests in DB.`);

                req = new DbListModelFilesRequest({ folder: this.modelId, returnObjects: true });
                manifestResult = await sendDbRequestSmart(req);
                this.manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Re-read ${this.manifests.length} manifests from DB.`);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Critical error fetching metadata:`, error);
                this.progressManager.updateProgress({ error: errMsg, done: true });
                return { success: false, error: `Download process failed for ${this.modelId}: ${errMsg}` };
            }
        }

        if (this.manifests.length === 0) {
            const msg = `No manifests available for ${this.modelId} after DB and remote fetch.`;
            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] ${msg}`);
            this.progressManager.updateProgress({ error: msg, done: true });
            return { success: false, message: msg };
        }

        return this.processManifests(selectedOnnxFile);
    }

    private async processManifests(selectedOnnxFile: string | null) {
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Processing ${this.manifests.length} manifests. Selected ONNX: ${selectedOnnxFile}`);
        const onnxFiles = this.manifests.filter(m => m.fileType === 'onnx');
        const nonOnnxFiles = this.manifests.filter(m => m.fileType !== 'onnx');
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Found ${onnxFiles.length} ONNX files and ${nonOnnxFiles.length} non-ONNX files`);

        let manifestsToPlan: ModelAssetManifest[];
        if (selectedOnnxFile && selectedOnnxFile !== 'all') {
            manifestsToPlan = [
                ...nonOnnxFiles,
                ...onnxFiles.filter(m => m.fileName === selectedOnnxFile)
            ];
        } else {
            manifestsToPlan = this.manifests;
        }
        
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Building download plan for ${manifestsToPlan.length} files.`);
        const { downloadPlan, totalBytesToDownload } = buildDownloadPlanInternal(manifestsToPlan);
        this.filePlans = downloadPlan; 

        const { initialStates, missingNonOnnx, nonOnnxTotal, nonOnnxPresent } = await getMissingFilesAndInitialStates(this.filePlans, this.modelId);
        this.fileStates = initialStates;
        this.nonOnnxTotalSize = nonOnnxTotal;
        this.nonOnnxDownloadedSize = nonOnnxPresent;
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Initial file states: ${Object.keys(initialStates).length} files, ${missingNonOnnx.length} missing non-ONNX files. Non-ONNX: ${formatBytes(nonOnnxPresent)} / ${formatBytes(nonOnnxTotal)} present.`);

        let initialOverallDownloadedBytes = 0;
        this.successfullyProcessedCount = 0;
        this.filePlans.forEach(plan => {
            if (this.fileStates[plan.manifest.fileName]?.status === 'present') {
                initialOverallDownloadedBytes += plan.manifest.size;
                this.successfullyProcessedCount++;
            }
        });

        this.progressManager.updateProgress({
            totalFiles: this.filePlans.length,
            totalBytes: totalBytesToDownload,
            totalFilesToAttempt: this.filePlans.length, 
            filesSuccessfullyProcessedCount: this.successfullyProcessedCount,
            totalDownloaded: initialOverallDownloadedBytes,
        });
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Download plan built: ${this.filePlans.length} files, ${formatBytes(totalBytesToDownload)}. Initial progress: ${this.successfullyProcessedCount} files / ${formatBytes(initialOverallDownloadedBytes)} already present.`);


        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Queueing ${missingNonOnnx.length} missing non-ONNX files for download.`);
        missingNonOnnx.forEach(file => {
            const fileStateStatus = this.fileStates[file.manifest.fileName]?.status;
            const isAlreadyHandled = fileStateStatus === 'present' || 
                                 fileStateStatus === 'downloaded' || 
                                 fileStateStatus === 'queued' || 
                                 fileStateStatus === 'downloading';
            if (!isAlreadyHandled) {
                this.requestFileDownload(file);
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Requested non-ONNX file: ${file.manifest.fileName}`);
            }
        });

        const onnxFilePlansInCurrentScope = this.filePlans.filter(p => p.isONNX);

        if (onnxFilePlansInCurrentScope.length === 1) {
            const singleOnnxPlan = onnxFilePlansInCurrentScope[0];
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Single ONNX file in scope: ${singleOnnxPlan.manifest.fileName}`);
            const fileStateStatus = this.fileStates[singleOnnxPlan.manifest.fileName]?.status;
            const isAlreadyHandled = fileStateStatus === 'present' || 
                                 fileStateStatus === 'downloaded' || 
                                 fileStateStatus === 'queued' || 
                                 fileStateStatus === 'downloading';
            if (!isAlreadyHandled) {
                this.requestFileDownload(singleOnnxPlan);
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Requested single ONNX file: ${singleOnnxPlan.manifest.fileName}`);
            }
        } else if (onnxFilePlansInCurrentScope.length > 1) {
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Multiple ONNX files (${onnxFilePlansInCurrentScope.length}) in scope.`);
            if (!selectedOnnxFile || selectedOnnxFile === 'all') { 
                this.progressManager.updateProgress({ 
                    currentFile: '',
                    currentFileDownloaded: 0,
                });
                if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Showing ONNX selection popup.`);
                
                const currentNonOnnxPlans = this.filePlans.filter(p => !p.isONNX);
                let nonOnnxStatusForPopup = 'unknown';
                if (currentNonOnnxPlans.length > 0) {
                    const allNonOnnxPresent = currentNonOnnxPlans.every(p => {
                        const s = this.fileStates[p.manifest.fileName]?.status;
                        return s === 'present' || s === 'downloaded';
                    });
                    const anyNonOnnxDownloading = currentNonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'downloading');
                    const anyNonOnnxQueued = currentNonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'queued');
                    const anyNonOnnxFailed = currentNonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'failed');

                    if (allNonOnnxPresent) nonOnnxStatusForPopup = 'present';
                    else if (anyNonOnnxDownloading) nonOnnxStatusForPopup = 'downloading';
                    else if (anyNonOnnxQueued) nonOnnxStatusForPopup = 'queued';
                    else if (anyNonOnnxFailed) nonOnnxStatusForPopup = 'failed';
                    else nonOnnxStatusForPopup = 'pending'; 
                } else {
                    nonOnnxStatusForPopup = 'no_files'; 
                }

                let nonOnnxProgressForPopup = 0;
                if (this.nonOnnxTotalSize > 0) { 
                    nonOnnxProgressForPopup = Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100);
                } else if (currentNonOnnxPlans.length === 0) {
                    nonOnnxProgressForPopup = 100; 
                }

                if (window.showOnnxSelectionPopup) {
                    window.showOnnxSelectionPopup(
                        this.modelId, 
                        onnxFilePlansInCurrentScope, 
                        this.filePlans, 
                        this.fileStates, 
                        nonOnnxProgressForPopup,
                        nonOnnxStatusForPopup,
                        (filePlan: FilePlan) => this.handleUserFileRequestFromPopup(filePlan)
                    );
                }
                return { success: true, message: "Multiple ONNX files, popup shown for user selection." };
            } else { 
                const planToDownload = onnxFilePlansInCurrentScope.find(p => p.manifest.fileName === selectedOnnxFile);
                if (planToDownload) {
                    if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Pre-selected ONNX file: ${selectedOnnxFile}`);
                    const fileStateStatus = this.fileStates[planToDownload.manifest.fileName]?.status;
                    const isAlreadyHandled = fileStateStatus === 'present' || 
                                         fileStateStatus === 'downloaded' || 
                                         fileStateStatus === 'queued' || 
                                         fileStateStatus === 'downloading';
                    if (!isAlreadyHandled) {
                        this.requestFileDownload(planToDownload);
                        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Requested pre-selected ONNX file: ${selectedOnnxFile}`);
                    }
                } else {
                     if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Selected ONNX file (${selectedOnnxFile}) not found in current plan manifests.`);
                }
            }
        }
        this.checkRepoCompletion();
        return { success: true, message: "Model manifests processed and UI notified." };
    }

    public requestFileDownload(filePlan: FilePlan) {
        const existingState = this.fileStates[filePlan.manifest.fileName]?.status;
        if (existingState === 'present' || existingState === 'downloaded' || existingState === 'queued' || existingState === 'downloading') {
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] File ${filePlan.manifest.fileName} already handled (status: ${existingState}). Ignoring request.`);
            return;
        }

        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Requesting file download via GlobalController: ${filePlan.manifest.fileName}`);
        this.localDownloadQueue.push(filePlan);
        this.fileStates[filePlan.manifest.fileName] = { status: 'queued', progress: 0 };
        sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: filePlan.manifest.fileName, status: 'queued', progress: 0 });
        this.progressManager.updateProgress({}); 
        globalController.requestDownload(this, filePlan);
    }

    public async executeFileDownload(filePlan: FilePlan): Promise<boolean> {
        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Executing download for: ${filePlan.manifest.fileName}`);
        this.fileStates[filePlan.manifest.fileName] = { status: 'downloading', progress: 0 };
        sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: filePlan.manifest.fileName, status: 'downloading', progress: 0 });

        if (!filePlan.isONNX) {
            const nonOnnxProgressPercent = this.nonOnnxTotalSize > 0 ? Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100) : (this.filePlans.filter(p => !p.isONNX).length > 0 ? 0 : 100);
            sendUpdateToPopup(this.modelId, { type: 'non_onnx_update', status: 'downloading', progress: nonOnnxProgressPercent });
        }

        this.progressManager.updateProgress({
            currentFile: filePlan.manifest.fileName,
            currentFileSize: filePlan.manifest.size,
            currentFileDownloaded: 0,
        });

        const badChunks: BadChunkInfo[] = [];
        const result = await this._modified_streamAndStoreFileWithProgress(filePlan, badChunks);

        if (result.fileFailed || result.badChunkFound) {
            this.fileStates[filePlan.manifest.fileName] = { status: 'failed', progress: this.fileStates[filePlan.manifest.fileName]?.progress || 0 };
            sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: filePlan.manifest.fileName, status: 'failed', progress: this.fileStates[filePlan.manifest.fileName].progress });
            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Download failed for ${filePlan.manifest.fileName}.`);
            this.progressManager.updateProgress({ error: `Failed ${filePlan.manifest.fileName}` });
            this.checkRepoCompletion();
            return false;
        } else {
            this.fileStates[filePlan.manifest.fileName] = { status: 'downloaded', progress: 100 };
            sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: filePlan.manifest.fileName, status: 'downloaded', progress: 100 });
            this.successfullyProcessedCount++;
            this.progressManager.updateProgress({ filesSuccessfullyProcessedCount: this.successfullyProcessedCount });
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Successfully downloaded ${filePlan.manifest.fileName}`);

            await this.updateManifestStatusInDb(filePlan, 'complete');

            if (!filePlan.isONNX) {
                const nonOnnxProgressPercent = this.nonOnnxTotalSize > 0 ? Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100) : (this.filePlans.filter(p => !p.isONNX).length > 0 ? 0 : 100);
                sendUpdateToPopup(this.modelId, { type: 'non_onnx_update', status: nonOnnxProgressPercent === 100 ? 'downloaded' : 'downloading', progress: nonOnnxProgressPercent });
                const allNonOnnxProcessedForThisRepo = this.filePlans
                    .filter(p => !p.isONNX)
                    .every(p => this.fileStates[p.manifest.fileName]?.status === 'downloaded' || this.fileStates[p.manifest.fileName]?.status === 'present');
                if (allNonOnnxProcessedForThisRepo) {
                    sendUpdateToPopup(this.modelId, { type: 'all_non_onnx_complete' });
                    if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] All non-ONNX files processed.`);
                }
            }
            this.checkRepoCompletion();
            return true;
        }
    }
    private async _modified_streamAndStoreFileWithProgress(filePlan: FilePlan, badChunks: BadChunkInfo[]): Promise<{ fileFailed: boolean; fileName: string; fileBytesDownloaded: number; fileChunksDownloaded: number; badChunkFound: boolean }> {
        const { manifest, isONNX } = filePlan;
        let fileBytesDownloaded = 0;
        let fileChunksDownloaded = 0;
        let fileFailed = false;
        let badChunkFound = false;
        let chunkIndex = 0;
        const allChunksSuccess = true; 
        let bytesSinceLastPause = 0;
        const chunkGroupId = `${this.modelId}/${manifest.fileName}`;
        const isLargeFile = manifest.size > LARGE_FILE_THRESHOLD;
        const pauseDuration = isLargeFile ? LARGE_FILE_PAUSE_DURATION_MS : PAUSE_DURATION_MS;

        if (LOG_MEMORY) logMemory(`[${this.modelId}] Before file ${manifest.fileName}`);

        try {
            let attempt = 0;
            let response: Response | null = null;
            while (attempt < MAX_RETRIES) { 
                try {
                    response = await fetch(filePlan.fullDownloadUrl);
                    if (response.ok) break;
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Fetch attempt ${attempt + 1} failed for ${manifest.fileName}: ${response.status} ${response.statusText}`);
                    attempt++;
                    if (attempt < MAX_RETRIES) await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
                } catch (error) {
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Fetch error for ${manifest.fileName} on attempt ${attempt + 1}:`, error);
                    attempt++;
                     if (attempt < MAX_RETRIES) await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
                }
            }
            if (!response || !response.ok) {
                const errorText = response ? await response.text() : 'No response';
                throw new DownloadError(`[${this.modelId}] Failed to download ${manifest.fileName}: ${response?.status} ${response?.statusText}`, { errorText });
            }
            if (!response.body) throw new DownloadError(`[${this.modelId}] Download response body is null for ${manifest.fileName}`);

            const reader = response.body.getReader();
            let buffer = new Uint8Array(CHUNK_SIZE);
            let bufferOffset = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!(value instanceof Uint8Array)) {
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Invalid chunk data for ${manifest.fileName}, chunk ${chunkIndex}: Type ${typeof value}`);
                    badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Invalid chunk data type', payload: value });
                    fileFailed = true; badChunkFound = true; reader.cancel('Invalid chunk data'); break;
                }

                let valueOffset = 0;
                while (valueOffset < value.length) {
                    const remainingBuffer = CHUNK_SIZE - bufferOffset;
                    const copyLength = Math.min(remainingBuffer, value.length - valueOffset);
                    buffer.set(value.subarray(valueOffset, valueOffset + copyLength), bufferOffset);
                    bufferOffset += copyLength;
                    valueOffset += copyLength;

                    if (bufferOffset === CHUNK_SIZE) {
                        const chunkToStore = buffer;
                        buffer = new Uint8Array(CHUNK_SIZE); 
                        bufferOffset = 0;

                        if (!manifest.fileName || typeof chunkIndex !== 'number' || !chunkToStore || chunkToStore.byteLength === 0) {
                            const reason = !manifest.fileName ? 'Missing fileName' : typeof chunkIndex !== 'number' ? 'Invalid chunkIndex' : !chunkToStore ? 'Missing chunkToStore' : 'Empty chunk';
                            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Bad chunk for ${manifest.fileName}, chunk ${chunkIndex}: ${reason}, Length: ${chunkToStore?.byteLength || 0}`);
                            badChunks.push({ fileName: manifest.fileName, chunkIndex, reason, chunkLength: chunkToStore?.byteLength, payload: { fileName: manifest.fileName, chunkIndex, chunkToStore } });
                            badChunkFound = true; fileFailed = true; reader.cancel('Bad chunk detected'); break;
                        }
                        
                        const chunkArrayBuffer = chunkToStore.buffer.slice(chunkToStore.byteOffset, chunkToStore.byteOffset + chunkToStore.byteLength);
                        const dbPayload = {
                            folder: this.modelId, modelId: this.modelId, fileName: manifest.fileName, fileType: manifest.fileType,
                            data: chunkArrayBuffer, chunkIndex, totalChunks: manifest.totalChunks, chunkGroupId,
                            binarySize: chunkToStore.byteLength, totalFileSize: manifest.size,
                            checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(chunkArrayBuffer) : 'na',
                        };
                        const success = await tryStoreChunkInternal(dbPayload); 
                        if (!success) {
                            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Failed to store chunk ${chunkIndex} for ${manifest.fileName} after retries.`);
                            badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Failed to store chunk after retries', chunkLength: chunkToStore.byteLength, payload: dbPayload });
                            badChunkFound = true; fileFailed = true; reader.cancel('Chunk storage failed'); break;
                        }

                        const bytesInThisChunk = chunkToStore.byteLength;
                        fileBytesDownloaded += bytesInThisChunk;
                        bytesSinceLastPause += bytesInThisChunk;
                        fileChunksDownloaded++;

                        this.progressManager.incrementTotalDownloaded(bytesInThisChunk); 
                        this.progressManager.updateProgress({ currentFileDownloaded: fileBytesDownloaded }); 

                        const currentFileProgressPercent = manifest.size > 0 ? Math.floor((fileBytesDownloaded / manifest.size) * 100) : 100;
                        if (this.fileStates[manifest.fileName]) {
                           this.fileStates[manifest.fileName].progress = currentFileProgressPercent;
                        } else {
                            if(LOG_ERROR) console.error(prefix, `[${this.modelId}] FileState for ${manifest.fileName} not found during chunk processing! Initializing.`);
                            this.fileStates[manifest.fileName] = {status: 'downloading', progress: currentFileProgressPercent };
                        }
                        sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: manifest.fileName, status: 'downloading', progress: currentFileProgressPercent });

                        if (!isONNX) { this.nonOnnxDownloadedSize += bytesInThisChunk; }

                        if (LOG_CHUNK && (chunkIndex === 0 || chunkIndex === manifest.totalChunks - 1 || chunkIndex % 10 === 0 )) {
                            console.log(prefix, `[${this.modelId}] Stored chunk ${chunkIndex} for ${manifest.fileName}, bytes: ${bytesInThisChunk}, total downloaded for file: ${fileBytesDownloaded}`);
                        }
                        chunkIndex++;
                        if (chunkIndex % CHUNK_PROCESSED_FOR_PAUSE === 0 || bytesSinceLastPause >= PAUSE_BYTES_THRESHOLD) {
                            if (LOG_MEMORY) logMemory(`[${this.modelId}] Pausing after chunk ${chunkIndex} for ${manifest.fileName}`);
                            await new Promise(res => setTimeout(res, pauseDuration));
                            bytesSinceLastPause = 0;
                        }
                    }
                }
                if (fileFailed || badChunkFound) break; 
            } 

            if (allChunksSuccess && !fileFailed && bufferOffset > 0) { 
                const finalChunkToStore = buffer.subarray(0, bufferOffset);

                if (!manifest.fileName || typeof chunkIndex !== 'number' || !finalChunkToStore || finalChunkToStore.byteLength === 0) {
                    const reason = !manifest.fileName ? 'Missing fileName' : typeof chunkIndex !== 'number' ? 'Invalid chunkIndex' : !finalChunkToStore ? 'Missing finalChunkToStore' : 'Empty final chunk';
                    if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Bad final chunk for ${manifest.fileName}, chunk ${chunkIndex}: ${reason}, Length: ${finalChunkToStore?.byteLength || 0}`);
                    badChunks.push({ fileName: manifest.fileName, chunkIndex, reason, chunkLength: finalChunkToStore?.byteLength, payload: { fileName: manifest.fileName, chunkIndex, finalChunkToStore } });
                    badChunkFound = true; fileFailed = true;
                } else {
                    const finalChunkArrayBuffer = finalChunkToStore.buffer.slice(finalChunkToStore.byteOffset, finalChunkToStore.byteOffset + finalChunkToStore.byteLength);
                    const dbPayload = {
                        folder: this.modelId, modelId: this.modelId, fileName: manifest.fileName, fileType: manifest.fileType,
                        data: finalChunkArrayBuffer, chunkIndex, totalChunks: manifest.totalChunks, chunkGroupId, 
                        binarySize: finalChunkToStore.byteLength, totalFileSize: manifest.size,
                        checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(finalChunkArrayBuffer) : 'na',
                    };
                    const success = await tryStoreChunkInternal(dbPayload);
                    if (!success) {
                        if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Failed to store final chunk ${chunkIndex} for ${manifest.fileName}`);
                        badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Failed to store final chunk', chunkLength: finalChunkToStore.byteLength, payload: dbPayload });
                        badChunkFound = true; fileFailed = true;
                    } else {
                        const bytesInThisChunk = finalChunkToStore.byteLength;
                        fileBytesDownloaded += bytesInThisChunk;
                        fileChunksDownloaded++;
                        this.progressManager.incrementTotalDownloaded(bytesInThisChunk);
                        this.progressManager.updateProgress({ currentFileDownloaded: fileBytesDownloaded });
                        if(this.fileStates[manifest.fileName]) {
                           this.fileStates[manifest.fileName].progress = 100;
                        } else {
                             if(LOG_ERROR) console.error(prefix, `[${this.modelId}] FileState for ${manifest.fileName} not found at final chunk! Initializing.`);
                             this.fileStates[manifest.fileName] = {status: 'downloading', progress: 100 };
                        }
                        sendUpdateToPopup(this.modelId, { type: 'file_update', fileName: manifest.fileName, status: 'downloading', progress: 100 }); 
                        if (!isONNX) { this.nonOnnxDownloadedSize += bytesInThisChunk; }
                        if (LOG_CHUNK) console.log(prefix, `[${this.modelId}] Stored final chunk ${chunkIndex} for ${manifest.fileName}, bytes: ${bytesInThisChunk}, total downloaded for file: ${fileBytesDownloaded}`);
                    }
                }
            }
            if (manifest.size > LARGE_FILE_THRESHOLD) await new Promise(res => setTimeout(res, pauseDuration)); 
            if (LOG_MEMORY) logMemory(`[${this.modelId}] After file ${manifest.fileName}`);

        } catch (error) { 
            fileFailed = true;
            const errMsg = error instanceof Error ? error.message : String(error);
            const context = error instanceof DownloadError ? error.context : null;
            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Download stream error for ${this.modelId}/${manifest.fileName}: ${errMsg}`, context ? `Context: ${JSON.stringify(context)}` : '');
        }
        return { fileFailed: fileFailed || badChunkFound, fileName: manifest.fileName, fileBytesDownloaded, fileChunksDownloaded, badChunkFound };
    }


    public handleUserFileRequestFromPopup(filePlan: FilePlan) {
        if (filePlan.manifest.folder !== this.modelId) {
             if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Popup request for file ${filePlan.manifest.fileName} belonging to different model ${filePlan.manifest.folder}. Ignored.`);
             return;
        }
        if (!this.filePlans.some(p => p.manifest.id === filePlan.manifest.id)) {
            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Popup request for file ${filePlan.manifest.fileName} not in current filePlans. Ignored.`);
            return;
        }

        if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] User requested download for ${filePlan.manifest.fileName} from popup.`);
        this.requestFileDownload(filePlan);
    }

    private checkRepoCompletion() {
        if (this.filePlans.length === 0) {
            this.progressManager.updateProgress({
                done: true,
                error: null,
                message: `No files to process for ${this.modelId}.`
            });
            return;
        }

        const allFilesForThisRepoProcessed = this.filePlans.every(p => {
            const status = this.fileStates[p.manifest.fileName]?.status;
            return status === 'downloaded' || status === 'present' || status === 'failed';
        });

        if (allFilesForThisRepoProcessed) {
            const anyFailed = this.filePlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'failed');
            const finalMessage = !anyFailed
                ? `All files for ${this.modelId} processed successfully.`
                : `Some files for ${this.modelId} failed to download.`;

            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Repo completion check: ${finalMessage}`);
            sendUpdateToPopup(this.modelId, { type: 'repo_complete', modelId: this.modelId, success: !anyFailed, finalMessage });
            
            this.progressManager.updateProgress({
                done: true,
                error: anyFailed ? "Some files failed" : null,
            });
        }
    }
    private async updateManifestStatusInDb(filePlan: FilePlan, status: string) {
        try {
            await sendDbRequestSmart(new DbUpdateManifestRequest(filePlan.manifest.id, { status, updatedAt: Date.now() }));
            if (LOG_GENERAL) console.log(prefix, `[${this.modelId}] Updated manifest status in DB for ${filePlan.manifest.fileName} to ${status}`);
        } catch (e) {
            if (LOG_ERROR) console.log(prefix, `[${this.modelId}] Failed to update manifest status in DB for ${filePlan.manifest.fileName}:`, e);
        }
    }
}

function getOrCreateDownloadManager(modelId: string, manifestsFromUI: ModelAssetManifest[] | null = null): DownloadManager {
    if (!downloadManagers.has(modelId)) {
        if (LOG_GENERAL) console.log(prefix, `Creating new DownloadManager for ${modelId}`);
        const newManager = new DownloadManager(modelId, manifestsFromUI);
        downloadManagers.set(modelId, newManager);
        return newManager;
    }
    const existingManager = downloadManagers.get(modelId)!;
    if (manifestsFromUI && manifestsFromUI.length > 0) {
        if (LOG_GENERAL) console.log(prefix, `[${modelId}] Updating manifests for existing manager from UI provided data.`);
        existingManager.manifests = manifestsFromUI;
    } else if (manifestsFromUI && manifestsFromUI.length === 0 && existingManager.manifests.length > 0) {
        if (LOG_GENERAL) console.log(prefix, `[${modelId}] Empty manifestsFromUI provided, existing manager will clear its current set if it proceeds with fetch.`);
        existingManager.manifests = [];
    }
    return existingManager;
}

export async function downloadModelAssets(
    modelId: string,
    selectedOnnxFile: string | null = null,
    manifestsFromUI: ModelAssetManifest[] | null = null
) {
    if (!modelId) {
        if (LOG_ERROR) console.error(prefix, "downloadModelAssets called with no modelId");
        const errorMsg = "No modelId provided for download.";
        return { success: false, message: errorMsg, error: errorMsg };
    }
    const manager = getOrCreateDownloadManager(modelId, manifestsFromUI);
    return manager.initAndProcessDownloads(selectedOnnxFile);
}

export function registerPopupCallbacks(callback: (update: any) => void) {
    globalPopupCallback = callback;
    if (LOG_GENERAL) console.log(prefix, 'Registered global popup callback.');
}


function sendUpdateToPopup(modelId: string, update: any) {
    if (typeof globalPopupCallback === 'function') {
        const updateWithModelId = { ...update, modelId };
        globalPopupCallback(updateWithModelId);
        const isProgressUpdate = update.type === 'file_update' && typeof update.progress === 'number';
        const logThisUpdate = !isProgressUpdate || update.progress === 0 || update.progress === 100 || update.status === 'failed' || update.status === 'downloaded' || update.status === 'queued';

        if (LOG_GENERAL && logThisUpdate) {
             console.log(prefix, `Sent popup update for ${modelId}: type ${update.type}, file ${update.fileName || 'N/A'}, status ${update.status || 'N/A'}`);
        }
    }
}

export function handleUserFileRequestFromPopup(modelId: string, filePlan: FilePlan) {
    const manager = downloadManagers.get(modelId);
    if (manager) {
        manager.handleUserFileRequestFromPopup(filePlan);
    } else {
        if (LOG_ERROR) console.error(prefix, `No DownloadManager found for ${modelId} to handle popup request for ${filePlan.manifest.fileName}`);
    }
}

function sendUiGlobalProgress(managerModelId: string, payload: DownloadProgress) {
    const payloadWithModelId = { ...payload, modelId: managerModelId };
    if (typeof window !== 'undefined' && (window as any).EXTENSION_CONTEXT === Contexts.MAIN_UI) {
        document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_DOWNLOAD_PROGRESS, { detail: payloadWithModelId }));
    } else {
        try {
            browser.runtime.sendMessage({
                type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                payload: payloadWithModelId
            }).catch((e: any) => {
                if (LOG_ERROR && !e.message?.includes("Receiving end does not exist")) {
                     console.log(prefix, `Error sending MODEL_DOWNLOAD_PROGRESS for ${managerModelId}: ${e.message}`);
                }
            });
        } catch (e: any) {
             if (LOG_ERROR && !e.message?.includes("Extension context invalidated")) {
                 console.log(prefix, `Error dispatching MODEL_DOWNLOAD_PROGRESS for ${managerModelId}: ${e.message}`);
            }
        }
    }
    if (LOG_GENERAL && (payload.done || payload.error || (payload.progress && (payload.progress === 0 || payload.progress === 100 || payload.progress % 10 === 0)))) {
        console.log(prefix, `Sent UI global progress for ${managerModelId}: ${payload.message}`);
    }
}

function logMemory(label: string) {
    if (!LOG_MEMORY) return;
    if (typeof performance !== 'undefined' && (performance as any).memory) {
        const usedMB = ((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = ((performance as any).memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`${prefix} [Memory][${label}] Used: ${usedMB} MB / Total: ${totalMB} MB`);
    } else {
        console.log(`${prefix} [Memory][${label}] performance.memory not available`);
    }
}

async function tryStoreChunkInternal(payload: any, maxRetries = MAX_RETRIES) {
    let attempt = 0;
    while (attempt < maxRetries) {
        const req = new DbAddModelAssetRequest(payload);
        const addResult = await sendDbRequestSmart(req);
        if (addResult && addResult.success) return true;
        attempt++;
        if (LOG_CHUNK) console.log(prefix, `Retrying chunk store, attempt ${attempt} for ${payload.fileName} chunk ${payload.chunkIndex}`);
        if (attempt < maxRetries) await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
    }
    return false;
}

function buildDownloadPlanInternal(manifests: ModelAssetManifest[]): { downloadPlan: FilePlan[]; totalBytesToDownload: number; totalChunksToDownload: number } {
    const downloadPlan = manifests.map((entry, idx) => ({
        manifest: entry,
        isONNX: entry.fileType === 'onnx',
        fullDownloadUrl: buildFullDownloadUrl(entry.folder, entry.fileName),
        fileIdx: idx + 1,
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum, f) => sum + f.manifest.size, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum, f) => sum + f.manifest.totalChunks, 0);
    if (LOG_GENERAL) console.log(prefix, `Built download plan with ${downloadPlan.length} files, ${totalBytesToDownload} bytes, ${totalChunksToDownload} chunks`);
    return { downloadPlan, totalBytesToDownload, totalChunksToDownload };
}

async function getMissingFilesAndInitialStates(downloadPlan: FilePlan[], modelId: string): Promise<{ initialStates: { [fileName: string]: FileState }; missingNonOnnx: FilePlan[]; nonOnnxTotal: number; nonOnnxPresent: number }> {
    const initialStates: { [fileName: string]: FileState } = {};
    const missingNonOnnxFiles: FilePlan[] = [];
    let nonOnnxTotalBytes = 0;
    let nonOnnxPresentBytes = 0;

    for (const plan of downloadPlan) {
        initialStates[plan.manifest.fileName] = { status: 'unknown', progress: 0 };

        let isPresent = false;
        if (plan.manifest.status === 'complete' || plan.manifest.status === 'present') {
            isPresent = true;
        }

        console.log(`[DEBUG][PresenceCheck] ${plan.manifest.fileName}: manifest status=`, plan.manifest.status, 'isPresent=', isPresent);

        if (isPresent) {
            initialStates[plan.manifest.fileName] = { status: 'present', progress: 100 };
            if (!plan.isONNX) {
                nonOnnxPresentBytes += plan.manifest.size;
            }
        } else if (!plan.isONNX) {
            missingNonOnnxFiles.push(plan);
        }
        if (!plan.isONNX) {
            nonOnnxTotalBytes += plan.manifest.size;
        }
    }
    if (LOG_GENERAL) console.log(prefix, `[${modelId}] Initial states computed: ${missingNonOnnxFiles.length} missing non-ONNX files, ${nonOnnxPresentBytes} bytes present out of ${nonOnnxTotalBytes}`);
    return { initialStates, missingNonOnnx: missingNonOnnxFiles, nonOnnxTotal: nonOnnxTotalBytes, nonOnnxPresent: nonOnnxPresentBytes };
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function checksumChunkMD5(arrayBuffer: ArrayBuffer): string {
    return SparkMD5.ArrayBuffer.hash(arrayBuffer);
}

function buildFullDownloadUrl(modelId: string, fileName: string): string {
    if (/^https?:\/\//.test(fileName)) return fileName;
    return `https://huggingface.co/${modelId}/resolve/main/${fileName}`.replace(/([^:])\/\/+/, '$1/');
}

async function ensureManagerForModel(modelId: string): Promise<DownloadManager> {
    let manager = downloadManagers.get(modelId);
    if (!manager) {
        // Try to fetch manifests from DB
        const req = new DbListModelFilesRequest({ folder: modelId, returnObjects: true });
        const manifestResult = await sendDbRequestSmart(req);
        const manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
        manager = new DownloadManager(modelId, manifests);
        downloadManagers.set(modelId, manager);
        // Optionally, initialize fileStates here
        await manager.initAndProcessDownloads(null); // or a lighter version that doesn't start downloads
    }
    return manager;
}

// Exported function to update the ONNX selection popup for a given repo if open
export async function updateRepoPopupState(modelId: string) {
    if (typeof window === 'undefined' || !window.showOnnxSelectionPopup) return;
    console.log('[updateRepoPopupState] Updating popup state for modelId:', modelId);

    let manager = downloadManagers.get(modelId);
    console.log('[updateRepoPopupState] Manager:', manager);
    if (!manager) {
        manager = await ensureManagerForModel(modelId);
    }
    // Only update if popup is open
    const modal = document.getElementById && document.getElementById('onnx-selection-modal');
    if (!modal || modal.classList.contains('hidden')) return;

    // Gather current ONNX and non-ONNX state from the manager
    const onnxFilePlansInCurrentScope = manager.filePlans.filter(p => p.isONNX);
    const allFilePlans = manager.filePlans;
    const fileStates = manager.fileStates;
    // Compute non-ONNX progress and status as in processManifests
    const currentNonOnnxPlans = allFilePlans.filter(p => !p.isONNX);
    let nonOnnxStatusForPopup = 'unknown';
    if (currentNonOnnxPlans.length > 0) {
        const allNonOnnxPresent = currentNonOnnxPlans.every(p => {
            const s = fileStates[p.manifest.fileName]?.status;
            return s === 'present' || s === 'downloaded';
        });
        const anyNonOnnxDownloading = currentNonOnnxPlans.some(p => fileStates[p.manifest.fileName]?.status === 'downloading');
        const anyNonOnnxQueued = currentNonOnnxPlans.some(p => fileStates[p.manifest.fileName]?.status === 'queued');
        const anyNonOnnxFailed = currentNonOnnxPlans.some(p => fileStates[p.manifest.fileName]?.status === 'failed');
        if (allNonOnnxPresent) nonOnnxStatusForPopup = 'present';
        else if (anyNonOnnxDownloading) nonOnnxStatusForPopup = 'downloading';
        else if (anyNonOnnxQueued) nonOnnxStatusForPopup = 'queued';
        else if (anyNonOnnxFailed) nonOnnxStatusForPopup = 'failed';
        else nonOnnxStatusForPopup = 'pending';
    } else {
        nonOnnxStatusForPopup = 'no_files';
    }
    let nonOnnxProgressForPopup = 0;
    if (manager.nonOnnxTotalSize > 0) {
        nonOnnxProgressForPopup = Math.floor((manager.nonOnnxDownloadedSize / manager.nonOnnxTotalSize) * 100);
    } else if (currentNonOnnxPlans.length === 0) {
        nonOnnxProgressForPopup = 100;
    }

    // Always update popup content to reflect the current repo
    if (onnxFilePlansInCurrentScope.length === 0) {
        if (window.hideOnnxSelectionPopup) window.hideOnnxSelectionPopup();
        return;
    }
    // Show the popup with the current ONNX file(s), even if only one
    window.showOnnxSelectionPopup(
        modelId,
        onnxFilePlansInCurrentScope,
        allFilePlans,
        fileStates,
        nonOnnxProgressForPopup,
        nonOnnxStatusForPopup,
        (filePlan) => manager.handleUserFileRequestFromPopup(filePlan)
    );
}

