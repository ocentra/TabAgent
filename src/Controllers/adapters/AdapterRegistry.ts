// src/Controllers/adapters/AdapterRegistry.ts
// Factory for dynamically creating adapters based on connector type

import { BaseAdapter } from './BaseAdapter';
import { GoogleDriveAdapter } from './GoogleDriveAdapter';
import { LocalFileAdapter } from './LocalFileAdapter';
import { NativeAppAdapter } from './NativeAppAdapter';
import { ConnectorType } from '../../DB/idbConnectors';

const LOG_DEBUG = false;
const LOG_ERROR = true;
const prefix = '[AdapterRegistry]';

// Adapter class mapping
type AdapterClass = new () => BaseAdapter;

const ADAPTER_MAP: Record<string, AdapterClass> = {
    'google-drive': GoogleDriveAdapter,
    'local': LocalFileAdapter,
    'native-app': NativeAppAdapter,
    // Future adapters will be registered here
    // 'dropbox': DropboxAdapter,
    // 'onedrive': OneDriveAdapter,
    // 'github': GitHubAdapter,
    // etc.
};

export class AdapterRegistry {
    private static adapters: Map<string, BaseAdapter> = new Map();

    /**
     * Register a new adapter class for a connector type
     */
    static registerAdapter(type: ConnectorType, adapterClass: AdapterClass): void {
        ADAPTER_MAP[type] = adapterClass;
        if (LOG_DEBUG) console.log(`${prefix} Registered adapter for type: ${type}`);
    }

    /**
     * Get or create an adapter instance for a connector type
     */
    static getAdapter(type: ConnectorType): BaseAdapter | null {
        // Check if we already have an instance
        if (this.adapters.has(type)) {
            return this.adapters.get(type)!;
        }

        // Check if we have an adapter class for this type
        const AdapterClass = ADAPTER_MAP[type];
        if (!AdapterClass) {
            if (LOG_ERROR) console.error(`${prefix} No adapter found for type: ${type}`);
            return null;
        }

        // Create new instance
        try {
            const adapter = new AdapterClass();
            this.adapters.set(type, adapter);
            if (LOG_DEBUG) console.log(`${prefix} Created adapter instance for type: ${type}`);
            return adapter;
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to create adapter for type ${type}:`, error);
            return null;
        }
    }

    /**
     * Check if an adapter is available for a connector type
     */
    static hasAdapter(type: ConnectorType): boolean {
        return type in ADAPTER_MAP;
    }

    /**
     * Get all available adapter types
     */
    static getAvailableAdapterTypes(): ConnectorType[] {
        return Object.keys(ADAPTER_MAP) as ConnectorType[];
    }

    /**
     * Clear all adapter instances (for testing or reset)
     */
    static clearAdapters(): void {
        this.adapters.forEach(adapter => {
            if (adapter.clearCache) {
                adapter.clearCache();
            }
        });
        this.adapters.clear();
        if (LOG_DEBUG) console.log(`${prefix} Cleared all adapter instances`);
    }

    /**
     * Clear a specific adapter instance
     */
    static clearAdapter(type: ConnectorType): void {
        const adapter = this.adapters.get(type);
        if (adapter) {
            if (adapter.clearCache) {
                adapter.clearCache();
            }
            this.adapters.delete(type);
            if (LOG_DEBUG) console.log(`${prefix} Cleared adapter instance for type: ${type}`);
        }
    }
}

// Export for convenience
export function getAdapter(type: ConnectorType): BaseAdapter | null {
    return AdapterRegistry.getAdapter(type);
}

export function registerAdapter(type: ConnectorType, adapterClass: new () => BaseAdapter): void {
    AdapterRegistry.registerAdapter(type, adapterClass);
}

export function hasAdapter(type: ConnectorType): boolean {
    return AdapterRegistry.hasAdapter(type);
}