import browser from 'webextension-polyfill';
import { UIEventNames } from './events/eventNames';
import { sendDbRequestSmart } from './sidepanel';
import { Contexts } from './events/eventNames';
import { DbAddModelAssetRequest, DbCountModelAssetChunksRequest, DbGetManifestRequest, DbCreateAllFileManifestsForRepoRequest, DbGetModelAssetChunkRequest, DbListModelFilesRequest } from './DB/dbEvents';
import { fetchModelMetadataInternal, filterAndValidateFilesInternal } from './Utilities/modelMetadata';
// @ts-ignore: If using JS/TS without types for spark-md5
import SparkMD5 from 'spark-md5';

import { DbWorkerCreatedNotification } from './DB/dbEvents';
// smartNotify is not exported; use document.dispatchEvent directly for notifications

declare global {
    interface Window {
        showOnnxSelectionPopup?: (
            onnxFiles: any[],
            allFiles: any[],
            initialFileStates: { [fileName: string]: { status: string, progress: number } },
            nonOnnxInitialProgress: number,
            nonOnnxInitialStatus: string,
            requestFileDownloadCallback: (filePlan: any) => void
        ) => void;
        hideOnnxSelectionPopup?: () => void;
    }
}

const prefix = '[Downloader]';
const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_RETRIES = 3;
const PROGRESS_THROTTLE_MS = 1000;
const PROGRESS_THROTTLE_CHUNKS = 50;

const CHUNK_PROCESSED_FOR_PAUSE = 10;
const PAUSE_DURATION_MS = 250;

const LOG_GENERAL = true;
const LOG_CHUNK = LOG_GENERAL && true;
const LOG_MEMORY = LOG_GENERAL && false;
const LOG_ERROR = true;

const USE_MD5_CHECKSUM = false;

type DownloadProgress = {
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
    filesAlreadyPresent?: number;
    filesToDownload?: number;
    totalBytesAlreadyPresent?: number;
    fileTotalBytes?: number;
    fileTotalBytesHuman?: string;
    progress?: number;
    summary?: boolean;
    filesSuccessfullyProcessedCount?: number;
    totalFilesToAttempt?: number;
    failedFiles?: string[];
    success?: boolean;
};

interface BadChunkInfo {
    fileName: string;
    chunkIndex: number;
    reason: string;
    chunkLength?: number;
    payload?: any;
}

let currentModelIdInternal: string | null = null;
let allKnownFilePlansInternal: any[] = [];
let fileStatesInternal: { [fileName: string]: { status: 'unknown' | 'present' | 'queued' | 'downloading' | 'downloaded' | 'failed', progress: number } } = {};
let nonOnnxTotalSizeInternal: number = 0;
let nonOnnxDownloadedSizeInternal: number = 0;
let downloadQueueInternal: any[] = [];
let activeDownloadFileNameInternal: string | null = null;
let isDownloaderBusyInternal: boolean = false;
let baseDownloadUrlInternal: string = '';
let hfModelMetadataInternal: any = null;
let successfullyProcessedCountOverall = 0;


let onnxSelectionPopupCtrlCallback: ((update:
    { type: 'file_update', fileName: string, status: string, progress: number } |
    { type: 'non_onnx_update', status: string, progress: number } |
    { type: 'all_non_onnx_complete' } |
    { type: 'all_downloads_complete', success: boolean, finalMessage: string }
) => void) | null = null;

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

function shouldLogOrSendChunkProgress(chunkIndex: number, totalChunks: number, lastSent: number, now: number) {
    return chunkIndex === 0 ||
           (totalChunks && chunkIndex === totalChunks - 1) ||
           chunkIndex % PROGRESS_THROTTLE_CHUNKS === 0 ||
           (now - lastSent >= PROGRESS_THROTTLE_MS);
}

async function tryStoreChunkInternal(payload: any, maxRetries = MAX_RETRIES) {
    let attempt = 0;
    while (attempt < maxRetries) {
        const req = new DbAddModelAssetRequest(payload);
        const addResult = await sendDbRequestSmart(req);
        if (addResult && addResult.success) return true;
        attempt++;
        if (LOG_CHUNK) console.log(`${prefix} Retrying chunk store, attempt ${attempt} for ${payload.fileName} chunk ${payload.chunkIndex}`);
        await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
    }
    if (LOG_ERROR) console.error(`${prefix} Failed to store chunk after ${maxRetries} retries:`, payload.fileName, payload.chunkIndex);
    return false;
}

