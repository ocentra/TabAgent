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

/***/ "./src/Components/HistoryItem.js":
/*!***************************************!*\
  !*** ./src/Components/HistoryItem.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   renderHistoryItemComponent: () => (/* binding */ renderHistoryItemComponent)
/* harmony export */ });
// src/Components/HistoryItem.js

// --- SVG Icons ---
const previewIconSvg = `<svg class="w-4 h-4 action-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>`;
const trashIconSvg = `<svg class="w-4 h-4 action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 17.8798 20.1818C17.1169 21 15.8356 21 13.2731 21H10.7269C8.16438 21 6.8831 21 6.12019 20.1818C5.35728 19.3671 5.27811 18.0864 5.11973 15.5251L4.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M3 5.5H21M16.5 5.5L16.1733 3.57923C16.0596 2.8469 15.9989 2.48073 15.8184 2.21449C15.638 1.94825 15.362 1.75019 15.039 1.67153C14.7158 1.59286 14.3501 1.59286 13.6186 1.59286H10.3814C9.64993 1.59286 9.28419 1.59286 8.96099 1.67153C8.63796 1.75019 8.36201 1.94825 8.18156 2.21449C8.00111 2.48073 7.9404 2.8469 7.82672 3.57923L7.5 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M14 10.5V15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 action-icon"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>`;
const shareIconSvg = `<img src="icons/LinkChain.png" alt="Share" class="w-4 h-4 action-icon-img">`;

// --- Helper functions for inline editing UI ---

function startEditing(historyItemElement) {
    if (!historyItemElement) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');

    if (!previewSpan || !renameInput) return;

    historyItemElement.classList.add('is-editing');
    previewSpan.style.display = 'none';
    renameInput.style.display = 'block';
    renameInput.value = previewSpan.textContent; // Start with current preview text
    renameInput.focus();
    renameInput.select();
}

function cancelEditing(historyItemElement) {
    if (!historyItemElement) return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');

    if (!previewSpan || !renameInput) return;

    renameInput.style.display = 'none';
    previewSpan.style.display = 'block';
    historyItemElement.classList.remove('is-editing');
    // No need to reset value here as it wasn't submitted
}

// --- Main Component Rendering Function ---

function renderHistoryItemComponent(props) {
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
            const newTitle = renameInput.value.trim();
            const originalTitle = previewSpan.textContent;
            if (newTitle && newTitle !== originalTitle) {
                onRenameSubmit(entry.id, newTitle); // Call parent's submit handler
                // Update the preview span immediately for responsiveness
                previewSpan.textContent = newTitle;
                previewSpan.title = newTitle;
                cancelEditing(item); // Exit editing mode after successful submission
            } else {
                // If title is empty or unchanged, just cancel
                cancelEditing(item); 
            }
        });
        renameInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                const newTitle = renameInput.value.trim();
                const originalTitle = previewSpan.textContent; 
                if (newTitle && newTitle !== originalTitle) {
                    onRenameSubmit(entry.id, newTitle); // Call parent's submit handler
                } else {
                    // If title is empty or unchanged, just cancel
                    cancelEditing(item);
                }
            } else if (event.key === 'Escape') {
                 event.preventDefault();
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
    const cardBody = item.querySelector('.card-body');
    // if (cardBody) cardBody.addEventListener('click', (e) => { e.stopPropagation(); onLoadClick(entry.id); });

    return item;
} 

/***/ }),

/***/ "./src/Controllers/DiscoverController.js":
/*!***********************************************!*\
  !*** ./src/Controllers/DiscoverController.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeDiscoverController: () => (/* binding */ initializeDiscoverController)
/* harmony export */ });
// src/Controllers/DiscoverController.js


let isInitialized = false;

function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-discover') {
        return; // Only act when discover page becomes active, if needed
    }
    console.log("[DiscoverController] Discover page activated.");

}

function initializeDiscoverController(/* Pass necessary elements or functions if needed */) {
    if (isInitialized) {
        console.log("[DiscoverController] Already initialized.");
        return;
    }
    console.log("[DiscoverController] Initializing...");
    


    isInitialized = true;
    console.log("[DiscoverController] Initialized successfully.");


    return {}; 
} 

/***/ }),

/***/ "./src/Controllers/DriveController.js":
/*!********************************************!*\
  !*** ./src/Controllers/DriveController.js ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeDriveController: () => (/* binding */ initializeDriveController)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");
 




const GOOGLE_FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

let driveButton;
let driveViewerModal, driveViewerClose, driveViewerList, driveViewerCancel, driveViewerInsert, driveViewerSearch, driveViewerSelectedArea, driveViewerBreadcrumbsContainer, driveViewerBack;
let isDriveOpen = false;
let currentFolderId = 'root';
let currentFolderPath = [{ id: 'root', name: 'Root' }];
let driveFilesCache = {};
let selectedDriveFiles = {};
let isFetchingDriveList = false;
let driveSearchTerm = '';
let showNotificationDep = _notifications_js__WEBPACK_IMPORTED_MODULE_1__.showNotification; 
let debounceDep = null; 

function showDriveViewerModal() {
    console.log("Attempting to show Drive modal...");
    if (isDriveOpen) return;
    if (!driveViewerModal) {
        console.error("DriveViewerModal element not found.");
        return;
    }

    console.log("DriveController: Showing Drive Viewer modal.");
    currentFolderId = 'root';
    currentFolderPath = [{ id: 'root', name: 'Root' }];
    selectedDriveFiles = {};
    driveFilesCache = {};
    driveSearchTerm = '';
    if (driveViewerSearch) driveViewerSearch.value = '';
    updateInsertButtonState();
    renderSelectedFiles();
    console.log("Fetching root content and making modal visible.");
    fetchAndDisplayViewerFolderContent('root');
    driveViewerModal.classList.remove('hidden');
    isDriveOpen = true;
}

function hideDriveViewerModal() {
    if (!isDriveOpen) return;
    if (!driveViewerModal) return;
    console.log("DriveController: Hiding Drive Viewer modal.");
    driveViewerModal.classList.add('hidden');
    isDriveOpen = false;
    if (driveViewerList) {
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`; // Reset list content on close
    }
}


function getFallbackIcon(mimeType) {
    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" /></svg>';
    }

    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>';
}

function renderDriveViewerItems(items) {
    console.log(`[DriveController:Render] renderDriveViewerItems called with ${items?.length ?? 0} items.`); // Log entry
    if (!driveViewerList) return;
    driveViewerList.innerHTML = ''; 

    const searchTermLower = driveSearchTerm.toLowerCase();
    const filteredItems = driveSearchTerm
        ? items.filter(item => item.name.toLowerCase().includes(searchTermLower))
        : items;

    if (!filteredItems || filteredItems.length === 0) {
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">${driveSearchTerm ? 'No results found.' : 'Folder is empty.'}</div>`;
        return;
    }

    filteredItems.forEach(item => {
        const isFolder = item.mimeType === GOOGLE_FOLDER_MIME_TYPE;
        const itemElement = document.createElement('div');
        itemElement.className = 'drive-viewer-item flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer'; // Tailwind classes from old code
        itemElement.dataset.id = item.id;
        itemElement.dataset.name = item.name;
        itemElement.dataset.mimeType = item.mimeType;
        itemElement.dataset.iconLink = item.iconLink || ''; 

        const iconDiv = document.createElement('div');
        iconDiv.className = 'flex-shrink-0 w-6 h-6 mr-3 flex items-center justify-center';
        if (item.iconLink) {
            iconDiv.innerHTML = `<img src="${item.iconLink}" alt="${isFolder ? 'Folder' : 'File'}" class="w-5 h-5">`;
        } else {
            iconDiv.innerHTML = getFallbackIcon(item.mimeType); 
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'flex-grow truncate';
        nameSpan.textContent = item.name;
        nameSpan.title = item.name; 

        itemElement.appendChild(iconDiv);
        itemElement.appendChild(nameSpan);

        if (selectedDriveFiles[item.id]) {
            itemElement.classList.add('selected'); 
        }

        itemElement.addEventListener('click', handleDriveItemClick);

        driveViewerList.appendChild(itemElement);
    });
}

function fetchAndDisplayViewerFolderContent(folderId) {
    if (!driveViewerList || isFetchingDriveList) {
        return;
    }

    isFetchingDriveList = true;
    console.log(`DriveController: Fetching Drive content for folder: ${folderId}`);
    updateBreadcrumbs(); 
    updateHeaderState(); 

    driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Loading...</div>`;

    if (driveFilesCache[folderId]) {
        console.log(`DriveController: Using cached content for folder: ${folderId}`);
        renderDriveViewerItems(driveFilesCache[folderId]);
        isFetchingDriveList = false;
        return;
    }

    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.RuntimeMessageTypes.GET_DRIVE_FILE_LIST,
        folderId: folderId
    })
    .then((response) => {
        isFetchingDriveList = false;
        if (response && response.success && response.files) {
            console.log(`[DriveController] Success! Caching and rendering ${response.files.length} files.`);
            driveFilesCache[folderId] = response.files;
            renderDriveViewerItems(response.files);
        } else {
            const errorMsg = response?.error || 'Unknown error fetching files.';
            console.error(`[DriveController] Drive file list error for ${folderId}: ${errorMsg}`);
            showNotificationDep(`Error fetching folder content: ${errorMsg}`, 'error');
            if (driveViewerList) {
                driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
            }
        }
    })
    .catch((error) => {
        isFetchingDriveList = false;
        console.error("[DriveController] Error sending getDriveFileList message:", error?.message || error);
        showNotificationDep(`Error contacting background script: ${error?.message || 'Unknown error'}`, 'error');
        if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
    });
}

function handleDriveItemClick(event) {
    event.stopPropagation();
    const itemElement = event.currentTarget;
    const itemId = itemElement.dataset.id;
    const itemName = itemElement.dataset.name;
    const mimeType = itemElement.dataset.mimeType;
    const iconLink = itemElement.dataset.iconLink;

    if (!itemId || !mimeType) {
        console.error("DriveController: Clicked Drive item missing ID or mimeType.");
        return;
    }

    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        console.log(`DriveController: Navigating into folder: ${itemName} (${itemId})`);
        currentFolderId = itemId;
        currentFolderPath.push({ id: itemId, name: itemName }); 
        driveSearchTerm = ''; 
        if (driveViewerSearch) driveViewerSearch.value = '';
        fetchAndDisplayViewerFolderContent(itemId);
    } else {
        console.log(`DriveController: Toggling selection for file: ${itemName} (${itemId})`);
        toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType: mimeType, iconLink: iconLink });
    }
}

function updateBreadcrumbs() {
    if (!driveViewerBreadcrumbsContainer) return;
    driveViewerBreadcrumbsContainer.innerHTML = '';
    currentFolderPath.forEach((folder, index) => {
        const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? 'span' : 'button');
        crumbElement.textContent = folder.name;
        crumbElement.dataset.id = folder.id; 
        crumbElement.dataset.index = index; 
        if (index < currentFolderPath.length - 1) {
            crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer'; 
            crumbElement.addEventListener('click', handleBreadcrumbClick);
            const separator = document.createElement('span');
            separator.textContent = ' / ';
            separator.className = 'mx-1 text-gray-400';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
            driveViewerBreadcrumbsContainer.appendChild(separator);
        } else {
            crumbElement.className = 'font-semibold';
            driveViewerBreadcrumbsContainer.appendChild(crumbElement);
        }
    });
}

function handleBreadcrumbClick(event) {
    const targetIndex = parseInt(event.currentTarget.dataset.index, 10);
    const targetFolderId = event.currentTarget.dataset.id;

    if (isNaN(targetIndex) || !targetFolderId) {
        console.error("DriveController: Invalid breadcrumb data.");
        return;
    }
    if (targetFolderId === currentFolderId) return;

    console.log(`DriveController: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
    currentFolderPath = currentFolderPath.slice(0, targetIndex + 1);
    currentFolderId = targetFolderId; 
    driveSearchTerm = ''; 
    if (driveViewerSearch) driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(targetFolderId);
}

function toggleFileSelection(fileId, element, fileData) {
    if (selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        element?.classList.remove('selected');
    } else {
        selectedDriveFiles[fileId] = fileData;
        element?.classList.add('selected');
    }
    renderSelectedFiles();
    updateInsertButtonState();
}

function renderSelectedFiles() {
    if (!driveViewerSelectedArea) return;

    const selectedIds = Object.keys(selectedDriveFiles);
    const pillContainer = driveViewerSelectedArea; 

    if (!pillContainer) {
         console.error("Selected area container not found");
         return;
    }

    const pillInnerContainer = pillContainer.querySelector('.flex-wrap') || pillContainer; 
    pillInnerContainer.innerHTML = ''; 

    if (selectedIds.length === 0) {
        pillContainer.classList.add('hidden'); 
    } else {
        pillContainer.classList.remove('hidden');
        selectedIds.forEach(id => {
            const file = selectedDriveFiles[id];
            const pill = document.createElement('span');
            pill.className = 'selected-file-item'; 

            const iconHtml = file.iconLink ? `<img src="${file.iconLink}" alt="" class="w-3 h-3 mr-1.5">` : '';
            const removeBtnHtml = `<button class="selected-file-remove" data-id="${id}">&times;</button>`;

            pill.innerHTML = `${iconHtml}${file.name} ${removeBtnHtml}`;
            pillInnerContainer.appendChild(pill);

            const removeBtn = pill.querySelector('.selected-file-remove');
            removeBtn?.addEventListener('click', handleRemoveSelectedFile);
        });
    }
}


function handleRemoveSelectedFile(event) {
    const fileId = event.currentTarget.dataset.id;
    if (fileId && selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        renderSelectedFiles();
        updateInsertButtonState();
        const listItem = driveViewerList?.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
        listItem?.classList.remove('selected');
    }
}

function updateInsertButtonState() {
    if (!driveViewerInsert) return;
    const count = Object.keys(selectedDriveFiles).length;
    driveViewerInsert.disabled = count === 0;
    driveViewerInsert.textContent = `Insert (${count})`;
}

let debouncedDriveSearchHandler = null;
function handleDriveSearchInput(event) {
    driveSearchTerm = event.target.value.trim();
    console.log(`DriveController: Filtering Drive items by term: "${driveSearchTerm}"`);
    if (driveFilesCache[currentFolderId]) {
        renderDriveViewerItems(driveFilesCache[currentFolderId]);
    } else {
        driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not loaded or empty.</div>`;
    }
}

function handleDriveBackButtonClick() {
    if (currentFolderPath.length <= 1) return; 

    const parentFolder = currentFolderPath[currentFolderPath.length - 2]; 
    currentFolderPath.pop();
    currentFolderId = parentFolder.id; 
    console.log(`DriveController: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
    driveSearchTerm = ''; 
    if (driveViewerSearch) driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(parentFolder.id);
}

function updateHeaderState() {
    if (!driveViewerBack) return;
    if (currentFolderPath.length > 1) {
        driveViewerBack.classList.remove('hidden');
    } else {
        driveViewerBack.classList.add('hidden');
    }
}

function initializeDriveController(dependencies) {
    console.log("Initializing DriveController...");

    if (!dependencies || !dependencies.showNotification || !dependencies.debounce) {
        console.error("DriveController requires dependencies: showNotification, debounce!");
        return; 
    }
    showNotificationDep = dependencies.showNotification;
    debounceDep = dependencies.debounce;
    driveButton = document.getElementById('drive-button');
    driveViewerModal = document.getElementById('drive-viewer-modal');
    driveViewerClose = document.getElementById('drive-viewer-close');
    driveViewerList = document.getElementById('drive-viewer-list');
    driveViewerCancel = document.getElementById('drive-viewer-cancel');
    driveViewerInsert = document.getElementById('drive-viewer-insert');
    driveViewerSearch = document.getElementById('drive-viewer-search');
    driveViewerSelectedArea = document.getElementById('drive-viewer-selected');
    driveViewerBreadcrumbsContainer = document.getElementById('drive-viewer-breadcrumbs');
    driveViewerBack = document.getElementById('drive-viewer-back');

    if (!driveViewerModal || !driveViewerList) {
        console.error("DriveController: Essential modal elements (#drive-viewer-modal, #drive-viewer-list) not found!");
        return; 
    }

    if (driveButton) {
        driveButton.addEventListener('click', handleDriveButtonClick);
    }
    if (driveViewerClose) {
        driveViewerClose.addEventListener('click', hideDriveViewerModal);
    }
    if (driveViewerCancel) {
        driveViewerCancel.addEventListener('click', hideDriveViewerModal);
    }
    if (driveViewerInsert) {
        driveViewerInsert.addEventListener('click', () => {
            console.warn("Insert button functionality not yet implemented.");
            // Placeholder: Insert selected files into chat
            // You'll need access to the chat input/send mechanism here
            hideDriveViewerModal();
        });
    }
    if (driveViewerSearch && debounceDep) {
         driveViewerSearch.addEventListener('input', debounceDep(handleDriveSearchInput, 300));
     } else if (driveViewerSearch) {
         console.warn("Debounce dependency missing, search will trigger on every keypress.");
         driveViewerSearch.addEventListener('input', handleDriveSearchInput);
     }
    if (driveViewerBack) {
        driveViewerBack.addEventListener('click', handleDriveBackButtonClick);
    }

    console.log("DriveController Initialized successfully.");
}


const handleDriveButtonClick = (event) => {
    console.log("Drive button clicked!");
    event.stopPropagation(); 
    showDriveViewerModal();
};



/***/ }),

/***/ "./src/Controllers/HistoryPopupController.js":
/*!***************************************************!*\
  !*** ./src/Controllers/HistoryPopupController.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeHistoryPopup: () => (/* binding */ initializeHistoryPopup)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Components/HistoryItem.js */ "./src/Components/HistoryItem.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../navigation.js */ "./src/navigation.js");
/* harmony import */ var _Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../Utilities/downloadUtils.js */ "./src/Utilities/downloadUtils.js");
// src/Controllers/HistoryPopupController.js











let isInitialized = false;
let historyPopupElement = null;
let historyListElement = null;
let historySearchElement = null;
let closeHistoryButtonElement = null;
let requestDbAndWaitFunc = null;

let currentHistoryItems = []; 
let currentSearchTerm = '';

function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.payload || !notification.payload.session) {
        console.warn("[HistoryPopupController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = updatedSessionData.id;
    const updateType = notification.payload.updateType || 'update'; 

    if (!updatedSessionData) {
        console.warn(`[HistoryPopupController] Session update notification for ${sessionId} missing session data.`, notification);
        return;
    }

    console.log(`[HistoryPopupController] Received session update for ${sessionId}. Type: ${updateType}, New starred: ${updatedSessionData.isStarred}`);

    const itemIndex = currentHistoryItems.findIndex(item => item.id === sessionId); 

    let listChanged = false;

    if (updateType === 'delete') {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Removing deleted session ${sessionId} from local list.`);
            currentHistoryItems.splice(itemIndex, 1);
            listChanged = true;
        }
    } else {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Updating session ${sessionId} in local list.`);
            currentHistoryItems[itemIndex] = { 
                ...currentHistoryItems[itemIndex], 
                ...updatedSessionData
            };
            listChanged = true; 
        } else {
            console.log(`[HistoryPopupController] Adding new/updated session ${sessionId} to local list.`);
            currentHistoryItems.push(updatedSessionData); 
            listChanged = true;
        }
    }

    if (listChanged && historyPopupElement && !historyPopupElement.classList.contains('hidden')) {
        console.log(`[HistoryPopupController] Popup visible and list changed, calling renderHistoryList()`);
        renderHistoryList(); 
    } else {
        console.log(`[HistoryPopupController] Popup not visible or list unchanged, skipping renderHistoryList()`);
    }
}

function renderHistoryList() {
    if (!isInitialized || !historyListElement) return;
    console.log(`[HistoryPopupController] Rendering history list (Search: "${currentSearchTerm}")...`);

    let filteredItems = currentHistoryItems;
    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        filteredItems = currentHistoryItems.filter(entry => 
            (entry.name || '').toLowerCase().includes(lowerCaseTerm)
        );
        console.log(`[HistoryPopupController] Filtered down to ${filteredItems.length} sessions.`);
    } else {
        console.log(`[HistoryPopupController] Rendering all ${filteredItems.length} sessions (no search term).`);
    }

    historyListElement.innerHTML = ''; 

    if (filteredItems.length === 0) {
        const message = currentSearchTerm
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No history items match "${currentSearchTerm}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No chat history yet.</p>';
        historyListElement.innerHTML = message;
    } else {
        filteredItems.forEach(entry => {
            const props = {
                entry: {
                    id: entry.id,
                    name: entry.title,
                    title: entry.title,
                    timestamp: entry.timestamp,
                    isStarred: entry.isStarred,
                    messages: [] 
                },
                onLoadClick: handleLoadClick,
                onStarClick: handleStarClick,
                onDeleteClick: handleDeleteClick,
                onRenameSubmit: handleRenameSubmit,
                onDownloadClick: handleDownloadClick,
                onShareClick: handleShareClick,
                onPreviewClick: handlePreviewClick
            };
            const itemElement = (0,_Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_2__.renderHistoryItemComponent)(props);
            if (itemElement) {
                historyListElement.appendChild(itemElement);
            }
        });
    }
    console.log("[HistoryPopupController] History list rendered.");
}

async function showPopup() { 
    if (!isInitialized || !historyPopupElement || !requestDbAndWaitFunc) return;
    console.log("[Trace][HistoryPopupController] showPopup: Requesting all sessions...");
    try {
        const sessionsArray = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsRequest());
        console.log("[Trace][HistoryPopupController] showPopup: Received sessionsArray:", sessionsArray);
        if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
             console.log("[Trace][HistoryPopupController] showPopup: First session item sample:", sessionsArray[0]);
        } else if (sessionsArray === null || sessionsArray === undefined) {
             console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is null or undefined.");
        } else {
             console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is empty or not an array:", typeof sessionsArray);
        }
        currentHistoryItems = sessionsArray || []; 
        console.log(`[Trace][HistoryPopupController] showPopup: Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
        renderHistoryList(); 
        historyPopupElement.classList.remove('hidden');
    } catch (error) {
        console.error("[Trace][HistoryPopupController] showPopup: Error fetching history list:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Failed to load history.", 'error');
        if (historyListElement) {
            historyListElement.innerHTML = '<p class="p-4 text-center text-red-500 dark:text-red-400">Error loading history. Please try again.</p>';
        }
        historyPopupElement.classList.remove('hidden'); 
    }
}

function hidePopup() {
    if (!isInitialized || !historyPopupElement) return;
    console.log("[HistoryPopupController] Hiding popup.");
    historyPopupElement.classList.add('hidden');
}

function handleSearchInput(event) {
    if (!isInitialized) return;
    currentSearchTerm = event.target.value.trim();
    renderHistoryList(); 
}


async function handleLoadClick(sessionId) {
    console.log(`[HistoryPopupController] Load clicked: ${sessionId}`);
    if (!sessionId) return;
    try {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ lastSessionId: sessionId });
        (0,_navigation_js__WEBPACK_IMPORTED_MODULE_5__.navigateTo)('page-home');
        hidePopup();
    } catch (error) {
        console.error("[HistoryPopupController] Error setting storage or navigating:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Failed to load chat.", 'error');
    }
}

async function handleStarClick(sessionId) {
    if (!sessionId || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Star toggled", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error toggling star:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to toggle star: ${error.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId, itemElement) {
    if (!sessionId || !itemElement || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Delete confirmed inline for: ${sessionId}. Applying deleting state.`);
    
    itemElement.classList.add('is-deleting'); 
    itemElement.querySelectorAll('button').forEach(btn => btn.disabled = true);

    const footer = itemElement.querySelector('.card-footer');
    const existingMsg = footer?.querySelector('.deleting-message'); 
    if (footer && !existingMsg) { 
        const deletingMsg = document.createElement('span');
        deletingMsg.textContent = 'Deleting...';
        deletingMsg.className = 'text-xs text-red-500 ml-2 deleting-message';
        footer.appendChild(deletingMsg);
    }

    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Chat deletion initiated...", 'info'); 
    } catch (error) {
        console.error("[HistoryPopupController] Error deleting chat:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to delete chat: ${error.message}`, 'error');
        itemElement.classList.remove('is-deleting'); 
        itemElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        footer?.querySelector('.deleting-message')?.remove();
        const normalActionsContainer = itemElement.querySelector('[data-normal-container]');
        if(normalActionsContainer) normalActionsContainer.classList.remove('hidden');
        const confirmActionsContainer = itemElement.querySelector('[data-confirm-container]');
        if(confirmActionsContainer) confirmActionsContainer.classList.add('hidden');
    }
}

async function handleRenameSubmit(sessionId, newName) {
    if (!sessionId || !newName || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Rename submitted: ${sessionId} to "${newName}"`);
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Rename successful", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error submitting rename:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {
    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_6__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, _notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification);
    } else {
        console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Download failed: Internal setup error.", 'error');
    }
}

function handleShareClick(sessionId) {
   
}

async function handlePreviewClick(sessionId, contentElement) {
    if (!sessionId || !contentElement || !requestDbAndWaitFunc) {
        console.error("[HistoryPopupController] Preview failed: Missing sessionId, contentElement, or requestDbAndWaitFunc.");
        return;
    }
    
    console.log(`[HistoryPopupController] Handling preview click for: ${sessionId}`);
    contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 italic text-xs">Loading preview...</span>'; 

    try {
        const sessionData = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest(sessionId));
        
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">No messages in this chat.</span>';
            return;
        }

        const messagesToPreview = sessionData.messages.slice(0, 3);

        const previewHtml = messagesToPreview.map(msg => {
            const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
            const text = (msg.text || '')
                         .replace(/</g, "&lt;")
                         .replace(/>/g, "&gt;")
                         .substring(0, 100) + (msg.text && msg.text.length > 100 ? '...' : '');
            return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
        }).join('');

        contentElement.innerHTML = previewHtml; 

    } catch (error) {
        console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, error);
        contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${error.message}</span>`;
    }
}

document.addEventListener(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type, (e) => handleSessionUpdate(e.detail));
function initializeHistoryPopup(elements, requestFunc) {
    console.log("[HistoryPopupController] Entering initializeHistoryPopup...");

    if (!elements || !elements.popupContainer || !elements.listContainer || !elements.searchInput || !elements.closeButton || !requestFunc) {
        console.error("[HistoryPopupController] Initialization failed: Missing required elements or request function.", { elements, requestFunc });
        return null;
    }

    historyPopupElement = elements.popupContainer;
    historyListElement = elements.listContainer;
    historySearchElement = elements.searchInput;
    closeHistoryButtonElement = elements.closeButton;
    requestDbAndWaitFunc = requestFunc;
    console.log("[HistoryPopupController] Elements and request function assigned.");

    try {
        closeHistoryButtonElement.addEventListener('click', hidePopup);
        const debouncedSearchHandler = (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_3__.debounce)(handleSearchInput, 300);
        historySearchElement.addEventListener('input', debouncedSearchHandler);
        
        isInitialized = true;
        console.log("[HistoryPopupController] Initialization successful. History will be rendered when popup is shown.");

        return {
            show: showPopup,
            hide: hidePopup
        };
    } catch (error) {
        console.error("[HistoryPopupController] Error during initialization listeners/subscriptions:", error);
        isInitialized = false;
        return null; 
    }
}


