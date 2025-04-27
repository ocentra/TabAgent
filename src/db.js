import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';

// Database instance and collection references
let db = null;
let chatHistoryCollection = null;

// Promise to track initialization completion
let dbReadyResolve;
const dbReadyPromise = new Promise(resolve => { dbReadyResolve = resolve; });

// Schema definition
const chatHistorySchema = {
    title: 'chat history schema',
    version: 2,
    description: 'Stores chat sessions',
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: { type: 'string', maxLength: 100 },
        tabId: { type: 'number' },
        timestamp: { type: 'number' },
        title: { type: 'string' },
        messages: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    messageId: { type: 'string', maxLength: 100 },
                    sender: { type: 'string' },
                    text: { type: 'string' },
                    timestamp: { type: 'number' },
                    isLoading: { type: 'boolean', default: false }
                },
                required: ['messageId', 'sender', 'text', 'timestamp']
            }
        },
        isStarred: {
            type: 'boolean',
            default: false
        }
    },
    required: ['id', 'timestamp', 'messages'],
    indexes: ['timestamp']
};

// Migration strategy from version 1 to 2
const migrationStrategies = {
    1: function (oldDoc) {
        oldDoc.isStarred = oldDoc.isStarred || false;
        return oldDoc;
    },
    2: function (oldDoc) {
        oldDoc.messages = oldDoc.messages.map((msg, index) => ({
            ...msg,
            messageId: `${oldDoc.id}-msg-${index}-${Date.now()}`,
            timestamp: oldDoc.timestamp || Date.now(),
            isLoading: false
        }));
        oldDoc.timestamp = oldDoc.timestamp || Date.now();
        return oldDoc;
    }
};

// Initialize RxDB Function
const initializeDb = async () => {
    console.log("DB: Starting RxDB initialization...");
    try {
        // Add necessary plugins FIRST
        addRxPlugin(RxDBQueryBuilderPlugin);
        console.log("DB: RxDBQueryBuilderPlugin added.");
        addRxPlugin(RxDBMigrationSchemaPlugin);
        console.log("DB: RxDBMigrationSchemaPlugin added.");
        addRxPlugin(RxDBUpdatePlugin);
        console.log("DB: RxDBUpdatePlugin added.");

        let storage = getRxStorageDexie(); // Use standard Dexie storage

        // Add dev-mode plugin conditionally (currently disabled in main script)
        // We might re-enable this later if needed, potentially just for Node.js testing
        // if (import.meta.env && import.meta.env.MODE === 'development') {
        //     console.log("DB: DEV MODE DETECTED (but DevMode plugin likely disabled in main script)");
        // }

        console.log("DB: Creating RxDB database (tabagentdb)...");
        db = await createRxDatabase({
            name: 'tabagentdb',
            storage: storage
        });
        console.log('DB: RxDB database created successfully:', db.name);

        console.log("DB: Adding chatHistory collection (version 2)...");
        const collections = await db.addCollections({
            chatHistory: {
                schema: chatHistorySchema,
                migrationStrategies: migrationStrategies
            }
        });
        console.log("DB: Collections object obtained.");

        chatHistoryCollection = collections.chatHistory;
        
        if (!chatHistoryCollection) {
            throw new Error('DB: chatHistory collection is null or undefined after addCollections');
        }
        console.log('DB: chatHistory collection assigned successfully');

        dbReadyResolve(true); // Resolve the promise indicating DB is ready
        console.log("DB: RxDB initialization finished successfully.");
        return true;

    } catch (err) {
        console.error('-------------------------------------------');
        console.error('DB: HIGH-LEVEL RxDB INITIALIZATION FAILED:', err);
        // ... (keep enhanced error logging from sidepanel.js) ...
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        if (err.code) { console.error('RxDB Error Code:', err.code); }
        if (err.parameters) { console.error('RxDB Error Parameters:', err.parameters); }
        if (err.rxdb) { console.error('RxDB Specific Flag:', err.rxdb); }
        console.error('Stack Trace:', err.stack);
        console.error('-------------------------------------------');
        dbReadyResolve(false); 
        return false;
    }
};

// --- Data Access Functions --- 

