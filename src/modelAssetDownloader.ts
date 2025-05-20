import browser from 'webextension-polyfill';
import { UIEventNames } from './events/eventNames';
import { sendDbRequestSmart } from './sidepanel';
import { DbAddModelAssetRequest, DbCountModelAssetChunksRequest } from './DB/dbEvents';

const prefix = '[Downloader]';
const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_RETRIES = 3;
const PROGRESS_THROTTLE_MS = 2000;
const PROGRESS_THROTTLE_CHUNKS = 200;

function logMemory(label: string) {
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
        console.log(`${prefix} Retrying chunk store, attempt ${attempt} for ${payload.fileName} chunk ${payload.chunkIndex}`);
        await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
    }
    console.error(`${prefix} Failed to store chunk after ${maxRetries} retries:`, payload.fileName, payload.chunkIndex);
    return false;
}

async function countModelAssetChunksViaMessage(folder: string, fileName: string, expectedSize: number, expectedChunks: number) {
    const req = new DbCountModelAssetChunksRequest({ folder, fileName, expectedSize, expectedChunks });
    const result = await sendDbRequestSmart(req);
    return result && result.success ? result.data : result;
}

async function fetchModelMetadataInternal(modelId: string) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    } catch (error) {
        console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}

async function filterAndValidateFilesInternal(metadata: any, modelId: string, baseDownloadUrl: string) {
    const hfFileEntries = metadata.siblings || [];
    const neededFileEntries = hfFileEntries.filter((f: any) => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('on') || f.rfilename.endsWith('.txt'));
    const neededFileNames = neededFileEntries.map((f: any) => f.rfilename);
    console.log(prefix, `Identified ${neededFileNames.length} needed files for ${modelId}:`, neededFileNames);

    if (neededFileEntries.length === 0) {
        return { neededFileEntries: [], message: "No .onnx, on, or .txt files found in model metadata." };
    }

    async function getFileSizeWithHEAD(url: string) {
        try {
            const headResp = await fetch(url, { method: 'HEAD' });
            if (headResp.ok) {
                const len = headResp.headers.get('Content-Length');
                return len ? parseInt(len, 10) : null;
            }
        } catch (e) {
            console.warn(prefix, `HEAD request failed for ${url}:`, e);
        }
        return null;
    }

    const sizePromises = neededFileEntries.map(async (entry: any) => {
        if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
            const url = baseDownloadUrl + entry.rfilename;
            const size = await getFileSizeWithHEAD(url);
            if (size && isFinite(size) && size > 0) {
                entry.size = size;
                console.log(prefix, `Got file size via HEAD for ${entry.rfilename}: ${size}`);
            } else {
                console.error(prefix, `Skipping file ${entry.rfilename}: missing/invalid size (HEAD failed or Content-Length missing)`);
                entry._skip = true;
            }
        }
    });

    await Promise.all(sizePromises);
    return { neededFileEntries, message: null };
}

function buildDownloadPlanInternal(neededFileEntries: any[]): { downloadPlan: any[], totalBytesToDownload: number, totalChunksToDownload: number } {
    const downloadPlan = neededFileEntries.filter((e: any) => !e._skip).map((entry: any, idx: number) => ({
        fileName: entry.rfilename,
        fileSize: entry.size,
        totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
        fileIdx: idx + 1,
        fileType: entry.rfilename.split('.').pop(),
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum: number, f: any) => sum + f.fileSize, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum: number, f: any) => sum + f.totalChunks, 0);
    console.log(prefix, "Built download plan:", { downloadPlan, totalBytesToDownload, totalChunksToDownload });
    return { downloadPlan, totalBytesToDownload, totalChunksToDownload };
}