/***/ }),

/***/ "./src/Controllers/LibraryController.js":
/*!**********************************************!*\
  !*** ./src/Controllers/LibraryController.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeLibraryController: () => (/* binding */ initializeLibraryController)
/* harmony export */ });
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Components/HistoryItem.js */ "./src/Components/HistoryItem.js");
/* harmony import */ var _Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Utilities/downloadUtils.js */ "./src/Utilities/downloadUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../navigation.js */ "./src/navigation.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");


 
 
 
 
 // Adjust path if necessary

let isInitialized = false;
let starredListElement = null;
let librarySearchInput = null; 
let requestDbAndWaitFunc = null; 
let currentStarredItems = [];
let currentSearchFilter = ''; 
let searchListenerAttached = false; 


async function handleStarClick(sessionId) {
    console.log(`[LibraryController] Star clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__.DbToggleStarRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Star toggled", 'success');
    } catch (error) {
        console.error("[LibraryController] Error toggling star:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to toggle star: ${error.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId) {
    console.log(`[LibraryController] Delete clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
        try {
            await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__.DbDeleteSessionRequest(sessionId));
            (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Chat deleted", 'success');
        } catch (error) {
            console.error("[LibraryController] Error deleting chat:", error);
            (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to delete chat: ${error.message}`, 'error');
        }
    }
}

async function handleRenameSubmit(sessionId, newName) {
    console.log(`[LibraryController] Rename submitted: ${sessionId} to "${newName}"`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Rename successful", 'success');
    } catch (error) {
        console.error("[LibraryController] Error submitting rename:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {

    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_2__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, _notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification);
    } else {
        console.error("[LibraryController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Download failed: Internal setup error.", 'error');
    }
}

async function handleLoadClick(sessionId) {
    console.log(`[LibraryController] Load clicked: ${sessionId}`);
    try {
        await chrome.storage.local.set({ lastSessionId: sessionId });
        (0,_navigation_js__WEBPACK_IMPORTED_MODULE_5__.navigateTo)('page-home'); 
    } catch (error) {
        console.error("[LibraryController] Error setting storage or navigating:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Failed to load chat.", 'error');
        await chrome.storage.local.remove('lastSessionId');
    }
}

function handleShareClick(sessionId) {
    console.log(`[LibraryController] Share clicked: ${sessionId}`);
    (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Share functionality not yet implemented.", 'info');
}

function handlePreviewClick(sessionId, contentElement) {
    console.log(`[LibraryController] Preview clicked: ${sessionId}`);
    (0,_notifications_js__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Preview functionality not yet implemented.", 'info');
    if (contentElement) {
        contentElement.innerHTML = 'Preview loading...';
        contentElement.classList.toggle('hidden');
    }
}



function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-library') {
        return; 
    }
    console.log("[LibraryController] Library page activated.");

    if (!searchListenerAttached) {
        librarySearchInput = document.getElementById('library-search');
        if (librarySearchInput) {
            librarySearchInput.addEventListener('input', handleSearchInput);
            searchListenerAttached = true;
            console.log("[LibraryController] Search input listener attached.");
        } else {
            console.warn("[LibraryController] Library search input (#library-search) still not found even when page is active.");
        }
    }
    
    fetchAndRenderLibrary(); 
}

async function fetchAndRenderLibrary() {
    if (!isInitialized || !starredListElement || !requestDbAndWaitFunc) {
        console.error("[LibraryController] Cannot fetch/render - not initialized or missing elements/functions.");
        return;
    }
    console.log("[LibraryController] Fetching starred items...");
    starredListElement.innerHTML = '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">Loading starred items...</p>';
    currentSearchFilter = librarySearchInput?.value.trim() || ''; 

    try {
        const responsePayload = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__.DbGetStarredSessionsRequest());
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []); 
        console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter); 
    } catch (error) {
        console.error("[LibraryController] Error fetching starred items:", error);
        starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
    }
}

function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.payload || !notification.payload.session) {
        console.warn("[LibraryController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = updatedSessionData.id;

    if (!updatedSessionData) {
         console.warn(`[LibraryController] Session update notification for ${sessionId} missing session data in payload.session.`, notification);
         return;
    }
    
    console.log(`[LibraryController] Received session update for ${sessionId}. New starred status: ${updatedSessionData.isStarred}`);

    const itemIndex = currentStarredItems.findIndex(item => item.sessionId === sessionId); 

    if (updatedSessionData.isStarred) {
        if (itemIndex === -1) {
            console.log(`[LibraryController] Session ${sessionId} is newly starred. Adding to list.`);

             const newItem = {
                 sessionId: sessionId,
                 name: updatedSessionData.title || 'Untitled', 
                 lastUpdated: updatedSessionData.timestamp || Date.now(), 
                 isStarred: true
             };
             currentStarredItems.push(newItem);
        } else {
            console.log(`[LibraryController] Session ${sessionId} was already starred. Updating data.`);
            currentStarredItems[itemIndex] = {
                ...currentStarredItems[itemIndex], 
                name: updatedSessionData.title || currentStarredItems[itemIndex].name, 
                lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated, 
                isStarred: true
            };
        }
    } else {
        if (itemIndex !== -1) {
            console.log(`[LibraryController] Session ${sessionId} is no longer starred. Removing from list.`);
            currentStarredItems.splice(itemIndex, 1);
        } else {
             console.log(`[LibraryController] Session ${sessionId} is not starred and was not in the list.`);
        }
    }

    const libraryPage = document.getElementById('page-library');
    if (libraryPage && !libraryPage.classList.contains('hidden')) {
        console.log("[LibraryController] Library page is active, re-rendering list with filter.");
        currentSearchFilter = librarySearchInput?.value.trim() || '';
        renderLibraryList(currentSearchFilter);
    } else {
        console.log("[LibraryController] Library page not active, internal list updated passively.");
    }
}

document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_6__.UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handleNavigationChange(e.detail));

function renderLibraryList(filter = '') {
    if (!isInitialized || !starredListElement) return;
    console.log(`[LibraryController] Rendering with filter "${filter}"`);
    
    let itemsToRender = [...currentStarredItems];

    if (filter) {
        const searchTerm = filter.toLowerCase();
        itemsToRender = itemsToRender.filter(entry =>
            (entry.name || '').toLowerCase().includes(searchTerm)
        );
    }

    itemsToRender.sort((a, b) => b.lastUpdated - a.lastUpdated);

    starredListElement.innerHTML = ''; 

    if (itemsToRender.length === 0) {
        const message = filter
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items match "${filter}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items yet.</p>';
        starredListElement.innerHTML = message;
    } else {
        itemsToRender.forEach(entry => {
            const props = {
                entry: {
                    id: entry.sessionId,
                    name: entry.name,
                    title: entry.name,
                    timestamp: entry.lastUpdated,
                    isStarred: entry.isStarred,
                    messages: [] 
                },
                onLoadClick: handleLoadClick,
                onStarClick: handleStarClick,
                onDeleteClick: handleDeleteClick,
                onRenameSubmit: handleRenameSubmit,
                onDownloadClick: handleDownloadClick,
                onShareClick: handleShareClick, 
                onPreviewClick: handlePreviewClick 
            };
            const itemElement = (0,_Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_1__.renderHistoryItemComponent)(props);
            if (itemElement) {
                starredListElement.appendChild(itemElement);
            }
        });
    }
     console.log(`[LibraryController] Rendered ${itemsToRender.length} items.`);
}

const handleSearchInput = (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_4__.debounce)((event) => {
    if (!isInitialized) return;
    currentSearchFilter = event.target.value.trim();
    console.log(`[LibraryController] Search input changed: "${currentSearchFilter}"`);
    renderLibraryList(currentSearchFilter);
}, 300);

function initializeLibraryController(elements, requestFunc) {
    console.log("[LibraryController] Initializing...");
    if (!elements || !elements.listContainer || !requestFunc) { // Removed searchInput from mandatory checks here, handled in navigation
        console.error("[LibraryController] Initialization failed: Missing required elements (listContainer) or request function.", { elements, requestFunc });
        return null;
    }

    starredListElement = elements.listContainer;
    requestDbAndWaitFunc = requestFunc;
    console.log("[LibraryController] Elements and request function assigned.");

    isInitialized = true;
    console.log("[LibraryController] Initialization successful. Library will render when activated.");

    return {

    };
} 

/***/ }),

/***/ "./src/Controllers/SettingsController.js":
/*!***********************************************!*\
  !*** ./src/Controllers/SettingsController.js ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSettingsController: () => (/* binding */ initializeSettingsController)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _sidepanel_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../sidepanel.js */ "./src/sidepanel.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
// src/Controllers/SettingsController.js



let isInitialized = false;

const updateThemeButtonText = (button) => {
    if (!button) return;
    const isDarkMode = document.documentElement.classList.contains('dark');
    button.textContent = isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode';
};

function setupThemeToggle() {
    const settingsPageContainer = document.getElementById('page-settings');
    if (!settingsPageContainer) {
        console.warn("[SettingsController] Could not find #page-settings container.");
        return;
    }

    let themeToggleButton = settingsPageContainer.querySelector('#theme-toggle-button');

    if (!themeToggleButton) {
        console.log("[SettingsController] Creating theme toggle button.");
        themeToggleButton = document.createElement('button');
        themeToggleButton.id = 'theme-toggle-button';
        themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-4'; // Standard styling

        themeToggleButton.onclick = () => {
            const htmlElement = document.documentElement;
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            console.log(`[SettingsToggle] Before toggle - isDark: ${isCurrentlyDark}`);

            if (isCurrentlyDark) {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                console.log(`[SettingsToggle] Removed dark class, set localStorage to light`);
            } else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
            }
            updateThemeButtonText(themeToggleButton); 
        };
        
        const placeholderText = settingsPageContainer.querySelector('p');
        if (placeholderText) {
            placeholderText.insertAdjacentElement('afterend', themeToggleButton);
        } else {
            settingsPageContainer.appendChild(themeToggleButton);
        }
    } else {
        console.log("[SettingsController] Theme toggle button already exists.");
    }

    updateThemeButtonText(themeToggleButton);
}

function setupSlider(sliderId, valueSpanId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueSpanId);

    if (slider && valueSpan) {
        valueSpan.textContent = slider.value;
        slider.addEventListener('input', (event) => {
            valueSpan.textContent = event.target.value;
        });
        console.log(`[SettingsController] Setup slider ${sliderId} with value display ${valueSpanId}`);
    } else {
        if (!slider) console.warn(`[SettingsController] Slider element not found: #${sliderId}`);
        if (!valueSpan) console.warn(`[SettingsController] Value span element not found: #${valueSpanId}`);
    }
}

function initializeSettingsController() {
    if (isInitialized) {
        console.log("[SettingsController] Already initialized.");
        return;
    }
    console.log("[SettingsController] Initializing...");

    setupThemeToggle();
    
    setupSlider('setting-temperature', 'setting-temperature-value');
    setupSlider('setting-repeat-penalty', 'setting-repeat-penalty-value');
    setupSlider('setting-top-p', 'setting-top-p-value');
    setupSlider('setting-min-p', 'setting-min-p-value');

    const viewLogsButton = document.getElementById('viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            console.log('[SettingsController] View Logs button clicked. Opening log viewer popup...');
            try {
                const viewerUrl = 'sidepanel.html?view=logs'; 
                
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().windows.create({
                     url: viewerUrl,
                     type: 'popup',
                     width: 800,
                     height: 600
                 });
            } catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);

            }
        });
        console.log('[SettingsController] Added listener to View Logs button.');

        const resetDbButton = document.getElementById('resetDbButton');
        if (resetDbButton) {
            resetDbButton.addEventListener('click', async () => {
                console.log('[SettingsController] Reset DB button clicked.');
                try {
                    const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbResetDatabaseRequest();
                    const result = await (0,_sidepanel_js__WEBPACK_IMPORTED_MODULE_1__.sendDbRequestSmart)(request);
                    if (result && result.success) {
                        alert('Database reset successfully!');
                    } else {
                        alert('Database reset failed.');
                    }
                    console.log('[SettingsController] Reset DB result:', result);
                } catch (e) {
                    alert('Failed to reset database: ' + (e.message || e));
                    console.error('[SettingsController] Reset DB error:', e);
                }
            });
        }
        console.log('[SettingsController] Added Reset DB button next to View Logs button.');
    } else {
        console.warn('[SettingsController] View Logs button (viewLogsButton) not found.');
    }


    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");

    return {}; 
} 

/***/ }),

/***/ "./src/Controllers/SpacesController.js":
/*!*********************************************!*\
  !*** ./src/Controllers/SpacesController.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSpacesController: () => (/* binding */ initializeSpacesController)
/* harmony export */ });
// src/Controllers/SpacesController.js



let isInitialized = false;

function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-spaces') {
        return; 
    }
    console.log("[SpacesController] Spaces page activated.");

}

function initializeSpacesController(/* Pass necessary elements or functions if needed */) {
    if (isInitialized) {
        console.log("[SpacesController] Already initialized.");
        return;
    }
    console.log("[SpacesController] Initializing...");
    


    isInitialized = true;
    console.log("[SpacesController] Initialized successfully.");


    return {}; 
} 

/***/ }),

/***/ "./src/Home/chatRenderer.js":
/*!**********************************!*\
  !*** ./src/Home/chatRenderer.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   clearTemporaryMessages: () => (/* binding */ clearTemporaryMessages),
/* harmony export */   displayWelcomeMessage: () => (/* binding */ displayWelcomeMessage),
/* harmony export */   initializeRenderer: () => (/* binding */ initializeRenderer),
/* harmony export */   renderTemporaryMessage: () => (/* binding */ renderTemporaryMessage),
/* harmony export */   scrollToBottom: () => (/* binding */ scrollToBottom),
/* harmony export */   setActiveSessionId: () => (/* binding */ setActiveSessionId)
/* harmony export */ });
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../Utilities/dbChannels.js */ "./src/Utilities/dbChannels.js");







let chatBodyElement = null;
let currentSessionId = null;
let requestDbAndWaitFunc = null;
let observer = null; // MutationObserver
const TEMP_MESSAGE_CLASS = 'temp-status-message'; // Class for temporary messages

function handleMessagesUpdate(notification) {
    console.log('[ChatRenderer handleMessagesUpdate] handleMessagesUpdate received notification:', JSON.parse(JSON.stringify(notification)));
    if (!notification || !notification.sessionId || !notification.payload) {
        console.warn('[ChatRenderer][DEBUG] handleMessagesUpdate: Invalid or incomplete notification received. Bailing out.', { notification });
        return;
    }
    
    if (notification.sessionId === currentSessionId) {
        console.log(`[ChatRenderer handleMessagesUpdate] Received message update notification for active session ${currentSessionId}. Rendering.`);
        
        let messages = notification.payload.messages;
        if (!Array.isArray(messages)) {
            console.error('[ChatRenderer handleMessagesUpdate] ERROR: notification.payload.messages is not an array! Got:', notification.payload);
            return;
        }
        
        console.log(`[ChatRenderer handleMessagesUpdate] Messages array received:`, JSON.stringify(messages));
        if (!chatBodyElement) return;
        chatBodyElement.innerHTML = '';
        if (messages.length === 0) {
            console.log(`[ChatRenderer handleMessagesUpdate] Active session ${currentSessionId} has no messages. Displaying welcome.`);
            displayWelcomeMessage();
        } else {
            messages.forEach(msg => renderSingleMessage(msg));
            scrollToBottom();
        }
    }
}

function handleSessionMetadataUpdate(notification) {
    if (!notification || !notification.sessionId || !notification.payload?.session) return;

    if (notification.sessionId === currentSessionId) {
        const updatedSessionData = notification.payload.session;
        console.log(`[ChatRenderer] Received metadata update for active session ${currentSessionId}. New Title: ${updatedSessionData.title}, Starred: ${updatedSessionData.isStarred}`);
        
        updateChatHeader(updatedSessionData);
    }
}

document.addEventListener(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbMessagesUpdatedNotification.type, (e) => {
    console.log('[ChatRenderer] document event received for DbMessagesUpdatedNotification:', e);
    handleMessagesUpdate(e.detail);
});

document.addEventListener(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbSessionUpdatedNotification.type, (e) => {
    console.log('[ChatRenderer] Received DbSessionUpdatedNotification: ', e.detail);
    handleSessionMetadataUpdate(e.detail);
});

_Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_4__.dbChannel.onmessage = (event) => {
    console.log('[ChatRenderer] dbChannel event received:', event.data);
    const message = event.data;
    const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
    const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
    console.log(`[ChatRenderer] dbChannel.onmessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
    const type = message?.type;
    if (type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbMessagesUpdatedNotification.type) {
        handleMessagesUpdate(message.payload);
    }
    if (type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbSessionUpdatedNotification.type) {
        handleSessionMetadataUpdate(message.payload);
    }
};

// If browser.runtime.onMessage is used for notifications, add a similar log
if (typeof browser !== 'undefined' && browser.runtime && browser.runtime.onMessage) {
    browser.runtime.onMessage.addListener((message) => {
        const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
        const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
        console.log(`[ChatRenderer] browser.runtime.onMessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
        const type = message?.type;
        if (type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbMessagesUpdatedNotification.type) {
            handleMessagesUpdate(message.payload);
        }
        if (type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbSessionUpdatedNotification.type) {
            handleSessionMetadataUpdate(message.payload);
        }
    });
}

function initializeRenderer(chatBody, requestDbFunc) {
    if (!chatBody) {
        console.error("[ChatRenderer] chatBody element is required for initialization.");
        return;
    }
    if (!requestDbFunc) {
        console.error("[ChatRenderer] requestDbAndWait function is required for initialization.");
        return;
    }
    chatBodyElement = chatBody;
    requestDbAndWaitFunc = requestDbFunc;
    console.log("[ChatRenderer] Initialized with chat body element and DB request function.");
    initializeObserver();
}

function setActiveSessionId(sessionId) {
    console.log(`[ChatRenderer] Setting active session ID to: ${sessionId}`);
    currentSessionId = sessionId;
    if (chatBodyElement) {
        chatBodyElement.innerHTML = '';
    }
    if (!sessionId) {
        displayWelcomeMessage();
    } else {
        console.log(`[ChatRenderer] Proactively loading messages for new session: ${sessionId}`);
        loadAndRenderMessages(sessionId);
    }
}

function displayWelcomeMessage() {
    if (!chatBodyElement) return;
    chatBodyElement.innerHTML = '';
    const welcomeMsg = {
        messageId: 'welcome-msg',
        sender: 'system',
        text: 'Welcome to Tab Agent! Ask me anything or paste a URL to scrape.',
        timestamp: Date.now(),
        isLoading: false
    };
    renderSingleMessage(welcomeMsg);
}

function scrollToBottom() {
    if (chatBodyElement) {
        requestAnimationFrame(() => {
             chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
        });
    }
}

async function loadAndRenderMessages(sessionId) {
    if (!requestDbAndWaitFunc) {
        console.error("[ChatRenderer] Cannot load messages: requestDbAndWait function not available.");
        if (chatBodyElement) chatBodyElement.innerHTML = '<div class="p-4 text-red-500">Error: Cannot load chat messages.</div>';
        return;
    }
    if (!sessionId) {
        console.warn("[ChatRenderer] loadAndRenderMessages called with null sessionId. Displaying welcome.");
        displayWelcomeMessage();
        return;
    }

    console.log(`[ChatRenderer] Requesting messages for session ${sessionId}...`);
    try {
        const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbGetSessionRequest(sessionId);
        const sessionData = await requestDbAndWaitFunc(request);

        if (sessionData && sessionData.messages) {
            console.log(`[ChatRenderer] Received ${sessionData.messages.length} messages for ${sessionId}. Rendering.`);
            if (chatBodyElement) chatBodyElement.innerHTML = '';
            if (sessionData.messages.length === 0) {
                displayWelcomeMessage();
            } else {
                sessionData.messages.forEach(msg => renderSingleMessage(msg));
                scrollToBottom();
            }
        } else {
            console.warn(`[ChatRenderer] No messages found in session data for ${sessionId}. Displaying welcome.`, sessionData);
            displayWelcomeMessage();
        }
    } catch (error) {
        console.error(`[ChatRenderer] Failed to load messages for session ${sessionId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to load chat: ${error.message}`);
        if (chatBodyElement) chatBodyElement.innerHTML = `<div class="p-4 text-red-500">Failed to load chat: ${error.message}</div>`;
    }
}

function updateChatHeader(sessionData) {
    if (!sessionData) {
        console.log('[ChatRenderer] Clearing chat header (no active session).');
    } else {
        console.log(`[ChatRenderer] Updating chat header for ${sessionData.id}. Title: ${sessionData.title}, Starred: ${sessionData.isStarred}`);
    }
}

function renderSingleMessage(msg) {
    if (!chatBodyElement) return;

    console.log('[ChatRenderer] renderSingleMessage: msg object:', JSON.parse(JSON.stringify(msg)));

    // Parse metadata for type detection
    let meta = {};
    try { meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {}); } catch {}
    const extraction = meta.extraction;
    const isPageExtractor = (meta.extractionType === 'PageExtractor') || (extraction && extraction.__type === 'PageExtractor');

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2', 'min-w-0');

    if (msg.sender !== _events_eventNames_js__WEBPACK_IMPORTED_MODULE_3__.MessageSenderTypes.USER) {
        bubbleDiv.classList.add('max-w-4xl');
    }

    // Actions container (copy/download) as before
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container absolute top-1 right-1 transition-opacity flex space-x-1 z-10';

    const copyButton = document.createElement('button');
    copyButton.innerHTML = '<img src="icons/copy.svg" alt="Copy" class="w-4 h-4">';
    copyButton.title = 'Copy message text';
    copyButton.onclick = () => {
        let textToCopy = msg.text;
        if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
            textToCopy = JSON.stringify(msg.metadata.scrapeData, null, 2);
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
            // Assuming originalUITooltipController is available globally or passed appropriately
            if (window.originalUITooltipController) {
                window.originalUITooltipController.showTooltip(copyButton, 'Copied!');
            }
        }).catch(err => console.error('Failed to copy text: ', err));
    };
    actionsContainer.appendChild(copyButton);

    if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '<img src="icons/download.svg" alt="Download" class="w-4 h-4">';
        downloadButton.title = 'Download scrape data as JSON';
        downloadButton.onclick = () => {
            console.log('Download clicked for:', msg.metadata.scrapeData); // Placeholder
            if (window.originalUITooltipController) {
                window.originalUITooltipController.showTooltip(downloadButton, 'Download (placeholder)');
            }
        };
        actionsContainer.appendChild(downloadButton);
    }
    // IMPORTANT: Append actionsContainer AFTER main content is set, or ensure it's not overwritten.
    // For now, we will append it after other content elements are added to bubbleDiv.

    let contentToParse = msg.text || msg.content || '';
    let specialHeaderHTML = '';

    // --- Special handling for PageExtractor results ---
    if (isPageExtractor && extraction) {
        specialHeaderHTML = `<div class="scrape-header p-2 rounded-t-md bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 mb-1"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Scraped Page Extraction</h4><p class="text-xs text-gray-500 dark:text-gray-400 break-all">URL: ${extraction.url || 'N/A'}</p></div>`;
        contentToParse = '```json\n' + JSON.stringify(extraction, null, 2) + '\n```';
        console.log('[ChatRenderer] Rendering PageExtractor JSON:', contentToParse);
    } else if (msg.text) {
        console.log('[ChatRenderer] Preparing to parse regular message. Input to marked:', contentToParse);
    }

    console.log(`[ChatRenderer] Before style application: msg.sender = ${msg.sender}`);
    // Apply sender-specific alignment and base bubble styling
    if (msg.isLoading) {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic', 'border', 'border-gray-300', 'dark:border-gray-500');
    } else if (msg.sender === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_3__.MessageSenderTypes.USER) {
        messageDiv.classList.add('justify-end', 'min-w-0');
        bubbleDiv.classList.add(
            'bg-[rgba(236,253,245,0.51)]', // very subtle green tint
            'dark:bg-[rgba(20,83,45,0.12)]', // subtle dark green tint for dark mode
            'text-green-900',
            'dark:text-green-100',
            'border',
            'border-green-100',
            'dark:border-green-900'
        );
    } else if (msg.sender === 'error') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add(
            'bg-[rgba(254,226,226,0.37)]', // subtle red tint (light)
            'dark:bg-[rgba(120,20,20,0.12)]', // subtle red tint (dark)
            'text-red-700',
            'dark:text-red-200',
            'border',
            'border-red-200',
            'dark:border-red-700'
        );
    } else if (msg.sender === 'system') { 
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add(
            'bg-[rgba(219,234,254,0.5)]', // subtle blue tint
            'dark:bg-[rgba(30,41,59,0.2)]', // subtle dark blue/gray for dark mode
            'text-blue-900',
            'dark:text-blue-100',
            'border',
            'border-blue-100',
            'dark:border-blue-900'
        );
    } else { // Default for 'ai' or other non-user/non-error/non-system senders
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-gray-100', 'border', 'border-gray-300', 'dark:border-gray-600');
    }
    console.log('[ChatRenderer] messageDiv classes:', messageDiv.className);
    console.log('[ChatRenderer] bubbleDiv classes:', bubbleDiv.className);

    // --- HEADER BAR WITH FOLDOUT AND ACTIONS ---
    const headerBar = document.createElement('div');
    headerBar.className = 'bubble-header flex items-center justify-between px-2 py-0.5 min-w-[300px] w-full bg-[rgba(200,200,200,0.18)] dark:bg-[rgba(50,50,50,0.28)] rounded-t-lg border-b border-gray-200 dark:border-gray-700 transition-all duration-150 group';
    headerBar.onmouseenter = () => headerBar.classList.add('bg-[rgba(200,200,200,0.28)]', 'dark:bg-[rgba(50,50,50,0.38)]');
    headerBar.onmouseleave = () => headerBar.classList.remove('bg-[rgba(200,200,200,0.28)]', 'dark:bg-[rgba(50,50,50,0.38)]');

    // Foldout button with SVG chevron
    const foldoutBtn = document.createElement('button');
    foldoutBtn.className = 'toggle-foldout mr-2 flex items-center justify-center w-5 h-5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer';
    foldoutBtn.title = 'Expand/collapse message';
    foldoutBtn.innerHTML = `<svg class="chevron-icon transition-transform duration-150" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8L10 12L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    headerBar.appendChild(foldoutBtn);

    // Actions container (already created above)
    actionsContainer.classList.add('ml-auto', 'flex', 'items-center', 'space-x-1');
    headerBar.appendChild(actionsContainer);

    // --- MAIN CONTENT (foldable) ---
    const mainContentDiv = document.createElement('div');
    mainContentDiv.className = 'message-main-content';

    if (window.marked && window.marked.parse) {
        try {
            const localRenderer = new window.marked.Renderer();

            const escapeHtmlEntities = (str) => {
                if (typeof str !== 'string') return '';
                return str.replace(/[&<>"'\/]/g, function (match) {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '\"': '&quot;',
                        "'": '&#39;',
                        '/': '&#x2F;' 
                    }[match];
                });
            };

            // ONLY override the .code() method for now
            localRenderer.code = (tokenOrCode, languageInfoString, isEscaped) => {
                // Log what we receive
                console.log('[ChatRenderer Custom Code] Received arguments:', 
                    {
                        tokenOrCode_type: typeof tokenOrCode,
                        tokenOrCode_value: JSON.parse(JSON.stringify(tokenOrCode)), // Deep copy for logging
                        languageInfoString_type: typeof languageInfoString,
                        languageInfoString_value: languageInfoString,
                        isEscaped_value: isEscaped
                    }
                );

                let actualCodeString = '';
                let actualLanguageString = languageInfoString || '';
                // let actuallyEscaped = isEscaped; // Not directly used with hljs which expects raw code

                if (typeof tokenOrCode === 'object' && tokenOrCode !== null && typeof tokenOrCode.text === 'string') {
                    actualCodeString = tokenOrCode.text;
                    actualLanguageString = tokenOrCode.lang || actualLanguageString; 
                    // actuallyEscaped = typeof tokenOrCode.escaped === 'boolean' ? tokenOrCode.escaped : isEscaped;
                    console.log('[ChatRenderer Custom Code] Interpreted as token object. Using token.text and token.lang.');
                } else if (typeof tokenOrCode === 'string') {
                    actualCodeString = tokenOrCode;
                    console.log('[ChatRenderer Custom Code] Interpreted as direct code string.');
                } else {
                    console.warn('[ChatRenderer Custom Code] Received unexpected type for code argument:', tokenOrCode);
                    actualCodeString = '[Error: Unexpected code content type]';
                }
                
                // Initialize safeLanguage and langClass based on the *provided* language hint
                let languageHint = actualLanguageString.trim();
                let safeLanguage = escapeHtmlEntities(languageHint || 'plaintext');
                let langClass = `language-${safeLanguage}`;
                
                const copyIcon = '<img src="icons/copy.svg" alt="Copy code" class="w-4 h-4">'; 
                const downloadIcon = '<img src="icons/download.svg" alt="Download code" class="w-4 h-4">';
                
                const encodedCodeForAttr = encodeURIComponent(actualCodeString);
                
                let highlightedCodeForDisplay = '';
                if (window.hljs) {
                    // highlight.js expects raw, unescaped code.
                    // actualCodeString should be raw based on Marked.js default behavior without sanitize: true
                    if (actualLanguageString && window.hljs.getLanguage(actualLanguageString)) {
                        try {
                            highlightedCodeForDisplay = window.hljs.highlight(actualCodeString, { language: actualLanguageString, ignoreIllegals: true }).value;
                            console.log('[ChatRenderer Custom Code] Highlighted with specified language:', actualLanguageString);
                        } catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlight error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    } else {
                        try {
                            const autoResult = window.hljs.highlightAuto(actualCodeString);
                            highlightedCodeForDisplay = autoResult.value;
                            const detectedLang = autoResult.language;
                            console.log('[ChatRenderer Custom Code] Highlighted with auto-detection. Detected:', detectedLang);

                            if (detectedLang) { // If auto-detection was successful
                                safeLanguage = escapeHtmlEntities(detectedLang);
                                langClass = `language-${safeLanguage}`; // Update based on detected language
                            }
                        } catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlightAuto error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    }
                } else {
                    console.warn('[ChatRenderer Custom Code] window.hljs not found. Falling back to escaped code.');
                    highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                }

                return `