async function countModelAssetChunksViaMessage(folder: string, fileName: string, expectedSize: number, expectedChunks: number) {
    const req = new DbCountModelAssetChunksRequest({ folder, fileName, expectedSize, expectedChunks });
    const result = await sendDbRequestSmart(req);
    if (result && result.success && typeof result.data !== 'undefined') {
        return result.data;
    }
    return result;
}

function buildDownloadPlanInternal(neededFileEntries: any[]): { downloadPlan: any[], totalBytesToDownload: number, totalChunksToDownload: number } {
    const downloadPlan = neededFileEntries.map((entry: any, idx: number) => ({
        fileName: entry.rfilename,
        fileSize: entry.size,
        totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
        fileIdx: idx + 1,
        fileType: entry.rfilename.split('.').pop(),
        isONNX: entry.rfilename.endsWith('.onnx'),
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum: number, f: any) => sum + f.fileSize, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum: number, f: any) => sum + f.totalChunks, 0);
    return { downloadPlan, totalBytesToDownload, totalChunksToDownload };
}

async function getMissingFilesAndInitialStates(downloadPlan: any[], modelId: string): Promise<{ initialStates: typeof fileStatesInternal, missingNonOnnx: any[], nonOnnxTotal: number, nonOnnxPresent: number }> {
    const initialStates: typeof fileStatesInternal = {};
    const missingNonOnnxFiles: any[] = [];
    let nonOnnxTotalBytes = 0;
    let nonOnnxPresentBytes = 0;

    for (const plan of downloadPlan) {
        initialStates[plan.fileName] = { status: 'unknown', progress: 0 };
        const manifestReq = new DbGetManifestRequest({ folder: modelId, fileName: plan.fileName, type: 'manifest' });
        let manifest = null;
        try {
            const manifestResult = await sendDbRequestSmart(manifestReq);
            manifest = manifestResult && manifestResult.success ? manifestResult.data : null;
        } catch (e) { console.warn(prefix, `Error checking manifest for ${plan.fileName}:`, e); }

        let isPresent = false;
        if (manifest && manifest.status === 'complete') {
            isPresent = true;
        } else {
            const countResult = await countModelAssetChunksViaMessage(modelId, plan.fileName, plan.fileSize, plan.totalChunks);
            if (countResult && countResult.success && countResult.verified && countResult.count === plan.totalChunks) {
                isPresent = true;
            }
        }

        if (isPresent) {
            initialStates[plan.fileName] = { status: 'present', progress: 100 };
            if (!plan.isONNX) {
                nonOnnxPresentBytes += plan.fileSize;
            }
        } else {
            if (!plan.isONNX) {
                missingNonOnnxFiles.push(plan);
            }
        }
        if (!plan.isONNX) {
            nonOnnxTotalBytes += plan.fileSize;
        }
    }
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

async function streamAndStoreFileWithProgress(
    plan: any,
    modelId: string,
    baseDownloadUrlForFile: string,
    onProgressCallback: (bytesDownloadedInChunk: number, currentFileTotalBytesDownloaded: number) => void,
    badChunksList?: BadChunkInfo[]
): Promise<{ fileFailed: boolean, fileName: string, fileBytesDownloaded: number, fileChunksDownloaded: number, badChunkFound: boolean }> {
    const { fileName, fileSize, totalChunks, fileType } = plan;
    const downloadUrl = baseDownloadUrlForFile;
    let fileBytesDownloaded = 0;
    let fileChunksDownloaded = 0;
    let fileFailed = false;
    let lastProgressLogTime = Date.now();
    let chunkIndex = 0;
    let allChunksSuccess = true;
    const chunkGroupId = `${modelId}/${fileName}`;
    let badChunkFound = false;

    try {
        if (fileSize > 10 * 1024 * 1024) logMemory(`Before file ${fileName}`);
        
        const downloadResponse = await fetch(downloadUrl);
        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            if (LOG_ERROR) console.error(prefix, `Failed to download ${modelId}/${fileName}: ${downloadResponse.status} ${downloadResponse.statusText}`, errorText);
            return { fileFailed: true, fileName, fileBytesDownloaded, fileChunksDownloaded, badChunkFound };
        }
        if (!downloadResponse.body) throw new Error('Download response body is null');
        
        const reader = downloadResponse.body.getReader();
        let buffer = new Uint8Array(CHUNK_SIZE);
        let bufferOffset = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!(value instanceof Uint8Array)) {
                if (LOG_ERROR) console.error(prefix, `Invalid chunk data for ${fileName}, chunk ${chunkIndex}:`, typeof value);
                fileFailed = true; badChunkFound = true;
                if (badChunksList) badChunksList.push({ fileName, chunkIndex, reason: 'Invalid chunk data type', payload: value });
                reader.cancel('Invalid chunk data'); break;
            }
            let valueOffset = 0;
            while (valueOffset < value.length) {
                const remainingBuffer = CHUNK_SIZE - bufferOffset;
                const copyLength = Math.min(remainingBuffer, value.length - valueOffset);
                buffer.set(value.subarray(valueOffset, valueOffset + copyLength), bufferOffset);
                bufferOffset += copyLength; valueOffset += copyLength;

                if (bufferOffset === CHUNK_SIZE) {
                    let chunkToStore = buffer; buffer = new Uint8Array(CHUNK_SIZE); bufferOffset = 0;
                    if (!fileName || typeof chunkIndex !== 'number' || !chunkToStore || chunkToStore.byteLength === 0) {
                        const reason = !fileName ? 'Missing fileName' : typeof chunkIndex !== 'number' ? 'Invalid chunkIndex' : !chunkToStore ? 'Missing chunkToStore' : 'Empty chunk';
                        if (LOG_ERROR) console.error(prefix, '[BAD CHUNK]', { fileName, chunkIndex, reason, chunkLength: chunkToStore?.byteLength });
                        if (badChunksList) badChunksList.push({ fileName, chunkIndex, reason, chunkLength: chunkToStore?.byteLength, payload: {fileName,chunkIndex,chunkToStore} });
                        badChunkFound = true; fileFailed = true; reader.cancel('Bad chunk detected'); break;
                    }
                    
                    const chunkArrayBuffer = chunkToStore.buffer;
                    const dbPayload = { folder: modelId, modelId, fileName, fileType, data: chunkArrayBuffer, chunkIndex, totalChunks, chunkGroupId, binarySize: chunkToStore.byteLength, totalFileSize: fileSize, checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(chunkArrayBuffer) : 'na' };
                    const success = await tryStoreChunkInternal(dbPayload);

                    if (!success) {
                        allChunksSuccess = false; fileFailed = true;
                        if (badChunksList) badChunksList.push({ fileName, chunkIndex, reason: 'Failed to store chunk after retries', chunkLength: chunkToStore.byteLength, payload: dbPayload });
                        badChunkFound = true; reader.cancel('Chunk storage failed'); break;
                    }
                    
                    const bytesInThisChunk = chunkToStore.byteLength;
                    fileBytesDownloaded += bytesInThisChunk;
                    onProgressCallback(bytesInThisChunk, fileBytesDownloaded);
                    globalProgressManager.incrementTotalDownloaded(bytesInThisChunk);

                    chunkIndex++; fileChunksDownloaded++;
                    if (chunkIndex % CHUNK_PROCESSED_FOR_PAUSE === 0) await new Promise(res => setTimeout(res, PAUSE_DURATION_MS));
                }
            }
            if (fileFailed || badChunkFound) break;
        }

        if (allChunksSuccess && !fileFailed && bufferOffset > 0) {
            let finalChunkToStore = buffer.subarray(0, bufferOffset);
            if (!fileName || typeof chunkIndex !== 'number' || !finalChunkToStore || finalChunkToStore.byteLength === 0) {
                const reason = !fileName ? 'Missing fileName' : typeof chunkIndex !== 'number' ? 'Invalid chunkIndex' : !finalChunkToStore ? 'Missing finalChunkToStore' : 'Empty final chunk';
                 if (LOG_ERROR) console.error(prefix, '[BAD CHUNK] final', { fileName, chunkIndex, reason, chunkLength: finalChunkToStore?.byteLength });
                if (badChunksList) badChunksList.push({ fileName, chunkIndex, reason, chunkLength: finalChunkToStore?.byteLength, payload: { fileName, chunkIndex, finalChunkToStore } });
                badChunkFound = true; fileFailed = true;
            } else {
                const finalChunkArrayBuffer = finalChunkToStore.buffer.slice(finalChunkToStore.byteOffset, finalChunkToStore.byteOffset + finalChunkToStore.byteLength);
                const dbPayload = { folder: modelId, modelId, fileName, fileType, data: finalChunkArrayBuffer, chunkIndex, totalChunks, chunkGroupId, binarySize: finalChunkToStore.byteLength, totalFileSize: fileSize, checksum: USE_MD5_CHECKSUM ? checksumChunkMD5(finalChunkArrayBuffer) : 'na'};
                const success = await tryStoreChunkInternal(dbPayload);
                if (!success) {
                    allChunksSuccess = false; fileFailed = true;
                    if (badChunksList) badChunksList.push({ fileName, chunkIndex, reason: 'Failed to store final chunk', chunkLength: finalChunkToStore.byteLength, payload: dbPayload });
                    badChunkFound = true;
                } else {
                    const bytesInThisChunk = finalChunkToStore.byteLength;
                    fileBytesDownloaded += bytesInThisChunk;
                    onProgressCallback(bytesInThisChunk, fileBytesDownloaded);
                    globalProgressManager.incrementTotalDownloaded(bytesInThisChunk);
                    fileChunksDownloaded++;
                }
            }
        }
        if (fileSize > 100 * 1024 * 1024) await new Promise(res => setTimeout(res, 1000));
        if (fileSize > 10 * 1024 * 1024) logMemory(`After file ${fileName}`);

    } catch (error: unknown) {
        fileFailed = true;
        if (LOG_ERROR) console.error(prefix, `Error streaming/storing ${modelId}/${fileName}:`, error);
    }
    return { fileFailed: fileFailed || badChunkFound || !allChunksSuccess, fileName, fileBytesDownloaded, fileChunksDownloaded, badChunkFound };
}


