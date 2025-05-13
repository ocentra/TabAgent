// modelLoaderWorkerOffscreen.js
import { WorkerEventNames, ModelLoaderMessageTypes, UIEventNames, DirectDBNames, DBEventNames } from './events/eventNames.js';
import browser from 'webextension-polyfill';

let modelWorker = null;
let workerScriptReady = false;
let modelWorkerInitializationInProgress = false;

const allowedMessageTypesFromBackground = new Set(Object.values(ModelLoaderMessageTypes));
const prefix = '[Offscreen]';

// Helper: Log memory usage (Chrome only)
function logMemory(label) {
    if (performance && performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`${prefix} [Memory][${label}] Used: ${usedMB} MB / Total: ${totalMB} MB`);
    } else {
        console.log(`${prefix} [Memory][${label}] performance.memory not available`);
    }
}

function initializeModelWorker() {
    if (modelWorker || modelWorkerInitializationInProgress) {
        if (modelWorker) console.log(prefix, " model worker instance already exists or is ready.");
        if (modelWorkerInitializationInProgress) console.log(prefix, " model worker initialization is already in progress.");
        return modelWorker;
    }

    console.log(prefix, "Creating  Model Worker (model-worker.js)...");
    modelWorkerInitializationInProgress = true;
    workerScriptReady = false;

    try {
        modelWorker = new globalThis.Worker(browser.runtime.getURL('model-worker.js'), { type: 'module' });
        console.log(prefix, " Model Worker instance successfully created.");

        modelWorker.onmessage = async (event) => {
            if (!event.data || !event.data.type) {
                // Ignore empty/system messages
                if (event.data && Object.keys(event.data).length === 0) return;
                // Log at debug level for unexpected non-empty messages
                console.debug(prefix, "Received message from model worker without type or data (likely MessageChannel/system message):", event.data, event);
                return;
            }
            const { type, payload } = event.data;

            // --- Handle LIST_MODEL_FILES requests from the model worker ---
            if (type === ModelLoaderMessageTypes.LIST_MODEL_FILES) {
                const { requestId, payload: reqPayload } = event.data;
                console.log(prefix, '[Offscreen][modelWorker.onmessage] LIST_MODEL_FILES received from model worker:', reqPayload, 'requestId:', requestId);
                try {
                    const { modelId } = reqPayload || {};
                    if (!modelId) {
                        modelWorker.postMessage({
                            type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: 'No modelId provided' }
                        });
                        return;
                    }
                    const docsResult = await browser.runtime.sendMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES,
                        payload: { modelId }
                    });
                    if (!docsResult.success) {
                        modelWorker.postMessage({
                            type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: docsResult.error }
                        });
                        return;
                    }
                    const files = docsResult.files;
                    modelWorker.postMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: true, files }
                    });
                    console.log(prefix, '[Offscreen][modelWorker.onmessage] LIST_MODEL_FILES_RESULT sent to model worker:', files, 'requestId:', requestId);
                } catch (err) {
                    modelWorker.postMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: false, error: err.message }
                    });
                    console.error(prefix, '[Offscreen][modelWorker.onmessage] Error handling LIST_MODEL_FILES:', err);
                }
                return; // Don't process further
            }

            // Relay pipeline loading progress to UI
            if (type === WorkerEventNames.LOADING_STATUS) {
                browser.runtime.sendMessage({
                    type: UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE,
                    payload
                });
            }

            if (type === WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE) {
                const { modelId, fileName } = payload;
                const requestPort = event.ports && event.ports[0];

                if (!requestPort) {
                    console.error(prefix, `${WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE}: No MessageChannel port received for asset request: ${modelId}/${fileName}.`);
                    return;
                }
                console.log(prefix, `${WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE} from model-worker for asset: ${modelId}/${fileName}`);

                try {
                    const dbQueryResults = await browser.runtime.sendMessage({ type: DirectDBNames.GET_MODEL_ASSET, payload: { modelId, fileName } });
                    const dbQueryResult = dbQueryResults && dbQueryResults.length > 0 ? dbQueryResults[0] : null;

                    if (dbQueryResult && dbQueryResult.success && dbQueryResult.data) {
                        const assetData = dbQueryResult.data.data;
                        if (typeof assetData === 'string') {
                            const byteCharacters = atob(assetData);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            console.log(prefix, `Sending ArrayBuffer (length: ${byteArray.buffer.byteLength}) for ${modelId}/${fileName} back to model-worker.`);
                            requestPort.postMessage({ arrayBuffer: byteArray.buffer }, [byteArray.buffer]);
                        } else if (assetData instanceof ArrayBuffer) {
                            console.log(prefix, `Sending ArrayBuffer (length: ${assetData.byteLength}) for ${modelId}/${fileName} back to model-worker (direct ArrayBuffer).`);
                            requestPort.postMessage({ arrayBuffer: assetData }, [assetData]);
                        } else if (ArrayBuffer.isView(assetData)) {
                            console.log(prefix, `Sending ArrayBuffer (length: ${assetData.byteLength}) for ${modelId}/${fileName} back to model-worker (TypedArray).`);
                            requestPort.postMessage({ arrayBuffer: assetData.buffer }, [assetData.buffer]);
                        } else {
                            const errorMessage = `Asset ${modelId}/${fileName} found in DB but data is not a string, ArrayBuffer, or TypedArray.`;
                            console.error(prefix, errorMessage, "Full DB result:", dbQueryResult);
                            requestPort.postMessage({ error: errorMessage });
                        }
                    } else {
                        const errorMessage = dbQueryResult?.error || `Asset ${modelId}/${fileName} not found in DB or DB response was invalid.`;
                        console.error(prefix, errorMessage, "Full DB result:", dbQueryResult);
                        requestPort.postMessage({ error: errorMessage });
                    }
                } catch (err) {
                    console.error(prefix, `Error during eventBus.publish for GET_MODEL_ASSET (${modelId}/${fileName}):`, err);
                    requestPort.postMessage({ error: `EventBus publish error for GET_MODEL_ASSET: ${err.message}` });
                } finally {
                    requestPort.close();
                }
                return;
            }

            if (type !== WorkerEventNames.GENERATION_UPDATE && type !== WorkerEventNames.LOADING_STATUS) {
                console.log(prefix, `Received message from  Model Worker: Type: ${type}, Payload:`, payload);
            }

            const typesToForwardToBackground = [
                WorkerEventNames.WORKER_SCRIPT_READY, WorkerEventNames.WORKER_READY, WorkerEventNames.ERROR,
                WorkerEventNames.LOADING_STATUS, WorkerEventNames.GENERATION_STATUS, WorkerEventNames.GENERATION_UPDATE,
                WorkerEventNames.GENERATION_COMPLETE, WorkerEventNames.GENERATION_ERROR, WorkerEventNames.RESET_COMPLETE
            ];

            if (typesToForwardToBackground.includes(type)) {
                if (type !== WorkerEventNames.GENERATION_UPDATE && type !== WorkerEventNames.LOADING_STATUS) {
                    console.log(prefix, `Forwarding message type \`${type}\` to background.`);
                }
                try {
                    await browser.runtime.sendMessage({ type, payload });
                } catch (error) {
                    console.error(prefix, `Error sending message type '${type}' to background:`, error);
                }
            } else {
                if (type !== ModelLoaderMessageTypes.LIST_MODEL_FILES) {
                    console.warn(prefix, `Not forwarding message type \`${type}\` from  worker. (Consider adding to eventNames.js and forward list)`);
                }
            }

            if (type === WorkerEventNames.WORKER_SCRIPT_READY) {
                workerScriptReady = true;
                modelWorkerInitializationInProgress = false;
                console.log(prefix, " Model Worker script (model-worker.js) has signaled readiness.");
            }
            if (type === WorkerEventNames.WORKER_READY) {
                modelWorkerInitializationInProgress = false; // Model fully loaded and ready
                console.log(prefix, " Model Worker has signaled model readiness for:", payload?.model);
            }
            if (type === WorkerEventNames.ERROR) {
                console.error(prefix, "Error reported from  model worker:", payload);
                if(modelWorkerInitializationInProgress) { // If error during init
                    modelWorkerInitializationInProgress = false;
                    workerScriptReady = false; // It didn't fully initialize
                }
            }
        };

        modelWorker.onerror = (errorEvent) => {
            console.error(prefix, " Model Worker 'onerror' event triggered:", errorEvent);
            const errorMessage = errorEvent.message || 'Unknown error in  model worker';
            const errorDetails = `Error in  worker: ${errorMessage} (File: ${errorEvent.filename}, Line: ${errorEvent.lineno})`;
            console.error(prefix, " Worker onerror details:", errorDetails);
            browser.runtime.sendMessage({ type: WorkerEventNames.ERROR, payload: errorDetails })
                .catch(err => console.error(prefix, "Error sending  worker's 'onerror' event to background:", err));
            
            modelWorker.terminate(); // Terminate the errored worker
            modelWorker = null;
            workerScriptReady = false;
            modelWorkerInitializationInProgress = false;
        };

    } catch (error) {
        console.error(prefix, "Failed to create  Model Worker instance (new Worker()):", error);
        browser.runtime.sendMessage({ type: WorkerEventNames.ERROR, payload: `Offscreen failed to instantiate  model worker: ${error.message}` })
            .catch(err => console.error(prefix, "Error sending model worker instantiation error to background:", err));
        modelWorker = null;
        workerScriptReady = false;
        modelWorkerInitializationInProgress = false;
    }
    return modelWorker;
}

