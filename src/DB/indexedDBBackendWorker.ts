const prefix = '[idbWorker]';
console.log(`${prefix} indexedDBBackendWorker loaded and running`);
/// <reference lib="dom" />
// indexedDBBackendWorker.ts

import { DBActions, DbInitOptions } from './dbActions'; // Correctly import from your file
import { DBNames } from './idbSchema';
// Explicitly import IDBValidKey type for clarity (even though it's global in browser/worker context)
// This is a no-op in browser, but helps TypeScript recognize the type:
type IDBValidKey = globalThis.IDBValidKey;

// Type Definitions (Replaced JSDoc)
type FTSFieldConfig = string[];
type FTSStoreConfig = Record<string, FTSFieldConfig>;
type FTSDatabaseConfig = Record<string, FTSStoreConfig>;
type GlobalFTSConfig = FTSDatabaseConfig;

interface IndexDefinition {
    name: string;
    keyPath: string | string[];
    unique?: boolean;
    multiEntry?: boolean;
}

interface StoreDefinition {
    keyPath?: string;
    autoIncrement?: boolean;
    indexes?: IndexDefinition[];
}

interface DatabaseSchemaDefinition {
    version: number;
    stores: Record<string, StoreDefinition>;
    migrations?: Record<number, (transaction: IDBTransaction, db: IDBDatabase) => Promise<void>>;
}

type GlobalSchemaConfig = Record<string, DatabaseSchemaDefinition>;

// For QueryObject.where
type WhereConditionValue = string | number | boolean | string[] | number[] | null | undefined; // Added undefined for fields not present
interface WhereConditionObject {
    op: '>' | '>=' | '<' | '<=' | '!=' | 'in' | 'contains';
    value: WhereConditionValue;
}
type WhereClause = Record<string, WhereConditionValue | WhereConditionObject> | ((record: any) => boolean);

interface QueryJoin {
    type: 'INNER' | 'LEFT';
    from: string;
    to: string;
    onLeft: string;
    onRight: string;
    as?: string;
}

interface QueryObject {
    from: string;
    select?: string[];
    where?: WhereClause;
    orderBy?: { field: string; direction?: 'asc' | 'desc' }[];
    limit?: number;
    offset?: number;
    joins?: QueryJoin[];
}

interface MetadataRecord {
    key: string;
    value: any;
}

interface FtsIndexRecord {
    word: string;
    docIds: IDBValidKey[];
}

interface ExportedDBStoreData {
    [storeName: string]: any[];
}
interface ExportedDatabase {
    dbName: string;
    version: number;
    exportTimestamp: string;
    stores: ExportedDBStoreData;
}

interface FileChunkData {
    fileId: string;
    chunkIndex: number;
    data: Blob | ArrayBuffer;
    chunkId?: string;
    createdAt?: number;
    updatedAt?: number;
    recordVersion?: number;
}

interface BaseRecord {
    createdAt?: number;
    updatedAt?: number;
    recordVersion?: number;
    deleted?: boolean;
    [key: string]: any;
}

type IDBObjectStoreParameters = { keyPath?: string | string[] | null; autoIncrement?: boolean; };
type IDBIndexParameters = { unique?: boolean; multiEntry?: boolean; };

const METADATA_STORE_NAME = '__meta__';
const SCHEMA_METADATA_KEY = 'schemaDefinition';
const VERSION_METADATA_KEY = 'dbVersion';
const FTS_INDEX_STORE_PREFIX = '__fts_';

const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
const LOG_INFO = false;
const LOG_PUT = false;
const LOG_GET = false;
const LOG_GET_ALL = false;
const LOG_QUERY = false;
const LOG_DELETE = false;
const LOG_CLEAR = false;
const LOG_ADD_FILE_CHUNK = false;

// Add this type alias near the top, after importing DBActions:
type DBActionValue = keyof typeof DBActions | string;

class CustomIDBManager {
    openDBs: Map<string, IDBDatabase> = new Map();
    ftsConfig: GlobalFTSConfig = {};
    lastSchemaConfig: GlobalSchemaConfig = {};

    setFTSConfig(ftsConfig: GlobalFTSConfig = {}): void {
        this.ftsConfig = ftsConfig;
    }

    setLastSchemaConfig(schemaConfig: GlobalSchemaConfig = {}): void {
        this.lastSchemaConfig = schemaConfig;
    }

