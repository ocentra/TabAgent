// src/Controllers/IntegrationsAPITab.ts

export function createAPIContent(): string {
    return `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to external AI API providers for cloud-based models.</p>
                <p class="mt-2 text-xs">Requires API keys and internet connection.</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                        <h4 class="font-medium text-gray-800 dark:text-gray-200">OpenAI</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">GPT models</p>
                    </div>
                    <button class="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs">
                        Configure
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                        <h4 class="font-medium text-gray-800 dark:text-gray-200">Google AI</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Gemini models</p>
                    </div>
                    <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Configure
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                        <h4 class="font-medium text-gray-800 dark:text-gray-200">OpenRouter</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Multiple providers</p>
                    </div>
                    <button class="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs">
                        Configure
                    </button>
                </div>
            </div>
        </div>
    `;
}

export function setupAPITab(container: HTMLElement): void {
    // API tab setup - to be implemented
}

