// version.ts
// Centralized version management for Tab Agent

export interface VersionInfo {
    extension: string;
    nativeHost: string;
    environment: 'development' | 'alpha' | 'beta' | 'production';
}

export interface UpdateInfo {
    hasUpdate: boolean;
    latestVersion: string;
    currentVersion: string;
    downloadUrl?: string;
    releaseNotes?: string;
}

// Read from package.json at build time
export const CURRENT_VERSION: VersionInfo = {
    extension: require('../package.json').version,
    nativeHost: '1.0.0', // Will be updated by native host when connected
    environment: 'alpha' // Change this for releases
};

// GitHub API endpoints
const GITHUB_API_BASE = 'https://api.github.com/repos/ocentra';
const EXTENSION_REPO = 'TabAgent';
const DIST_REPO = 'TabAgentDist';

/**
 * Check for extension updates
 */
export async function checkExtensionUpdate(): Promise<UpdateInfo> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/${EXTENSION_REPO}/releases/latest`);
        if (!response.ok) {
            throw new Error('Failed to fetch latest release');
        }
        
        const release = await response.json();
        const latestVersion = release.tag_name.replace('v', '');
        const currentVersion = CURRENT_VERSION.extension;
        
        const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
        
        return {
            hasUpdate,
            latestVersion,
            currentVersion,
            downloadUrl: release.assets.find((a: any) => a.name.includes('extension'))?.browser_download_url,
            releaseNotes: release.body
        };
    } catch (error) {
        console.error('Failed to check for extension updates:', error);
        return {
            hasUpdate: false,
            latestVersion: CURRENT_VERSION.extension,
            currentVersion: CURRENT_VERSION.extension
        };
    }
}

/**
 * Check for native host updates
 */
export async function checkNativeHostUpdate(currentNativeVersion: string): Promise<UpdateInfo> {
    try {
        const response = await fetch(`${GITHUB_API_BASE}/${DIST_REPO}/releases/latest`);
        if (!response.ok) {
            throw new Error('Failed to fetch latest release');
        }
        
        const release = await response.json();
        const latestVersion = release.tag_name.replace('v', '');
        
        const hasUpdate = compareVersions(latestVersion, currentNativeVersion) > 0;
        
        // Detect platform for download URL
        const platform = getPlatform();
        const assetName = platform === 'windows' ? 'tabagent-host.exe' : 
                         platform === 'macos' ? 'tabagent-host-macos' : 
                         'tabagent-host-linux';
        
        return {
            hasUpdate,
            latestVersion,
            currentVersion: currentNativeVersion,
            downloadUrl: release.assets.find((a: any) => a.name.includes(assetName))?.browser_download_url,
            releaseNotes: release.body
        };
    } catch (error) {
        console.error('Failed to check for native host updates:', error);
        return {
            hasUpdate: false,
            latestVersion: currentNativeVersion,
            currentVersion: currentNativeVersion
        };
    }
}

/**
 * Compare two semantic versions
 * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

/**
 * Get current platform
 */
function getPlatform(): 'windows' | 'macos' | 'linux' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    return 'linux';
}

/**
 * Get native host version via native messaging
 */
export async function getNativeHostVersion(): Promise<string | null> {
    try {
        // Send version request to native host
        const response = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
            
            if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime?.sendNativeMessage) {
                (window as any).chrome.runtime.sendNativeMessage(
                    'com.tabagent.host',
                    { action: 'get_version' },
                    (response: any) => {
                        clearTimeout(timeout);
                        if ((window as any).chrome.runtime.lastError) {
                            reject(new Error((window as any).chrome.runtime.lastError.message));
                        } else {
                            resolve(response);
                        }
                    }
                );
            } else if (typeof (window as any).browser !== 'undefined' && (window as any).browser.runtime?.sendNativeMessage) {
                (window as any).browser.runtime.sendNativeMessage(
                    'com.tabagent.host',
                    { action: 'get_version' }
                ).then(resolve).catch(reject);
            } else {
                reject(new Error('Native messaging not supported'));
            }
        });
        
        return response?.version || null;
    } catch (error) {
        console.error('Failed to get native host version:', error);
        return null;
    }
}
