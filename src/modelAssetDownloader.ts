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
const MAX_RETRIES = 3;
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

// Custom error class
class DownloadError extends Error {
    constructor(message: string, public context?: any) {
        super(message);
        this.name = 'DownloadError';
    }
}

// ProgressManager class
class ProgressManager {
    private progress: DownloadProgress;
    private lastSentPercent: number = 0;
    private lastSentTime: number = 0;

    constructor() {
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
        if (LOG_GENERAL) console.log(prefix, 'ProgressManager reset');
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
            sendUiGlobalProgress(this.progress);
            this.lastSentPercent = percent;
            this.lastSentTime = now;
            if (LOG_GENERAL) console.log(prefix, `Progress update sent: ${message}`);
        }
    }

    getProgress(): Readonly<DownloadProgress> {
        return { ...this.progress };
    }
}

// DownloadManager class
class DownloadManager {
    private modelId: string;
    private baseDownloadUrl: string;
    private filePlans: FilePlan[] = [];
    private fileStates: { [fileName: string]: FileState } = {};
    private downloadQueue: FilePlan[] = [];
    private activeDownloadFileName: string | null = null;
    private isDownloaderBusy: boolean = false;
    private nonOnnxTotalSize: number = 0;
    private nonOnnxDownloadedSize: number = 0;
    private successfullyProcessedCount: number = 0;
    private metadata: any = null;
    private progressManager: ProgressManager;
    private manifests: ModelAssetManifest[] = [];

    constructor(modelId: string, manifestsFromUI: ModelAssetManifest[] | null = null) {
        this.modelId = modelId;
        this.baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;
        this.progressManager = new ProgressManager();
        this.manifests = manifestsFromUI || [];
        if (LOG_GENERAL) console.log(prefix, `DownloadManager initialized for modelId: ${modelId}`);
    }

    async downloadModelAssets(selectedOnnxFile: string | null = null) {
        if (LOG_GENERAL) console.log(prefix, `Starting download for modelId: ${this.modelId}, selectedOnnxFile: ${selectedOnnxFile}`);
        this.reset();
        return this.fetchAndProcessManifests(selectedOnnxFile);
    }

    private reset() {
        this.filePlans = [];
        this.fileStates = {};
        this.downloadQueue = [];
        this.activeDownloadFileName = null;
        this.isDownloaderBusy = false;
        this.nonOnnxTotalSize = 0;
        this.nonOnnxDownloadedSize = 0;
        this.successfullyProcessedCount = 0;
        this.metadata = null;
        this.progressManager.reset();
        this.manifests = [];
        if (LOG_GENERAL) console.log(prefix, `Reset state for modelId: ${this.modelId}`);
    }

    private async fetchAndProcessManifests(selectedOnnxFile: string | null) {
        if (LOG_GENERAL) console.log(prefix, `Fetching manifests for modelId: ${this.modelId}`);
        let req: any;
        let manifestResult: any;
        if (this.manifests.length > 0) {
            if (LOG_GENERAL) console.log(prefix, 'Using manifests provided from UI:', this.manifests);
        } else {
            req = new DbListModelFilesRequest({ folder: this.modelId, returnObjects: true });
            manifestResult = await sendDbRequestSmart(req);
            this.manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
            if (LOG_GENERAL) console.log(prefix, 'Read back manifests from DB:', this.manifests);
        }

        if (this.manifests.length === 0) {
            if (LOG_GENERAL) console.log(prefix, `No manifests found in DB, fetching metadata from remote for modelId: ${this.modelId}`);
            try {
                this.metadata = await fetchModelMetadataInternal(this.modelId);
                if (!this.metadata) {
                    if (LOG_ERROR) console.log(prefix, `Failed to fetch metadata for modelId: ${this.modelId}`);
                    throw new DownloadError("Failed to fetch metadata");
                }
                if (LOG_GENERAL) console.log(prefix, `Fetched metadata for modelId: ${this.modelId}`, this.metadata);

                const { neededFileEntries, message: filterMessage } = await filterAndValidateFilesInternal(this.metadata, this.modelId, this.baseDownloadUrl);
                if (filterMessage || neededFileEntries.length === 0) {
                    const msg = filterMessage || `No usable files found for ${this.modelId}.`;
                    if (LOG_ERROR) console.log(prefix, msg);
                    this.progressManager.updateProgress({ error: msg, done: true });
                    return { success: false, message: msg };
                }
                if (LOG_GENERAL) console.log(prefix, `Filtered and validated files for modelId: ${this.modelId}`, neededFileEntries);

                const createReq = new DbCreateAllFileManifestsForRepoRequest(neededFileEntries);
                await sendDbRequestSmart(createReq);
                if (LOG_GENERAL) console.log(prefix, `Stored manifests in DB for modelId: ${this.modelId}`);

                req = new DbListModelFilesRequest({ folder: this.modelId, returnObjects: true });
                manifestResult = await sendDbRequestSmart(req);
                this.manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
                if (LOG_GENERAL) console.log(prefix, 'Read back manifests from DB:', this.manifests);
            } catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                if (LOG_ERROR) console.log(prefix, `Critical error fetching metadata for ${this.modelId}:`, error);
                this.progressManager.updateProgress({ error: errMsg, done: true });
                return { success: false, error: `Download process failed for ${this.modelId}: ${errMsg}` };
            }
        }

