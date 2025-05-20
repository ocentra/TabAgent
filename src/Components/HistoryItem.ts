// src/Components/HistoryItem.js

// --- SVG Icons ---
const previewIconSvg = `<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`;
const trashIconSvg = `<svg class="w-4 h-4 action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.8798 20.1818C17.1169 21 15.8356 21 13.2731 21H10.7269C8.16438 21 6.8831 21 6.12019 20.1818C5.35728 19.3671 5.27811 18.0864 5.11973 15.5251L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.5 5.5L16.1733 3.57923C16.0596 2.8469 15.9989 2.48073 15.8184 2.21449C15.638 1.94825 15.362 1.75019 15.039 1.67153C14.7158 1.59286 14.3501 1.59286 13.6186 1.59286H10.3814C9.64993 1.59286 9.28419 1.59286 8.96099 1.67153C8.63796 1.75019 8.36201 1.94825 8.18156 2.21449C8.00111 2.48073 7.9404 2.8469 7.82672 3.57923L7.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 action-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>`;
const shareIconSvg = `<img src="icons/LinkChain.png" alt="Share" class="w-4 h-4 action-icon-img">`;

// --- Helper functions for inline editing UI ---

function startEditing(historyItemElement: HTMLElement): void {
    if (!historyItemElement) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview') as HTMLElement | null;
    const renameInput = historyItemElement.querySelector('.history-item-rename-input') as HTMLInputElement | null;

    if (!previewSpan || !renameInput) return;

    historyItemElement.classList.add('is-editing');
    previewSpan.style.display = 'none';
    renameInput.style.display = 'block';
    renameInput.value = previewSpan.textContent || '';
    renameInput.focus();
    renameInput.select();
}

function cancelEditing(historyItemElement: HTMLElement): void {
    if (!historyItemElement) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview') as HTMLElement | null;
    const renameInput = historyItemElement.querySelector('.history-item-rename-input') as HTMLInputElement | null;

    if (!previewSpan || !renameInput) return;

    renameInput.style.display = 'none';
    previewSpan.style.display = 'block';
    historyItemElement.classList.remove('is-editing');
    // No need to reset value here as it wasn't submitted
}

// --- Main Component Rendering Function ---