<div class="code-block-wrapper bg-gray-800 dark:bg-gray-900 rounded-md shadow-md my-2 text-sm">
    <div class="code-block-header flex justify-between items-center px-3 py-1.5 bg-gray-700 dark:bg-gray-800 rounded-t-md border-b border-gray-600 dark:border-gray-700">
        <span class="code-language text-xs text-gray-300 dark:text-gray-400 font-semibold">${safeLanguage}</span>
        <div class="code-actions flex space-x-2">
            <button class="code-action-copy-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Copy code" data-code="${encodedCodeForAttr}">
                ${copyIcon}
            </button>
            <button class="code-action-download-snippet p-1 rounded text-gray-300 hover:bg-gray-600 dark:hover:bg-gray-700" title="Download ${safeLanguage} snippet" data-code="${encodedCodeForAttr}" data-lang="${safeLanguage}">
                ${downloadIcon}
            </button>
        </div>
    </div>
    <pre class="p-3 overflow-x-auto"><code class="${langClass}">${highlightedCodeForDisplay}</code></pre>
</div>`;
            };

            // DO NOT override .paragraph, .list, .listitem, .heading for this test.
            // Let Marked.js use its defaults for these.

            const parsedContent = window.marked.parse(contentToParse || '', {
                renderer: localRenderer, // Use the renderer with only .code overridden
                gfm: true, 
                breaks: true 
            });
            console.log('[ChatRenderer Minimal Custom Marked.parse() output:]', parsedContent);
            mainContentDiv.innerHTML = parsedContent;
            if (window.hljs) {
                console.log('[ChatRenderer] Content set. highlight.js should have processed via Marked.js config.');
            }
        } catch (e) {
            console.error('Error during marked.parse:', e);
            mainContentDiv.textContent = contentToParse || ''; 
        }
    } else {
        console.warn('Marked.js not available. Falling back to textContent.');
        mainContentDiv.textContent = contentToParse || '';
    }

    // FOLDOUT LOGIC
    let expanded = true;
    foldoutBtn.onclick = () => {
        expanded = !expanded;
        mainContentDiv.style.display = expanded ? '' : 'none';
        // Rotate chevron
        const svg = foldoutBtn.querySelector('.chevron-icon');
        if (svg) svg.style.transform = expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    };
    // Default: expanded
    mainContentDiv.style.display = '';

    // --- ASSEMBLE BUBBLE ---
    bubbleDiv.innerHTML = '';
    bubbleDiv.appendChild(headerBar);
    if (specialHeaderHTML) {
        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = specialHeaderHTML;
        bubbleDiv.appendChild(headerDiv);
    }
    bubbleDiv.appendChild(mainContentDiv);
    bubbleDiv.appendChild(actionsContainer); // Append actions container LAST to ensure it's not overwritten and is on top (due to z-10)
    
    messageDiv.appendChild(bubbleDiv);
    chatBodyElement.appendChild(messageDiv);
    scrollToBottom();
    return messageDiv;
}

// --- NEW: Functions for Temporary Messages ---

/**
 * Renders a temporary status message directly to the chat body.
 * These messages are not saved to the database.
 * @param {string} type - 'system', 'success', or 'error'
 * @param {string} text - The message content.
 */
function renderTemporaryMessage(type, text) {
    if (!chatBodyElement) return;

    // Only log non-system temporary messages to reduce noise
    if (type !== 'system') {
        console.log(`[ChatRenderer] Rendering temporary message (${type}): ${text}`);
    }
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `message-${type}`, TEMP_MESSAGE_CLASS);

    // Basic styling (can be enhanced in CSS)
    messageDiv.style.padding = '8px 12px';
    messageDiv.style.borderRadius = '8px';
    messageDiv.style.marginBottom = '10px';
    messageDiv.style.maxWidth = '90%';
    messageDiv.style.alignSelf = 'center'; // Center align system/error messages
    messageDiv.style.backgroundColor = type === 'error' ? '#fee2e2' : (type === 'success' ? '#dcfce7' : '#f3f4f6'); // Example colors
    messageDiv.style.color = type === 'error' ? '#b91c1c' : (type === 'success' ? '#166534' : '#374151'); // Example colors

    // Handle dark mode styling (basic example)
    if (document.documentElement.classList.contains('dark')) {
        messageDiv.style.backgroundColor = type === 'error' ? '#450a0a' : (type === 'success' ? '#14532d' : '#374151');
        messageDiv.style.color = type === 'error' ? '#fca5a5' : (type === 'success' ? '#bbf7d0' : '#d1d5db');
    }

    messageDiv.textContent = text;

    chatBodyElement.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Removes all temporary status messages from the chat body.
 */
function clearTemporaryMessages() {
    if (!chatBodyElement) return;
    console.log("[ChatRenderer] Clearing temporary status messages.");
    const tempMessages = chatBodyElement.querySelectorAll(`.${TEMP_MESSAGE_CLASS}`);
    tempMessages.forEach(msg => msg.remove());
}

// --- END: Temporary Message Functions ---

function initializeObserver() {
    if (observer) observer.disconnect(); // Disconnect previous observer if any

    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // If using hljs and it needs to be re-triggered on dynamic additions, this is one place.
                        // However, if Marked+hljs provides fully rendered HTML, this might only be for other dynamic changes.
                        // For now, let's assume the initial render from Marked handles it.
                        // const codeBlocks = node.querySelectorAll('pre code[class*="language-"]');
                        // codeBlocks.forEach(codeElement => {
                        //     if (!codeElement.classList.contains('hljs-highlighted')) { // or appropriate hljs class
                        //         if (window.hljs) window.hljs.highlightElement(codeElement); // or hljs.highlightBlock(codeElement)
                        //         codeElement.classList.add('hljs-highlighted');
                        //     }
                        // });
                    }
                });
            }
        });
    });

    if (chatBodyElement) {
        observer.observe(chatBodyElement, { childList: true, subtree: true });
        console.log("[ChatRenderer] MutationObserver initialized and observing chat body.");

        // Event delegation for code block actions
        chatBodyElement.addEventListener('click', async (event) => {
            const target = event.target.closest('button');
            if (!target) return;

            if (target.classList.contains('code-action-copy-snippet')) {
                const codeToCopy = target.dataset.code;
                if (codeToCopy) {
                    try {
                        await navigator.clipboard.writeText(decodeURIComponent(codeToCopy));
                        if (window.originalUITooltipController) {
                            window.originalUITooltipController.showTooltip(target, 'Code Copied!');
                        } else {
                            (0,_notifications_js__WEBPACK_IMPORTED_MODULE_0__.showNotification)('Code snippet copied!', 'success', 1500);
                        }
                    } catch (err) {
                        console.error('Failed to copy code snippet:', err);
                        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)('Failed to copy code snippet.');
                    }
                }
            } else if (target.classList.contains('code-action-download-snippet')) {
                const codeToDownload = target.dataset.code;
                const lang = target.dataset.lang || 'txt';
                const filename = `snippet.${lang}`;
                if (codeToDownload) {
                    try {
                        downloadFile(filename, decodeURIComponent(codeToDownload), getMimeType(lang));
                        if (window.originalUITooltipController) {
                            window.originalUITooltipController.showTooltip(target, 'Downloading...');
                        }
                    } catch (err) {
                        console.error('Failed to download code snippet:', err);
                        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)('Failed to download code snippet.');
                    }
                }
            }
        });
        console.log("[ChatRenderer] Event listeners for code block actions (copy/download) added to chatBody.");

    } else {
        console.error("[ChatRenderer] Cannot initialize MutationObserver or event listeners: chatBody is null.");
    }
}

// Helper function to get MIME type from language
function getMimeType(lang) {
    const mimeTypes = {
        json: 'application/json',
        javascript: 'application/javascript',
        js: 'application/javascript',
        html: 'text/html',
        css: 'text/css',
        xml: 'application/xml',
        python: 'text/x-python',
        py: 'text/x-python',
        java: 'text/x-java-source',
        c: 'text/x-csrc',
        cpp: 'text/x-c++src',
        cs: 'text/x-csharp',
        go: 'text/x-go',
        rb: 'text/x-ruby',
        php: 'application/x-httpd-php',
        swift: 'text/x-swift',
        kt: 'text/x-kotlin',
        rs: 'text/rust',
        sql: 'application/sql',
        sh: 'application/x-sh',
        bash: 'application/x-sh',
        // Add more as needed
        txt: 'text/plain',
        plaintext: 'text/plain'
    };
    return mimeTypes[lang.toLowerCase()] || 'text/plain';
}

// Helper function to trigger file download
function downloadFile(filename, content, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/***/ }),

/***/ "./src/Home/fileHandler.js":
/*!*********************************!*\
  !*** ./src/Home/fileHandler.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleAttachClick: () => (/* binding */ handleAttachClick),
/* harmony export */   handleFileSelected: () => (/* binding */ handleFileSelected),
/* harmony export */   initializeFileHandling: () => (/* binding */ initializeFileHandling)
/* harmony export */ });
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");


let db = null;
let renderer = null;
let getActiveSessionIdFunc = null;
let ui = null;

function initializeFileHandling(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    ui = dependencies.uiController;

    if (!getActiveSessionIdFunc || !ui) {
        console.error("FileHandler: Missing getActiveSessionIdFunc or uiController dependency!");
    } else {
        console.log("[FileHandler] Initialized (Note: DB/Renderer interaction via events assumed).");
    }
}

async function handleFileSelected(event) {
    if (!getActiveSessionIdFunc) {
         console.error("FileHandler: Not initialized properly (missing getActiveSessionIdFunc).");
         return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) {
        console.log("FileHandler: No file selected.");
        return;
    }

    const file = files[0];
    console.log(`FileHandler: File selected - ${file.name}, Type: ${file.type}, Size: ${file.size}`);

    const sessionId = getActiveSessionIdFunc();
    if (!sessionId) {
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_0__.showError)("Please start or select a chat before attaching a file.");
        event.target.value = '';
        return;
    }

    const fileMessage = {
        sender: 'system',
        text: `📎 Attached file: ${file.name}`,
        timestamp: Date.now(),
        isLoading: false,
    };

    try {
        const request = new DbAddMessageRequest(sessionId, fileMessage);
        eventBus.publish(DbAddMessageRequest.type, request);
        console.log("[FileHandler] Published DbAddMessageRequest for file attachment.");

    } catch (error) {
         console.error("FileHandler: Error publishing file attachment message event:", error);
         (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_0__.showError)("Failed to process file attachment.");
    } finally {
        event.target.value = ''; 
    }
}

function handleAttachClick() {
    if (!ui) {
        console.error("FileHandler: UI Controller not available to trigger file input.");
        return;
    }
    console.log("FileHandler: Triggering file input click.");
    ui.triggerFileInputClick();
}

/***/ }),

/***/ "./src/Home/messageOrchestrator.js":
/*!*****************************************!*\
  !*** ./src/Home/messageOrchestrator.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeOrchestrator: () => (/* binding */ initializeOrchestrator)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _sidepanel_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sidepanel.js */ "./src/sidepanel.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _chatRenderer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./chatRenderer.js */ "./src/Home/chatRenderer.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");







let getActiveSessionIdFunc = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false; // TODO: Remove this and rely on status check via DB event

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        try {
            const result = await (0,_sidepanel_js__WEBPACK_IMPORTED_MODULE_2__.sendDbRequestSmart)(requestEvent, timeoutMs);
            console.log('[Trace][sidepanel] requestDbAndWait: Raw result', result);
            const response = Array.isArray(result) ? result[0] : result;
            if (response && (response.success || response.error === undefined)) {
                resolve(response.data || response.payload);
            } else {
                reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
            }
        } catch (error) {
            reject(error);
        }
    });
}

async function handleQuerySubmit(data) {
    const { text } = data;
    console.log(`[Orchestrator: handleQuerySubmit] received event with text: "${text}"`);
    if (isSendingMessage) {
        console.warn("[Orchestrator handleQuerySubmit]: Already processing a previous submission.");
        return;
    }
    isSendingMessage = true;

    let sessionId = getActiveSessionIdFunc();
    const currentTabId = getCurrentTabIdFunc();
    let placeholderMessageId = null;

    console.log(`[Orchestrator: handleQuerySubmit] Processing submission. Text: "${text}". Session: ${sessionId}`);
    const isURL = _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.URL_REGEX.test(text);

    try {
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
        const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("[Orchestrator: handleQuerySubmit] No active session, creating new one via event.");
            const createRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbCreateSessionRequest(userMessage);
            const createResponse = await requestDbAndWait(createRequest);
            sessionId = createResponse.newSessionId;
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                 console.error("[Orchestrator: handleQuerySubmit] onSessionCreatedCallback is missing!");
                 throw new Error("Configuration error: Cannot notify about new session.");
            }
        } else {
            console.log(`[Orchestrator: handleQuerySubmit] Adding user message to existing session ${sessionId} via event.`);
            (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
            const addRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, userMessage);
            await requestDbAndWait(addRequest);
        }
        console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'processing' via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'processing');
        await requestDbAndWait(statusRequest);
        let placeholder;
        if (isURL) {
            placeholder = { sender: 'system', text: `⏳ Scraping ${text}...`, timestamp: Date.now(), isLoading: true };
        } else {
            placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        }
        console.log(`[Orchestrator: handleQuerySubmit] Adding placeholder to session ${sessionId} via event.`);
        const addPlaceholderRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, placeholder);
        const placeholderResponse = await requestDbAndWait(addPlaceholderRequest);
        placeholderMessageId = placeholderResponse.newMessageId;
        
        if (isURL) {
            // Always send scrape request to background, let background decide how to scrape
            try {
                const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
                    type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.RuntimeMessageTypes.SCRAPE_REQUEST,
                    payload: {
                        url: text,
                        chatId: sessionId,
                        messageId: placeholderMessageId
                    }
                });
                console.log("[Orchestrator: handleQuerySubmit] SCRAPE_REQUEST sent to background.", response);
            } catch (error) {
                console.error('[Orchestrator: handleQuerySubmit] Error sending SCRAPE_REQUEST:', error.message);
                const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                    isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${error.message}`
                });
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                isSendingMessage = false;
            }
        } else {
            console.log("[Orchestrator: handleQuerySubmit] Sending query to background for AI response.");
            const messagePayload = {
                type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.RuntimeMessageTypes.SEND_CHAT_MESSAGE,
                payload: {
                    chatId: sessionId,
                    messages: [{ role: 'user', content: text }], 
                    options: { /* model, temp, etc */ },
                    messageId: placeholderMessageId
                }
            };
            try {
                const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage(messagePayload);
                if (response && response.success) {
                    console.log('[Orchestrator: handleQuerySubmit] Background acknowledged forwarding sendChatMessage. Actual AI response will follow separately.', response);
                } else {
                    console.error('[Orchestrator: handleQuerySubmit] Background reported an error while attempting to forward sendChatMessage:', response?.error);
                    const errorPayload = { isLoading: false, sender: 'error', text: `Error forwarding query: ${response?.error || 'Unknown error'}` };
                    const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                    await requestDbAndWait(errorUpdateRequest); // Can await here too
                    await requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error'));
                    isSendingMessage = false; // Reset flag if forwarding failed
                }
            } catch (error) {
                console.error('[Orchestrator: handleQuerySubmit] Error sending query to background or processing its direct ack:', error);
                const errorText = error && typeof error.message === 'string' ? error.message : 'Unknown error during send/ack';
                const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${errorText}` };
                const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error (within catch):", e));
                requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error (within catch):", e));
                isSendingMessage = false; // Reset flag on send error
            }
        }
    } catch (error) {
        console.error("[Orchestrator: handleQuerySubmit] Error processing query submission:", error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error: ${error.message || error}`);
        if (sessionId) {
            console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'error' due to processing failure via event`);
            requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on processing error:", e));
        } else {
            console.error("[Orchestrator: handleQuerySubmit] Error occurred before session ID was established.");
        }
        isSendingMessage = false;
    }
}

async function handleBackgroundMsgResponse(message) {
    const { chatId, messageId, text } = message;
    console.log(`[Orchestrator: handleBackgroundMsgResponse] for chat ${chatId}, placeholder ${messageId}`);
    try {
        const updatePayload = { isLoading: false, sender: 'ai', text: text || 'Received empty response.' };
        const updateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundMsgResponse] Setting session ${chatId} status to 'idle' after response via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'idle');
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`[Orchestrator: handleBackgroundMsgResponse] Error handling background response for chat ${chatId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with response: ${error.message || error}`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on response processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

async function handleBackgroundMsgError(message) {
    console.error(`[Orchestrator: handleBackgroundMsgError] Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error processing request: ${message.error}`); // Show global error regardless

    const sessionId = getActiveSessionIdFunc(); // Get current session ID

    if (sessionId && message.chatId === sessionId && message.messageId) {
        // Only update DB if the error belongs to the *active* session and has a message ID
        console.log(`[Orchestrator: handleBackgroundMsgError] Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
        const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
        const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error');
        try {
            await requestDbAndWait(errorUpdateRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Error message update successful for session ${sessionId}.`);
            await requestDbAndWait(statusRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Session ${sessionId} status set to 'error'.`);
        } catch (dbError) {
            console.error('[Orchestrator: handleBackgroundMsgError] Error updating chat/status on background error:', dbError);
            // Show a more specific UI error if DB update fails
            (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with error status: ${dbError.message}`);
            // Attempt to set status to error even if message update failed
            try {
                 await requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error'));
            } catch (statusError) {
                 console.error('[Orchestrator: handleBackgroundMsgError] Failed to set session status on error handling error:', statusError);
            }
        }
    } else {
         console.warn(`[Orchestrator: handleBackgroundMsgError] Received error, but no active session ID (${sessionId}) or message ID (${message.messageId}) matches the error context (${message.chatId}). Not updating DB.`);
         // If the error is specifically a model load error (we might need a better way to signal this)
         // ensure the UI controller knows. The direct worker:error event might be better.
    }

    isSendingMessage = false; // Reset flag after handling error
}

async function handleBackgroundScrapeStage(payload) {
    const { stage, success, chatId, messageId, error, ...rest } = payload;
    console.log(`[Orchestrator: handleBackgroundScrapeStage] Stage ${stage}, chatId: ${chatId}, Success: ${success}`);

    let updatePayload = {};
    let finalStatus = 'idle'; // Default to idle on success

    if (success) {
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Scrape stage ${stage} succeeded for chat ${chatId}.`);
        // Construct a success message matching the 'scrape_result_full' style
        const successText = `Full Scrape Result: ${rest.title || 'No Title'}`; // Use title for the text part
        // Use the 'scrape_result_full' type and structure
        updatePayload = { 
            isLoading: false, 
            sender: 'system', 
            text: successText, // Main text shown outside bubble if needed
            metadata: { 
                type: 'scrape_result_full', 
                scrapeData: rest // Put the full data here for the renderer
            }
        };
        finalStatus = 'idle';

    } else {
        // If a stage fails, update the message immediately with the error
        const errorText = error || `Scraping failed (Stage ${stage}). Unknown error.`;
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
        updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
        finalStatus = 'error';
    }

    // --- Update DB regardless of success/failure based on this stage result --- 
    try {
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updating message ${messageId} for stage ${stage} result.`);
        const updateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updated placeholder ${messageId} with stage ${stage} result.`);

        // Also set final session status based on this stage outcome
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);

    } catch (dbError) {
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Failed to update DB after stage ${stage} result:`, dbError);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with scrape result: ${dbError.message || dbError}`);
        // If DB update fails, maybe try setting status to error anyway?
        if (finalStatus !== 'error') {
             try {
                 const fallbackStatusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
                 await requestDbAndWait(fallbackStatusRequest);
             } catch (fallbackError) {
                 console.error("Failed to set fallback error status:", fallbackError);
             }
        }
    } finally {
        // Reset sending flag only after processing a stage result
        // This assumes the background script won't send more results for this specific scrape
        // Might need adjustment if background sends a final DIRECT_SCRAPE_RESULT later
         isSendingMessage = false; 
         console.log("[Orchestrator: handleBackgroundScrapeStage] Resetting isSendingMessage after processing scrape stage result.");
    }
}

async function handleBackgroundDirectScrapeResult(message) {
    const { chatId, messageId, success, error, ...scrapeData } = message;
    console.log(`[Orchestrator: handleBackgroundDirectScrapeResult] for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
    const updatePayload = { isLoading: false };
     if (success) {
         updatePayload.sender = 'system';
         updatePayload.text = `Full Scrape Result: ${scrapeData.title || 'Scraped Content'}`;
         updatePayload.metadata = {
             type: 'scrape_result_full', 
             scrapeData: scrapeData
         };
     } else {
         updatePayload.sender = 'error';
         updatePayload.text = `Scraping failed: ${error || 'Unknown error.'}`;
     }
    try {
        const updateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        const finalStatus = success ? 'idle' : 'error';
        console.log(`[Orchestrator: handleBackgroundDirectScrapeResult] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`[Orchestrator: handleBackgroundDirectScrapeResult] Error handling direct scrape result for chat ${chatId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with direct scrape result: ${error.message || error}`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on direct scrape processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.QUERY_SUBMITTED, (e) => handleQuerySubmit(e.detail));
document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, (e) => handleBackgroundMsgResponse(e.detail));
document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_ERROR_RECEIVED, (e) => handleBackgroundMsgError(e.detail));
document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, handleBackgroundScrapeStage);
document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, handleBackgroundDirectScrapeResult);

function initializeOrchestrator(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    onSessionCreatedCallback = dependencies.onSessionCreatedCallback;
    getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;

    if (!getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
        console.error("Orchestrator: Missing one or more dependencies during initialization!");
        return;
    }

    console.log("[Orchestrator] Initializing and subscribing to application events...");
    console.log("[Orchestrator] Event subscriptions complete.");
}

/***/ }),

/***/ "./src/Home/uiController.js":
/*!**********************************!*\
  !*** ./src/Home/uiController.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   adjustTextareaHeight: () => (/* binding */ adjustTextareaHeight),
/* harmony export */   checkInitialized: () => (/* binding */ checkInitialized),
/* harmony export */   clearInput: () => (/* binding */ clearInput),
/* harmony export */   focusInput: () => (/* binding */ focusInput),
/* harmony export */   getInputValue: () => (/* binding */ getInputValue),
/* harmony export */   initializeUI: () => (/* binding */ initializeUI),
/* harmony export */   setActiveSession: () => (/* binding */ setActiveSession),
/* harmony export */   triggerFileInputClick: () => (/* binding */ triggerFileInputClick)
/* harmony export */ });
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _chatRenderer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./chatRenderer.js */ "./src/Home/chatRenderer.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Utilities/dbChannels.js */ "./src/Utilities/dbChannels.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");





let queryInput, sendButton, chatBody, attachButton, fileInput,  loadingIndicatorElement, 
    historyButton, historyPopup, historyList, closeHistoryButton, newChatButton, historySearchInput, 
    sessionListElement, driveButton, driveViewerModal, driveViewerClose, driveViewerBack, driveViewerContent, 
    driveViewerList, driveViewerSearch, driveViewerBreadcrumbs, driveViewerSelectedArea, driveViewerCancel, 
    driveViewerInsert, starredListElement, loadModelButton, modelLoadProgress;