function sendUiGlobalProgress(payload: any) {
    if (typeof window !== 'undefined' && (window as any).EXTENSION_CONTEXT === Contexts.MAIN_UI) {
        document.dispatchEvent(new CustomEvent(UIEventNames.MODEL_DOWNLOAD_PROGRESS, { detail: payload }));
        return Promise.resolve();
    } else {
        return browser.runtime.sendMessage({
            type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
            payload
        }).catch((e: any) => console.warn(`${prefix} Error sending MODEL_DOWNLOAD_PROGRESS: ${e.message}`));
    }
}

class ProgressManager {
    private progress: DownloadProgress;
    private lastSentPercent: number = 0;
    private lastSentTime: number = 0;

    constructor() {
        this.progress = this.createInitialState();
    }

    private createInitialState(): DownloadProgress {
        return {
            totalFiles: 0, totalBytes: 0, currentFileIndex: 0, currentFile: '',
            currentFileSize: 0, currentFileDownloaded: 0, totalDownloaded: 0,
            done: false, error: null, progress: 0,
            filesSuccessfullyProcessedCount: 0, totalFilesToAttempt: 0,
        };
    }

    public reset() {
        this.progress = this.createInitialState();
        this.lastSentPercent = 0;
        this.lastSentTime = 0;
    }
    
