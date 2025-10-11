// src/Controllers/IntegrationsNativeTab.ts
import browser from 'webextension-polyfill';

// Logging constants
const LOG_ERROR = true;
export const LOG_NATIVE_APP = true;
const prefix = '[IntegrationsNativeTab]';

// Status update interval
let nativeStatusUpdateInterval: number | null = null;
export function createNativeContent(): string {
    return `
        <div class="space-y-4 text-sm">
            <!-- Connection Status Section (Always Visible at Top) -->
            <div id="native-connection-status" class="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📡 Connection Status</h3>
                
                <div id="native-status-indicator" class="mb-4">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span id="native-status-icon" class="text-2xl">⏳</span>
                    <div>
                                <div id="native-status-text" class="font-medium text-gray-700 dark:text-gray-300">Checking connection...</div>
                                <div id="native-status-uptime" class="text-xs text-gray-500 dark:text-gray-400"></div>
                    </div>
                        </div>
                        <div id="native-status-stats" class="text-right text-xs text-gray-500 dark:text-gray-400 hidden">
                            <div>↑ <span id="native-msgs-sent">0</span> sent</div>
                            <div>↓ <span id="native-msgs-received">0</span> received</div>
                        </div>
                    </div>
                    <div id="native-status-details" class="text-xs text-gray-500 dark:text-gray-400"></div>
                    
                    <!-- Activity Log (Shown when connected) -->
                    <div id="native-activity-log" class="hidden mt-3 p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="text-xs font-semibold text-gray-600 dark:text-gray-400">📋 Recent Activity</h4>
                            <button id="native-clear-log-btn" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Clear</button>
                        </div>
                        <div id="native-activity-entries" class="space-y-1 text-xs font-mono">
                            <!-- Activity entries will be inserted here -->
                        </div>
                    </div>
                </div>
                
                <!-- Install Section (Shown when NOT connected) -->
                <div id="native-install-section" class="hidden">
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <button id="native-download-installer-btn" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                            📥 Download Installer
                        </button>
                        <button id="native-copy-install-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                            📋 Copy Command
                    </button>
                </div>
                    
                    <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-2">🚀 Choose Your Installation Method:</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-700 dark:text-gray-300">
                            <div class="p-2 bg-white dark:bg-gray-800 rounded border">
                                <h5 class="font-semibold text-green-600 mb-1">📥 GUI Installer (Recommended)</h5>
                                <ol class="space-y-1 list-decimal list-inside">
                                    <li>Click "Download Installer" above</li>
                                    <li>Run the downloaded installer</li>
                                    <li>Follow the GUI prompts</li>
                                    <li>Everything will be set up automatically</li>
                                </ol>
                    </div>
                            <div class="p-2 bg-white dark:bg-gray-800 rounded border">
                                <h5 class="font-semibold text-blue-600 mb-1">📋 Terminal Method</h5>
                                <ol class="space-y-1 list-decimal list-inside">
                                    <li>Click "Copy Command" above</li>
                                    <li>Open <span id="native-terminal-name" class="font-mono bg-gray-200 dark:bg-gray-700 px-1 rounded">Terminal</span></li>
                                    <li>Paste and press Enter</li>
                                    <li>Follow command-line prompts</li>
                                </ol>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            🔍 <span>Want to inspect the install script first?</span>
                        </h4>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            We believe in transparency. Review the source code before installing:
                        </p>
                        <div class="flex flex-col gap-1 text-xs">
                            <a href="https://github.com/ocentra/TabAgentDist" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">
                                📂 View Repository: github.com/ocentra/TabAgentDist
                            </a>
                            <a id="native-install-script-link" href="https://github.com/ocentra/TabAgentDist/blob/main/NativeApp/install.sh" target="_blank" class="text-blue-600 dark:text-blue-400 hover:underline">
                                📄 View Install Script
                            </a>
                        </div>
                    </div>
                </div>
                
                <!-- Connected Section (Shown when connected) -->
                <div id="native-connected-section" class="hidden">
                    <div class="grid grid-cols-3 gap-2 mb-3">
                        <button id="native-test-connection-btn" class="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm">
                            🔄 Test Connection
                        </button>
                        <button id="native-view-logs-btn" class="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm">
                            📄 View Logs
                        </button>
                        <button id="native-diagnostics-btn" class="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm">
                            🔍 Diagnostics
                    </button>
                    </div>
                </div>
            </div>
            
            <!-- System Information Section (Shown when connected) -->
            <div id="native-system-info" class="hidden p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">💻 System Information</h3>
                <div id="native-system-details" class="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <div class="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                        <span class="font-medium">Operating System:</span>
                        <span id="sys-os" class="text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                        <span class="font-medium">CPU:</span>
                        <span id="sys-cpu" class="text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                        <span class="font-medium">RAM:</span>
                        <span id="sys-ram" class="text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                    <div class="flex justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                        <span class="font-medium">GPU:</span>
                        <span id="sys-gpu" class="text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                    <div class="flex justify-between py-1">
                        <span class="font-medium">VRAM:</span>
                        <span id="sys-vram" class="text-gray-600 dark:text-gray-400">Loading...</span>
                    </div>
                </div>
            </div>
            
            <!-- Success Message (Shown when connected) -->
            <div id="native-success-message" class="hidden p-4 border border-green-200 dark:border-green-700 rounded-lg bg-green-50 dark:bg-green-900/20">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">🎉 You're All Set!</h3>
                <p class="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Your native app is connected and ready to unlock:
                </p>
                <ul class="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li class="flex items-start gap-2">
                        <span class="text-green-600 dark:text-green-400">✓</span>
                        <span>Full system resources (<span id="success-ram">--</span> RAM + <span id="success-vram">--</span> VRAM)</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-600 dark:text-green-400">✓</span>
                        <span>Advanced AI capabilities & local model support</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-600 dark:text-green-400">✓</span>
                        <span>Computer Use Agent for desktop automation</span>
                    </li>
                    <li class="flex items-start gap-2">
                        <span class="text-green-600 dark:text-green-400">✓</span>
                        <span>Complete privacy & local processing</span>
                    </li>
                </ul>
            </div>
            
            <!-- Why Install Section (Always visible, collapsible) -->
            <div class="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">🚀 Why Install the Native App?</h3>
                
                <div class="space-y-3">
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span class="text-green-600 dark:text-green-400">✓</span>
                            <span>Unlock Full AI Potential</span>
                        </h4>
                        <ul class="ml-6 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Access all your RAM, VRAM & GPU power</li>
                            <li>• Run powerful local AI models without limitations</li>
                            <li>• No browser memory constraints</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span class="text-green-600 dark:text-green-400">✓</span>
                            <span>Advanced Agent Capabilities</span>
                        </h4>
                        <ul class="ml-6 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Computer Use Agent - control your desktop</li>
                            <li>• Better agentic workflows and automation</li>
                            <li>• System-level integrations</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span class="text-green-600 dark:text-green-400">✓</span>
                            <span>Better Data & Performance</span>
                        </h4>
                        <ul class="ml-6 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Persistent local storage beyond IndexedDB</li>
                            <li>• Direct file system access</li>
                            <li>• No browser storage limits</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span class="text-green-600 dark:text-green-400">✓</span>
                            <span>Memory-Efficient BitNet Agents 🧠</span>
                        </h4>
                        <ul class="ml-6 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Run advanced 1-bit quantized models (BitNet)</li>
                            <li>• Optimized for both GPU and CPU execution</li>
                            <li>• Use 8x less memory than traditional models</li>
                            <li>• Faster inference with minimal quality loss</li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span class="text-green-600 dark:text-green-400">✓</span>
                            <span>Privacy & Security First 🔒</span>
                        </h4>
                        <ul class="ml-6 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• 100% local processing - your data never leaves your machine</li>
                            <li>• Zero tracking, zero data collection</li>
                            <li>• No big tech surveillance or monitoring</li>
                            <li>• Complete control over your AI interactions</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- What Happens Section -->
            <div class="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">📦 What Happens When You Install?</h3>
                
                <div class="space-y-3">
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">Step 1: Download</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            The install script downloads the native host executable for your platform from our GitHub releases.
                        </p>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">Step 2: Install</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Places it in a safe location on your system:
                        </p>
                        <ul class="ml-4 mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <li><strong>Windows:</strong> <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">%LOCALAPPDATA%\\TabAgent</code></li>
                            <li><strong>macOS:</strong> <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">~/Library/Application Support/TabAgent</code></li>
                            <li><strong>Linux:</strong> <code class="bg-gray-200 dark:bg-gray-700 px-1 rounded">~/.local/share/tabagent</code></li>
                        </ul>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1">Step 3: Register</h4>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Registers with Chrome so the extension can communicate securely through the native messaging protocol.
                        </p>
                    </div>
                    
                    <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                        <h4 class="font-semibold text-gray-800 dark:text-gray-200 mb-1 flex items-center gap-2">
                            <span>✅ Safe & Reversible</span>
                        </h4>
                        <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                            <li>• Open source - inspect the code anytime</li>
                            <li>• Easy to uninstall (just delete the folder)</li>
                            <li>• Permission-based communication only</li>
                            <li>• No admin rights required</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

async function loadSystemInformation(): Promise<void> {
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Loading system information...`);
    
    try {
        const response = await sendNativeMessage({ action: 'get_system_info' });
        
        if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] System info response:`, response);
        
        if (response && response.status === 'success' && response.data) {
            const info = response.data;
            
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] System info:`, info);
            
            // Update system info display
            const osEl = document.getElementById('sys-os');
            const cpuEl = document.getElementById('sys-cpu');
            const ramEl = document.getElementById('sys-ram');
            const gpuEl = document.getElementById('sys-gpu');
            const vramEl = document.getElementById('sys-vram');
            
            if (osEl) osEl.textContent = info.os || 'Unknown';
            if (cpuEl) cpuEl.textContent = info.cpu || 'Unknown';
            if (ramEl) ramEl.textContent = info.ram || 'Unknown';
            if (gpuEl) gpuEl.textContent = info.gpu || 'Unknown';
            if (vramEl) vramEl.textContent = info.vram || 'Unknown';
            
            // Update success message with system resources
            const successRam = document.getElementById('success-ram');
            const successVram = document.getElementById('success-vram');
            if (successRam) successRam.textContent = info.ram || '--';
            if (successVram) successVram.textContent = info.vram || '--';
            
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] ✅ System information loaded and displayed`);
        }
    } catch (error) {
        if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] ❌ Failed to load system information:`, error);
        if (LOG_ERROR) console.error(`${prefix} Failed to load system info:`, error);
        
        // Set defaults
        const osEl = document.getElementById('sys-os');
        const cpuEl = document.getElementById('sys-cpu');
        const ramEl = document.getElementById('sys-ram');
        const gpuEl = document.getElementById('sys-gpu');
        const vramEl = document.getElementById('sys-vram');
        
        if (osEl) osEl.textContent = 'Unable to retrieve';
        if (cpuEl) cpuEl.textContent = 'Unable to retrieve';
        if (ramEl) ramEl.textContent = 'Unable to retrieve';
        if (gpuEl) gpuEl.textContent = 'Unable to retrieve';
        if (vramEl) vramEl.textContent = 'Unable to retrieve';
    }
}