let isInitialized = false;
let attachFileCallback = null;
let currentSessionId = null;


// Define available models (can be moved elsewhere later)
const AVAILABLE_MODELS = {
    // Model ID (value) : Display Name
  //  "Xenova/Qwen1.5-1.8B-Chat": "Qwen 1.8B Chat (Quantized)",
   // "Xenova/Phi-3-mini-4k-instruct": "Phi-3 Mini Instruct (Quantized)",
    //"HuggingFaceTB/SmolLM-1.7B-Instruct": "SmolLM 1.7B Instruct",
    //"HuggingFaceTB/SmolLM2-1.7B": "SmolLM2 1.7B",
   // "google/gemma-3-4b-it-qat-q4_0-gguf": "Gemma 3 4B IT Q4 (GGUF)", 
   // "bubblspace/Bubbl-P4-multimodal-instruct": "Bubbl-P4 Instruct (Multimodal)", 
    //"microsoft/Phi-4-multimodal-instruct": "Phi-4 Instruct (Multimodal)", 
   // "microsoft/Phi-4-mini-instruct": "Phi-4 Mini Instruct",
    //"Qwen/Qwen3-4B": "Qwen/Qwen3-4B",
    //"google/gemma-3-1b-pt": "google/gemma-3-1b-pt",

    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "onnx-models/all-MiniLM-L6-v2-onnx": "MiniLM-L6-v2",
    // Add more models here as needed
};

document.addEventListener(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_4__.DbStatusUpdatedNotification.type, (e) => {
    console.log('[UIController] Received DbStatusUpdatedNotification: ', e.detail);
    handleStatusUpdate(e.detail);
  });

// Add this at the top level to ensure UI progress bar updates
webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    console.log('[UIController] browser.runtime.onMessage Received progress update: ', message.type, message.payload);
    if (message.type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_4__.DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
    if (Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DirectDBNames).includes(type)) {
        return false;
    }
    if (Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames).includes(type)) {
        return false;
    }
    if (message.type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_DOWNLOAD_PROGRESS || message.type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE) {
       
        handleLoadingProgress(message.payload);
    }
});

_Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_3__.dbChannel.onmessage = (event) => {
    const message = event.data;
    const type = message?.type;
    console.log('[UIController] dbChannel.onmessage Received progress update: ', message.type, message.payload);
    if (type === _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_4__.DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
    // Add other notification types as needed
};

function selectElements() {
    queryInput = document.getElementById('query-input');
    sendButton = document.getElementById('send-button');
    chatBody = document.getElementById('chat-body');
    attachButton = document.getElementById('attach-button');
    fileInput = document.getElementById('file-input');
    loadingIndicatorElement = document.getElementById('loading-indicator');
    if (!queryInput || !sendButton || !chatBody || !attachButton || !fileInput /*|| !sessionListElement*/) {
        console.error("UIController: One or more essential elements not found (excluding session list)!");
        return false;
    }
    return true;
}

function attachListeners() {
    queryInput?.addEventListener('input', adjustTextareaHeight);
    queryInput?.addEventListener('keydown', handleEnterKey);
    sendButton?.addEventListener('click', handleSendButtonClick);
    attachButton?.addEventListener('click', handleAttachClick);
}

function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);
}

function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const messageText = getInputValue();
        if (messageText && !queryInput.disabled) {
            console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
            document.dispatchEvent(new CustomEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
            clearInput();
        } else {
             console.log("[UIController] Enter key pressed, but input is empty or disabled.");
        }
    }
}

function handleSendButtonClick() {
    const messageText = getInputValue();
    if (messageText && !queryInput.disabled) {
        console.log("[UIController] Send button clicked. Publishing ui:querySubmitted");
        document.dispatchEvent(new CustomEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
        clearInput();
    } else {
        console.log("[UIController] Send button clicked, but input is empty or disabled.");
    }
}

function handleAttachClick() {
    if (attachFileCallback) {
        attachFileCallback();
    }
}

function adjustTextareaHeight() {
    if (!queryInput) return;
    queryInput.style.height = 'auto';
    const maxHeight = 150;
    const scrollHeight = queryInput.scrollHeight;
    queryInput.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    if (sendButton) {
        sendButton.disabled = queryInput.value.trim() === '' || queryInput.disabled;
    }
}

function setInputStateInternal(status) {
    console.log(`[UIController] setInputStateInternal called with status: ${status}`);
    if (!isInitialized || !queryInput || !sendButton) return;
    switch (status) {
        case 'processing':
            queryInput.disabled = true;
            sendButton.disabled = true;
            break;
        case 'error':
        case 'idle':
        case 'complete':
        default:
            queryInput.disabled = false;
            adjustTextareaHeight();
            break;
    }
    console.log(`[UIController] Input disabled state: ${queryInput.disabled}`);
}

function showLoadingIndicatorInternal(message = '', showSpinner = true) {
    if (!isInitialized || !loadingIndicatorElement) return;

    const textElement = loadingIndicatorElement.querySelector('span');
    if (textElement) textElement.textContent = message;
    
    const spinner = loadingIndicatorElement.querySelector('svg');
    if (spinner) spinner.classList.toggle('hidden', !showSpinner);

    loadingIndicatorElement.classList.remove('hidden');

    if (message.startsWith('Downloading') || message.startsWith('Loading')) {
        setLoadButtonState('loading', message); 
    } 
}

function hideLoadingIndicatorInternal() {
    if (!isInitialized || !loadingIndicatorElement) return;
    loadingIndicatorElement.classList.add('hidden');
}

function handleStatusUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) return;
    if (notification.sessionId === currentSessionId) {
        setInputStateInternal(notification.payload.status || 'idle');
    }
}

function handleLoadingProgress(payload) {
    if (!payload) return;
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');

    if (!statusDiv || !statusText || !progressBar || !progressInner) {
        console.warn('[UIController] Model load progress bar not found.');
        return;
    }

    // Always show the status area while loading or on error
    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';

    // Handle error
    if (payload.status === 'error' || payload.error) {
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; // red
        progressInner.style.width = '100%';
        return;
    }

    // Main progress bar (overall)
    let percent = payload.progress || payload.percent || 0;
    percent = Math.max(0, Math.min(100, percent));
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green

    // Status text
    let text = '';
    // Truncate file name for display
    function truncateFileName(name, maxLen = 32) {
        if (!name) return '';
        return name.length > maxLen ? name.slice(0, maxLen - 3) + '...' : name;
    }
    if (payload.summary && payload.message) {
        text = payload.message;
    } else if (payload.status === 'progress' && payload.file) {
        const shortFile = truncateFileName(payload.file);
        text = `Downloading ${shortFile}`;
        if (payload.chunkIndex && payload.totalChunks) {
            text += ` (chunk ${payload.chunkIndex} of ${payload.totalChunks})`;
        }
        text += `... ${Math.round(percent)}%`;
    } else if (payload.status === 'done' && payload.file) {
        const shortFile = truncateFileName(payload.file);
        text = `${shortFile} downloaded. Preparing pipeline...`;
    } else {
        text = 'Loading...';
    }
    statusText.textContent = text;

    // Hide when done (but not on error)
    if ((percent >= 100 || payload.status === 'done' || (payload.summary && percent >= 100)) && !(payload.status === 'error' || payload.error)) {
        setTimeout(() => { statusDiv.style.display = 'none'; }, 1000);
    }
}




async function initializeUI(callbacks) {
    console.log("[UIController] Initializing...");
    if (isInitialized) {
        removeListeners();
    }
    if (!selectElements()) {
        isInitialized = false;
        return null;
    }
    attachFileCallback = callbacks?.onAttachFile;
    
    attachListeners();
    
    const newChatButton = document.getElementById('new-chat-button');
    if (newChatButton && callbacks?.onNewChat) {
        newChatButton.addEventListener('click', callbacks.onNewChat);
    }

    isInitialized = true;
    setInputStateInternal('idle');
    adjustTextareaHeight();
    console.log("[UIController] Initialized successfully.");

    console.log(`[UIController] Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);

    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_1__.clearTemporaryMessages)();

    loadModelButton = document.getElementById('load-model-button');
    if (loadModelButton) {
        loadModelButton.addEventListener('click', handleLoadModelClick);
    } else {
        console.error("[UIController] Load Model button not found!");
    }

    disableInput("Model not loaded. Click 'Load'.");
    setLoadButtonState('idle');

    console.log("[UIController] Initializing UI elements...");

    // Populate model selector
    console.log("[UIController] Attempting to find model selector...");
    const modelSelector = document.getElementById('model-selector');
    console.log(modelSelector ? "[UIController] Model selector found." : "[UIController] WARNING: Model selector NOT found!");
    if (modelSelector) {
        modelSelector.innerHTML = ''; // Clear existing options
        console.log("[UIController] Populating model selector. Available models:", AVAILABLE_MODELS);
        for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
            console.log(`[UIController] Adding option: ${displayName} (${modelId})`);
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            modelSelector.appendChild(option);
        }

    } else {
        console.warn("[UIController] Model selector dropdown not found.");
    }

    console.log("[UIController] UI Initialization complete.");
    return { chatBody, queryInput, sendButton, attachButton, fileInput };
}

function setActiveSession(sessionId) {
    console.log(`[UIController] Setting active session for UI state: ${sessionId}`);
    currentSessionId = sessionId;
    if (!sessionId) {
        setInputStateInternal('idle'); 
    } 
}

function checkInitialized() {
    return isInitialized;
}

function getInputValue() {
    return queryInput?.value.trim() || '';
}

function clearInput() {
    console.log("[UIController] Entering clearInput function.");
    if (queryInput) {
        queryInput.value = '';
        adjustTextareaHeight();
    }
}

function focusInput() {
    queryInput?.focus();
}

function triggerFileInputClick() {
    fileInput?.click();
}

function handleLoadModelClick() {
    if (!isInitialized) return;
    console.log("[UIController] Load Model button clicked.");

    const modelSelector = document.getElementById('model-selector');
    const selectedModelId = modelSelector?.value;

    if (!selectedModelId) {
        console.error("[UIController] Cannot load: No model selected or selector not found.");
        showNotification("Error: Please select a model.", "error");
        return;
    }

    console.log(`[UIController] Requesting load for model: ${selectedModelId}`);
    setLoadButtonState('loading'); 
    disableInput(`Loading ${AVAILABLE_MODELS[selectedModelId] || selectedModelId}...`); 
    document.dispatchEvent(new CustomEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.REQUEST_MODEL_LOAD, { detail: { modelId: selectedModelId } }));
}

function setLoadButtonState(state, text = 'Load') {
    if (!isInitialized || !loadModelButton) return;

    switch (state) {
        case 'idle':
            loadModelButton.disabled = false;
            loadModelButton.textContent = text;
            loadModelButton.classList.replace('bg-yellow-500', 'bg-green-500');
            loadModelButton.classList.replace('bg-gray-500', 'bg-green-500');
            break;
        case 'loading':
            loadModelButton.disabled = true;
            loadModelButton.textContent = text === 'Load' ? 'Loading...' : text;
            loadModelButton.classList.replace('bg-green-500', 'bg-yellow-500');
             loadModelButton.classList.replace('bg-gray-500', 'bg-yellow-500');
            break;
        case 'loaded':
            loadModelButton.disabled = true;
            loadModelButton.textContent = 'Loaded';
            loadModelButton.classList.replace('bg-green-500', 'bg-gray-500'); 
            loadModelButton.classList.replace('bg-yellow-500', 'bg-gray-500');
            break;
        case 'error':
            loadModelButton.disabled = false;
            loadModelButton.textContent = 'Load Failed';
            loadModelButton.classList.replace('bg-yellow-500', 'bg-red-500');
            loadModelButton.classList.replace('bg-green-500', 'bg-red-500');
            loadModelButton.classList.replace('bg-gray-500', 'bg-red-500');
            break;
    }
}

function disableInput(reason = "Processing...") {
    if (!isInitialized || !queryInput || !sendButton) return;
    queryInput.disabled = true;
    queryInput.placeholder = reason;
    sendButton.disabled = true;
}

function enableInput() {
    if (!isInitialized || !queryInput || !sendButton) return;
    queryInput.disabled = false; 
    queryInput.placeholder = "Ask Tab Agent...";
    sendButton.disabled = queryInput.value.trim() === '';
}

document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.WORKER_READY, (e) => {
    const payload = e.detail;
    console.log("[UIController] Received worker:ready signal", payload);
    // Hide progress bar area
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv) statusDiv.style.display = 'none';
    setLoadButtonState('loaded');
});

document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.WORKER_ERROR, (e) => {
    const payload = e.detail;
    console.error("[UIController] Received worker:error signal", payload);
    // Show error in progress bar area and keep it visible
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressInner = document.getElementById('model-load-progress-inner');
    if (statusDiv && statusText && progressInner) {
        statusDiv.style.display = 'block';
        statusText.textContent = payload?.error || 'Model load failed.';
        progressInner.style.background = '#f44336';
        progressInner.style.width = '100%';
    }
    setLoadButtonState('error');
    disableInput("Model load failed. Check logs.");
});

/***/ }),

/***/ "./src/Utilities/dbChannels.js":
/*!*************************************!*\
  !*** ./src/Utilities/dbChannels.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dbChannel: () => (/* binding */ dbChannel),
/* harmony export */   llmChannel: () => (/* binding */ llmChannel),
/* harmony export */   logChannel: () => (/* binding */ logChannel)
/* harmony export */ });
const dbChannel = new BroadcastChannel('tabagent-db');
const llmChannel = new BroadcastChannel('tabagent-llm');
const logChannel = new BroadcastChannel('tabagent-logs'); 

/***/ }),

/***/ "./src/Utilities/dbSchema.js":
/*!***********************************!*\
  !*** ./src/Utilities/dbSchema.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ATTACHMENTS_TABLE_SQL: () => (/* binding */ ATTACHMENTS_TABLE_SQL),
/* harmony export */   CHATS_TABLE_SQL: () => (/* binding */ CHATS_TABLE_SQL),
/* harmony export */   CHAT_SUMMARIES_TABLE_SQL: () => (/* binding */ CHAT_SUMMARIES_TABLE_SQL),
/* harmony export */   KNOWLEDGE_GRAPH_EDGES_TABLE_SQL: () => (/* binding */ KNOWLEDGE_GRAPH_EDGES_TABLE_SQL),
/* harmony export */   KNOWLEDGE_GRAPH_NODES_TABLE_SQL: () => (/* binding */ KNOWLEDGE_GRAPH_NODES_TABLE_SQL),
/* harmony export */   LOG_TABLE_SQL: () => (/* binding */ LOG_TABLE_SQL),
/* harmony export */   MESSAGES_TABLE_SQL: () => (/* binding */ MESSAGES_TABLE_SQL),
/* harmony export */   MODEL_ASSET_TABLE_SQL: () => (/* binding */ MODEL_ASSET_TABLE_SQL),
/* harmony export */   USERS_TABLE_SQL: () => (/* binding */ USERS_TABLE_SQL)
/* harmony export */ });
const USERS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT
);
`;

const CHATS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    tabId INTEGER,
    timestamp INTEGER,
    title TEXT,
    isStarred INTEGER DEFAULT 0,
    status TEXT DEFAULT 'idle',
    metadata TEXT,         -- JSON: {topic, domain, tags, ...}
    summary TEXT,          -- High-level summary of the chat
    embedding BLOB,        -- Vector for the whole chat
    topic TEXT,            -- (optional, for fast lookup)
    domain TEXT,           -- (optional)
    FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_chats_timestamp ON chats(timestamp);
CREATE INDEX IF NOT EXISTS idx_chats_isStarred ON chats(isStarred);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_topic ON chats(topic);
CREATE INDEX IF NOT EXISTS idx_chats_domain ON chats(domain);
`;

const LOG_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    timestamp INTEGER,
    level TEXT CHECK(level IN ('error', 'warn', 'info', 'debug')),
    message TEXT,
    component TEXT,
    extensionSessionId TEXT,
    chatSessionId TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_component ON logs(component);
CREATE INDEX IF NOT EXISTS idx_logs_extensionSessionId ON logs(extensionSessionId);
CREATE INDEX IF NOT EXISTS idx_logs_chatSessionId ON logs(chatSessionId);
`;

const MODEL_ASSET_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS model_assets (
    id TEXT PRIMARY KEY,
    folder TEXT,
    fileName TEXT,
    fileType TEXT,
    data BLOB,
    size INTEGER,
    addedAt INTEGER,
    chunkIndex INTEGER DEFAULT 0,
    totalChunks INTEGER DEFAULT 1,
    chunkGroupId TEXT DEFAULT '',
    binarySize INTEGER,
    totalFileSize INTEGER
);
CREATE INDEX IF NOT EXISTS idx_model_assets_folder ON model_assets(folder);
CREATE INDEX IF NOT EXISTS idx_model_assets_fileName ON model_assets(fileName);
CREATE INDEX IF NOT EXISTS idx_model_assets_chunkGroupId ON model_assets(chunkGroupId);
CREATE INDEX IF NOT EXISTS idx_model_assets_chunkGroupId_chunkIndex ON model_assets(chunkGroupId, chunkIndex);
`;

const MESSAGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    chat_id TEXT,
    timestamp INTEGER,
    sender TEXT,
    type TEXT,         -- 'text', 'image', 'file', 'code', 'agent_action', etc.
    content TEXT,      -- main content (text, JSON, or reference)
    metadata TEXT,     -- JSON string for extra fields (language, tool args, etc.)
    embedding BLOB,    -- vector embedding for semantic search (Float32Array, Uint8Array, etc.)
    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(type);
`;

const ATTACHMENTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    message_id TEXT,
    file_name TEXT,
    mime_type TEXT,
    data BLOB,
    FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_attachments_message_id ON attachments(message_id);
`;

const CHAT_SUMMARIES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS chat_summaries (
    id TEXT PRIMARY KEY,
    chat_id TEXT NOT NULL,
    parent_summary_id TEXT,      -- nullable, for summary-of-summary
    start_message_id TEXT,       -- nullable if summarizing summaries
    end_message_id TEXT,
    start_timestamp INTEGER,
    end_timestamp INTEGER,
    summary TEXT NOT NULL,
    embedding BLOB,              -- vector embedding
    token_count INTEGER,
    metadata TEXT,               -- JSON: {topic, tags, ...}
    created_at INTEGER,
    FOREIGN KEY(chat_id) REFERENCES chats(id),
    FOREIGN KEY(parent_summary_id) REFERENCES chat_summaries(id)
);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_chat_id ON chat_summaries(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_summaries_parent ON chat_summaries(parent_summary_id);
`;

const KNOWLEDGE_GRAPH_EDGES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_graph_edges (
    id TEXT PRIMARY KEY,
    from_node_id TEXT NOT NULL,   -- can be chat, summary, topic, etc.
    to_node_id TEXT NOT NULL,
    edge_type TEXT,               -- e.g., 'summarizes', 'references', 'is_about'
    metadata TEXT,                -- JSON for edge properties
    created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_kg_edges_from ON knowledge_graph_edges(from_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_to ON knowledge_graph_edges(to_node_id);
CREATE INDEX IF NOT EXISTS idx_kg_edges_type ON knowledge_graph_edges(edge_type);
`;

const KNOWLEDGE_GRAPH_NODES_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS knowledge_graph_nodes (
    id TEXT PRIMARY KEY,
    type TEXT,           -- e.g. 'entity', 'concept', 'document', etc.
    label TEXT,          -- Human-readable label
    properties TEXT,     -- JSON string for arbitrary node properties
    embedding BLOB,      -- Optional: vector for semantic search
    created_at INTEGER,
    updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_type ON knowledge_graph_nodes(type);
CREATE INDEX IF NOT EXISTS idx_kg_nodes_label ON knowledge_graph_nodes(label);
`; 



/***/ }),

/***/ "./src/Utilities/downloadUtils.js":
/*!****************************************!*\
  !*** ./src/Utilities/downloadUtils.js ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initiateChatDownload: () => (/* binding */ initiateChatDownload)
/* harmony export */ });
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _downloadFormatter_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../downloadFormatter.js */ "./src/downloadFormatter.js");



/**
 * Fetches, formats, and initiates the download for a chat session.
 * @param {string} sessionId - The ID of the session to download.
 * @param {Function} requestDbAndWaitFunc - The function to make DB requests.
 * @param {Function} showNotificationFunc - The function to display notifications.
 */
async function initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotificationFunc) {
    if (!sessionId || !requestDbAndWaitFunc || !showNotificationFunc) {
        console.error("[initiateChatDownload] Failed: Missing sessionId, requestDbAndWaitFunc, or showNotificationFunc.");
        if (showNotificationFunc) showNotificationFunc("Download failed due to internal error.", 'error');
        return;
    }

    console.log(`[initiateChatDownload] Preparing download for: ${sessionId}`);
    showNotificationFunc("Preparing download...", 'info');

    try {
        const sessionData = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_0__.DbGetSessionRequest(sessionId));
        if (!sessionData) {
            throw new Error("Chat session data not found.");
        }

        const htmlContent = (0,_downloadFormatter_js__WEBPACK_IMPORTED_MODULE_1__.formatChatToHtml)(sessionData);
        const safeTitle = (sessionData.title || sessionData.name || 'Chat_Session').replace(/[^a-z0-9_\-\.]/gi, '_').replace(/_{2,}/g, '_');
        const filename = `${safeTitle}_${sessionId.substring(0, 8)}.html`;

        (0,_downloadFormatter_js__WEBPACK_IMPORTED_MODULE_1__.downloadHtmlFile)(htmlContent, filename, (errorMessage) => {
            showNotificationFunc(errorMessage, 'error');
        });
    } catch (error) {
        console.error(`[initiateChatDownload] Error preparing download for ${sessionId}:`, error);
        showNotificationFunc(`Failed to prepare download: ${error.message}`, 'error');
    }
} 

/***/ }),

/***/ "./src/Utilities/generalUtils.js":
/*!***************************************!*\
  !*** ./src/Utilities/generalUtils.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   URL_REGEX: () => (/* binding */ URL_REGEX),
/* harmony export */   debounce: () => (/* binding */ debounce),
/* harmony export */   getActiveTab: () => (/* binding */ getActiveTab),
/* harmony export */   getActiveTabUrl: () => (/* binding */ getActiveTabUrl),
/* harmony export */   showError: () => (/* binding */ showError)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);


function showError(message) {
    console.error("UI Error:", message);
    const errorDiv = document.createElement('div');
    errorDiv.style.position = 'fixed';
    errorDiv.style.bottom = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'red';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '1000';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
}

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
}

const URL_REGEX = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;

function getActiveTab() {
    if (typeof (webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default()) === 'undefined' || !(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs)) {
         console.warn("Utils: Browser context or tabs API not available. Cannot get active tab.");
         return Promise.resolve(null);
    }
    return webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            if (tabs && tabs.length > 0) {
                return tabs[0];
            } else {
                return null;
            }
        })
        .catch(error => {
            console.error("Utils: Error querying active tab:", error.message);
            return null;
        });
}

function getActiveTabUrl() {
    if (typeof (webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default()) === 'undefined' || !(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs)) {
        console.warn("Utils: Browser context or tabs API not available.");
        return Promise.resolve(null);
    }
    return webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.query({ active: true, currentWindow: true })
        .then(tabs => {
            if (tabs && tabs.length > 0 && tabs[0].url) {
                return tabs[0].url;
            } else {
                return null;
            }
        })
        .catch(error => {
            console.error("Utils: Error querying active tab URL:", error.message);
            return Promise.reject(error);
        });
} 

/***/ }),

/***/ "./src/downloadFormatter.js":
/*!**********************************!*\
  !*** ./src/downloadFormatter.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   downloadHtmlFile: () => (/* binding */ downloadHtmlFile),
/* harmony export */   formatChatToHtml: () => (/* binding */ formatChatToHtml)
/* harmony export */ });
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");


/**
 * Formats a chat session object into a self-contained HTML string.
 * @param {object} sessionData - The chat session object from the database.
 * @returns {string} - The generated HTML string.
 */
