// src/Controllers/SettingsController.js
import browser from 'webextension-polyfill';
import { sendDbRequestSmart } from '../sidepanel';
import { DbResetDatabaseRequest } from '../DB/dbEvents';
import { setupInferenceSettings } from './InferenceSettings';

let isInitialized = false;

// Helper to create a foldout section (matching Inference Settings style)
function createFoldoutSection({
    title,
    contentHTML,
    sectionClass = '',
    initiallyOpen = true
}: {
    title: string,
    contentHTML: string,
    sectionClass?: string,
    initiallyOpen?: boolean
}): HTMLElement {
    const section = document.createElement('div');
    section.className = `${sectionClass} mb-6`;
    section.innerHTML = `
        <div class="border border-gray-200 dark:border-gray-600 rounded-lg">
            <button class="foldout-toggle w-full flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-t-lg transition-colors min-h-0">
                <h3 class="text-base font-semibold text-gray-800 dark:text-gray-200 leading-tight">${title}</h3>
                <span class="fold-icon transform transition-transform duration-200">▼</span>
            </button>
            <div class="foldout-content p-3 space-y-3${initiallyOpen ? '' : ' hidden'}">
                ${contentHTML}
            </div>
        </div>
    `;
    // Setup foldout toggle
    const toggle = section.querySelector('.foldout-toggle') as HTMLButtonElement;
    const content = section.querySelector('.foldout-content') as HTMLElement;
    const icon = toggle?.querySelector('.fold-icon') as HTMLElement;
    if (toggle && content && icon) {
        toggle.addEventListener('click', () => {
            const isHidden = content.classList.contains('hidden');
            content.classList.toggle('hidden');
            icon.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-180deg)';
        });
    }
    return section;
}

function createCommonSettingsFoldout(): HTMLElement {
    // Theme toggle button
    const themeToggleButton = document.createElement('button');
    themeToggleButton.id = 'theme-toggle-button';
    themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500';
    // Set initial text
    const isDarkMode = document.documentElement.classList.contains('dark');
    themeToggleButton.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    themeToggleButton.onclick = () => {
        const htmlElement = document.documentElement;
        const isCurrentlyDark = htmlElement.classList.contains('dark');
        if (isCurrentlyDark) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
        themeToggleButton.textContent = htmlElement.classList.contains('dark') ? 'Switch to Light Mode' : 'Switch to Dark Mode';
    };
    // Section content
    const contentHTML = `<div class="flex flex-col items-start">${themeToggleButton.outerHTML}</div>`;
    const section = createFoldoutSection({
        title: 'Common Settings',
        contentHTML,
        sectionClass: 'common-settings-section',
        initiallyOpen: true
    });
    // Replace placeholder with actual button element (to preserve event)
    const contentDiv = section.querySelector('.foldout-content .flex');
    if (contentDiv) {
        contentDiv.innerHTML = '';
        contentDiv.appendChild(themeToggleButton);
    }
    return section;
}

function createLogManagementFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="flex flex-wrap justify-center md:justify-start gap-2 pt-3">
                <button id="viewLogsButton" class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">View Logs</button>
                <button id="resetDbButton" class="px-3 py-1 bg-red-200 dark:bg-red-600 hover:bg-red-300 dark:hover:bg-red-500 text-xs">Reset DB</button>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Log Management',
        contentHTML,
        sectionClass: 'log-management-section',
        initiallyOpen: false
    });
}

export function initializeSettingsController(): any {
    if (isInitialized) {
        console.log("[SettingsController] Already initialized.");
        return;
    }
    console.log("[SettingsController] Initializing...");

    // Remove the old Settings heading if present
    const settingsPageContainer = document.getElementById('page-settings');
    if (!settingsPageContainer) {
        console.warn("[SettingsController] Could not find #page-settings container.");
        return;
    }
    const oldHeading = settingsPageContainer.querySelector('h2');
    if (oldHeading) oldHeading.remove();

    // Remove any old log management section (if present)
    const oldLogSection = settingsPageContainer.querySelector('.log-management-section');
    if (oldLogSection) oldLogSection.remove();

    // Remove any old theme toggle button (if present)
    const oldThemeBtn = settingsPageContainer.querySelector('#theme-toggle-button');
    if (oldThemeBtn) oldThemeBtn.remove();

    // Inject Common Settings foldout (theme toggle)
    const commonSettingsFoldout = createCommonSettingsFoldout();
    settingsPageContainer.appendChild(commonSettingsFoldout);

    // Inject Log Management foldout
    const logManagementFoldout = createLogManagementFoldout();
    settingsPageContainer.appendChild(logManagementFoldout);

    // Setup listeners for log management buttons
    const viewLogsButton = settingsPageContainer.querySelector('#viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            console.log('[SettingsController] View Logs button clicked. Opening log viewer popup...');
            try {
                const viewerUrl = 'sidepanel.html?view=logs'; 
                browser.windows.create({
                    url: viewerUrl,
                    type: 'popup',
                    width: 800,
                    height: 600
                });
            } catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);
            }
        });
    }
    const resetDbButton = settingsPageContainer.querySelector('#resetDbButton');
    if (resetDbButton) {
        resetDbButton.addEventListener('click', async () => {
            console.log('[SettingsController] Reset DB button clicked.');
            try {
                const request = new DbResetDatabaseRequest();
                const result = await sendDbRequestSmart(request);
                if (result && result.success) {
                    alert('Database reset successfully!');
                } else {
                    alert('Database reset failed.');
                }
                console.log('[SettingsController] Reset DB result:', result);
            } catch (e: any) {
                alert('Failed to reset database: ' + (e.message || e));
                console.error('[SettingsController] Reset DB error:', e);
            }
        });
    }

    // Inject Inference Settings foldout (already styled)
    setupInferenceSettings();

    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");
    return {}; 
} 