async function getMissingFilesInternal(downloadPlan: any[], modelId: string) {
    const missingFiles: any[] = [];
    const presentFiles: { [key: string]: boolean } = {};
    for (const plan of downloadPlan) {
        const { fileName, fileSize, totalChunks } = plan;
        console.log(prefix, '[DB ChunkCount Check] Checking chunk count for:', { modelId, fileName, expectedChunks: totalChunks });
        const countResult = await countModelAssetChunksViaMessage(modelId, fileName, fileSize, totalChunks);
        console.log(prefix, '[DB ChunkCount Check] Result:', { modelId, fileName, expectedChunks: totalChunks, countResult });
        if (countResult && countResult.success && countResult.verified && countResult.count === totalChunks) {
            presentFiles[fileName] = true;
        } else {
            missingFiles.push(plan);
        }
    }
    return { missingFiles, presentFiles };
}

// Helper to format bytes as human-readable string
function formatBytes(bytes: number) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function streamAndStoreFileInternal(
    plan: any,
    modelId: string,
    baseDownloadUrl: string,
    totalBytesToDownload: number,
    totalChunksToDownload: number,
    totalBytesDownloaded: { value: number },
    totalChunksDownloaded: { value: number },
    totalFilesToAttempt: number
): Promise<{ fileFailed: boolean, fileName: string, fileBytesDownloaded: number, fileChunksDownloaded: number }> {
    const { fileName, fileSize, totalChunks, fileIdx, fileType } = plan;
    const downloadUrl = baseDownloadUrl + fileName;
    let fileBytesDownloaded = 0;
    let fileChunksDownloaded = 0;
    let fileFailed = false;
    let lastProgressSent = Date.now();
    let chunkIndex = 0;
    let allChunksSuccess = true;
    const chunkGroupId = `${modelId}/${fileName}`;
    let currentFileSource = "Download_Attempt";

    try {
        if (fileSize > 10 * 1024 * 1024) {
            logMemory(`Before file ${fileName}`);
        }
        console.log(prefix, `Downloading file from: ${downloadUrl}`);
        const downloadResponse = await fetch(downloadUrl);

        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            console.error(prefix, `Failed to download ${modelId}/${fileName}: ${downloadResponse.status} ${downloadResponse.statusText}`, errorText);
            await sendUiProgress({
                modelId,
                file: fileName,
                error: `Download failed (${downloadResponse.status})`,
                downloaded: 0,
                total: totalFilesToAttempt,
                currentFileSource,
                fileIdx,
                totalFiles: totalFilesToAttempt,
                fileTotalBytes: fileSize,
                fileTotalBytesHuman: formatBytes(fileSize)
            }).catch((e: any) => console.warn(`${prefix} Error sending progress on download fail: ${e.message}`));
            return { fileFailed: true, fileName, fileBytesDownloaded, fileChunksDownloaded };
        }
        currentFileSource = "Download_Success_Store_Attempt";

        if (!downloadResponse.body) {
            throw new Error('Download response body is null');
        }
        const reader = downloadResponse.body.getReader();
        let buffer = new Uint8Array(CHUNK_SIZE);
        let bufferOffset = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (!(value instanceof Uint8Array)) {
                console.error(prefix, `Invalid chunk data for ${fileName}, chunk ${chunkIndex}:`, typeof value);
                fileFailed = true;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex,
                    totalChunks,
                    error: `Invalid chunk data type: ${typeof value}`,
                    currentFileSource,
                    failType: 'invalid_chunk',
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize)
                }).catch((e: any) => console.warn(`${prefix} Error sending progress on invalid chunk: ${e.message}`));
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
                    let chunkToStore = buffer;
                    buffer = new Uint8Array(CHUNK_SIZE);
                    bufferOffset = 0;

                    const now = Date.now();
                    if (shouldLogOrSendChunkProgress(chunkIndex, totalChunks, lastProgressSent, now)) {
                        console.log(prefix, '[Chunk] About to store chunk:', { fileName, chunkIndex, chunkLength: chunkToStore.length });
                    }

                    const dbPayload = {
                        modelId,
                        fileName,
                        fileType,
                        data: chunkToStore,
                        chunkIndex,
                        totalChunks,
                        chunkGroupId,
                        binarySize: chunkToStore.byteLength,
                        totalFileSize: fileSize
                    };
                    const success = await tryStoreChunkInternal(dbPayload);

                    if (!success) {
                        allChunksSuccess = false;
                        fileFailed = true;
                        await sendUiProgress({
                            modelId,
                            file: fileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks,
                            error: `Failed to store chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries`,
                            currentFileSource,
                            failType: 'chunk_write',
                            fileTotalBytes: fileSize,
                            fileTotalBytesHuman: formatBytes(fileSize)
                        }).catch((e: any) => console.warn(`${prefix} Error sending progress on chunk store fail: ${e.message}`));
                        reader.cancel('Chunk storage failed');
                        break;
                    }

                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded.value++;
                    fileBytesDownloaded += chunkToStore.byteLength;
                    totalBytesDownloaded.value += chunkToStore.byteLength;

                    if (chunkIndex === totalChunks || shouldLogOrSendChunkProgress(chunkIndex, totalChunks, lastProgressSent, now)) {
                        await sendUiProgress({
                            modelId,
                            file: fileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks,
                            fileBytesDownloaded,
                            fileTotalBytes: fileSize,
                            fileTotalBytesHuman: formatBytes(fileSize),
                            totalBytesDownloaded: totalBytesDownloaded.value,
                            totalBytesToDownload,
                            totalChunksDownloaded: totalChunksDownloaded.value,
                            totalChunksToDownload,
                            percent: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                            filePercent: (fileBytesDownloaded / fileSize) * 100,
                            progress: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                            status: 'progress',
                            currentFileSource
                        }).catch((e: any) => console.warn(`${prefix} Error sending progress update: ${e.message}`));
                        lastProgressSent = now;
                    }
                }
            }
            if (fileFailed) break;
        }

        if (allChunksSuccess && !fileFailed && bufferOffset > 0) {
            let finalChunkToStore = buffer.subarray(0, bufferOffset);
            await sendUiProgress({
                modelId,
                file: fileName,
                fileIdx,
                totalFiles: totalFilesToAttempt,
                chunkIndex,
                totalChunks,
                fileBytesDownloaded,
                fileTotalBytes: fileSize,
                fileTotalBytesHuman: formatBytes(fileSize),
                totalBytesDownloaded: totalBytesDownloaded.value,
                totalBytesToDownload,
                totalChunksDownloaded: totalChunksDownloaded.value,
                totalChunksToDownload,
                percent: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                filePercent: 100,
                progress: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                status: 'progress',
                currentFileSource
            }).catch((e: any) => console.warn(`${prefix} Error sending progress for final chunk: ${e.message}`));
        }

        if (allChunksSuccess && !fileFailed) {
            const countResult = await countModelAssetChunksViaMessage(modelId, fileName, fileSize, totalChunks);
            if (countResult.success && countResult.verified && countResult.count === totalChunks) {
                currentFileSource = "DB_Stored_After_Download";
                console.log(prefix, `Successfully downloaded, stored, and verified all chunks for ${modelId}/${fileName} in DB.`);
            } else {
                fileFailed = true;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    error: `Verification failed: ${countResult.error || 'Unknown error'}`,
                    failType: 'verification',
                    currentFileSource,
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize)
                }).catch((e: any) => console.warn(`${prefix} Error sending progress on verification fail: ${e.message}`));
            }
        } else if (fileFailed || !allChunksSuccess) {
            console.error(prefix, `Failed to store all chunks for ${modelId}/${fileName} in DB after download.`);
             await sendUiProgress({
                modelId,
                file: fileName,
                error: `DB store failed after download (chunked)`,
                fileIdx,
                totalFiles: totalFilesToAttempt,
                currentFileSource,
                failType: 'file_fail_internal',
                fileTotalBytes: fileSize,
                fileTotalBytesHuman: formatBytes(fileSize)
            }).catch((e: any) => console.warn(`${prefix} Error sending progress on internal file fail: ${e.message}`));
        }

        if (fileSize > 10 * 1024 * 1024) {
            logMemory(`After file ${fileName}`);
        }
    } catch (error: unknown) {
        fileFailed = true;
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(prefix, `Error downloading ${modelId}/${fileName}:`, error);
        await sendUiProgress({
            modelId,
            file: fileName,
            fileIdx,
            totalFiles: totalFilesToAttempt,
            error: errMsg,
            failType: 'exception',
            currentFileSource,
            fileTotalBytes: fileSize,
            fileTotalBytesHuman: formatBytes(fileSize)
        }).catch((e: any) => console.warn(`${prefix} Error sending progress on exception: ${e.message}`));
    }

    return { fileFailed, fileName, fileBytesDownloaded, fileChunksDownloaded };
}

