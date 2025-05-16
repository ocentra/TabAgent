/**
 * Vector utility functions for browser-based semantic search.
 * Supports cosine similarity, Euclidean distance, and nearest neighbor search.
 */

/**
 * Computes cosine similarity between two vectors.
 * @param {number[]|Float32Array} a
 * @param {number[]|Float32Array} b
 * @returns {number} Cosine similarity (-1 to 1)
 */
export function cosineSimilarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Computes Euclidean distance between two vectors.
 * @param {number[]|Float32Array} a
 * @param {number[]|Float32Array} b
 * @returns {number} Euclidean distance
 */
export function euclideanDistance(a, b) {
    if (!a || !b || a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}

/**
 * Parses an embedding from BLOB, JSON string, or array.
 * @param {any} embedding
 * @returns {number[]}
 */
export function parseEmbedding(embedding) {
    if (!embedding) return [];
    if (Array.isArray(embedding)) return embedding;
    if (embedding instanceof Float32Array || embedding instanceof Uint8Array) return Array.from(embedding);
    if (typeof embedding === 'string') {
        try {
            const arr = JSON.parse(embedding);
            if (Array.isArray(arr)) return arr;
        } catch {}
    }
    return [];
}

/**
 * Finds the top N nearest neighbors to a query vector from a list of messages.
 * @param {number[]|Float32Array} queryEmbedding
 * @param {Array<{embedding: any, [key: string]: any}>} messages
 * @param {number} topN
 * @param {('cosine'|'euclidean')} [metric='cosine']
 * @returns {Array<{score: number, message: any}>}
 */
export function findNearestNeighbors(queryEmbedding, messages, topN = 5, metric = 'cosine') {
    const scores = messages.map(msg => {
        const emb = parseEmbedding(msg.embedding);
        let score = 0;
        if (emb.length === queryEmbedding.length) {
            if (metric === 'cosine') {
                score = cosineSimilarity(queryEmbedding, emb);
            } else if (metric === 'euclidean') {
                score = -euclideanDistance(queryEmbedding, emb); // negative for sorting (lower distance = higher score)
            }
        }
        return { score, message: msg };
    });
    // For cosine: higher is better. For euclidean: lower is better (so we negated it).
    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topN);
} 