function formatChatToHtml(sessionData) {
    if (!sessionData) return '';

    const title = sessionData.title || 'Chat Session';
    const messagesHtml = (sessionData.messages || []).map(msg => {
        const senderClass = msg.sender === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.USER ? 'user-message' : 'other-message';
        const senderLabel = msg.sender === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.USER ? 'You' : (msg.sender === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.AI ? 'Agent' : 'System');
        // Basic sanitization: escape HTML characters to prevent XSS if message text somehow contains HTML
        const escapedText = msg.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
        // Convert newlines to <br> tags for display
        const formattedText = escapedText.replace(/\n/g, '<br>');

        return `
            <div class="message-row ${senderClass === 'user-message' ? 'row-user' : 'row-other'}">
                <div class="message-bubble ${senderClass}">
                    <span class="sender-label">${senderLabel}:</span>
                    <div class="message-text">${formattedText}</div>
                </div>
            </div>
        `;
    }).join('\n');

    // Basic CSS for styling the downloaded file
    const css = `
        body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8f9fa; color: #212529; }
        .container { max-width: 800px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #343a40; border-bottom: 1px solid #dee2e6; padding-bottom: 10px; margin-top: 0; }
        .chat-body { margin-top: 20px; }
        .message-row { margin-bottom: 15px; overflow: hidden; /* Clear floats */ }
        .row-user { text-align: right; }
        .row-other { text-align: left; }
        .message-bubble { display: inline-block; padding: 10px 15px; border-radius: 15px; max-width: 75%; word-wrap: break-word; }
        .user-message { background-color: #007bff; color: white; margin-left: auto; /* Align right */ }
        .other-message { background-color: #e9ecef; color: #343a40; margin-right: auto; /* Align left */ }
        .sender-label { font-weight: bold; display: block; margin-bottom: 5px; font-size: 0.9em; color: inherit; }
        .message-text { margin-top: 5px; }
    `;

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</title>
            <style>${css}</style>
        </head>
        <body>
            <div class="container">
                <h1>${title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
                <div class="chat-body">
                    ${messagesHtml}
                </div>
            </div>
        </body>
        </html>
    `;
}

/**
 * Initiates the download of the provided HTML content as a file.
 * Requires the "downloads" permission in manifest.json.
 * @param {string} htmlContent - The HTML string to download.
 * @param {string} filename - The suggested filename (e.g., "chat_session.html").
 * @param {(message: string) => void} [onError] - Optional callback function to handle errors.
 */
function downloadHtmlFile(htmlContent, filename, onError) {
    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        console.log(`Initiating download for: ${filename} (prompting user)`);
        chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true
        }, (downloadId) => {
            const lastError = chrome.runtime.lastError;
            // Important: Always revoke the URL
            setTimeout(() => URL.revokeObjectURL(url), 100);

            if (lastError) {
                const message = lastError.message;
                console.error("Download API error:", message);
                // Don't trigger error callback if the user simply cancelled the dialog
                if (!message || !message.toLowerCase().includes('cancel')) {
                    if (onError) {
                        // Provide a user-friendly message
                        onError(`Download failed: ${message || 'Unknown error'}`);
                    } else {
                        // Fallback if no callback provided (should not happen in our case)
                        console.error("No error handler provided for download failure.");
                        alert(`Download failed: ${message || 'Unknown error'}. Ensure extension has permissions.`);
                    }
                } else {
                    console.log("Download cancelled by user.");
                }
            } else if (downloadId) {
                // Successfully initiated (or dialog opened)
                console.log(`Download initiated (or dialog opened) with ID: ${downloadId}`);
                // We could call an onSuccess callback here if needed
            } else {
                // This case might occur if the user cancels *before* an ID is assigned
                console.log("Download cancelled by user (no downloadId assigned).");
            }
        });
    } catch (error) {
        console.error("Error creating blob or initiating download:", error);
        if (onError) {
            onError("An error occurred while preparing the download.");
        } else {
            console.error("No error handler provided for download preparation error.");
            alert("An error occurred while preparing the download.");
        }
    }
} 

/***/ }),

/***/ "./src/events/dbEvents.js":
/*!********************************!*\
  !*** ./src/events/dbEvents.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DbAddLogRequest: () => (/* binding */ DbAddLogRequest),
/* harmony export */   DbAddMessageRequest: () => (/* binding */ DbAddMessageRequest),
/* harmony export */   DbAddMessageResponse: () => (/* binding */ DbAddMessageResponse),
/* harmony export */   DbAddModelAssetRequest: () => (/* binding */ DbAddModelAssetRequest),
/* harmony export */   DbAddModelAssetResponse: () => (/* binding */ DbAddModelAssetResponse),
/* harmony export */   DbClearLogsRequest: () => (/* binding */ DbClearLogsRequest),
/* harmony export */   DbClearLogsResponse: () => (/* binding */ DbClearLogsResponse),
/* harmony export */   DbCountModelAssetChunksRequest: () => (/* binding */ DbCountModelAssetChunksRequest),
/* harmony export */   DbCountModelAssetChunksResponse: () => (/* binding */ DbCountModelAssetChunksResponse),
/* harmony export */   DbCreateSessionRequest: () => (/* binding */ DbCreateSessionRequest),
/* harmony export */   DbCreateSessionResponse: () => (/* binding */ DbCreateSessionResponse),
/* harmony export */   DbDeleteMessageRequest: () => (/* binding */ DbDeleteMessageRequest),
/* harmony export */   DbDeleteMessageResponse: () => (/* binding */ DbDeleteMessageResponse),
/* harmony export */   DbDeleteSessionRequest: () => (/* binding */ DbDeleteSessionRequest),
/* harmony export */   DbDeleteSessionResponse: () => (/* binding */ DbDeleteSessionResponse),
/* harmony export */   DbEnsureInitializedRequest: () => (/* binding */ DbEnsureInitializedRequest),
/* harmony export */   DbEnsureInitializedResponse: () => (/* binding */ DbEnsureInitializedResponse),
/* harmony export */   DbEventBase: () => (/* binding */ DbEventBase),
/* harmony export */   DbGetAllSessionsRequest: () => (/* binding */ DbGetAllSessionsRequest),
/* harmony export */   DbGetAllSessionsResponse: () => (/* binding */ DbGetAllSessionsResponse),
/* harmony export */   DbGetCurrentAndLastLogSessionIdsRequest: () => (/* binding */ DbGetCurrentAndLastLogSessionIdsRequest),
/* harmony export */   DbGetCurrentAndLastLogSessionIdsResponse: () => (/* binding */ DbGetCurrentAndLastLogSessionIdsResponse),
/* harmony export */   DbGetLogsRequest: () => (/* binding */ DbGetLogsRequest),
/* harmony export */   DbGetLogsResponse: () => (/* binding */ DbGetLogsResponse),
/* harmony export */   DbGetModelAssetChunkRequest: () => (/* binding */ DbGetModelAssetChunkRequest),
/* harmony export */   DbGetModelAssetChunkResponse: () => (/* binding */ DbGetModelAssetChunkResponse),
/* harmony export */   DbGetModelAssetChunksRequest: () => (/* binding */ DbGetModelAssetChunksRequest),
/* harmony export */   DbGetModelAssetChunksResponse: () => (/* binding */ DbGetModelAssetChunksResponse),
/* harmony export */   DbGetReadyStateRequest: () => (/* binding */ DbGetReadyStateRequest),
/* harmony export */   DbGetReadyStateResponse: () => (/* binding */ DbGetReadyStateResponse),
/* harmony export */   DbGetSessionRequest: () => (/* binding */ DbGetSessionRequest),
/* harmony export */   DbGetSessionResponse: () => (/* binding */ DbGetSessionResponse),
/* harmony export */   DbGetStarredSessionsRequest: () => (/* binding */ DbGetStarredSessionsRequest),
/* harmony export */   DbGetStarredSessionsResponse: () => (/* binding */ DbGetStarredSessionsResponse),
/* harmony export */   DbGetUniqueLogValuesRequest: () => (/* binding */ DbGetUniqueLogValuesRequest),
/* harmony export */   DbGetUniqueLogValuesResponse: () => (/* binding */ DbGetUniqueLogValuesResponse),
/* harmony export */   DbInitializationCompleteNotification: () => (/* binding */ DbInitializationCompleteNotification),
/* harmony export */   DbInitializeRequest: () => (/* binding */ DbInitializeRequest),
/* harmony export */   DbListModelFilesRequest: () => (/* binding */ DbListModelFilesRequest),
/* harmony export */   DbListModelFilesResponse: () => (/* binding */ DbListModelFilesResponse),
/* harmony export */   DbLogAllChunkGroupIdsForModelRequest: () => (/* binding */ DbLogAllChunkGroupIdsForModelRequest),
/* harmony export */   DbLogAllChunkGroupIdsForModelResponse: () => (/* binding */ DbLogAllChunkGroupIdsForModelResponse),
/* harmony export */   DbMessagesUpdatedNotification: () => (/* binding */ DbMessagesUpdatedNotification),
/* harmony export */   DbRenameSessionRequest: () => (/* binding */ DbRenameSessionRequest),
/* harmony export */   DbRenameSessionResponse: () => (/* binding */ DbRenameSessionResponse),
/* harmony export */   DbResetDatabaseRequest: () => (/* binding */ DbResetDatabaseRequest),
/* harmony export */   DbResetDatabaseResponse: () => (/* binding */ DbResetDatabaseResponse),
/* harmony export */   DbResponseBase: () => (/* binding */ DbResponseBase),
/* harmony export */   DbSessionUpdatedNotification: () => (/* binding */ DbSessionUpdatedNotification),
/* harmony export */   DbStatusUpdatedNotification: () => (/* binding */ DbStatusUpdatedNotification),
/* harmony export */   DbToggleStarRequest: () => (/* binding */ DbToggleStarRequest),
/* harmony export */   DbToggleStarResponse: () => (/* binding */ DbToggleStarResponse),
/* harmony export */   DbUpdateMessageRequest: () => (/* binding */ DbUpdateMessageRequest),
/* harmony export */   DbUpdateMessageResponse: () => (/* binding */ DbUpdateMessageResponse),
/* harmony export */   DbUpdateStatusRequest: () => (/* binding */ DbUpdateStatusRequest),
/* harmony export */   DbUpdateStatusResponse: () => (/* binding */ DbUpdateStatusResponse)
/* harmony export */ });
/* harmony import */ var _eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./eventNames.js */ "./src/events/eventNames.js");


function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
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
    this.error = error ? (error.message || String(error)) : null;
  }
}

class DbNotificationBase {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.timestamp = Date.now();
    }
}



class DbGetSessionResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(originalRequestId, success, sessionData, error = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = DbGetSessionResponse.type;
  }
}

class DbAddMessageResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = DbAddMessageResponse.type;
  }
}

class DbUpdateMessageResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbUpdateMessageResponse.type;
    }
}

class DbUpdateStatusResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbUpdateStatusResponse.type;
  }
}

class DbDeleteMessageResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteMessageResponse.type;
    }
}

class DbToggleStarResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbToggleStarResponse.type;
    }
}

class DbCreateSessionResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = DbCreateSessionResponse.type;
        console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
    }

    get newSessionId() {
        return this.data?.newSessionId;
    }
}

class DbDeleteSessionResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbDeleteSessionResponse.type;
    }
}

class DbRenameSessionResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = DbRenameSessionResponse.type;
    }
}

class DbGetAllSessionsResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error);
        this.type = DbGetAllSessionsResponse.type;
        this.payload = { sessions };
    }
}

class DbGetStarredSessionsResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); 
        this.type = DbGetStarredSessionsResponse.type;
    }
}

class DbGetReadyStateResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor(originalRequestId, success, ready, error = null) {
        super(originalRequestId, success, { ready }, error);
        this.type = DbGetReadyStateResponse.type;
        this.payload = { ready };
    }
}

// --- Request Events (Define After Response Events) ---

class DbGetSessionRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(sessionId) {
    super();
    this.type = DbGetSessionRequest.type;
    this.payload = { sessionId };
  }
}

class DbAddMessageRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(sessionId, messageObject) {
    super();
    this.type = DbAddMessageRequest.type;
    this.payload = { sessionId, messageObject };
  }
}

class DbUpdateMessageRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId, updates) {
        super();
        this.type = DbUpdateMessageRequest.type;
        this.payload = { sessionId, messageId, updates };
    }
}

class DbUpdateStatusRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(sessionId, status) {
    super();
    this.type = DbUpdateStatusRequest.type;
    this.payload = { sessionId, status };
  }
}

class DbDeleteMessageRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId) {
        super();
        this.type = DbDeleteMessageRequest.type;
        this.payload = { sessionId, messageId };
    }
}

class DbToggleStarRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = DbToggleStarRequest.type;
        this.payload = { sessionId };
    }
}

class DbCreateSessionRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(initialMessage) {
        super();
        this.type = DbCreateSessionRequest.type;
        this.payload = { initialMessage };
        console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
    }
}

class DbInitializeRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_INITIALIZE_REQUEST;
    constructor() {
        super();
        this.type = DbInitializeRequest.type;
        this.payload = {}; 
    }
}

class DbDeleteSessionRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = DbDeleteSessionRequest.type;
        this.payload = { sessionId };
    }
}

class DbRenameSessionRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(sessionId, newName) {
        super();
        this.type = DbRenameSessionRequest.type;
        this.payload = { sessionId, newName };
    }
}

class DbGetAllSessionsRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = DbGetAllSessionsRequest.type;
        console.log('[DEBUG][Create] DbGetAllSessionsRequest:', this, this.type);
    }
}

class DbGetStarredSessionsRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = DbGetStarredSessionsRequest.type;
    }
}

class DbGetReadyStateRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor() {
        super();
        this.type = DbGetReadyStateRequest.type;
    }
}

// --- Notification Events ---

class DbMessagesUpdatedNotification extends DbNotificationBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = DbMessagesUpdatedNotification.type;
        this.payload = { messages }; 
    }
}

class DbStatusUpdatedNotification extends DbNotificationBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_STATUS_UPDATED_NOTIFICATION;
    constructor(sessionId, status) {
        super(sessionId);
        this.type = DbStatusUpdatedNotification.type;
        this.payload = { status };
    }
}

class DbSessionUpdatedNotification extends DbNotificationBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_SESSION_UPDATED_NOTIFICATION;
    constructor(sessionId, updatedSessionData) {
        super(sessionId);
        this.type = DbSessionUpdatedNotification.type;
        this.payload = { session: updatedSessionData }; 
    }
}

class DbInitializationCompleteNotification {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
    constructor({ success, error = null }) {
        this.type = DbInitializationCompleteNotification.type;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (error.message || String(error)) : null };
    }
}

// --- Log Response Events ---

class DbGetLogsResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error); // data = logs array
    this.type = DbGetLogsResponse.type;
  }
}

class DbGetUniqueLogValuesResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error); // data = values array
    this.type = DbGetUniqueLogValuesResponse.type;
  }
}

class DbClearLogsResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_RESPONSE;
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbClearLogsResponse.type;
  }
}

class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor(originalRequestId, success, ids, error = null) {
      // data = { currentLogSessionId: '...', previousLogSessionId: '...' | null }
      super(originalRequestId, success, ids, error);
      this.type = DbGetCurrentAndLastLogSessionIdsResponse.type;
    }
  }

class DbAddLogRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_LOG_REQUEST;
  // No responseEventName needed for fire-and-forget
  constructor(logEntryData) {
    super(); 
    this.type = DbAddLogRequest.type;
    this.payload = { logEntryData };
  }
}

class DbGetLogsRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(filters) {
    // filters = { extensionSessionId: 'id' | 'current' | 'last' | 'all',
    //             component: 'name' | 'all',
    //             level: 'level' | 'all' }
    super();
    this.type = DbGetLogsRequest.type;
    this.payload = { filters };
  }
}

class DbGetUniqueLogValuesRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(fieldName) {
    // fieldName = 'extensionSessionId', 'component', 'level'
    super();
    this.type = DbGetUniqueLogValuesRequest.type;
    this.payload = { fieldName };
  }
}

class DbClearLogsRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_RESPONSE;
    constructor(filter = 'all') { // 'all' or potentially 'last_session' or specific session ID later
        super();
        this.type = DbClearLogsRequest.type;
        this.payload = { filter };
    }
}

class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor() {
        super();
        this.type = DbGetCurrentAndLastLogSessionIdsRequest.type;
    }
}

class DbResetDatabaseRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RESET_DATABASE_REQUEST;
  constructor() {
    super();
    this.type = DbResetDatabaseRequest.type;
  }
}

class DbResetDatabaseResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RESET_DATABASE_RESPONSE;
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = DbResetDatabaseResponse.type;
  }
}

// --- Model Asset DB Operations ---

class DbAddModelAssetRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MODEL_ASSET_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MODEL_ASSET_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbAddModelAssetRequest.type;
    this.payload = payload;
  }
}
class DbAddModelAssetResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MODEL_ASSET_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbAddModelAssetResponse.type;
  }
}

class DbCountModelAssetChunksRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_COUNT_MODEL_ASSET_CHUNKS_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_COUNT_MODEL_ASSET_CHUNKS_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbCountModelAssetChunksRequest.type;
    this.payload = payload;
  }
}
class DbCountModelAssetChunksResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_COUNT_MODEL_ASSET_CHUNKS_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbCountModelAssetChunksResponse.type;
  }
}

class DbLogAllChunkGroupIdsForModelRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbLogAllChunkGroupIdsForModelRequest.type;
    this.payload = payload;
  }
}
class DbLogAllChunkGroupIdsForModelResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbLogAllChunkGroupIdsForModelResponse.type;
  }
}

class DbListModelFilesRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LIST_MODEL_FILES_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LIST_MODEL_FILES_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbListModelFilesRequest.type;
    this.payload = payload;
  }
}
class DbListModelFilesResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_LIST_MODEL_FILES_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbListModelFilesResponse.type;
  }
}

class DbGetModelAssetChunksRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNKS_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNKS_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbGetModelAssetChunksRequest.type;
    this.payload = payload;
  }
}
class DbGetModelAssetChunksResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNKS_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbGetModelAssetChunksResponse.type;
  }
}

class DbGetModelAssetChunkRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNK_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNK_RESPONSE;
  constructor(payload) {
    super();
    this.type = DbGetModelAssetChunkRequest.type;
    this.payload = payload;
  }
}
class DbGetModelAssetChunkResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_MODEL_ASSET_CHUNK_RESPONSE;
  constructor(originalRequestId, success, result, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbGetModelAssetChunkResponse.type;
  }
}

class DbEnsureInitializedRequest extends DbEventBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ENSURE_INITIALIZED_REQUEST;
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ENSURE_INITIALIZED_RESPONSE;
  constructor() {
    super();
    this.type = DbEnsureInitializedRequest.type;
  }
}
class DbEnsureInitializedResponse extends DbResponseBase {
  static type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ENSURE_INITIALIZED_RESPONSE;
  constructor(originalRequestId, success, result = null, error = null) {
    super(originalRequestId, success, result, error);
    this.type = DbEnsureInitializedResponse.type;
  }
} 

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
/* harmony export */   DBPaths: () => (/* binding */ DBPaths),
/* harmony export */   DirectDBNames: () => (/* binding */ DirectDBNames),
/* harmony export */   InternalEventBusMessageTypes: () => (/* binding */ InternalEventBusMessageTypes),
/* harmony export */   MessageContentTypes: () => (/* binding */ MessageContentTypes),
/* harmony export */   MessageSenderTypes: () => (/* binding */ MessageSenderTypes),
/* harmony export */   ModelLoaderMessageTypes: () => (/* binding */ ModelLoaderMessageTypes),
/* harmony export */   ModelWorkerStates: () => (/* binding */ ModelWorkerStates),
/* harmony export */   RawDirectMessageTypes: () => (/* binding */ RawDirectMessageTypes),
/* harmony export */   RuntimeMessageTypes: () => (/* binding */ RuntimeMessageTypes),
/* harmony export */   SiteMapperMessageTypes: () => (/* binding */ SiteMapperMessageTypes),
/* harmony export */   TableNames: () => (/* binding */ TableNames),
/* harmony export */   UIEventNames: () => (/* binding */ UIEventNames),
/* harmony export */   WorkerEventNames: () => (/* binding */ WorkerEventNames)
/* harmony export */ });
const DirectDBNames = Object.freeze({
  ADD_MODEL_ASSET: 'AddModelAsset',
  REQUEST_MODEL_ASSET_CHUNK: 'RequestModelAssetChunk',
  COUNT_MODEL_ASSET_CHUNKS: 'CountModelAssetChunks',
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

  // Model Asset DB Operations
  DB_ADD_MODEL_ASSET_REQUEST: 'DbAddModelAssetRequest',
  DB_ADD_MODEL_ASSET_RESPONSE: 'DbAddModelAssetResponse',
  DB_COUNT_MODEL_ASSET_CHUNKS_REQUEST: 'DbCountModelAssetChunksRequest',
  DB_COUNT_MODEL_ASSET_CHUNKS_RESPONSE: 'DbCountModelAssetChunksResponse',
  DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_REQUEST: 'DbLogAllChunkGroupIdsForModelRequest',
  DB_LOG_ALL_CHUNK_GROUP_IDS_FOR_MODEL_RESPONSE: 'DbLogAllChunkGroupIdsForModelResponse',
  DB_LIST_MODEL_FILES_REQUEST: 'DbListModelFilesRequest',
  DB_LIST_MODEL_FILES_RESPONSE: 'DbListModelFilesResponse',
  DB_GET_MODEL_ASSET_CHUNKS_REQUEST: 'DbGetModelAssetChunksRequest',
  DB_GET_MODEL_ASSET_CHUNKS_RESPONSE: 'DbGetModelAssetChunksResponse',
  DB_GET_MODEL_ASSET_CHUNK_REQUEST: 'DbGetModelAssetChunkRequest',
  DB_GET_MODEL_ASSET_CHUNK_RESPONSE: 'DbGetModelAssetChunkResponse',
  DB_ENSURE_INITIALIZED_REQUEST: 'DbEnsureInitializedRequest',
  DB_ENSURE_INITIALIZED_RESPONSE: 'DbEnsureInitializedResponse',
  DB_INIT_WORKER_REQUEST: 'DbInitWorkerRequest',
  DB_INIT_WORKER_RESPONSE: 'DbInitWorkerResponse',
  DB_WORKER_ERROR: 'DbWorkerError',
  DB_WORKER_RESET: 'DbWorkerReset',
});

const UIEventNames = Object.freeze({
  QUERY_SUBMITTED: 'querySubmitted',
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
  MODEL_DOWNLOAD_PROGRESS: 'modelDownloadProgress',
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
  GENERATE: 'Generate',
  INTERRUPT: 'Interrupt',
  RESET: 'Reset',
  DOWNLOAD_MODEL_ASSETS: 'DownloadModelAssets',
  LIST_MODEL_FILES: 'ListModelFiles',
  LIST_MODEL_FILES_RESULT: 'ListModelFilesResult',
});

const InternalEventBusMessageTypes = Object.freeze({
  BACKGROUND_EVENT_BROADCAST: 'BackgroundEventBroadcast'
});

const RawDirectMessageTypes = Object.freeze({
  WORKER_GENERIC_RESPONSE: 'WorkerGenericResponse',
  WORKER_GENERIC_ERROR: 'WorkerGenericError',
  WORKER_SCRAPE_STAGE_RESULT: 'WorkerScrapeStageResult',
  WORKER_DIRECT_SCRAPE_RESULT: 'WorkerDirectScrapeResult',
  WORKER_UI_LOADING_STATUS_UPDATE: 'UiLoadingStatusUpdate' // This one is used as a direct message type
});

const Contexts = Object.freeze({
  BACKGROUND: 'Background',
  MAIN_UI: 'MainUI',
  POPUP: 'Popup',
  OTHERS: 'Others',
  UNKNOWN: 'Unknown',
});

const MessageSenderTypes = Object.freeze({
  USER: 'user',
  SYSTEM: 'system',
  AI: 'ai',
  AGENT: 'agent',
  // Add more as needed
});

const MessageContentTypes = Object.freeze({
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  CODE: 'code',
  AGENT_ACTION: 'agent_action',
  // Add more as needed
});

const DBPaths = Object.freeze({
  CHAT: '/sql/chat.db',
  LOGS: '/sql/logs.db',
  MODELS: '/sql/models.db',
  KNOWLEDGE: '/sql/knowledge.db',
});

const TableNames = Object.freeze({
  CHATS: 'chats',
  MESSAGES: 'messages',
  CHAT_SUMMARIES: 'chat_summaries',
  ATTACHMENTS: 'attachments',
  USERS: 'users',
  LOGS: 'logs',
  MODEL_ASSETS: 'model_assets',
  KNOWLEDGE_GRAPH_NODES: 'knowledge_graph_nodes',
  KNOWLEDGE_GRAPH_EDGES: 'knowledge_graph_edges',
});



/***/ }),

/***/ "./src/minimaldb.js":
/*!**************************!*\
  !*** ./src/minimaldb.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autoEnsureDbInitialized: () => (/* binding */ autoEnsureDbInitialized),
/* harmony export */   forwardDbRequest: () => (/* binding */ forwardDbRequest),
/* harmony export */   resetDatabase: () => (/* binding */ resetDatabase)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Utilities/dbSchema.js */ "./src/Utilities/dbSchema.js");
/* harmony import */ var _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Utilities/dbChannels.js */ "./src/Utilities/dbChannels.js");
// --- Imports ---






// --- Constants ---
const DB_INIT_TIMEOUT = 15000;
const POLL_INTERVAL = 100;
const LOG_THROTTLE_MS = 2000;

// --- State ---
let SQL = null;
let absurdSqlBackendInitialized = false;
let chatDB = null;
let logDB = null;
let modelDB = null;
let isDbInitialized = false;
let isLogDbInitialized = false;
let isModelDbInitialized = false;
let isDbReadyFlag = false;
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;
let dbReadyResolve;
let dbReadyPromise = new Promise((resolve) => {
  dbReadyResolve = resolve;
});
let dbInitPromise = null;
let isDbInitInProgress = false;
let dbWorker = null;
let dbWorkerReady = false;
let dbWorkerRequestId = 0;
let dbWorkerCallbacks = {};

// --- Error Handling ---
class AppError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

// --- Worker Management ---
function getDbWorker() {
  if (!dbWorker) {
    const workerUrl = webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.getURL('js/absurd-sql-backends/sql-worker.js');
    dbWorker = new Worker(workerUrl, { type: 'module' });
    dbWorker.onmessage = (event) => {
      const { requestId, type, result, error, stack } = event.data;
      if (requestId && dbWorkerCallbacks[requestId]) {
        if (error) {
          let errObj = error;
          if (typeof error === 'string') {
            errObj = new Error(error);
            if (stack) errObj.stack = stack;
          } else if (error instanceof Object && !(error instanceof Error)) {
            errObj = new Error(error.message || 'Worker error object');
            Object.assign(errObj, error);
            if (stack) errObj.stack = stack;
          }
          dbWorkerCallbacks[requestId].reject(errObj);
        } else {
          dbWorkerCallbacks[requestId].resolve(result);
        }
        delete dbWorkerCallbacks[requestId];
      } else if (type === 'debug') {
        // console.log(`[DB Worker Debug] ${event.data.message}`);
      } else if (type === 'fatal') {
        console.error(`[DB Worker Fatal] ${event.data.error}`, event.data.stack);
        Object.values(dbWorkerCallbacks).forEach((cb) =>
          cb.reject(new Error('DB Worker encountered a fatal error'))
        );
        dbWorkerCallbacks = {};
      } else if (type === 'ready') {
        dbWorkerReady = true;
        console.log('[DB] SQL Worker signaled script ready.');
      }
    };
    dbWorker.onerror = (errEvent) => {
      console.error('[DB] Uncaught error in DB Worker:', errEvent.message, errEvent);
      Object.values(dbWorkerCallbacks).forEach((cb) =>
        cb.reject(new Error(`DB Worker crashed: ${errEvent.message || 'Unknown worker error'}`))
      );
      dbWorkerCallbacks = {};
      dbWorker = null;
      dbWorkerReady = false;
      absurdSqlBackendInitialized = false;
    };
  }
  return dbWorker;
}

async function sendDbWorkerRequest(type, payload) {
  console.log(`[Trace][minimaldb] sendDbWorkerRequest: Called with type=${type}, payload=`, payload);
  const worker = getDbWorker();
  if (!dbWorkerReady) {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Worker 'ready' signal timeout")), 10000);
      const check = () => {
        if (dbWorkerReady) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }
  console.log('[Trace][minimaldb] sendDbWorkerRequest: Posting to worker', { type, payload });
  return new Promise((resolve, reject) => {
    const requestId = (++dbWorkerRequestId).toString();
    dbWorkerCallbacks[requestId] = { resolve, reject };
    worker.postMessage({ requestId, type, payload });
  });
}

// --- Database Initialization ---
async function initializeDatabasesAndBackend(isReset = false) {
  console.log(`[DB] initializeDatabasesAndBackend called (isReset: ${isReset})`);
  getDbWorker();
  const wasmUrl = webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.getURL('wasm/sql-wasm-debug.wasm');
  const dbFilesToCreate = [
    {
      path: '/sql/chat.db',
      schema:
        _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.CHATS_TABLE_SQL +
        '\n' +
        _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGES_TABLE_SQL +
        '\n' +
        _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.CHAT_SUMMARIES_TABLE_SQL,
    },
    { path: '/sql/logs.db', schema: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.LOG_TABLE_SQL },
    { path: '/sql/models.db', schema: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.MODEL_ASSET_TABLE_SQL },
    {
      path: '/sql/knowledge.db',
      schema: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_GRAPH_EDGES_TABLE_SQL + '\n' + _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.KNOWLEDGE_GRAPH_NODES_TABLE_SQL,
    },
  ];
  const dbFilesAndTables = [
    { path: '/sql/chat.db', tables: ['chats', 'messages', 'chat_summaries'] },
    { path: '/sql/logs.db', tables: ['logs'] },
    { path: '/sql/models.db', tables: ['model_assets'] },
    { path: '/sql/knowledge.db', tables: ['knowledge_graph_edges', 'knowledge_graph_nodes'] },
  ];
  const payload = {
    wasmUrl,
    schema: {
      CHATS_TABLE_SQL: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.CHATS_TABLE_SQL,
      LOG_TABLE_SQL: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.LOG_TABLE_SQL,
      MODEL_ASSET_TABLE_SQL: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.MODEL_ASSET_TABLE_SQL,
      MESSAGES_TABLE_SQL: _Utilities_dbSchema_js__WEBPACK_IMPORTED_MODULE_3__.MESSAGES_TABLE_SQL,
    },
    dbFilesToCreate,
    dbFilesAndTables,
  };
  console.log('[DB] Sending worker init/reset with payload:', payload);
  await sendDbWorkerRequest(
    isReset ? _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.DBEventNames.DB_WORKER_RESET : _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.DBEventNames.DB_INIT_WORKER_REQUEST,
    payload
  );
  absurdSqlBackendInitialized = true;
  isDbInitialized = true;
  isLogDbInitialized = true;
  isModelDbInitialized = true;
  isDbReadyFlag = true;
  if (dbReadyResolve) dbReadyResolve(true);
  dbReadyPromise = Promise.resolve(true);
}

async function handleInitializeRequest(isAutoEnsureCall = false) {
  console.log('[DB] handleInitializeRequest ENTRY', {
    isDbReadyFlag,
    isDbInitialized,
    isLogDbInitialized,
    isModelDbInitialized,
    absurdSqlBackendInitialized,
    SQL_exists: !!SQL,
  });
  if (
    SQL &&
    absurdSqlBackendInitialized &&
    isDbInitialized &&
    isLogDbInitialized &&
    isModelDbInitialized &&
    isDbReadyFlag &&
    !isAutoEnsureCall
  ) {
    return { success: true };
  }
  try {
    const ids = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
    currentExtensionSessionId = ids.currentLogSessionId || null;
    previousExtensionSessionId = ids.previousLogSessionId || null;
    if (!currentExtensionSessionId) {
      const msg = 'CRITICAL: currentLogSessionId not found in storage during DB init!';
      console.error('[DB] Database:Initialize]', msg);
      if (dbReadyResolve) dbReadyResolve(false);
      dbReadyPromise = new Promise((resolve) => {
        dbReadyResolve = resolve;
      });
      return { success: false, error: msg };
    }
  } catch (storageError) {
    console.error('[DB] Failed to retrieve log session IDs from storage', {
      error: storageError,
      stack: storageError?.stack,
    });
    if (dbReadyResolve) dbReadyResolve(false);
    dbReadyPromise = new Promise((resolve) => {
      dbReadyResolve = resolve;
    });
    return { success: false, error: storageError.message || String(storageError) };
  }
  try {
    await initializeDatabasesAndBackend(false);
    console.log('[DB] Databases initialization complete.');
    return { success: true };
  } catch (error) {
    console.error('[DB] CAUGHT ERROR during initializeDatabasesAndBackend:', error, error?.stack);
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INIT_FAILED', 'Database initialization failed', {
            originalError: error.message,
          });
    isDbInitialized = false;
    isLogDbInitialized = false;
    isModelDbInitialized = false;
    isDbReadyFlag = false;
    absurdSqlBackendInitialized = false;
    if (dbReadyResolve) dbReadyResolve(false);
    dbReadyPromise = new Promise((resolve) => {
      dbReadyResolve = resolve;
    });
    return { success: false, error: appError.message || String(appError) };
  }
}

async function autoEnsureDbInitialized() {
  if (isDbReadyFlag && absurdSqlBackendInitialized) {
    return { success: true };
  }
  if (isDbInitInProgress) {
    return dbInitPromise;
  }
  isDbInitInProgress = true;
  dbInitPromise = (async () => {
    try {
      const response = await handleInitializeRequest(true);
      if (response?.success) {
        return { success: true };
      }
      return { success: false, error: response?.error || 'Database failed to initialize (autoEnsure)' };
    } catch (err) {
      console.error('[DB] autoEnsureDbInitialized -> Initialization failed:', err);
      isDbInitInProgress = false;
      return { success: false, error: err.message || String(err) };
    } finally {
      isDbInitInProgress = false;
    }
  })();
  return dbInitPromise;
}

async function ensureDbReady(type = 'chat') {
  const dbInstanceGetter =
    {
      chat: () => chatDB,
      log: () => logDB,
      model: () => modelDB,
      modelAssets: () => modelDB,
    }[type] || (() => { throw new AppError('INVALID_INPUT', `Unknown DB type requested: ${type}`); });
  const isInitializedFlagGetter =
    {
      chat: () => isDbInitialized,
      log: () => isLogDbInitialized,
      model: () => isModelDbInitialized,
      modelAssets: () => isModelDbInitialized,
    }[type] || (() => false);
  if (!isDbInitInProgress && !(isDbReadyFlag && absurdSqlBackendInitialized)) {
    try {
      await autoEnsureDbInitialized();
    } catch (initError) {
      throttledLog(
        'error',
        `[DB][ensureDbReady] autoEnsureDbInitialized failed for DB type '${type}'`,
        null,
        initError
      );
      throw new AppError('DB_INIT_FAILED', `DB auto-init failed for type '${type}': ${initError.message}`);
    }
  } else if (isDbInitInProgress) {
    await dbInitPromise;
  }
  const start = Date.now();
  let waitingLogged = false;
  while (Date.now() - start < DB_INIT_TIMEOUT) {
    const dbInstance = dbInstanceGetter();
    const isInitializedFlag = isInitializedFlagGetter();
    if (dbInstance && isInitializedFlag && absurdSqlBackendInitialized && isDbReadyFlag) {
      return dbInstance;
    }
    if (!waitingLogged && Date.now() - start > 300) {
      throttledLog(
        'log',
        `[DB][ensureDbReady] Waiting for DB type '${type}'`,
        null,
        `(absurdSqlBackendInitialized: ${absurdSqlBackendInitialized}, isDbReadyFlag: ${isDbReadyFlag}, specific init: ${isInitializedFlag})... elapsed: ${Date.now() - start}ms`
      );
      waitingLogged = true;
    }
    await new Promise((res) => setTimeout(res, POLL_INTERVAL));
  }
  const dbInstance = dbInstanceGetter();
  const isInitializedFlag = isInitializedFlagGetter();
  if (!dbInstance || !isInitializedFlag || !absurdSqlBackendInitialized || !isDbReadyFlag) {
    throttledLog(
      'error',
      `[DB][ensureDbReady] DB for type '${type}' not initialized after ${DB_INIT_TIMEOUT}ms`,
      null,
      `DB: ${!!dbInstance}, InitFlag: ${isInitializedFlag}, AbsurdReady: ${absurdSqlBackendInitialized}, GlobalReady: ${isDbReadyFlag}`
    );
    throw new AppError('DB_NOT_READY', `DB for type '${type}' not initialized after ${DB_INIT_TIMEOUT}ms`);
  }
  return dbInstance;
}

// --- Internal DB Operations ---
async function createChatSessionInternal(initialMessage) {
  if (!initialMessage?.text) {
    return { success: false, error: 'Initial message with text is required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCreateSessionRequest.type, { initialMessage });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to create session' };
  }
  await publishSessionUpdate(result.data.id, 'create', result.data);
  await publishMessagesUpdate(result.data.id, result.data.messages);
  await publishStatusUpdate(result.data.id, result.data.status);
  return { success: true, data: result.data };
}

async function getChatSessionByIdInternal(sessionId) {
  if (!sessionId) {
    return { success: false, error: 'Session ID is required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest.type, { sessionId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Session ${sessionId} not found` };
  }
  return { success: true, data: result.data };
}

