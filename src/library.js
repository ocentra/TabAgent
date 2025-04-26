import { loadAllChatHistory, getChatSessionById, deleteHistoryItem, toggleItemStarred } from './db.js'; // Use the new function name
import { navigateTo } from './navigation.js'; // To switch back to home on restore
import { loadAndRenderChat } from './home.js'; // Import the new function from home.js
import { setActiveChatSessionId } from './sidepanel.js'; // Import function to set active ID
// Import the shared rendering function and its helpers
import { renderSingleHistoryItem, startEditing, finishEditing } from './sidepanel.js'; 
// --- Import Download functions --- 
import { formatChatToHtml, downloadHtmlFile } from './downloadFormatter.js';
import { showNotification } from './notifications.js'; // <<< Import showNotification

// Helper to render a single starred item
/*
function renderStarredItem(entry) {
    const item = document.createElement('div');
    // Using history-item styles for consistency, but could create specific library-item styles
    item.className = 'history-item starred'; // Add starred class for the icon
    item.dataset.id = entry.id;

    const date = new Date(entry.timestamp);
    const formattedDate = date.toLocaleString();
    const preview = entry.title || (entry.messages && entry.messages.length > 0
        ? (entry.messages[0].text || '').substring(0, 100) + '...'
        : 'Empty chat');

    // Re-use structure from history popup for consistency (without actions menu)
    item.innerHTML = `
        <div class="history-item-header">
            <div class="header-left">
                <span class="star-icon">★</span> 
                <span class="history-item-date">${formattedDate}</span>
            </div>
            </div>
        <div class="history-item-preview" title="${preview}">${preview}</div>
    `;
    
     // Add click listener to restore chat
     item.addEventListener('click', async () => {
        const itemId = entry.id;
        console.log(`Library: Clicked item ${itemId}, attempting restore...`);
        try {
             // 1. Set the active session in sidepanel
             setActiveChatSessionId(itemId);
             // 2. Tell home page to load and render it
             await loadAndRenderChat(itemId); 
             // 3. Navigate to the home page view
             navigateTo('page-home'); 
             console.log(`Library: Restored chat ${itemId} and navigated home.`);
         } catch (error) {
             console.error(`Library: Error restoring chat ${itemId}:`, error);
             setActiveChatSessionId(null); // Reset active ID on error?
             alert('Error restoring chat.');
         }
    });
    return item;
}
*/