function setupInstallCommand(): void {
    // Detect OS using navigator.userAgent
    const userAgent = navigator.userAgent.toLowerCase();
    let os: string;
    
    if (userAgent.includes('win')) {
        os = 'win';
    } else if (userAgent.includes('mac')) {
        os = 'mac';
    } else if (userAgent.includes('linux')) {
        os = 'linux';
    } else {
        os = 'unknown';
    }
    
    const osNameEl = document.getElementById('native-os-name');
    const terminalNameEl = document.getElementById('native-terminal-name');
    const installScriptLink = document.getElementById('native-install-script-link') as HTMLAnchorElement;
    
    let osDisplayName = 'Your OS';
    let terminalName = 'Terminal';
    let installCommand = '';
    let scriptUrl = 'https://github.com/ocentra/TabAgentDist/blob/main/NativeApp/installers/linux/install.sh';
    
    if (os === 'win') {
        osDisplayName = 'Windows';
        terminalName = 'PowerShell';
        installCommand = `irm https://raw.githubusercontent.com/ocentra/TabAgentDist/main/NativeApp/installers/windows/install-gui.ps1 | iex`;
        scriptUrl = 'https://github.com/ocentra/TabAgentDist/blob/main/NativeApp/installers/windows/install-gui.ps1';
    } else if (os === 'mac') {
        osDisplayName = 'macOS';
        terminalName = 'Terminal';
        installCommand = `curl -fsSL https://raw.githubusercontent.com/ocentra/TabAgentDist/main/NativeApp/installers/macos/install-gui.sh | bash`;
        scriptUrl = 'https://github.com/ocentra/TabAgentDist/blob/main/NativeApp/installers/macos/install-gui.sh';
    } else if (os === 'linux') {
        osDisplayName = 'Linux';
        terminalName = 'Terminal';
        installCommand = `curl -fsSL https://raw.githubusercontent.com/ocentra/TabAgentDist/main/NativeApp/installers/linux/install.sh | bash`;
        scriptUrl = 'https://github.com/ocentra/TabAgentDist/blob/main/NativeApp/installers/linux/install.sh';
    }
    
    if (osNameEl) osNameEl.textContent = osDisplayName;
    if (terminalNameEl) terminalNameEl.textContent = terminalName;
    if (installScriptLink) installScriptLink.href = scriptUrl;
    
    // Store install command for copy button
    const copyBtn = document.getElementById('native-copy-install-btn');
    if (copyBtn) {
        (copyBtn as any).dataset.installCommand = installCommand;
    }
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function runDiagnostics(): Promise<void> {
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Starting diagnostic checks...`);
    
    const diagnostics: any = {
        timestamp: new Date().toISOString(),
        checks: {}
    };
    
    // Check 1: Health Server
    try {
        const healthResponse = await fetch('http://localhost:8765/health');
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            diagnostics.checks.healthServer = { status: '✅ Accessible', data: healthData };
        } else {
            diagnostics.checks.healthServer = { status: '⚠️ Server responded but error', code: healthResponse.status };
        }
    } catch (error) {
        diagnostics.checks.healthServer = { status: '❌ Not accessible', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Check 2: Native Messaging
    try {
        const pingResponse = await sendNativeMessage({ action: 'ping' }, 3000);
        diagnostics.checks.nativeMessaging = { status: '✅ Connected', version: pingResponse.version, response: pingResponse };
    } catch (error) {
        diagnostics.checks.nativeMessaging = { status: '❌ Failed', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    // Check 3: LM Studio
    try {
        const lmResponse = await fetch('http://localhost:8765/lmstudio/check');
        if (lmResponse.ok) {
            const lmData = await lmResponse.json();
            diagnostics.checks.lmStudio = {
                status: lmData.api_accessible ? '✅ Running & API accessible' : 
                        lmData.running ? '⚠️ Running but API not accessible' :
                        lmData.installed ? '⚠️ Installed but not running' : '❌ Not installed',
                data: lmData
            };
        } else {
            diagnostics.checks.lmStudio = { status: '❌ Check failed', error: `HTTP ${lmResponse.status}` };
        }
    } catch (error) {
        diagnostics.checks.lmStudio = { status: '❌ Cannot check', error: error instanceof Error ? error.message : 'Unknown error' };
    }
    
    showDiagnosticsModal(diagnostics);
}

function showDiagnosticsModal(diagnostics: any): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4';
    
    const checksHtml = Object.entries(diagnostics.checks).map(([key, check]: [string, any]) => {
        const bgColor = check.status.includes('✅') ? 'bg-green-50 dark:bg-green-900/20 border-green-200' :
                       check.status.includes('⚠️') ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200' :
                       'bg-red-50 dark:bg-red-900/20 border-red-200';
        const title = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        return `<div class="p-3 ${bgColor} border rounded-lg">
            <h4 class="font-semibold mb-2">${title}</h4>
            <p class="text-sm mb-2">${check.status}</p>
            ${check.data ? `<details class="text-xs"><summary class="cursor-pointer">Details</summary><pre class="mt-2 p-2 bg-gray-900 text-green-400 rounded overflow-auto max-h-40">${JSON.stringify(check.data, null, 2)}</pre></details>` : ''}
            ${check.error ? `<p class="text-xs text-red-600 mt-1">Error: ${check.error}</p>` : ''}
        </div>`;
    }).join('');
    
    modal.innerHTML = `<div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
            <h2 class="text-xl font-bold">🔍 Diagnostics</h2>
            <button id="close-diagnostics-modal" class="text-2xl">✕</button>
        </div>
        <div class="flex-1 overflow-auto p-4 space-y-3">${checksHtml}</div>
        <div class="flex justify-end gap-3 p-4 border-t">
            <button id="refresh-diagnostics-btn" class="px-4 py-2 bg-blue-600 text-white rounded-lg">🔄 Refresh</button>
            <button id="close-diagnostics-btn" class="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.querySelector('#close-diagnostics-modal')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#close-diagnostics-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#refresh-diagnostics-btn')?.addEventListener('click', async () => { modal.remove(); await runDiagnostics(); });
}

function showNativeHostLogs(logContent: string, logFile: string, totalLines: number): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4';
    modal.innerHTML = `<div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b">
            <div><h2 class="text-xl font-bold">📄 Logs</h2><p class="text-xs text-gray-500">${logFile} (${totalLines} lines)</p></div>
            <button id="close-logs-modal" class="text-2xl">✕</button>
        </div>
        <div class="flex-1 overflow-hidden p-4">
            <pre id="log-content" class="h-full overflow-auto bg-gray-900 text-green-400 p-4 rounded font-mono text-xs">${escapeHtml(logContent)}</pre>
        </div>
        <div class="flex justify-between p-4 border-t">
            <button id="copy-logs-btn" class="px-4 py-2 bg-purple-600 text-white rounded-lg">📋 Copy</button>
            <button id="close-logs-btn" class="px-4 py-2 bg-gray-200 rounded-lg">Close</button>
        </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.querySelector('#close-logs-modal')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#close-logs-btn')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#copy-logs-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(logContent).then(() => {
            const btn = modal.querySelector('#copy-logs-btn') as HTMLButtonElement;
            if (btn) { const orig = btn.innerHTML; btn.innerHTML = '✅ Copied!'; setTimeout(() => btn.innerHTML = orig, 2000); }
        });
    });
}

function setupNativeEventListeners(container: HTMLElement): void {
    // Copy install command button
    const copyBtn = document.getElementById('native-copy-install-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const installCommand = (copyBtn as any).dataset.installCommand;
            if (installCommand) {
                navigator.clipboard.writeText(installCommand).then(() => {
                    // Show success feedback
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '✅ Copied! Paste in your terminal';
                    copyBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                    copyBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                        copyBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                    }, 3000);
                }).catch(err => {
                    if (LOG_ERROR) console.error(`${prefix} Failed to copy:`, err);
                    alert('Failed to copy command. Please copy it manually.');
                });
            }
        });
    }
    
    // Download installer button
    const downloadBtn = document.getElementById('native-download-installer-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            try {
                // Show loading state
                const originalText = downloadBtn.innerHTML;
                downloadBtn.innerHTML = '⏳ Downloading...';
                (downloadBtn as HTMLButtonElement).disabled = true;
                
                // Detect OS for download
                const userAgent = navigator.userAgent.toLowerCase();
                let platform: 'windows' | 'macos' | 'linux' = 'windows';
                
                if (userAgent.includes('windows')) {
                    platform = 'windows';
                } else if (userAgent.includes('mac')) {
                    platform = 'macos';
                } else if (userAgent.includes('linux')) {
                    platform = 'linux';
                }
                
                let downloadUrl = '';
                let filename = '';
                
                // Try to get from releases first (Production mode)
                try {
                    const response = await fetch('https://api.github.com/repos/ocentra/TabAgentDist/releases/latest');
                    if (response.ok) {
                        const release = await response.json();
                        
                        // Map platform to release asset names
                        const assetMap: Record<string, string> = {
                            windows: 'TabAgent-Setup.msi',
                            macos: 'TabAgent-Setup.pkg',
                            linux: '.deb'  // Will match tabagent_*.deb
                        };
                        
                        const assetName = assetMap[platform];
                        const asset = release.assets.find((a: any) => 
                            a.name === assetName || a.name.includes(assetName)
                        );
                        
                        if (asset) {
                            downloadUrl = asset.browser_download_url;
                            filename = asset.name;
                            if (LOG_NATIVE_APP) console.log(`${prefix} Using release asset:`, filename);
                        }
                    }
                } catch (error) {
                    if (LOG_NATIVE_APP) console.log(`${prefix} No releases found, using raw files`);
                }
                
                // Fallback to raw installer scripts (Alpha mode)
                if (!downloadUrl) {
                    const rawBaseUrl = 'https://raw.githubusercontent.com/ocentra/TabAgentDist/main/NativeApp/installers';
                    const rawFiles: Record<string, { url: string; filename: string }> = {
                        windows: {
                            url: `${rawBaseUrl}/windows/install-gui.ps1`,
                            filename: 'install-gui.ps1'
                        },
                        macos: {
                            url: `${rawBaseUrl}/macos/install-gui.sh`,
                            filename: 'install-gui.sh'
                        },
                        linux: {
                            url: `${rawBaseUrl}/linux/install.sh`,
                            filename: 'install.sh'
                        }
                    };
                    
                    downloadUrl = rawFiles[platform].url;
                    filename = rawFiles[platform].filename;
                    if (LOG_NATIVE_APP) console.log(`${prefix} Using raw installer script:`, filename);
                }
                
                // Use Chrome downloads API to download the file
                if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.downloads) {
                    await new Promise<void>((resolve, reject) => {
                        (window as any).chrome.downloads.download({
                            url: downloadUrl,
                            filename: filename,
                            saveAs: false // Save to default downloads folder
                        }, (downloadId: any) => {
                            if ((window as any).chrome.runtime.lastError) {
                                reject(new Error((window as any).chrome.runtime.lastError.message));
                            } else {
                                resolve();
                            }
                        });
                    });
                    
                    downloadBtn.innerHTML = '✅ Downloaded! Check your Downloads folder';
                    downloadBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                    downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                    
                    // Show success message with platform-specific instructions
                    setTimeout(() => {
                        let instructions = '';
                        if (filename.endsWith('.msi')) {
                            instructions = '🚀 Next steps:\n1. Navigate to your Downloads folder\n2. Double-click TabAgent-Setup.msi\n3. Follow the installation wizard\n\n💡 Professional Windows installer - just like any other app!';
                        } else if (filename.endsWith('.pkg')) {
                            instructions = '🚀 Next steps:\n1. Navigate to your Downloads folder\n2. Double-click TabAgent-Setup.pkg\n3. Follow the installation wizard\n\n💡 Professional macOS installer with native integration!';
                        } else if (filename.endsWith('.deb') || filename.endsWith('.rpm')) {
                            instructions = `🚀 Next steps:\n1. Open Terminal\n2. Navigate to Downloads\n3. Run: sudo dpkg -i ${filename} (or sudo rpm -i ${filename})\n\n💡 Professional Linux package with system integration!`;
                        } else {
                            // Script files (.ps1, .sh)
                            const runCommand = filename.endsWith('.ps1') ? 
                                'Right-click → Run with PowerShell' : 
                                'chmod +x ' + filename + ' && ./' + filename;
                            instructions = `🚀 Next steps:\n1. Navigate to your Downloads folder\n2. ${runCommand}\n3. Follow the installer prompts\n\n💡 The installer will handle everything automatically!`;
                        }
                        alert(`✅ Installer downloaded successfully!\n\n📁 Location: Downloads folder\n📄 File: ${filename}\n\n${instructions}`);
                    }, 500);
                    
                } else {
                    // Fallback: open download URL in new tab
                    window.open(downloadUrl, '_blank');
                    downloadBtn.innerHTML = '🌐 Opening download page...';
                    downloadBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
                    downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                }
                
                // Reset button after 3 seconds
                setTimeout(() => {
                    downloadBtn.innerHTML = originalText;
                    (downloadBtn as HTMLButtonElement).disabled = false;
                    downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700', 'bg-blue-600', 'hover:bg-blue-700');
                    downloadBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                }, 3000);
                
            } catch (error) {
                console.error('Download failed:', error);
                downloadBtn.innerHTML = '❌ Download failed';
                downloadBtn.classList.add('bg-red-600', 'hover:bg-red-700');
                downloadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                
                setTimeout(() => {
                    downloadBtn.innerHTML = '📥 Download Installer';
                    (downloadBtn as HTMLButtonElement).disabled = false;
                    downloadBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
                    downloadBtn.classList.add('bg-green-600', 'hover:bg-green-700');
                }, 3000);
            }
        });
    }
    
    // Test connection button
    const testBtn = document.getElementById('native-test-connection-btn') as HTMLButtonElement;
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            testBtn.textContent = '🔄 Testing...';
            testBtn.disabled = true;
            
            await testNativeConnection();
            
            setTimeout(() => {
                testBtn.textContent = '🔄 Test Connection';
                testBtn.disabled = false;
            }, 1000);
        });
    }
    
    // View logs button
    const logsBtn = document.getElementById('native-view-logs-btn');
    if (logsBtn) {
        logsBtn.addEventListener('click', async () => {
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Fetching native host logs...`);
            
            try {
                const response = await sendNativeMessage({ action: 'get_logs', lines: 500 });
                
                if (response && response.status === 'success') {
                    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Logs fetched successfully from: ${response.log_file}`);
                    showNativeHostLogs(response.lines, response.log_file, response.total_lines);
                } else {
                    throw new Error(response?.message || 'Failed to fetch logs');
                }
            } catch (error) {
                if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Failed to fetch logs:`, error);
                alert(`Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    
    // Clear activity log button
    const clearLogBtn = document.getElementById('native-clear-log-btn');
    if (clearLogBtn) {
        clearLogBtn.addEventListener('click', () => {
            const activityEntries = document.getElementById('native-activity-entries');
            if (activityEntries) {
                activityEntries.innerHTML = '<div class="text-gray-500">Activity log cleared</div>';
            }
        });
    }
    
    // Diagnostics button
    const diagBtn = document.getElementById('native-diagnostics-btn');
    if (diagBtn) {
        diagBtn.addEventListener('click', async () => {
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Running full diagnostics...`);
            await runDiagnostics();
        });
    }
}

