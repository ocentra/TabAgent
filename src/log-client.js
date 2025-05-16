// --- GLOBAL SWITCHES ---
let LOG_TO_CONSOLE = true; // Default: log to console
let LOG_TO_DB = true;      // Default: log to DB

// --- Per-class settings ---
let componentName = 'unknown';
let mirrorToConsoleDefault = true; // Default: class logs to console
let sendToDbDefault = true;        // Default: class logs to DB
let logChannel = null;
let loggerContext = 'unknown'; // 'sidepanel', 'background', etc.

// --- Throttled Logging Helper ---
const logClientThrottleCache = {};
const logClientLastContext = {};
function throttledConsoleLog(level, staticMsg, contextKey = null) {
    const now = Date.now();
    if (!logClientThrottleCache[level]) logClientThrottleCache[level] = {};
    if (contextKey !== null) {
        if (logClientLastContext[staticMsg] === contextKey) return; // skip if same context
        logClientLastContext[staticMsg] = contextKey;
    }
    if (!logClientThrottleCache[level][staticMsg] || now - logClientThrottleCache[level][staticMsg] > 2000) {
        logClientThrottleCache[level][staticMsg] = now;
        switch (level) {
            case 'error': console.error(staticMsg, contextKey !== null ? contextKey : ''); break;
            case 'warn': console.warn(staticMsg, contextKey !== null ? contextKey : ''); break;
            case 'debug': console.debug(staticMsg, contextKey !== null ? contextKey : ''); break;
            case 'info':
            default: console.log(staticMsg, contextKey !== null ? contextKey : ''); break;
        }
    }
}

function setGlobalLogging({ console: consoleOn, db: dbOn }) {
    if (typeof consoleOn === 'boolean') LOG_TO_CONSOLE = consoleOn;
    if (typeof dbOn === 'boolean') LOG_TO_DB = dbOn;
    if (LOG_TO_DB && typeof BroadcastChannel !== 'undefined' && !logChannel) {
        logChannel = new BroadcastChannel('tabagent-logs');
    }
}

/**
 * Initialize the logger for a component/context.
 * Usage:
 *   logger.init('sidepanel') // uses 'sidepanel' for both name and context
 *   logger.init('background')
 *   logger.init('MyClass', { context: 'sidepanel', mirrorToConsole: false })
 *   logger.init({ name: 'MyClass', context: 'sidepanel', mirrorToConsole: false })
 */
function init(nameOrOptions, options = {}) {
    let compName, ctx, opts;
    if (typeof nameOrOptions === 'string') {
        compName = nameOrOptions;
        ctx = nameOrOptions;
        opts = options;
    } else if (typeof nameOrOptions === 'object') {
        compName = nameOrOptions.name || 'unknown';
        ctx = nameOrOptions.context || 'unknown';
        opts = nameOrOptions;
    }
    componentName = compName;
    loggerContext = ctx;
    mirrorToConsoleDefault = opts.mirrorToConsole !== undefined ? opts.mirrorToConsole : true;
    sendToDbDefault = opts.sendToDb !== undefined ? opts.sendToDb : true;
    if (LOG_TO_DB && typeof BroadcastChannel !== 'undefined' && !logChannel) {
        logChannel = new BroadcastChannel('tabagent-logs');
    }
    let logMode = 'console only';
    if (mirrorToConsoleDefault && sendToDbDefault) logMode = 'console + db';
    else if (sendToDbDefault) logMode = 'db only';
    const initialLogMessage = `Log client initialized for component: ${componentName}. (${logMode}, context: ${loggerContext})`;
    _internalLogHelper('info', initialLogMessage, { mirrorToConsole: mirrorToConsoleDefault, sendToDb: sendToDbDefault, skipInitCheck: true });
}

async function _internalLogHelper(level, ...args) {
    const rawOptions = args.length > 0 && typeof args[args.length - 1] === 'object' && !Array.isArray(args[args.length - 1]) ? args.pop() : {};
    const options = rawOptions || {};

    // --- GLOBAL OVERRIDES ---
    const mirrorThisCall = LOG_TO_CONSOLE && (options.mirrorToConsole !== undefined ? options.mirrorToConsole : mirrorToConsoleDefault);
    const sendThisCall = LOG_TO_DB && (options.sendToDb !== undefined ? options.sendToDb : sendToDbDefault);
    const skipInitCheck = options.skipInitCheck || false;

    if (!componentName && !skipInitCheck) {
        throttledConsoleLog('error', "LogClient: Attempted to log before init() was called. Message:", level, ...args);
        return;
    }

    if (mirrorThisCall || level.toLowerCase() === 'error') {
        const consolePrefix = componentName ? `[${componentName}]` : `[LogClient]`;
        const consoleArgs = [consolePrefix, ...args];
        throttledConsoleLog(level.toLowerCase(), ...consoleArgs);
    }

    if (sendThisCall) {
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
            id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2),
            timestamp: Date.now(),
            component: componentName,
            level: level.toLowerCase(),
            message: formattedMessage,
            context: loggerContext // Always include context in the payload
        };
        // Always broadcast to sidepanel; sidepanel will write to DB
        if (typeof BroadcastChannel !== 'undefined') {
            if (!logChannel) logChannel = new BroadcastChannel('tabagent-logs');
            logChannel.postMessage({ type: 'LOG_TO_DB', payload: logPayload });
        } else if (typeof browser !== 'undefined' && browser.runtime) {
            browser.runtime.sendMessage({ type: 'LOG_TO_DB', payload: logPayload });
        }
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

export { init, setGlobalLogging, log, logDebug, logInfo, logWarn, logError };
// ---
// Usage:
// - logger.init('sidepanel') // uses 'sidepanel' for both name and context
// - logger.init('MyClass', { context: 'sidepanel', mirrorToConsole: false })
// - logger.init({ name: 'MyClass', context: 'sidepanel', mirrorToConsole: false })
// - To turn off all console logs globally: setGlobalLogging({ console: false })
// - To turn off all DB logs globally: setGlobalLogging({ db: false })
// ---