export async function initializeLibraryPage() {
    console.log("Library Page Initializing...");
    const starredListElement = document.getElementById('starred-list');
    const librarySearch = document.getElementById('library-search'); // Get search input

    if (!starredListElement) {
        console.error("Library Page: Could not find #starred-list element.");
        return;
    }

    // Initial render function
    const renderLibrary = async (filter = '') => {
        console.log(`Library: Rendering with filter "${filter}"`);
        try {
            // TODO: Implement pagination for library view like in sidepanel history?
            const allHistory = await loadAllChatHistory(); 
            // Filter for starred items first
            let starredHistory = allHistory.filter(entry => entry.isStarred);

            // Apply search filter if present
            if (filter) {
                 const searchTerm = filter.toLowerCase();
                 starredHistory = starredHistory.filter(entry => 
                    (entry.title || '').toLowerCase().includes(searchTerm)
                 );
            }

            starredListElement.innerHTML = ''; // Clear previous items

            if (starredHistory.length === 0) {
                const message = filter 
                    ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items match "${filter}".</p>`
                    : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items yet.</p>';
                starredListElement.innerHTML = message;
                return;
            }

            starredHistory.sort((a, b) => b.timestamp - a.timestamp);

            starredHistory.forEach(entry => {
                // --- USE THE IMPORTED FUNCTION --- 
                const itemElement = renderSingleHistoryItem(entry); 
                // The imported function already sets up rename listeners
                starredListElement.appendChild(itemElement);
            });
            console.log(`Library Page Initialized/Refreshed: Rendered ${starredHistory.length} starred items.`);

        } catch (error) {
            console.error("Library Page: Error loading or rendering starred history:", error);
            starredListElement.innerHTML = '<div class="error-message p-4">Error loading starred items.</div>'; 
        }
    }
    
    const debouncedRenderLibrary = debounce(renderLibrary, 300);

    // Initial render call
    renderLibrary();

    // Setup Search Listener
    if (librarySearch) {
        librarySearch.addEventListener('input', (e) => {
             debouncedRenderLibrary(e.target.value.trim());
        });
    } else {
         console.warn("Library search input not found.");
    }

    // --- Setup Event Delegation for Actions --- 
    starredListElement.addEventListener('click', async (e) => {
        const target = e.target; 
        const actionButton = target.closest('button[data-action], span[data-action]'); // Find closest element with data-action
        const historyItem = target.closest('.history-item');
        
        if (!historyItem || historyItem.classList.contains('is-editing')) return;
        
        const itemId = historyItem.dataset.id;
        if (!itemId) return; 

        const action = actionButton ? actionButton.dataset.action : null;
        
        // --- Handle Specific Actions --- 
        if (action === 'load-chat' || target.classList.contains('action-load-chat')) {
            e.stopPropagation(); 
            console.log(`Library: Load button clicked for ${itemId}`);
            try {
                setActiveChatSessionId(itemId);
                await loadAndRenderChat(itemId); 
                navigateTo('page-home'); 
            } catch (error) { 
                 console.error("Library Load Error:", error);
                 alert("Error loading chat.");
            }
            return; 
        } 
        else if (action === 'toggle-star' || target.classList.contains('history-item-star-toggle')) { 
            e.stopPropagation();
            console.log(`Library: Toggling star for item ${itemId}`);
            try {
                await toggleItemStarred(itemId); 
                // Re-render the library list to remove the item
                await renderLibrary(librarySearch?.value.trim() || ''); 
            } catch (error) {
                 console.error("Library Star Toggle Error:", error);
                 alert("Error updating star status.");
            }
            return;
        }
        else if (action === 'delete-chat') {
            e.stopPropagation();
            console.log(`Library: Delete action clicked for ${itemId}`);
            if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
                try {
                    await deleteHistoryItem(itemId); 
                    // Re-render the library list after delete
                    await renderLibrary(librarySearch?.value.trim() || ''); 
                } catch (error) {
                    console.error(`Library: Error deleting item ${itemId}:`, error);
                    alert('Error deleting item');
                }
            }
            return;
        }
        else if (action === 'share-chat') {
            e.stopPropagation();
            console.log(`Library: Share action clicked for ${itemId}`);
            alert('Share functionality coming soon!'); 
            return;
        }
        else if (action === 'download-chat') {
            e.stopPropagation();
            console.log(`Library: Download action clicked for ${itemId}`);
            try {
                target.textContent = '...'; 
                target.disabled = true;
                const sessionData = await getChatSessionById(itemId);
                if (!sessionData) throw new Error("Chat session not found.");
                const htmlContent = formatChatToHtml(sessionData);
                const filename = `${sessionData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}_${itemId.substring(0, 5)}.html`;
                downloadHtmlFile(htmlContent, filename); 
            } catch (error) {
                console.error(`Error preparing download for ${itemId}:`, error);
                showNotification(`Failed to prepare download: ${error.message}`, 'error'); // <<< Use showNotification
                target.textContent = '↓'; 
                target.disabled = false;
            }
            return;
        }
        else if (target.classList.contains('history-item-actions-btn')) { // Handle the "..." button for preview
             e.stopPropagation(); 
             console.log(`Library: Preview action clicked for ${itemId}`);
             try {
                const session = await getChatSessionById(itemId);
                if (!session || !session.messages) { alert("Could not load chat data for preview."); return; }
                const previewMessages = session.messages.slice(0, 5).map(m => 
                     `${m.sender === 'user' ? 'You' : 'Agent'}: ${m.text.substring(0, 100)}${m.text.length > 100 ? '...': ''}`
                 ).join('\n');
                 alert(`Preview of "${session.title}":\n--------------------\n${previewMessages}`);
             } catch (error) {
                 console.error("Library Preview error:", error);
                 alert("Error loading preview.");
             }
             return;
        }
    });
    // --- End Event Delegation --- 
    
    console.log("Library Page Initialization Complete.");
}

// Utility Debounce (needed if not imported globally or shared)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}; 