export function renderHistoryItemComponent(props: any): HTMLElement | null {
    const { 
        entry, 
        onStarClick = () => {}, 
        onDownloadClick = () => {}, 
        onDeleteClick = () => {}, 
        onLoadClick = () => {}, 
        onRenameSubmit = () => {}, 
        onShareClick = () => {}, 
        onPreviewClick = () => {} 
    } = props;

    if (!entry || !entry.id) {
        console.error("renderHistoryItemComponent: Invalid entry data provided", entry);
        return null; // Or return an error element
    }

    const item = document.createElement('div');
    item.className = 'history-item group relative mb-2';
    item.dataset.id = entry.id; 
    if (entry.isStarred) {
        item.classList.add('starred');
    }

    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleString(); // Consider using Intl.DateTimeFormat for better localization
    const previewText = entry.title || (entry.messages && entry.messages.length > 0 
        ? (entry.messages[0].text || '').substring(0, 50) + '...' 
        : 'Empty chat');

    const starIconSrc = entry.isStarred ? 'icons/StarFilled.png' : 'icons/StarHollow.png';
    const starToggleClass = entry.isStarred ? 'starred' : 'unstarred';

    item.innerHTML = `
        <div class="chat-card bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-3 flex flex-col justify-between min-h-[100px]">
            <div>
                <div class="card-header flex justify-between items-center mb-2">
                    <button data-action="toggle-star" class="action-button history-item-star-toggle ${starToggleClass}" title="Toggle Star">
                         <img src="${starIconSrc}" alt="Star" class="w-4 h-4 action-icon-img ${entry.isStarred ? '' : 'icon-unstarred'}">
                    </button>
                    <div class="actions flex items-center space-x-1">
                        <!-- Normal Actions (initially visible) -->
                        <div class="normal-actions flex items-center space-x-1" data-normal-container>
                             <button data-action="download-chat" class="action-button" title="Download">${downloadIconSvg}</button>
                             <button data-action="share-chat" class="action-button" title="Share">${shareIconSvg}</button>
                             <button data-action="delete-chat" class="action-button text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" title="Delete">${trashIconSvg}</button>
                             <button data-action="preview-chat" class="action-button history-item-preview-btn" title="Preview">${previewIconSvg}</button>
                        </div>
                        <!-- Confirm Delete Actions (initially hidden) -->
                        <div class="confirm-delete-actions hidden flex items-center space-x-1" data-confirm-container>
                            <span class="text-xs text-red-600 dark:text-red-400 mr-1">Confirm?</span>
                            <button data-action="confirm-delete" class="action-button text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300" title="Confirm Delete">
                                <svg class="w-4 h-4 action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> <!-- Checkmark -->
                            </button>
                            <button data-action="cancel-delete" class="action-button text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" title="Cancel Delete">
                                <svg class="w-4 h-4 action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> <!-- X mark -->
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body mb-1">
                    <div class="history-item-preview font-semibold text-sm truncate" title="${previewText}">${previewText}</div>
                    <input type="text" class="history-item-rename-input w-full text-sm p-1 border rounded" value="${previewText}" style="display: none;"/>
                </div>
                <div class="history-item-preview-content hidden mt-2 p-2 border-t border-gray-200 dark:border-gray-600 text-xs max-h-24 overflow-y-auto">
                     <!-- Preview content will be loaded here -->
                </div>
            </div>
            <div class="card-footer mt-auto flex justify-between items-center">
                 <span class="history-item-date text-xs text-gray-500 dark:text-gray-400">${formattedDate}</span>
                 <button class="history-item-load-btn text-xs p-0.5 rounded" data-action="load-chat" title="Load Chat">
                    <img src="icons/Load.png" alt="Load" class="h-6 w-auto">
                 </button>
            </div>
        </div>
    `;

    // --- Add Event Listeners ---

    const previewSpan = item.querySelector('.history-item-preview');
    const renameInput = item.querySelector('.history-item-rename-input');
    
    // Rename UI Listeners
    if (previewSpan && renameInput) {
        previewSpan.addEventListener('dblclick', (e) => {
            e.stopPropagation(); 
            startEditing(item);
        });
        renameInput.addEventListener('blur', () => {
            // Option 1: Cancel on blur (Commented out)
            // cancelEditing(item); 
            
            // Option 2: Submit on blur (Enabled)
            const newTitle = (renameInput as HTMLInputElement).value.trim();
            const originalTitle = previewSpan.textContent;
            if (newTitle && newTitle !== originalTitle) {
                onRenameSubmit(entry.id, newTitle); // Call parent's submit handler
                // Update the preview span immediately for responsiveness
                previewSpan.textContent = newTitle;
                (previewSpan as HTMLElement).title = newTitle;
                cancelEditing(item); // Exit editing mode after successful submission
            } else {
                // If title is empty or unchanged, just cancel
                cancelEditing(item); 
            }
        });
        // Use a wrapper to ensure correct event type for keydown
        renameInput.addEventListener('keydown', function(event) {
            const keyboardEvent = event as KeyboardEvent;
            if (keyboardEvent.key === 'Enter') {
                keyboardEvent.preventDefault();
                const newTitle = (renameInput as HTMLInputElement).value.trim();
                const originalTitle = previewSpan.textContent; 
                if (newTitle && newTitle !== originalTitle) {
                    onRenameSubmit(entry.id, newTitle); // Call parent's submit handler
                } else {
                    // If title is empty or unchanged, just cancel
                    cancelEditing(item);
                }
            } else if (keyboardEvent.key === 'Escape') {
                 keyboardEvent.preventDefault();
                 cancelEditing(item); // Cancel editing on Escape
            }
        });
    }

    // Action Button Listeners
    const starButton = item.querySelector('[data-action="toggle-star"]');
    if (starButton) starButton.addEventListener('click', (e) => { e.stopPropagation(); onStarClick(entry.id); });

    const downloadButton = item.querySelector('[data-action="download-chat"]');
    if (downloadButton) downloadButton.addEventListener('click', (e) => { e.stopPropagation(); onDownloadClick(entry.id); });
    
    const shareButton = item.querySelector('[data-action="share-chat"]');
    if (shareButton) shareButton.addEventListener('click', (e) => { e.stopPropagation(); onShareClick(entry.id); });

    // --- Delete Confirmation Logic ---
    const deleteButton = item.querySelector('[data-action="delete-chat"]'); // Original trash icon button
    const normalActionsContainer = item.querySelector('[data-normal-container]'); 
    const confirmActionsContainer = item.querySelector('[data-confirm-container]');
    const confirmDeleteButton = item.querySelector('[data-action="confirm-delete"]'); // Checkmark button
    const cancelDeleteButton = item.querySelector('[data-action="cancel-delete"]'); // X button

    // Initial Delete Click (Trash Icon)
    if (deleteButton && normalActionsContainer && confirmActionsContainer) {
        deleteButton.addEventListener('click', (e) => { 
            e.stopPropagation(); 

            // Cancel editing if active
            if (item.classList.contains('is-editing')) {
                 cancelEditing(item); 
            }

            // Toggle UI to show confirmation state
            item.classList.add('is-confirming-delete'); // Optional class for styling parent if needed
            normalActionsContainer.classList.add('hidden');
            confirmActionsContainer.classList.remove('hidden');
        });
    }

    // Cancel Delete Click (X Icon)
    if (cancelDeleteButton && normalActionsContainer && confirmActionsContainer) {
        cancelDeleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            // Revert UI to normal state
            item.classList.remove('is-confirming-delete');
            normalActionsContainer.classList.remove('hidden');
            confirmActionsContainer.classList.add('hidden');
        });
    }

    // Confirm Delete Click (Checkmark Icon)
    if (confirmDeleteButton && normalActionsContainer && confirmActionsContainer) {
        confirmDeleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            item.classList.remove('is-confirming-delete');
            // Optionally hide confirm actions immediately? Or let controller handle full item state change.
            // confirmActionsContainer.classList.add('hidden'); 

            // Call the actual delete handler passed from the parent
            onDeleteClick(entry.id, item); // Pass item element (still needed by controller)
        });
    }
    // --- End Delete Confirmation Logic ---
    
    const previewButton = item.querySelector('[data-action="preview-chat"]');
    const previewContentDiv = item.querySelector('.history-item-preview-content'); // Get content div reference

    if (previewButton && previewContentDiv) {
        previewButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const isPreviewVisible = !previewContentDiv.classList.contains('hidden');

            if (isPreviewVisible) {
                // --- Hiding Preview ---
                previewContentDiv.classList.add('hidden');
                previewContentDiv.innerHTML = ''; // Clear content immediately on hide
                item.classList.remove('preview-active');
                previewButton.innerHTML = previewIconSvg; // Restore '...' icon
                console.log(`HistoryItem: Hiding preview for ${entry.id}`);
            } else {
                // --- Showing Preview ---
                // 1. Hide any other open previews (optional, but good UX)
                document.querySelectorAll('.history-item.preview-active').forEach(activeItem => {
                    if (activeItem !== item) { // Don't hide self
                        const otherPreviewDiv = activeItem.querySelector('.history-item-preview-content');
                        const otherPreviewBtn = activeItem.querySelector('[data-action="preview-chat"]');
                        if (otherPreviewDiv) {
                            otherPreviewDiv.classList.add('hidden');
                            otherPreviewDiv.innerHTML = '';
                        }
                        activeItem.classList.remove('preview-active');
                        if (otherPreviewBtn) otherPreviewBtn.innerHTML = previewIconSvg; // Restore icon
                    }
                });

                // 2. Update UI for *this* item (Show loading state is now handled by the controller)
                item.classList.add('preview-active');
                previewButton.innerHTML = '<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>'; // Change icon to 'X'
                previewContentDiv.classList.remove('hidden'); // Make container visible

                // 3. Call the handler (which will fetch data and fill contentDiv)
                console.log(`HistoryItem: Requesting preview for ${entry.id}`);
                onPreviewClick(entry.id, previewContentDiv); // Pass the content div
            }
        });
    }

    const loadButton = item.querySelector('[data-action="load-chat"]');
    if (loadButton) loadButton.addEventListener('click', (e) => { e.stopPropagation(); onLoadClick(entry.id); });

    // Optional: Add listener to card body for loading if desired
    // const cardBody = item.querySelector('.card-body');
    // if (cardBody) cardBody.addEventListener('click', (e) => { e.stopPropagation(); onLoadClick(entry.id); });

    return item;
} 