async function downloadMissingFilesInternal(
    missingFiles: any[],
    modelId: string,
    downloadPlan: any[],
    totalBytesToDownload: number,
    totalChunksToDownload: number,
    presentFiles: { [key: string]: boolean },
    baseDownloadUrl: string
): Promise<{ successfullyProcessedFileMap: { [key: string]: boolean }, filesSuccessfullyProcessedCount: number, failedFiles: string[] }> {
    let filesSuccessfullyProcessedCount = Object.keys(presentFiles).length;
    const totalBytesDownloaded = { value: downloadPlan.filter((p: any) => presentFiles[p.fileName]).reduce((sum: number, p: any) => sum + p.fileSize, 0) };
    const totalChunksDownloaded = { value: downloadPlan.filter((p: any) => presentFiles[p.fileName]).reduce((sum: number, p: any) => sum + p.totalChunks, 0) };
    const totalFilesToAttempt = downloadPlan.length;
    const successfullyProcessedFileMap: { [key: string]: boolean } = { ...presentFiles };
    const failedFiles: string[] = [];

    console.log(prefix, "Initial download progress state:", {
        filesSuccessfullyProcessedCount,
        totalBytesDownloaded: totalBytesDownloaded.value,
        totalChunksDownloaded: totalChunksDownloaded.value,
        totalFilesToAttempt,
        presentFiles
    });

    for (const plan of missingFiles) {
        const result = await streamAndStoreFileInternal(
            plan,
            modelId,
            baseDownloadUrl,
            totalBytesToDownload,
            totalChunksToDownload,
            totalBytesDownloaded,
            totalChunksDownloaded,
            totalFilesToAttempt
        );

        if (!result.fileFailed) {
            successfullyProcessedFileMap[result.fileName] = true;
            filesSuccessfullyProcessedCount++;
        } else {
            failedFiles.push(result.fileName);
        }
    }

    console.log(prefix, "Final download progress state after processing missing files:", {
        filesSuccessfullyProcessedCount,
        totalBytesDownloaded: totalBytesDownloaded.value,
        totalChunksDownloaded: totalChunksDownloaded.value,
        failedFiles
    });
    return { successfullyProcessedFileMap, filesSuccessfullyProcessedCount, failedFiles };
}