async function addMessageToChatInternal(chatId, messageObject) {
  if (!chatId || !messageObject?.text) {
    return { success: false, error: 'Chat ID and message with text are required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageRequest.type, { chatId, messageObject });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to add message' };
  }
  await publishSessionUpdate(chatId, 'update', result.data.updatedDoc);
  await publishMessagesUpdate(chatId, result.data.updatedDoc.messages);
  return { success: true, data: result.data };
}

async function updateMessageInChatInternal(chatId, messageId, updates) {
  if (!chatId || !messageId || !updates || (!updates.text && typeof updates.isLoading === 'undefined')) {
    return {
      success: false,
      error: 'Chat ID, message ID, and updates (with text or isLoading) are required',
    };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateMessageRequest.type, {
    chatId,
    messageId,
    updates,
  });
  console.log('[minimaldb] updateMessageInChatInternal result:', result);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to update message' };
  }
  await publishSessionUpdate(chatId, 'update', result.data);
  await publishMessagesUpdate(chatId, result.data.messages);
  return { success: true, data: result.data };
}

async function deleteMessageFromChatInternal(sessionId, messageId) {
  if (!sessionId || !messageId) {
    return { success: false, error: 'Session ID and message ID are required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteMessageRequest.type, { sessionId, messageId });
  if (!result?.success) {
    return {
      success: false,
      error: result?.error || `Failed to delete message ${messageId} from session ${sessionId}`,
    };
  }
  await publishSessionUpdate(sessionId, 'update', result.data.updatedDoc);
  await publishMessagesUpdate(sessionId, result.data.updatedDoc.messages);
  return { success: true, data: result.data };
}

async function updateSessionStatusInternal(sessionId, newStatus) {
  const validStatuses = ['idle', 'processing', 'complete', 'error'];
  if (!sessionId || !validStatuses.includes(newStatus)) {
    return { success: false, error: `Invalid session ID or status: ${newStatus}` };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateStatusRequest.type, { sessionId, status: newStatus });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to update session status to ${newStatus}` };
  }
  await publishSessionUpdate(sessionId, 'update', result.data);
  await publishStatusUpdate(sessionId, newStatus);
  return { success: true, data: result.data };
}

async function toggleItemStarredInternal(itemId) {
  if (!itemId) {
    return { success: false, error: 'Item ID is required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest.type, { sessionId: itemId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to toggle starred status for item ${itemId}` };
  }
  await publishSessionUpdate(itemId, 'update', result.data);
  return { success: true, data: result.data };
}

async function deleteHistoryItemInternal(itemId) {
  if (!itemId) {
    return { success: false, error: 'Item ID is required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest.type, { sessionId: itemId });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to delete item ${itemId}` };
  }
  await publishSessionUpdate(itemId, 'delete');
  return { success: true, data: result.data };
}

async function renameHistoryItemInternal(itemId, newTitle) {
  if (!itemId || !newTitle) {
    return { success: false, error: 'Item ID and new title are required' };
  }
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest.type, {
    sessionId: itemId,
    newName: newTitle,
  });
  if (!result?.success) {
    return { success: false, error: result?.error || `Failed to rename item ${itemId} to ${newTitle}` };
  }
  await publishSessionUpdate(itemId, 'rename', result.data);
  return { success: true, data: result.data };
}

async function getAllSessionsInternal() {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsRequest.type);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to retrieve all sessions' };
  }
  return { success: true, data: result.data };
}

async function getStarredSessionsInternal() {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsRequest.type);
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to retrieve starred sessions' };
  }
  return { success: true, data: result.data };
}

async function getLogsInternal(filters) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetLogsRequest.type, { filters });
  if (!result?.success) return [];
  return result.data;
}

async function getUniqueLogValuesInternal(fieldName) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetUniqueLogValuesRequest.type, { fieldName });
  if (!result?.success) return [];
  return result.data;
}

async function clearLogsInternal(sessionIdsToDelete) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsRequest.type, { sessionIdsToDelete });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to clear logs', data: { deletedCount: 0 } };
  }
  return result;
}

async function getAllUniqueLogSessionIdsInternal() {
  try {
    const db = await ensureDbReady('log');
    const rows = await queryAll(db, `SELECT DISTINCT extensionSessionId FROM logs WHERE extensionSessionId IS NOT NULL`);
    const uniqueIds = new Set(rows.map((r) => r.extensionSessionId));
    return { success: true, data: uniqueIds };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
}

// --- Request Handlers ---
async function handleRequest(
  event,
  internalHandler,
  ResponseClass,
  timeout = 5000,
  successDataExtractor = (result) => result.data,
  errorDetailsExtractor = () => ({})
) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const result = await withTimeout(internalHandler(event.payload), timeout);
    console.log('[Trace][minimaldb] handleRequest: result', result);
    if (!result.success) {
      throw new AppError('INTERNAL_OPERATION_FAILED', result.error || 'Unknown internal error', errorDetailsExtractor(result));
    }
    const responseData = successDataExtractor(result);
    return new ResponseClass(requestId, true, responseData);
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('UNKNOWN_HANDLER_ERROR', error.message || 'Failed in request handler', {
            originalError: error,
            ...errorDetailsExtractor(error),
          });
    return new ResponseClass(requestId, false, null, appError);
  }
}

const dbHandlerMap = {
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetReadyStateRequest.type]: handleDbGetReadyStateRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCreateSessionRequest.type]: handleDbCreateSessionRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest.type]: handleDbGetSessionRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageRequest.type]: handleDbAddMessageRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateMessageRequest.type]: handleDbUpdateMessageRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteMessageRequest.type]: handleDbDeleteMessageRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateStatusRequest.type]: handleDbUpdateStatusRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest.type]: handleDbToggleStarRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsRequest.type]: handleDbGetAllSessionsRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsRequest.type]: handleDbGetStarredSessionsRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest.type]: handleDbDeleteSessionRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest.type]: handleDbRenameSessionRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddLogRequest.type]: handleDbAddLogRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetLogsRequest.type]: handleDbGetLogsRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetUniqueLogValuesRequest.type]: handleDbGetUniqueLogValuesRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsRequest.type]: handleDbClearLogsRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetCurrentAndLastLogSessionIdsRequest.type]: handleDbGetCurrentAndLastLogSessionIdsRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbResetDatabaseRequest.type]: handleDbResetDatabaseRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddModelAssetRequest.type]: handleDbAddModelAssetRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCountModelAssetChunksRequest.type]: handleDbCountModelAssetChunksRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbLogAllChunkGroupIdsForModelRequest.type]: handleDbLogAllChunkGroupIdsForModelRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbListModelFilesRequest.type]: handleDbListModelFilesRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunksRequest.type]: handleDbGetModelAssetChunksRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunkRequest.type]: handleDbGetModelAssetChunkRequest,
  [_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedRequest.type]: async (event) => {
    try {
      await autoEnsureDbInitialized();
      return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedResponse(event.requestId, true);
    } catch (e) {
      return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedResponse(event.requestId, false, null, e);
    }
  },
};

async function handleDbGetReadyStateRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  return { success: true, data: { ready: isDbReadyFlag && absurdSqlBackendInitialized } };
}

async function handleDbCreateSessionRequest(event) {
  console.log('[Trace][minimaldb] handleDbCreateSessionRequest: called with', event);
  if (!event?.payload?.initialMessage?.text) {
    throw new AppError('INVALID_INPUT', 'Missing initialMessage or message text');
  }
  return handleRequest(
    event,
    (payload) => createChatSessionInternal(payload.initialMessage),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCreateSessionResponse,
    5000,
    (res) => res.data.id
  );
}

async function handleDbGetSessionRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => getChatSessionByIdInternal(payload.sessionId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionResponse,
    5000,
    (res) => (res.data ? res.data : null)
  );
}

async function handleDbAddMessageRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.messageObject?.text) {
    throw new AppError('INVALID_INPUT', 'Session ID and message with text are required');
  }
  return handleRequest(
    event,
    (payload) => addMessageToChatInternal(payload.sessionId, payload.messageObject),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageResponse,
    5000,
    (res) => res.data.newMessageId
  );
}

async function handleDbUpdateMessageRequest(event) {
  console.log('[minimaldb] handleDbUpdateMessageRequest called with event:', event);
  if (
    !event?.payload?.sessionId ||
    !event?.payload?.messageId ||
    !event?.payload?.updates ||
    (!event.payload.updates.text && typeof event.payload.updates.isLoading === 'undefined')
  ) {
    throw new AppError(
      'INVALID_INPUT',
      'Session ID, message ID, and updates (with text or isLoading) are required'
    );
  }
  return handleRequest(
    event,
    (payload) => updateMessageInChatInternal(payload.sessionId, payload.messageId, payload.updates),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateMessageResponse,
    5000,
    () => true
  );
}

async function handleDbDeleteMessageRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.messageId) {
    throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
  }
  return handleRequest(
    event,
    (payload) => deleteMessageFromChatInternal(payload.sessionId, payload.messageId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteMessageResponse,
    5000,
    () => true
  );
}

async function handleDbUpdateStatusRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.status) {
    throw new AppError('INVALID_INPUT', 'Session ID and status are required');
  }
  const wrappedHandler = async (payload) => {
    try {
      return await updateSessionStatusInternal(payload.sessionId, payload.status);
    } catch (e) {
      await publishStatusUpdate(payload.sessionId, 'error');
      throw e;
    }
  };
  return handleRequest(event, wrappedHandler, _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbUpdateStatusResponse, 5000, () => true);
}

async function handleDbToggleStarRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => toggleItemStarredInternal(payload.sessionId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarResponse,
    5000,
    (res) => res.data
  );
}

async function handleDbGetAllSessionsRequest(event) {
  console.log('[Trace][minimaldb] handleDbGetAllSessionsRequest: called with', event);
  return handleRequest(
    event,
    getAllSessionsInternal,
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsResponse,
    5000,
    (res) => (res.data || []).sort((a, b) => b.timestamp - a.timestamp)
  );
}

async function handleDbGetStarredSessionsRequest(event) {
  return handleRequest(
    event,
    getStarredSessionsInternal,
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsResponse,
    5000,
    (res) =>
      (res.data || [])
        .map((s) => ({ sessionId: s.id, name: s.title, lastUpdated: s.timestamp, isStarred: s.isStarred }))
        .sort((a, b) => b.lastUpdatedpls - a.lastUpdated)
  );
}