    async openDB(dbName: string, schema: DatabaseSchemaDefinition): Promise<IDBDatabase> {
        const { version, stores, migrations = {} } = schema;
        if (this.openDBs.has(dbName)) {
            const cachedDb = this.openDBs.get(dbName)!;
            if (cachedDb.version === version) {
                return cachedDb;
            } else {
                cachedDb.close();
                this.openDBs.delete(dbName);
            }
        }

        return new Promise((resolve, reject) => {
            console.log(`${prefix} Opening DB '${dbName}' with requested version ${version}.`);
            const request = indexedDB.open(dbName, version);

            request.onupgradeneeded = async (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const transaction = (event.target as IDBOpenDBRequest).transaction;
                const oldVersion = event.oldVersion;
                console.log(`${prefix} Upgrading DB '${dbName}' from version ${oldVersion} to ${version}.`);

                if (!transaction) {
                    console.error(`${prefix} No transaction found during onupgradeneeded for DB '${dbName}'. Aborting upgrade.`);
                    reject(new Error(`No transaction found during onupgradeneeded for DB '${dbName}'`));
                    return;
                }

                try {
                    if (!db.objectStoreNames.contains(METADATA_STORE_NAME)) {
                        db.createObjectStore(METADATA_STORE_NAME, { keyPath: 'key' });
                        console.log(`${prefix} Created metadata store '${METADATA_STORE_NAME}' in '${dbName}'.`);
                    }
                    
                    this.applyObjectSchema(db, transaction, stores);

                    for (let v = oldVersion + 1; v <= version; v++) {
                        if (migrations && migrations[v]) {
                            console.log(`${prefix} Running migration for DB '${dbName}' to version ${v}.`);
                            await migrations[v](transaction, db);
                        }
                    }

                    const metaStore = transaction.objectStore(METADATA_STORE_NAME);
                    metaStore.put({ key: SCHEMA_METADATA_KEY, value: stores } as MetadataRecord);
                    metaStore.put({ key: VERSION_METADATA_KEY, value: version } as MetadataRecord);
                    
                    console.log(`${prefix} Schema and version ${version} stored in __meta__ for '${dbName}'.`);

                } catch (err: any) {
                    console.error(`${prefix} Error during onupgradeneeded for DB '${dbName}':`, err);
                    if (transaction && transaction.abort) {
                        transaction.abort();
                    }
                    reject(err);
                    return;
                }
            };

            request.onsuccess = (event: Event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                console.log(`${prefix} Successfully opened DB '${dbName}' version ${db.version}.`);

                // Check if an upgrade actually happened based on the current transaction being null.
                // event.oldVersion is 0 if the database is new.
                // If request.transaction is null, it means onupgradeneeded didn't run for *this* open call.
                // We check if an oldVersion was indeed reported by onsuccess that matches current db.version
                // This indicates the DB existed and was NOT upgraded by THIS open call.
                // However, `event.oldVersion` on `onsuccess` is not standard.
                // The safest way to check if an upgrade didn't happen in this cycle is `request.transaction === null`.
                // And also ensure oldVersion (from the onupgradeneeded event if it fired for a *previous* open call)
                // is not the same as current version *if* an upgrade was expected.
                // The original logic: `if (event.oldVersion === db.version && db.version > 0)` seems flawed.
                // Corrected logic: If no upgrade transaction occurred in *this* open attempt,
                // and the DB version indicates it was already at or above the requested version.
                if (request.transaction === null && db.version > 0) {
                    // This means the DB was opened without an upgrade.
                    // Update metadata only if the schema definition might have changed externally,
                    // or to ensure it's fresh. This put is for the `stores` passed to openDB.
                    const tx = db.transaction(METADATA_STORE_NAME, 'readwrite');
                    const metaStore = tx.objectStore(METADATA_STORE_NAME);
                    metaStore.put({ key: SCHEMA_METADATA_KEY, value: stores } as MetadataRecord); 
                    metaStore.put({ key: VERSION_METADATA_KEY, value: db.version } as MetadataRecord);
                    tx.oncomplete = () => {};
                    tx.onerror = (e) => console.error("[CustomIDB] Error updating metadata on success:", (e.target as IDBRequest).error);
                }
                this.openDBs.set(dbName, db);
                resolve(db);
            };

            request.onerror = (event: Event) => {
                console.error(`${prefix} Error opening DB '${dbName}':`, (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
            };

            request.onblocked = (event: IDBVersionChangeEvent) => {
                console.warn(`${prefix} Opening DB '${dbName}' (version ${version}) is blocked. Old version: ${event.oldVersion}. New version: ${event.newVersion}. Please close other tabs/connections using this database.`, event);
                reject(new Error(`DB '${dbName}' open request blocked. Version conflict or other connections active.`));
            };
        });
    }

    applyObjectSchema(db: IDBDatabase, transaction: IDBTransaction, storesDefinition?: Record<string, StoreDefinition>): void {
        if (!storesDefinition) return;

        Object.entries(storesDefinition).forEach(([storeName, storeDef]) => {
            let objectStore: IDBObjectStore;
            if (!db.objectStoreNames.contains(storeName)) {
                const storeOptions = {} as IDBObjectStoreParameters;
                if (storeDef.keyPath) storeOptions.keyPath = storeDef.keyPath;
                if (storeDef.autoIncrement) storeOptions.autoIncrement = storeDef.autoIncrement;
                
                objectStore = db.createObjectStore(storeName, storeOptions);
                console.log(`${prefix} Created object store '${storeName}'` + (storeOptions.keyPath ? ` with keyPath '${storeOptions.keyPath}'` : '') + (storeOptions.autoIncrement ? ' with autoIncrement' : '') + ` in '${db.name}'.`);
            } else {
                objectStore = transaction.objectStore(storeName);
            }

            if (storeDef.indexes && Array.isArray(storeDef.indexes)) {
                storeDef.indexes.forEach(indexDef => {
                    if (!objectStore.indexNames.contains(indexDef.name)) {
                        const indexOptions: IDBIndexParameters = {};
                        if (indexDef.unique !== undefined) indexOptions.unique = indexDef.unique;
                        if (indexDef.multiEntry !== undefined) indexOptions.multiEntry = indexDef.multiEntry;
                        objectStore.createIndex(indexDef.name, indexDef.keyPath, indexOptions);
                        console.log(`${prefix} Created index '${indexDef.name}' on '${storeName}(${Array.isArray(indexDef.keyPath) ? indexDef.keyPath.join(',') : indexDef.keyPath})' (unique: ${!!indexDef.unique}, multiEntry: ${!!indexDef.multiEntry}) in '${db.name}'.`);
                    }
                });
            }
        });
        
        const dbFtsConfig = this.ftsConfig && this.ftsConfig[db.name];
        if (dbFtsConfig) {
            Object.entries(dbFtsConfig).forEach(([mainStoreName, fieldsToIndex]) => {
                if (storesDefinition[mainStoreName] || db.objectStoreNames.contains(mainStoreName)) {
                    const ftsStoreName = `${FTS_INDEX_STORE_PREFIX}${db.name}_${mainStoreName}`;
                    if (!db.objectStoreNames.contains(ftsStoreName)) {
                        db.createObjectStore(ftsStoreName, { keyPath: 'word' });
                        console.log(`${prefix} Created FTS index store '${ftsStoreName}' for '${db.name}.${mainStoreName}' (fields: ${fieldsToIndex.join(', ')})`);
                    }
                } else {
                    console.warn(`${prefix} FTS config for non-existent store '${mainStoreName}' in DB '${db.name}'. Skipping FTS store creation.`);
                }
            });
        }
    }

    closeDB(dbName: string): void {
        if (this.openDBs.has(dbName)) {
            this.openDBs.get(dbName)!.close();
            this.openDBs.delete(dbName);
            console.log(`${prefix} Closed DB connection for '${dbName}'.`);
        }
    }

    closeAllDBs(): void {
        this.openDBs.forEach(db => db.close());
        this.openDBs.clear();
        console.log(`${prefix} All managed DB connections closed.`);
    }

    async deleteDB(dbName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.openDBs.has(dbName)) {
                this.openDBs.get(dbName)!.close();
                this.openDBs.delete(dbName);
            }
            const req = indexedDB.deleteDatabase(dbName);
            req.onsuccess = () => {
                if (LOG_DELETE) console.log(`${prefix} Database '${dbName}' deleted successfully.`);
                resolve();
            };
            req.onerror = (event) => {
                if (LOG_ERROR) console.error(`${prefix} Error deleting database '${dbName}':`, (event.target as IDBOpenDBRequest).error);
                reject((event.target as IDBOpenDBRequest).error);
            };
            req.onblocked = (event) => { // event is IDBVersionChangeEvent for onblocked from deleteDatabase
                if (LOG_WARN) console.warn(`${prefix} Deletion of database '${dbName}' is blocked. Close other connections.`, event);
                reject(new Error(`DB '${dbName}' delete request blocked.`));
            };
        });
    }
}

class DataOperations {
    constructor(private dbManager: CustomIDBManager) {}

    private async getDB(dbName: string): Promise<IDBDatabase> {
        const db = this.dbManager.openDBs.get(dbName);
        if (!db) throw new Error(`Database ${dbName} not open or not managed by this instance.`);
        return db;
    }

    private getFtsConfigForDbStore(dbName: string, storeName: string): FTSFieldConfig | null | undefined {
        const dbFtsSettings = this.dbManager.ftsConfig && this.dbManager.ftsConfig[dbName];
        return dbFtsSettings ? dbFtsSettings[storeName] : null;
    }

    private getFtsIndexStoreName(dbName: string, mainStoreName: string): string {
        return `${FTS_INDEX_STORE_PREFIX}${dbName}_${mainStoreName}`;
    }

    private getTxStoreNamesForFTS(dbName: string, mainStoreName: string): string[] {
        const names = [mainStoreName];
        if (this.getFtsConfigForDbStore(dbName, mainStoreName)) {
            const ftsStore = this.getFtsIndexStoreName(dbName, mainStoreName);
            const db = this.dbManager.openDBs.get(dbName);
            if (db && db.objectStoreNames.contains(ftsStore)) {
                 names.push(ftsStore);
            }
        }
        return names;
    }