/**
 * Update the native connection status UI with rich information
 */
async function updateNativeConnectionStatus(): Promise<void> {
    try {
        // Get status from background's persistent connection manager
        const status = await browser.runtime.sendMessage({ type: 'get_native_host_status' });
        
        if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Status update:`, status);
        
        const statusIcon = document.getElementById('native-status-icon');
        const statusText = document.getElementById('native-status-text');
        const statusUptime = document.getElementById('native-status-uptime');
        const statusDetails = document.getElementById('native-status-details');
        const statusStats = document.getElementById('native-status-stats');
        const msgsSent = document.getElementById('native-msgs-sent');
        const msgsReceived = document.getElementById('native-msgs-received');
        const activityLog = document.getElementById('native-activity-log');
        const activityEntries = document.getElementById('native-activity-entries');
        const installSection = document.getElementById('native-install-section');
        const connectedSection = document.getElementById('native-connected-section');
        const systemInfoSection = document.getElementById('native-system-info');
        const successMessage = document.getElementById('native-success-message');
        
        if (!statusIcon || !statusText) return;
        
        if (status.connected) {
            // Connected state
            statusIcon.textContent = '✅';
            statusText.textContent = 'Connected';
            
            // Show uptime
            const uptimeMs = status.uptime || 0;
            const uptimeSec = Math.floor(uptimeMs / 1000);
            const uptimeStr = formatUptime(uptimeSec);
            if (statusUptime) {
                const connectedDate = new Date(status.connectedSince!);
                statusUptime.textContent = `Connected since ${connectedDate.toLocaleTimeString()} (${uptimeStr})`;
            }
            
            if (statusDetails) {
                statusDetails.textContent = 'Persistent connection active';
            }
            
            // Show stats
            if (statusStats && msgsSent && msgsReceived) {
                statusStats.classList.remove('hidden');
                msgsSent.textContent = status.messagesSent.toString();
                msgsReceived.textContent = status.messagesReceived.toString();
            }
            
            // Show activity log
            if (activityLog && activityEntries) {
                activityLog.classList.remove('hidden');
                updateActivityLog(status.recentEvents, activityEntries);
            }
            
            // Show connected section
            installSection?.classList.add('hidden');
            connectedSection?.classList.remove('hidden');
            systemInfoSection?.classList.remove('hidden');
            successMessage?.classList.remove('hidden');
            
        } else {
            // Disconnected state
            const isReconnecting = status.reconnectAttempts > 0;
            
            if (isReconnecting) {
                statusIcon.textContent = '🔄';
                statusText.textContent = `Reconnecting... (${status.reconnectAttempts}/5)`;
            } else {
                statusIcon.textContent = '❌';
                statusText.textContent = 'Not Connected';
            }
            
            if (statusUptime) {
                statusUptime.textContent = '';
            }
            
            if (statusDetails) {
                const lastEvent = status.recentEvents[status.recentEvents.length - 1];
                statusDetails.textContent = lastEvent ? lastEvent.message : 'Native host not running';
            }
            
            // Hide stats and activity log
            statusStats?.classList.add('hidden');
            activityLog?.classList.add('hidden');
            
            // Show install section
            installSection?.classList.remove('hidden');
            connectedSection?.classList.add('hidden');
            systemInfoSection?.classList.add('hidden');
            successMessage?.classList.add('hidden');
        }
        
    } catch (error) {
        if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Failed to update status:`, error);
    }
}

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