async function handleDbDeleteSessionRequest(event) {
  if (!event?.payload?.sessionId) {
    throw new AppError('INVALID_INPUT', 'Session ID is required');
  }
  return handleRequest(
    event,
    (payload) => deleteHistoryItemInternal(payload.sessionId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionResponse,
    5000,
    () => true
  );
}

async function handleDbRenameSessionRequest(event) {
  if (!event?.payload?.sessionId || !event?.payload?.newName) {
    throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
  }
  return handleRequest(
    event,
    (payload) => renameHistoryItemInternal(payload.sessionId, payload.newName),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionResponse,
    5000,
    () => true
  );
}

async function handleDbAddLogRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    if (!event?.payload?.logEntryData) {
      throw new AppError('INVALID_INPUT', 'Missing logEntryData in payload');
    }
    const db = await ensureDbReady('log');
    const entry = event.payload.logEntryData;
    await runQuery(
      db,
      `INSERT INTO logs (id, timestamp, level, message, component, extensionSessionId, chatSessionId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.id,
        entry.timestamp,
        entry.level,
        entry.message,
        entry.component,
        entry.extensionSessionId,
        entry.chatSessionId || null,
      ]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message || String(error) };
  }
}

async function handleDbGetLogsRequest(event) {
  if (!event?.payload?.filters) {
    throw new AppError('INVALID_INPUT', 'Missing filters in payload');
  }
  return handleRequest(event, (payload) => getLogsInternal(payload.filters), _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetLogsResponse);
}

async function handleDbGetUniqueLogValuesRequest(event) {
  if (!event?.payload?.fieldName) {
    throw new AppError('INVALID_INPUT', 'Missing fieldName in payload');
  }
  return handleRequest(
    event,
    (payload) => getUniqueLogValuesInternal(payload.fieldName),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetUniqueLogValuesResponse
  );
}

async function handleDbClearLogsRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const allLogSessionIdsResult = await getAllUniqueLogSessionIdsInternal();
    if (!allLogSessionIdsResult.success) {
      throw new AppError(
        'FETCH_FAILED',
        allLogSessionIdsResult.error || 'Failed to get unique log session IDs for clearing.'
      );
    }
    const allLogSessionIds = allLogSessionIdsResult.data;
    const sessionsToKeep = new Set();
    if (currentExtensionSessionId) sessionsToKeep.add(currentExtensionSessionId);
    if (previousExtensionSessionId) sessionsToKeep.add(previousExtensionSessionId);
    const sessionIdsToDelete = Array.from(allLogSessionIds).filter((id) => !sessionsToKeep.has(id));
    let deletedCount = 0;
    if (sessionIdsToDelete.length > 0) {
      const clearResult = await clearLogsInternal(sessionIdsToDelete);
      if (clearResult.success) deletedCount = clearResult.data.deletedCount;
      else throw new AppError('DELETE_FAILED', clearResult.error || 'Failed to delete old logs.');
    }
    return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsResponse(requestId, true, { deletedCount });
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('UNKNOWN', 'Failed to clear logs', { originalError: error });
    return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsResponse(requestId, false, null, appError);
  }
}

async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
  const requestId = event?.requestId || crypto.randomUUID();
  try {
    await autoEnsureDbInitialized();
    const ids = { currentLogSessionId: currentExtensionSessionId, previousLogSessionId: previousExtensionSessionId };
    return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetCurrentAndLastLogSessionIdsResponse(requestId, true, ids);
  } catch (error) {
    const appError = new AppError('UNKNOWN', 'Failed to get current/last log session IDs', {
      originalError: error,
    });
    return new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetCurrentAndLastLogSessionIdsResponse(requestId, false, null, appError);
  }
}

async function handleDbResetDatabaseRequest(event) {
  return await sendDbWorkerRequest(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.DBEventNames.DB_WORKER_RESET);
}

// --- Notification Utilities ---
function smartNotify(notification) {
  const payloadKeys = notification && notification.payload ? Object.keys(notification.payload) : [];
  const sessionId = notification.sessionId || (notification.payload && notification.payload.session && notification.payload.session.id) || 'N/A';
  let deliveryPath = '';
  if (typeof window === 'undefined') {
    deliveryPath = 'background (browser.runtime.sendMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage(notification);
  } else if (window.EXTENSION_CONTEXT === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.Contexts.MAIN_UI) {
    deliveryPath = 'same-context (document.dispatchEvent)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    document.dispatchEvent(new CustomEvent(notification.type, { detail: notification }));
    deliveryPath = 'cross-context (dbChannel.postMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_4__.dbChannel.postMessage(notification);
  } else {
    deliveryPath = 'cross-context (dbChannel.postMessage)';
    console.log(`[minimaldb] smartNotify: type=${notification.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}], path=${deliveryPath}`);
    _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_4__.dbChannel.postMessage(notification);
  }
}

async function publishSessionUpdate(sessionId, updateType = 'update', sessionDataOverride = null) {
  try {
    let sessionData = sessionDataOverride;
    if (!sessionData) {
      const result = await getChatSessionByIdInternal(sessionId);
      if (result.success && result.data) {
        sessionData = result.data;
      } else if (updateType === 'delete') {
        sessionData = { id: sessionId };
      } else {
        return;
      }
    }
    let plainSession = sessionData;
    if (sessionData && typeof sessionData.toJSON === 'function') {
      plainSession = sessionData.toJSON();
    } else if (sessionData) {
      try {
        plainSession = JSON.parse(JSON.stringify(sessionData));
      } catch (e) {
        return;
      }
    }
    const notification = {
      type: _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type,
      payload: { session: plainSession, updateType },
    };
    smartNotify(notification);
  } catch (e) {
    // console.error('[DB] Failed to publish session update notification', e, { sessionId, updateType });
  }
}

/**
 * Publishes a messages update notification for a session.
 * Always expects messages to be an array of message objects.
 */
async function publishMessagesUpdate(sessionId, messages) {
  try {
    if (!Array.isArray(messages)) {
      console.error('[minimaldb] publishMessagesUpdate: messages is not an array! Got:', messages);
      return;
    }
    let plainMessages = messages.map((m) => ({ ...m }));
    const notification = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbMessagesUpdatedNotification(sessionId, plainMessages);
    smartNotify(notification);
  } catch (e) {
    console.error('[DB] Failed to publish messages update notification', e, { sessionId });
  }
}

async function publishStatusUpdate(sessionId, status) {
  try {
    const notification = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbStatusUpdatedNotification(sessionId, status);
    smartNotify(notification);
  } catch (e) {
    console.error('[DB] Failed to publish status update notification', e, { sessionId });
  }
}

// --- Model Asset Management ---
async function ensureModelAssetsReady() {
  return await ensureDbReady('model');
}

function shouldLogOrSendChunkProgress(chunkIndex, totalChunks) {
  return chunkIndex === 0 || (totalChunks && chunkIndex === totalChunks - 1) || chunkIndex % 100 === 0;
}

async function addModelAsset(
  folder,
  fileName,
  fileType,
  data,
  chunkIndex = 0,
  totalChunks = 1,
  chunkGroupId = '',
  binarySize = null,
  totalFileSize = null
) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddModelAssetRequest.type, {
    folder,
    fileName,
    fileType,
    data,
    chunkIndex,
    totalChunks,
    chunkGroupId,
    binarySize,
    totalFileSize,
  });
  if (!result?.success) throw new Error(result?.error || 'Failed to add model asset');
  return result;
}

async function getModelAssetChunks(chunkGroupId) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunksRequest.type, { chunkGroupId });
  if (!result?.success) return [];
  return result.data;
}

async function countModelAssetChunks(folder, fileName, expectedSize, expectedChunks) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCountModelAssetChunksRequest.type, {
    folder,
    fileName,
    expectedSize,
    expectedChunks,
  });
  if (!result?.success) {
    return { success: false, error: result?.error || 'Failed to count model asset chunks' };
  }
  return result;
}

async function logAllChunkGroupIdsForModel(folder) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbLogAllChunkGroupIdsForModelRequest.type, { folder });
  if (!result?.success) return [];
  return result.data;
}

async function listModelFiles(modelId) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbListModelFilesRequest.type, { modelId });
  if (!result?.success) return [];
  return result.data;
}

async function getModelAssetChunk(folder, fileName, chunkIndex) {
  const result = await sendDbWorkerRequest(_events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunkRequest.type, {
    folder,
    fileName,
    chunkIndex,
  });
  if (!result?.success) return null;
  return result.data;
}

async function handleDbAddModelAssetRequest(event) {
  return handleRequest(
    event,
    (payload) =>
      addModelAsset(
        payload.folder,
        payload.fileName,
        payload.fileType,
        payload.data,
        payload.chunkIndex,
        payload.totalChunks,
        payload.chunkGroupId,
        payload.binarySize,
        payload.totalFileSize
      ),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbAddModelAssetResponse,
    5000,
    (res) => res
  );
}

async function handleDbCountModelAssetChunksRequest(event) {
  return handleRequest(
    event,
    (payload) =>
      countModelAssetChunks(payload.folder, payload.fileName, payload.expectedSize, payload.expectedChunks),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbCountModelAssetChunksResponse,
    5000,
    (res) => res
  );
}

async function handleDbLogAllChunkGroupIdsForModelRequest(event) {
  return handleRequest(
    event,
    (payload) => logAllChunkGroupIdsForModel(payload.folder),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbLogAllChunkGroupIdsForModelResponse,
    5000,
    (res) => res
  );
}

async function handleDbListModelFilesRequest(event) {
  return handleRequest(
    event,
    (payload) => listModelFiles(payload.modelId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbListModelFilesResponse
  );
}

async function handleDbGetModelAssetChunksRequest(event) {
  return handleRequest(
    event,
    (payload) => getModelAssetChunks(payload.chunkGroupId),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunksResponse
  );
}

async function handleDbGetModelAssetChunkRequest(event) {
  return handleRequest(
    event,
    (payload) => getModelAssetChunk(payload.folder, payload.fileName, payload.chunkIndex),
    _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetModelAssetChunkResponse
  );
}

// --- Logging Utilities ---
const logThrottleCache = {};
const logLastContext = {};

function throttledLog(type, staticMsg, contextKey = null, ...args) {
  const now = Date.now();
  const cacheKey = contextKey ? `${staticMsg}__${contextKey}` : staticMsg;
  if (!logThrottleCache[type]) logThrottleCache[type] = {};
  if (contextKey !== null) {
    if (logLastContext[staticMsg] === contextKey && now - (logThrottleCache[type][cacheKey] || 0) < LOG_THROTTLE_MS) {
      return;
    }
    logLastContext[staticMsg] = contextKey;
  }
  if (!logThrottleCache[type][cacheKey] || now - logThrottleCache[type][cacheKey] > LOG_THROTTLE_MS) {
    logThrottleCache[type][cacheKey] = now;
    const fullMessage = contextKey !== null ? [staticMsg, contextKey, ...args] : [staticMsg, ...args];
    if (type === 'log') console.log(...fullMessage);
    else if (type === 'warn') console.warn(...fullMessage);
    else if (type === 'error') console.error(...fullMessage);
  }
}

// --- Message Listener ---
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type || !Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_2__.DBEventNames).includes(message.type)) {
    return false;
  }
  forwardDbRequest(message)
    .then((result) => {
      console.log('[Trace][minimaldb] onMessage: Handler result', result);
      sendResponse(result);
    })
    .catch((err) => {
      console.error('[Trace][minimaldb] onMessage: Handler error', err);
      sendResponse({ success: false, error: err.message || 'Unknown error in handler' });
    });
  return true;
});

// --- Exported Functions ---
async function forwardDbRequest(request) {
  const handler = dbHandlerMap[request?.type];
  if (!handler) {
    throw new Error(`No DB handler for type: ${request?.type}`);
  }
  try {
    const result = await handler(request);
    return result;
  } catch (err) {
    return { success: false, error: err.message || 'Unknown error in handler' };
  }
}

async function resetDatabase() {
  try {
    await initializeDatabasesAndBackend(true);
    return { success: true };
  } catch (e) {
    throw e;
  }
}



/***/ }),

/***/ "./src/modelAssetDownloader.js":
/*!*************************************!*\
  !*** ./src/modelAssetDownloader.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   downloadModelAssets: () => (/* binding */ downloadModelAssets)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _sidepanel_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./sidepanel.js */ "./src/sidepanel.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./events/dbEvents.js */ "./src/events/dbEvents.js");





const prefix = '[Downloader]';
const CHUNK_SIZE = 10 * 1024 * 1024;
const MAX_RETRIES = 3;
const PROGRESS_THROTTLE_MS = 2000;
const PROGRESS_THROTTLE_CHUNKS = 200;

function logMemory(label) {
    if (performance && performance.memory) {
        const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        const totalMB = (performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
        console.log(`${prefix} [Memory][${label}] Used: ${usedMB} MB / Total: ${totalMB} MB`);
    } else {
        console.log(`${prefix} [Memory][${label}] performance.memory not available`);
    }
}

function shouldLogOrSendChunkProgress(chunkIndex, totalChunks, lastSent, now) {
    return chunkIndex === 0 ||
           (totalChunks && chunkIndex === totalChunks - 1) ||
           chunkIndex % PROGRESS_THROTTLE_CHUNKS === 0 ||
           (now - lastSent >= PROGRESS_THROTTLE_MS);
}

async function tryStoreChunkInternal(payload, maxRetries = MAX_RETRIES) {
    let attempt = 0;
    while (attempt < maxRetries) {
        const req = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbAddModelAssetRequest(payload);
        const addResult = await (0,_sidepanel_js__WEBPACK_IMPORTED_MODULE_2__.sendDbRequestSmart)(req);
        if (addResult && addResult.success) return true;
        attempt++;
        console.log(`${prefix} Retrying chunk store, attempt ${attempt} for ${payload.fileName} chunk ${payload.chunkIndex}`);
        await new Promise(res => setTimeout(res, 200 * Math.pow(2, attempt)));
    }
    console.error(`${prefix} Failed to store chunk after ${maxRetries} retries:`, payload.fileName, payload.chunkIndex);
    return false;
}

async function countModelAssetChunksViaMessage(folder, fileName, expectedSize, expectedChunks) {
    const req = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbCountModelAssetChunksRequest({ folder, fileName, expectedSize, expectedChunks });
    const result = await (0,_sidepanel_js__WEBPACK_IMPORTED_MODULE_2__.sendDbRequestSmart)(req);
    return result && result.success ? result.data : result;
}

async function fetchModelMetadataInternal(modelId) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    } catch (error) {
        console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}

async function filterAndValidateFilesInternal(metadata, modelId, baseDownloadUrl) {
    const hfFileEntries = metadata.siblings || [];
    const neededFileEntries = hfFileEntries.filter(f => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('.json') || f.rfilename.endsWith('.txt'));
    const neededFileNames = neededFileEntries.map(f => f.rfilename);
    console.log(prefix, `Identified ${neededFileNames.length} needed files for ${modelId}:`, neededFileNames);

    if (neededFileEntries.length === 0) {
        return { neededFileEntries: [], message: "No .onnx, .json, or .txt files found in model metadata." };
    }

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

    const sizePromises = neededFileEntries.map(async (entry) => {
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
    });

    await Promise.all(sizePromises);
    return { neededFileEntries, message: null };
}

function buildDownloadPlanInternal(neededFileEntries) {
    const downloadPlan = neededFileEntries.filter(e => !e._skip).map((entry, idx) => ({
        fileName: entry.rfilename,
        fileSize: entry.size,
        totalChunks: Math.ceil(entry.size / CHUNK_SIZE),
        fileIdx: idx + 1,
        fileType: entry.rfilename.split('.').pop(),
    }));
    const totalBytesToDownload = downloadPlan.reduce((sum, f) => sum + f.fileSize, 0);
    const totalChunksToDownload = downloadPlan.reduce((sum, f) => sum + f.totalChunks, 0);
    console.log(prefix, "Built download plan:", { downloadPlan, totalBytesToDownload, totalChunksToDownload });
    return { downloadPlan, totalBytesToDownload, totalChunksToDownload };
}

async function getMissingFilesInternal(downloadPlan, modelId) {
    const missingFiles = [];
    const presentFiles = {};
    for (const plan of downloadPlan) {
        const { fileName, fileSize, totalChunks } = plan;
        console.log(prefix, '[DB ChunkCount Check] Checking chunk count for:', { modelId, fileName, expectedChunks: totalChunks });
        const countResult = await countModelAssetChunksViaMessage(modelId, fileName, fileSize, totalChunks);
        console.log(prefix, '[DB ChunkCount Check] Result:', { modelId, fileName, expectedChunks: totalChunks, countResult });
        if (countResult && countResult.success && countResult.verified && countResult.count === totalChunks) {
            presentFiles[fileName] = true;
        } else {
            missingFiles.push(plan);
        }
    }
    return { missingFiles, presentFiles };
}

// Helper to format bytes as human-readable string
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function streamAndStoreFileInternal(plan, modelId, baseDownloadUrl, totalBytesToDownload, totalChunksToDownload, totalBytesDownloaded, totalChunksDownloaded, totalFilesToAttempt) {
    const { fileName, fileSize, totalChunks, fileIdx, fileType } = plan;
    const downloadUrl = baseDownloadUrl + fileName;
    let fileBytesDownloaded = 0;
    let fileChunksDownloaded = 0;
    let fileFailed = false;
    let lastProgressSent = Date.now();
    let chunkIndex = 0;
    let allChunksSuccess = true;
    const chunkGroupId = `${modelId}/${fileName}`;
    let currentFileSource = "Download_Attempt";

    try {
        if (fileSize > 10 * 1024 * 1024) {
            logMemory(`Before file ${fileName}`);
        }
        console.log(prefix, `Downloading file from: ${downloadUrl}`);
        const downloadResponse = await fetch(downloadUrl);

        if (!downloadResponse.ok) {
            const errorText = await downloadResponse.text();
            console.error(prefix, `Failed to download ${modelId}/${fileName}: ${downloadResponse.status} ${downloadResponse.statusText}`, errorText);
            await sendUiProgress({
                modelId,
                file: fileName,
                error: `Download failed (${downloadResponse.status})`,
                downloaded: 0,
                total: totalFilesToAttempt,
                currentFileSource,
                fileIdx,
                totalFiles: totalFilesToAttempt,
                fileTotalBytes: fileSize,
                fileTotalBytesHuman: formatBytes(fileSize)
            }).catch(e => console.warn(`${prefix} Error sending progress on download fail: ${e.message}`));
            return { fileFailed: true };
        }
        currentFileSource = "Download_Success_Store_Attempt";

        const reader = downloadResponse.body.getReader();
        let buffer = new Uint8Array(CHUNK_SIZE);
        let bufferOffset = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (!(value instanceof Uint8Array)) {
                console.error(prefix, `Invalid chunk data for ${fileName}, chunk ${chunkIndex}:`, typeof value);
                fileFailed = true;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex,
                    totalChunks,
                    error: `Invalid chunk data type: ${typeof value}`,
                    currentFileSource,
                    failType: 'invalid_chunk',
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize)
                }).catch(e => console.warn(`${prefix} Error sending progress on invalid chunk: ${e.message}`));
                reader.cancel('Invalid chunk data');
                break;
            }

            let valueOffset = 0;
            while (valueOffset < value.length) {
                const remainingBuffer = CHUNK_SIZE - bufferOffset;
                const copyLength = Math.min(remainingBuffer, value.length - valueOffset);
                buffer.set(value.subarray(valueOffset, valueOffset + copyLength), bufferOffset);
                bufferOffset += copyLength;
                valueOffset += copyLength;

                if (bufferOffset === CHUNK_SIZE) {
                    let chunkToStore = buffer;
                    buffer = new Uint8Array(CHUNK_SIZE);
                    bufferOffset = 0;

                    const now = Date.now();
                    if (shouldLogOrSendChunkProgress(chunkIndex, totalChunks, lastProgressSent, now)) {
                        console.log(prefix, '[Chunk] About to store chunk:', { fileName, chunkIndex, chunkLength: chunkToStore.length });
                    }

                    const dbPayload = {
                        modelId,
                        fileName,
                        fileType,
                        data: chunkToStore,
                        chunkIndex,
                        totalChunks,
                        chunkGroupId,
                        binarySize: chunkToStore.byteLength,
                        totalFileSize: fileSize
                    };
                    const success = await tryStoreChunkInternal(dbPayload);

                    if (!success) {
                        allChunksSuccess = false;
                        fileFailed = true;
                        await sendUiProgress({
                            modelId,
                            file: fileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks,
                            error: `Failed to store chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries`,
                            currentFileSource,
                            failType: 'chunk_write',
                            fileTotalBytes: fileSize,
                            fileTotalBytesHuman: formatBytes(fileSize)
                        }).catch(e => console.warn(`${prefix} Error sending progress on chunk store fail: ${e.message}`));
                        reader.cancel('Chunk storage failed');
                        break;
                    }

                    chunkIndex++;
                    fileChunksDownloaded++;
                    totalChunksDownloaded.value++;
                    fileBytesDownloaded += chunkToStore.byteLength;
                    totalBytesDownloaded.value += chunkToStore.byteLength;

                    if (chunkIndex === totalChunks || shouldLogOrSendChunkProgress(chunkIndex, totalChunks, lastProgressSent, now)) {
                        await sendUiProgress({
                            modelId,
                            file: fileName,
                            fileIdx,
                            totalFiles: totalFilesToAttempt,
                            chunkIndex,
                            totalChunks,
                            fileBytesDownloaded,
                            fileTotalBytes: fileSize,
                            fileTotalBytesHuman: formatBytes(fileSize),
                            totalBytesDownloaded: totalBytesDownloaded.value,
                            totalBytesToDownload,
                            totalChunksDownloaded: totalChunksDownloaded.value,
                            totalChunksToDownload,
                            percent: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                            filePercent: (fileBytesDownloaded / fileSize) * 100,
                            progress: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                            status: 'progress',
                            currentFileSource
                        }).catch(e => console.warn(`${prefix} Error sending progress update: ${e.message}`));
                        lastProgressSent = now;
                    }
                    chunkToStore = null;
                }
            }
            if (fileFailed) break;
        }

        if (allChunksSuccess && !fileFailed && bufferOffset > 0) {
            let finalChunkToStore = buffer.subarray(0, bufferOffset);
            buffer = null;

            console.log(prefix, '[Chunk] About to store final chunk:', { fileName, chunkIndex, chunkLength: finalChunkToStore.length });

            const dbPayload = {
                modelId,
                fileName,
                fileType,
                data: finalChunkToStore,
                chunkIndex,
                totalChunks,
                chunkGroupId,
                binarySize: finalChunkToStore.byteLength,
                totalFileSize: fileSize
            };
            const success = await tryStoreChunkInternal(dbPayload);

            if (!success) {
                allChunksSuccess = false;
                fileFailed = true;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex,
                    totalChunks,
                    error: `Failed to store final chunk ${chunkIndex + 1} after ${MAX_RETRIES} retries`,
                    currentFileSource,
                    failType: 'chunk_write',
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize)
                }).catch(e => console.warn(`${prefix} Error sending progress on final chunk store fail: ${e.message}`));
            } else {
                chunkIndex++;
                fileChunksDownloaded++;
                totalChunksDownloaded.value++;
                fileBytesDownloaded += finalChunkToStore.byteLength;
                totalBytesDownloaded.value += finalChunkToStore.byteLength;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    chunkIndex,
                    totalChunks,
                    fileBytesDownloaded,
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize),
                    totalBytesDownloaded: totalBytesDownloaded.value,
                    totalBytesToDownload,
                    totalChunksDownloaded: totalChunksDownloaded.value,
                    totalChunksToDownload,
                    percent: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                    filePercent: 100,
                    progress: (totalBytesDownloaded.value / totalBytesToDownload) * 100,
                    status: 'progress',
                    currentFileSource
                }).catch(e => console.warn(`${prefix} Error sending progress for final chunk: ${e.message}`));
            }
            finalChunkToStore = null;
        }

        if (allChunksSuccess && !fileFailed) {
            const countResult = await countModelAssetChunksViaMessage(modelId, fileName, fileSize, totalChunks);
            if (countResult.success && countResult.verified && countResult.count === totalChunks) {
                currentFileSource = "DB_Stored_After_Download";
                console.log(prefix, `Successfully downloaded, stored, and verified all chunks for ${modelId}/${fileName} in DB.`);
            } else {
                fileFailed = true;
                await sendUiProgress({
                    modelId,
                    file: fileName,
                    fileIdx,
                    totalFiles: totalFilesToAttempt,
                    error: `Verification failed: ${countResult.error || 'Unknown error'}`,
                    failType: 'verification',
                    currentFileSource,
                    fileTotalBytes: fileSize,
                    fileTotalBytesHuman: formatBytes(fileSize)
                }).catch(e => console.warn(`${prefix} Error sending progress on verification fail: ${e.message}`));
            }
        } else if (fileFailed || !allChunksSuccess) {
            console.error(prefix, `Failed to store all chunks for ${modelId}/${fileName} in DB after download.`);
             await sendUiProgress({
                modelId,
                file: fileName,
                error: `DB store failed after download (chunked)`,
                fileIdx,
                totalFiles: totalFilesToAttempt,
                currentFileSource,
                failType: 'file_fail_internal',
                fileTotalBytes: fileSize,
                fileTotalBytesHuman: formatBytes(fileSize)
            }).catch(e => console.warn(`${prefix} Error sending progress on internal file fail: ${e.message}`));
        }

        if (fileSize > 10 * 1024 * 1024) {
            logMemory(`After file ${fileName}`);
        }
    } catch (error) {
        fileFailed = true;
        console.error(prefix, `Error downloading ${modelId}/${fileName}:`, error);
        await sendUiProgress({
            modelId,
            file: fileName,
            fileIdx,
            totalFiles: totalFilesToAttempt,
            error: error.message,
            failType: 'exception',
            currentFileSource,
            fileTotalBytes: fileSize,
            fileTotalBytesHuman: formatBytes(fileSize)
        }).catch(e => console.warn(`${prefix} Error sending progress on exception: ${e.message}`));
    }

    return { fileFailed, fileName, fileBytesDownloaded, fileChunksDownloaded };
}

async function downloadMissingFilesInternal(missingFiles, modelId, downloadPlan, totalBytesToDownload, totalChunksToDownload, presentFiles, baseDownloadUrl) {
    let filesSuccessfullyProcessedCount = Object.keys(presentFiles).length;
    const totalBytesDownloaded = { value: downloadPlan.filter(p => presentFiles[p.fileName]).reduce((sum, p) => sum + p.fileSize, 0) };
    const totalChunksDownloaded = { value: downloadPlan.filter(p => presentFiles[p.fileName]).reduce((sum, p) => sum + p.totalChunks, 0) };
    const totalFilesToAttempt = downloadPlan.length;
    const successfullyProcessedFileMap = { ...presentFiles };
    const failedFiles = [];

    console.log(prefix, "Initial download progress state:", {
        filesSuccessfullyProcessedCount,
        totalBytesDownloaded: totalBytesDownloaded.value,
        totalChunksDownloaded: totalChunksDownloaded.value,
        totalFilesToAttempt,
        presentFiles
    });

    for (const plan of missingFiles) {
        const result = await streamAndStoreFileInternal(
            plan,
            modelId,
            baseDownloadUrl,
            totalBytesToDownload,
            totalChunksToDownload,
            totalBytesDownloaded,
            totalChunksDownloaded,
            totalFilesToAttempt
        );

        if (!result.fileFailed) {
            successfullyProcessedFileMap[result.fileName] = true;
            filesSuccessfullyProcessedCount++;
        } else {
            failedFiles.push(result.fileName);
        }
    }

    console.log(prefix, "Final download progress state after processing missing files:", {
        filesSuccessfullyProcessedCount,
        totalBytesDownloaded: totalBytesDownloaded.value,
        totalChunksDownloaded: totalChunksDownloaded.value,
        failedFiles
    });
    return { successfullyProcessedFileMap, filesSuccessfullyProcessedCount, failedFiles };
}

function sendUiProgress(payload) {
    return webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.MODEL_DOWNLOAD_PROGRESS,
        payload
    }).catch(e => console.warn(`${prefix} Error sending MODEL_DOWNLOAD_PROGRESS: ${e.message}`));
}

async function downloadModelAssets(modelId) {
    console.log(prefix, `Starting downloadModelAssets for modelId: ${modelId}`);
    const baseDownloadUrl = `https://huggingface.co/${modelId}/resolve/main/`;

    try {
        const metadata = await fetchModelMetadataInternal(modelId);
        const { neededFileEntries, message: filterMessage } = await filterAndValidateFilesInternal(metadata, modelId, baseDownloadUrl);

        if (neededFileEntries.length === 0) {
            console.warn(prefix, filterMessage || "No needed files after filtering.");
            return { success: true, fileMap: {}, message: filterMessage || "No needed files to download." };
        }

        const { downloadPlan, totalBytesToDownload, totalChunksToDownload } = buildDownloadPlanInternal(neededFileEntries);
        if (downloadPlan.length === 0) {
            const msg = `No valid files to download for ${modelId} after validation and plan building.`;
            console.warn(prefix, msg);
            return { success: true, fileMap: {}, message: msg };
        }

        const { missingFiles, presentFiles } = await getMissingFilesInternal(downloadPlan, modelId);
        console.log(prefix, `Files already present in DB for ${modelId}:`, Object.keys(presentFiles));
        console.log(prefix, `Files missing and will be downloaded for ${modelId}:`, missingFiles.map(f => f.fileName));

        await sendUiProgress({
            modelId,
            initialScanComplete: true,
            totalFilesToAttempt: downloadPlan.length,
            filesAlreadyPresent: Object.keys(presentFiles).length,
            filesToDownload: missingFiles.length,
            totalBytesToDownload,
            totalBytesAlreadyPresent: downloadPlan.filter(p => presentFiles[p.fileName]).reduce((sum, p) => sum + p.fileSize, 0),
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch(e => console.warn(`${prefix} Error sending initial scan progress: ${e.message}`));


        if (missingFiles.length === 0) {
            const msg = `All ${downloadPlan.length} assets for ${modelId} are already available in DB.`;
            console.log(prefix, msg);
            await sendUiProgress({
                modelId,
                summary: true,
                filesSuccessfullyProcessedCount: Object.keys(presentFiles).length,
                totalFilesToAttempt: downloadPlan.length,
                failedFiles: [],
                success: true,
                message: msg,
                fileTotalBytes: totalBytesToDownload,
                fileTotalBytesHuman: formatBytes(totalBytesToDownload)
            }).catch(e => console.warn(`${prefix} Error sending progress for 'all files present': ${e.message}`));
            return { success: true, fileMap: presentFiles, message: msg, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };
        }

        const { successfullyProcessedFileMap, filesSuccessfullyProcessedCount, failedFiles } = await downloadMissingFilesInternal(
            missingFiles,
            modelId,
            downloadPlan,
            totalBytesToDownload,
            totalChunksToDownload,
            presentFiles,
            baseDownloadUrl
        );

        console.log(prefix, `Finished processing all ${downloadPlan.length} needed files for ${modelId}. Successfully processed ${filesSuccessfullyProcessedCount} files.`);
        const overallSuccess = filesSuccessfullyProcessedCount === downloadPlan.length;
        const finalMessage = overallSuccess
            ? `All ${downloadPlan.length} assets for ${modelId} are now available in DB.`
            : `Failed to process all assets for ${modelId}. Got ${filesSuccessfullyProcessedCount} of ${downloadPlan.length}. Failed files: ${failedFiles.join(', ')}. Check logs for details.`;

        await sendUiProgress({
            modelId,
            summary: true,
            filesSuccessfullyProcessedCount,
            totalFilesToAttempt: downloadPlan.length,
            failedFiles,
            success: overallSuccess,
            message: finalMessage,
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch(e => console.warn(`${prefix} Error sending final summary progress: ${e.message}`));
        console.log(prefix, finalMessage);
        return { success: overallSuccess, fileMap: successfullyProcessedFileMap, message: finalMessage, failedFiles, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };

    } catch (error) {
        console.error(prefix, `Critical error in downloadModelAssets for ${modelId}:`, error);
        await sendUiProgress({
            modelId,
            summary: true,
            error: `Download process failed: ${error.message}`,
            success: false,
            fileTotalBytes: totalBytesToDownload,
            fileTotalBytesHuman: formatBytes(totalBytesToDownload)
        }).catch(e => console.warn(`${prefix} Error sending progress on critical error: ${e.message}`));
        return { success: false, error: `Download process failed for ${modelId}: ${error.message}`, fileTotalBytes: totalBytesToDownload, fileTotalBytesHuman: formatBytes(totalBytesToDownload) };
    }
}

/***/ }),

/***/ "./src/navigation.js":
/*!***************************!*\
  !*** ./src/navigation.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeNavigation: () => (/* binding */ initializeNavigation),
/* harmony export */   navigateTo: () => (/* binding */ navigateTo)
/* harmony export */ });
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");

window.EXTENSION_CONTEXT = _events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.Contexts.OTHERS;

let pageContainers = [];
let navButtons = [];
let mainHeaderTitle = null;
const CONTEXT_PREFIX = '[Navigation]';
const pageTitles = {
    'page-home': 'Tab Agent', 
    'page-spaces': 'Spaces',
    'page-library': 'Library',
    'page-settings': 'Settings'
};


async function navigateTo(pageId) { 
    console.log(CONTEXT_PREFIX + `Navigating to ${pageId}`);
   
    pageContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('active-page');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active-page');
    } else {
        console.error(CONTEXT_PREFIX + `Navigation error: Page with ID ${pageId} not found. Showing home.`);
        const homePage = document.getElementById('page-home');
        if (homePage) {
             homePage.classList.remove('hidden');
             homePage.classList.add('active-page');
        }
        pageId = 'page-home'; 
    }
    
    if (mainHeaderTitle && pageTitles[pageId]) {
         mainHeaderTitle.textContent = pageTitles[pageId];
    } else if (mainHeaderTitle) {
         mainHeaderTitle.textContent = 'Tab Agent'; 
    }

    navButtons.forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    document.dispatchEvent(new CustomEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.NAVIGATION_PAGE_CHANGED, { detail: { pageId } }));
    console.log(CONTEXT_PREFIX + `Published navigation:pageChanged event for ${pageId}`);

    const queryInput = document.getElementById('query-input');
     if (pageId === 'page-home' && queryInput) {
         queryInput.focus(); 
     }
}

function initializeNavigation() {
    console.log(CONTEXT_PREFIX + "Initializing navigation...");

    pageContainers = document.querySelectorAll('.page-container');
    navButtons = document.querySelectorAll('.nav-button');
    mainHeaderTitle = document.querySelector('#header h1');


    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });

    navigateTo('page-home');
    console.log(CONTEXT_PREFIX + "Navigation initialized.");
}

 

/***/ }),

/***/ "./src/notifications.js":
/*!******************************!*\
  !*** ./src/notifications.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   hideNotification: () => (/* binding */ hideNotification),
/* harmony export */   showNotification: () => (/* binding */ showNotification)
/* harmony export */ });


let notificationTimeout;

/**
 * @param {string} message 
 * @param {'info' | 'success' | 'error'} [type='info'] 
 * @param {number} [duration=4000] 
 */
