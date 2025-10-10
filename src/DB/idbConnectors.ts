// src/DB/idbConnectors.ts
// Manages connector configurations in IndexedDB

const LOG_DEBUG = false;
const LOG_ERROR = true;
const prefix = '[idbConnectors]';

export type ConnectorType = 'google-drive' | 'local' | 'dropbox' | 'onedrive' | 'github' | 'huggingface' | 'native-app' | 'custom';

export type AuthType = 'none' | 'token' | 'oauth' | 'mcp' | 'custom';

export interface ConnectorAuthConfig {
    type: AuthType;
    token?: string; // API token
    tokenName?: string; // Token display name (e.g., "API Key", "Access Token")
    oauthClientId?: string; // OAuth client ID
    oauthScopes?: string[]; // OAuth scopes
    mcpEndpoint?: string; // MCP server endpoint
    mcpAuth?: Record<string, any>; // MCP-specific auth
    customFields?: Array<{ // Custom auth fields
        key: string;
        label: string;
        type: 'text' | 'password' | 'url';
        placeholder?: string;
    }>;
}

export interface ConnectorConfig {
    id: string; // Unique identifier (e.g., 'google-drive', 'user-dropbox-1')
    name: string; // Display name
    type: ConnectorType; // Type of connector
    category: 'storage' | 'email' | 'productivity' | 'developer' | 'custom';
    icon: string; // Icon URL or emoji
    enabled: boolean; // Whether connector is enabled
    isDefault: boolean; // Whether this is a built-in connector
    requiresAuth: boolean; // Whether connector requires authentication
    authConfig?: ConnectorAuthConfig; // Authentication configuration
    authStatus?: 'authenticated' | 'not_authenticated' | 'error';
    lastConnectionTest?: {
        success: boolean;
        timestamp: number;
        error?: string;
    };
    config?: Record<string, any>; // Connector-specific configuration
    addedAt: number; // Timestamp when added
    updatedAt: number; // Timestamp when last updated
}

const DB_NAME = 'TabAgentConnectors';
const DB_VERSION = 1;
const CONNECTORS_STORE = 'connectors';

// Default built-in connectors
const DEFAULT_CONNECTORS: ConnectorConfig[] = [
    // Storage Connectors
    {
        id: 'google-drive',
        name: 'Google Drive',
        type: 'google-drive',
        category: 'storage',
        icon: '☁️',
        enabled: true,
        isDefault: true,
        requiresAuth: true,
        authConfig: {
            type: 'oauth',
            oauthClientId: 'google-drive',
            oauthScopes: ['https://www.googleapis.com/auth/drive.readonly']
        },
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'local',
        name: 'Local Files',
        type: 'local',
        category: 'storage',
        icon: '💾',
        enabled: true,
        isDefault: true,
        requiresAuth: false,
        authStatus: 'authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'dropbox',
        name: 'Dropbox',
        type: 'dropbox',
        category: 'storage',
        icon: '📦',
        enabled: true,
        isDefault: true,
        requiresAuth: true,
        authConfig: {
            type: 'oauth',
            oauthClientId: 'dropbox',
            oauthScopes: ['files.content.read']
        },
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'onedrive',
        name: 'OneDrive',
        type: 'onedrive',
        category: 'storage',
        icon: '☁️',
        enabled: true,
        isDefault: true,
        requiresAuth: true,
        authConfig: {
            type: 'oauth',
            oauthClientId: 'onedrive',
            oauthScopes: ['Files.Read']
        },
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    
    // Developer Connectors
    {
        id: 'github',
        name: 'GitHub',
        type: 'github',
        category: 'developer',
        icon: '🐙',
        enabled: false,
        isDefault: true,
        requiresAuth: true,
        authConfig: {
            type: 'token',
            tokenName: 'Personal Access Token',
            customFields: [
                {
                    key: 'token',
                    label: 'GitHub Token',
                    type: 'password',
                    placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx'
                }
            ]
        },
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'huggingface',
        name: 'HuggingFace',
        type: 'huggingface',
        category: 'developer',
        icon: '🤗',
        enabled: false,
        isDefault: true,
        requiresAuth: true,
        authConfig: {
            type: 'token',
            tokenName: 'API Token',
            customFields: [
                {
                    key: 'token',
                    label: 'HuggingFace Token',
                    type: 'password',
                    placeholder: 'hf_xxxxxxxxxxxxxxxxxxxx'
                }
            ]
        },
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    },
    {
        id: 'native-app',
        name: 'Native Application',
        type: 'native-app',
        category: 'productivity',
        icon: '🖥️',
        enabled: true,
        isDefault: true,
        requiresAuth: false,
        authStatus: 'not_authenticated',
        addedAt: Date.now(),
        updatedAt: Date.now()
    }
];

async function openConnectorsDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            if (LOG_ERROR) console.error(`${prefix} Failed to open database:`, request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create connectors object store
            if (!db.objectStoreNames.contains(CONNECTORS_STORE)) {
                const store = db.createObjectStore(CONNECTORS_STORE, { keyPath: 'id' });
                store.createIndex('type', 'type', { unique: false });
                store.createIndex('category', 'category', { unique: false });
                store.createIndex('enabled', 'enabled', { unique: false });
                
                if (LOG_DEBUG) console.log(`${prefix} Created connectors object store`);
            }
        };
    });
}

