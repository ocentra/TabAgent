// src/utils/versionChecker.ts
// Utility functions for checking version updates

import browser from 'webextension-polyfill';

const GITHUB_REPO = 'ocentra/TabAgentDist';
const VERSION_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
}

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  releaseUrl: string;
  publishedAt: string;
}

/**
 * Get the current version of the extension
 */
async function getCurrentVersion(): Promise<string> {
  const manifest = browser.runtime.getManifest();
  return manifest.version;
}

/**
 * Get the latest version from GitHub releases
 */
async function getLatestVersion(): Promise<GitHubRelease | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const release: GitHubRelease = await response.json();
    return release;
  } catch (error) {
    console.error('Failed to fetch latest version:', error);
    return null;
  }
}

/**
 * Compare version strings
 * Returns: -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = i < parts1.length ? parts1[i] : 0;
    const part2 = i < parts2.length ? parts2[i] : 0;
    
    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }
  
  return 0;
}

/**
 * Check if an update is available
 */
export async function checkForUpdates(): Promise<VersionInfo | null> {
  try {
    const currentVersion = await getCurrentVersion();
    const latestRelease = await getLatestVersion();
    
    if (!latestRelease) {
      return null;
    }
    
    const needsUpdate = compareVersions(latestRelease.tag_name, currentVersion) > 0;
    
    return {
      currentVersion,
      latestVersion: latestRelease.tag_name,
      needsUpdate,
      releaseUrl: latestRelease.html_url,
      publishedAt: latestRelease.published_at
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return null;
  }
}

/**
 * Show update notification if available
 */
export async function showUpdateNotification(): Promise<void> {
  const versionInfo = await checkForUpdates();
  
  if (versionInfo && versionInfo.needsUpdate) {
    // Create notification
    browser.notifications.create({
      type: 'basic',
      iconUrl: browser.runtime.getURL('icons/icon128.png'),
      title: 'Tab Agent Update Available',
      message: `Version ${versionInfo.latestVersion} is now available. You are currently running version ${versionInfo.currentVersion}.`,
      priority: 2
    });
    
    // Listen for notification click to open release page
    browser.notifications.onClicked.addListener((notificationId: string) => {
      if (notificationId === 'tabagent-update') {
        browser.tabs.create({ url: versionInfo.releaseUrl });
      }
    });
  }
}

/**
 * Schedule periodic version checks
 */
export function scheduleVersionChecks(): void {
  // Check immediately
  showUpdateNotification();
  
  // Schedule periodic checks
  setInterval(() => {
    showUpdateNotification();
  }, VERSION_CHECK_INTERVAL);
}

/**
 * Get version information for display in UI
 */
export async function getVersionInfo(): Promise<VersionInfo | null> {
  return await checkForUpdates();
}