/**
 * Update activity log with recent events
 */
function updateActivityLog(events: any[], container: HTMLElement): void {
    // Clear existing entries
    container.innerHTML = '';
    
    // Add events in reverse order (newest first)
    const recentEvents = events.slice(-10).reverse();
    
    recentEvents.forEach(event => {
        const entry = document.createElement('div');
        entry.className = 'flex items-start gap-2 text-gray-600 dark:text-gray-400';
        
        const icon = getEventIcon(event.type);
        const time = new Date(event.timestamp).toLocaleTimeString();
        
        entry.innerHTML = `
            <span class="flex-shrink-0">${icon}</span>
            <span class="flex-shrink-0 text-gray-500">${time}</span>
            <span class="flex-1">${event.message}</span>
        `;
        
        container.appendChild(entry);
    });
    
    if (recentEvents.length === 0) {
        container.innerHTML = '<div class="text-gray-500">No recent activity</div>';
    }
}

/**
 * Get icon for event type
 */
function getEventIcon(type: string): string {
    switch (type) {
        case 'connected': return '🟢';
        case 'disconnected': return '🔴';
        case 'reconnecting': return '🟡';
        case 'error': return '⚠️';
        default: return '📝';
    }
}

async function testNativeConnection(): Promise<void> {
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Testing native host connection...`);
    
    const statusIcon = document.getElementById('native-status-icon');
    const statusText = document.getElementById('native-status-text');
    const statusDetails = document.getElementById('native-status-details');
    const installSection = document.getElementById('native-install-section');
    const connectedSection = document.getElementById('native-connected-section');
    const systemInfoSection = document.getElementById('native-system-info');
    const successMessage = document.getElementById('native-success-message');
    
    if (!statusIcon || !statusText || !statusDetails) {
        if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Required UI elements not found!`);
        return;
    }
    
    // Update status from background connection manager
    await updateNativeConnectionStatus();
    
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Sending ping message to native host...`);
    
    try {
        // Test connection with timeout
        const response = await sendNativeMessage({ action: 'ping' }, 3000);
        
        if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Received response:`, response);
        
        if (response && response.status === 'success') {
            // Connected!
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] ✅ Successfully connected! Version: ${response.version || '1.0.0'}`);
            
            statusIcon.textContent = '✅';
            statusText.textContent = `Connected (v${response.version || '1.0.0'})`;
            statusDetails.textContent = 'Native app is running and ready';
            
            // Hide install section, show connected section
            installSection?.classList.add('hidden');
            connectedSection?.classList.remove('hidden');
            systemInfoSection?.classList.remove('hidden');
            successMessage?.classList.remove('hidden');
            
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Loading system information...`);
            
            // Load system information
            await loadSystemInformation();
        } else {
            if (LOG_NATIVE_APP) console.warn(`${prefix} [NATIVE] Invalid response from native host:`, response);
            throw new Error('Invalid response from native host');
        }
    } catch (error) {
        // Not connected
        if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] ❌ Connection failed:`, error);
        statusIcon.textContent = '❌';
        statusText.textContent = 'Not Connected';
        
        if (error instanceof Error) {
            if (error.message.includes('Specified native messaging host not found')) {
                statusDetails.textContent = 'Native host not installed. Follow the installation steps below.';
            } else if (error.message.includes('timeout')) {
                statusDetails.textContent = 'Native host not responding. Try restarting Chrome.';
            } else {
                statusDetails.textContent = `Error: ${error.message}`;
            }
        } else {
            statusDetails.textContent = 'Native host not found. Install it to unlock advanced features.';
        }
        
        // Show install section, hide connected section
        installSection?.classList.remove('hidden');
        connectedSection?.classList.add('hidden');
        systemInfoSection?.classList.add('hidden');
        successMessage?.classList.add('hidden');
        
        // Setup OS-specific install command
        setupInstallCommand();
    }
}

/**
 * Setup native app management and start monitoring
 */
export function setupNativeTab(container: HTMLElement): void {
    // Setup OS-specific install command
    setupInstallCommand();
    
    // Setup event listeners
    setupNativeEventListeners(container);
    
    // Listen for status updates from background
    browser.runtime.onMessage.addListener((message: any) => {
        if (message.type === 'native_host_status_update') {
            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Received status update from background:`, message.payload);
            updateUIWithStatus(message.payload);
        }
    });
    
    // Initial status check
    updateNativeConnectionStatus();
    
    // Set up periodic status refresh
    startStatusUpdates();
}

