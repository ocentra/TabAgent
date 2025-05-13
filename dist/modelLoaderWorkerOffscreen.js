/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/webextension-polyfill/dist/browser-polyfill.js":
/*!*********************************************************************!*\
  !*** ./node_modules/webextension-polyfill/dist/browser-polyfill.js ***!
  \*********************************************************************/
/***/ (function(module, exports) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;(function (global, factory) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_ARRAY__ = [module], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
  } else { var mod; }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (module) {
  /* webextension-polyfill - v0.12.0 - Tue May 14 2024 18:01:29 */
  /* -*- Mode: indent-tabs-mode: nil; js-indent-level: 2 -*- */
  /* vim: set sts=2 sw=2 et tw=80: */
  /* This Source Code Form is subject to the terms of the Mozilla Public
   * License, v. 2.0. If a copy of the MPL was not distributed with this
   * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
  "use strict";

  if (!(globalThis.chrome && globalThis.chrome.runtime && globalThis.chrome.runtime.id)) {
    throw new Error("This script should only be loaded in a browser extension.");
  }
  if (!(globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.id)) {
    const CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE = "The message port closed before a response was received.";

    // Wrapping the bulk of this polyfill in a one-time-use function is a minor
    // optimization for Firefox. Since Spidermonkey does not fully parse the
    // contents of a function until the first time it's called, and since it will
    // never actually need to be called, this allows the polyfill to be included
    // in Firefox nearly for free.
    const wrapAPIs = extensionAPIs => {
      // NOTE: apiMetadata is associated to the content of the api-metadata.json file
      // at build time by replacing the following "include" with the content of the
      // JSON file.
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

      /**
       * A WeakMap subclass which creates and stores a value for any key which does
       * not exist when accessed, but behaves exactly as an ordinary WeakMap
       * otherwise.
       *
       * @param {function} createItem
       *        A function which will be called in order to create the value for any
       *        key which does not exist, the first time it is accessed. The
       *        function receives, as its only argument, the key being created.
       */
      class DefaultWeakMap extends WeakMap {
        constructor(createItem, items = undefined) {
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

      /**
       * Returns true if the given object is an object with a `then` method, and can
       * therefore be assumed to behave as a Promise.
       *
       * @param {*} value The value to test.
       * @returns {boolean} True if the value is thenable.
       */
      const isThenable = value => {
        return value && typeof value === "object" && typeof value.then === "function";
      };

      /**
       * Creates and returns a function which, when called, will resolve or reject
       * the given promise based on how it is called:
       *
       * - If, when called, `chrome.runtime.lastError` contains a non-null object,
       *   the promise is rejected with that value.
       * - If the function is called with exactly one argument, the promise is
       *   resolved to that value.
       * - Otherwise, the promise is resolved to an array containing all of the
       *   function's arguments.
       *
       * @param {object} promise
       *        An object containing the resolution and rejection functions of a
       *        promise.
       * @param {function} promise.resolve
       *        The promise's resolution function.
       * @param {function} promise.reject
       *        The promise's rejection function.
       * @param {object} metadata
       *        Metadata about the wrapped method which has created the callback.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function}
       *        The generated callback function.
       */
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
      const pluralizeArguments = numArgs => numArgs == 1 ? "argument" : "arguments";

      /**
       * Creates a wrapper function for a method with the given name and metadata.
       *
       * @param {string} name
       *        The name of the method which is being wrapped.
       * @param {object} metadata
       *        Metadata about the method being wrapped.
       * @param {integer} metadata.minArgs
       *        The minimum number of arguments which must be passed to the
       *        function. If called with fewer than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {integer} metadata.maxArgs
       *        The maximum number of arguments which may be passed to the
       *        function. If called with more than this number of arguments, the
       *        wrapper will raise an exception.
       * @param {boolean} metadata.singleCallbackArg
       *        Whether or not the promise is resolved with only the first
       *        argument of the callback, alternatively an array of all the
       *        callback arguments is resolved. By default, if the callback
       *        function is invoked with only a single argument, that will be
       *        resolved to the promise, while all arguments will be resolved as
       *        an array if multiple are given.
       *
       * @returns {function(object, ...*)}
       *       The generated wrapper function.
       */
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
              // This API method has currently no callback on Chrome, but it return a promise on Firefox,
              // and so the polyfill will try to call it with a callback first, and it will fallback
              // to not passing the callback if the first call fails.
              try {
                target[name](...args, makeCallback({
                  resolve,
                  reject
                }, metadata));
              } catch (cbError) {
                console.warn(`${name} API method doesn't seem to support the callback parameter, ` + "falling back to call it without a callback: ", cbError);
                target[name](...args);

                // Update the API method metadata, so that the next API calls will not try to
                // use the unsupported callback anymore.
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

      /**
       * Wraps an existing method of the target object, so that calls to it are
       * intercepted by the given wrapper function. The wrapper function receives,
       * as its first argument, the original `target` object, followed by each of
       * the arguments passed to the original method.
       *
       * @param {object} target
       *        The original target object that the wrapped method belongs to.
       * @param {function} method
       *        The method being wrapped. This is used as the target of the Proxy
       *        object which is created to wrap the method.
       * @param {function} wrapper
       *        The wrapper function which is called in place of a direct invocation
       *        of the wrapped method.
       *
       * @returns {Proxy<function>}
       *        A Proxy object for the given method, which invokes the given wrapper
       *        method in its place.
       */
      const wrapMethod = (target, method, wrapper) => {
        return new Proxy(method, {
          apply(targetMethod, thisObj, args) {
            return wrapper.call(thisObj, target, ...args);
          }
        });
      };
      let hasOwnProperty = Function.call.bind(Object.prototype.hasOwnProperty);

      /**
       * Wraps an object in a Proxy which intercepts and wraps certain methods
       * based on the given `wrappers` and `metadata` objects.
       *
       * @param {object} target
       *        The target object to wrap.
       *
       * @param {object} [wrappers = {}]
       *        An object tree containing wrapper functions for special cases. Any
       *        function present in this object tree is called in place of the
       *        method in the same location in the `target` object tree. These
       *        wrapper methods are invoked as described in {@see wrapMethod}.
       *
       * @param {object} [metadata = {}]
       *        An object tree containing metadata used to automatically generate
       *        Promise-based wrapper functions for asynchronous. Any function in
       *        the `target` object tree which has a corresponding metadata object
       *        in the same location in the `metadata` tree is replaced with an
       *        automatically-generated wrapper function, as described in
       *        {@see wrapAsyncFunction}
       *
       * @returns {Proxy<object>}
       */
      const wrapObject = (target, wrappers = {}, metadata = {}) => {
        let cache = Object.create(null);
        let handlers = {
          has(proxyTarget, prop) {
            return prop in target || prop in cache;
          },
          get(proxyTarget, prop, receiver) {
            if (prop in cache) {
              return cache[prop];
            }
            if (!(prop in target)) {
              return undefined;
            }
            let value = target[prop];
            if (typeof value === "function") {
              // This is a method on the underlying object. Check if we need to do
              // any wrapping.

              if (typeof wrappers[prop] === "function") {
                // We have a special-case wrapper for this method.
                value = wrapMethod(target, target[prop], wrappers[prop]);
              } else if (hasOwnProperty(metadata, prop)) {
                // This is an async method that we have metadata for. Create a
                // Promise wrapper for it.
                let wrapper = wrapAsyncFunction(prop, metadata[prop]);
                value = wrapMethod(target, target[prop], wrapper);
              } else {
                // This is a method that we don't know or care about. Return the
                // original method, bound to the underlying object.
                value = value.bind(target);
              }
            } else if (typeof value === "object" && value !== null && (hasOwnProperty(wrappers, prop) || hasOwnProperty(metadata, prop))) {
              // This is an object that we need to do some wrapping for the children
              // of. Create a sub-object wrapper for it with the appropriate child
              // metadata.
              value = wrapObject(value, wrappers[prop], metadata[prop]);
            } else if (hasOwnProperty(metadata, "*")) {
              // Wrap all properties in * namespace.
              value = wrapObject(value, wrappers[prop], metadata["*"]);
            } else {
              // We don't need to do any wrapping for this property,
              // so just forward all access to the underlying object.
              Object.defineProperty(cache, prop, {
                configurable: true,
                enumerable: true,
                get() {
                  return target[prop];
                },
                set(value) {
                  target[prop] = value;
                }
              });
              return value;
            }
            cache[prop] = value;
            return value;
          },
          set(proxyTarget, prop, value, receiver) {
            if (prop in cache) {
              cache[prop] = value;
            } else {
              target[prop] = value;
            }
            return true;
          },
          defineProperty(proxyTarget, prop, desc) {
            return Reflect.defineProperty(cache, prop, desc);
          },
          deleteProperty(proxyTarget, prop) {
            return Reflect.deleteProperty(cache, prop);
          }
        };

        // Per contract of the Proxy API, the "get" proxy handler must return the
        // original value of the target if that value is declared read-only and
        // non-configurable. For this reason, we create an object with the
        // prototype set to `target` instead of using `target` directly.
        // Otherwise we cannot return a custom object for APIs that
        // are declared read-only and non-configurable, such as `chrome.devtools`.
        //
        // The proxy handlers themselves will still use the original `target`
        // instead of the `proxyTarget`, so that the methods and properties are
        // dereferenced via the original targets.
        let proxyTarget = Object.create(target);
        return new Proxy(proxyTarget, handlers);
      };

      /**
       * Creates a set of wrapper functions for an event object, which handles
       * wrapping of listener functions that those messages are passed.
       *
       * A single wrapper is created for each listener function, and stored in a
       * map. Subsequent calls to `addListener`, `hasListener`, or `removeListener`
       * retrieve the original wrapper, so that  attempts to remove a
       * previously-added listener work as expected.
       *
       * @param {DefaultWeakMap<function, function>} wrapperMap
       *        A DefaultWeakMap object which will create the appropriate wrapper
       *        for a given listener function when one does not exist, and retrieve
       *        an existing one when it does.
       *
       * @returns {object}
       */
      const wrapEvent = wrapperMap => ({
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
      const onRequestFinishedWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }

        /**
         * Wraps an onRequestFinished listener function so that it will return a
         * `getContent()` property which returns a `Promise` rather than using a
         * callback API.
         *
         * @param {object} req
         *        The HAR entry object representing the network request.
         */
        return function onRequestFinished(req) {
          const wrappedReq = wrapObject(req, {} /* wrappers */, {
            getContent: {
              minArgs: 0,
              maxArgs: 0
            }
          });
          listener(wrappedReq);
        };
      });
      const onMessageWrappers = new DefaultWeakMap(listener => {
        if (typeof listener !== "function") {
          return listener;
        }

        /**
         * Wraps a message listener function so that it may send responses based on
         * its return value, rather than by returning a sentinel value and calling a
         * callback. If the listener function returns a Promise, the response is
         * sent when the promise either resolves or rejects.
         *
         * @param {*} message
         *        The message sent by the other end of the channel.
         * @param {object} sender
         *        Details about the sender of the message.
         * @param {function(*)} sendResponse
         *        A callback which, when called with an arbitrary argument, sends
         *        that value as a response.
         * @returns {boolean}
         *        True if the wrapped listener returned a Promise, which will later
         *        yield a response. False otherwise.
         */
        return function onMessage(message, sender, sendResponse) {
          let didCallSendResponse = false;
          let wrappedSendResponse;
          let sendResponsePromise = new Promise(resolve => {
            wrappedSendResponse = function (response) {
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

          // If the listener didn't returned true or a Promise, or called
          // wrappedSendResponse synchronously, we can exit earlier
          // because there will be no response sent from this listener.
          if (result !== true && !isResultThenable && !didCallSendResponse) {
            return false;
          }

          // A small helper to send the message if the promise resolves
          // and an error if the promise rejects (a wrapped sendMessage has
          // to translate the message into a resolved promise or a rejected
          // promise).
          const sendPromisedResult = promise => {
            promise.then(msg => {
              // send the message value.
              sendResponse(msg);
            }, error => {
              // Send a JSON representation of the error if the rejected value
              // is an instance of error, or the object itself otherwise.
              let message;
              if (error && (error instanceof Error || typeof error.message === "string")) {
                message = error.message;
              } else {
                message = "An unexpected error occurred";
              }
              sendResponse({
                __mozWebExtensionPolyfillReject__: true,
                message
              });
            }).catch(err => {
              // Print an error on the console if unable to send the response.
              console.error("Failed to send onMessage rejected reply", err);
            });
          };

          // If the listener returned a Promise, send the resolved value as a
          // result, otherwise wait the promise related to the wrappedSendResponse
          // callback to resolve and send it as a response.
          if (isResultThenable) {
            sendPromisedResult(result);
          } else {
            sendPromisedResult(sendResponsePromise);
          }

          // Let Chrome know that the listener is replying.
          return true;
        };
      });
      const wrappedSendMessageCallback = ({
        reject,
        resolve
      }, reply) => {
        if (extensionAPIs.runtime.lastError) {
          // Detect when none of the listeners replied to the sendMessage call and resolve
          // the promise to undefined as in Firefox.
          // See https://github.com/mozilla/webextension-polyfill/issues/130
          if (extensionAPIs.runtime.lastError.message === CHROME_SEND_MESSAGE_CALLBACK_NO_RESPONSE_MESSAGE) {
            resolve();
          } else {
            reject(new Error(extensionAPIs.runtime.lastError.message));
          }
        } else if (reply && reply.__mozWebExtensionPolyfillReject__) {
          // Convert back the JSON representation of the error into
          // an Error instance.
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

    // The build process adds a UMD wrapper around this file, which makes the
    // `module` variable available.
    module.exports = wrapAPIs(chrome);
  } else {
    module.exports = globalThis.browser;
  }
});
//# sourceMappingURL=browser-polyfill.js.map


/***/ }),

/***/ "./src/events/eventNames.js":
/*!**********************************!*\
  !*** ./src/events/eventNames.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Contexts: () => (/* binding */ Contexts),
/* harmony export */   DBEventNames: () => (/* binding */ DBEventNames),
/* harmony export */   DirectDBNames: () => (/* binding */ DirectDBNames),
/* harmony export */   InternalEventBusMessageTypes: () => (/* binding */ InternalEventBusMessageTypes),
/* harmony export */   ModelLoaderMessageTypes: () => (/* binding */ ModelLoaderMessageTypes),
/* harmony export */   ModelWorkerStates: () => (/* binding */ ModelWorkerStates),
/* harmony export */   RawDirectMessageTypes: () => (/* binding */ RawDirectMessageTypes),
/* harmony export */   RuntimeMessageTypes: () => (/* binding */ RuntimeMessageTypes),
/* harmony export */   SiteMapperMessageTypes: () => (/* binding */ SiteMapperMessageTypes),
/* harmony export */   UIEventNames: () => (/* binding */ UIEventNames),
/* harmony export */   WorkerEventNames: () => (/* binding */ WorkerEventNames)
/* harmony export */ });
const DirectDBNames = Object.freeze({
  ADD_MODEL_ASSET: 'AddModelAsset',
  GET_MODEL_ASSET: 'GetModelAsset',
  COUNT_MODEL_ASSET_CHUNKS: 'CountModelAssetChunks',
  VERIFY_MODEL_ASSET: 'VerifyModelAsset',
});

const DBEventNames = Object.freeze({
  DB_GET_SESSION_REQUEST: 'DbGetSessionRequest',
  DB_GET_SESSION_RESPONSE: 'DbGetSessionResponse',
  DB_ADD_MESSAGE_REQUEST: 'DbAddMessageRequest',
  DB_ADD_MESSAGE_RESPONSE: 'DbAddMessageResponse',
  DB_UPDATE_MESSAGE_REQUEST: 'DbUpdateMessageRequest',
  DB_UPDATE_MESSAGE_RESPONSE: 'DbUpdateMessageResponse',
  DB_UPDATE_STATUS_REQUEST: 'DbUpdateStatusRequest',
  DB_UPDATE_STATUS_RESPONSE: 'DbUpdateStatusResponse',
  DB_DELETE_MESSAGE_REQUEST: 'DbDeleteMessageRequest',
  DB_DELETE_MESSAGE_RESPONSE: 'DbDeleteMessageResponse',
  DB_TOGGLE_STAR_REQUEST: 'DbToggleStarRequest',
  DB_TOGGLE_STAR_RESPONSE: 'DbToggleStarResponse',
  DB_CREATE_SESSION_REQUEST: 'DbCreateSessionRequest',
  DB_CREATE_SESSION_RESPONSE: 'DbCreateSessionResponse',
  DB_DELETE_SESSION_REQUEST: 'DbDeleteSessionRequest',
  DB_DELETE_SESSION_RESPONSE: 'DbDeleteSessionResponse',
  DB_RENAME_SESSION_REQUEST: 'DbRenameSessionRequest',
  DB_RENAME_SESSION_RESPONSE: 'DbRenameSessionResponse',
  DB_GET_ALL_SESSIONS_REQUEST: 'DbGetAllSessionsRequest',
  DB_GET_ALL_SESSIONS_RESPONSE: 'DbGetAllSessionsResponse',
  DB_GET_STARRED_SESSIONS_REQUEST: 'DbGetStarredSessionsRequest',
  DB_GET_STARRED_SESSIONS_RESPONSE: 'DbGetStarredSessionsResponse',
  DB_MESSAGES_UPDATED_NOTIFICATION: 'DbMessagesUpdatedNotification',
  DB_STATUS_UPDATED_NOTIFICATION: 'DbStatusUpdatedNotification',
  DB_SESSION_UPDATED_NOTIFICATION: 'DbSessionUpdatedNotification',
  DB_INITIALIZE_REQUEST: 'DbInitializeRequest',
  DB_INITIALIZATION_COMPLETE_NOTIFICATION: 'DbInitializationCompleteNotification',
  DB_GET_LOGS_REQUEST: 'DbGetLogsRequest',
  DB_GET_LOGS_RESPONSE: 'DbGetLogsResponse',
  DB_GET_UNIQUE_LOG_VALUES_REQUEST: 'DbGetUniqueLogValuesRequest',
  DB_GET_UNIQUE_LOG_VALUES_RESPONSE: 'DbGetUniqueLogValuesResponse',
  DB_CLEAR_LOGS_REQUEST: 'DbClearLogsRequest',
  DB_CLEAR_LOGS_RESPONSE: 'DbClearLogsResponse',
  DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST: 'DbGetCurrentAndLastLogSessionIdsRequest',
  DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE: 'DbGetCurrentAndLastLogSessionIdsResponse',
  DB_ADD_LOG_REQUEST: 'DbAddLogRequest',
  DB_ADD_LOG_RESPONSE: 'DbAddLogResponse',
  DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
  DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
  DB_RESET_DATABASE_REQUEST: 'DbResetDatabaseRequest',
  DB_RESET_DATABASE_RESPONSE: 'DbResetDatabaseResponse',

});

const UIEventNames = Object.freeze({
  QUERY_SUBMITTED: 'ui:querySubmitted',
  BACKGROUND_RESPONSE_RECEIVED: 'background:responseReceived',
  BACKGROUND_ERROR_RECEIVED: 'background:errorReceived',
  BACKGROUND_SCRAPE_STAGE_RESULT: 'background:scrapeStageResult',
  BACKGROUND_SCRAPE_RESULT_RECEIVED: 'background:scrapeResultReceived',
  BACKGROUND_LOADING_STATUS_UPDATE: 'ui:loadingStatusUpdate',
  REQUEST_MODEL_LOAD: 'ui:requestModelLoad',
  WORKER_READY: 'worker:ready',
  WORKER_ERROR: 'worker:error',
  NAVIGATION_PAGE_CHANGED: 'navigation:pageChanged',
  SCRAPE_PAGE: 'SCRAPE_PAGE',
  SCRAPE_ACTIVE_TAB: 'SCRAPE_ACTIVE_TAB',
  DYNAMIC_SCRIPT_MESSAGE_TYPE: 'offscreenIframeResult',
  MODEL_DOWNLOAD_PROGRESS: 'ui:modelDownloadProgress',
  // Add more as needed
});

const WorkerEventNames = Object.freeze({
  WORKER_SCRIPT_READY: 'workerScriptReady',
  WORKER_READY: 'workerReady',
  LOADING_STATUS: 'loadingStatus',
  GENERATION_STATUS: 'generationStatus',
  GENERATION_UPDATE: 'generationUpdate',
  GENERATION_COMPLETE: 'generationComplete',
  GENERATION_ERROR: 'generationError',
  RESET_COMPLETE: 'resetComplete',
  ERROR: 'error',
  REQUEST_ASSET_FROM_DB_INTERNAL_TYPE : 'REQUEST_ASSET_FROM_DB_INTERNAL_TYPE',
});

const ModelWorkerStates = Object.freeze({
  UNINITIALIZED: 'uninitialized',
  CREATING_WORKER: 'creating_worker',
  WORKER_SCRIPT_READY: 'worker_script_ready',
  LOADING_MODEL: 'loading_model',
  MODEL_READY: 'model_ready',
  GENERATING: 'generating',
  ERROR: 'error',
  IDLE: 'idle',
});

const RuntimeMessageTypes = Object.freeze({
  LOAD_MODEL: 'loadModel',
  SEND_CHAT_MESSAGE: 'sendChatMessage',
  INTERRUPT_GENERATION: 'interruptGeneration',
  RESET_WORKER: 'resetWorker',
  GET_MODEL_WORKER_STATE: 'getModelWorkerState',
  SCRAPE_REQUEST: 'scrapeRequest',
  GET_DRIVE_FILE_LIST: 'getDriveFileList',
  GET_LOG_SESSIONS: 'getLogSessions',
  GET_LOG_ENTRIES: 'getLogEntries',
  DETACH_SIDE_PANEL: 'detachSidePanel',
  GET_DETACHED_STATE: 'getDetachedState',
  GET_DB_READY_STATE: 'getDbReadyState',
});

const SiteMapperMessageTypes = Object.freeze({
  OPEN_TAB: 'openTab',
  MAPPED: 'mapped',
});

const ModelLoaderMessageTypes = Object.freeze({
  INIT: 'init',
  GENERATE: 'generate',
  INTERRUPT: 'interrupt',
  RESET: 'reset',
  DOWNLOAD_MODEL_ASSETS: 'DOWNLOAD_MODEL_ASSETS',
  LIST_MODEL_FILES: 'LIST_MODEL_FILES',
  LIST_MODEL_FILES_RESULT: 'LIST_MODEL_FILES_RESULT',
});

const InternalEventBusMessageTypes = Object.freeze({
  BACKGROUND_EVENT_BROADCAST: 'InternalEventBus:BackgroundEventBroadcast'
});

const RawDirectMessageTypes = Object.freeze({
  WORKER_GENERIC_RESPONSE: 'response',
  WORKER_GENERIC_ERROR: 'error',
  WORKER_SCRAPE_STAGE_RESULT: 'STAGE_SCRAPE_RESULT',
  WORKER_DIRECT_SCRAPE_RESULT: 'DIRECT_SCRAPE_RESULT',
  WORKER_UI_LOADING_STATUS_UPDATE: 'uiLoadingStatusUpdate' // This one is used as a direct message type
});

const Contexts = Object.freeze({
  BACKGROUND: 'Background',
  MAIN_UI: 'MainUI',
  POPUP: 'Popup',
  OTHERS: 'Others',
  UNKNOWN: 'Unknown',
});



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!*******************************************!*\
  !*** ./src/modelLoaderWorkerOffscreen.js ***!
  \*******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__);
