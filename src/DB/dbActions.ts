// Action constants for IndexedDB backend worker and related classes

export const DBActions = Object.freeze({
    PUT: 'put',
    GET: 'get',
    GET_ALL: 'getAll',
    QUERY: 'query',
    DELETE: 'delete',
    CLEAR: 'clear',
    ADD_FILE_CHUNK: 'addFileChunk',
    GET_FILE_CHUNK: 'getFileChunk',
    ASSEMBLE_FILE: 'assembleFile',
    INIT_CUSTOM_IDBS: 'initCustomIDBs',
    RESET: 'reset',
    EXPORT_DATABASE: 'exportDatabase',
    IMPORT_DATABASE: 'importDatabase',
    CLEANUP_OLD_DATA: 'cleanupOldData',
    GET_CHANGES_SINCE: 'getChangesSince',
    MARK_AS_DELETED: 'markAsDeleted',
    APPLY_SYNCED_RECORD: 'applySyncedRecord',
    SEARCH: 'search',
    WORKER_READY: 'ready',
    QUERY_MANIFESTS: 'queryManifests',
    // Add more actions as needed
} as const);
export interface DbInitOptions {
    preFetchedRepoMetadata?: Array<{ repo: string, metadata: any }>;
  }
export type DBActionsType = typeof DBActions; 