function sendUiProgress(payload: any) {
    return browser.runtime.sendMessage({
        type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
        payload
    }).catch((e: any) => console.warn(`${prefix} Error sending MODEL_DOWNLOAD_PROGRESS: ${e.message}`));
}

export async function downloadModelAssets(modelId: string): Promise<any> {
    console.log(prefix, `Starting downloadModelAssets for modelId: ${modelId}`);
    const baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;
    let totalBytesToDownload = 0;
    try {
        const metadata = await fetchModelMetadataInternal(modelId);
        const { neededFileEntries, message: filterMessage } = await filterAndValidateFilesInternal(metadata, modelId, baseDownloadUrl);

        if (neededFileEntries.length === 0) {
            console.warn(prefix, filterMessage || "No needed files after filtering.");
            return { success: true, fileMap: {}, message: filterMessage || "No needed files to download." };
        }

        const { downloadPlan, totalBytesToDownload: tBytes, totalChunksToDownload } = buildDownloadPlanInternal(neededFileEntries);
        totalBytesToDownload = tBytes;
        if (downloadPlan.length === 0) {
            const msg = `No valid files to download for ${modelId} after validation and plan building.`;
            console.warn(prefix, msg);
            return { success: true, fileMap: {}, message: msg };
        }

        const { missingFiles, presentFiles } = await getMissingFilesInternal(downloadPlan, modelId);
        console.log(prefix, `Files already present in DB for ${modelId}:`, Object.keys(presentFiles));
        console.log(prefix, `Files missing and will be downloaded for ${modelId}:`, missingFiles.map((f: any) => f.fileName));

        await sendUiProgress({
            modelId,
            initialScanComplete: true,
            totalFilesToAttempt: downloadPlan.length,
            filesAlreadyPresent: Object.keys(presentFiles).length,
            filesToDownload: missingFiles.length,
            totalBytesToDownload,
            totalBytesAlreadyPresent: downloadPlan.filter((p: any) => presentFiles[p.fileName]).reduce((sum: number, p: any) => sum + p.fileSize, 0),
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch((e: any) => console.warn(`${prefix} Error sending initial scan progress: ${e.message}`));

        if (missingFiles.length === 0) {
            const msg = `All ${downloadPlan.length} assets for ${modelId} are already available in DB.`;
            console.log(prefix, msg);
            await sendUiProgress({
                modelId,
                summary: true,
                filesSuccessfullyProcessedCount: Object.keys(presentFiles).length,
                totalFilesToAttempt: downloadPlan.length,
                failedFiles: [],
                success: true,
                message: msg,
                fileTotalBytes: totalBytesToDownload,
                fileTotalBytesHuman: formatBytes(totalBytesToDownload)
            }).catch((e: any) => console.warn(`${prefix} Error sending progress for 'all files present': ${e.message}`));
            return { success: true, fileMap: presentFiles, message: msg, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };
        }

        const { successfullyProcessedFileMap, filesSuccessfullyProcessedCount, failedFiles } = await downloadMissingFilesInternal(
            missingFiles,
            modelId,
            downloadPlan,
            totalBytesToDownload,
            totalChunksToDownload,
            presentFiles,
            baseDownloadUrl
        );

        console.log(prefix, `Finished processing all ${downloadPlan.length} needed files for ${modelId}. Successfully processed ${filesSuccessfullyProcessedCount} files.`);
        const overallSuccess = filesSuccessfullyProcessedCount === downloadPlan.length;
        const finalMessage = overallSuccess
            ? `All ${downloadPlan.length} assets for ${modelId} are now available in DB.`
            : `Failed to process all assets for ${modelId}. Got ${filesSuccessfullyProcessedCount} of ${downloadPlan.length}. Failed files: ${failedFiles.join(', ')}. Check logs for details.`;

        await sendUiProgress({
            modelId,
            summary: true,
            filesSuccessfullyProcessedCount,
            totalFilesToAttempt: downloadPlan.length,
            failedFiles,
            success: overallSuccess,
            message: finalMessage,
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch((e: any) => console.warn(`${prefix} Error sending final summary progress: ${e.message}`));
        console.log(prefix, finalMessage);
        return { success: overallSuccess, fileMap: successfullyProcessedFileMap, message: finalMessage, failedFiles, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };

    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(prefix, `Critical error in downloadModelAssets for ${modelId}:`, error);
        await sendUiProgress({
            modelId,
            summary: true,
            error: `Download process failed: ${errMsg}`,
            success: false,
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch((e: any) => console.warn(`${prefix} Error sending progress on critical error: ${e.message}`));
        return { success: false, error: `Download process failed for ${modelId}: ${errMsg}`, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };
    }
}