async function downloadModelAssetsAndReport(modelId, sendResponseCallback) {
    console.log(prefix, `Starting downloadModelAssetsAndReport for modelId: ${modelId}`);
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    const baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;

    let metadata;
    try {
        console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        metadata = await response.json();
        console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
    } catch (error) {
        console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        sendResponseCallback({ success: false, error: `Metadata fetch for ${modelId} failed: ${error.message}` });
        return;
    }

    const hfFileEntries = metadata.siblings || [];
    // Only include .onnx, .json, .txt files
    const neededFileEntries = hfFileEntries.filter(f => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('.json') || f.rfilename.endsWith('.txt'));
    const neededFileNames = neededFileEntries.map(f => f.rfilename);
    console.log(prefix, `Identified ${neededFileNames.length} needed files for ${modelId}:`, neededFileNames);

    if (neededFileNames.length === 0) {
        console.warn(prefix, `No files matching .onnx, .json, or .txt found in HuggingFace metadata for ${modelId}.`);
        sendResponseCallback({ success: true, fileMap: {}, message: "No .onnx, .json, or .txt files found in model metadata." });
        return;
    }

    // --- Ensure all needed files have a valid size ---
    async function getFileSizeWithHEAD(url) {
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
    for (const entry of neededFileEntries) {
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
    }
    // Build download plan: list of files, sizes, and chunk counts (skip files with _skip)
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const downloadPlan = neededFileEntries.filter(e => !e._skip).map((entry, idx) => ({
        fileName: entry.rfilename,
        fileSize: entry.size,
        totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
        fileIdx: idx + 1,
        fileType: entry.rfilename.split('.').pop(),
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum, f) => sum + f.fileSize, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum, f) => sum + f.totalChunks, 0);

    // Helper: Retry chunk write with exponential backoff
    async function tryStoreChunk(payload, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            const addResults = await browser.runtime.sendMessage({ type: DirectDBNames.ADD_MODEL_ASSET, payload });
            const addResult = addResults && addResults.success !== undefined ? addResults : (addResults && addResults[0] ? addResults[0] : null);
            if (addResult && addResult.success) return true;
            attempt++;
            await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt))); // Exponential backoff
        }
        return false;
    }

    let filesSuccessfullyProcessedCount = 0;
    let totalBytesDownloaded = 0;
    let totalChunksDownloaded = 0;
    const totalFilesToAttempt = downloadPlan.length;
    const successfullyProcessedFileMap = {};
    const failedFiles = [];

    for (let filePlanIdx = 0; filePlanIdx < downloadPlan.length; filePlanIdx++) {
        const plan = downloadPlan[filePlanIdx];
        const relativeFileName = plan.fileName;
        const fileTotalBytes = plan.fileSize;
        const fileTotalChunks = plan.totalChunks;
        const fileIdx = plan.fileIdx;
        let currentFileSource = "DB_Check";
        let fileBytesDownloaded = 0;
        let fileChunksDownloaded = 0;
        let fileFailed = false;
        let lastLoggedPercent = -1;
        try {
            // Log memory before big file
            if (fileTotalBytes > 10 * 1024 * 1024) {
                logMemory(` Before file ${relativeFileName}`);
            }

            // --- CHUNK COUNT CHECK BEFORE DOWNLOAD ---
            console.log('[Offscreen][DB ChunkCount Check] Checking chunk count for:', { modelId, fileName: relativeFileName, expectedChunks: fileTotalChunks });
            const countResult = await browser.runtime.sendMessage({
                type: DirectDBNames.COUNT_MODEL_ASSET_CHUNKS,
                payload: { modelId, fileName: relativeFileName }
            });
            console.log('[Offscreen][DB ChunkCount Check] Result:', countResult);

            const verifyResult = await browser.runtime.sendMessage({
              type: DirectDBNames.VERIFY_MODEL_ASSET,
              payload: { modelId, fileName: relativeFileName, expectedSize: fileTotalBytes }
            });

            if (!verifyResult.success) {
                console.error('[VerifyDownload] Failed to verify file in DB:', modelId, relativeFileName, verifyResult.error);
                return
            }



            if (countResult && countResult.success && countResult.count === fileTotalChunks) {
                successfullyProcessedFileMap[relativeFileName] = true;
                filesSuccessfullyProcessedCount++;
                currentFileSource = "DB_Found_Chunks";
                console.log(prefix, `File already in DB (all chunks present): ${modelId}/${relativeFileName}`);
                if (fileTotalBytes) {
                    totalBytesDownloaded += fileTotalBytes;
                }
                totalChunksDownloaded += fileTotalChunks;
                fileBytesDownloaded = fileTotalBytes;
                fileChunksDownloaded = fileTotalChunks;
                // Report progress for already-in-DB file
                browser.runtime.sendMessage({
                    type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        fileIdx,
                        totalFiles: totalFilesToAttempt,
                        chunkIndex: fileTotalChunks,
                        totalChunks: fileTotalChunks,
                        fileBytesDownloaded,
                        fileTotalBytes,
                        totalBytesDownloaded,
                        totalBytesToDownload,
                        totalChunksDownloaded,
                        totalChunksToDownload,
                        percent: (totalBytesDownloaded / totalBytesToDownload) * 100,
                        filePercent: (fileBytesDownloaded / fileTotalBytes) * 100,
                        currentFileSource
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (already in DB):", e));
                continue; // Skip to next file
            }

            currentFileSource = "Download_Attempt";
            console.log(prefix, `File ${modelId}/${relativeFileName} not in DB or DB query failed. Attempting download. DB Query Result:`, countResult);
            const downloadUrl = baseDownloadUrl + relativeFileName;
            console.log(prefix, `Downloading file from: ${downloadUrl}`);
            const downloadResponse = await fetch(downloadUrl);

            if (!downloadResponse.ok) {
                const errorText = await downloadResponse.text();
                console.error(prefix, `Failed to download ${modelId}/${relativeFileName}: ${downloadResponse.status} ${downloadResponse.statusText}`, errorText);
                browser.runtime.sendMessage({
                    type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        error: `Download failed (${downloadResponse.status})`,
                        downloaded: filesSuccessfullyProcessedCount,
                        total: totalFilesToAttempt,
                        currentFileSource,
                        fileIdx,
                        totalFiles: totalFilesToAttempt
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (failure):", e));
                continue;
            }
            currentFileSource = "Download_Success_Store_Attempt";

            // --- Streams API chunked download and storage with 1MB buffering ---
            const reader = downloadResponse.body.getReader();
            let chunkIndex = 0;
            const chunkGroupId = `${modelId}/${relativeFileName}`;
            let allChunksSuccess = true;
            let buffer = new Uint8Array(0); // Buffer for 1MB chunks
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                let tmp = new Uint8Array(buffer.length + value.length);
                tmp.set(buffer, 0);
                tmp.set(value, buffer.length);
                buffer = tmp;
                while (buffer.length >= CHUNK_SIZE) {
                    const chunk = buffer.slice(0, CHUNK_SIZE);
                    buffer = buffer.slice(CHUNK_SIZE);
                    // Defensive: Check totalChunks
                    if (!fileTotalChunks || fileTotalChunks === null || fileTotalChunks === undefined) {
                        console.warn(`[Offscreen][Defensive] totalChunks is missing or invalid for ${relativeFileName} chunk ${chunkIndex}`);
                    }
                    // --- Robust: Retry chunk write ---
                    const payload = {
                        modelId,
                        fileName: relativeFileName,
                        fileType: plan.fileType,
                        data: Array.from(chunk),
                        chunkIndex,
                        totalChunks: fileTotalChunks,
                        chunkGroupId,
                        binarySize: chunk.byteLength,
                        totalFileSize: fileTotalBytes
                    };
                    const success = await tryStoreChunk(payload);
                    if (!success) {
                        allChunksSuccess = false;
                        fileFailed = true;
                        failedFiles.push(relativeFileName);
                        browser.runtime.sendMessage({
                            type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                            payload: {
                                modelId,
                                file: relativeFileName,
                                fileIdx,
                                totalFiles: totalFilesToAttempt,
                                chunkIndex,
                                totalChunks: fileTotalChunks,
                                error: `Failed to store chunk ${chunkIndex + 1} after retries`,
                                currentFileSource,
                                failType: 'chunk_write',
                            }
                        }).catch(e => console.error(prefix, "Error sending download progress (chunk fail):", e));
                        break;
                    }
                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded++;
                    fileBytesDownloaded += chunk.byteLength;
                    totalBytesDownloaded += chunk.byteLength;
                    // --- Throttle progress logs/messages: only first and last chunk ---
                    if (chunkIndex === 1 || chunkIndex === fileTotalChunks) {
                        console.log(`[Offscreen] ${chunkIndex === 1 ? 'Started' : 'Finished'} storing chunk ${chunkIndex} for ${relativeFileName}`);
                    }
                }
            }
            // Send any remaining data in buffer
            if (allChunksSuccess && buffer.length > 0) {
                const chunk = buffer;
                buffer = new Uint8Array(0); // Release memory
                const payload = {
                    modelId,
                    fileName: relativeFileName,
                    fileType: plan.fileType,
                    data: Array.from(chunk),
                    chunkIndex,
                    totalChunks: fileTotalChunks,
                    chunkGroupId,
                    binarySize: chunk.byteLength,
                    totalFileSize: fileTotalBytes
                };
                const success = await tryStoreChunk(payload);
                if (!success) {
                    allChunksSuccess = false;
                    fileFailed = true;
                    failedFiles.push(relativeFileName);
                    browser.runtime.sendMessage({
                        type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks: fileTotalChunks,
                            error: `Failed to store final chunk ${chunkIndex + 1} after retries`,
                            currentFileSource,
                            failType: 'chunk_write',
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (final chunk fail):", e));
                } else {
                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded++;
                    fileBytesDownloaded += chunk.byteLength;
                    totalBytesDownloaded += chunk.byteLength;
                    // Always log/send for last chunk
                    console.log(`[Offscreen] Finished storing all chunks for ${relativeFileName}`);
                    browser.runtime.sendMessage({
                        type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks: fileTotalChunks,
                            fileBytesDownloaded,
                            fileTotalBytes,
                            totalBytesDownloaded,
                            totalBytesToDownload,
                            totalChunksDownloaded,
                            totalChunksToDownload,
                            percent: (totalBytesDownloaded / totalBytesToDownload) * 100,
                            filePercent: 100,
                            currentFileSource
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (final chunk):", e));
                }
            }
            // --- Efficient: Post-write verification only after last chunk ---
            if (allChunksSuccess && !fileFailed) {
                // Only verify after last chunk
                const countResult = await browser.runtime.sendMessage({
                    type: DirectDBNames.COUNT_MODEL_ASSET_CHUNKS,
                    payload: { modelId, fileName: relativeFileName }
                });
                if (countResult.success && countResult.count === fileTotalChunks) {
                    successfullyProcessedFileMap[relativeFileName] = true;
                    filesSuccessfullyProcessedCount++;
                    currentFileSource = "DB_Stored_After_Download";
                    console.log(prefix, `Successfully downloaded, stored, and verified all chunks for ${modelId}/${relativeFileName} in DB.`);
                } else {
                    fileFailed = true;
                    failedFiles.push(relativeFileName);
                    browser.runtime.sendMessage({
                        type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            error: `Verification failed: Only ${countResult.count} of ${fileTotalChunks} chunks present in DB after upload`,
                            failType: 'verification',
                            currentFileSource
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (verification fail):", e));
                    continue;
                }
            } else if (fileFailed || !allChunksSuccess) {
                console.error(prefix, `Failed to store all chunks for ${modelId}/${relativeFileName} in DB after download.`);
                browser.runtime.sendMessage({
                    type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        error: `DB store failed after download (chunked)` ,
                        downloaded: filesSuccessfullyProcessedCount,
                        total: totalFilesToAttempt,
                        currentFileSource,
                        fileIdx,
                        totalFiles: totalFilesToAttempt,
                        failType: 'file_fail',
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (store/verify failure):", e));
                continue;
            }

            // Progress for successfully processed file (either found or downloaded+stored)
            let percent = (totalBytesDownloaded / totalBytesToDownload) * 100;
            let filePercent = (fileBytesDownloaded / fileTotalBytes) * 100;
            browser.runtime.sendMessage({
                type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                payload: {
                    modelId,
                    file: relativeFileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex: fileChunksDownloaded,
                    totalChunks: fileTotalChunks,
                    fileBytesDownloaded,
                    fileTotalBytes,
                    totalBytesDownloaded,
                    totalBytesToDownload,
                    totalChunksDownloaded,
                    totalChunksToDownload,
                    percent,
                    filePercent,
                    currentFileSource
                }
            }).catch(e => console.error(prefix, "Error sending download progress (success):", e));

            // Log memory after big file
            if (fileTotalBytes > 10 * 1024 * 1024) {
                logMemory(`After file ${relativeFileName}`);
            }

        } catch (error) {
            fileFailed = true;
            failedFiles.push(relativeFileName);
            browser.runtime.sendMessage({
                type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                payload: {
                    modelId,
                    file: relativeFileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    error: error.message,
                    failType: 'exception',
                    currentFileSource
                }
            }).catch(e => console.error(prefix, "Error sending download progress (exception):", e));
            // Continue to next file
        }
    }

    console.log(prefix, `Finished processing all ${totalFilesToAttempt} needed files for ${modelId}. Successfully processed ${filesSuccessfullyProcessedCount} files.`);
    if (filesSuccessfullyProcessedCount === totalFilesToAttempt) {
        sendResponseCallback({ success: true, fileMap: successfullyProcessedFileMap, message: `All ${totalFilesToAttempt} assets for ${modelId} are now available in DB.` });
    } else {
        sendResponseCallback({ success: false, fileMap: successfullyProcessedFileMap, error: `Failed to process all assets for ${modelId}. Got ${filesSuccessfullyProcessedCount} of ${totalFilesToAttempt}. Check logs for details.` });
    }

    // --- Final summary report ---
    browser.runtime.sendMessage({
        type: UIEventNames.MODEL_DOWNLOAD_PROGRESS,
        payload: {
            modelId,
            summary: true,
            filesSuccessfullyProcessedCount,
            totalFilesToAttempt,
            failedFiles,
            success: failedFiles.length === 0,
            message: failedFiles.length === 0 ? `All ${totalFilesToAttempt} assets for ${modelId} are now available in DB.` : `Some files failed: ${failedFiles.join(', ')}`
        }
    }).catch(e => console.error(prefix, "Error sending download progress (final summary):", e));
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    if (Object.values(DirectDBNames).includes(type)) {
        return false;
    }
    if (Object.values(DBEventNames).includes(type)) {
        return false;
    }

    if (!message || !message.type) {
        console.warn(prefix, "Received message from background without type:", message);
        return false; // Indicate that sendResponse will not be called
    }

    if (!allowedMessageTypesFromBackground.has(message.type)) {
        // This message is not for the model loader part of the offscreen document.
        return false; // Allow other listeners to handle it.
    }

    console.log(prefix, `Received message from background: Type: ${message.type}, Payload:`, message.payload);
    const { type: messageType, payload } = message;
    const currentWorker = initializeModelWorker();

    if (!currentWorker && messageType !== ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS) {
        console.error(prefix, `Cannot handle message type '${messageType}'.  model worker (model-worker.js) is not available, and message is not DOWNLOAD_MODEL_ASSETS.`);
        sendResponse({ success: false, error: " model worker instance is not available or failed to initialize." });
        return false;
    }

    switch (messageType) {
        case ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS:
            console.log(prefix, `Handling ${ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS} for model: ${payload?.modelId}`);
            if (!payload || !payload.modelId) {
                console.error(prefix, `${ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS} request is missing modelId.`);
                sendResponse({ success: false, error: "Model ID not provided for download." });
                return false;
            }
            downloadModelAssetsAndReport(payload.modelId, sendResponse);
            return true; // Indicates async response

        case ModelLoaderMessageTypes.INIT:
            console.log(prefix, `Handling ${ModelLoaderMessageTypes.INIT} (to initialize  worker) for model: ${payload?.modelId}`);
            if (!currentWorker) {
                 console.error(prefix, `Cannot forward ${ModelLoaderMessageTypes.INIT}.  model worker instance is null even after initialization attempt.`);
                 sendResponse({ success: false, error: " model worker instance is unexpectedly null." });
                 return false;
            }
            if (!payload || !payload.modelId) {
                console.error(prefix, `${ModelLoaderMessageTypes.INIT} request is missing modelId.`);
                sendResponse({ success: false, error: "Model ID not provided for  worker initialization." });
                return false;
            }

            const wasmPath = browser.runtime.getURL('xenova/transformers/dist/');
            console.log(prefix, `Posting 'init' (internal type for model-worker.js) to  model worker for model ${payload.modelId}. WASM Path: ${wasmPath}`);
            try {
                currentWorker.postMessage({
                    type: 'init', // This 'init' is for model-worker.js
                    payload: {
                        modelId: payload.modelId,
                        wasmPath: wasmPath,
                    }
                });
                sendResponse({ success: true, message: `INIT command for model ${payload.modelId} has been posted to  model worker.` });
            } catch (error) {
                console.error(prefix, `Error posting 'init' (internal type) message to  model worker:`, error);
                sendResponse({ success: false, error: `Error posting INIT to  model worker: ${error.message}` });
            }
            return false;

        case ModelLoaderMessageTypes.GENERATE:
        case ModelLoaderMessageTypes.INTERRUPT:
        case ModelLoaderMessageTypes.RESET:
            if (!workerScriptReady && messageType === ModelLoaderMessageTypes.GENERATE) {
                 console.error(prefix, ` worker script (model-worker.js) is not ready. Cannot forward ${messageType}.`);
                 sendResponse({ success: false, error: ` worker script not ready. Cannot ${messageType}. Wait for worker ready signal.` });
                 return false;
            }
            break;

        // --- ADDED: Handle listModelFiles for pre-load logging ---
        case ModelLoaderMessageTypes.LIST_MODEL_FILES:
            (async () => {
                try {
                    const { modelId } = message.payload || {};
                    const requestId = message.requestId;
                    if (!modelId) {
                        currentWorker.postMessage({
                            type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: 'No modelId provided' }
                        });
                        return;
                    }
                    // Request file list from background script
                    const docsResult = await browser.runtime.sendMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES,
                        payload: { modelId }
                    });
                    if (!docsResult.success) {
                        currentWorker.postMessage({
                            type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: docsResult.error }
                        });
                        return;
                    }
                    const files = docsResult.files;
                    currentWorker.postMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: true, files }
                    });
                } catch (err) {
                    const requestId = message.requestId;
                    currentWorker.postMessage({
                        type: ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: false, error: err.message }
                    });
                }
            })();
            return true;

        default:
            console.warn(prefix, `Unhandled allowed message type in switch: ${messageType}`);
            sendResponse({ success: false, error: `Unhandled message type ${messageType} in offscreen worker.` });
            return false;
    }
});

console.log(prefix, "Offscreen script (modelLoaderWorkerOffscreen.js) loaded. Initializing eventBus listener and attempting to create  worker if not present.");
initializeModelWorker();