    async get<T = any>(dbName: string, storeName: string, key: IDBValidKey): Promise<T | undefined> {
        const db = await this.getDB(dbName);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as T | undefined);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    }

    async add<T extends BaseRecord>(dbName: string, storeName: string, record: Omit<T, 'createdAt' | 'updatedAt' | 'recordVersion'> & Partial<T>, key?: IDBValidKey): Promise<IDBValidKey> {
        const db = await this.getDB(dbName);
        
        const now = Date.now();
        const fullRecord: T = {
            ...record,
            createdAt: record.createdAt || now,
            updatedAt: now,
            recordVersion: (record.recordVersion || 0) + 1,
        } as T;

        // Model pipeline log suppression logic
        const isModelAssetChunk = fullRecord && fullRecord.type === 'chunk' && storeName === 'models';
        const isModelAssetManifest = fullRecord && fullRecord.type === 'manifest' && storeName === 'models';
        let shouldLog = true;
        if (isModelAssetChunk) {
            const chunkIndex = (fullRecord as any).chunkIndex;
            const totalChunks = (fullRecord as any).totalChunks;
            shouldLog = (chunkIndex === 0 || (typeof totalChunks === 'number' && chunkIndex === totalChunks - 1));
        } else if (isModelAssetManifest) {
            shouldLog = true;
        }
        if (shouldLog) {
            console.log('[idbWorker][TRACE] DataOperations.add: fullRecord:', fullRecord);
        }

        return new Promise((resolve, reject) => {
            const txStoreNames = this.getTxStoreNamesForFTS(dbName, storeName);
            const transaction = db.transaction(txStoreNames, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = key ? store.add(fullRecord, key) : store.add(fullRecord);
            
            let ftsPromise: Promise<void | void[]> = Promise.resolve();

            request.onsuccess = () => {
                const resultKey = request.result;
                 if (this.getFtsConfigForDbStore(dbName, storeName) && transaction.db.objectStoreNames.contains(this.getFtsIndexStoreName(dbName, storeName))) {
                    ftsPromise = this.updateFTSIndex(dbName, storeName, fullRecord, resultKey, transaction)
                        .catch(ftsError => console.warn(`[CustomIDB FTS] Error during FTS update in add for ${storeName}/${String(resultKey)}:`, ftsError));
                }
            };

            transaction.oncomplete = () => {
                ftsPromise.then(() => resolve(request.result)).catch(reject);
            };
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
            transaction.onabort = (event) => reject((event.target as IDBRequest).error || new Error('Transaction aborted'));
        });
    }
   
    async put<T extends BaseRecord>(dbName: string, storeName: string, record: Partial<T> & { [key:string]: any}, key?: IDBValidKey): Promise<IDBValidKey> {
        const db = await this.getDB(dbName);

        const now = Date.now();
        const fullRecord: T = {
            ...record,
            createdAt: record.createdAt || now,
            updatedAt: now,
            recordVersion: (record.recordVersion || 0) + 1,
        } as T;

        // Model pipeline log suppression logic
        const isModelAssetChunk = fullRecord && fullRecord.type === 'chunk' && storeName === 'models';
        const isModelAssetManifest = fullRecord && fullRecord.type === 'manifest' && storeName === 'models';
        let shouldLog = true;
        if (isModelAssetChunk) {
            const chunkIndex = (fullRecord as any).chunkIndex;
            const totalChunks = (fullRecord as any).totalChunks;
            shouldLog = (chunkIndex === 0 || (typeof totalChunks === 'number' && chunkIndex === totalChunks - 1));
        } else if (isModelAssetManifest) {
            shouldLog = true;
        }
        if (shouldLog) {
           if (LOG_PUT) console.log('[idbWorker] DataOperations.put: fullRecord:', fullRecord);
        }

        return new Promise((resolve, reject) => {
            const txStoreNames = this.getTxStoreNamesForFTS(dbName, storeName);
            const transaction = db.transaction(txStoreNames, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            const primaryKeyCandidate = store.keyPath && typeof store.keyPath === 'string' ? fullRecord[store.keyPath] : key;
            const primaryKey = primaryKeyCandidate as IDBValidKey | undefined;

            let ftsUpdatePromise: Promise<void | void[]> = Promise.resolve();

            if (primaryKey && this.getFtsConfigForDbStore(dbName, storeName) && transaction.db.objectStoreNames.contains(this.getFtsIndexStoreName(dbName, storeName))) {
                ftsUpdatePromise = this.removeFTSIndexForKey(dbName, storeName, primaryKey, transaction)
                    .catch(ftsError => console.warn(`[CustomIDB FTS] Error during FTS pre-removal in put for ${storeName}/${String(primaryKey)}:`, ftsError));
            }

            const request = key ? store.put(fullRecord, key) : store.put(fullRecord);
            
            request.onsuccess = () => {
                const resultKey = request.result;
                if (this.getFtsConfigForDbStore(dbName, storeName) && transaction.db.objectStoreNames.contains(this.getFtsIndexStoreName(dbName, storeName))) {
                    ftsUpdatePromise = ftsUpdatePromise.then(() => 
                        this.updateFTSIndex(dbName, storeName, fullRecord, resultKey, transaction)
                            .catch(ftsError => console.warn(`[CustomIDB FTS] Error during FTS update in put for ${storeName}/${String(resultKey)}:`, ftsError))
                    );
                }
            };
            
            transaction.oncomplete = () => {
                 ftsUpdatePromise.then(() => resolve(request.result)).catch(reject);
            };
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
            transaction.onabort = (event) => reject((event.target as IDBRequest).error || new Error('Transaction aborted'));
        });
    }

    async delete(dbName: string, storeName: string, key: IDBValidKey): Promise<void> {
        const db = await this.getDB(dbName);
        return new Promise((resolve, reject) => {
            const txStoreNames = this.getTxStoreNamesForFTS(dbName, storeName);
            const transaction = db.transaction(txStoreNames, 'readwrite');
            
            let ftsPromise: Promise<void> = Promise.resolve();
            if (this.getFtsConfigForDbStore(dbName, storeName) && transaction.db.objectStoreNames.contains(this.getFtsIndexStoreName(dbName, storeName))) {
                ftsPromise = this.removeFTSIndexForKey(dbName, storeName, key, transaction)
                    .catch(ftsError => console.warn(`[CustomIDB FTS] Error during FTS removal in delete for ${storeName}/${String(key)}:`, ftsError));
            }

            const store = transaction.objectStore(storeName);
            store.delete(key);
            
            transaction.oncomplete = () => {
                ftsPromise.then(resolve).catch(reject);
            };
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
            transaction.onabort = (event) => reject((event.target as IDBRequest).error || new Error('Transaction aborted'));
        });
    }

    async clear(dbName: string, storeName: string): Promise<void> {
        const db = await this.getDB(dbName);
        return new Promise((resolve, reject) => {
            const txStoreNames = this.getTxStoreNamesForFTS(dbName, storeName);
            const transaction = db.transaction(txStoreNames, 'readwrite');
            
            if (this.getFtsConfigForDbStore(dbName, storeName)) {
                const ftsStoreName = this.getFtsIndexStoreName(dbName, storeName);
                if (transaction.objectStoreNames.contains(ftsStoreName)) {
                    try {
                        transaction.objectStore(ftsStoreName).clear();
                    } catch (e) {
                         console.warn(`[CustomIDB FTS] Error clearing FTS store ${ftsStoreName} during clear of ${storeName}:`, e);
                    }
                }
            }
            const store = transaction.objectStore(storeName);
            store.clear();

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    }
    
    async query<T = any>(dbName: string, queryObj: QueryObject): Promise<T[]> {
        const db = await this.getDB(dbName);

        return new Promise<T[]>((resolve, reject) => {
            const { from, select, where, orderBy, limit, offset = 0, joins } = queryObj;
            let results: T[] = [];
            
            const txStoreNamesForQuery = new Set<string>([from]);
            if (joins) {
                joins.forEach(j => txStoreNamesForQuery.add(j.to));
            }
            const validTxStoreNames = Array.from(txStoreNamesForQuery).filter(name => db.objectStoreNames.contains(name));
            if (!validTxStoreNames.includes(from)) {
                reject(new Error(`Store ${from} not found in database ${dbName}`));
                return;
            }

            const transaction = db.transaction(validTxStoreNames, 'readonly');
            const store = transaction.objectStore(from);
            let cursorReq: IDBRequest<IDBCursorWithValue | null>;

            if (orderBy && orderBy.length > 0) {
                const firstSortField = orderBy[0].field;
                const direction = orderBy[0].direction === 'desc' ? 'prev' : 'next';
                if (store.indexNames.contains(firstSortField)) {
                    cursorReq = store.index(firstSortField).openCursor(null, direction);
                } else if (store.keyPath === firstSortField) {
                    cursorReq = store.openCursor(null, direction);
                } else {
                    cursorReq = store.openCursor(); // Will sort client-side later
                }
            } else {
                cursorReq = store.openCursor();
            }
            
            let count = 0;
            let skipped = 0;
            const joinPromises: Promise<void>[] = [];

            cursorReq.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    let record: any = cursor.value;
                    let matchesWhere = true;

                    if (where) {
                        if (typeof where === 'function') {
                            matchesWhere = where(record);
                        } else {
                            matchesWhere = Object.entries(where).every(([field, condition]) => {
                                const recordValue = record[field];
                                if (typeof condition === 'object' && condition !== null && 'op' in condition) {
                                    const opCond = condition as WhereConditionObject;
                                    switch (opCond.op) {
                                        case '>': return opCond.value != null && recordValue > opCond.value;
                                        case '>=': return opCond.value != null && recordValue >= opCond.value;
                                        case '<': return opCond.value != null && recordValue < opCond.value;
                                        case '<=': return opCond.value != null && recordValue <= opCond.value;
                                        case '!=': return opCond.value != null && recordValue !== opCond.value;
                                        case 'in': return Array.isArray(opCond.value) && (opCond.value as any[]).includes(recordValue);
                                        case 'contains':
                                            if (Array.isArray(recordValue)) return recordValue.includes(opCond.value);
                                            if (typeof recordValue === 'string' && typeof opCond.value === 'string') return recordValue.includes(opCond.value);
                                            return false;
                                        default: return recordValue === opCond.value;
                                    }
                                }
                                return recordValue === condition;
                            });
                        }
                    }

                    if (matchesWhere) {
                        if (skipped < offset) {
                            skipped++;
                            cursor.continue();
                        } else {
                            const processRecord = async (): Promise<any | null> => {
                                let currentRecord = { ...record }; // Clone to avoid modifying cursor.value directly with joins
                                if (joins && joins.length > 0) {
                                    for (const join of joins) {
                                        if (join.from === from && transaction.objectStoreNames.contains(join.to)) {
                                            const rightTableStore = transaction.objectStore(join.to);
                                            const leftValue = currentRecord[join.onLeft];
                                            let joinedData: any = null;
                                            
                                            try {
                                                if (leftValue !== undefined) { // Only attempt join if leftValue exists
                                                    if (rightTableStore.indexNames.contains(join.onRight)) {
                                                        const joinRecordResult = await this.promisifyRequest(rightTableStore.index(join.onRight).get(leftValue));
                                                        if (joinRecordResult) joinedData = joinRecordResult;
                                                    } else if (rightTableStore.keyPath === join.onRight) {
                                                        const joinRecordResult = await this.promisifyRequest(rightTableStore.get(leftValue));
                                                        if (joinRecordResult) joinedData = joinRecordResult;
                                                    } else {
                                                        console.warn(`[CustomIDB Query] Join on ${join.to}.${join.onRight} may be slow without an index or primary key match.`);
                                                    }
                                                }
                                            } catch(e) { /* ignore lookup errors for LEFT join */ console.log(" ignore during LEFT join lookup:", e);}
    
                                            if (join.type === 'INNER' && !joinedData) {
                                                return null; 
                                            }
                                            currentRecord[join.as || join.to] = joinedData;
                                        }
                                    }
                                }
                                return currentRecord;
                            };

                            joinPromises.push(processRecord().then(processedRecord => {
                                if (processedRecord) { 
                                    let finalRecordToAdd: any = processedRecord;
                                    if (select && select.length > 0) {
                                        const selectedRecord: Record<string, any> = {};
                                        select.forEach(field => {
                                            if (field.includes('.')) {
                                                const parts = field.split('.');
                                                const joinAlias = parts[0];
                                                const joinField = parts[1];
                                                if (processedRecord[joinAlias] && typeof processedRecord[joinAlias] === 'object' && processedRecord[joinAlias] !== null) {
                                                    selectedRecord[field.replace(/\./g, '_')] = processedRecord[joinAlias][joinField];
                                                } else {
                                                    selectedRecord[field.replace(/\./g, '_')] = undefined;
                                                }
                                            } else {
                                                selectedRecord[field] = processedRecord[field];
                                            }
                                        });
                                        finalRecordToAdd = selectedRecord;
                                    }
                                    results.push(finalRecordToAdd as T);
                                    count++;
                                }
                            }));


                            if (limit && results.length >= limit) { // Check results.length for early exit
                                Promise.all(joinPromises).then(() => {
                                   // console.log(`[CustomIDB Query] Matched records count:`, count);
                                    resolve(results.slice(0, limit)); 
                                    try { transaction.abort(); } catch(e) {console.error("[CustomIDB Query] Error aborting transaction:", e);}
                                }).catch(reject);
                                return;
                            }
                            cursor.continue();
                        }
                    } else { 
                        cursor.continue();
                    }
                } else { 
                    Promise.all(joinPromises).then(() => {
                        if (orderBy && orderBy.length > 0) {
                           // const firstSortField = orderBy[0].field;
                            let needsClientSort = orderBy.length > 1;
                            if (needsClientSort) {
                                results.sort((a: any, b: any) => {
                                    for (const sortRule of orderBy) {
                                        const fieldA = a[sortRule.field];
                                        const fieldB = b[sortRule.field];
                                        const dir = sortRule.direction === 'desc' ? -1 : 1;
                                        if (fieldA < fieldB) return -1 * dir;
                                        if (fieldA > fieldB) return 1 * dir;
                                    }
                                    return 0;
                                });
                            }
                        }
                        console.log(`${prefix} Matched records count for store '${from}'${where ? ` with where: ${JSON.stringify(where)}` : ''}:`, count);
                        resolve(results.slice(0, limit || results.length));
                    }).catch(reject);
                }
            };
            cursorReq.onerror = (event: Event) => {
                Promise.all(joinPromises)
                  .catch(() => {}) // Squelch join promise errors if cursor itself errored
                  .finally(() => reject((event.target as IDBRequest).error));
            };
            transaction.onerror = (event: Event) => { 
                if (!results.length || (limit && results.length < limit)) {
                     Promise.all(joinPromises)
                       .catch(() => {})
                       .finally(() => reject((event.target as IDBRequest).error));
                }
            };
            // Ensure transaction.onabort is also handled if it's not covered by onerror
            transaction.onabort = (event: Event) => {
                 Promise.all(joinPromises)
                       .catch(() => {})
                       .finally(() => reject((event.target as IDBRequest).error || new Error("Query transaction aborted")));
            }
        });
    }

    

    private promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    private tokenize(text: string | null | undefined): string[] {
        if (!text || typeof text !== 'string') return [];
        return text.toLowerCase().match(/\b\w+\b/g) || [];
    }

    private async updateFTSIndex(dbName: string, storeName: string, record: any, recordKey: IDBValidKey, transaction: IDBTransaction): Promise<void> {
        const fieldsToIndex = this.getFtsConfigForDbStore(dbName, storeName);
        if (!fieldsToIndex || !recordKey) return Promise.resolve();

        const ftsStoreName = this.getFtsIndexStoreName(dbName, storeName);
        if (!transaction.db.objectStoreNames.contains(ftsStoreName)) {
            console.warn(`${prefix} FTS index store '${ftsStoreName}' not found. Skipping FTS update.`);
            return Promise.resolve();
        }
        const ftsStore = transaction.objectStore(ftsStoreName);

        const allTokens = new Set<string>();
        fieldsToIndex.forEach(field => {
            this.tokenize(record[field]).forEach(token => allTokens.add(token));
        });

        const promises: Promise<void>[] = [];
        for (const token of allTokens) {
            promises.push(new Promise<void>((resolveToken) => { 
                const getReq = ftsStore.get(token);
                getReq.onsuccess = () => {
                    let entry: FtsIndexRecord | undefined = getReq.result as FtsIndexRecord | undefined;
                    let currentDocIds: Set<IDBValidKey>;
                    if (!entry) {
                        currentDocIds = new Set();
                    } else {
                        currentDocIds = new Set(Array.isArray(entry.docIds) ? entry.docIds : []);
                    }
                    
                    currentDocIds.add(recordKey);
                    const putReq = ftsStore.put({ word: token, docIds: Array.from(currentDocIds) } as FtsIndexRecord);
                    putReq.onsuccess = () => resolveToken();
                    putReq.onerror = () => {
                        console.warn(`${prefix} Failed to put token '${token}' for ${storeName}/${String(recordKey)}`);
                        resolveToken(); 
                    };
                };
                getReq.onerror = () => {
                     console.warn(`${prefix} Failed to get token '${token}' for ${storeName}/${String(recordKey)}`);
                     resolveToken(); 
                };
            }));
        }
        await Promise.all(promises);
    }

    private async removeFTSIndexForKey(dbName: string, storeName: string, recordKey: IDBValidKey, transaction: IDBTransaction): Promise<void> {
        const fieldsToIndex = this.getFtsConfigForDbStore(dbName, storeName);
        if (!fieldsToIndex || !recordKey) return Promise.resolve();

        const ftsStoreName = this.getFtsIndexStoreName(dbName, storeName);
        if (!transaction.db.objectStoreNames.contains(ftsStoreName)) return Promise.resolve();
        const ftsStore = transaction.objectStore(ftsStoreName);
        
        const promises: Promise<void>[] = [];
        return new Promise<void>((resolveCursorOuter) => {
            const cursorReq = ftsStore.openCursor();
            cursorReq.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const entry = cursor.value as FtsIndexRecord;
                    if (entry.docIds && Array.isArray(entry.docIds)) {
                        const idSet = new Set(entry.docIds);
                        if (idSet.has(recordKey)) {
                            idSet.delete(recordKey);
                            promises.push(new Promise<void>((resolveOp) => { 
                                let opReq: IDBRequest;
                                if (idSet.size === 0) {
                                    opReq = cursor.delete();
                                } else {
                                    opReq = cursor.update({ word: entry.word, docIds: Array.from(idSet) } as FtsIndexRecord);
                                }
                                opReq.onsuccess = () => resolveOp();
                                opReq.onerror = () => {
                                    console.warn(`${prefix} Failed to update/delete token '${entry.word}' during removal for ${storeName}/${String(recordKey)}`);
                                    resolveOp(); 
                                };
                            }));
                        }
                    }
                    cursor.continue();
                } else {
                    Promise.all(promises).then(() => resolveCursorOuter()).catch(err => {
                        console.error(`${prefix} Error in Promise.all during FTS removal: `, err);
                        resolveCursorOuter(); 
                    });
                }
            };
            cursorReq.onerror = (event: Event) => {
                console.warn(`${prefix} Cursor error during FTS removal for ${storeName}/${String(recordKey)}:`, (event.target as IDBRequest).error);
                Promise.all(promises).catch(() => {}).finally(() => resolveCursorOuter());
            };
        });
    }

    async search<T = any>(dbName: string, storeName: string, queryText: string): Promise<T[]> {
        const db = await this.getDB(dbName);
        
        const ftsStoreName = this.getFtsIndexStoreName(dbName, storeName);
        if (!db.objectStoreNames.contains(ftsStoreName)) {
            console.warn(`${prefix} FTS store ${ftsStoreName} not found for search.`);
            return Promise.resolve([]);
        }

        const queryTokens = this.tokenize(queryText);
        if (queryTokens.length === 0) return Promise.resolve([]);

        return new Promise<T[]>((resolve, reject) => {
            const transaction = db.transaction([storeName, ftsStoreName], 'readonly');
            const ftsStore = transaction.objectStore(ftsStoreName);
            const mainObjStore = transaction.objectStore(storeName);
            const docIdSetsPromises: Promise<Set<IDBValidKey>>[] = [];

            queryTokens.forEach(token => {
                docIdSetsPromises.push(new Promise<Set<IDBValidKey>>((resolveTokenLookup) => {
                    const request = ftsStore.get(token);
                    request.onsuccess = () => {
                        const result = request.result as FtsIndexRecord | undefined;
                        resolveTokenLookup(result && result.docIds ? new Set(result.docIds) : new Set());
                    };
                    request.onerror = (event: Event) => {
                        console.error(`${prefix} Error looking up token '${token}':`, (event.target as IDBRequest).error);
                        resolveTokenLookup(new Set()); 
                    };
                }));
            });

            Promise.all(docIdSetsPromises).then(docIdSets => {
                if (docIdSets.length === 0) {
                    resolve([]);
                    return;
                }

                let finalDocIds: Set<IDBValidKey> = new Set(docIdSets[0]);
                for (let i = 1; i < docIdSets.length; i++) {
                    finalDocIds = new Set([...finalDocIds].filter(id => docIdSets[i].has(id)));
                }
                
                if (finalDocIds.size === 0) {
                    resolve([]);
                    return;
                }
                
                const results: T[] = [];
                const fetchPromises: Promise<void>[] = [];

                finalDocIds.forEach(docId => {
                    fetchPromises.push(new Promise<void>((resolveFetch) => {
                        const getReq = mainObjStore.get(docId);
                        getReq.onsuccess = () => {
                            if (getReq.result) results.push(getReq.result as T);
                            resolveFetch();
                        };
                        getReq.onerror = (e: Event) => {
                            console.warn(`${prefix} Error fetching doc ID ${String(docId)}:`, (e.target as IDBRequest).error);
                            resolveFetch(); 
                        };
                    }));
                });
                Promise.all(fetchPromises).then(() => resolve(results)).catch(reject);
            }).catch(reject); 
        });
    }

    async exportDatabase(dbName: string): Promise<ExportedDatabase> {
        const db = await this.getDB(dbName);
        
        const exportData: ExportedDatabase = {
            dbName: db.name,
            version: db.version,
            exportTimestamp: new Date().toISOString(),
            stores: {}
        };

        return new Promise<ExportedDatabase>((resolve, reject) => {
            const storeNames = Array.from(db.objectStoreNames);
            if (storeNames.length === 0) {
                resolve(exportData);
                return;
            }
            const transaction = db.transaction(storeNames, 'readonly');
            
            transaction.oncomplete = () => resolve(exportData);
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);

            storeNames.forEach(storeName => {
                try {
                    const store = transaction.objectStore(storeName);
                    const getAllReq = store.getAll();
                    getAllReq.onsuccess = () => {
                        exportData.stores[storeName] = getAllReq.result;
                    };
                    getAllReq.onerror = (event) => {
                         console.error(`${prefix} Error getAll from ${storeName}:`, (event.target as IDBRequest).error);
                         // Let transaction error handler deal with this.
                    };
                } catch (e) {
                     console.error(`${prefix} Error accessing store ${storeName} in transaction:`, e);
                     // Let transaction error handler deal with this.
                }
            });
        });
    }

    async importDatabase(dbName: string, jsonData: string | ExportedDatabase, options: { clearExistingData?: boolean; targetSchema: DatabaseSchemaDefinition }): Promise<void> {
        let importDataObject: ExportedDatabase;
        if (typeof jsonData === 'string') {
            try {
                importDataObject = JSON.parse(jsonData) as ExportedDatabase;
            } catch (e) {
                console.error(`${prefix} Error parsing JSON data for import:`, e);
                return Promise.reject(new Error("Invalid JSON data for import."));
            }
        } else {
            importDataObject = jsonData;
        }

        if (!importDataObject.dbName || !importDataObject.stores) {
            console.error(`${prefix} Import data format is invalid. Missing dbName or stores.`);
            return Promise.reject(new Error("Import data format is invalid. Missing dbName or stores."));
        }
        
        const db = await this.dbManager.openDB(dbName, options.targetSchema);

        return new Promise<void>((resolve, reject) => {
            (async () => {
                const storeNamesToImport = Object.keys(importDataObject.stores);
                
                const allTxStores = new Set<string>();
                const validStoreNamesForImport: string[] = [];

                storeNamesToImport.forEach(mainStoreName => {
                    if (db.objectStoreNames.contains(mainStoreName)) {
                        allTxStores.add(mainStoreName);
                        validStoreNamesForImport.push(mainStoreName);
                        if (this.getFtsConfigForDbStore(dbName, mainStoreName)) {
                            const ftsStore = this.getFtsIndexStoreName(dbName, mainStoreName);
                            if (db.objectStoreNames.contains(ftsStore)) allTxStores.add(ftsStore);
                        }
                    } else {
                         console.warn(`${prefix} Store '${mainStoreName}' from import data not found in DB schema. Skipping.`);
                    }
                });
                
                if (validStoreNamesForImport.length === 0) {
                    console.warn(`${prefix} No matching stores found in DB '${dbName}' for import data. Nothing imported.`);
                    resolve();
                    return;
                }

                const transaction = db.transaction(Array.from(allTxStores), 'readwrite');
                const allFtsPromises: Promise<void>[] = [];

                transaction.oncomplete = () => {
                    Promise.all(allFtsPromises.map(p => p.catch(e => console.warn("[CustomIDB Import FTS] FTS update during import failed:", e))))
                        .then(() => {
                            console.log(`${prefix} Import to '${dbName}' completed successfully.`);
                            resolve();
                        })
                        .catch(finalError => {
                            console.error(`${prefix} Final FTS processing error during import to '${dbName}':`, finalError);
                            reject(finalError);
                        });
                };
                transaction.onerror = (event) => {
                    console.error(`${prefix} Transaction error during import to '${dbName}':`, (event.target as IDBRequest).error);
                    reject((event.target as IDBRequest).error);
                };
                transaction.onabort = (event) => {
                    console.error(`${prefix} Transaction aborted during import to '${dbName}':`, (event.target as IDBRequest).error);
                    reject((event.target as IDBRequest).error || new Error('Import transaction aborted.'));
                };

                for (const storeName of validStoreNamesForImport) {
                    const objectStore = transaction.objectStore(storeName);
                    const recordsToImport: any[] = importDataObject.stores[storeName];

                    if (options.clearExistingData) {
                        try {
                            await this.promisifyRequest(objectStore.clear());
                            if (!storeName.startsWith(FTS_INDEX_STORE_PREFIX) && this.getFtsConfigForDbStore(dbName, storeName)) {
                                const ftsStoreAssociated = this.getFtsIndexStoreName(dbName, storeName);
                                if (transaction.objectStoreNames.contains(ftsStoreAssociated)) {
                                    await this.promisifyRequest(transaction.objectStore(ftsStoreAssociated).clear());
                                }
                            }
                        } catch (e: any) {
                            console.error(`${prefix} Error clearing store '${storeName}' or its FTS:`, e);
                            if (transaction.abort) transaction.abort(); // Ensure transaction is aborted
                            reject(e); 
                            return; 
                        }
                    }
                    
                    if (recordsToImport && Array.isArray(recordsToImport)) {
                        recordsToImport.forEach(record => {
                            const keyPathDefinition = objectStore.keyPath;
                           // let recordKeyForFts: IDBValidKey | undefined = undefined;
                            if(keyPathDefinition && typeof keyPathDefinition === 'string'){
                               // recordKeyForFts = record[keyPathDefinition] as IDBValidKey;
                            }
                            
                            const putReq = objectStore.put(record);
                            putReq.onsuccess = () => {
                                if (!storeName.startsWith(FTS_INDEX_STORE_PREFIX) && this.getFtsConfigForDbStore(dbName, storeName)) {
                                    const finalRecordKey = (keyPathDefinition && typeof keyPathDefinition === 'string') ? (record[keyPathDefinition] as IDBValidKey) : putReq.result;
                                    if (finalRecordKey) {
                                         allFtsPromises.push(this.updateFTSIndex(dbName, storeName, record, finalRecordKey, transaction));
                                    } else {
                                        console.warn(`${prefix} Could not determine record key for FTS update in store ${storeName}. Record:`, record);
                                    }
                                }
                            };
                            putReq.onerror = (e) => {
                                console.warn(`${prefix} Error putting record into '${storeName}':`, record, (e.target as IDBRequest).error);
                            };
                        });
                    }
                }
            })().catch(reject);
        });
    }

    async addFileChunk(dbName: string, chunkStoreName: string, chunkData: FileChunkData): Promise<IDBValidKey> {
        if (!chunkData.chunkId) chunkData.chunkId = `${chunkData.fileId}_${chunkData.chunkIndex}`;
        return this.put(dbName, chunkStoreName, chunkData as BaseRecord);
    }

    async getFileChunk(dbName: string, chunkStoreName: string, fileId: string, chunkIndex: number): Promise<FileChunkData | undefined> {
        const chunkId = `${fileId}_${chunkIndex}`;
        return this.get<FileChunkData>(dbName, chunkStoreName, chunkId);
    }

    async assembleFile(dbName: string, chunkStoreName: string, fileId: string, totalChunks: number): Promise<Blob | ArrayBuffer | null> {
        const chunksData: (Blob | ArrayBuffer)[] = [];
        let firstChunkType: string | undefined = undefined;

        for (let i = 0; i < totalChunks; i++) {
            const chunkRecord = await this.getFileChunk(dbName, chunkStoreName, fileId, i);
            if (!chunkRecord || !chunkRecord.data) throw new Error(`Missing chunk ${i} for file ${fileId}`);
            chunksData.push(chunkRecord.data);
            if (i === 0 && chunkRecord.data instanceof Blob) {
                firstChunkType = chunkRecord.data.type;
            }
        }
        if (chunksData.length > 0 && chunksData[0] instanceof Blob) {
            return new Blob(chunksData as Blob[], { type: firstChunkType || (chunksData[0] as Blob).type });
        } else if (chunksData.length > 0 && chunksData[0] instanceof ArrayBuffer) {
            let totalLength = chunksData.reduce((acc, val) => acc + (val as ArrayBuffer).byteLength, 0);
            let result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunksData as ArrayBuffer[]) {
                result.set(new Uint8Array(chunk), offset);
                offset += chunk.byteLength;
            }
            return result.buffer;
        }
        return null; 
    }
    
    async cleanupOldData(dbName: string, storeName: string, ageField: string, maxAgeSeconds: number): Promise<number> {
        const db = await this.getDB(dbName);
        const thresholdTimestamp = Date.now() - (maxAgeSeconds * 1000);
        let deletedCount = 0;

        return new Promise<number>((resolve, reject) => {
            const txStoreNames = this.getTxStoreNamesForFTS(dbName, storeName);
            const transaction = db.transaction(txStoreNames, 'readwrite');
            const objectStore = transaction.objectStore(storeName);
            
            const cursorSource: IDBIndex | IDBObjectStore = objectStore.indexNames.contains(ageField) ? objectStore.index(ageField) : objectStore;
            const ftsPromises: Promise<void>[] = [];

            const range = objectStore.indexNames.contains(ageField) ? IDBKeyRange.upperBound(thresholdTimestamp -1 ) : null;

            const openCursorRequest = range ? cursorSource.openCursor(range) : cursorSource.openCursor();

            openCursorRequest.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const record = cursor.value as BaseRecord;
                    if (record[ageField] && record[ageField] < thresholdTimestamp) {                       
                        const recordKey = cursor.primaryKey;
                        if (this.getFtsConfigForDbStore(dbName, storeName) && transaction.db.objectStoreNames.contains(this.getFtsIndexStoreName(dbName, storeName))) {
                           ftsPromises.push(this.removeFTSIndexForKey(dbName, storeName, recordKey, transaction)
                             .catch(e => console.warn(`FTS removal failed during cleanup for ${String(recordKey)}`, e)));
                        }
                        cursor.delete();
                        deletedCount++;
                    }
                    cursor.continue();
                } else { 
                    // Cursor finished
                }
            };
            openCursorRequest.onerror = (event: Event) => {
                 console.error(`${prefix} Cursor error during cleanup of '${storeName}':`, (event.target as IDBRequest).error);
                 reject((event.target as IDBRequest).error);
            };

            transaction.oncomplete = () => {
                 Promise.all(ftsPromises)
                    .then(() => {
                        console.log(`${prefix} Deleted ${deletedCount} old records from '${storeName}'.`);
                        resolve(deletedCount);
                    })
                    .catch(finalError => {
                         console.error(`${prefix} FTS processing error after cleanup of '${storeName}':`, finalError);
                         resolve(deletedCount); 
                    });
            };
            transaction.onerror = (event) => reject((event.target as IDBRequest).error);
            transaction.onabort = (event) => reject((event.target as IDBRequest).error || new Error("Cleanup transaction aborted"));
        });
    }

    async getChangesSince<T extends BaseRecord = any>(dbName: string, storeName: string, timestamp: number, includeDeleted = false): Promise<T[]> {
        const query: QueryObject = {
            from: storeName,
            where: (record: T) => {
                const isRecent = record.updatedAt !== undefined && record.updatedAt >= timestamp;
                if (includeDeleted) return isRecent; 
                return isRecent && !record.deleted; 
            },
            orderBy: [{ field: 'updatedAt', direction: 'asc' }]
        };
        return this.query<T>(dbName, query);
    }

    async markAsDeleted<T extends BaseRecord>(dbName: string, storeName: string, key: IDBValidKey): Promise<IDBValidKey | null> {
        const record = await this.get<T>(dbName, storeName, key);
        if (record) {
            const updatedRecord: T = { ...record, deleted: true } as T; // Assert type T
            // If key is part of record (keyPath defined), it's passed via record.
            // If key is out-of-line, it's passed as the third argument to put.
            const storeSchema = this.dbManager.lastSchemaConfig[dbName]?.stores[storeName];
            const putKey = (storeSchema?.keyPath) ? undefined : key;
            return this.put(dbName, storeName, updatedRecord, putKey);
        }
        return null;
    }

    async applySyncedRecord<T extends BaseRecord>(dbName: string, storeName: string, remoteRecord: T): Promise<IDBValidKey | null> {
       // const db = await this.getDB(dbName);
        let keyPathValue: IDBValidKey | undefined;
        const schemaDef = this.dbManager.lastSchemaConfig[dbName];
        const storeDef = schemaDef?.stores?.[storeName];
        
        let putKeyArg: IDBValidKey | undefined = undefined;

        if (storeDef?.keyPath && typeof storeDef.keyPath === 'string') {
            keyPathValue = remoteRecord[storeDef.keyPath] as IDBValidKey | undefined;
            // For in-line keys, keyPathValue is used for get, and `put` will use the key from the record.
        } else if (storeDef && !storeDef.autoIncrement && !storeDef.keyPath) {
            // This case is for out-of-line keys that are NOT auto-incrementing.
            // The key must be *determinable* from the remoteRecord for lookup,
            // but it's not directly a field. This implies the calling context
            // needs to handle how such a key is derived or passed.
            // For simplicity here, we assume if keyPath is not set,
            // the key for `get` needs to be known/derived by caller.
            // And for `put`, if it's out-of-line non-autoInc, it must be provided.
            // This function's design expects the key to be in remoteRecord if keyPath is set,
            // or handled by the `put` method's key argument if out-of-line.
            // The original logic was a bit ambiguous here.
            // Assuming for this function, if keyPath is not set, key must be derivable for the `get` call.
            // Let's assume `remoteRecord` *might* have an implicit key for lookup
            // if there's no keyPath (e.g. `remoteRecord.id` even if not a formal keyPath).
            // This is a point of potential ambiguity. The `applySyncedRecord` might need a `key` param for such stores.
            // For now, we'll proceed with the assumption that `keyPathValue` is the key for `get`.
            // If no keyPath, and not autoInc, the `keyPathValue` for `get` needs to come from *somewhere*.
            // Let's assume it's implicitly part of `remoteRecord` for the `get` call's purpose.
            // And for `put`, if no keyPath, `keyPathValue` becomes the `putKeyArg`.
            if (keyPathValue === undefined && storeDef.keyPath === undefined) { // Trying to get key for `put` if out-of-line
                 // Attempt to find a common key like 'id' or 'uuid' if not specified by keyPath
                 const commonKeys = ['id', '_id', 'uuid', 'key'];
                 for (const k of commonKeys) {
                     if (remoteRecord[k] !== undefined) {
                         keyPathValue = remoteRecord[k] as IDBValidKey;
                         putKeyArg = keyPathValue;
                         break;
                     }
                 }
            }
        }


        if (!keyPathValue && !storeDef?.autoIncrement) {
             console.warn(`${prefix} Cannot determine key for remote record in store ${storeName} (keyPath: ${storeDef?.keyPath}, autoInc: ${storeDef?.autoIncrement}). Record:`, remoteRecord);
             return Promise.reject(new Error(`Cannot determine key for remote record in store ${storeName}`));
        }
        
        const localRecord = keyPathValue ? await this.get<T>(dbName, storeName, keyPathValue) : null;

        // If keyPath is not defined (out-of-line keys), then `keyPathValue` (if derived for get) should be passed as `putKeyArg` to `put`.
        if (!storeDef?.keyPath && keyPathValue) {
            putKeyArg = keyPathValue;
        }

        if (!localRecord) {
            return this.put(dbName, storeName, remoteRecord, putKeyArg);
        }

        const remoteUpdatedAt = remoteRecord.updatedAt || 0;
        const localUpdatedAt = localRecord.updatedAt || 0;
        const remoteVersion = remoteRecord.recordVersion || 0;
        const localVersion = localRecord.recordVersion || 0;

        if (remoteUpdatedAt > localUpdatedAt) {
            return this.put(dbName, storeName, remoteRecord, putKeyArg);
        } else if (remoteUpdatedAt < localUpdatedAt) {
            console.warn(`${prefix} Stale remote record for ${storeName}/${String(keyPathValue)}. Local is newer.`);
            return keyPathValue ?? null;
        } else { 
            if (remoteVersion > localVersion) {
                return this.put(dbName, storeName, remoteRecord, putKeyArg);
            }
                console.log(`${prefix} Records for ${storeName}/${String(keyPathValue)} have same timestamp and version (or local is preferred). No change.`);
            return keyPathValue ?? null;
        }
    }

    async getAll<T = any>(dbName: string, storeName: string): Promise<T[]> {
        const db = await this.getDB(dbName);
        return new Promise<T[]>((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result as T[]);
            request.onerror = (event) => reject((event.target as IDBRequest).error);
        });
    }

    // --- Specialized manifest query ---
    /**
     * Efficiently fetch all manifest records for a given folder using the compound index.
     * @param dbName The database name (e.g., 'TabAgentModels')
     * @param storeName The store name (e.g., 'TabAgentModels')
     * @param folder The folder/model ID
     * @returns Promise resolving to an array of manifest records
     */
    async queryManifestsForFolder(dbName: string, storeName: string, folder: string): Promise<any[]> {
        const db = await this.dbManager.openDBs.get(dbName);
        if (!db) throw new Error(`Database ${dbName} not open or not managed by this instance.`);
        return new Promise<any[]>((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            if (!store.indexNames.contains('folder_type')) {
                reject(new Error('Compound index folder_type not found'));
                return;
            }
            const cursorReq = store.index('folder_type').openCursor(IDBKeyRange.only([folder, 'manifest']));
            const results: any[] = [];
            cursorReq.onsuccess = (event: Event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            cursorReq.onerror = (event: Event) => reject((event.target as IDBRequest).error);
        });
    }
}