export async function initializeConnectors(): Promise<void> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readwrite');
        const store = tx.objectStore(CONNECTORS_STORE);

        // Check if we have any connectors
        const countRequest = store.count();
        
        await new Promise<void>((resolve, reject) => {
            countRequest.onsuccess = async () => {
                if (countRequest.result === 0) {
                    // Add default connectors
                    if (LOG_DEBUG) console.log(`${prefix} Initializing default connectors`);
                    
                    for (const connector of DEFAULT_CONNECTORS) {
                        store.put(connector);
                    }
                }
                resolve();
            };
            countRequest.onerror = () => reject(countRequest.error);
            tx.oncomplete = () => {
                db.close();
            };
        });

        if (LOG_DEBUG) console.log(`${prefix} Connectors initialized`);
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to initialize connectors:`, error);
        throw error;
    }
}

export async function getAllConnectors(): Promise<ConnectorConfig[]> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readonly');
        const store = tx.objectStore(CONNECTORS_STORE);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to get all connectors:`, error);
        return [];
    }
}

export async function getEnabledConnectors(): Promise<ConnectorConfig[]> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readonly');
        const store = tx.objectStore(CONNECTORS_STORE);
        const request = store.getAll();

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                // Filter enabled connectors in JavaScript instead of using index
                const allConnectors = request.result || [];
                const enabledConnectors = allConnectors.filter(c => c.enabled === true);
                resolve(enabledConnectors);
            };
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to get enabled connectors:`, error);
        return [];
    }
}

export async function getConnectorsByCategory(category: ConnectorConfig['category']): Promise<ConnectorConfig[]> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readonly');
        const store = tx.objectStore(CONNECTORS_STORE);
        const index = store.index('category');
        const request = index.getAll(category);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result || []);
            };
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to get connectors by category:`, error);
        return [];
    }
}

export async function getConnector(id: string): Promise<ConnectorConfig | null> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readonly');
        const store = tx.objectStore(CONNECTORS_STORE);
        const request = store.get(id);

        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => reject(request.error);
            tx.oncomplete = () => {
                db.close();
            };
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to get connector:`, error);
        return null;
    }
}

export async function saveConnector(connector: ConnectorConfig): Promise<void> {
    try {
        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readwrite');
        const store = tx.objectStore(CONNECTORS_STORE);
        
        connector.updatedAt = Date.now();
        store.put(connector);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                if (LOG_DEBUG) console.log(`${prefix} Connector saved:`, connector.id);
                
                // Broadcast connector update event
                window.dispatchEvent(new CustomEvent('connectorUpdated', { 
                    detail: { connector, action: 'save' } 
                }));
                
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to save connector:`, error);
        throw error;
    }
}

export async function deleteConnector(id: string): Promise<void> {
    try {
        // Don't allow deletion of default connectors
        const connector = await getConnector(id);
        if (connector?.isDefault) {
            throw new Error('Cannot delete default connector');
        }

        const db = await openConnectorsDB();
        const tx = db.transaction(CONNECTORS_STORE, 'readwrite');
        const store = tx.objectStore(CONNECTORS_STORE);
        store.delete(id);

        return new Promise((resolve, reject) => {
            tx.oncomplete = () => {
                db.close();
                if (LOG_DEBUG) console.log(`${prefix} Connector deleted:`, id);
                
                // Broadcast connector update event
                window.dispatchEvent(new CustomEvent('connectorUpdated', { 
                    detail: { connectorId: id, action: 'delete' } 
                }));
                
                resolve();
            };
            tx.onerror = () => reject(tx.error);
        });
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to delete connector:`, error);
        throw error;
    }
}

export async function updateConnectorStatus(id: string, enabled: boolean): Promise<void> {
    try {
        const connector = await getConnector(id);
        if (!connector) {
            throw new Error(`Connector not found: ${id}`);
        }

        connector.enabled = enabled;
        await saveConnector(connector);
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to update connector status:`, error);
        throw error;
    }
}

export async function updateConnectorAuthStatus(
    id: string, 
    authStatus: ConnectorConfig['authStatus']
): Promise<void> {
    try {
        const connector = await getConnector(id);
        if (!connector) {
            throw new Error(`Connector not found: ${id}`);
        }

        connector.authStatus = authStatus;
        await saveConnector(connector);
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to update connector auth status:`, error);
        throw error;
    }
}

export async function updateConnectorAuth(
    id: string,
    authConfig: ConnectorAuthConfig
): Promise<void> {
    try {
        const connector = await getConnector(id);
        if (!connector) {
            throw new Error(`Connector not found: ${id}`);
        }

        connector.authConfig = { ...connector.authConfig, ...authConfig };
        connector.authStatus = 'authenticated';
        await saveConnector(connector);
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to update connector auth:`, error);
        throw error;
    }
}

export async function testConnectorConnection(id: string): Promise<boolean> {
    try {
        const connector = await getConnector(id);
        if (!connector) {
            throw new Error(`Connector not found: ${id}`);
        }

        // TODO: Implement actual connection testing per connector type
        // For now, just check if auth is configured
        const success = connector.requiresAuth ? 
            connector.authStatus === 'authenticated' && !!connector.authConfig?.token : 
            true;

        connector.lastConnectionTest = {
            success,
            timestamp: Date.now(),
            error: success ? undefined : 'Not authenticated'
        };

        await saveConnector(connector);
        return success;
    } catch (error) {
        if (LOG_ERROR) console.error(`${prefix} Failed to test connector connection:`, error);
        
        // Update connector with error
        const connector = await getConnector(id);
        if (connector) {
            connector.lastConnectionTest = {
                success: false,
                timestamp: Date.now(),
                error: error instanceof Error ? error.message : 'Unknown error'
            };
            await saveConnector(connector);
        }
        
        return false;
    }
}