/**
 * Start periodic status updates
 */
function startStatusUpdates(): void {
    if (nativeStatusUpdateInterval) {
        clearInterval(nativeStatusUpdateInterval);
    }
    
    nativeStatusUpdateInterval = window.setInterval(async () => {
        await updateNativeConnectionStatus();
    }, 5000); // Update every 5 seconds
    
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Started automatic status updates (every 5s)`);
}

/**
 * Stop status updates
 */
function stopStatusUpdates(): void {
    if (nativeStatusUpdateInterval) {
        clearInterval(nativeStatusUpdateInterval);
        nativeStatusUpdateInterval = null;
        if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Stopped automatic status updates`);
    }
}

/**
 * Update UI directly with status object (for broadcast updates)
 */
function updateUIWithStatus(status: any): void {
    const statusIcon = document.getElementById('native-status-icon');
    const statusText = document.getElementById('native-status-text');
    const statusUptime = document.getElementById('native-status-uptime');
    const statusDetails = document.getElementById('native-status-details');
    const statusStats = document.getElementById('native-status-stats');
    const msgsSent = document.getElementById('native-msgs-sent');
    const msgsReceived = document.getElementById('native-msgs-received');
    const activityLog = document.getElementById('native-activity-log');
    const activityEntries = document.getElementById('native-activity-entries');
    
    if (!statusIcon || !statusText) return;
    
    if (status.connected) {
        statusIcon.textContent = '✅';
        statusText.textContent = 'Connected';
        
        const uptimeMs = status.uptime || 0;
        const uptimeSec = Math.floor(uptimeMs / 1000);
        const uptimeStr = formatUptime(uptimeSec);
        if (statusUptime) {
            const connectedDate = new Date(status.connectedSince!);
            statusUptime.textContent = `Connected since ${connectedDate.toLocaleTimeString()} (${uptimeStr})`;
        }
        
        if (statusDetails) {
            const lastActivity = status.lastActivity ? new Date(status.lastActivity).toLocaleTimeString() : 'None';
            statusDetails.textContent = `Last activity: ${lastActivity}`;
        }
        
        if (statusStats && msgsSent && msgsReceived) {
            statusStats.classList.remove('hidden');
            msgsSent.textContent = status.messagesSent.toString();
            msgsReceived.textContent = status.messagesReceived.toString();
        }
        
        if (activityLog && activityEntries && status.recentEvents.length > 0) {
            activityLog.classList.remove('hidden');
            updateActivityLog(status.recentEvents, activityEntries);
        }
    } else {
        const isReconnecting = status.reconnectAttempts > 0;
        
        if (isReconnecting) {
            statusIcon.textContent = '🔄';
            statusText.textContent = `Reconnecting... (${status.reconnectAttempts}/5)`;
        } else {
            statusIcon.textContent = '❌';
            statusText.textContent = 'Not Connected';
        }
        
        if (statusUptime) {
            statusUptime.textContent = '';
        }
        
        statusStats?.classList.add('hidden');
        activityLog?.classList.add('hidden');
    }
}

