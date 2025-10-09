// src/Controllers/IntegrationsController.ts
import browser from 'webextension-polyfill';
import { getAllCachedModels, deleteCachedModel, deleteAllCachedModels, CachedModelInfo, validateHuggingFaceModel, saveUserAddedModel, getUserAddedModels, removeUserAddedModel } from '../DB/idbModel';
import { AVAILABLE_MODELS } from '../Home/uiController';

// Logging constants
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = false;
const prefix = '[IntegrationsController]';

let isInitialized = false;

// Helper to create a foldout section (matching other controllers style)
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

function createBrowserModelsFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-4 text-sm">
            <!-- Add Custom Model Section -->
            <div class="border border-blue-200 dark:border-blue-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Add Custom Model</h4>
                <div class="space-y-2">
                    <input 
                        type="text" 
                        id="customModelRepoId" 
                        placeholder="e.g., onnx-community/Phi-3-mini-4k-instruct-onnx"
                        class="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    />
                    <div class="flex gap-2">
                        <button id="validateModelButton" class="flex-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                            Validate & Add
                        </button>
                        <button id="clearInputButton" class="px-2 py-1 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 text-xs">
                            Clear
                        </button>
                    </div>
                    <div id="validationMessage" class="text-xs hidden"></div>
                </div>
            </div>
            
            <!-- User-Added Models Section -->
            <div id="userAddedModelsSection" class="hidden">
                <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Your Custom Models</h5>
                <div id="userAddedModelsList" class="space-y-1 max-h-32 overflow-y-auto text-xs border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                </div>
            </div>
            
            <div class="flex items-center justify-between">
                <h4 class="font-medium text-gray-800 dark:text-gray-200">Cached Models</h4>
                <div class="flex gap-2">
                    <button id="refreshModelsButton" class="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">Refresh</button>
                    <button id="deleteAllModelsButton" class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs">Delete All</button>
                </div>
            </div>
            
            <div id="modelsList" class="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-2">
                <div class="text-center text-gray-500 dark:text-gray-400 py-4">
                    Loading cached models...
                </div>
            </div>
            
            <div id="totalStorageInfo" class="text-xs text-gray-500 dark:text-gray-400 border-t pt-2">
                Total storage used: <span id="totalStorageValue">0 MB</span>
            </div>
            
            <div class="mt-4">
                <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-2">Available Models</h5>
                <div id="availableModelsList" class="space-y-1 max-h-32 overflow-y-auto text-xs text-gray-600 dark:text-gray-400">
                    <div class="text-center py-2">Loading available models...</div>
                </div>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Browser Models',
        contentHTML,
        sectionClass: 'browser-models-section',
        initiallyOpen: true
    });
}

function createNativeAppFoldout(): HTMLElement {
    const contentHTML = `
        <div class="space-y-3 text-sm">
            <div class="text-gray-600 dark:text-gray-400">
                <p>Connect to local AI applications running on your machine.</p>
                <p class="mt-2 text-xs">Requires LMStudio, Ollama, or similar local AI server.</p>
            </div>
            <div class="space-y-2">
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                        <h4 class="font-medium text-gray-800 dark:text-gray-200">LMStudio</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Local model server</p>
                    </div>
                    <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Connect
                    </button>
                </div>
                <div class="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded">
                    <div>
                        <h4 class="font-medium text-gray-800 dark:text-gray-200">Ollama</h4>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Local model runner</p>
                    </div>
                    <button class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs">
                        Connect
                    </button>
                </div>
            </div>
        </div>
    `;
    return createFoldoutSection({
        title: 'Native Applications',
        contentHTML,
        sectionClass: 'native-apps-section',
        initiallyOpen: true
    });
}