// modelLoaderWorkerOffscreen.js



let modelWorker = null;
let workerScriptReady = false;
let modelWorkerInitializationInProgress = false;

const allowedMessageTypesFromBackground = new Set(Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes));
const prefix = '[Offscreen]';

// Helper: Log memory usage (Chrome only)
function logMemory(label) {
    if (performance && performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`${prefix} [Memory][${label}] Used: ${usedMB} MB / Total: ${totalMB} MB`);
    } else {
        console.log(`${prefix} [Memory][${label}] performance.memory not available`);
    }
}

function initializeModelWorker() {
    if (modelWorker || modelWorkerInitializationInProgress) {
        if (modelWorker) console.log(prefix, " model worker instance already exists or is ready.");
        if (modelWorkerInitializationInProgress) console.log(prefix, " model worker initialization is already in progress.");
        return modelWorker;
    }

    console.log(prefix, "Creating  Model Worker (model-worker.js)...");
    modelWorkerInitializationInProgress = true;
    workerScriptReady = false;

    try {
        modelWorker = new globalThis.Worker(webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.getURL('model-worker.js'), { type: 'module' });
        console.log(prefix, " Model Worker instance successfully created.");

        modelWorker.onmessage = async (event) => {
            if (!event.data || !event.data.type) {
                // Ignore empty/system messages
                if (event.data && Object.keys(event.data).length === 0) return;
                // Log at debug level for unexpected non-empty messages
                console.debug(prefix, "Received message from model worker without type or data (likely MessageChannel/system message):", event.data, event);
                return;
            }
            const { type, payload } = event.data;

            // --- Handle LIST_MODEL_FILES requests from the model worker ---
            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES) {
                const { requestId, payload: reqPayload } = event.data;
                console.log(prefix, '[Offscreen][modelWorker.onmessage] LIST_MODEL_FILES received from model worker:', reqPayload, 'requestId:', requestId);
                try {
                    const { modelId } = reqPayload || {};
                    if (!modelId) {
                        modelWorker.postMessage({
                            type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: 'No modelId provided' }
                        });
                        return;
                    }
                    const docsResult = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES,
                        payload: { modelId }
                    });
                    if (!docsResult.success) {
                        modelWorker.postMessage({
                            type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: docsResult.error }
                        });
                        return;
                    }
                    const files = docsResult.files;
                    modelWorker.postMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: true, files }
                    });
                    console.log(prefix, '[Offscreen][modelWorker.onmessage] LIST_MODEL_FILES_RESULT sent to model worker:', files, 'requestId:', requestId);
                } catch (err) {
                    modelWorker.postMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: false, error: err.message }
                    });
                    console.error(prefix, '[Offscreen][modelWorker.onmessage] Error handling LIST_MODEL_FILES:', err);
                }
                return; // Don't process further
            }

            // Relay pipeline loading progress to UI
            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.LOADING_STATUS) {
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE,
                    payload
                });
            }

            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE) {
                const { modelId, fileName } = payload;
                const requestPort = event.ports && event.ports[0];

                if (!requestPort) {
                    console.error(prefix, `${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE}: No MessageChannel port received for asset request: ${modelId}/${fileName}.`);
                    return;
                }
                console.log(prefix, `${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.REQUEST_ASSET_FROM_DB_INTERNAL_TYPE} from model-worker for asset: ${modelId}/${fileName}`);

                try {
                    const dbQueryResults = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames.GET_MODEL_ASSET, payload: { modelId, fileName } });
                    const dbQueryResult = dbQueryResults && dbQueryResults.length > 0 ? dbQueryResults[0] : null;

                    if (dbQueryResult && dbQueryResult.success && dbQueryResult.data) {
                        const assetData = dbQueryResult.data.data;
                        if (typeof assetData === 'string') {
                            const byteCharacters = atob(assetData);
                            const byteNumbers = new Array(byteCharacters.length);
                            for (let i = 0; i < byteCharacters.length; i++) {
                                byteNumbers[i] = byteCharacters.charCodeAt(i);
                            }
                            const byteArray = new Uint8Array(byteNumbers);
                            console.log(prefix, `Sending ArrayBuffer (length: ${byteArray.buffer.byteLength}) for ${modelId}/${fileName} back to model-worker.`);
                            requestPort.postMessage({ arrayBuffer: byteArray.buffer }, [byteArray.buffer]);
                        } else if (assetData instanceof ArrayBuffer) {
                            console.log(prefix, `Sending ArrayBuffer (length: ${assetData.byteLength}) for ${modelId}/${fileName} back to model-worker (direct ArrayBuffer).`);
                            requestPort.postMessage({ arrayBuffer: assetData }, [assetData]);
                        } else if (ArrayBuffer.isView(assetData)) {
                            console.log(prefix, `Sending ArrayBuffer (length: ${assetData.byteLength}) for ${modelId}/${fileName} back to model-worker (TypedArray).`);
                            requestPort.postMessage({ arrayBuffer: assetData.buffer }, [assetData.buffer]);
                        } else {
                            const errorMessage = `Asset ${modelId}/${fileName} found in DB but data is not a string, ArrayBuffer, or TypedArray.`;
                            console.error(prefix, errorMessage, "Full DB result:", dbQueryResult);
                            requestPort.postMessage({ error: errorMessage });
                        }
                    } else {
                        const errorMessage = dbQueryResult?.error || `Asset ${modelId}/${fileName} not found in DB or DB response was invalid.`;
                        console.error(prefix, errorMessage, "Full DB result:", dbQueryResult);
                        requestPort.postMessage({ error: errorMessage });
                    }
                } catch (err) {
                    console.error(prefix, `Error during eventBus.publish for GET_MODEL_ASSET (${modelId}/${fileName}):`, err);
                    requestPort.postMessage({ error: `EventBus publish error for GET_MODEL_ASSET: ${err.message}` });
                } finally {
                    requestPort.close();
                }
                return;
            }

            if (type !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_UPDATE && type !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.LOADING_STATUS) {
                console.log(prefix, `Received message from  Model Worker: Type: ${type}, Payload:`, payload);
            }

            const typesToForwardToBackground = [
                _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.WORKER_SCRIPT_READY, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.WORKER_READY, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.ERROR,
                _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.LOADING_STATUS, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_STATUS, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_UPDATE,
                _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_COMPLETE, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_ERROR, _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.RESET_COMPLETE
            ];

            if (typesToForwardToBackground.includes(type)) {
                if (type !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.GENERATION_UPDATE && type !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.LOADING_STATUS) {
                    console.log(prefix, `Forwarding message type \`${type}\` to background.`);
                }
                try {
                    await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type, payload });
                } catch (error) {
                    console.error(prefix, `Error sending message type '${type}' to background:`, error);
                }
            } else {
                if (type !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES) {
                    console.warn(prefix, `Not forwarding message type \`${type}\` from  worker. (Consider adding to eventNames.js and forward list)`);
                }
            }

            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.WORKER_SCRIPT_READY) {
                workerScriptReady = true;
                modelWorkerInitializationInProgress = false;
                console.log(prefix, " Model Worker script (model-worker.js) has signaled readiness.");
            }
            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.WORKER_READY) {
                modelWorkerInitializationInProgress = false; // Model fully loaded and ready
                console.log(prefix, " Model Worker has signaled model readiness for:", payload?.model);
            }
            if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.ERROR) {
                console.error(prefix, "Error reported from  model worker:", payload);
                if(modelWorkerInitializationInProgress) { // If error during init
                    modelWorkerInitializationInProgress = false;
                    workerScriptReady = false; // It didn't fully initialize
                }
            }
        };

        modelWorker.onerror = (errorEvent) => {
            console.error(prefix, " Model Worker 'onerror' event triggered:", errorEvent);
            const errorMessage = errorEvent.message || 'Unknown error in  model worker';
            const errorDetails = `Error in  worker: ${errorMessage} (File: ${errorEvent.filename}, Line: ${errorEvent.lineno})`;
            console.error(prefix, " Worker onerror details:", errorDetails);
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.ERROR, payload: errorDetails })
                .catch(err => console.error(prefix, "Error sending  worker's 'onerror' event to background:", err));
            
            modelWorker.terminate(); // Terminate the errored worker
            modelWorker = null;
            workerScriptReady = false;
            modelWorkerInitializationInProgress = false;
        };

    } catch (error) {
        console.error(prefix, "Failed to create  Model Worker instance (new Worker()):", error);
        webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.ERROR, payload: `Offscreen failed to instantiate  model worker: ${error.message}` })
            .catch(err => console.error(prefix, "Error sending model worker instantiation error to background:", err));
        modelWorker = null;
        workerScriptReady = false;
        modelWorkerInitializationInProgress = false;
    }
    return modelWorker;
}