async function sendNativeMessage(message: any, timeoutMs: number = 5000): Promise<any> {
    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] sendNativeMessage called with:`, { message, timeoutMs });
    
    try {
        // Try to get the persistent connection manager from background
        const response = await browser.runtime.sendMessage({
            type: 'native_host_message',
            payload: message,
            timeout: timeoutMs
        });
        
        if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Response received via persistent connection:`, response);
        return response;
        
    } catch (error: any) {
        if (LOG_NATIVE_APP) console.warn(`${prefix} [NATIVE] Persistent connection not available, falling back to one-off message:`, error);
        
        // Fallback to one-off native messaging (legacy support)
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Timeout after ${timeoutMs}ms`);
                reject(new Error('Native messaging timeout'));
            }, timeoutMs);
            
            try {
                // Cross-browser native messaging support
                const detectBrowser = () => {
                    // Check for Firefox first (uses browser namespace)
                    if (typeof (window as any).browser !== 'undefined' && 
                        (window as any).browser.runtime && 
                        (window as any).browser.runtime.sendNativeMessage) {
                        return 'firefox';
                    }
                    // Check for Chromium-based browsers (Chrome, Edge, Opera, Brave, Vivaldi)
                    else if (typeof (window as any).chrome !== 'undefined' && 
                             (window as any).chrome.runtime && 
                             (window as any).chrome.runtime.sendNativeMessage) {
                        return 'chromium';
                    }
                    return 'unsupported';
                };
                
                const browserType = detectBrowser();
                
                if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Detected browser type: ${browserType}`);
                
                if (browserType === 'unsupported') {
                    if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Unsupported browser!`);
                    reject(new Error('Native messaging is not supported in this browser. Supported browsers: Chrome, Edge, Firefox, Opera, Brave, Vivaldi.'));
                    return;
                }
                
                if (browserType === 'firefox') {
                    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Using Firefox API (Promise-based)`);
                    // Firefox uses Promise-based API
                    (window as any).browser.runtime.sendNativeMessage('com.tabagent.host', message)
                        .then((response: any) => {
                            clearTimeout(timeout);
                            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Firefox response received:`, response);
                            resolve(response);
                        })
                        .catch((error: any) => {
                            clearTimeout(timeout);
                            if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Firefox error:`, error);
                            reject(new Error(error.message || 'Firefox native messaging error'));
                        });
                } else if (browserType === 'chromium') {
                    if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Using Chromium API (callback-based)`);
                    // Chrome/Edge uses callback-based API
                    (window as any).chrome.runtime.sendNativeMessage(
                        'com.tabagent.host',
                        message,
                        (response: any) => {
                            clearTimeout(timeout);
                        
                        if ((window as any).chrome.runtime.lastError) {
                            const errorMsg = (window as any).chrome.runtime.lastError.message || 'Unknown error';
                            if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Chromium error:`, errorMsg);
                            reject(new Error(errorMsg));
                        } else {
                            if (LOG_NATIVE_APP) console.log(`${prefix} [NATIVE] Chromium response received:`, response);
                            resolve(response);
                        }
                    }
                );
            }
        } catch (error) {
            clearTimeout(timeout);
            if (LOG_NATIVE_APP) console.error(`${prefix} [NATIVE] Exception in sendNativeMessage:`, error);
            reject(error);
        }
    });
}
}