function createExternalAPIFoldout(): HTMLElement {
    const contentHTML = `
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
    return createFoldoutSection({
        title: 'External APIs',
        contentHTML,
        sectionClass: 'external-apis-section',
        initiallyOpen: true
    });
}

function setupModelManagement(container: HTMLElement): void {
    const modelsList = container.querySelector('#modelsList') as HTMLElement;
    const availableModelsList = container.querySelector('#availableModelsList') as HTMLElement;
    const refreshButton = container.querySelector('#refreshModelsButton') as HTMLButtonElement;
    const deleteAllButton = container.querySelector('#deleteAllModelsButton') as HTMLButtonElement;
    const totalStorageValue = container.querySelector('#totalStorageValue') as HTMLElement;
    
    // Custom model elements
    const customModelInput = container.querySelector('#customModelRepoId') as HTMLInputElement;
    const validateButton = container.querySelector('#validateModelButton') as HTMLButtonElement;
    const clearButton = container.querySelector('#clearInputButton') as HTMLButtonElement;
    const validationMessage = container.querySelector('#validationMessage') as HTMLElement;
    const userAddedModelsSection = container.querySelector('#userAddedModelsSection') as HTMLElement;
    const userAddedModelsList = container.querySelector('#userAddedModelsList') as HTMLElement;

    // Load models on initialization
    loadCachedModels();
    loadAvailableModels();
    loadUserAddedModels();

    // Refresh button
    refreshButton?.addEventListener('click', () => {
        loadCachedModels();
        loadAvailableModels();
        loadUserAddedModels();
    });
    
    // Clear button
    clearButton?.addEventListener('click', () => {
        customModelInput.value = '';
        validationMessage.classList.add('hidden');
    });
    
    // Validate and add model button
    validateButton?.addEventListener('click', async () => {
        const repoId = customModelInput.value.trim();
        
        if (!repoId) {
            showValidationMessage('Please enter a HuggingFace repository ID', 'error');
            return;
        }
        
        // Check if already exists
        const defaultModels = new Set(Object.keys(AVAILABLE_MODELS));
        if (defaultModels.has(repoId)) {
            showValidationMessage('This model is already in the default list', 'error');
            return;
        }
        
        showValidationMessage('Validating model...', 'info');
        validateButton.disabled = true;
        
        try {
            const validation = await validateHuggingFaceModel(repoId);
            
            if (!validation.valid) {
                showValidationMessage(validation.error || 'Invalid model', 'error');
                validateButton.disabled = false;
                return;
            }
            
            // Save to IndexedDB
            await saveUserAddedModel({
                repo: repoId,
                displayName: repoId.split('/').pop() || repoId,
                task: validation.task || 'text-generation'
            });
            
            showValidationMessage(`✓ Model added successfully! (${validation.onnxFiles?.length || 0} ONNX files found)`, 'success');
            customModelInput.value = '';
            
            // Refresh lists
            loadAvailableModels();
            loadUserAddedModels();
            
            // Dispatch event to refresh model dropdown
            window.dispatchEvent(new CustomEvent('userModelsUpdated'));
            
        } catch (error) {
            showValidationMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
        } finally {
            validateButton.disabled = false;
        }
    });
    
    function showValidationMessage(message: string, type: 'success' | 'error' | 'info') {
        validationMessage.textContent = message;
        validationMessage.classList.remove('hidden', 'text-green-600', 'text-red-600', 'text-blue-600');
        
        if (type === 'success') {
            validationMessage.classList.add('text-green-600', 'dark:text-green-400');
        } else if (type === 'error') {
            validationMessage.classList.add('text-red-600', 'dark:text-red-400');
        } else {
            validationMessage.classList.add('text-blue-600', 'dark:text-blue-400');
        }
        
        validationMessage.classList.remove('hidden');
    }

    // Delete all button
    deleteAllButton?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete all cached models? This action cannot be undone.')) {
            try {
                await deleteAllCachedModels();
                loadCachedModels();
                if (LOG_GENERAL) console.log(`${prefix} All cached models deleted successfully.`);
            } catch (error) {
                if (LOG_ERROR) console.error(`${prefix} Failed to delete all models:`, error);
                alert('Failed to delete all models. Please try again.');
            }
        }
    });

    async function loadCachedModels(): Promise<void> {
        try {
            if (LOG_DEBUG) console.log(`${prefix} Loading cached models...`);
            
            modelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">Loading cached models...</div>';
            
            const models = await getAllCachedModels();
            
            if (models.length === 0) {
                modelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-4">No cached models found.</div>';
                totalStorageValue.textContent = '0 MB';
                return;
            }

            // Calculate total storage
            const totalSize = models.reduce((sum, model) => sum + model.totalSize, 0);
            totalStorageValue.textContent = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;

            // Render models
            modelsList.innerHTML = '';
            models.forEach(model => {
                const modelElement = createModelElement(model);
                modelsList.appendChild(modelElement);
            });

            if (LOG_DEBUG) console.log(`${prefix} Loaded ${models.length} cached models.`);
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to load cached models:`, error);
            modelsList.innerHTML = '<div class="text-center text-red-500 py-4">Failed to load cached models.</div>';
        }
    }

    function createModelElement(model: CachedModelInfo): HTMLElement {
        const div = document.createElement('div');
        div.className = 'border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700';
        
        const sizeInMB = (model.totalSize / (1024 * 1024)).toFixed(1);
        const sizeInGB = (model.totalSize / (1024 * 1024 * 1024)).toFixed(2);
        const displaySize = model.totalSize > 1024 * 1024 * 1024 ? `${sizeInGB} GB` : `${sizeInMB} MB`;
        
        div.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <h5 class="font-medium text-gray-800 dark:text-gray-200 truncate">${model.modelId}</h5>
                    <p class="text-sm text-gray-600 dark:text-gray-400 truncate">${model.modelPath}</p>
                    <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>${displaySize}</span>
                        <span>${model.numChunks} chunks</span>
                        <span>${new Date(model.downloadDate).toLocaleDateString()}</span>
                    </div>
                </div>
                <button class="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs delete-model-btn" data-model-id="${model.modelId}" data-model-path="${model.modelPath}">
                    Delete
                </button>
            </div>
        `;

        // Add delete button event listener
        const deleteButton = div.querySelector('.delete-model-btn') as HTMLButtonElement;
        deleteButton.addEventListener('click', async () => {
            if (confirm(`Are you sure you want to delete ${model.modelId}? This action cannot be undone.`)) {
                try {
                    await deleteCachedModel(model);
                    loadCachedModels(); // Refresh the list
                    if (LOG_GENERAL) console.log(`${prefix} Model deleted: ${model.modelId}`);
                } catch (error) {
                    if (LOG_ERROR) console.error(`${prefix} Failed to delete model:`, error);
                    alert('Failed to delete model. Please try again.');
                }
            }
        });

        return div;
    }

    async function loadAvailableModels(): Promise<void> {
        try {
            if (LOG_DEBUG) console.log(`${prefix} Loading available models...`);
            
            availableModelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-2">Loading available models...</div>';
            
            // Import the manifest function
            const { getAllManifestEntries } = await import('../DB/idbModel');
            const manifests = await getAllManifestEntries();
            
            if (manifests.length === 0) {
                availableModelsList.innerHTML = '<div class="text-center text-gray-500 dark:text-gray-400 py-2">No models available.</div>';
                return;
            }

            // Render available models
            availableModelsList.innerHTML = '';
            manifests.forEach(manifest => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-800';
                
                const modelId = manifest.repo;
                const files = Object.keys(manifest.quants || {});
                const fileCount = files.length;
                
                div.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <span class="font-medium text-gray-800 dark:text-gray-200 truncate">${modelId}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">${fileCount} files</span>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">Available</span>
                `;

                availableModelsList.appendChild(div);
            });

            if (LOG_DEBUG) console.log(`${prefix} Loaded ${manifests.length} available models.`);
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to load available models:`, error);
            availableModelsList.innerHTML = '<div class="text-center text-red-500 py-2">Failed to load available models.</div>';
        }
    }
    
    async function loadUserAddedModels(): Promise<void> {
        try {
            if (LOG_DEBUG) console.log(`${prefix} Loading user-added models...`);
            
            const defaultModels = new Set(Object.keys(AVAILABLE_MODELS));
            const userModels = await getUserAddedModels(defaultModels);
            
            if (userModels.length === 0) {
                userAddedModelsSection.classList.add('hidden');
                return;
            }
            
            userAddedModelsSection.classList.remove('hidden');
            userAddedModelsList.innerHTML = '';
            
            userModels.forEach(model => {
                const div = document.createElement('div');
                div.className = 'flex items-center justify-between py-1 px-2 rounded bg-gray-50 dark:bg-gray-800';
                
                div.innerHTML = `
                    <div class="flex-1 min-w-0">
                        <span class="font-medium text-gray-800 dark:text-gray-200 truncate">${model.repo}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">${model.task || 'text-generation'}</span>
                    </div>
                    <button class="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs remove-custom-model" data-repo="${model.repo}">
                        Remove
                    </button>
                `;
                
                // Add remove button event listener
                const removeBtn = div.querySelector('.remove-custom-model') as HTMLButtonElement;
                removeBtn.addEventListener('click', async () => {
                    if (confirm(`Remove ${model.repo} from your custom models?`)) {
                        try {
                            await removeUserAddedModel(model.repo);
                            loadUserAddedModels();
                            loadAvailableModels();
                            
                            // Dispatch event to refresh model dropdown
                            window.dispatchEvent(new CustomEvent('userModelsUpdated'));
                            
                            if (LOG_GENERAL) console.log(`${prefix} Custom model removed: ${model.repo}`);
                        } catch (error) {
                            if (LOG_ERROR) console.error(`${prefix} Failed to remove custom model:`, error);
                            alert('Failed to remove model. Please try again.');
                        }
                    }
                });
                
                userAddedModelsList.appendChild(div);
            });
            
            if (LOG_DEBUG) console.log(`${prefix} Loaded ${userModels.length} user-added models.`);
        } catch (error) {
            if (LOG_ERROR) console.error(`${prefix} Failed to load user-added models:`, error);
        }
    }
}

export function initializeIntegrationsController(): any {
    if (isInitialized) {
        if (LOG_DEBUG) console.log(`${prefix} Already initialized.`);
        return;
    }
    if (LOG_DEBUG) console.log(`${prefix} Initializing...`);

    const integrationsPageContainer = document.getElementById('page-integrations');
    if (!integrationsPageContainer) {
        console.warn("[IntegrationsController] Could not find #page-integrations container.");
        return;
    }

    // Remove placeholder content
    const placeholder = integrationsPageContainer.querySelector('p');
    if (placeholder) placeholder.remove();

    // Inject foldout sections
    const browserModelsFoldout = createBrowserModelsFoldout();
    integrationsPageContainer.appendChild(browserModelsFoldout);

    const nativeAppFoldout = createNativeAppFoldout();
    integrationsPageContainer.appendChild(nativeAppFoldout);

    const externalAPIFoldout = createExternalAPIFoldout();
    integrationsPageContainer.appendChild(externalAPIFoldout);

    // Setup model management functionality
    setupModelManagement(integrationsPageContainer);

    isInitialized = true;
    if (LOG_DEBUG) console.log(`${prefix} Initialized successfully.`);
    return {}; 
}