async function downloadModelAssetsAndReport(modelId, sendResponseCallback) {
    console.log(prefix, `Starting downloadModelAssetsAndReport for modelId: ${modelId}`);
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    const baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;

    let metadata;
    try {
        console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        metadata = await response.json();
        console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
    } catch (error) {
        console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        sendResponseCallback({ success: false, error: `Metadata fetch for ${modelId} failed: ${error.message}` });
        return;
    }

    const hfFileEntries = metadata.siblings || [];
    // Only include .onnx, .json, .txt files
    const neededFileEntries = hfFileEntries.filter(f => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('.json') || f.rfilename.endsWith('.txt'));
    const neededFileNames = neededFileEntries.map(f => f.rfilename);
    console.log(prefix, `Identified ${neededFileNames.length} needed files for ${modelId}:`, neededFileNames);

    if (neededFileNames.length === 0) {
        console.warn(prefix, `No files matching .onnx, .json, or .txt found in HuggingFace metadata for ${modelId}.`);
        sendResponseCallback({ success: true, fileMap: {}, message: "No .onnx, .json, or .txt files found in model metadata." });
        return;
    }

    // --- Ensure all needed files have a valid size ---
    async function getFileSizeWithHEAD(url) {
        try {
            const headResp = await fetch(url, { method: 'HEAD' });
            if (headResp.ok) {
                const len = headResp.headers.get('Content-Length');
                return len ? parseInt(len, 10) : null;
            }
        } catch (e) {
            console.warn(prefix, `HEAD request failed for ${url}:`, e);
        }
        return null;
    }
    for (const entry of neededFileEntries) {
        if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
            const url = baseDownloadUrl + entry.rfilename;
            const size = await getFileSizeWithHEAD(url);
            if (size && isFinite(size) && size > 0) {
                entry.size = size;
                console.log(prefix, `Got file size via HEAD for ${entry.rfilename}: ${size}`);
            } else {
                console.error(prefix, `Skipping file ${entry.rfilename}: missing/invalid size (HEAD failed or Content-Length missing)`);
                entry._skip = true;
            }
        }
    }
    // Build download plan: list of files, sizes, and chunk counts (skip files with _skip)
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    const downloadPlan = neededFileEntries.filter(e => !e._skip).map((entry, idx) => ({
        fileName: entry.rfilename,
        fileSize: entry.size,
        totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
        fileIdx: idx + 1,
        fileType: entry.rfilename.split('.').pop(),
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum, f) => sum + f.fileSize, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum, f) => sum + f.totalChunks, 0);

    // Helper: Retry chunk write with exponential backoff
    async function tryStoreChunk(payload, maxRetries = 3) {
        let attempt = 0;
        while (attempt < maxRetries) {
            const addResults = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames.ADD_MODEL_ASSET, payload });
            const addResult = addResults && addResults.success !== undefined ? addResults : (addResults && addResults[0] ? addResults[0] : null);
            if (addResult && addResult.success) return true;
            attempt++;
            await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt))); // Exponential backoff
        }
        return false;
    }

    let filesSuccessfullyProcessedCount = 0;
    let totalBytesDownloaded = 0;
    let totalChunksDownloaded = 0;
    const totalFilesToAttempt = downloadPlan.length;
    const successfullyProcessedFileMap = {};
    const failedFiles = [];

    for (let filePlanIdx = 0; filePlanIdx < downloadPlan.length; filePlanIdx++) {
        const plan = downloadPlan[filePlanIdx];
        const relativeFileName = plan.fileName;
        const fileTotalBytes = plan.fileSize;
        const fileTotalChunks = plan.totalChunks;
        const fileIdx = plan.fileIdx;
        let currentFileSource = "DB_Check";
        let fileBytesDownloaded = 0;
        let fileChunksDownloaded = 0;
        let fileFailed = false;
        let lastLoggedPercent = -1;
        try {
            // Log memory before big file
            if (fileTotalBytes > 10 * 1024 * 1024) {
                logMemory(` Before file ${relativeFileName}`);
            }

            // --- CHUNK COUNT CHECK BEFORE DOWNLOAD ---
            console.log('[Offscreen][DB ChunkCount Check] Checking chunk count for:', { modelId, fileName: relativeFileName, expectedChunks: fileTotalChunks });
            const countResult = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames.COUNT_MODEL_ASSET_CHUNKS,
                payload: { modelId, fileName: relativeFileName }
            });
            console.log('[Offscreen][DB ChunkCount Check] Result:', countResult);

            const verifyResult = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
              type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames.VERIFY_MODEL_ASSET,
              payload: { modelId, fileName: relativeFileName, expectedSize: fileTotalBytes }
            });

            if (!verifyResult.success) {
                console.error('[VerifyDownload] Failed to verify file in DB:', modelId, relativeFileName, verifyResult.error);
                return
            }



            if (countResult && countResult.success && countResult.count === fileTotalChunks) {
                successfullyProcessedFileMap[relativeFileName] = true;
                filesSuccessfullyProcessedCount++;
                currentFileSource = "DB_Found_Chunks";
                console.log(prefix, `File already in DB (all chunks present): ${modelId}/${relativeFileName}`);
                if (fileTotalBytes) {
                    totalBytesDownloaded += fileTotalBytes;
                }
                totalChunksDownloaded += fileTotalChunks;
                fileBytesDownloaded = fileTotalBytes;
                fileChunksDownloaded = fileTotalChunks;
                // Report progress for already-in-DB file
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        fileIdx,
                        totalFiles: totalFilesToAttempt,
                        chunkIndex: fileTotalChunks,
                        totalChunks: fileTotalChunks,
                        fileBytesDownloaded,
                        fileTotalBytes,
                        totalBytesDownloaded,
                        totalBytesToDownload,
                        totalChunksDownloaded,
                        totalChunksToDownload,
                        percent: (totalBytesDownloaded / totalBytesToDownload) * 100,
                        filePercent: (fileBytesDownloaded / fileTotalBytes) * 100,
                        currentFileSource
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (already in DB):", e));
                continue; // Skip to next file
            }

            currentFileSource = "Download_Attempt";
            console.log(prefix, `File ${modelId}/${relativeFileName} not in DB or DB query failed. Attempting download. DB Query Result:`, countResult);
            const downloadUrl = baseDownloadUrl + relativeFileName;
            console.log(prefix, `Downloading file from: ${downloadUrl}`);
            const downloadResponse = await fetch(downloadUrl);

            if (!downloadResponse.ok) {
                const errorText = await downloadResponse.text();
                console.error(prefix, `Failed to download ${modelId}/${relativeFileName}: ${downloadResponse.status} ${downloadResponse.statusText}`, errorText);
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        error: `Download failed (${downloadResponse.status})`,
                        downloaded: filesSuccessfullyProcessedCount,
                        total: totalFilesToAttempt,
                        currentFileSource,
                        fileIdx,
                        totalFiles: totalFilesToAttempt
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (failure):", e));
                continue;
            }
            currentFileSource = "Download_Success_Store_Attempt";

            // --- Streams API chunked download and storage with 1MB buffering ---
            const reader = downloadResponse.body.getReader();
            let chunkIndex = 0;
            const chunkGroupId = `${modelId}/${relativeFileName}`;
            let allChunksSuccess = true;
            let buffer = new Uint8Array(0); // Buffer for 1MB chunks
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                let tmp = new Uint8Array(buffer.length + value.length);
                tmp.set(buffer, 0);
                tmp.set(value, buffer.length);
                buffer = tmp;
                while (buffer.length >= CHUNK_SIZE) {
                    const chunk = buffer.slice(0, CHUNK_SIZE);
                    buffer = buffer.slice(CHUNK_SIZE);
                    // Defensive: Check totalChunks
                    if (!fileTotalChunks || fileTotalChunks === null || fileTotalChunks === undefined) {
                        console.warn(`[Offscreen][Defensive] totalChunks is missing or invalid for ${relativeFileName} chunk ${chunkIndex}`);
                    }
                    // --- Robust: Retry chunk write ---
                    const payload = {
                        modelId,
                        fileName: relativeFileName,
                        fileType: plan.fileType,
                        data: Array.from(chunk),
                        chunkIndex,
                        totalChunks: fileTotalChunks,
                        chunkGroupId,
                        binarySize: chunk.byteLength,
                        totalFileSize: fileTotalBytes
                    };
                    const success = await tryStoreChunk(payload);
                    if (!success) {
                        allChunksSuccess = false;
                        fileFailed = true;
                        failedFiles.push(relativeFileName);
                        webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                            type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                            payload: {
                                modelId,
                                file: relativeFileName,
                                fileIdx,
                                totalFiles: totalFilesToAttempt,
                                chunkIndex,
                                totalChunks: fileTotalChunks,
                                error: `Failed to store chunk ${chunkIndex + 1} after retries`,
                                currentFileSource,
                                failType: 'chunk_write',
                            }
                        }).catch(e => console.error(prefix, "Error sending download progress (chunk fail):", e));
                        break;
                    }
                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded++;
                    fileBytesDownloaded += chunk.byteLength;
                    totalBytesDownloaded += chunk.byteLength;
                    // --- Throttle progress logs/messages: only first and last chunk ---
                    if (chunkIndex === 1 || chunkIndex === fileTotalChunks) {
                        console.log(`[Offscreen] ${chunkIndex === 1 ? 'Started' : 'Finished'} storing chunk ${chunkIndex} for ${relativeFileName}`);
                    }
                }
            }
            // Send any remaining data in buffer
            if (allChunksSuccess && buffer.length > 0) {
                const chunk = buffer;
                buffer = new Uint8Array(0); // Release memory
                const payload = {
                    modelId,
                    fileName: relativeFileName,
                    fileType: plan.fileType,
                    data: Array.from(chunk),
                    chunkIndex,
                    totalChunks: fileTotalChunks,
                    chunkGroupId,
                    binarySize: chunk.byteLength,
                    totalFileSize: fileTotalBytes
                };
                const success = await tryStoreChunk(payload);
                if (!success) {
                    allChunksSuccess = false;
                    fileFailed = true;
                    failedFiles.push(relativeFileName);
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks: fileTotalChunks,
                            error: `Failed to store final chunk ${chunkIndex + 1} after retries`,
                            currentFileSource,
                            failType: 'chunk_write',
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (final chunk fail):", e));
                } else {
                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded++;
                    fileBytesDownloaded += chunk.byteLength;
                    totalBytesDownloaded += chunk.byteLength;
                    // Always log/send for last chunk
                    console.log(`[Offscreen] Finished storing all chunks for ${relativeFileName}`);
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks: fileTotalChunks,
                            fileBytesDownloaded,
                            fileTotalBytes,
                            totalBytesDownloaded,
                            totalBytesToDownload,
                            totalChunksDownloaded,
                            totalChunksToDownload,
                            percent: (totalBytesDownloaded / totalBytesToDownload) * 100,
                            filePercent: 100,
                            currentFileSource
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (final chunk):", e));
                }
            }
            // --- Efficient: Post-write verification only after last chunk ---
            if (allChunksSuccess && !fileFailed) {
                // Only verify after last chunk
                const countResult = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames.COUNT_MODEL_ASSET_CHUNKS,
                    payload: { modelId, fileName: relativeFileName }
                });
                if (countResult.success && countResult.count === fileTotalChunks) {
                    successfullyProcessedFileMap[relativeFileName] = true;
                    filesSuccessfullyProcessedCount++;
                    currentFileSource = "DB_Stored_After_Download";
                    console.log(prefix, `Successfully downloaded, stored, and verified all chunks for ${modelId}/${relativeFileName} in DB.`);
                } else {
                    fileFailed = true;
                    failedFiles.push(relativeFileName);
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                        payload: {
                            modelId,
                            file: relativeFileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            error: `Verification failed: Only ${countResult.count} of ${fileTotalChunks} chunks present in DB after upload`,
                            failType: 'verification',
                            currentFileSource
                        }
                    }).catch(e => console.error(prefix, "Error sending download progress (verification fail):", e));
                    continue;
                }
            } else if (fileFailed || !allChunksSuccess) {
                console.error(prefix, `Failed to store all chunks for ${modelId}/${relativeFileName} in DB after download.`);
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                    payload: {
                        modelId,
                        file: relativeFileName,
                        error: `DB store failed after download (chunked)` ,
                        downloaded: filesSuccessfullyProcessedCount,
                        total: totalFilesToAttempt,
                        currentFileSource,
                        fileIdx,
                        totalFiles: totalFilesToAttempt,
                        failType: 'file_fail',
                    }
                }).catch(e => console.error(prefix, "Error sending download progress (store/verify failure):", e));
                continue;
            }

            // Progress for successfully processed file (either found or downloaded+stored)
            let percent = (totalBytesDownloaded / totalBytesToDownload) * 100;
            let filePercent = (fileBytesDownloaded / fileTotalBytes) * 100;
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                payload: {
                    modelId,
                    file: relativeFileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex: fileChunksDownloaded,
                    totalChunks: fileTotalChunks,
                    fileBytesDownloaded,
                    fileTotalBytes,
                    totalBytesDownloaded,
                    totalBytesToDownload,
                    totalChunksDownloaded,
                    totalChunksToDownload,
                    percent,
                    filePercent,
                    currentFileSource
                }
            }).catch(e => console.error(prefix, "Error sending download progress (success):", e));

            // Log memory after big file
            if (fileTotalBytes > 10 * 1024 * 1024) {
                logMemory(`After file ${relativeFileName}`);
            }

        } catch (error) {
            fileFailed = true;
            failedFiles.push(relativeFileName);
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
                payload: {
                    modelId,
                    file: relativeFileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    error: error.message,
                    failType: 'exception',
                    currentFileSource
                }
            }).catch(e => console.error(prefix, "Error sending download progress (exception):", e));
            // Continue to next file
        }
    }

    console.log(prefix, `Finished processing all ${totalFilesToAttempt} needed files for ${modelId}. Successfully processed ${filesSuccessfullyProcessedCount} files.`);
    if (filesSuccessfullyProcessedCount === totalFilesToAttempt) {
        sendResponseCallback({ success: true, fileMap: successfullyProcessedFileMap, message: `All ${totalFilesToAttempt} assets for ${modelId} are now available in DB.` });
    } else {
        sendResponseCallback({ success: false, fileMap: successfullyProcessedFileMap, error: `Failed to process all assets for ${modelId}. Got ${filesSuccessfullyProcessedCount} of ${totalFilesToAttempt}. Check logs for details.` });
    }

    // --- Final summary report ---
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
        payload: {
            modelId,
            summary: true,
            filesSuccessfullyProcessedCount,
            totalFilesToAttempt,
            failedFiles,
            success: failedFiles.length === 0,
            message: failedFiles.length === 0 ? `All ${totalFilesToAttempt} assets for ${modelId} are now available in DB.` : `Some files failed: ${failedFiles.join(', ')}`
        }
    }).catch(e => console.error(prefix, "Error sending download progress (final summary):", e));
}

webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    if (Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames).includes(type)) {
        return false;
    }
    if (Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames).includes(type)) {
        return false;
    }

    if (!message || !message.type) {
        console.warn(prefix, "Received message from background without type:", message);
        return false; // Indicate that sendResponse will not be called
    }

    if (!allowedMessageTypesFromBackground.has(message.type)) {
        // This message is not for the model loader part of the offscreen document.
        return false; // Allow other listeners to handle it.
    }

    console.log(prefix, `Received message from background: Type: ${message.type}, Payload:`, message.payload);
    const { type: messageType, payload } = message;
    const currentWorker = initializeModelWorker();

    if (!currentWorker && messageType !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS) {
        console.error(prefix, `Cannot handle message type '${messageType}'.  model worker (model-worker.js) is not available, and message is not DOWNLOAD_MODEL_ASSETS.`);
        sendResponse({ success: false, error: " model worker instance is not available or failed to initialize." });
        return false;
    }

    switch (messageType) {
        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS:
            console.log(prefix, `Handling ${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS} for model: ${payload?.modelId}`);
            if (!payload || !payload.modelId) {
                console.error(prefix, `${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.DOWNLOAD_MODEL_ASSETS} request is missing modelId.`);
                sendResponse({ success: false, error: "Model ID not provided for download." });
                return false;
            }
            downloadModelAssetsAndReport(payload.modelId, sendResponse);
            return true; // Indicates async response

        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.INIT:
            console.log(prefix, `Handling ${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.INIT} (to initialize  worker) for model: ${payload?.modelId}`);
            if (!currentWorker) {
                 console.error(prefix, `Cannot forward ${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.INIT}.  model worker instance is null even after initialization attempt.`);
                 sendResponse({ success: false, error: " model worker instance is unexpectedly null." });
                 return false;
            }
            if (!payload || !payload.modelId) {
                console.error(prefix, `${_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.INIT} request is missing modelId.`);
                sendResponse({ success: false, error: "Model ID not provided for  worker initialization." });
                return false;
            }

            const wasmPath = webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.getURL('xenova/transformers/dist/');
            console.log(prefix, `Posting 'init' (internal type for model-worker.js) to  model worker for model ${payload.modelId}. WASM Path: ${wasmPath}`);
            try {
                currentWorker.postMessage({
                    type: 'init', // This 'init' is for model-worker.js
                    payload: {
                        modelId: payload.modelId,
                        wasmPath: wasmPath,
                    }
                });
                sendResponse({ success: true, message: `INIT command for model ${payload.modelId} has been posted to  model worker.` });
            } catch (error) {
                console.error(prefix, `Error posting 'init' (internal type) message to  model worker:`, error);
                sendResponse({ success: false, error: `Error posting INIT to  model worker: ${error.message}` });
            }
            return false;

        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.GENERATE:
        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.INTERRUPT:
        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.RESET:
            if (!workerScriptReady && messageType === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.GENERATE) {
                 console.error(prefix, ` worker script (model-worker.js) is not ready. Cannot forward ${messageType}.`);
                 sendResponse({ success: false, error: ` worker script not ready. Cannot ${messageType}. Wait for worker ready signal.` });
                 return false;
            }
            break;

        // --- ADDED: Handle listModelFiles for pre-load logging ---
        case _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES:
            (async () => {
                try {
                    const { modelId } = message.payload || {};
                    const requestId = message.requestId;
                    if (!modelId) {
                        currentWorker.postMessage({
                            type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: 'No modelId provided' }
                        });
                        return;
                    }
                    // Request file list from background script
                    const docsResult = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES,
                        payload: { modelId }
                    });
                    if (!docsResult.success) {
                        currentWorker.postMessage({
                            type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                            requestId,
                            payload: { success: false, error: docsResult.error }
                        });
                        return;
                    }
                    const files = docsResult.files;
                    currentWorker.postMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: true, files }
                    });
                } catch (err) {
                    const requestId = message.requestId;
                    currentWorker.postMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.ModelLoaderMessageTypes.LIST_MODEL_FILES_RESULT,
                        requestId,
                        payload: { success: false, error: err.message }
                    });
                }
            })();
            return true;

        default:
            console.warn(prefix, `Unhandled allowed message type in switch: ${messageType}`);
            sendResponse({ success: false, error: `Unhandled message type ${messageType} in offscreen worker.` });
            return false;
    }
});

console.log(prefix, "Offscreen script (modelLoaderWorkerOffscreen.js) loaded. Initializing eventBus listener and attempting to create  worker if not present.");
initializeModelWorker();
})();

/******/ })()
;
//# sourceMappingURL=modelLoaderWorkerOffscreen.js.map