// Function to generate unique message IDs (simple example)
function generateMessageId(chatId) {
    return `${chatId}-msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

// Function to create a new chat session
async function createChatSession(initialMessage) {
    console.log("DB: Creating new chat session...");
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not ready');
        }

        const sessionId = `chat_${Date.now()}`;
        const timestamp = Date.now();
        const firstMessage = {
            ...initialMessage,
            messageId: generateMessageId(sessionId),
            timestamp: timestamp
        };

        const chatEntry = {
            id: sessionId,
            tabId: null,
            timestamp: timestamp,
            title: (firstMessage.text || 'New Chat').substring(0, 40) + '...',
            messages: [firstMessage],
            isStarred: false
        };

        console.log("DB: Inserting new chat session:", chatEntry);
        await chatHistoryCollection.insert(chatEntry);
        console.log('DB: New chat session created successfully with ID:', sessionId);
        return sessionId;

    } catch (error) {
        console.error('DB: Error creating new chat session:', error);
        throw error;
    }
}

// Function to add a message to an existing chat session
async function addMessageToChat(chatId, messageObject) {
    console.log(`DB: Adding message to chat ID: ${chatId}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not ready');
        }
        if (!chatId || !messageObject) {
            throw new Error('Invalid input: chatId and messageObject are required.');
        }

        const chatDoc = await chatHistoryCollection.findOne(chatId).exec();
        if (!chatDoc) {
            throw new Error(`Chat session with ID ${chatId} not found`);
        }

        const newMessage = {
            ...messageObject,
            messageId: messageObject.messageId || generateMessageId(chatId),
            timestamp: messageObject.timestamp || Date.now(),
            isLoading: messageObject.isLoading === undefined ? false : messageObject.isLoading
        };

        await chatDoc.update({
            $push: {
                messages: newMessage
            }
        });

        console.log(`DB: Message added successfully to chat ${chatId}. New message ID: ${newMessage.messageId}`);
        return newMessage.messageId;

    } catch (error) {
        console.error(`DB: Error adding message to chat ${chatId}:`, error);
        throw error;
    }
}

// Function to update a specific message within a chat session
async function updateMessageInChat(chatId, messageId, updates) {
    console.log(`DB: Updating message ID: ${messageId} in chat ID: ${chatId}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not ready');
        }
        if (!chatId || !messageId || !updates) {
            throw new Error('Invalid input: chatId, messageId, and updates are required.');
        }

        const chatDoc = await chatHistoryCollection.findOne(chatId).exec();
        if (!chatDoc) {
            throw new Error(`Chat session with ID ${chatId} not found`);
        }

        await chatDoc.incrementalModify((docData) => {
            const messageIndex = docData.messages.findIndex(m => m.messageId === messageId);
            if (messageIndex !== -1) {
                const currentMessage = docData.messages[messageIndex];
                docData.messages[messageIndex] = { ...currentMessage, ...updates, messageId: currentMessage.messageId };
                docData.timestamp = Date.now();
                console.log(`DB: Message ${messageId} updated in session ${chatId}.`);
            } else {
                console.warn(`DB: Message with ID ${messageId} not found in chat ${chatId} for update.`);
            }
            return docData;
        });

    } catch (error) {
        console.error(`DB: Error updating message ${messageId} in chat ${chatId}:`, error);
        throw error;
    }
}

// Function to load chat history
async function loadAllChatHistory() {
    console.log("DB: Loading all history from DB...");
    try {
        const isReady = await dbReadyPromise; // Wait for DB initialization
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Chat history database is not initialized');
        }
        
        // Restore original query with sort
        const entries = await chatHistoryCollection.find()
            .sort({ timestamp: 'desc' })
            .exec();
            
        console.log(`DB: Loaded ${entries.length} history entries.`);
        // Restore mapping to plain objects
        return entries.map(doc => doc.toJSON()); 
    } catch (error) {
        console.error('DB: Error loading chat history:', error);
        throw error; // Re-throw error
    }
}

// --- New Data Access Functions --- 

// Function to get a single chat session by ID
async function getChatSessionById(sessionId) {
    console.log(`DB: Getting chat session by ID: ${sessionId}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not initialized');
        }
        const entryDoc = await chatHistoryCollection.findOne(sessionId).exec();
        if (!entryDoc) {
            console.warn(`DB: Chat session with ID ${sessionId} not found.`);
            return null;
        }
        return entryDoc.toJSON(); // Return plain object
    } catch (error) {
        console.error(`DB: Error getting chat session ${sessionId}:`, error);
        throw error;
    }
}

// Function to toggle the starred status of a history item
async function toggleItemStarred(itemId) {
    console.log(`DB: Toggling starred status for item ID: ${itemId}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not initialized');
        }
        const entryDoc = await chatHistoryCollection.findOne(itemId).exec();
        if (!entryDoc) {
            throw new Error(`History item with ID ${itemId} not found`);
        }
        
        const currentStarredStatus = entryDoc.get('isStarred') || false;
        const updatedDoc = await entryDoc.patch({ isStarred: !currentStarredStatus });
        
        console.log(`DB: Starred status for ${itemId} toggled to ${!currentStarredStatus}`);
        return updatedDoc.toJSON(); // Return the updated plain object

    } catch (error) {
        console.error(`DB: Error toggling starred status for item ${itemId}:`, error);
        throw error;
    }
}

// Function to delete a history item
async function deleteHistoryItem(itemId) {
    console.log(`DB: Deleting history item with ID: ${itemId}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not initialized');
        }
        const entryDoc = await chatHistoryCollection.findOne(itemId).exec();
        if (!entryDoc) {
            console.warn(`DB: History item with ID ${itemId} not found for deletion.`);
            return; // Or throw error? For now, just log and return.
        }

        await entryDoc.remove();
        console.log(`DB: History item ${itemId} deleted successfully.`);

    } catch (error) {
        console.error(`DB: Error deleting history item ${itemId}:`, error);
        throw error;
    }
}

