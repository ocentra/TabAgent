var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var browserPolyfill$1 = { exports: {} };
var browserPolyfill = browserPolyfill$1.exports;
var hasRequiredBrowserPolyfill;
function requireBrowserPolyfill() {
  if (hasRequiredBrowserPolyfill) return browserPolyfill$1.exports;
  hasRequiredBrowserPolyfill = 1;
  (function(module, exports) {
    (function(global2, factory) {
      {
        factory(module);
      }
    })(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : browserPolyfill, function(module2) {
      if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
        throw new Error("This script should only be loaded in a browser extension.");
      }
      if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
        const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";
        const wrapAPIs = (extensionAPIs) => {
          const apiMetadata = {
            "alarms": {
              "clear": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "clearAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "get": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "bookmarks": {
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getChildren": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getRecent": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getSubTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTree": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeTree": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "browserAction": {
              "disable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "enable": {
                "minArgs": 0,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "getBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getBadgeText": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "openPopup": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setBadgeBackgroundColor": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setBadgeText": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "browsingData": {
              "remove": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "removeCache": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCookies": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeDownloads": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFormData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeHistory": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeLocalStorage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePasswords": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removePluginData": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "settings": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "commands": {
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "contextMenus": {
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "cookies": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAllCookieStores": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "set": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "devtools": {
              "inspectedWindow": {
                "eval": {
                  "minArgs": 1,
                  "maxArgs": 2,
                  "singleCallbackArg": false
                }
              },
              "panels": {
                "create": {
                  "minArgs": 3,
                  "maxArgs": 3,
                  "singleCallbackArg": true
                },
                "elements": {
                  "createSidebarPane": {
                    "minArgs": 1,
                    "maxArgs": 1
                  }
                }
              }
            },
            "downloads": {
              "cancel": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "download": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "erase": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFileIcon": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "open": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "pause": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeFile": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "resume": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "extension": {
              "isAllowedFileSchemeAccess": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "isAllowedIncognitoAccess": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "history": {
              "addUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "deleteRange": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "deleteUrl": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getVisits": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "search": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "i18n": {
              "detectLanguage": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAcceptLanguages": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "identity": {
              "launchWebAuthFlow": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "idle": {
              "queryState": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "management": {
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getSelf": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "setEnabled": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "uninstallSelf": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "notifications": {
              "clear": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPermissionLevel": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            },
            "pageAction": {
              "getPopup": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getTitle": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "hide": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setIcon": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "setPopup": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "setTitle": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              },
              "show": {
                "minArgs": 1,
                "maxArgs": 1,
                "fallbackToNoCallback": true
              }
            },
            "permissions": {
              "contains": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "request": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "runtime": {
              "getBackgroundPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getPlatformInfo": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "openOptionsPage": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "requestUpdateCheck": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "sendMessage": {
                "minArgs": 1,
                "maxArgs": 3
              },
              "sendNativeMessage": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "setUninstallURL": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "sessions": {
              "getDevices": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getRecentlyClosed": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "restore": {
                "minArgs": 0,
                "maxArgs": 1
              }
            },
            "storage": {
              "local": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              },
              "managed": {
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                }
              },
              "sync": {
                "clear": {
                  "minArgs": 0,
                  "maxArgs": 0
                },
                "get": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "getBytesInUse": {
                  "minArgs": 0,
                  "maxArgs": 1
                },
                "remove": {
                  "minArgs": 1,
                  "maxArgs": 1
                },
                "set": {
                  "minArgs": 1,
                  "maxArgs": 1
                }
              }
            },
            "tabs": {
              "captureVisibleTab": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "create": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "detectLanguage": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "discard": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "duplicate": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "executeScript": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 0
              },
              "getZoom": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getZoomSettings": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goBack": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "goForward": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "highlight": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "insertCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "move": {
                "minArgs": 2,
                "maxArgs": 2
              },
              "query": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "reload": {
                "minArgs": 0,
                "maxArgs": 2
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "removeCSS": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "sendMessage": {
                "minArgs": 2,
                "maxArgs": 3
              },
              "setZoom": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "setZoomSettings": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "update": {
                "minArgs": 1,
                "maxArgs": 2
              }
            },
            "topSites": {
              "get": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "webNavigation": {
              "getAllFrames": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "getFrame": {
                "minArgs": 1,
                "maxArgs": 1
              }
            },
            "webRequest": {
              "handlerBehaviorChanged": {
                "minArgs": 0,
                "maxArgs": 0
              }
            },
            "windows": {
              "create": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "get": {
                "minArgs": 1,
                "maxArgs": 2
              },
              "getAll": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getCurrent": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "getLastFocused": {
                "minArgs": 0,
                "maxArgs": 1
              },
              "remove": {
                "minArgs": 1,
                "maxArgs": 1
              },
              "update": {
                "minArgs": 2,
                "maxArgs": 2
              }
            }
          };
          if (Object.keys(apiMetadata).length === 0) {
            throw new Error("api-metadata.json has not been included in browser-polyfill");
          }
          class DefaultWeakMap extends WeakMap {
            constructor(createItem, items = void 0) {
              super(items);
              this.createItem = createItem;
            }
            get(key) {
              if (!this.has(key)) {
                this.set(key, this.createItem(key));
              }
              return super.get(key);
            }
          }
          const isThenable = (value) => {
            return value && typeof value === "object" && typeof value.then === "function";
          };
          const makeCallback = (promise, metadata) => {
            return (...callbackArgs) => {
              if (extensionAPIs.runtime.lastError) {
                promise.reject(new Error(extensionAPIs.runtime.lastError.message));
              } else if (metadata.singleCallbackArg || callbackArgs.length <= 1 && metadata.singleCallbackArg !== false) {
                promise.resolve(callbackArgs[0]);
              } else {
                promise.resolve(callbackArgs);
              }
            };
          };
          const pluralizeArguments = (numArgs) => numArgs == 1 ? "argument" : "arguments";
          const wrapAsyncFunction = (name, metadata) => {
            return function asyncFunctionWrapper(target, ...args) {
              if (args.length < metadata.minArgs) {
                throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
              }
              if (args.length > metadata.maxArgs) {
                throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
              }
              return new Promise((resolve, reject) => {
                if (metadata.fallbackToNoCallback) {
                  try {
                    target[name](...args, makeCallback({
                      resolve,
                      reject
                    }, metadata));
                  } catch (cbError) {
                    console.warn(`${name} API method doesn't seem to support the callback parameter, falling back to call it without a callback: `, cbError);
                    target[name](...args);
                    metadata.fallbackToNoCallback = false;
                    metadata.noCallback = true;
                    resolve();
                  }
                } else if (metadata.noCallback) {
                  target[name](...args);
                  resolve();
                } else {
                  target[name](...args, makeCallback({
                    resolve,
                    reject
                  }, metadata));
                }
              });
            };
          };
          const wrapMethod = (target, method, wrapper) => {
            return new Proxy(method, {
              apply(targetMethod, thisObj, args) {
                return wrapper.call(thisObj, target, ...args);
              }
            });
          };
          let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);
          const wrapObject = (target, wrappers = {}, metadata = {}) => {
            let cache = /* @__PURE__ */ Object.create(null);
            let handlers = {
              has(proxyTarget2, prop) {
                return prop in target || prop in cache;
              },
              get(proxyTarget2, prop, receiver) {
                if (prop in cache) {
                  return cache[prop];
                }
                if (!(prop in target)) {
                  return void 0;
                }
                let value = target[prop];
                if (typeof value === "function") {
                  if (typeof wrappers[prop] === "function") {
                    value = wrapMethod(target, target[prop], wrappers[prop]);
                  } else if (hasOwnProperty(metadata, prop)) {
                    let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                    value = wrapMethod(target, target[prop], wrapper);
                  } else {
                    value = value.bind(target);
                  }
                } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
                  value = wrapObject(value, wrappers[prop], metadata[prop]);
                } else if (hasOwnProperty(metadata, "*")) {
                  value = wrapObject(value, wrappers[prop], metadata["*"]);
                } else {
                  Object.defineProperty(cache, prop, {
                    configurable: true,
                    enumerable: true,
                    get() {
                      return target[prop];
                    },
                    set(value2) {
                      target[prop] = value2;
                    }
                  });
                  return value;
                }
                cache[prop] = value;
                return value;
              },
              set(proxyTarget2, prop, value, receiver) {
                if (prop in cache) {
                  cache[prop] = value;
                } else {
                  target[prop] = value;
                }
                return true;
              },
              defineProperty(proxyTarget2, prop, desc) {
                return Reflect.defineProperty(cache, prop, desc);
              },
              deleteProperty(proxyTarget2, prop) {
                return Reflect.deleteProperty(cache, prop);
              }
            };
            let proxyTarget = Object.create(target);
            return new Proxy(proxyTarget, handlers);
          };
          const wrapEvent = (wrapperMap) => ({
            addListener(target, listener, ...args) {
              target.addListener(wrapperMap.get(listener), ...args);
            },
            hasListener(target, listener) {
              return target.hasListener(wrapperMap.get(listener));
            },
            removeListener(target, listener) {
              target.removeListener(wrapperMap.get(listener));
            }
          });
          const onRequestFinishedWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onRequestFinished(req) {
              const wrappedReq = wrapObject(req, {}, {
                getContent: {
                  minArgs: 0,
                  maxArgs: 0
                }
              });
              listener(wrappedReq);
            };
          });
          const onMessageWrappers = new DefaultWeakMap((listener) => {
            if (typeof listener !== "function") {
              return listener;
            }
            return function onMessage(message, sender, sendResponse) {
              let didCallSendResponse = false;
              let wrappedSendResponse;
              let sendResponsePromise = new Promise((resolve) => {
                wrappedSendResponse = function(response) {
                  didCallSendResponse = true;
                  resolve(response);
                };
              });
              let result;
              try {
                result = listener(message, sender, wrappedSendResponse);
              } catch (err) {
                result = Promise.reject(err);
              }
              const isResultThenable = result !== true && isThenable(result);
              if (result !== true && !isResultThenable && !didCallSendResponse) {
                return false;
              }
              const sendPromisedResult = (promise) => {
                promise.then((msg) => {
                  sendResponse(msg);
                }, (error) => {
                  let message2;
                  if (error && (error instanceof Error || typeof error.message === "string")) {
                    message2 = error.message;
                  } else {
                    message2 = "An unexpected error occurred";
                  }
                  sendResponse({
                    __mozWebExtensionPolyfillReject__: true,
                    message: message2
                  });
                }).catch((err) => {
                  console.error("Failed to send onMessage rejected reply", err);
                });
              };
              if (isResultThenable) {
                sendPromisedResult(result);
              } else {
                sendPromisedResult(sendResponsePromise);
              }
              return true;
            };
          });
          const wrappedSendMessageCallback = ({
            reject,
            resolve
          }, reply) => {
            if (extensionAPIs.runtime.lastError) {
              if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
                resolve();
              } else {
                reject(new Error(extensionAPIs.runtime.lastError.message));
              }
            } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
              reject(new Error(reply.message));
            } else {
              resolve(reply);
            }
          };
          const wrappedSendMessage = (name, metadata, apiNamespaceObj, ...args) => {
            if (args.length < metadata.minArgs) {
              throw new Error(`Expected at least ${metadata.minArgs} ${pluralizeArguments(metadata.minArgs)} for ${name}(), got ${args.length}`);
            }
            if (args.length > metadata.maxArgs) {
              throw new Error(`Expected at most ${metadata.maxArgs} ${pluralizeArguments(metadata.maxArgs)} for ${name}(), got ${args.length}`);
            }
            return new Promise((resolve, reject) => {
              const wrappedCb = wrappedSendMessageCallback.bind(null, {
                resolve,
                reject
              });
              args.push(wrappedCb);
              apiNamespaceObj.sendMessage(...args);
            });
          };
          const staticWrappers = {
            devtools: {
              network: {
                onRequestFinished: wrapEvent(onRequestFinishedWrappers)
              }
            },
            runtime: {
              onMessage: wrapEvent(onMessageWrappers),
              onMessageExternal: wrapEvent(onMessageWrappers),
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 1,
                maxArgs: 3
              })
            },
            tabs: {
              sendMessage: wrappedSendMessage.bind(null, "sendMessage", {
                minArgs: 2,
                maxArgs: 3
              })
            }
          };
          const settingMetadata = {
            clear: {
              minArgs: 1,
              maxArgs: 1
            },
            get: {
              minArgs: 1,
              maxArgs: 1
            },
            set: {
              minArgs: 1,
              maxArgs: 1
            }
          };
          apiMetadata.privacy = {
            network: {
              "*": settingMetadata
            },
            services: {
              "*": settingMetadata
            },
            websites: {
              "*": settingMetadata
            }
          };
          return wrapObject(extensionAPIs, staticWrappers, apiMetadata);
        };
        module2.exports = wrapAPIs(chrome);
      } else {
        module2.exports = globalThis.browser;
      }
    });
  })(browserPolyfill$1);
  return browserPolyfill$1.exports;
}
var browserPolyfillExports = requireBrowserPolyfill();
const browser = /* @__PURE__ */ getDefaultExportFromCjs(browserPolyfillExports);
class EventBus {
  constructor() {
    this.listeners = /* @__PURE__ */ new Map();
  }
  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push(callback);
  }
  unsubscribe(eventName, callback) {
    if (this.listeners.has(eventName)) {
      const eventListeners = this.listeners.get(eventName);
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
      if (eventListeners.length === 0) {
        this.listeners.delete(eventName);
      }
    }
  }
  publish(eventName, data) {
    const listeners = this.listeners.get(eventName);
    if (listeners && listeners.length > 0) {
      try {
        const eventData = structuredClone(data);
        console.log(`[EventBus] Publishing ${eventName}. Found ${listeners.length} listeners. Data to send:`, JSON.stringify(eventData));
        listeners.forEach((callback, index) => {
          try {
            console.log(`[EventBus] Calling listener #${index + 1} for ${eventName} with data:`, JSON.stringify(eventData));
            callback(eventData);
          } catch (error) {
            console.error(`[EventBus] Error in listener #${index + 1} for ${eventName}:`, error);
          }
        });
      } catch (cloneError) {
        console.error(`[EventBus] Failed to structuredClone data for event ${eventName}:`, cloneError, data);
      }
    } else {
      console.log(`[EventBus] No listeners registered for event ${eventName}. Data:`, JSON.stringify(data));
    }
  }
}
const eventBus = new EventBus();
const eventBus$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  eventBus
}, Symbol.toStringTag, { value: "Module" }));
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
class DbEventBase {
  constructor(requestId = null) {
    this.requestId = requestId || generateUUID();
    this.timestamp = Date.now();
  }
}
class DbResponseBase extends DbEventBase {
  constructor(originalRequestId, success, data = null, error = null) {
    super(originalRequestId);
    this.success = success;
    this.data = data;
    this.error = error ? error.message || String(error) : null;
  }
}
class DbNotificationBase {
  constructor(sessionId) {
    this.sessionId = sessionId;
    this.timestamp = Date.now();
  }
}
class DbGetSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, sessionData, error = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = DbGetSessionResponse.name;
  }
}
class DbAddMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = DbAddMessageResponse.name;
  }
}
class DbUpdateMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbUpdateMessageResponse.name;
  }
}
class DbUpdateStatusResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbUpdateStatusResponse.name;
  }
}
class DbDeleteMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbDeleteMessageResponse.name;
  }
}
class DbToggleStarResponse extends DbResponseBase {
  constructor(originalRequestId, success, updatedSessionData, error = null) {
    super(originalRequestId, success, updatedSessionData, error);
    this.type = DbToggleStarResponse.name;
  }
}
class DbCreateSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, newSessionId, error = null) {
    super(originalRequestId, success, { newSessionId }, error);
    this.type = DbCreateSessionResponse.name;
    console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
  }
  get newSessionId() {
    var _a;
    return (_a = this.data) == null ? void 0 : _a.newSessionId;
  }
}
class DbDeleteSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbDeleteSessionResponse.name;
  }
}
class DbRenameSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbRenameSessionResponse.name;
  }
}
class DbGetAllSessionsResponse extends DbResponseBase {
  constructor(requestId, success, sessions = null, error = null) {
    super(requestId, success, sessions, error);
    this.type = DbGetAllSessionsResponse.name;
    this.payload = { sessions };
  }
}
class DbGetStarredSessionsResponse extends DbResponseBase {
  constructor(requestId, success, starredSessions = null, error = null) {
    super(requestId, success, starredSessions, error);
    this.type = DbGetStarredSessionsResponse.name;
  }
}
const _DbGetSessionRequest = class _DbGetSessionRequest extends DbEventBase {
  constructor(sessionId) {
    super();
    this.type = _DbGetSessionRequest.name;
    this.payload = { sessionId };
  }
};
__publicField(_DbGetSessionRequest, "responseEventName", DbGetSessionResponse.name);
let DbGetSessionRequest = _DbGetSessionRequest;
const _DbAddMessageRequest = class _DbAddMessageRequest extends DbEventBase {
  constructor(sessionId, messageObject) {
    super();
    this.type = _DbAddMessageRequest.name;
    this.payload = { sessionId, messageObject };
  }
};
__publicField(_DbAddMessageRequest, "responseEventName", DbAddMessageResponse.name);
let DbAddMessageRequest = _DbAddMessageRequest;
const _DbUpdateMessageRequest = class _DbUpdateMessageRequest extends DbEventBase {
  constructor(sessionId, messageId, updates) {
    super();
    this.type = _DbUpdateMessageRequest.name;
    this.payload = { sessionId, messageId, updates };
  }
};
__publicField(_DbUpdateMessageRequest, "responseEventName", DbUpdateMessageResponse.name);
let DbUpdateMessageRequest = _DbUpdateMessageRequest;
const _DbUpdateStatusRequest = class _DbUpdateStatusRequest extends DbEventBase {
  constructor(sessionId, status) {
    super();
    this.type = _DbUpdateStatusRequest.name;
    this.payload = { sessionId, status };
  }
};
__publicField(_DbUpdateStatusRequest, "responseEventName", DbUpdateStatusResponse.name);
let DbUpdateStatusRequest = _DbUpdateStatusRequest;
const _DbDeleteMessageRequest = class _DbDeleteMessageRequest extends DbEventBase {
  constructor(sessionId, messageId) {
    super();
    this.type = _DbDeleteMessageRequest.name;
    this.payload = { sessionId, messageId };
  }
};
__publicField(_DbDeleteMessageRequest, "responseEventName", DbDeleteMessageResponse.name);
let DbDeleteMessageRequest = _DbDeleteMessageRequest;
const _DbToggleStarRequest = class _DbToggleStarRequest extends DbEventBase {
  constructor(sessionId) {
    super();
    this.type = _DbToggleStarRequest.name;
    this.payload = { sessionId };
  }
};
__publicField(_DbToggleStarRequest, "responseEventName", DbToggleStarResponse.name);
let DbToggleStarRequest = _DbToggleStarRequest;
const _DbCreateSessionRequest = class _DbCreateSessionRequest extends DbEventBase {
  constructor(initialMessage) {
    super();
    this.type = _DbCreateSessionRequest.name;
    this.payload = { initialMessage };
    console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
  }
};
__publicField(_DbCreateSessionRequest, "responseEventName", DbCreateSessionResponse.name);
let DbCreateSessionRequest = _DbCreateSessionRequest;
class DbInitializeRequest extends DbEventBase {
  // No response expected via requestDbAndWait, so no responseEventName needed
  constructor() {
    super();
    this.type = DbInitializeRequest.name;
    this.payload = {};
  }
}
const _DbDeleteSessionRequest = class _DbDeleteSessionRequest extends DbEventBase {
  constructor(sessionId) {
    super();
    this.type = _DbDeleteSessionRequest.name;
    this.payload = { sessionId };
  }
};
__publicField(_DbDeleteSessionRequest, "responseEventName", DbDeleteSessionResponse.name);
let DbDeleteSessionRequest = _DbDeleteSessionRequest;
const _DbRenameSessionRequest = class _DbRenameSessionRequest extends DbEventBase {
  constructor(sessionId, newName) {
    super();
    this.type = _DbRenameSessionRequest.name;
    this.payload = { sessionId, newName };
  }
};
__publicField(_DbRenameSessionRequest, "responseEventName", DbRenameSessionResponse.name);
let DbRenameSessionRequest = _DbRenameSessionRequest;
const _DbGetAllSessionsRequest = class _DbGetAllSessionsRequest extends DbEventBase {
  constructor() {
    super();
    this.type = _DbGetAllSessionsRequest.name;
  }
};
__publicField(_DbGetAllSessionsRequest, "responseEventName", DbGetAllSessionsResponse.name);
let DbGetAllSessionsRequest = _DbGetAllSessionsRequest;
const _DbGetStarredSessionsRequest = class _DbGetStarredSessionsRequest extends DbEventBase {
  constructor() {
    super();
    this.type = _DbGetStarredSessionsRequest.name;
  }
};
__publicField(_DbGetStarredSessionsRequest, "responseEventName", DbGetStarredSessionsResponse.name);
let DbGetStarredSessionsRequest = _DbGetStarredSessionsRequest;
class DbMessagesUpdatedNotification extends DbNotificationBase {
  constructor(sessionId, messages) {
    super(sessionId);
    this.type = DbMessagesUpdatedNotification.name;
    this.payload = { messages };
  }
}
class DbStatusUpdatedNotification extends DbNotificationBase {
  constructor(sessionId, status) {
    super(sessionId);
    this.type = DbStatusUpdatedNotification.name;
    this.payload = { status };
  }
}
class DbSessionUpdatedNotification extends DbNotificationBase {
  constructor(sessionId, updatedSessionData) {
    super(sessionId);
    this.type = DbSessionUpdatedNotification.name;
    this.payload = { session: updatedSessionData };
  }
}
class DbInitializationCompleteNotification {
  constructor({ success, error = null }) {
    this.type = DbInitializationCompleteNotification.name;
    this.timestamp = Date.now();
    this.payload = { success, error: error ? error.message || String(error) : null };
  }
}
class DbGetLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error);
    this.type = DbGetLogsResponse.name;
  }
}
class DbGetUniqueLogValuesResponse extends DbResponseBase {
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error);
    this.type = DbGetUniqueLogValuesResponse.name;
  }
}
class DbClearLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbClearLogsResponse.name;
  }
}
class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
  constructor(originalRequestId, success, ids, error = null) {
    super(originalRequestId, success, ids, error);
    this.type = DbGetCurrentAndLastLogSessionIdsResponse.name;
  }
}
class DbAddLogRequest extends DbEventBase {
  // No responseEventName needed for fire-and-forget
  constructor(logEntryData) {
    super();
    this.type = DbAddLogRequest.name;
    this.payload = { logEntryData };
  }
}
const _DbGetLogsRequest = class _DbGetLogsRequest extends DbEventBase {
  constructor(filters) {
    super();
    this.type = _DbGetLogsRequest.name;
    this.payload = { filters };
  }
};
__publicField(_DbGetLogsRequest, "responseEventName", DbGetLogsResponse.name);
let DbGetLogsRequest = _DbGetLogsRequest;
const _DbGetUniqueLogValuesRequest = class _DbGetUniqueLogValuesRequest extends DbEventBase {
  constructor(fieldName) {
    super();
    this.type = _DbGetUniqueLogValuesRequest.name;
    this.payload = { fieldName };
  }
};
__publicField(_DbGetUniqueLogValuesRequest, "responseEventName", DbGetUniqueLogValuesResponse.name);
let DbGetUniqueLogValuesRequest = _DbGetUniqueLogValuesRequest;
const _DbClearLogsRequest = class _DbClearLogsRequest extends DbEventBase {
  constructor(filter = "all") {
    super();
    this.type = _DbClearLogsRequest.name;
    this.payload = { filter };
  }
};
__publicField(_DbClearLogsRequest, "responseEventName", DbClearLogsResponse.name);
let DbClearLogsRequest = _DbClearLogsRequest;
const _DbGetCurrentAndLastLogSessionIdsRequest = class _DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
  constructor() {
    super();
    this.type = _DbGetCurrentAndLastLogSessionIdsRequest.name;
  }
};
__publicField(_DbGetCurrentAndLastLogSessionIdsRequest, "responseEventName", DbGetCurrentAndLastLogSessionIdsResponse.name);
let DbGetCurrentAndLastLogSessionIdsRequest = _DbGetCurrentAndLastLogSessionIdsRequest;
export {
  commonjsGlobal as A,
  getDefaultExportFromCjs as B,
  DbInitializeRequest as C,
  DbMessagesUpdatedNotification as D,
  DbAddLogRequest as E,
  DbGetLogsRequest as F,
  DbGetUniqueLogValuesRequest as G,
  DbClearLogsRequest as H,
  DbGetCurrentAndLastLogSessionIdsRequest as I,
  DbInitializationCompleteNotification as J,
  DbGetLogsResponse as K,
  DbGetUniqueLogValuesResponse as L,
  DbClearLogsResponse as M,
  DbGetCurrentAndLastLogSessionIdsResponse as N,
  eventBus$1 as O,
  DbSessionUpdatedNotification as a,
  browser as b,
  DbGetSessionRequest as c,
  DbStatusUpdatedNotification as d,
  eventBus as e,
  DbCreateSessionRequest as f,
  DbAddMessageRequest as g,
  DbUpdateStatusRequest as h,
  DbUpdateMessageRequest as i,
  DbCreateSessionResponse as j,
  DbAddMessageResponse as k,
  DbGetSessionResponse as l,
  DbUpdateMessageResponse as m,
  DbDeleteMessageRequest as n,
  DbDeleteMessageResponse as o,
  DbUpdateStatusResponse as p,
  DbToggleStarRequest as q,
  DbToggleStarResponse as r,
  DbGetAllSessionsRequest as s,
  DbGetAllSessionsResponse as t,
  DbGetStarredSessionsRequest as u,
  DbGetStarredSessionsResponse as v,
  DbDeleteSessionRequest as w,
  DbDeleteSessionResponse as x,
  DbRenameSessionRequest as y,
  DbRenameSessionResponse as z
};
//# sourceMappingURL=dbEvents-BEUbKsMb.js.map