const idbManager = new CustomIDBManager();
const idbDataOps = new DataOperations(idbManager);

interface ResetDbDetails {
    success: boolean;
    clearedStores?: string[];
    message?: string;
    error?: string;
}
interface ResetAllIDBDataResult {
    success: boolean;
    details: Record<string, ResetDbDetails>;
    message?: string;
}

async function resetAllIDBData(): Promise<ResetAllIDBDataResult> {
    const results: ResetAllIDBDataResult = { success: true, details: {} };
    const schemaConfigToUse = idbManager.lastSchemaConfig || {};
    const dbNamesFromConfig = Object.keys(schemaConfigToUse);
    const dbNamesFromOpenDBs = Array.from(idbManager.openDBs.keys());
    const allDbNames = Array.from(new Set([...dbNamesFromConfig, ...dbNamesFromOpenDBs]));
    
    if (allDbNames.length === 0) {
        console.log(`${prefix} No databases known to reset.`);
        return { success: true, message: "No databases to reset.", details: {} };
    }

    for (const dbName of allDbNames) {
        try {
            let db = idbManager.openDBs.get(dbName);
            if (!db) {
                const schema = schemaConfigToUse[dbName];
                if (!schema) {
                    console.warn(`${prefix} No schema found for DB '${dbName}', cannot ensure it's open to reset. Attempting to open with version 1.`);
                    try {
                        db = await idbManager.openDB(dbName, { version: 1, stores: {} }); 
                    } catch (openError: any) {
                         console.warn(`${prefix} Failed to open DB '${dbName}' for reset:`, openError);
                         results.details[dbName] = { success: false, error: `Failed to open DB for reset: ${openError.message}` };
                         results.success = false;
                         continue;
                    }
                } else {
                     db = await idbManager.openDB(dbName, schema);
                }
            }

            const storeNames = Array.from(db.objectStoreNames).filter(name => name !== METADATA_STORE_NAME);
            if (storeNames.length === 0) {
                results.details[dbName] = { success: true, message: 'No user stores to clear.' };
                continue;
            }

            await new Promise<void>((resolve, reject) => {
                const tx = db!.transaction(storeNames, 'readwrite');
                tx.oncomplete = () => {
                    results.details[dbName] = { success: true, clearedStores: storeNames };
                    resolve();
                };
                tx.onerror = (event) => {
                    const error = (event.target as IDBRequest).error;
                    results.details[dbName] = { success: false, error: `Transaction error: ${error?.message}` };
                    results.success = false;
                    reject(error);
                };
                tx.onabort = (event) => {
                    const error = (event.target as IDBRequest).error;
                    results.details[dbName] = { success: false, error: `Transaction aborted: ${error ? error.message : 'unknown reason'}` };
                    results.success = false;
                    reject(error || new Error("Transaction aborted"));
                };

                for (const storeName of storeNames) {
                    try {
                        tx.objectStore(storeName).clear();
                    } catch (e: any) {
                        console.warn(`${prefix} Failed to initiate clear for store '${storeName}' in '${dbName}':`, e);
                    }
                }
            });
        } catch (error: any) {
            console.error(`${prefix} Error during reset for DB '${dbName}':`, error);
            results.details[dbName] = { success: false, error: error.message };
            results.success = false;
        }
    }
    return results;
}