function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[Notification] ${type.toUpperCase()}: ${message} (Duration: ${duration}ms)`);

}


function hideNotification() {
    const banner = document.getElementById('notification-banner');
    if (banner) {
        banner.classList.remove('visible');
    }
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    if (banner) {
        banner.onclick = null;
    }
} 

/***/ }),

/***/ "./src/sidepanel.js":
/*!**************************!*\
  !*** ./src/sidepanel.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sendDbRequestSmart: () => (/* binding */ sendDbRequestSmart)
/* harmony export */ });
/* harmony import */ var _minimaldb_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./minimaldb.js */ "./src/minimaldb.js");
/* harmony import */ var _modelAssetDownloader_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./modelAssetDownloader.js */ "./src/modelAssetDownloader.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./navigation.js */ "./src/navigation.js");
/* harmony import */ var _Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Home/uiController.js */ "./src/Home/uiController.js");
/* harmony import */ var _Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Home/chatRenderer.js */ "./src/Home/chatRenderer.js");
/* harmony import */ var _Home_messageOrchestrator_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Home/messageOrchestrator.js */ "./src/Home/messageOrchestrator.js");
/* harmony import */ var _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./Home/fileHandler.js */ "./src/Home/fileHandler.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./notifications.js */ "./src/notifications.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Controllers_HistoryPopupController_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./Controllers/HistoryPopupController.js */ "./src/Controllers/HistoryPopupController.js");
/* harmony import */ var _Controllers_LibraryController_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./Controllers/LibraryController.js */ "./src/Controllers/LibraryController.js");
/* harmony import */ var _Controllers_DiscoverController_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./Controllers/DiscoverController.js */ "./src/Controllers/DiscoverController.js");
/* harmony import */ var _Controllers_SettingsController_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./Controllers/SettingsController.js */ "./src/Controllers/SettingsController.js");
/* harmony import */ var _Controllers_SpacesController_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./Controllers/SpacesController.js */ "./src/Controllers/SpacesController.js");
/* harmony import */ var _Controllers_DriveController_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./Controllers/DriveController.js */ "./src/Controllers/DriveController.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./Utilities/dbChannels.js */ "./src/Utilities/dbChannels.js");
// --- Imports ---






















// --- Constants ---
const LOG_QUEUE_MAX = 1000;
const senderId = 'sidepanel-' + Math.random().toString(36).slice(2) + '-' + Date.now();

// --- Global State ---
let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;
let isDbReady = false;
let historyPopupController = null;
let logQueue = [];
const pendingDbRequests = new Map();

// --- Global Setup ---
// Set EXTENSION_CONTEXT based on URL query string
(function () {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const contextParam = urlParams.get('context');
    const viewParam = urlParams.get('view');
    window.EXTENSION_CONTEXT =
      contextParam === 'popup'
        ? _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.Contexts.POPUP
        : viewParam === 'logs'
        ? _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.Contexts.OTHERS
        : _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.Contexts.MAIN_UI;
  } catch (e) {
    window.EXTENSION_CONTEXT = _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.Contexts.UNKNOWN;
  }
})();

// Marked.js Setup
if (window.marked) {
  window.marked.setOptions({
    highlight: function (code, lang) {
      if (lang && window.hljs && window.hljs.getLanguage(lang)) {
        try {
          return window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
        } catch (e) {
          console.error('hljs error:', e);
        }
      } else if (window.hljs) {
        try {
          return window.hljs.highlightAuto(code).value;
        } catch (e) {
          console.error('hljs auto error:', e);
        }
      }
      const escapeHtml = (htmlStr) =>
        htmlStr
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      return escapeHtml(code);
    },
    langPrefix: 'language-',
    gfm: true,
    breaks: true,
  });
  console.log('[Sidepanel] Marked.js globally configured to use highlight.js.');
} else {
  console.error('[Sidepanel] Marked.js library (window.marked) not found.');
}

// --- DB and Channel Utilities ---
function isDbRequest(type) {
  return typeof type === 'string' && type.endsWith('_REQUEST');
}

function isDbLocalContext() {
  return typeof _minimaldb_js__WEBPACK_IMPORTED_MODULE_0__.forwardDbRequest === 'function';
}

async function sendDbRequestViaChannel(request) {
  return new Promise((resolve) => {
    const responseType = request.type + '_RESPONSE_' + Math.random();
    const requestId = request.requestId || (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    function onResponse(event) {
      if (event.data?.type === responseType && event.data.requestId === requestId) {
        _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.removeEventListener('message', onResponse);
        resolve(event.data.payload);
      }
    }
    _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.addEventListener('message', onResponse);
    _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage({ ...request, responseType, requestId });
  });
}

async function sendDbRequestSmart(request, timeoutMs = 5000) {
  if (isDbLocalContext()) {
    return await (0,_minimaldb_js__WEBPACK_IMPORTED_MODULE_0__.forwardDbRequest)(request);
  }
  return await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage(request);
}

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await sendDbRequestSmart(requestEvent, timeoutMs);
      console.log('[Trace][sidepanel] requestDbAndWait: Raw result', result);
      const response = Array.isArray(result) ? result[0] : result;
      if (response && (response.success || response.error === undefined)) {
        resolve(response.data || response.payload);
      } else {
        reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
      }
    } catch (error) {
      reject(error);
    }
  });
}

// --- Logging ---
function bufferOrWriteLog(logPayload) {
  if (!isDbReady) {
    if (logQueue.length >= LOG_QUEUE_MAX) {
      logQueue.shift();
    }
    logQueue.push(logPayload);
  } else {
    const req = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_10__.DbAddLogRequest(logPayload);
    sendDbRequestViaChannel(req);
  }
}

_Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.logChannel.onmessage = (event) => {
  const { type, payload } = event.data;
  if (type === 'LOG_TO_DB' && payload) {
    bufferOrWriteLog(payload);
  }
};

// --- UI and Worker Utilities ---
function sendUiEvent(type, payload) {
  webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage({ type, payload });
}

function sendWorkerError(message) {
  webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.WORKER_ERROR, payload: message });
}

function getActiveChatSessionId() {
  return activeSessionId;
}

async function setActiveChatSessionId(newSessionId) {
  console.log(`[Sidepanel] Setting active session ID to: ${newSessionId}`);
  activeSessionId = newSessionId;
  if (newSessionId) {
    await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.set({ lastSessionId: newSessionId });
  } else {
    await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.remove('lastSessionId');
  }
  (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_5__.setActiveSessionId)(newSessionId);
  (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__.setActiveSession)(newSessionId);
}

// --- Channel Handlers ---
if (window.EXTENSION_CONTEXT === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.Contexts.MAIN_UI) {
  _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.onmessage = async (event) => {
    const { type, payload, requestId, senderId: reqSenderId, responseType } = event.data;
    if (!isDbRequest(type)) return;
    try {
      const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage({
        type,
        payload,
        requestId,
        senderId: reqSenderId,
      });
      const respType = responseType || type + '_RESPONSE';
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage({ type: respType, payload: response, requestId, senderId });
    } catch (err) {
      const respType = responseType || type + '_RESPONSE';
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage({
        type: respType,
        payload: { success: false, error: err.message },
        requestId,
        senderId,
      });
    }
  };

  _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.onmessage = async (event) => {
    const { type, payload, requestId, senderId } = event.data;
    if (
      [
        _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.WORKER_SCRIPT_READY,
        _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.WORKER_READY,
        _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.LOADING_STATUS,
        _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.ERROR,
        _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.RESET_COMPLETE,
      ].includes(type)
    ) {
      return;
    }
    if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.SEND_CHAT_MESSAGE && typeof window.sendChatMessage === 'function') {
      const result = await window.sendChatMessage(payload);
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.SEND_CHAT_MESSAGE + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (
      type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.INTERRUPT_GENERATION &&
      typeof window.interruptGeneration === 'function'
    ) {
      const result = await window.interruptGeneration(payload);
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.INTERRUPT_GENERATION + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.RESET_WORKER && typeof window.resetWorker === 'function') {
      const result = await window.resetWorker(payload);
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.RESET_WORKER + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.LOAD_MODEL && typeof window.loadModel === 'function') {
      const result = await window.loadModel(payload);
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.LOAD_MODEL + '_RESPONSE',
        payload: result,
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
      const state = window.currentModelWorkerState || 'UNINITIALIZED';
      const modelId = window.currentModelIdForWorker || null;
      _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({
        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.GET_MODEL_WORKER_STATE + '_RESPONSE',
        payload: { state, modelId },
        requestId,
        senderId: 'sidepanel',
        timestamp: Date.now(),
      });
    }
  };
}

// --- Event Handlers ---
function handleMessage(message, sender, sendResponse) {
  const { type } = message;
  if (Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.DirectDBNames).includes(type) || Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.DBEventNames).includes(type)) {
    return false;
  }
  if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RawDirectMessageTypes.WORKER_GENERIC_RESPONSE) {
    sendUiEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, {
      chatId: message.chatId,
      messageId: message.messageId,
      text: message.text,
    });
  } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RawDirectMessageTypes.WORKER_GENERIC_ERROR) {
    sendUiEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.BACKGROUND_ERROR_RECEIVED, {
      chatId: message.chatId,
      messageId: message.messageId,
      error: message.error,
    });
    sendResponse({});
  } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT) {
    sendUiEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, message.payload);
    sendResponse({ status: 'received', type });
  } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RawDirectMessageTypes.WORKER_DIRECT_SCRAPE_RESULT) {
    sendUiEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, message.payload);
    sendResponse({});
  } else if (type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RawDirectMessageTypes.WORKER_UI_LOADING_STATUS_UPDATE) {
    sendUiEvent(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE, message.payload);
  } else if (
    type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST ||
    type === _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.MODEL_DOWNLOAD_PROGRESS
  ) {
    // No action needed
  } else {
    console.warn('[Sidepanel] Received unknown message type from background:', type, message);
  }
}

async function handleSessionCreated(newSessionId) {
  console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
  await setActiveChatSessionId(newSessionId);
  try {
    const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_10__.DbGetSessionRequest(newSessionId);
    const sessionData = await requestDbAndWait(request);
    if (!sessionData?.messages) {
      console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}.`, sessionData);
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, error);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)(`Failed to load initial messages for new chat: ${error.message}`);
  }
}

async function handleNewChat() {
  console.log('[Sidepanel] New Chat button clicked.');
  await setActiveChatSessionId(null);
  (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__.clearInput)();
  (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__.focusInput)();
}

async function handleChatSessionClick(event) {
  const sessionId = event.currentTarget.dataset.sessionId;
  if (!sessionId) {
    console.warn('[Sidepanel] Session list click event missing sessionId:', event.currentTarget);
    return;
  }
  if (sessionId === activeSessionId) {
    console.log(`[Sidepanel] Clicked already active session: ${sessionId}`);
    (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_5__.scrollToBottom)();
  } else {
    console.log(`[Sidepanel] Session list item clicked: ${sessionId}`);
    await loadAndDisplaySession(sessionId);
  }
}

async function loadAndDisplaySession(sessionId) {
  if (!sessionId) {
    console.log('[Sidepanel] No session ID to load, setting renderer to null.');
    await setActiveChatSessionId(null);
    return;
  }
  console.log(`[Sidepanel] Loading session data for: ${sessionId}`);
  try {
    const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_10__.DbGetSessionRequest(sessionId);
    const sessionData = await requestDbAndWait(request);
    console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
    await setActiveChatSessionId(sessionId);
    if (!sessionData?.messages) {
      console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}.`);
    }
  } catch (error) {
    console.error(`[Sidepanel] Failed to load session ${sessionId}:`, error);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)(`Failed to load chat: ${error.message}`);
    await setActiveChatSessionId(null);
  }
}

async function handleDetach() {
  if (!currentTabId) {
    console.error('Cannot detach: Missing tab ID');
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)('Cannot detach: Missing tab ID');
    return;
  }
  const currentSessionId = getActiveChatSessionId();
  try {
    const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage({
      type: 'getPopupForTab',
      tabId: currentTabId,
    });
    if (response?.popupId) {
      await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().windows.update(response.popupId, { focused: true });
      return;
    }
    const storageKey = `detachedSessionId_${currentTabId}`;
    await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.set({ [storageKey]: currentSessionId });
    console.log(`Sidepanel: Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
    const popup = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().windows.create({
      url: webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
      type: 'popup',
      width: 400,
      height: 600,
    });
    if (popup?.id) {
      await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.sendMessage({
        type: 'popupCreated',
        tabId: currentTabId,
        popupId: popup.id,
      });
    } else {
      throw new Error('Failed to create popup window.');
    }
  } catch (error) {
    console.error('Error during detach:', error);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)(`Error detaching chat: ${error.message}`);
  }
}

async function handlePageChange(event) {
  if (!event?.pageId) return;
  console.log(`[Sidepanel] Navigation changed to: ${event.pageId}`);
  if (!isDbReady) {
    console.log('[Sidepanel] DB not ready yet, skipping session load on initial navigation event.');
    return;
  }
  if (event.pageId === 'page-home') {
    console.log('[Sidepanel] Navigated to home page, checking for specific session load signal...');
    try {
      const { lastSessionId } = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.get(['lastSessionId']);
      if (lastSessionId) {
        console.log(`[Sidepanel] Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
        await loadAndDisplaySession(lastSessionId);
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.remove('lastSessionId');
      } else {
        console.log('[Sidepanel] No load signal found. Resetting to welcome state.');
        await loadAndDisplaySession(null);
      }
    } catch (error) {
      console.error('[Sidepanel] Error checking/loading session based on signal:', error);
      (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)('Failed to load session state.');
      await loadAndDisplaySession(null);
    }
  }
}

// --- Worker Status Broadcasting ---
function handleWorkerStatusEvent(event) {
  const { type, payload } = event.data;
  if (
    [
      _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.WORKER_SCRIPT_READY,
      _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.WORKER_READY,
      _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.LOADING_STATUS,
      _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.ERROR,
      _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.WorkerEventNames.RESET_COMPLETE,
    ].includes(type)
  ) {
    _Utilities_dbChannels_js__WEBPACK_IMPORTED_MODULE_18__.llmChannel.postMessage({ type, payload, senderId: 'sidepanel', timestamp: Date.now() });
  }
}

if (window.modelWorker) {
  window.modelWorker.onmessage = (event) => {
    handleWorkerStatusEvent(event);
  };
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[Sidepanel] DOM Content Loaded.');
  const urlParams = new URLSearchParams(window.location.search);
  const requestedView = urlParams.get('view');

  // Log Viewer Mode
  if (requestedView === 'logs') {
    console.log('[Sidepanel] Initializing in Log Viewer Mode.');
    document.body.classList.add('log-viewer-mode');
    document.getElementById('header')?.classList.add('hidden');
    document.getElementById('bottom-nav')?.classList.add('hidden');
    document
      .querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
      .forEach((el) => el.classList.add('hidden'));
    const logViewerPage = document.getElementById('page-log-viewer');
    if (logViewerPage) {
      logViewerPage.classList.remove('hidden');
    } else {
      console.error('CRITICAL: #page-log-viewer element not found!');
      document.body.innerHTML =
        "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>";
      return;
    }
    try {
      const logViewerModule = await __webpack_require__.e(/*! import() */ "src_Controllers_LogViewerController_js").then(__webpack_require__.bind(__webpack_require__, /*! ./Controllers/LogViewerController.js */ "./src/Controllers/LogViewerController.js"));
      await logViewerModule.initializeLogViewerController();
      console.log('[Sidepanel] Log Viewer Controller initialized.');
    } catch (err) {
      console.error('Failed to load or initialize LogViewerController:', err);
      if (logViewerPage) {
        logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${err.message}</div>`;
      }
    }
    return;
  }

  // Standard Mode
  console.log('[Sidepanel] Initializing in Standard Mode.');
  document.getElementById('page-log-viewer')?.classList.add('hidden');

  // Initialize DB
  try {
    const result = await (0,_minimaldb_js__WEBPACK_IMPORTED_MODULE_0__.autoEnsureDbInitialized)();
    if (result?.success) {
      console.log('[Sidepanel] DB initialized directly.');
      isDbReady = true;
      for (const logPayload of logQueue) {
        const req = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_10__.DbAddLogRequest(logPayload);
        sendDbRequestViaChannel(req);
      }
      logQueue = [];
    } else {
      throw new Error(`Database initialization failed: ${result?.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('[Sidepanel] DB Initialization failed:', error);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)(`Initialization failed: ${error.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
    }
    return;
  }

  // Initialize UI and Core Components
  try {
    const { chatBody, newChatButton, chatInputElement, sendButton, fileInput } = (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__.initializeUI)({
      onNewChat: handleNewChat,
      onSessionClick: handleChatSessionClick,
      onAttachFile: _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_7__.handleAttachClick,
    });
    console.log('[Sidepanel] UI Controller Initialized.');

    const chatBodyForRenderer = document.getElementById('chat-body');
    if (!chatBodyForRenderer) {
      console.error('[Sidepanel] CRITICAL: chatBodyForRenderer is null before initializeRenderer!');
    }
    (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_5__.initializeRenderer)(chatBodyForRenderer, requestDbAndWait);
    console.log('[Sidepanel] Chat Renderer Initialized.');

    (0,_navigation_js__WEBPACK_IMPORTED_MODULE_3__.initializeNavigation)();
    console.log('[Sidepanel] Navigation Initialized.');

    document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handlePageChange(e.detail));

    (0,_Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_7__.initializeFileHandling)({
      uiController: _Home_uiController_js__WEBPACK_IMPORTED_MODULE_4__,
      getActiveSessionIdFunc: getActiveChatSessionId,
    });
    console.log('[Sidepanel] File Handler Initialized.');

    const fileInputForListener = document.getElementById('file-input');
    if (fileInputForListener) {
      fileInputForListener.addEventListener('change', _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_7__.handleFileSelected);
    } else {
      console.warn('[Sidepanel] File input element not found before adding listener.');
    }

    const activeTab = await (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.getActiveTab)();
    currentTabId = activeTab?.id;
    currentTab = activeTab;
    console.log(`[Sidepanel] Current Tab ID: ${currentTabId}`);

    (0,_Home_messageOrchestrator_js__WEBPACK_IMPORTED_MODULE_6__.initializeOrchestrator)({
      getActiveSessionIdFunc: getActiveChatSessionId,
      onSessionCreatedCallback: handleSessionCreated,
      getCurrentTabIdFunc: () => currentTabId,
    });
    console.log('[Sidepanel] Message Orchestrator Initialized.');

    webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime.onMessage.addListener(handleMessage);
    console.log('[Sidepanel] Background message listener added.');

    // Initialize Controllers
    const historyPopupElement = document.getElementById('history-popup');
    const historyListElement = document.getElementById('history-list');
    const historySearchElement = document.getElementById('history-search');
    const closeHistoryButtonElement = document.getElementById('close-history');
    const historyButton = document.getElementById('history-button');
    const detachButton = document.getElementById('detach-button');

    if (historyPopupElement && historyListElement && historySearchElement && closeHistoryButtonElement) {
      historyPopupController = (0,_Controllers_HistoryPopupController_js__WEBPACK_IMPORTED_MODULE_11__.initializeHistoryPopup)(
        {
          popupContainer: historyPopupElement,
          listContainer: historyListElement,
          searchInput: historySearchElement,
          closeButton: closeHistoryButtonElement,
        },
        requestDbAndWait
      );
      if (!historyPopupController) {
        console.error('[Sidepanel] History Popup Controller initialization failed.');
      }
    } else {
      console.warn('[Sidepanel] Could not find all required elements for History Popup Controller.');
    }

    if (historyButton && historyPopupController) {
      historyButton.addEventListener('click', () => historyPopupController.show());
    } else {
      console.warn('[Sidepanel] History button or controller not available for listener.');
    }

    if (detachButton) {
      detachButton.addEventListener('click', handleDetach);
    } else {
      console.warn('[Sidepanel] Detach button not found.');
    }

    const libraryListElement = document.getElementById('starred-list');
    if (libraryListElement) {
      (0,_Controllers_LibraryController_js__WEBPACK_IMPORTED_MODULE_12__.initializeLibraryController)({ listContainer: libraryListElement }, requestDbAndWait);
      console.log('[Sidepanel] Library Controller Initialized.');
    } else {
      console.warn('[Sidepanel] Could not find #starred-list element for Library Controller.');
    }

    document.addEventListener(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.UIEventNames.REQUEST_MODEL_LOAD, (e) => {
      const { modelId } = e.detail || {};
      if (!modelId) {
        sendWorkerError('No model ID specified for loading.');
        return;
      }
      webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().runtime
        .sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_17__.RuntimeMessageTypes.LOAD_MODEL, payload: { modelId } })
        .catch((err) => sendWorkerError(`Failed to send load request: ${err.message}`));
    });

    (0,_Controllers_DiscoverController_js__WEBPACK_IMPORTED_MODULE_13__.initializeDiscoverController)();
    console.log('[Sidepanel] Discover Controller Initialized.');

    (0,_Controllers_SettingsController_js__WEBPACK_IMPORTED_MODULE_14__.initializeSettingsController)();
    console.log('[Sidepanel] Settings Controller Initialized.');

    (0,_Controllers_SpacesController_js__WEBPACK_IMPORTED_MODULE_15__.initializeSpacesController)();
    console.log('[Sidepanel] Spaces Controller Initialized.');

    (0,_Controllers_DriveController_js__WEBPACK_IMPORTED_MODULE_16__.initializeDriveController)({
      requestDbAndWaitFunc: requestDbAndWait,
      getActiveChatSessionId,
      setActiveChatSessionId,
      showNotification: _notifications_js__WEBPACK_IMPORTED_MODULE_9__.showNotification,
      debounce: _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.debounce,
    });
    console.log('[Sidepanel] Drive Controller Initialized.');

    // Handle Popup Context
    const popupContext = urlParams.get('context');
    originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
    isPopup = popupContext === 'popup';
    console.log(
      `[Sidepanel] Context: ${isPopup ? 'Popup' : 'Sidepanel'}${
        isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''
      }`
    );

    if (isPopup && originalTabIdFromPopup) {
      const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
      const result = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_2___default().storage.local.get(storageKey);
      const detachedSessionId = result[storageKey];
      if (detachedSessionId) {
        console.log(`[Sidepanel-Popup] Found detached session ID: ${detachedSessionId}. Loading...`);
        await loadAndDisplaySession(detachedSessionId);
      } else {
        console.log(`[Sidepanel-Popup] No detached session ID found for key ${storageKey}. Starting fresh.`);
        await setActiveChatSessionId(null);
      }
    } else {
      console.log('[Sidepanel] Starting fresh. Loading empty/welcome state.');
      await loadAndDisplaySession(null);
    }

    console.log('[Sidepanel] Initialization complete.');
  } catch (error) {
    console.error('[Sidepanel] Initialization failed:', error);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_8__.showError)(`Initialization failed: ${error.message}. Please try reloading.`);
    const chatBody = document.getElementById('chat-body');
    if (chatBody) {
      chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
    }
  }
});

// --- Exports ---


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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "assets/" + chunkId + "-" + "c85e5d206fdb891a6d10" + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/load script */
/******/ 	(() => {
/******/ 		var inProgress = {};
/******/ 		var dataWebpackPrefix = "tabagent:";
/******/ 		// loadScript function to load a script via script tag
/******/ 		__webpack_require__.l = (url, done, key, chunkId) => {
/******/ 			if(inProgress[url]) { inProgress[url].push(done); return; }
/******/ 			var script, needAttach;
/******/ 			if(key !== undefined) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				for(var i = 0; i < scripts.length; i++) {
/******/ 					var s = scripts[i];
/******/ 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
/******/ 				}
/******/ 			}
/******/ 			if(!script) {
/******/ 				needAttach = true;
/******/ 				script = document.createElement('script');
/******/ 		
/******/ 				script.charset = 'utf-8';
/******/ 				script.timeout = 120;
/******/ 				if (__webpack_require__.nc) {
/******/ 					script.setAttribute("nonce", __webpack_require__.nc);
/******/ 				}
/******/ 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
/******/ 		
/******/ 				script.src = url;
/******/ 			}
/******/ 			inProgress[url] = [done];
/******/ 			var onScriptComplete = (prev, event) => {
/******/ 				// avoid mem leaks in IE.
/******/ 				script.onerror = script.onload = null;
/******/ 				clearTimeout(timeout);
/******/ 				var doneFns = inProgress[url];
/******/ 				delete inProgress[url];
/******/ 				script.parentNode && script.parentNode.removeChild(script);
/******/ 				doneFns && doneFns.forEach((fn) => (fn(event)));
/******/ 				if(prev) return prev(event);
/******/ 			}
/******/ 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
/******/ 			script.onerror = onScriptComplete.bind(null, script.onerror);
/******/ 			script.onload = onScriptComplete.bind(null, script.onload);
/******/ 			needAttach && document.head.appendChild(script);
/******/ 		};
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			"sidepanel": 0
/******/ 		};
/******/ 		
/******/ 		__webpack_require__.f.j = (chunkId, promises) => {
/******/ 				// JSONP chunk loading for javascript
/******/ 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
/******/ 				if(installedChunkData !== 0) { // 0 means "already installed".
/******/ 		
/******/ 					// a Promise means "currently loading".
/******/ 					if(installedChunkData) {
/******/ 						promises.push(installedChunkData[2]);
/******/ 					} else {
/******/ 						if(true) { // all chunks have JS
/******/ 							// setup Promise in chunk cache
/******/ 							var promise = new Promise((resolve, reject) => (installedChunkData = installedChunks[chunkId] = [resolve, reject]));
/******/ 							promises.push(installedChunkData[2] = promise);
/******/ 		
/******/ 							// start chunk loading
/******/ 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
/******/ 							// create error before stack unwound to get useful stacktrace later
/******/ 							var error = new Error();
/******/ 							var loadingEnded = (event) => {
/******/ 								if(__webpack_require__.o(installedChunks, chunkId)) {
/******/ 									installedChunkData = installedChunks[chunkId];
/******/ 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
/******/ 									if(installedChunkData) {
/******/ 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
/******/ 										var realSrc = event && event.target && event.target.src;
/******/ 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
/******/ 										error.name = 'ChunkLoadError';
/******/ 										error.type = errorType;
/******/ 										error.request = realSrc;
/******/ 										installedChunkData[1](error);
/******/ 									}
/******/ 								}
/******/ 							};
/******/ 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
/******/ 						}
/******/ 					}
/******/ 				}
/******/ 		};
/******/ 		
/******/ 		// no prefetching
/******/ 		
/******/ 		// no preloaded
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		// install a JSONP callback for chunk loading
/******/ 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			// add "moreModules" to the modules object,
/******/ 			// then flag all "chunkIds" as loaded and fire callback
/******/ 			var moduleId, chunkId, i = 0;
/******/ 			if(chunkIds.some((id) => (installedChunks[id] !== 0))) {
/******/ 				for(moduleId in moreModules) {
/******/ 					if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 						__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 					}
/******/ 				}
/******/ 				if(runtime) var result = runtime(__webpack_require__);
/******/ 			}
/******/ 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
/******/ 			for(;i < chunkIds.length; i++) {
/******/ 				chunkId = chunkIds[i];
/******/ 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
/******/ 					installedChunks[chunkId][0]();
/******/ 				}
/******/ 				installedChunks[chunkId] = 0;
/******/ 			}
/******/ 		
/******/ 		}
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunktabagent"] = self["webpackChunktabagent"] || [];
/******/ 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
/******/ 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/sidepanel.js");
/******/ 	
/******/ })()
;
//# sourceMappingURL=sidepanel.js.map