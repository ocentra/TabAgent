const prefix = '[ModelMetadata]';
const LOG_GENERAL = true;
const LOG_ERROR = true;

export async function fetchModelMetadataInternal(modelId: string) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    if (LOG_GENERAL) console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        if (LOG_GENERAL) console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    } catch (error) {
        if (LOG_ERROR) console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}

export async function filterAndValidateFilesInternal(metadata: any, modelId: string, baseRepoUrl: string) {
    const hfFileEntries = metadata.siblings || [];
    // Only keep files we care about
    const filteredEntries = hfFileEntries.filter((f: any) => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('on') || f.rfilename.endsWith('.txt'));

    if (filteredEntries.length === 0) {
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
            console.warn('[ModelMetadata]', `HEAD request failed for ${url}:`, e);
        }
        return null;
    }

    // Ensure size is set for each entry
    const sizePromises = filteredEntries.map(async (entry: any) => {
        if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
            const url = baseRepoUrl + entry.rfilename;
            const size = await getFileSizeWithHEAD(url);
            if (size && isFinite(size) && size > 0) {
                entry.size = size;
            } else {
                entry.skip = true;
            }
        }
    });

    await Promise.all(sizePromises);
    // Now build full manifest objects
    const neededFileEntries = filteredEntries.filter((e: any) => !e.skip).map((entry: any) => {
        const fileName = entry.rfilename;
        const fileType = fileName.split('.').pop();
        const size = entry.size;
        const totalChunks = Math.ceil(size / (10 * 1024 * 1024)); // Use CHUNK_SIZE if available
        const chunkGroupId = `${modelId}/${fileName}`;
        return {
            id: `${chunkGroupId}:manifest`,
            type: 'manifest',
            chunkGroupId,
            fileName,
            folder: modelId,
            fileType,
            size,
            totalChunks,
            chunkSizeUsed: 10 * 1024 * 1024, // Use CHUNK_SIZE if available
            status: 'missing',
            addedAt: Date.now(),
        };
    });
    return { neededFileEntries, message: null };
} 