        if (this.manifests.length === 0) {
            const msg = `No manifests available for ${this.modelId} after DB and remote fetch.`;
            if (LOG_ERROR) console.log(prefix, msg);
            this.progressManager.updateProgress({ error: msg, done: true });
            return { success: false, message: msg };
        }

        return this.processManifests(selectedOnnxFile);
    }

    private async processManifests(selectedOnnxFile: string | null) {
        if (LOG_GENERAL) console.log(prefix, `Separating ONNX and non-ONNX files for modelId: ${this.modelId}`);
        const onnxFiles = this.manifests.filter(m => m.fileType === 'onnx');
        const nonOnnxFiles = this.manifests.filter(m => m.fileType !== 'onnx');
        if (LOG_GENERAL) console.log(prefix, `Found ${onnxFiles.length} ONNX files and ${nonOnnxFiles.length} non-ONNX files`);

        let manifestsToPlan: ModelAssetManifest[];
        if (selectedOnnxFile && selectedOnnxFile !== 'all') {
            manifestsToPlan = [
                ...nonOnnxFiles,
                ...onnxFiles.filter(m => m.fileName === selectedOnnxFile)
            ];
        } else {
            manifestsToPlan = this.manifests;
        }
        
        if (LOG_GENERAL) console.log(prefix, `Building download plan for modelId: ${this.modelId} with ${manifestsToPlan.length} files (filtered by selectedOnnxFile:`, selectedOnnxFile, ")");
        const { downloadPlan, totalBytesToDownload } = buildDownloadPlanInternal(manifestsToPlan);
        this.filePlans = downloadPlan;
        this.progressManager.updateProgress({
            totalFiles: this.filePlans.length,
            totalBytes: totalBytesToDownload,
            totalFilesToAttempt: this.filePlans.length,
            filesSuccessfullyProcessedCount: 0,
            totalDownloaded: 0,
        });
        if (LOG_GENERAL) console.log(prefix, `Download plan built: ${this.filePlans.length} files, ${totalBytesToDownload} bytes`);

        const { initialStates, missingNonOnnx, nonOnnxTotal, nonOnnxPresent } = await getMissingFilesAndInitialStates(this.filePlans, this.modelId);
        this.fileStates = initialStates;
        this.nonOnnxTotalSize = nonOnnxTotal;
        this.nonOnnxDownloadedSize = nonOnnxPresent;
        if (LOG_GENERAL) console.log(prefix, `Initial file states: ${Object.keys(initialStates).length} files, ${missingNonOnnx.length} missing non-ONNX files`);

        let initialOverallDownloadedBytes = 0;
        this.filePlans.forEach(plan => {
            if (this.fileStates[plan.manifest.fileName]?.status === 'present') {
                initialOverallDownloadedBytes += plan.manifest.size;
                this.successfullyProcessedCount++;
            }
        });
        this.progressManager.updateProgress({ totalDownloaded: initialOverallDownloadedBytes, filesSuccessfullyProcessedCount: this.successfullyProcessedCount });
        if (LOG_GENERAL) console.log(prefix, `Initial progress: ${initialOverallDownloadedBytes} bytes downloaded, ${this.successfullyProcessedCount} files processed`);

        if (LOG_GENERAL) console.log(prefix, `Queueing non-ONNX files for download for modelId: ${this.modelId}`);
        missingNonOnnx.forEach(file => {
            if (this.fileStates[file.manifest.fileName]?.status !== 'present' && this.fileStates[file.manifest.fileName]?.status !== 'queued') {
                this.queueFileForDownload(file);
                if (LOG_GENERAL) console.log(prefix, `Queued non-ONNX file: ${file.manifest.fileName}`);
            }
        });
        this.processDownloadQueue();
        if (LOG_GENERAL) console.log(prefix, 'Started non-ONNX download queue processing');

        if (onnxFiles.length === 1) {
            if (LOG_GENERAL) console.log(prefix, `Single ONNX file detected for modelId: ${this.modelId}`);
            if (onnxFiles[0].status !== 'present' && onnxFiles[0].status !== 'complete') {
                const plan = this.filePlans.find(p => p.manifest.fileName === onnxFiles[0].fileName);
                if (plan) {
                    this.queueFileForDownload(plan);
                    this.processDownloadQueue();
                    if (LOG_GENERAL) console.log(prefix, `Queued single ONNX file: ${onnxFiles[0].fileName}`);
                    return { success: true, message: "Only one ONNX file, started download automatically." };
                }
            }
        } else if (onnxFiles.length > 1) {
            if (LOG_GENERAL) console.log(prefix, `Multiple ONNX files detected for modelId: ${this.modelId}`);
            if (!selectedOnnxFile || selectedOnnxFile === 'all') {
                this.progressManager.updateProgress({
                    done: false,
                    message: "Waiting for user to select a file...",
                    totalFiles: this.filePlans.length,
                    totalBytes: totalBytesToDownload,
                    currentFile: '',
                    currentFileDownloaded: 0,
                    totalDownloaded: initialOverallDownloadedBytes,
                    filesSuccessfullyProcessedCount: this.successfullyProcessedCount,
                    totalFilesToAttempt: this.filePlans.length,
                });
                if (LOG_GENERAL) console.log(prefix, 'Showing ONNX selection popup due to multiple ONNX files');
                const onnxFilesForPopup = this.filePlans.filter(p => p.isONNX);
                // Compute non-ONNX status and progress for popup
                const nonOnnxPlans = this.filePlans.filter(p => !p.isONNX);
                let nonOnnxStatus = 'unknown';
                if (nonOnnxPlans.length > 0) {
                    const allPresent = nonOnnxPlans.every(p => {
                        const s = this.fileStates[p.manifest.fileName]?.status;
                        return s === 'present' || s === 'downloaded';
                    });
                    const anyDownloading = nonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'downloading');
                    const anyQueued = nonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'queued');
                    const anyFailed = nonOnnxPlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'failed');
                    if (allPresent) nonOnnxStatus = 'present';
                    else if (anyDownloading) nonOnnxStatus = 'downloading';
                    else if (anyQueued) nonOnnxStatus = 'queued';
                    else if (anyFailed) nonOnnxStatus = 'failed';
                }
                let nonOnnxProgress = 0;
                if (this.nonOnnxTotalSize > 0) {
                    nonOnnxProgress = Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100);
                }
                if (window.showOnnxSelectionPopup) {
                    window.showOnnxSelectionPopup(
                        onnxFilesForPopup,
                        this.filePlans,
                        this.fileStates,
                        nonOnnxProgress,
                        nonOnnxStatus,
                        (filePlan: FilePlan) => this.handleUserFileRequestFromPopup(filePlan)
                    );
                }
                return { success: true, message: "Multiple ONNX files, popup shown for user selection." };
            } else {
                const selectedOnnx = onnxFiles.find(f => f.fileName === selectedOnnxFile);
                if (selectedOnnx && selectedOnnx.status !== 'present' && selectedOnnx.status !== 'complete') {
                    const plan = this.filePlans.find(p => p.manifest.fileName === selectedOnnx.fileName);
                    if (plan) {
                        this.queueFileForDownload(plan);
                        this.processDownloadQueue();
                        if (LOG_GENERAL) console.log(prefix, `Queued selected ONNX file: ${selectedOnnxFile}`);
                        return { success: true, message: `Selected ONNX (${selectedOnnxFile}) queued for download.` };
                    }
                } else if (!selectedOnnx) {
                    if (LOG_ERROR) console.log(prefix, `Selected ONNX file (${selectedOnnxFile}) not found in manifests`);
                    return { success: false, message: `Selected ONNX file (${selectedOnnxFile}) not found in manifests.` };
                }
            }
        }

        return { success: true, message: "Model manifests processed and UI notified." };
    }

    private queueFileForDownload(filePlan: FilePlan) {
        const fullDownloadUrl = buildFullDownloadUrl(this.modelId, filePlan.manifest.fileName);
        if (LOG_GENERAL) console.log(prefix, `Queuing file: ${filePlan.manifest.fileName}, Full URL: ${fullDownloadUrl}`);
        this.downloadQueue.push({ ...filePlan, fullDownloadUrl });
        this.fileStates[filePlan.manifest.fileName] = { status: 'queued', progress: 0 };
        sendUpdateToPopup({ type: 'file_update', fileName: filePlan.manifest.fileName, status: 'queued', progress: 0 });
    }

    private async processDownloadQueue() {
        if (this.isDownloaderBusy || this.downloadQueue.length === 0) {
            if (!this.isDownloaderBusy && this.downloadQueue.length === 0 && this.modelId) {
                const allDone = this.filePlans.every(p => this.fileStates[p.manifest.fileName]?.status === 'downloaded' || this.fileStates[p.manifest.fileName]?.status === 'present');
                const anyFailed = this.filePlans.some(p => this.fileStates[p.manifest.fileName]?.status === 'failed');
                if (this.filePlans.length > 0 && (allDone || anyFailed)) {
                    const finalMessage = allDone ? `All files for ${this.modelId} processed successfully.` : `Some files for ${this.modelId} failed to download.`;
                    if (LOG_GENERAL) console.log(prefix, `Download queue empty and downloader not busy. ${finalMessage}`);
                    sendUpdateToPopup({ type: 'all_downloads_complete', success: allDone && !anyFailed, finalMessage });
                    this.progressManager.updateProgress({
                        done: true,
                        filesSuccessfullyProcessedCount: this.successfullyProcessedCount,
                        totalFilesToAttempt: this.filePlans.length,
                        error: anyFailed ? "Some files failed" : null,
                    });
                }
            }
            return;
        }

        this.isDownloaderBusy = true;
        const filePlan = this.downloadQueue.shift()!;
        if (LOG_GENERAL) console.log(prefix, `Dequeued file for download: ${filePlan.manifest.fileName}`);
        this.activeDownloadFileName = filePlan.manifest.fileName;
        this.fileStates[filePlan.manifest.fileName] = { status: 'downloading', progress: 0 };
        sendUpdateToPopup({ type: 'file_update', fileName: filePlan.manifest.fileName, status: 'downloading', progress: 0 });

        if (!filePlan.isONNX) {
            const nonOnnxProgressPercent = this.nonOnnxTotalSize > 0 ? Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100) : 100;
            sendUpdateToPopup({ type: 'non_onnx_update', status: 'downloading', progress: nonOnnxProgressPercent });
        }

        this.progressManager.updateProgress({
            currentFile: filePlan.manifest.fileName,
            currentFileSize: filePlan.manifest.size,
            currentFileDownloaded: 0,
            totalFilesToAttempt: this.filePlans.length,
        });

        const badChunks: BadChunkInfo[] = [];
        const result = await this.streamAndStoreFileWithProgress(filePlan, badChunks);
        if (result.fileFailed || result.badChunkFound) {
            this.fileStates[filePlan.manifest.fileName] = { status: 'failed', progress: this.fileStates[filePlan.manifest.fileName].progress };
            sendUpdateToPopup({ type: 'file_update', fileName: filePlan.manifest.fileName, status: 'failed', progress: this.fileStates[filePlan.manifest.fileName].progress });
            if (LOG_ERROR) console.log(prefix, `Download failed for ${filePlan.manifest.fileName}. Bad chunks:`, badChunks, 'Error details:', result.fileFailed ? 'General failure' : 'Bad chunk detected');
            this.progressManager.updateProgress({ error: `Failed ${filePlan.manifest.fileName}` });
        } else {
            this.fileStates[filePlan.manifest.fileName] = { status: 'downloaded', progress: 100 };
            sendUpdateToPopup({ type: 'file_update', fileName: filePlan.manifest.fileName, status: 'downloaded', progress: 100 });
            this.successfullyProcessedCount++;
            this.progressManager.updateProgress({ filesSuccessfullyProcessedCount: this.successfullyProcessedCount });
            if (LOG_GENERAL) console.log(prefix, `Successfully downloaded ${filePlan.manifest.fileName}`);

            // Update manifest status in DB
            await this.updateManifestStatusInDb(filePlan, 'complete');

            if (!filePlan.isONNX) {
                const nonOnnxProgressPercent = this.nonOnnxTotalSize > 0 ? Math.floor((this.nonOnnxDownloadedSize / this.nonOnnxTotalSize) * 100) : 100;
                sendUpdateToPopup({ type: 'non_onnx_update', status: nonOnnxProgressPercent === 100 ? 'downloaded' : 'downloading', progress: nonOnnxProgressPercent });
                const allNonOnnxProcessed = this.filePlans
                    .filter(p => !p.isONNX)
                    .every(p => this.fileStates[p.manifest.fileName]?.status === 'downloaded' || this.fileStates[p.manifest.fileName]?.status === 'present');
                if (allNonOnnxProcessed) {
                    sendUpdateToPopup({ type: 'all_non_onnx_complete' });
                    if (LOG_GENERAL) console.log(prefix, 'All non-ONNX files processed.');
                }
            }
        }

        this.activeDownloadFileName = null;
        this.isDownloaderBusy = false;
        this.processDownloadQueue();
    }

    private async streamAndStoreFileWithProgress(filePlan: FilePlan, badChunks: BadChunkInfo[]): Promise<{ fileFailed: boolean; fileName: string; fileBytesDownloaded: number; fileChunksDownloaded: number; badChunkFound: boolean }> {
        const { manifest, isONNX } = filePlan;
        let fileBytesDownloaded = 0;
        let fileChunksDownloaded = 0;
        let fileFailed = false;
        let badChunkFound = false;
        let chunkIndex = 0;
        let allChunksSuccess = true;
        let bytesSinceLastPause = 0;
        const chunkGroupId = `${this.modelId}/${manifest.fileName}`;
        const isLargeFile = manifest.size > LARGE_FILE_THRESHOLD;
        const pauseDuration = isLargeFile ? LARGE_FILE_PAUSE_DURATION_MS : PAUSE_DURATION_MS;

        if (LOG_MEMORY) logMemory(`Before file ${manifest.fileName}`);

        try {
            let attempt = 0;
            let response: Response | null = null;
            while (attempt < MAX_RETRIES) {
                try {
                    response = await fetch(filePlan.fullDownloadUrl);
                    if (response.ok) break;
                    if (LOG_ERROR) console.log(prefix, `Fetch attempt ${attempt + 1} failed for ${manifest.fileName}: ${response.status} ${response.statusText}`);
                    attempt++;
                    await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
                } catch (error) {
                    if (LOG_ERROR) console.log(prefix, `Fetch error for ${manifest.fileName} on attempt ${attempt + 1}:`, error);
                    attempt++;
                    await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
                }
            }
            if (!response || !response.ok) {
                const errorText = response ? await response.text() : 'No response';
                throw new DownloadError(`Failed to download ${manifest.fileName}: ${response?.status} ${response?.statusText}`, { errorText });
            }
            if (!response.body) throw new DownloadError(`Download response body is null for ${manifest.fileName}`);

            const reader = response.body.getReader();
            let buffer = new Uint8Array(CHUNK_SIZE);
            let bufferOffset = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (!(value instanceof Uint8Array)) {
                    if (LOG_ERROR) console.log(prefix, `Invalid chunk data for ${manifest.fileName}, chunk ${chunkIndex}: Type ${typeof value}`);
                    badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Invalid chunk data type', payload: value });
                    fileFailed = true;
                    badChunkFound = true;
                    reader.cancel('Invalid chunk data');
                    break;
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
                            if (LOG_ERROR) console.log(prefix, `Bad chunk for ${manifest.fileName}, chunk ${chunkIndex}: ${reason}, Length: ${chunkToStore?.byteLength || 0}`);
                            badChunks.push({ fileName: manifest.fileName, chunkIndex, reason, chunkLength: chunkToStore?.byteLength, payload: { fileName: manifest.fileName, chunkIndex, chunkToStore } });
                            badChunkFound = true;
                            fileFailed = true;
                            reader.cancel('Bad chunk detected');
                            break;
                        }

                        const chunkArrayBuffer = chunkToStore.buffer;
                        const dbPayload = {
                            folder: this.modelId,
                            modelId: this.modelId,
                            fileName: manifest.fileName,
                            fileType: manifest.fileType,
                            data: chunkArrayBuffer,
                            chunkIndex,
                            totalChunks: manifest.totalChunks,
                            chunkGroupId,
                            binarySize: chunkToStore.byteLength,
                            totalFileSize: manifest.size,
                            checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(chunkArrayBuffer) : 'na',
                        };
                        const success = await tryStoreChunkInternal(dbPayload);
                        if (!success) {
                            if (LOG_ERROR) console.log(prefix, `Failed to store chunk ${chunkIndex} for ${manifest.fileName} after ${MAX_RETRIES} retries`);
                            badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Failed to store chunk after retries', chunkLength: chunkToStore.byteLength, payload: dbPayload });
                            badChunkFound = true;
                            fileFailed = true;
                            reader.cancel('Chunk storage failed');
                            break;
                        }

                        const bytesInThisChunk = chunkToStore.byteLength;
                        fileBytesDownloaded += bytesInThisChunk;
                        bytesSinceLastPause += bytesInThisChunk;
                        fileChunksDownloaded++;
                        this.progressManager.incrementTotalDownloaded(bytesInThisChunk);
                        this.fileStates[manifest.fileName].progress = manifest.size > 0 ? Math.floor((fileBytesDownloaded / manifest.size) * 100) : 100;
                        // Debug log for ONNX progress
                        if (isONNX) {
                            console.log('[modelAssetDownloader] ONNX progress:', manifest.fileName, 'fileBytesDownloaded:', fileBytesDownloaded, 'fileSize:', manifest.size, 'progress:', this.fileStates[manifest.fileName].progress);
                            // Send live progress update to popup
                            sendUpdateToPopup({ type: 'file_update', fileName: manifest.fileName, status: 'downloading', progress: this.fileStates[manifest.fileName].progress });
                        }
                        this.progressManager.updateProgress({ currentFileDownloaded: fileBytesDownloaded });
                        if (!isONNX) {
                            this.nonOnnxDownloadedSize += bytesInThisChunk;
                        }

                        if (LOG_CHUNK && (chunkIndex === 0 || chunkIndex === manifest.totalChunks - 1)) {
                            console.log(prefix, `Stored chunk ${chunkIndex} for ${manifest.fileName}, bytes: ${bytesInThisChunk}, total downloaded: ${fileBytesDownloaded}`);
                        }

                        chunkIndex++;

                        if (chunkIndex % CHUNK_PROCESSED_FOR_PAUSE === 0 || bytesSinceLastPause >= PAUSE_BYTES_THRESHOLD) {
                            if (LOG_MEMORY) logMemory(`Pausing after chunk ${chunkIndex} for ${manifest.fileName}`);
                            await new Promise(res => setTimeout(res, pauseDuration));
                            bytesSinceLastPause = 0;
                        }
                    }
                }
                if (fileFailed || badChunkFound) break;
            }

            if (allChunksSuccess && !fileFailed && bufferOffset > 0) {
                const finalChunkToStore = buffer.subarray(0, bufferOffset);
                buffer = new Uint8Array(0); // Release buffer
                if (!manifest.fileName || typeof chunkIndex !== 'number' || !finalChunkToStore || finalChunkToStore.byteLength === 0) {
                    const reason = !manifest.fileName ? 'Missing fileName' : typeof chunkIndex !== 'number' ? 'Invalid chunkIndex' : !finalChunkToStore ? 'Missing finalChunkToStore' : 'Empty final chunk';
                    if (LOG_ERROR) console.log(prefix, `Bad final chunk for ${manifest.fileName}, chunk ${chunkIndex}: ${reason}, Length: ${finalChunkToStore?.byteLength || 0}`);
                    badChunks.push({ fileName: manifest.fileName, chunkIndex, reason, chunkLength: finalChunkToStore?.byteLength, payload: { fileName: manifest.fileName, chunkIndex, finalChunkToStore } });
                    badChunkFound = true;
                    fileFailed = true;
                } else {
                    const finalChunkArrayBuffer = finalChunkToStore.buffer.slice(finalChunkToStore.byteOffset, finalChunkToStore.byteOffset + finalChunkToStore.byteLength);
                    const dbPayload = {
                        folder: this.modelId,
                        modelId: this.modelId,
                        fileName: manifest.fileName,
                        fileType: manifest.fileType,
                        data: finalChunkArrayBuffer,
                        chunkIndex,
                        totalChunks: manifest.totalChunks,
                        chunkGroupId,
                        binarySize: finalChunkToStore.byteLength,
                        totalFileSize: manifest.size,
                        checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(finalChunkArrayBuffer) : 'na',
                    };
                    const success = await tryStoreChunkInternal(dbPayload);
                    if (!success) {
                        if (LOG_ERROR) console.log(prefix, `Failed to store final chunk ${chunkIndex} for ${manifest.fileName} after ${MAX_RETRIES} retries`);
                        badChunks.push({ fileName: manifest.fileName, chunkIndex, reason: 'Failed to store final chunk', chunkLength: finalChunkToStore.byteLength, payload: dbPayload });
                        badChunkFound = true;
                        fileFailed = true;
                    } else {
                        const bytesInThisChunk = finalChunkToStore.byteLength;
                        fileBytesDownloaded += bytesInThisChunk;
                        bytesSinceLastPause += bytesInThisChunk;
                        fileChunksDownloaded++;
                        this.progressManager.incrementTotalDownloaded(bytesInThisChunk);
                        this.fileStates[manifest.fileName].progress = 100;
                        this.progressManager.updateProgress({ currentFileDownloaded: fileBytesDownloaded });
                        if (!isONNX) {
                            this.nonOnnxDownloadedSize += bytesInThisChunk;
                        }
                        if (LOG_CHUNK) console.log(prefix, `Stored final chunk ${chunkIndex} for ${manifest.fileName}, bytes: ${bytesInThisChunk}, total downloaded: ${fileBytesDownloaded}`);
                    }
                }
            }

            if (manifest.size > 100 * 1024 * 1024) await new Promise(res => setTimeout(res, pauseDuration));
            if (LOG_MEMORY) logMemory(`After file ${manifest.fileName}`);
        } catch (error) {
            fileFailed = true;
            const errMsg = error instanceof Error ? error.message : String(error);
            const context = error instanceof DownloadError ? error.context : null;
            if (LOG_ERROR) console.log(prefix, `Download error for ${this.modelId}/${manifest.fileName}: ${errMsg}`, context ? `Context: ${JSON.stringify(context)}` : '');
        }

        return { fileFailed: fileFailed || badChunkFound || !allChunksSuccess, fileName: manifest.fileName, fileBytesDownloaded, fileChunksDownloaded, badChunkFound };
    }

    handleUserFileRequestFromPopup(filePlan: FilePlan) {
        if (!this.modelId || !this.filePlans.some(p => p.manifest.fileName === filePlan.manifest.fileName)) {
            if (LOG_ERROR) console.log(prefix, `Attempt to download file for unknown or mismatched model: ${filePlan.manifest.fileName}`);
            return;
        }
        const existingState = this.fileStates[filePlan.manifest.fileName];
        if (existingState?.status === 'present' || existingState?.status === 'downloaded' || existingState?.status === 'queued' || existingState?.status === 'downloading') {
            if (LOG_GENERAL) console.log(prefix, `File ${filePlan.manifest.fileName} already handled (status: ${existingState?.status}). Ignoring request.`);
            return;
        }
        this.queueFileForDownload(filePlan);
        this.processDownloadQueue();
        if (LOG_GENERAL) console.log(prefix, `Processed user file request for ${filePlan.manifest.fileName}`);
    }

    private async updateManifestStatusInDb(filePlan: FilePlan, status: string) {
        try {
            await sendDbRequestSmart(new DbUpdateManifestRequest(filePlan.manifest.id, { status, updatedAt: Date.now() }));
            if (LOG_GENERAL) console.log(prefix, `Updated manifest status in DB for ${filePlan.manifest.fileName} to ${status}`);
        } catch (e) {
            if (LOG_ERROR) console.log(prefix, `Failed to update manifest status in DB for ${filePlan.manifest.fileName}:`, e);
        }
    }
}

