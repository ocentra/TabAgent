import { eventBus } from './eventBus.js';
import { DbAddLogRequest, DbInitializationCompleteNotification } from './events/dbEvents.js';
import * as EventNames from './events/eventNames.js';

const hasChromeRuntime = typeof chrome !== 'undefined' && chrome.runtime;
let componentName = 'unknown';
let mirrorToConsoleDefault = true;
let sendToDbDefault = true;
let isDbReadyForLogs = false;
const logBuffer = [];

async function flushLogBuffer() {
    if (!eventBus) return;
    while (logBuffer.length > 0) {
        const logEvent = logBuffer.shift();
        if (logEvent) {
            try {
                await eventBus.publish(logEvent.type, logEvent);
            } catch (error) {
                console.error(`LogClient (${componentName}): Error publishing buffered log. Error: ${error}. Event:`, logEvent);
            }
        }
    }
}

function init(compName, options = {}) {
    if (!compName) {
        console.error("LogClient: init() requires a component name.");
        return;
    }
    componentName = compName;
    mirrorToConsoleDefault = options.mirrorToConsole !== undefined ? options.mirrorToConsole : true;
    sendToDbDefault = options.sendToDb !== undefined ? options.sendToDb : true;

    if (eventBus) {
        eventBus.subscribe(EventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION, (notification) => {
            if (notification.payload.success) {
                console.log(`[LogClient (${componentName})] Received DB Initialization Complete. Flushing buffer.`);
                isDbReadyForLogs = true;
                flushLogBuffer();
            } else {
                console.error(`[LogClient (${componentName})] Received DB Initialization FAILED notification. Logs will not be sent to DB. Error:`, notification.payload.error);
            }
        });
    } else {
        console.error(`LogClient (${componentName}): CRITICAL - eventBus not available during init. DB logging disabled.`);
        sendToDbDefault = false;
    }

    let logMode = 'unknown';
    if (typeof eventBus !== 'undefined') {
        logMode = 'sendMessage logging (Standard)';
    } else {
        logMode = 'console fallback';
        console.error(`LogClient (${componentName}): CRITICAL - No logging mechanism available. Falling back to console.`);
    }

    const initialLogMessage = `Log client initialized for component: ${componentName}. (${logMode}, Console Mirror: ${mirrorToConsoleDefault}, SendToDB: ${sendToDbDefault})`;
    _internalLogHelper('info', initialLogMessage, { mirrorToConsole: mirrorToConsoleDefault, sendToDb: sendToDbDefault, skipInitCheck: true });
}

async function _internalLogHelper(level, ...args) {
    const rawOptions = args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.pop() : {};
    const options = rawOptions || {};

    const mirrorThisCall = options.mirrorToConsole !== undefined ? options.mirrorToConsole : mirrorToConsoleDefault;
    let sendThisCall = options.sendToDb !== undefined ? options.sendToDb : sendToDbDefault;
    const skipInitCheck = options.skipInitCheck || false;

    if (sendThisCall && typeof eventBus === 'undefined') {
        console.warn(`LogClient (${componentName}): Attempted DB log but eventBus is unavailable. Disabling DB log for this call.`);
        sendThisCall = false;
    }

    if (!componentName && !skipInitCheck) {
        console.error("LogClient: Attempted to log before init() was called. Message:", level, ...args);
        return;
    }

    if (mirrorThisCall || level.toLowerCase() === 'error') {
        const consolePrefix = componentName ? `[${componentName}]` : `[LogClient]`;
        const consoleArgs = [consolePrefix, ...args];
        switch (level.toLowerCase()) {
            case 'error': console.error(...consoleArgs); break;
            case 'warn': if (mirrorThisCall) console.warn(...consoleArgs); break;
            case 'debug': if (mirrorThisCall) console.debug(...consoleArgs); break;
            case 'info': default: if (mirrorThisCall) console.log(...consoleArgs); break;
        }
    }

    if (!sendThisCall) return;

    const formattedMessage = args.map(arg => {
        try {
            if (arg instanceof Error) {
                return `Error: ${arg.message}${arg.stack ? '\n' + arg.stack : ''}`;
            }
            if (typeof arg === 'object' && arg !== null) {
                return '[Object]';
            }
            return String(arg);
        } catch (e) {
            return `[Unstringifiable Object: ${e.message}]`;
        }
    }).join(' ');

    const logPayload = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        component: componentName,
        level: level.toLowerCase(),
        message: formattedMessage,
    };

    if (hasChromeRuntime && chrome.storage?.local) {
        try {
            const { currentLogSessionId } = await chrome.storage.local.get('currentLogSessionId');
            if (currentLogSessionId) {
                logPayload.extensionSessionId = currentLogSessionId;
            } else {
                console.warn(`LogClient (${componentName}): Could not retrieve currentLogSessionId from storage.`);
                logPayload.extensionSessionId = 'unknown-session';
            }
        } catch (storageError) {
            console.error(`LogClient (${componentName}): Error retrieving session ID from storage:`, storageError);
            logPayload.extensionSessionId = 'storage-error-session';
        }
    } else {
        logPayload.extensionSessionId = 'no-storage-session';
    }

    const logEvent = new DbAddLogRequest(logPayload);

    if (isDbReadyForLogs) {
        try {
            await eventBus.publish(logEvent.type, logEvent);
        } catch (error) {
            console.error(`LogClient (${componentName}): Error during eventBus log submission. Error: ${error}. Original message:`, level, ...args);
        }
    } else {
        logBuffer.push(logEvent);
    }
}

function log(level, ...args) {
    _internalLogHelper(level, ...args);
}

function logDebug(...args) {
    _internalLogHelper('debug', ...args);
}

function logInfo(...args) {
    _internalLogHelper('info', ...args);
}

function logWarn(...args) {
    _internalLogHelper('warn', ...args);
}

function logError(...args) {
    _internalLogHelper('error', ...args);
}

export { init, log, logDebug, logInfo, logWarn, logError };