interface WorkerMessagePayload<T = any> {
    action: DBActionValue;
    payload?: T;
    requestId: number | string;
    originType?: string;
}

interface ErrorResult {
    message: string;
    name?: string;
    stack?: string;
    code?: string | number;
    details?: any;
}

interface WorkerResponse {
    requestId: number | string;
    result?: any;
    error?: ErrorResult;
    success: boolean;
    type?: string;
}

interface WorkerReadyMessage {
    type: typeof DBActions.WORKER_READY;
}



self.onmessage = async (event: MessageEvent<WorkerMessagePayload>) => {
    //console.log(`${prefix} Received message:`, event.data);
    const action: string = event.data.action;
    const payload = event.data.payload;
    const requestId = event.data.requestId;
    if (!action) {
        console.log(`${prefix} No action provided ${event.data.action} ${event.data.payload} ${event.data.requestId}`);
        return;
    }
    let result: any;
    let success = true;
    let errorResult: ErrorResult | null = null;
    try {
        console.log(`${prefix} handle action in try block:`, action);

        if (action === DBActions.INIT_CUSTOM_IDBS) {
            const { schemaConfig, ftsConfig } = payload as { schemaConfig?: GlobalSchemaConfig, ftsConfig?: GlobalFTSConfig };
            console.log(`${prefix} INIT_CUSTOM_IDBS handler start`, { schemaConfig, ftsConfig });
            if (ftsConfig) {
                idbManager.setFTSConfig(ftsConfig);
               // console.log(`${prefix} SET_FTS_CONFIG handler start`, { ftsConfig: idbManager.ftsConfig });
            }
            if (schemaConfig) {
                idbManager.setLastSchemaConfig(schemaConfig);
               // console.log(`${prefix} SET_LAST_SCHEMA_CONFIG handler start`, { lastSchemaConfig: idbManager.lastSchemaConfig });
            }
            const initResults: Record<string, {success: boolean, error?: ErrorResult}> = {};
            if (schemaConfig) {
                for (const [dbName, dbDef] of Object.entries(schemaConfig)) {
                    try {
                        if (LOG_INFO) console.log(`${prefix} Opening DB:`, dbName, dbDef);
                        await idbManager.openDB(dbName, dbDef);
                        initResults[dbName] = { success: true };
                        if (LOG_INFO) console.log(`${prefix} Opened DB:`, dbName);
                    } catch (e: any) {
                        console.error(`${prefix} Error opening DB:`, dbName, e);
                        initResults[dbName] = { success: false, error: { message: e.message, name: e.name, stack: e.stack, code: e.code } };
                        success = false; 
                    }
                }
            }
            result = initResults;
            if (!success) errorResult = { message: "One or more databases failed to initialize.", name: "DBInitializationError" };
           // console.log(`${prefix} INIT_CUSTOM_IDBS handler end`, { result, errorResult });
        } else if (action === DBActions.RESET) {
            console.log(`${prefix} RESET handler start`);
            result = await resetAllIDBData();
            success = result.success; 
            if (!success) errorResult = { message: "Reset operation failed for one or more databases.", name: "DBResetError", details: result.details };
        } else if (action === DBActions.PUT) {
            //console.log(`${prefix} PUT handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.put(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.GET) {
            //console.log(`${prefix} GET handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.get(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.GET_ALL) {
            //console.log(`${prefix} GET_ALL handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.getAll(operationPayload[0], operationPayload[1]);
        } else if (action === DBActions.QUERY_MANIFESTS) {
            //console.log(`${prefix} QUERY_MANIFESTS_FOR_FOLDER handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.queryManifestsForFolder(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.QUERY) {
            //console.log(`${prefix} QUERY handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.query(operationPayload[0], operationPayload[1]);
            console.log('[idbWorker][TEST] QUERY result for requestId:', requestId, 'result:', result);
        } else if (action === DBActions.DELETE) {
            //console.log(`${prefix} DELETE handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.delete(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.CLEAR) {
            //console.log(`${prefix} CLEAR handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.clear(operationPayload[0], operationPayload[1]);
        } else if (action === DBActions.ADD_FILE_CHUNK) {
            //console.log(`${prefix} ADD_FILE_CHUNK handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.addFileChunk(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.GET_FILE_CHUNK) {
            //console.log(`${prefix} GET_FILE_CHUNK handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.getFileChunk(operationPayload[0], operationPayload[1], operationPayload[2], operationPayload[3]);
        } else if (action === DBActions.ASSEMBLE_FILE) {
            //console.log(`${prefix} ASSEMBLE_FILE handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.assembleFile(operationPayload[0], operationPayload[1], operationPayload[2], operationPayload[3]);
        } else if (action === DBActions.SEARCH) {
            //console.log(`${prefix} SEARCH handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.search(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.EXPORT_DATABASE) {
            //console.log(`${prefix} EXPORT_DATABASE handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.exportDatabase(operationPayload[0]);
        } else if (action === DBActions.IMPORT_DATABASE) {
            //console.log(`${prefix} IMPORT_DATABASE handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.importDatabase(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.CLEANUP_OLD_DATA) {
            //console.log(`${prefix} CLEANUP_OLD_DATA handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.cleanupOldData(operationPayload[0], operationPayload[1], operationPayload[2], operationPayload[3]);
        } else if (action === DBActions.GET_CHANGES_SINCE) {
            //console.log(`${prefix} GET_CHANGES_SINCE handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.getChangesSince(operationPayload[0], operationPayload[1], operationPayload[2], operationPayload[3]);
        } else if (action === DBActions.MARK_AS_DELETED) {
            //console.log(`${prefix} MARK_AS_DELETED handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.markAsDeleted(operationPayload[0], operationPayload[1], operationPayload[2]);
        } else if (action === DBActions.APPLY_SYNCED_RECORD) {
            //console.log(`${prefix} APPLY_SYNCED_RECORD handler start`);
            const operationPayload = Array.isArray(payload) ? payload : [payload];
            result = await idbDataOps.applySyncedRecord(operationPayload[0], operationPayload[1], operationPayload[2]);

        } else {
            console.log(`${prefix} Unknown action:`, action);
            success = false;
            errorResult = { message: `Unknown action: ${action}`, name: "UnknownActionError" };
        }
    } catch (error: any) {
        success = false;
        errorResult = { 
            message: error.message, 
            name: error.name, 
            stack: error.stack,
            code: error.code 
        };
        console.error(`${prefix} Error processing action ${action} for request ${requestId}:`, error);
    }

    const response: WorkerResponse = { requestId, success };
    if (success) {
        response.result = result;
    } else {
        response.error = errorResult!;
    }
    // Patch: set response.type for typed requests
    response.type = event.data.originType ? event.data.originType + '_RESPONSE' : action + '_RESPONSE';
    self.postMessage(response);
};