    public incrementTotalDownloaded(bytes: number) {
        if (this.progress.totalDownloaded === undefined) this.progress.totalDownloaded = 0;
        this.progress.totalDownloaded += bytes;
    }

    public updateProgress(update: Partial<DownloadProgress>) {
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
        }
    }
    public getProgress(): Readonly<DownloadProgress> { return { ...this.progress }; }
}

const globalProgressManager = new ProgressManager();

function sendUpdateToPopup(update: any) {
    if (typeof onnxSelectionPopupCtrlCallback === 'function') {
        onnxSelectionPopupCtrlCallback(update);
    }
}

// Helper to build the full download URL for a file
function buildFullDownloadUrl(modelId: string, fileName: string): string {
    // If fileName is already a full URL, return as is
    if (/^https?:\/\//.test(fileName)) return fileName;
    // Remove any accidental double slashes
    return `https://huggingface.co/${modelId}/resolve/main/${fileName}`.replace(/([^:])\/\/+/, '$1/');
}

async function processDownloadQueue() {
    if (isDownloaderBusyInternal || downloadQueueInternal.length === 0) {
        if (!isDownloaderBusyInternal && downloadQueueInternal.length === 0 && currentModelIdInternal) {
             const allDone = allKnownFilePlansInternal.every(p => fileStatesInternal[p.fileName]?.status === 'downloaded' || fileStatesInternal[p.fileName]?.status === 'present');
             const anyFailed = allKnownFilePlansInternal.some(p => fileStatesInternal[p.fileName]?.status === 'failed');
             if(allKnownFilePlansInternal.length > 0 && (allDone || anyFailed)){ // Check if there were files to process
                const finalMessage = allDone ? `All files for ${currentModelIdInternal} processed successfully.` : `Some files for ${currentModelIdInternal} failed to download.`;
                if (LOG_GENERAL) console.log(prefix, "Download queue empty and downloader not busy.", finalMessage);
                sendUpdateToPopup({ type: 'all_downloads_complete', success: allDone && !anyFailed, finalMessage });
                globalProgressManager.updateProgress({
                    done: true,
                    success: allDone && !anyFailed,
                    filesSuccessfullyProcessedCount: successfullyProcessedCountOverall,
                    totalFilesToAttempt: allKnownFilePlansInternal.length,
                    error: anyFailed ? "Some files failed" : null
                });
             }
        }
        return;
    }
    isDownloaderBusyInternal = true;
    const filePlan = downloadQueueInternal.shift();
    console.log('[Downloader][Download] Downloading from:', filePlan.fullDownloadUrl);
    activeDownloadFileNameInternal = filePlan.fileName;

    fileStatesInternal[filePlan.fileName] = { status: 'downloading', progress: 0 };
    sendUpdateToPopup({ type: 'file_update', fileName: filePlan.fileName, status: 'downloading', progress: 0 });
    if (!filePlan.isONNX) {
        sendUpdateToPopup({ type: 'non_onnx_update', status: 'downloading', progress: Math.floor((nonOnnxDownloadedSizeInternal / nonOnnxTotalSizeInternal) * 100) });
    }

    globalProgressManager.updateProgress({
        currentFile: filePlan.fileName,
        currentFileSize: filePlan.fileSize,
        currentFileDownloaded: 0,
        totalFilesToAttempt: allKnownFilePlansInternal.length
    });
    
    const badChunks: BadChunkInfo[] = [];
    const result = await streamAndStoreFileWithProgress(filePlan, currentModelIdInternal!, filePlan.fullDownloadUrl,
        (bytesDownloadedInChunk, currentFileTotalBytesDownloaded) => {
            const fileProgressPercent = filePlan.fileSize > 0 ? Math.floor((currentFileTotalBytesDownloaded / filePlan.fileSize) * 100) : 100;
            fileStatesInternal[filePlan.fileName].progress = fileProgressPercent;
            sendUpdateToPopup({ type: 'file_update', fileName: filePlan.fileName, status: 'downloading', progress: fileProgressPercent });
            globalProgressManager.updateProgress({ currentFileDownloaded: currentFileTotalBytesDownloaded });

            if (!filePlan.isONNX) {
                nonOnnxDownloadedSizeInternal += bytesDownloadedInChunk;
                const nonOnnxProgressPercent = nonOnnxTotalSizeInternal > 0 ? Math.floor((nonOnnxDownloadedSizeInternal / nonOnnxTotalSizeInternal) * 100) : 100;
                sendUpdateToPopup({ type: 'non_onnx_update', status: 'downloading', progress: nonOnnxProgressPercent });
            }
        },
        badChunks
    );

    if (result.fileFailed || result.badChunkFound) {
        fileStatesInternal[filePlan.fileName] = { status: 'failed', progress: fileStatesInternal[filePlan.fileName].progress };
        sendUpdateToPopup({ type: 'file_update', fileName: filePlan.fileName, status: 'failed', progress: fileStatesInternal[filePlan.fileName].progress });
        if (LOG_ERROR) console.error(prefix, `Failed to download ${filePlan.fileName}. Bad chunks:`, badChunks);
        globalProgressManager.updateProgress({ error: `Failed ${filePlan.fileName}` });

    } else {
        fileStatesInternal[filePlan.fileName] = { status: 'downloaded', progress: 100 };
        sendUpdateToPopup({ type: 'file_update', fileName: filePlan.fileName, status: 'downloaded', progress: 100 });
        successfullyProcessedCountOverall++;
        globalProgressManager.updateProgress({ filesSuccessfullyProcessedCount: successfullyProcessedCountOverall });


        if (!filePlan.isONNX) {
            const nonOnnxProgressPercent = nonOnnxTotalSizeInternal > 0 ? Math.floor((nonOnnxDownloadedSizeInternal / nonOnnxTotalSizeInternal) * 100) : 100;
             sendUpdateToPopup({ type: 'non_onnx_update', status: nonOnnxProgressPercent === 100 ? 'downloaded' : 'downloading', progress: nonOnnxProgressPercent });
            const allNonOnnxProcessed = allKnownFilePlansInternal
                .filter(p => !p.isONNX)
                .every(p => fileStatesInternal[p.fileName]?.status === 'downloaded' || fileStatesInternal[p.fileName]?.status === 'present');
            if (allNonOnnxProcessed) {
                sendUpdateToPopup({ type: 'all_non_onnx_complete' });
                 if (LOG_GENERAL) console.log(prefix, "All non-ONNX files processed.");
            }
        }
    }

    activeDownloadFileNameInternal = null;
    isDownloaderBusyInternal = false;
    processDownloadQueue();
}

export function registerPopupCallbacks(
    callback: ((update: any) => void)
) {
    onnxSelectionPopupCtrlCallback = callback;
}

// Helper to notify UI of updated model meta
async function notifyModelMetaUpdate(modelId: string) {
  const req = new DbListModelFilesRequest({ folder: modelId });
  const result = await sendDbRequestSmart(req);
  document.dispatchEvent(new CustomEvent(DbWorkerCreatedNotification.type, { detail: { payload: { [modelId]: result.data } } }));
}

export async function downloadModelAssets(modelId: string, selectedOnnxFile: string | null = null) {
    if (LOG_GENERAL) console.log(prefix, `Request to downloadModelAssets for modelId: ${modelId}, selectedOnnxFile: ${selectedOnnxFile}`);

    // Always clear queue and reset state when starting a new download
    currentModelIdInternal = modelId;
    baseDownloadUrlInternal = `https://huggingface.co/${modelId}/resolve/main/`;
    allKnownFilePlansInternal = [];
    fileStatesInternal = {};
    downloadQueueInternal = [];
    activeDownloadFileNameInternal = null;
    isDownloaderBusyInternal = false;
    nonOnnxTotalSizeInternal = 0;
    nonOnnxDownloadedSizeInternal = 0;
    successfullyProcessedCountOverall = 0;
    hfModelMetadataInternal = null;
    globalProgressManager.reset();

    // 1. Try to read all manifests for this repo from DB

    let req = new DbListModelFilesRequest({ folder: modelId, returnObjects: true });
    let manifestResult = await sendDbRequestSmart(req);
    let manifests: any[] = manifestResult && manifestResult.success ? manifestResult.data : [];
    if (LOG_GENERAL) console.log(prefix, 'Fetched manifests from DB:', manifests);

    // 3. Separate ONNX and non-ONNX files
    const onnxFiles = manifests.filter((m: any) => m.fileType === 'onnx');
    const nonOnnxFiles = manifests.filter((m: any) => m.fileType !== 'onnx');

    // 4. Queue non-ONNX files that are not present/complete
    const nonOnnxToDownload = nonOnnxFiles.filter((f: any) => f.status !== 'present' && f.status !== 'complete');
    nonOnnxToDownload.forEach(file => {
        const fullDownloadUrl = buildFullDownloadUrl(modelId, file.fileName);
        console.log('[Downloader][Queue] Queuing file:', file.fileName, 'Full URL:', fullDownloadUrl);
        downloadQueueInternal.push({ ...file, fullDownloadUrl });
        fileStatesInternal[file.fileName] = { status: 'queued', progress: 0 };
    });

    // Start non-ONNX downloads right away
    processDownloadQueue();

    // 5. ONNX logic
    if (onnxFiles.length === 1) {
        if (onnxFiles[0].status !== 'present' && onnxFiles[0].status !== 'complete') {
            downloadQueueInternal.push(onnxFiles[0]);
            fileStatesInternal[onnxFiles[0].fileName] = { status: 'queued', progress: 0 };
            // No need to call processDownloadQueue() again, it's already running
        }
    } else if (onnxFiles.length > 1) {
        if (!selectedOnnxFile || selectedOnnxFile === 'all') {
            // Send initial progress event to show the bar
            globalProgressManager.updateProgress({
                progress: 0,
                done: false,
                message: "Waiting for user to select a file...",
                totalFiles: allKnownFilePlansInternal.length,
                totalBytes: 0,
                currentFile: '',
                currentFileDownloaded: 0,
                totalDownloaded: 0,
                filesSuccessfullyProcessedCount: 0,
                totalFilesToAttempt: allKnownFilePlansInternal.length,
            });
            // Show popup for user to select ONNX file
            const onnxFilesForPopup = onnxFiles.map((m: any) => ({ ...m, fileSize: m.size }));
            if (window.showOnnxSelectionPopup) {
                window.showOnnxSelectionPopup(
                    onnxFilesForPopup,
                    allKnownFilePlansInternal,
                    fileStatesInternal,
                    0, // nonOnnxProgress (could be improved)
                    'unknown', // nonOnnxStatus (could be improved)
                    handleUserFileRequestFromPopup
                );
            }
            // Progress will be shown in both popup and sidebar as files are downloaded
            return { success: true, message: "Multiple ONNX files, popup shown for user selection." };
        } else {
            // User selected a specific ONNX
            const selectedOnnx = onnxFiles.find((f: any) => f.fileName === selectedOnnxFile);
            if (selectedOnnx && selectedOnnx.status !== 'present' && selectedOnnx.status !== 'complete') {
                downloadQueueInternal.push(selectedOnnx);
                fileStatesInternal[selectedOnnx.fileName] = { status: 'queued', progress: 0 };
                // No need to call processDownloadQueue() again, it's already running
            }
        }
    }

    if (manifests.length > 0) {
        if (LOG_GENERAL) console.log(prefix, 'Notifying model meta update for:', modelId);
        await notifyModelMetaUpdate(modelId);
        return { success: true, message: "Model already indexed in DB. UI notified." };
    }

    // 2. Repo does not exist in DB, fetch from remote
    try {
        const metadata = hfModelMetadataInternal || await fetchModelMetadataInternal(modelId);
        if (!metadata) throw new Error("Failed to fetch metadata");

        const { neededFileEntries, message: filterMessage } = await filterAndValidateFilesInternal(metadata, modelId, baseDownloadUrlInternal);
        if (filterMessage || neededFileEntries.length === 0) {
            const msg = filterMessage || `No usable files found for ${modelId}.`;
            if (LOG_ERROR) console.warn(prefix, msg);
            globalProgressManager.updateProgress({ error: msg, done: true, success: false });
            return { success: false, message: msg };
        }

        // 3. Add manifests to DB
        const createReq = new DbCreateAllFileManifestsForRepoRequest(neededFileEntries);
        await sendDbRequestSmart(createReq);

        // 4. Read back manifests for planning (all files for this repo)
        req = new DbListModelFilesRequest({ folder: modelId, returnObjects: true });
        manifestResult = await sendDbRequestSmart(req);
        manifests = manifestResult && manifestResult.success ? manifestResult.data : [];
        const onnxFiles = manifests.filter((m: any) => m.fileType === 'onnx');

        const { downloadPlan, totalBytesToDownload } = buildDownloadPlanInternal(neededFileEntries);
        allKnownFilePlansInternal = downloadPlan;
        globalProgressManager.updateProgress({
            totalFiles: allKnownFilePlansInternal.length,
            totalBytes: totalBytesToDownload,
            totalFilesToAttempt: allKnownFilePlansInternal.length,
            filesSuccessfullyProcessedCount: 0,
            totalDownloaded:0,
        });

        const { initialStates, missingNonOnnx, nonOnnxTotal, nonOnnxPresent } = await getMissingFilesAndInitialStates(allKnownFilePlansInternal, modelId);
        fileStatesInternal = initialStates;
        nonOnnxTotalSizeInternal = nonOnnxTotal;
        nonOnnxDownloadedSizeInternal = nonOnnxPresent;

        let initialOverallDownloadedBytes = 0;
        allKnownFilePlansInternal.forEach(plan => {
            if (fileStatesInternal[plan.fileName]?.status === 'present') {
                initialOverallDownloadedBytes += plan.fileSize;
                successfullyProcessedCountOverall++;
            }
        });
        globalProgressManager.updateProgress({ totalDownloaded: initialOverallDownloadedBytes, filesSuccessfullyProcessedCount: successfullyProcessedCountOverall });

        // --- Always queue non-ONNX files immediately ---
        missingNonOnnx.forEach(filePlan => {
            if (fileStatesInternal[filePlan.fileName]?.status !== 'present' && fileStatesInternal[filePlan.fileName]?.status !== 'queued') {
                downloadQueueInternal.push(filePlan);
                fileStatesInternal[filePlan.fileName] = { status: 'queued', progress: 0 };
            }
        });
        processDownloadQueue(); // Start non-ONNX downloads right away

        // --- Multi-ONNX logic ---
        if (onnxFiles.length > 1) {
            if (!selectedOnnxFile || selectedOnnxFile === 'all') {
                // Send initial progress event to show the bar
                globalProgressManager.updateProgress({
                    progress: 0,
                    done: false,
                    message: "Waiting for user to select a file...",
                    totalFiles: allKnownFilePlansInternal.length,
                    totalBytes: 0,
                    currentFile: '',
                    currentFileDownloaded: 0,
                    totalDownloaded: 0,
                    filesSuccessfullyProcessedCount: 0,
                    totalFilesToAttempt: allKnownFilePlansInternal.length,
                });
                // Show popup for user to select ONNX file
                const onnxFilesForPopup = onnxFiles.map((m: any) => ({ ...m, fileSize: m.size }));
                if (window.showOnnxSelectionPopup) {
                    window.showOnnxSelectionPopup(
                        onnxFilesForPopup,
                        allKnownFilePlansInternal,
                        fileStatesInternal,
                        0, // nonOnnxProgress (could be improved)
                        'unknown', // nonOnnxStatus (could be improved)
                        handleUserFileRequestFromPopup
                    );
                }
                // Progress will be shown in both popup and sidebar as files are downloaded
                return { success: true, message: "Multiple ONNX files, popup shown for user selection." };
            } else {
                // Specific ONNX selected in dropdown, skip popup, queue that ONNX
                const selectedOnnx = onnxFiles.find((f: any) => f.fileName === selectedOnnxFile);
                if (selectedOnnx) {
                    await handleUserFileRequestFromPopup(selectedOnnx);
                    // Progress will be shown only in sidebar
                    return { success: true, message: `Selected ONNX (${selectedOnnxFile}) queued for download.` };
                } else {
                    return { success: false, message: `Selected ONNX file (${selectedOnnxFile}) not found in manifests.` };
                }
            }
        }
        // --- Single ONNX logic ---
        if (onnxFiles.length === 1) {
            await handleUserFileRequestFromPopup(onnxFiles[0]);
            // Progress will be shown only in sidebar
            return { success: true, message: "Only one ONNX file, started download automatically." };
        }
        // --- No ONNX files ---
        // Otherwise, show the popup as usual (should not happen, but fallback)
        const onnxFilesForPopup = onnxFiles.map((m: any) => ({ ...m, fileSize: m.size }));
        if (window.showOnnxSelectionPopup) {
            window.showOnnxSelectionPopup(
                onnxFilesForPopup,
                allKnownFilePlansInternal,
                fileStatesInternal,
                0, // nonOnnxProgress (could be improved)
                'unknown', // nonOnnxStatus (could be improved)
                handleUserFileRequestFromPopup
            );
        }
        return { success: true, message: "Model manifests created and UI notified." };
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (LOG_ERROR) console.error(prefix, `Critical error in downloadModelAssets for ${modelId}:`, error);
        globalProgressManager.updateProgress({ error: errMsg, done: true, success: false });
        return { success: false, error: `Download process failed for ${modelId}: ${errMsg}` };
    }
}

export function handleUserFileRequestFromPopup(filePlan: any) {
    if (!currentModelIdInternal || !allKnownFilePlansInternal.some(p => p.fileName === filePlan.fileName)) {
        if (LOG_ERROR) console.error(prefix, "Attempt to download file for unknown or mismatched model:", filePlan.fileName);
        return;
    }

    const existingState = fileStatesInternal[filePlan.fileName];
    if (existingState?.status === 'present' || existingState?.status === 'downloaded' || existingState?.status === 'queued' || existingState?.status === 'downloading') {
        if (LOG_GENERAL) console.log(prefix, `File ${filePlan.fileName} already handled (status: ${existingState?.status}). Ignoring request.`);
        return;
    }

    const fullDownloadUrl = buildFullDownloadUrl(currentModelIdInternal, filePlan.fileName);
    console.log('[Downloader][Queue] Queuing file from popup:', filePlan.fileName, 'Full URL:', fullDownloadUrl);
    downloadQueueInternal.push({ ...filePlan, fullDownloadUrl });
    fileStatesInternal[filePlan.fileName] = { status: 'queued', progress: 0 };
    sendUpdateToPopup({ type: 'file_update', fileName: filePlan.fileName, status: 'queued', progress: 0 });
    processDownloadQueue();
}