// Global functions (unchanged)
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
        await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
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

        // Use manifest status directly
        let isPresent = false;
        if (plan.manifest.status === 'complete' || plan.manifest.status === 'present') {
            isPresent = true;
        }

        // Add debug log for each file
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
    if (LOG_GENERAL) console.log(prefix, `Initial states computed: ${missingNonOnnxFiles.length} missing non-ONNX files, ${nonOnnxPresentBytes} bytes present`);
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

function sendUiGlobalProgress(payload: DownloadProgress) {
    if (typeof window !== 'undefined' && (window as any).EXTENSION_CONTEXT === Contexts.MAIN_UI) {
        document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_DOWNLOAD_PROGRESS, { detail: payload }));
        if (LOG_GENERAL) console.log(prefix, 'Sent UI progress event:', payload.message);
        return Promise.resolve();
    } else {
        return browser.runtime.sendMessage({
            type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
            payload
        }).catch((e: any) => {
            if (LOG_ERROR) console.log(prefix, `Error sending MODEL_DOWNLOAD_PROGRESS: ${e.message}`);
        });
    }
}

function sendUpdateToPopup(update: any) {
    if (typeof onnxSelectionPopupCtrlCallback === 'function') {
        onnxSelectionPopupCtrlCallback(update);
        if (LOG_GENERAL) console.log(prefix, `Sent popup update: ${JSON.stringify(update)}`);
    }
}

function buildFullDownloadUrl(modelId: string, fileName: string): string {
    if (/^https?:\/\//.test(fileName)) return fileName;
    return `https://huggingface.co/${modelId}/resolve/main/${fileName}`.replace(/([^:])\/\/+/, '$1/');
}

// Global entry point
export async function downloadModelAssets(
    modelId: string,
    selectedOnnxFile: string | null = null,
    manifestsFromUI: ModelAssetManifest[] | null = null
) {
    const manager = new DownloadManager(modelId, manifestsFromUI);
    return manager.downloadModelAssets(selectedOnnxFile);
}

export function registerPopupCallbacks(callback: (update: any) => void) {
    onnxSelectionPopupCtrlCallback = callback;
    if (LOG_GENERAL) console.log(prefix, 'Registered global popup callback');
}

// Global popup callback (for backward compatibility)
let onnxSelectionPopupCtrlCallback: ((update: any) => void) | null = null;

export function handleUserFileRequestFromPopup(filePlan: FilePlan) {
    const manager = new DownloadManager(filePlan.manifest.folder || '', null);
    manager.handleUserFileRequestFromPopup(filePlan);
}