self.postMessage({ type: DBActions.WORKER_READY } as WorkerReadyMessage);


// The following commented code was part of the original JS file and is preserved.
// document.getElementById('exportButton').onclick = async () => {
//   try {
//     const data = await idbDataOps.exportDatabase('userChats');
//     const jsonData = JSON.stringify(data, null, 2);
//     const blob = new Blob([jsonData], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = 'userChats_export.json';
//     a.click();
//     URL.revokeObjectURL(url);
//   } catch (e) { console.error("Export failed:", e); }
// };

// document.getElementById('importFile').onchange = async (event) => {
//   const file = (event.target as HTMLInputElement).files?.[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = async (e) => {
//       try {
//         // You'd need to pass the current schema definition for the import
//         // This includes version, stores, and migrations for the target DB state.
//         // Example:
//         // const chatSchemaForImport: DatabaseSchemaDefinition = {
//         //   version: 2,
//         //   stores: { /* ... your store definitions ... */ },
//         //   migrations: { /* ... your migrations ... */ }
//         // };
//         // await idbDataOps.importDatabase('userChats', e.target!.result as string, {
//         //     clearExistingData: true,
//         //     targetSchema: chatSchemaForImport
//         // });
//         alert('Import successful!');
//       } catch (err) { console.error("Import failed:", err); alert('Import failed.'); }
//     };
//     reader.readAsText(file);
//   }
// };