// Function to rename a history item
async function renameHistoryItem(itemId, newTitle) {
    console.log(`DB: Renaming history item ID: ${itemId} to "${newTitle}"`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Database not initialized');
        }
        const entryDoc = await chatHistoryCollection.findOne(itemId).exec();
        if (!entryDoc) {
            throw new Error(`History item with ID ${itemId} not found for rename.`);
        }

        // Use patch to update the title
        await entryDoc.patch({ title: newTitle });
        
        console.log(`DB: Item ${itemId} renamed successfully.`);
        // No need to return the doc unless the caller needs it

    } catch (error) {
        console.error(`DB: Error renaming history item ${itemId}:`, error);
        throw error;
    }
}

// Function to load chat history paginated
async function loadChatHistoryPaginated(limit, skip) {
    console.log(`DB: Loading history from DB with limit: ${limit}, skip: ${skip}`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Chat history database is not initialized');
        }

        const entries = await chatHistoryCollection.find()
            .sort({ timestamp: 'desc' })
            .skip(skip)   // Skip the specified number of documents
            .limit(limit)  // Limit the results to the page size
            .exec();

        console.log(`DB: Loaded ${entries.length} history entries (page).`);
        return entries.map(doc => doc.toJSON());
    } catch (error) {
        console.error('DB: Error loading paginated chat history:', error);
        throw error;
    }
}

// Optional but helpful: Function to get total count
async function getChatHistoryCount() {
    console.log("DB: Getting total history count...");
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Chat history database is not initialized');
        }
        // Get all documents and count the length of the array
        const allDocs = await chatHistoryCollection.find().exec(); 
        const count = allDocs.length; 
        console.log(`DB: Total history count is ${count}.`);
        return count;
    } catch (error) {
        console.error('DB: Error getting chat history count:', error);
        throw error; // Re-throw error
    }
}

// Function to search chat history titles (basic implementation)
async function searchChatHistory(searchTerm) {
    console.log(`DB: Searching history for term: "${searchTerm}"`);
    try {
        const isReady = await dbReadyPromise;
        if (!isReady || !chatHistoryCollection) {
            throw new Error('Chat history database is not initialized');
        }

        if (!searchTerm) {
            return loadAllChatHistory(); // Return all if search term is empty
        }

        const lowerCaseTerm = searchTerm.toLowerCase();

        // Find documents where the title (case-insensitive) contains the search term
        const entries = await chatHistoryCollection
            .find({
                selector: {
                    title: {
                        $regex: new RegExp(lowerCaseTerm, 'i') // Case-insensitive regex search
                    }
                }
            })
            .sort({ timestamp: 'desc' })
            .exec();

        console.log(`DB: Found ${entries.length} history entries matching "${searchTerm}".`);
        return entries.map(doc => doc.toJSON());
    } catch (error) {
        console.error(`DB: Error searching chat history for "${searchTerm}":`, error);
        throw error;
    }
}

// --- Export Functions and Initialization Trigger --- 

// Call initializeDb immediately when this module is loaded
const dbInitializationPromise = initializeDb();

/**
 * Deletes a specific message from a chat session.
 * @param {string} sessionId - The ID of the chat session.
 * @param {string} messageId - The ID of the message to delete.
 * @returns {Promise<boolean>} - True if deleted, false otherwise.
 */
export const deleteMessageFromChat = async (sessionId, messageId) => {
    await dbInitializationPromise;
    if (!db || !sessionId || !messageId) {
        console.error("deleteMessageFromChat: Missing sessionId or messageId");
        return false;
    }

    console.log(`DB: Attempting to delete message ID: ${messageId} from chat ID: ${sessionId}`);
    try {
        const sessionDoc = await db.chatHistory.findOne(sessionId).exec();
        if (!sessionDoc) {
            console.warn(`DB: Cannot delete message, session ${sessionId} not found.`);
            return false;
        }

        const messageIndex = sessionDoc.messages.findIndex(msg => msg.messageId === messageId);

        if (messageIndex === -1) {
            console.warn(`DB: Cannot delete message, message ID ${messageId} not found in session ${sessionId}.`);
            return false;
        }

        // Create a new array without the message to delete
        const updatedMessages = [
            ...sessionDoc.messages.slice(0, messageIndex),
            ...sessionDoc.messages.slice(messageIndex + 1)
        ];

        // Update the document
        await sessionDoc.incrementalModify((data) => {
            data.messages = updatedMessages;
            // Also update the timestamp if needed, though maybe not essential for deletion
            // data.timestamp = Date.now(); 
            return data;
        });

        console.log(`DB: Message ${messageId} deleted successfully from session ${sessionId}.`);
        return true;
    } catch (error) {
        console.error(`DB: Error deleting message ${messageId} from session ${sessionId}:`, error);
        throw error; // Re-throw the error for the caller to handle
    }
};

export {
    dbInitializationPromise, // Export the promise for waiting
    loadAllChatHistory,
    loadChatHistoryPaginated,
    getChatHistoryCount,
    getChatSessionById,
    toggleItemStarred,
    deleteHistoryItem,
    renameHistoryItem,
    createChatSession,
    addMessageToChat,
    updateMessageInChat,
    generateMessageId,
    searchChatHistory
}; 