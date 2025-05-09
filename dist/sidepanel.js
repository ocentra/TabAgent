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
const shareIconSvg = `<img src="icons/broken-link-chain-svgrepo-com.svg" alt="Share" class="w-4 h-4 action-icon-img">`; // Keep as img for now

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

// Import necessary modules if needed in the future (e.g., eventBus)
// import { eventBus } from '../eventBus.js'; 

let isInitialized = false;

function handleNavigationChange(event) {
    if (!isInitialized || event?.pageId !== 'page-discover') {
        return; // Only act when discover page becomes active, if needed
    }
    console.log("[DiscoverController] Discover page activated.");
    // Add logic here if discover needs to refresh on navigation
}

function initializeDiscoverController(/* Pass necessary elements or functions if needed */) {
    if (isInitialized) {
        console.log("[DiscoverController] Already initialized.");
        return;
    }
    console.log("[DiscoverController] Initializing...");
    
    // Find necessary elements within the #page-discover container if needed
    // const discoverContainer = document.getElementById('page-discover');

    // Add any one-time setup logic here
    
    // Subscribe to events if needed (e.g., navigation)
    // eventBus.subscribe('navigation:pageChanged', handleNavigationChange);

    isInitialized = true;
    console.log("[DiscoverController] Initialized successfully.");

    // Return any public methods if needed
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
/* harmony export */   handleDriveFileListResponse: () => (/* binding */ handleDriveFileListResponse),
/* harmony export */   initializeDriveController: () => (/* binding */ initializeDriveController)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
 



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
        type: 'getDriveFileList',
        folderId: folderId
    })
    .then(() => {
        console.log(`DriveController: Sent getDriveFileList request for ${folderId}. Waiting for response...`);
    })
    .catch((error) => {
        console.error("DriveController: Error *sending* getDriveFileList message:", error?.message || error);
        showNotificationDep(`Error contacting background script: ${error?.message || 'Unknown error'}`, 'error');
        if (driveViewerList) driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
        isFetchingDriveList = false; 
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

function handleDriveFileListResponse(message) {
    console.log(`[DriveController:Handler] Received file list data. Message type: ${message?.type}`);

    if (message.type === 'driveFileListData') {
        const folderId = message.folderId;
        console.log(`DriveController: Handling driveFileListData for folder: ${folderId}`);
        isFetchingDriveList = false;

        console.log(`[DriveController:Handler] Check: isDriveOpen=${isDriveOpen}, message.folderId=${folderId}, currentFolderId=${currentFolderId}`);
        if (!isDriveOpen || folderId !== currentFolderId) {
            console.warn(`DriveController: Ignoring driveFileListData for folder ${folderId}. Current: ${currentFolderId}, IsOpen: ${isDriveOpen}`);
            return;
        }

        if (message.success && message.files) {
            console.log(`[DriveController:Handler] Success! Caching and calling renderDriveViewerItems for ${message.files.length} files.`);
            driveFilesCache[folderId] = message.files;
            renderDriveViewerItems(message.files);
            console.log(`[DriveController:Handler] renderDriveViewerItems completed.`);
        } else {
            const errorMsg = message.error || 'Unknown error fetching files.';
            console.error(`DriveController: Drive file list error for ${folderId}: ${errorMsg}`);
            showNotificationDep(`Error fetching folder content: ${errorMsg}`, 'error');
            if (driveViewerList) {
                driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error loading content: ${errorMsg}</div>`;
            }
        }
    } else {
        console.warn(`[DriveController:Handler] Received unexpected message type: ${message?.type}`);
    }
}

function initializeDriveController(dependencies) {
    console.log("Initializing DriveController...");

    if (!dependencies || !dependencies.showNotification || !dependencies.debounce || !dependencies.eventBus) {
        console.error("DriveController requires dependencies: showNotification, debounce, eventBus!");
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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Components/HistoryItem.js */ "./src/Components/HistoryItem.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../navigation.js */ "./src/navigation.js");
/* harmony import */ var _Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../Utilities/downloadUtils.js */ "./src/Utilities/downloadUtils.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");
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
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) {
        console.warn("[HistoryPopupController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = notification.sessionId;
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
            const itemElement = (0,_Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_3__.renderHistoryItemComponent)(props);
            if (itemElement) {
                historyListElement.appendChild(itemElement);
            }
        });
    }
    console.log("[HistoryPopupController] History list rendered.");
}

async function showPopup() { 
    if (!isInitialized || !historyPopupElement || !requestDbAndWaitFunc) return;
    console.log("[HistoryPopupController] Showing popup. Fetching latest history...");

    try {
        const sessionsArray = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbGetAllSessionsRequest());
        
        console.log("[HistoryPopupController:Debug] Fetched sessionsArray:", sessionsArray); 
        if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
             console.log("[HistoryPopupController:Debug] First session item sample:", sessionsArray[0]);
        } else if (sessionsArray === null || sessionsArray === undefined) {
             console.log("[HistoryPopupController:Debug] sessionsArray is null or undefined.");
        } else {
             console.log("[HistoryPopupController:Debug] sessionsArray is empty or not an array:", typeof sessionsArray);
        }

        currentHistoryItems = sessionsArray || []; 
        console.log(`[HistoryPopupController] Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
        
        renderHistoryList(); 
        historyPopupElement.classList.remove('hidden');
    } catch (error) {
        console.error("[HistoryPopupController] Error fetching history list:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Failed to load history.", 'error');
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
        (0,_navigation_js__WEBPACK_IMPORTED_MODULE_6__.navigateTo)('page-home');
        hidePopup();
    } catch (error) {
        console.error("[HistoryPopupController] Error setting storage or navigating:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Failed to load chat.", 'error');
    }
}

async function handleStarClick(sessionId) {
    if (!sessionId || !requestDbAndWaitFunc) return;
    console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbToggleStarRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Star toggled", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error toggling star:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)(`Failed to toggle star: ${error.message}`, 'error');
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
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbDeleteSessionRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Chat deletion initiated...", 'info'); 
    } catch (error) {
        console.error("[HistoryPopupController] Error deleting chat:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)(`Failed to delete chat: ${error.message}`, 'error');
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
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Rename successful", 'success');
    } catch (error) {
        console.error("[HistoryPopupController] Error submitting rename:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {
    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_7__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, _notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification);
    } else {
        console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_5__.showNotification)("Download failed: Internal setup error.", 'error');
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
        const sessionData = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbGetSessionRequest(sessionId));
        
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

_eventBus_js__WEBPACK_IMPORTED_MODULE_1__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_8__.DBEventNames.SESSION_UPDATED_NOTIFICATION, handleSessionUpdate);
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
        const debouncedSearchHandler = (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_4__.debounce)(handleSearchInput, 300);
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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Components/HistoryItem.js */ "./src/Components/HistoryItem.js");
/* harmony import */ var _Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Utilities/downloadUtils.js */ "./src/Utilities/downloadUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../notifications.js */ "./src/notifications.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../navigation.js */ "./src/navigation.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");



 
 
 
 


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
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest(sessionId));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Star toggled", 'success');
    } catch (error) {
        console.error("[LibraryController] Error toggling star:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to toggle star: ${error.message}`, 'error');
    }
}

async function handleDeleteClick(sessionId) {
    console.log(`[LibraryController] Delete clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc) return;
    if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
        try {
            await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest(sessionId));
            (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Chat deleted", 'success');
        } catch (error) {
            console.error("[LibraryController] Error deleting chat:", error);
            (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to delete chat: ${error.message}`, 'error');
        }
    }
}

async function handleRenameSubmit(sessionId, newName) {
    console.log(`[LibraryController] Rename submitted: ${sessionId} to "${newName}"`);
    if (!requestDbAndWaitFunc) return;
    try {
        await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Rename successful", 'success');
    } catch (error) {
        console.error("[LibraryController] Error submitting rename:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to rename chat: ${error.message}`, 'error');
    }
}

async function handleDownloadClick(sessionId) {

    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils_js__WEBPACK_IMPORTED_MODULE_3__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, _notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification);
    } else {
        console.error("[LibraryController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Download failed: Internal setup error.", 'error');
    }
}

async function handleLoadClick(sessionId) {
    console.log(`[LibraryController] Load clicked: ${sessionId}`);
    try {
        await chrome.storage.local.set({ lastSessionId: sessionId });
        (0,_navigation_js__WEBPACK_IMPORTED_MODULE_6__.navigateTo)('page-home'); 
    } catch (error) {
        console.error("[LibraryController] Error setting storage or navigating:", error);
        (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Failed to load chat.", 'error');
        await chrome.storage.local.remove('lastSessionId');
    }
}

function handleShareClick(sessionId) {
    console.log(`[LibraryController] Share clicked: ${sessionId}`);
    (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Share functionality not yet implemented.", 'info');
}

function handlePreviewClick(sessionId, contentElement) {
    console.log(`[LibraryController] Preview clicked: ${sessionId}`);
    (0,_notifications_js__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Preview functionality not yet implemented.", 'info');
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
        const responsePayload = await requestDbAndWaitFunc(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsRequest());
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []); 
        console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter); 
    } catch (error) {
        console.error("[LibraryController] Error fetching starred items:", error);
        starredListElement.innerHTML = '<div class="p-4 text-red-500">Error loading starred items.</div>';
    }
}

function handleSessionUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload) {
        console.warn("[LibraryController] Invalid session update notification received.", notification);
        return;
    }

    const updatedSessionData = notification.payload.session; 
    const sessionId = notification.sessionId;

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

_eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_7__.DBEventNames.SESSION_UPDATED_NOTIFICATION, handleSessionUpdate);

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
            const itemElement = (0,_Components_HistoryItem_js__WEBPACK_IMPORTED_MODULE_2__.renderHistoryItemComponent)(props);
            if (itemElement) {
                starredListElement.appendChild(itemElement);
            }
        });
    }
     console.log(`[LibraryController] Rendered ${itemsToRender.length} items.`);
}

const handleSearchInput = (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_5__.debounce)((event) => {
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

    _eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe('navigation:pageChanged', handleNavigationChange);
    console.log("[LibraryController] Subscribed to navigation:pageChanged.");
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
// src/Controllers/SettingsController.js

// No imports needed for current logic, but keep in mind for future additions

let isInitialized = false;

// Function to update theme toggle button text based on current theme
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

    // Check if button already exists (e.g., from HMR)
    let themeToggleButton = settingsPageContainer.querySelector('#theme-toggle-button');

    if (!themeToggleButton) {
        console.log("[SettingsController] Creating theme toggle button.");
        themeToggleButton = document.createElement('button');
        themeToggleButton.id = 'theme-toggle-button'; // Give it an ID
        themeToggleButton.className = 'p-2 border rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 mt-4'; // Standard styling

        themeToggleButton.onclick = () => {
            const htmlElement = document.documentElement;
            const isCurrentlyDark = htmlElement.classList.contains('dark');
            console.log(`[SettingsToggle] Before toggle - isDark: ${isCurrentlyDark}`);

            // Toggle theme
            if (isCurrentlyDark) {
                htmlElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                console.log(`[SettingsToggle] Removed dark class, set localStorage to light`);
            } else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
            }
            updateThemeButtonText(themeToggleButton); // Update text after toggle
        };
        
        // Find a place to insert the button, e.g., after the placeholder paragraph
        const placeholderText = settingsPageContainer.querySelector('p');
        if (placeholderText) {
            placeholderText.insertAdjacentElement('afterend', themeToggleButton);
        } else {
            settingsPageContainer.appendChild(themeToggleButton); // Fallback append
        }
    } else {
        console.log("[SettingsController] Theme toggle button already exists.");
    }

    // Initial setup for the button text
    updateThemeButtonText(themeToggleButton);
}

// Helper function to connect a range slider to its value display span
function setupSlider(sliderId, valueSpanId) {
    const slider = document.getElementById(sliderId);
    const valueSpan = document.getElementById(valueSpanId);

    if (slider && valueSpan) {
        // Set initial value display
        valueSpan.textContent = slider.value;

        // Add event listener to update display on slider change
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
    
    // --- Setup Inference Setting Sliders --- 
    setupSlider('setting-temperature', 'setting-temperature-value');
    setupSlider('setting-repeat-penalty', 'setting-repeat-penalty-value');
    setupSlider('setting-top-p', 'setting-top-p-value');
    setupSlider('setting-min-p', 'setting-min-p-value');
    // --- End Setup Inference Setting Sliders ---

    // --- Setup Log Management Buttons ---
    const viewLogsButton = document.getElementById('viewLogsButton');
    if (viewLogsButton) {
        viewLogsButton.addEventListener('click', () => {
            console.log('[SettingsController] View Logs button clicked. Opening log viewer popup...');
            try {
                // Open sidepanel.html with query param for log viewer context
                const viewerUrl = 'sidepanel.html?view=logs'; 
                
                // Use chrome.windows.create for a popup
                chrome.windows.create({
                     url: viewerUrl, // Use the modified relative path
                     type: 'popup',
                     width: 800, // Specify desired width
                     height: 600 // Specify desired height
                 });
            } catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);
                // Optionally show an error to the user in the sidepanel UI
            }
        });
        console.log('[SettingsController] Added listener to View Logs button.');
    } else {
        console.warn('[SettingsController] View Logs button (viewLogsButton) not found.');
    }
    // --- End Setup Log Management Buttons ---

    // Add other settings initialization here if needed

    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");

    return {}; // No public methods needed for now
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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");






let chatBodyElement = null;
let currentSessionId = null;
let requestDbAndWaitFunc = null;
let observer = null; // MutationObserver
const TEMP_MESSAGE_CLASS = 'temp-status-message'; // Class for temporary messages

function handleMessagesUpdate(notification) {
    if (!notification || !notification.sessionId || !notification.payload) return;
    
    if (notification.sessionId === currentSessionId) {
        console.log(`[ChatRenderer] Received message update notification for active session ${currentSessionId}. Rendering.`);
        
        let messages = notification.payload.messages;
        if (!Array.isArray(messages)) {
            if (Array.isArray(notification.payload)) {
                 console.warn('[ChatRenderer] Payload did not have .messages, using payload directly as array.');
                 messages = notification.payload;
            } else {
                 console.error(`[ChatRenderer] Invalid messages structure: Expected array, got:`, notification.payload);
                 return;
            }
        }

        console.log(`[ChatRenderer] Messages array received:`, JSON.stringify(messages));
        if (!chatBodyElement) return;
        chatBodyElement.innerHTML = '';
        if (messages.length === 0) {
            console.log(`[ChatRenderer] Active session ${currentSessionId} has no messages. Displaying welcome.`);
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

_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_4__.DBEventNames.MESSAGES_UPDATED_NOTIFICATION, handleMessagesUpdate);
_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_4__.DBEventNames.SESSION_UPDATED_NOTIFICATION, handleSessionMetadataUpdate);

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
        const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbGetSessionRequest(sessionId);
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

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2', 'min-w-0');

    // Conditionally add max-width. For user messages, we omit it for now to test clipping.
    if (msg.sender !== 'user') {
        bubbleDiv.classList.add('max-w-4xl');
    }

    // Create actions container first
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container absolute top-1 right-1 transition-opacity flex space-x-1 z-10'; // Added z-10 to ensure it's on top

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

    let contentToParse = msg.text || '';
    let specialHeaderHTML = ''; // Changed to store HTML string

    if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
        specialHeaderHTML = `<div class="scrape-header p-2 rounded-t-md bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 mb-1"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Scraped Content:</h4><p class="text-xs text-gray-500 dark:text-gray-400 break-all">URL: ${msg.metadata.scrapeData.url || 'N/A'}</p></div>`;
        const dataForMd = typeof msg.metadata.scrapeData === 'string' ? msg.metadata.scrapeData : JSON.stringify(msg.metadata.scrapeData, null, 2);
        contentToParse = '```json\n' + dataForMd + '\n```';
        console.log('[ChatRenderer] Preparing to parse scrape_result_full. Input to marked:', contentToParse);
    } else if (msg.text) {
        console.log('[ChatRenderer] Preparing to parse regular message. Input to marked:', contentToParse);
    }

    console.log(`[ChatRenderer] Before style application: msg.sender = ${msg.sender}`);
    // Apply sender-specific alignment and base bubble styling
    if (msg.isLoading) {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic', 'border', 'border-gray-300', 'dark:border-gray-500');
    } else if (msg.sender === 'user') {
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
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");



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
        eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames.ADD_MESSAGE_REQUEST, request);
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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
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
        const { requestId, type: requestType } = requestEvent;
        let timeoutId;
        try {
            timeoutId = setTimeout(() => {
                console.error(`[Orchestrator] DB request timed out for ${requestType} (Req ID: ${requestId})`);
                reject(new Error(`DB request timed out for ${requestType}`));
            }, timeoutMs);
            const resultArr = await _eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.publish(requestEvent.type, requestEvent);
            const result = Array.isArray(resultArr) ? resultArr[0] : resultArr;
            clearTimeout(timeoutId);
            if (result && (result.success || result.error === undefined)) {
                resolve(result.data);
            } else {
                reject(new Error(result?.error || `DB operation ${requestType} failed`));
            }
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

async function handleQuerySubmit(data) {
    const { text } = data;
    console.log(`Orchestrator: handleQuerySubmit received event with text: "${text}"`);
    if (isSendingMessage) {
        console.warn("Orchestrator: Already processing a previous submission.");
        return;
    }
    isSendingMessage = true;

    let sessionId = getActiveSessionIdFunc();
    const currentTabId = getCurrentTabIdFunc();
    let placeholderMessageId = null;

    console.log(`Orchestrator: Processing submission. Text: "${text}". Session: ${sessionId}`);
    const isURL = _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.URL_REGEX.test(text);

    try {
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
        const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("Orchestrator: No active session, creating new one via event.");
            const createRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbCreateSessionRequest(userMessage);
            const createResponse = await requestDbAndWait(createRequest);
            sessionId = createResponse.newSessionId;
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            } else {
                 console.error("Orchestrator: onSessionCreatedCallback is missing!");
                 throw new Error("Configuration error: Cannot notify about new session.");
            }
        } else {
            console.log(`Orchestrator: Adding user message to existing session ${sessionId} via event.`);
            (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
            const addRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, userMessage);
            await requestDbAndWait(addRequest);
        }
        console.log(`[Orchestrator] Setting session ${sessionId} status to 'processing' via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'processing');
        await requestDbAndWait(statusRequest);
        let placeholder;
        if (isURL) {
            const activeTab = await (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.getActiveTab)();
            const activeTabUrl = activeTab?.url;
            const normalizeUrl = (u) => u ? u.replace('/$', '') : null;
            const inputUrlNormalized = normalizeUrl(text);
            const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
            const placeholderText = (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized)
                ? `⏳ Scraping active tab: ${text}...`
                : `⏳ Scraping ${text}...`;
            placeholder = { sender: 'system', text: placeholderText, timestamp: Date.now(), isLoading: true };
        } else {
            placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        }
        console.log(`[Orchestrator] Adding placeholder to session ${sessionId} via event.`);
        const addPlaceholderRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, placeholder);
        const placeholderResponse = await requestDbAndWait(addPlaceholderRequest);
        placeholderMessageId = placeholderResponse.newMessageId;
        if (isURL) {
             const activeTab = await (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.getActiveTab)();
             const activeTabUrl = activeTab?.url;
             const normalizeUrl = (u) => u ? u.replace('/$', '') : null;
             const inputUrlNormalized = normalizeUrl(text);
             const activeTabUrlNormalized = normalizeUrl(activeTabUrl);
            if (activeTab && activeTab.id && inputUrlNormalized === activeTabUrlNormalized) {
                console.log("Orchestrator: Triggering content script scrape.");
                webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.sendMessage(activeTab.id, { type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.SCRAPE_ACTIVE_TAB }, (response) => {
                    if ((webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime).lastError) {
                        console.error('Orchestrator: Error sending SCRAPE_ACTIVE_TAB:', (webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime).lastError.message);
                        const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                            isLoading: false, sender: 'error', text: `Failed to send scrape request: ${(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime).lastError.message}`
                        });
                        requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                        requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                        isSendingMessage = false;
                    } else { console.log("Orchestrator: SCRAPE_ACTIVE_TAB message sent."); }
                });
            } else {
                console.log("Orchestrator: Triggering background scrape via scrapeRequest.");
                try {
                    // Send the message and await the response (if any, often undefined for one-way messages)
                    const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
                        type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.RuntimeMessageTypes.SCRAPE_REQUEST,
                        payload: {
                             url: text, 
                             chatId: sessionId, 
                             messageId: placeholderMessageId
                        } 
                    });
                    // Process response if needed, or just log success if no specific response is expected
                    // For instance, background might not send an explicit response back for this type of message.
                    // If browser.runtime.lastError would have been set, the promise will reject.
                    console.log("Orchestrator: scrapeRequest message sent successfully.", response);

                } catch (error) {
                    console.error('Orchestrator: Error sending scrapeRequest:', error.message);
                    const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                         isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${error.message}`
                    });
                    requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                    requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                    isSendingMessage = false;
                }
            }
        } else {
            console.log("Orchestrator: Sending query to background for AI response.");
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
                    console.log('Orchestrator: Background acknowledged forwarding sendChatMessage. Actual AI response will follow separately.', response);
                } else {
                    console.error('Orchestrator: Background reported an error while attempting to forward sendChatMessage:', response?.error);
                    const errorPayload = { isLoading: false, sender: 'error', text: `Error forwarding query: ${response?.error || 'Unknown error'}` };
                    const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                    await requestDbAndWait(errorUpdateRequest); // Can await here too
                    await requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error'));
                    isSendingMessage = false; // Reset flag if forwarding failed
                }
            } catch (error) {
                console.error('Orchestrator: Error sending query to background or processing its direct ack:', error);
                const errorText = error && typeof error.message === 'string' ? error.message : 'Unknown error during send/ack';
                const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${errorText}` };
                const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error (within catch):", e));
                requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error (within catch):", e));
                isSendingMessage = false; // Reset flag on send error
            }
        }
    } catch (error) {
        console.error("Orchestrator: Error processing query submission:", error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error: ${error.message || error}`);
        if (sessionId) {
            console.log(`[Orchestrator] Setting session ${sessionId} status to 'error' due to processing failure via event`);
            requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on processing error:", e));
        } else {
            console.error("Orchestrator: Error occurred before session ID was established.");
        }
        isSendingMessage = false;
    }
}

async function handleBackgroundMsgResponse(message) {
    const { chatId, messageId, text } = message;
    console.log(`Orchestrator: handleBackgroundMsgResponse for chat ${chatId}, placeholder ${messageId}`);
    try {
        const updatePayload = { isLoading: false, sender: 'ai', text: text || 'Received empty response.' };
        const updateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator] Setting session ${chatId} status to 'idle' after response via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'idle');
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`Orchestrator: Error handling background response for chat ${chatId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with response: ${error.message || error}`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on response processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

async function handleBackgroundMsgError(message) {
    console.error(`Orchestrator: Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
    (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error processing request: ${message.error}`); // Show global error regardless

    const sessionId = getActiveSessionIdFunc(); // Get current session ID

    if (sessionId && message.chatId === sessionId && message.messageId) {
        // Only update DB if the error belongs to the *active* session and has a message ID
        console.log(`Orchestrator: Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
        const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
        const errorUpdateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error');
        try {
            await requestDbAndWait(errorUpdateRequest);
            console.log(`Orchestrator: Error message update successful for session ${sessionId}.`);
            await requestDbAndWait(statusRequest);
            console.log(`Orchestrator: Session ${sessionId} status set to 'error'.`);
        } catch (dbError) {
            console.error('Orchestrator: Error updating chat/status on background error:', dbError);
            // Show a more specific UI error if DB update fails
            (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with error status: ${dbError.message}`);
            // Attempt to set status to error even if message update failed
            try {
                 await requestDbAndWait(new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error'));
            } catch (statusError) {
                 console.error('Failed to set session status on error handling error:', statusError);
            }
        }
    } else {
         console.warn(`Orchestrator: Received error, but no active session ID (${sessionId}) or message ID (${message.messageId}) matches the error context (${message.chatId}). Not updating DB.`);
         // If the error is specifically a model load error (we might need a better way to signal this)
         // ensure the UI controller knows. The direct worker:error event might be better.
    }

    isSendingMessage = false; // Reset flag after handling error
}

async function handleBackgroundScrapeStage(payload) {
    const { stage, success, chatId, messageId, error, ...rest } = payload;
    console.log(`Orchestrator: handleBackgroundScrapeStage Stage ${stage}, chatId: ${chatId}, Success: ${success}`);

    let updatePayload = {};
    let finalStatus = 'idle'; // Default to idle on success

    if (success) {
        console.log(`Orchestrator: Scrape stage ${stage} succeeded for chat ${chatId}.`);
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
        console.error(`Orchestrator: Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
        updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
        finalStatus = 'error';
    }

    // --- Update DB regardless of success/failure based on this stage result --- 
    try {
        console.log(`Orchestrator: Updating message ${messageId} for stage ${stage} result.`);
        const updateRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`Orchestrator: Updated placeholder ${messageId} with stage ${stage} result.`);

        // Also set final session status based on this stage outcome
        console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);

    } catch (dbError) {
        console.error(`Orchestrator: Failed to update DB after stage ${stage} result:`, dbError);
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
         console.log("Orchestrator: Resetting isSendingMessage after processing scrape stage result.");
    }
}

async function handleBackgroundDirectScrapeResult(message) {
    const { chatId, messageId, success, error, ...scrapeData } = message;
    console.log(`Orchestrator: handleBackgroundDirectScrapeResult for chat ${chatId}, placeholder ${messageId}, Success: ${success}`);
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
        console.log(`[Orchestrator] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    } catch (error) {
        console.error(`Orchestrator: Error handling direct scrape result for chat ${chatId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with direct scrape result: ${error.message || error}`);
        const statusRequest = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on direct scrape processing error:", e));
    } finally {
         isSendingMessage = false; // TODO: Remove later
    }
}

_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.QUERY_SUBMITTED, handleQuerySubmit);
_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, handleBackgroundMsgResponse);
_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_ERROR_RECEIVED, handleBackgroundMsgError);
_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, handleBackgroundScrapeStage);
_eventBus_js__WEBPACK_IMPORTED_MODULE_2__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, handleBackgroundDirectScrapeResult);

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
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../eventBus.js */ "./src/eventBus.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./chatRenderer.js */ "./src/Home/chatRenderer.js");




let queryInput, sendButton, chatBody, attachButton, fileInput, /*sessionListElement,*/ loadingIndicatorElement, 
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
    "Xenova/Qwen1.5-1.8B-Chat": "Qwen 1.8B Chat (Quantized)",
    "Xenova/Phi-3-mini-4k-instruct": "Phi-3 Mini Instruct (Quantized)",
    "HuggingFaceTB/SmolLM-1.7B-Instruct": "SmolLM 1.7B Instruct",
    "HuggingFaceTB/SmolLM2-1.7B": "SmolLM2 1.7B",
    "google/gemma-3-4b-it-qat-q4_0-gguf": "Gemma 3 4B IT Q4 (GGUF)", 
    "bubblspace/Bubbl-P4-multimodal-instruct": "Bubbl-P4 Instruct (Multimodal)", 
    "microsoft/Phi-4-multimodal-instruct": "Phi-4 Instruct (Multimodal)", 
    "microsoft/Phi-4-mini-instruct": "Phi-4 Mini Instruct",
    "Qwen/Qwen3-4B": "Qwen/Qwen3-4B",
    "google/gemma-3-1b-pt": "google/gemma-3-1b-pt",
    "HuggingFaceTB/SmolLM2-360M": "HuggingFaceTB/SmolLM2-360M", 
    // Add more models here as needed
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
            _eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.QUERY_SUBMITTED, { text: messageText });
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
        _eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.QUERY_SUBMITTED, { text: messageText });
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
    if (!isInitialized || !payload) return;

    if (!modelLoadProgress) {
        console.warn("[UIController] Model load progress bar not found.");
    }

    const { status, file, progress, model } = payload;
    let message = status;
    let buttonState = 'loading';

    if (status === 'progress') {
        message = `Downloading ${file}... ${Math.round(progress)}%`;
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('system', message);
        if (modelLoadProgress) {
            modelLoadProgress.value = progress;
            modelLoadProgress.classList.remove('hidden');
        }
        setLoadButtonState('loading', `Down: ${Math.round(progress)}%`);
    } else if (status === 'download' || status === 'ready') {
        message = `Loading ${file}...`;
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('system', message);
        if (modelLoadProgress) {
            modelLoadProgress.value = 0; 
            modelLoadProgress.classList.remove('hidden');
        }
        setLoadButtonState('loading', `Loading ${file}`);
    } else if (status === 'done') {
        message = `${file} loaded. Preparing pipeline...`;
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('system', message);
        if (modelLoadProgress) {
            modelLoadProgress.value = 100; 
            modelLoadProgress.classList.remove('hidden'); 
        }
        setLoadButtonState('loading', 'Preparing...');
    } else {
        (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('system', message);
        if (modelLoadProgress) {
            modelLoadProgress.classList.add('hidden');
        }
        setLoadButtonState('loading', status);
    }
}

_eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames.STATUS_UPDATED_NOTIFICATION, handleStatusUpdate);
_eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE, handleLoadingProgress);

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

    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.clearTemporaryMessages)();

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
    _eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.REQUEST_MODEL_LOAD, { modelId: selectedModelId });
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

_eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.WORKER_READY, (payload) => {
    console.log("[UIController] Received worker:ready signal", payload);
    if (modelLoadProgress) modelLoadProgress.classList.add('hidden'); 
    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.clearTemporaryMessages)();
    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('success', `Model ${payload?.model || ''} ready.`);
    enableInput();
    setLoadButtonState('loaded');
});

_eventBus_js__WEBPACK_IMPORTED_MODULE_0__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.WORKER_ERROR, (payload) => {
    console.error("[UIController] Received worker:error signal", payload);
    if (modelLoadProgress) modelLoadProgress.classList.add('hidden'); 
    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.clearTemporaryMessages)();
    (0,_chatRenderer_js__WEBPACK_IMPORTED_MODULE_2__.renderTemporaryMessage)('error', `Model load failed: ${payload}`);
    setLoadButtonState('error');
    disableInput("Model load failed. Check logs."); 
});

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
/**
 * Formats a chat session object into a self-contained HTML string.
 * @param {object} sessionData - The chat session object from the database.
 * @returns {string} - The generated HTML string.
 */
function formatChatToHtml(sessionData) {
    if (!sessionData) return '';

    const title = sessionData.title || 'Chat Session';
    const messagesHtml = (sessionData.messages || []).map(msg => {
        const senderClass = msg.sender === 'user' ? 'user-message' : 'other-message';
        const senderLabel = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
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

/***/ "./src/eventBus.js":
/*!*************************!*\
  !*** ./src/eventBus.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   eventBus: () => (/* binding */ eventBus),
/* harmony export */   isBackgroundContext: () => (/* binding */ isBackgroundContext),
/* harmony export */   isDbEvent: () => (/* binding */ isDbEvent)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./events/dbEvents.js */ "./src/events/dbEvents.js");




function isDbEvent(eventName) {
  return Object.values(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames).includes(eventName);
}

function isBackgroundContext() {
  return (typeof window === 'undefined') && (typeof self !== 'undefined') && !!self.registration;
}

function getContextName() {
  if (isBackgroundContext()) return 'Background';
  // You can add more checks here for popup, content script, etc.
  // For now, default to 'Sidepanel' for non-background
  return 'Sidepanel';
}

let dbInitPromise = null;

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.isDbInitInProgress = false;
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
      // Optional: Clean up the event name if no listeners remain
      if (eventListeners.length === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  async autoEnsureDbInitialized() {
    if (this.isDbInitInProgress) {
      console.warn('[EventBus][autoEnsureDbInitialized] Initialization already in progress, returning existing promise.');
      return dbInitPromise;
    }
    if (!dbInitPromise) {
      this.isDbInitInProgress = true;
      console.info('[EventBus][autoEnsureDbInitialized] Starting DB initialization...');
      dbInitPromise = (async () => {
        try {
          const [response] = await this.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames.DB_GET_READY_STATE_REQUEST, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbGetReadyStateRequest());
          if (response?.data?.ready) {
            console.info('[EventBus][autoEnsureDbInitialized] DB is already ready.');
            return true;
          }
          await this.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames.INITIALIZE_REQUEST, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbInitializeRequest());
          for (let i = 0; i < 5; i++) {
            const [check] = await this.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_1__.DBEventNames.DB_GET_READY_STATE_REQUEST, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_2__.DbGetReadyStateRequest());
            if (check?.data?.ready) {
              console.info(`[EventBus][autoEnsureDbInitialized] DB became ready after ${i+1} checks.`);
              return true;
            }
            await new Promise(res => setTimeout(res, 300));
          }
          console.error('[EventBus][autoEnsureDbInitialized] Database failed to initialize after retries.');
          throw new Error('Database failed to initialize');
        } catch (err) {
          console.error('[EventBus][autoEnsureDbInitialized] Initialization failed:', err);
          throw err;
        } finally {
          this.isDbInitInProgress = false;
        }
      })();
    }
    return dbInitPromise;
  }

  async publish(eventName, data) {
   
     console.log(`[EventBus][${getContextName()}] eventName`, eventName,'data:', data);

    if (isDbEvent(eventName) && !isBackgroundContext()) {
      console.log(`[EventBus][${getContextName()}] Forwarding DB event to background:`, eventName, data);
      const result = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({ type: eventName, payload: data });
      console.log(`[EventBus][${getContextName()}] Received response from background for`, eventName, result);
      return result;
    }
    if (isDbEvent(eventName) && isBackgroundContext()) {
      console.log(`[EventBus][${getContextName()}] Handling DB event locally:`, eventName, data);
    }
    const listeners = this.listeners.get(eventName);
    if (listeners && listeners.length > 0) {
      try {
        const eventData = structuredClone(data);
        console.log(`[EventBus] Publishing ${eventName}. Found ${listeners.length} listeners. Data to send:`, JSON.stringify(eventData));
        const results = await Promise.all(
          listeners.map((callback, index) => {
            try {
              console.log(`[EventBus] Calling listener #${index + 1} for ${eventName} with data:`, JSON.stringify(eventData));
              return callback(eventData);
            } catch (error) {
              console.error(`[EventBus] Error in listener #${index + 1} for ${eventName}:`, error);
              return undefined;
            }
          })
        );
        console.log('[EventBus] Returning results for', eventName, results);
        return results;
      } catch (cloneError) {
        console.error(`[EventBus] Failed to structuredClone data for event ${eventName}:`, cloneError, data);
        return Promise.reject(cloneError);
      }
    } else {
      console.log(`[EventBus] No listeners registered for event ${eventName}. Data:`, JSON.stringify(data));
      return Promise.resolve([]);
    }
  }
}

const eventBus = new EventBus(); 

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
/* harmony export */   DbClearLogsRequest: () => (/* binding */ DbClearLogsRequest),
/* harmony export */   DbClearLogsResponse: () => (/* binding */ DbClearLogsResponse),
/* harmony export */   DbCreateSessionRequest: () => (/* binding */ DbCreateSessionRequest),
/* harmony export */   DbCreateSessionResponse: () => (/* binding */ DbCreateSessionResponse),
/* harmony export */   DbDeleteMessageRequest: () => (/* binding */ DbDeleteMessageRequest),
/* harmony export */   DbDeleteMessageResponse: () => (/* binding */ DbDeleteMessageResponse),
/* harmony export */   DbDeleteSessionRequest: () => (/* binding */ DbDeleteSessionRequest),
/* harmony export */   DbDeleteSessionResponse: () => (/* binding */ DbDeleteSessionResponse),
/* harmony export */   DbEventBase: () => (/* binding */ DbEventBase),
/* harmony export */   DbGetAllSessionsRequest: () => (/* binding */ DbGetAllSessionsRequest),
/* harmony export */   DbGetAllSessionsResponse: () => (/* binding */ DbGetAllSessionsResponse),
/* harmony export */   DbGetCurrentAndLastLogSessionIdsRequest: () => (/* binding */ DbGetCurrentAndLastLogSessionIdsRequest),
/* harmony export */   DbGetCurrentAndLastLogSessionIdsResponse: () => (/* binding */ DbGetCurrentAndLastLogSessionIdsResponse),
/* harmony export */   DbGetLogsRequest: () => (/* binding */ DbGetLogsRequest),
/* harmony export */   DbGetLogsResponse: () => (/* binding */ DbGetLogsResponse),
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
/* harmony export */   DbMessagesUpdatedNotification: () => (/* binding */ DbMessagesUpdatedNotification),
/* harmony export */   DbRenameSessionRequest: () => (/* binding */ DbRenameSessionRequest),
/* harmony export */   DbRenameSessionResponse: () => (/* binding */ DbRenameSessionResponse),
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


// Simple UUID generator (replace with a more robust library if needed)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// --- Base Classes ---
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

// --- Response Events (Define Before Request Events) ---

class DbGetSessionResponse extends DbResponseBase {
  constructor(originalRequestId, success, sessionData, error = null) {
    super(originalRequestId, success, sessionData, error);
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_RESPONSE;
  }
}

class DbAddMessageResponse extends DbResponseBase {
  constructor(originalRequestId, success, newMessageId, error = null) {
    super(originalRequestId, success, { newMessageId }, error);
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  }
}

class DbUpdateMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    }
}

class DbUpdateStatusResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  }
}

class DbDeleteMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    }
}

class DbToggleStarResponse extends DbResponseBase {
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    }
}

class DbCreateSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_RESPONSE;
        console.log(`[dbEvents] DbCreateSessionResponse constructor: type set to ${this.type}`);
    }

    get newSessionId() {
        return this.data?.newSessionId;
    }
}

class DbDeleteSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_RESPONSE;
    }
}

class DbRenameSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, error = null) {
        super(originalRequestId, success, null, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_RESPONSE;
    }
}

class DbGetAllSessionsResponse extends DbResponseBase {
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
        this.payload = { sessions };
    }
}

class DbGetStarredSessionsResponse extends DbResponseBase {
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); 
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    }
}

class DbGetReadyStateResponse extends DbResponseBase {
    constructor(originalRequestId, success, ready, error = null) {
        super(originalRequestId, success, { ready }, error);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_RESPONSE;
        this.payload = { ready };
    }
}

// --- Request Events (Define After Response Events) ---

class DbGetSessionRequest extends DbEventBase {
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_RESPONSE;
  constructor(sessionId) {
    super();
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_SESSION_REQUEST;
    this.payload = { sessionId };
  }
}

class DbAddMessageRequest extends DbEventBase {
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_RESPONSE;
  constructor(sessionId, messageObject) {
    super();
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_MESSAGE_REQUEST;
    this.payload = { sessionId, messageObject };
  }
}

class DbUpdateMessageRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId, updates) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_MESSAGE_REQUEST;
        this.payload = { sessionId, messageId, updates };
    }
}

class DbUpdateStatusRequest extends DbEventBase {
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_RESPONSE;
  constructor(sessionId, status) {
    super();
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_UPDATE_STATUS_REQUEST;
    this.payload = { sessionId, status };
  }
}

class DbDeleteMessageRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
    constructor(sessionId, messageId) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_MESSAGE_REQUEST;
        this.payload = { sessionId, messageId };
    }
}

class DbToggleStarRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_TOGGLE_STAR_REQUEST;
        this.payload = { sessionId };
    }
}

class DbCreateSessionRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_RESPONSE;
    constructor(initialMessage) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CREATE_SESSION_REQUEST;
        this.payload = { initialMessage };
        console.log(`[dbEvents] DbCreateSessionRequest constructor: type set to ${this.type}`);
    }
}

class DbInitializeRequest extends DbEventBase {
    // No response expected via requestDbAndWait, so no responseEventName needed
    constructor() {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.INITIALIZE_REQUEST;
        this.payload = {}; 
    }
}

class DbDeleteSessionRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_RESPONSE;
    constructor(sessionId) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_DELETE_SESSION_REQUEST;
        this.payload = { sessionId };
    }
}

class DbRenameSessionRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_RESPONSE;
    constructor(sessionId, newName) {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_RENAME_SESSION_REQUEST;
        this.payload = { sessionId, newName };
    }
}

class DbGetAllSessionsRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_ALL_SESSIONS_REQUEST;
        console.log('[DEBUG][Create] DbGetAllSessionsRequest:', this, this.type);
    }
}

class DbGetStarredSessionsRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
    constructor() {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_STARRED_SESSIONS_REQUEST;
    }
}

class DbGetReadyStateRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_RESPONSE;
    constructor() {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_READY_STATE_REQUEST;
    }
}

// --- Notification Events ---

class DbMessagesUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
        this.payload = { messages }; 
    }
}

class DbStatusUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, status) {
        super(sessionId);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_STATUS_UPDATED_NOTIFICATION;
        this.payload = { status };
    }
}

class DbSessionUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, updatedSessionData) {
        super(sessionId);
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_SESSION_UPDATED_NOTIFICATION;
        this.payload = { session: updatedSessionData }; 
    }
}

class DbInitializationCompleteNotification {
    constructor({ success, error = null }) {
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (error.message || String(error)) : null };
    }
}

// --- Log Response Events ---

class DbGetLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, logs, error = null) {
    super(originalRequestId, success, logs, error); // data = logs array
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_RESPONSE;
  }
}

class DbGetUniqueLogValuesResponse extends DbResponseBase {
  constructor(originalRequestId, success, values, error = null) {
    super(originalRequestId, success, values, error); // data = values array
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  }
}

class DbClearLogsResponse extends DbResponseBase {
  constructor(originalRequestId, success, error = null) {
    super(originalRequestId, success, null, error);
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_RESPONSE;
  }
}

class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    constructor(originalRequestId, success, ids, error = null) {
      // data = { currentLogSessionId: '...', previousLogSessionId: '...' | null }
      super(originalRequestId, success, ids, error);
      this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    }
  }

// --- Log Request Events ---

// Request to add a single log entry
// No response needed, fire-and-forget style
class DbAddLogRequest extends DbEventBase {
  // No responseEventName needed for fire-and-forget
  constructor(logEntryData) {
    // logEntryData = { level, component, message, chatSessionId (optional) }
    // db service will add id, timestamp, extensionSessionId
    super(); // Generate request ID just for tracking if needed
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_ADD_LOG_REQUEST;
    this.payload = { logEntryData };
  }
}

// Request to get logs based on filters
class DbGetLogsRequest extends DbEventBase {
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_RESPONSE;
  constructor(filters) {
    // filters = { extensionSessionId: 'id' | 'current' | 'last' | 'all',
    //             component: 'name' | 'all',
    //             level: 'level' | 'all' }
    super();
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_LOGS_REQUEST;
    this.payload = { filters };
  }
}

// Request to get unique values for a specific field in logs
class DbGetUniqueLogValuesRequest extends DbEventBase {
  static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
  constructor(fieldName) {
    // fieldName = 'extensionSessionId', 'component', 'level'
    super();
    this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
    this.payload = { fieldName };
  }
}

// Request to clear logs (potentially based on filters in future, but maybe just 'all' or 'last_session' for now)
class DbClearLogsRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_RESPONSE;
    constructor(filter = 'all') { // 'all' or potentially 'last_session' or specific session ID later
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_CLEAR_LOGS_REQUEST;
        this.payload = { filter };
    }
}

// Request to get the actual IDs for 'current' and 'last' sessions
class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    static responseEventName = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
    constructor() {
        super();
        this.type = _eventNames_js__WEBPACK_IMPORTED_MODULE_0__.DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
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
/* harmony export */   DBEventNames: () => (/* binding */ DBEventNames),
/* harmony export */   DriveMessageTypes: () => (/* binding */ DriveMessageTypes),
/* harmony export */   ModelLoaderMessageTypes: () => (/* binding */ ModelLoaderMessageTypes),
/* harmony export */   ModelWorkerStates: () => (/* binding */ ModelWorkerStates),
/* harmony export */   RuntimeMessageTypes: () => (/* binding */ RuntimeMessageTypes),
/* harmony export */   SiteMapperMessageTypes: () => (/* binding */ SiteMapperMessageTypes),
/* harmony export */   UIEventNames: () => (/* binding */ UIEventNames),
/* harmony export */   WorkerEventNames: () => (/* binding */ WorkerEventNames)
/* harmony export */ });
const DBEventNames = Object.freeze({
  GET_SESSION_REQUEST: 'DbGetSessionRequest',
  GET_SESSION_RESPONSE: 'DbGetSessionResponse',
  ADD_MESSAGE_REQUEST: 'DbAddMessageRequest',
  ADD_MESSAGE_RESPONSE: 'DbAddMessageResponse',
  UPDATE_MESSAGE_REQUEST: 'DbUpdateMessageRequest',
  UPDATE_MESSAGE_RESPONSE: 'DbUpdateMessageResponse',
  UPDATE_STATUS_REQUEST: 'DbUpdateStatusRequest',
  UPDATE_STATUS_RESPONSE: 'DbUpdateStatusResponse',
  DELETE_MESSAGE_REQUEST: 'DbDeleteMessageRequest',
  DELETE_MESSAGE_RESPONSE: 'DbDeleteMessageResponse',
  TOGGLE_STAR_REQUEST: 'DbToggleStarRequest',
  TOGGLE_STAR_RESPONSE: 'DbToggleStarResponse',
  DB_CREATE_SESSION_REQUEST: 'DbCreateSessionRequest',
  DB_CREATE_SESSION_RESPONSE: 'DbCreateSessionResponse',
  DELETE_SESSION_REQUEST: 'DbDeleteSessionRequest',
  DELETE_SESSION_RESPONSE: 'DbDeleteSessionResponse',
  RENAME_SESSION_REQUEST: 'DbRenameSessionRequest',
  RENAME_SESSION_RESPONSE: 'DbRenameSessionResponse',
  DB_GET_ALL_SESSIONS_REQUEST: 'DbGetAllSessionsRequest',
  DB_GET_ALL_SESSIONS_RESPONSE: 'DbGetAllSessionsResponse',
  DB_GET_STARRED_SESSIONS_REQUEST: 'DbGetStarredSessionsRequest',
  DB_GET_STARRED_SESSIONS_RESPONSE: 'DbGetStarredSessionsResponse',
  MESSAGES_UPDATED_NOTIFICATION: 'DbMessagesUpdatedNotification',
  STATUS_UPDATED_NOTIFICATION: 'DbStatusUpdatedNotification',
  SESSION_UPDATED_NOTIFICATION: 'DbSessionUpdatedNotification',
  INITIALIZE_REQUEST: 'DbInitializeRequest',
  INITIALIZATION_COMPLETE_NOTIFICATION: 'DbInitializationCompleteNotification',
  GET_LOGS_REQUEST: 'DbGetLogsRequest',
  GET_LOGS_RESPONSE: 'DbGetLogsResponse',
  GET_UNIQUE_LOG_VALUES_REQUEST: 'DbGetUniqueLogValuesRequest',
  GET_UNIQUE_LOG_VALUES_RESPONSE: 'DbGetUniqueLogValuesResponse',
  CLEAR_LOGS_REQUEST: 'DbClearLogsRequest',
  CLEAR_LOGS_RESPONSE: 'DbClearLogsResponse',
  GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST: 'DbGetCurrentAndLastLogSessionIdsRequest',
  GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE: 'DbGetCurrentAndLastLogSessionIdsResponse',
  ADD_LOG_REQUEST: 'DbAddLogRequest',
  ADD_LOG_RESPONSE: 'DbAddLogResponse',
  DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
  DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
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
  SCRAPE_ACTIVE_TAB: 'SCRAPE_ACTIVE_TAB',
  DYNAMIC_SCRIPT_MESSAGE_TYPE: 'offscreenIframeResult',
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

const DriveMessageTypes = Object.freeze({
  DRIVE_FILE_LIST_DATA: 'driveFileListData',
});

const ModelLoaderMessageTypes = Object.freeze({
  INIT: 'init',
  GENERATE: 'generate',
  INTERRUPT: 'interrupt',
  RESET: 'reset',
}); 

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


let pageContainers = [];
let navButtons = [];
let mainHeaderTitle = null;

const pageTitles = {
    'page-home': 'Tab Agent', 
    'page-spaces': 'Spaces',
    'page-library': 'Library',
    'page-settings': 'Settings'
};


async function navigateTo(pageId) { 
    console.log(`Navigating to ${pageId}`);
   
    pageContainers.forEach(container => {
        container.classList.add('hidden');
        container.classList.remove('active-page');
    });

    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        targetPage.classList.add('active-page');
    } else {
        console.error(`Navigation error: Page with ID ${pageId} not found. Showing home.`);
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

    // Update active button state
    navButtons.forEach(button => {
        if (button.dataset.page === pageId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    const { eventBus } = await Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./eventBus.js */ "./src/eventBus.js")); 
    eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.NAVIGATION_PAGE_CHANGED, { pageId: pageId });
    console.log(`[Navigation] Published navigation:pageChanged event for ${pageId}`);

    const queryInput = document.getElementById('query-input');
     if (pageId === 'page-home' && queryInput) {
         queryInput.focus(); 
     }
}

function initializeNavigation() {
    console.log("Initializing navigation...");

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
    console.log("Navigation initialized.");
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
/**
 * src/notifications.js
 * Manages the UI notification banner.
 */

let notificationTimeout;

/**
 * Shows a notification message in the banner.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'error'} [type='info'] - The type of notification (affects styling).
 * @param {number} [duration=4000] - Duration in ms to show the message (0 for indefinite).
 */
function showNotification(message, type = 'info', duration = 3000) {
    console.log(`[Notification] ${type.toUpperCase()}: ${message} (Duration: ${duration}ms)`);

    // Optional: Basic alert fallback (can be annoying)
    // alert(`${type.toUpperCase()}: ${message}`);

    // You could also implement a simple DOM-based notification here
    // for temporary feedback if needed.
}

/**
 * Hides the notification banner.
 */
function hideNotification() {
    const banner = document.getElementById('notification-banner');
    if (banner) {
        banner.classList.remove('visible');
        // Optional: Clean up after transition ends, though CSS handles visibility
        // banner.addEventListener('transitionend', () => { banner.textContent = ''; }, { once: true });
    }
    // Clear timeout if banner is hidden manually
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    // Remove the click listener once hidden
    if (banner) {
        banner.onclick = null;
    }
} 

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
/******/ 			return "assets/" + chunkId + "-" + "1550a37f2b1b8cd3e977" + ".js";
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
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
/*!**************************!*\
  !*** ./src/sidepanel.js ***!
  \**************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _navigation_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./navigation.js */ "./src/navigation.js");
/* harmony import */ var _Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Home/uiController.js */ "./src/Home/uiController.js");
/* harmony import */ var _Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Home/chatRenderer.js */ "./src/Home/chatRenderer.js");
/* harmony import */ var _Home_messageOrchestrator_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Home/messageOrchestrator.js */ "./src/Home/messageOrchestrator.js");
/* harmony import */ var _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Home/fileHandler.js */ "./src/Home/fileHandler.js");
/* harmony import */ var _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Utilities/generalUtils.js */ "./src/Utilities/generalUtils.js");
/* harmony import */ var _notifications_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./notifications.js */ "./src/notifications.js");
/* harmony import */ var _eventBus_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./eventBus.js */ "./src/eventBus.js");
/* harmony import */ var _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./events/dbEvents.js */ "./src/events/dbEvents.js");
/* harmony import */ var _Controllers_HistoryPopupController_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./Controllers/HistoryPopupController.js */ "./src/Controllers/HistoryPopupController.js");
/* harmony import */ var _Controllers_LibraryController_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./Controllers/LibraryController.js */ "./src/Controllers/LibraryController.js");
/* harmony import */ var _Controllers_DiscoverController_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./Controllers/DiscoverController.js */ "./src/Controllers/DiscoverController.js");
/* harmony import */ var _Controllers_SettingsController_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./Controllers/SettingsController.js */ "./src/Controllers/SettingsController.js");
/* harmony import */ var _Controllers_SpacesController_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./Controllers/SpacesController.js */ "./src/Controllers/SpacesController.js");
/* harmony import */ var _Controllers_DriveController_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./Controllers/DriveController.js */ "./src/Controllers/DriveController.js");
/* harmony import */ var _events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./events/eventNames.js */ "./src/events/eventNames.js");




















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
            const escapeHtml = (htmlStr) => {
                return htmlStr.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            };
            return escapeHtml(code);
        },
        langPrefix: 'language-',
        gfm: true,
        breaks: true
    });
    console.log('[Sidepanel] Marked.js globally configured to use highlight.js.');
} else {
    console.error("[Sidepanel] Marked.js library (window.marked) not found. Ensure it's loaded before this script.");
}

let currentTab = null;
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;

let historyPopupController = null;
let isDbReady = false;

const pendingDbRequests = new Map();

function requestDbAndWait(requestEvent, timeoutMs = 5000) {
    return new Promise(async (resolve, reject) => {
        const { requestId, type: requestType } = requestEvent;
        let timeoutId;
        try {
            timeoutId = setTimeout(() => {
                console.error(`[Sidepanel] DB request timed out for ${requestType} (Req ID: ${requestId})`);
                reject(new Error(`DB request timed out for ${requestType}`));
            }, timeoutMs);
            const result = await _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(requestEvent.type, requestEvent);
            clearTimeout(timeoutId);
            if (result && (result.success || result.error === undefined)) {
                resolve(result.data || result.payload);
            } else {
                reject(new Error(result?.error || `DB operation ${requestType} failed`));
            }
        } catch (error) {
            clearTimeout(timeoutId);
            reject(error);
        }
    });
}

function getActiveChatSessionId() {
    return activeSessionId;
}

async function setActiveChatSessionId(newSessionId) {
    console.log(`[Sidepanel] Setting active session ID to: ${newSessionId}`);
    activeSessionId = newSessionId;
    if (newSessionId) {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ lastSessionId: newSessionId });
    } else {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.remove('lastSessionId');
    }
    (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_3__.setActiveSessionId)(newSessionId); 
    (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__.setActiveSession)(newSessionId); 
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("[Sidepanel] DOM Content Loaded.");

    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get('view');

    if (requestedView === 'logs') {
        console.log("[Sidepanel] Initializing in Log Viewer Mode.");
        document.body.classList.add('log-viewer-mode'); 
        
        document.getElementById('header')?.classList.add('hidden');
        document.getElementById('bottom-nav')?.classList.add('hidden');
        document.querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
            .forEach(el => el.classList.add('hidden'));
        const logViewerPage = document.getElementById('page-log-viewer');
        if (logViewerPage) {
            logViewerPage.classList.remove('hidden');
        } else {
            console.error("CRITICAL: #page-log-viewer element not found!");
            document.body.innerHTML = "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>"; // Show error
            return; 
        }

        try {
            const logViewerModule = await __webpack_require__.e(/*! import() */ "src_Controllers_LogViewerController_js").then(__webpack_require__.bind(__webpack_require__, /*! ./Controllers/LogViewerController.js */ "./src/Controllers/LogViewerController.js"));
            await logViewerModule.initializeLogViewerController();
            console.log("[Sidepanel] Log Viewer Controller initialized.");
        } catch (err) {
            console.error("Failed to load or initialize LogViewerController:", err);
            if (logViewerPage) {
                logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${err.message}</div>`;
            }
        }
        
        return; 
    }

    console.log("[Sidepanel] Initializing in Standard Mode.");
    

    document.getElementById('page-log-viewer')?.classList.add('hidden'); 

    let isDbReady = false;
    const TIMEOUT_MS = 10000;
    try {
        const dbInitPromise = _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.DBEventNames.INITIALIZE_REQUEST, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbInitializeRequest());
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Database initialization timed out.")), TIMEOUT_MS));
        const resultArr = await Promise.race([dbInitPromise, timeoutPromise]);
        const result = Array.isArray(resultArr) ? resultArr[0] : resultArr;
        if (result && result.success) {
            console.log("[Sidepanel] DB initialization confirmed complete.");
            isDbReady = true;
        } else {
            const errorMsg = result?.error || "Unknown DB initialization error";
            throw new Error(`Database initialization failed: ${errorMsg}`);
        }
    } catch (error) {
        console.error("[Sidepanel] DB Initialization failed:", error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)(`Initialization failed: ${error.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class=\"p-4 text-red-500\">Critical Error: ${error.message}. Please reload the extension.</div>`;
        }
        return;
    }

    try {
        const { 
            chatBody, 
            newChatButton, 
            chatInputElement, 
            sendButton, 
            fileInput
        } = (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__.initializeUI)({
            onNewChat: handleNewChat,
            onSessionClick: handleChatSessionClick,
            onAttachFile: _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_5__.handleAttachClick
        });
        console.log("[Sidepanel] UI Controller Initialized.");

        const chatBodyForRenderer = document.getElementById('chat-body');
        if (!chatBodyForRenderer) {
            console.error("[Sidepanel] CRITICAL: chatBodyForRenderer is null right before calling initializeRenderer!");
        }
        (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_3__.initializeRenderer)(chatBodyForRenderer, requestDbAndWait);
        console.log("[Sidepanel] Chat Renderer Initialized.");

        (0,_navigation_js__WEBPACK_IMPORTED_MODULE_1__.initializeNavigation)();
        console.log("[Sidepanel] Navigation Initialized.");

        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.NAVIGATION_PAGE_CHANGED, handlePageChange);
        
        (0,_Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_5__.initializeFileHandling)({ 
             uiController: _Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__, 
             getActiveSessionIdFunc: getActiveChatSessionId 
        });
        console.log("[Sidepanel] File Handler Initialized.");
        

        const fileInputForListener = document.getElementById('file-input');
        if (fileInputForListener) {
            fileInputForListener.addEventListener('change', _Home_fileHandler_js__WEBPACK_IMPORTED_MODULE_5__.handleFileSelected);
            } else {
            console.warn("[Sidepanel] File input element (re-fetched) not found before adding listener.");
        }

        const activeTab = await (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.getActiveTab)();
        currentTabId = activeTab?.id;
        currentTab = activeTab;
        console.log(`[Sidepanel] Current Tab ID: ${currentTabId}`);

        (0,_Home_messageOrchestrator_js__WEBPACK_IMPORTED_MODULE_4__.initializeOrchestrator)({
            getActiveSessionIdFunc: getActiveChatSessionId,
            onSessionCreatedCallback: handleSessionCreated,
            getCurrentTabIdFunc: () => currentTabId
        });
        console.log("[Sidepanel] Message Orchestrator Initialized.");

        webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onMessage.addListener(handleBackgroundMessage);
        console.log("[Sidepanel] Background message listener added.");

        const historyPopupElement = document.getElementById('history-popup');
        const historyListElement = document.getElementById('history-list');
        const historySearchElement = document.getElementById('history-search');
        const closeHistoryButtonElement = document.getElementById('close-history');
        const historyButton = document.getElementById('history-button');
        const detachButton = document.getElementById('detach-button');

        if (historyPopupElement && historyListElement && historySearchElement && closeHistoryButtonElement) {
            historyPopupController = (0,_Controllers_HistoryPopupController_js__WEBPACK_IMPORTED_MODULE_10__.initializeHistoryPopup)(
                {
                    popupContainer: historyPopupElement,
                    listContainer: historyListElement,
                    searchInput: historySearchElement,
                    closeButton: closeHistoryButtonElement
                },
                requestDbAndWait
            );
            if (!historyPopupController) {
                 console.error("[Sidepanel] History Popup Controller initialization failed.");
            }
        } else {
            console.warn("[Sidepanel] Could not find all required elements for History Popup Controller.");
        }

        if (historyButton && historyPopupController) {
            historyButton.addEventListener('click', () => {
                 historyPopupController.show();
            });
        } else {
             console.warn("[Sidepanel] History button or controller not available for listener.");
        }

        if (detachButton) {
             detachButton.addEventListener('click', handleDetach);
        } else {
             console.warn("[Sidepanel] Detach button not found.");
        }
        
        const libraryListElement = document.getElementById('starred-list');
        if (libraryListElement) {
             (0,_Controllers_LibraryController_js__WEBPACK_IMPORTED_MODULE_11__.initializeLibraryController)(
                 { listContainer: libraryListElement },
                 requestDbAndWait
             );
             console.log("[Sidepanel] Library Controller Initialized.");
            } else {
            console.warn("[Sidepanel] Could not find #starred-list element for Library Controller.");
        }

        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.subscribe(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.REQUEST_MODEL_LOAD, (payload) => {
            const modelId = payload?.modelId;
            if (!modelId) {
                console.error("[Sidepanel] Received 'ui:requestModelLoad' but missing modelId.");
                _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.WORKER_ERROR, 'No model ID specified for loading.');
                return;
            }
            console.log(`[Sidepanel] Received 'ui:requestModelLoad' for ${modelId}. Sending 'loadModel' to background.`);
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({ type: _events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.LOAD_MODEL, payload: { modelId: modelId } }).catch(err => {
                console.error(`[Sidepanel] Error sending 'loadModel' message for ${modelId}:`, err);
                _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.WORKER_ERROR, `Failed to send load request: ${err.message}`);
            });
        });


        (0,_Controllers_DiscoverController_js__WEBPACK_IMPORTED_MODULE_12__.initializeDiscoverController)();
        console.log("[Sidepanel] Discover Controller Initialized call attempted.");


        (0,_Controllers_SettingsController_js__WEBPACK_IMPORTED_MODULE_13__.initializeSettingsController)();
        console.log("[Sidepanel] Settings Controller Initialized call attempted.");
        

        (0,_Controllers_SpacesController_js__WEBPACK_IMPORTED_MODULE_14__.initializeSpacesController)();
        console.log("[Sidepanel] Spaces Controller Initialized call attempted.");


        (0,_Controllers_DriveController_js__WEBPACK_IMPORTED_MODULE_15__.initializeDriveController)({
            requestDbAndWaitFunc: requestDbAndWait,
            getActiveChatSessionId: getActiveChatSessionId,
            setActiveChatSessionId: setActiveChatSessionId,
            showNotification: _notifications_js__WEBPACK_IMPORTED_MODULE_7__.showNotification,
            debounce: _Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.debounce,
            eventBus: _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus
        });
        console.log("[Sidepanel] Drive Controller Initialized.");


        const popupContext = urlParams.get('context');
        originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
        isPopup = popupContext === 'popup';
        console.log(`[Sidepanel] Context: ${isPopup ? 'Popup' : 'Sidepanel'}${isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''}`);

        if (isPopup && originalTabIdFromPopup) {
            const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
            const result = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(storageKey);
            const detachedSessionId = result[storageKey];
            if (detachedSessionId) {
                console.log(`[Sidepanel-Popup] Found detached session ID: ${detachedSessionId}. Loading...`);
                await loadAndDisplaySession(detachedSessionId);

            } else {
                 console.log(`[Sidepanel-Popup] No detached session ID found for key ${storageKey}. Starting fresh.`);
                 await setActiveChatSessionId(null);
            }
        } else {

            console.log("[Sidepanel] Always starting fresh. Loading empty/welcome state.");
            await loadAndDisplaySession(null);
        }
        
        console.log("[Sidepanel] Initialization complete (after DB ready).");

    } catch (error) {
        console.error('[Sidepanel] Initialization failed:', error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)(`Initialization failed: ${error.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${error.message}. Please reload the extension.</div>`;
        }
    }
});

function handleBackgroundMessage(message, sender, sendResponse) {
    console.log('[Sidepanel] Received message from background:', message);
    if (message.type === 'response') {
        const payload = { chatId: message.chatId, messageId: message.messageId, text: message.text };
        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, payload);
    } else if (message.type === 'error') {
        const payload = { chatId: message.chatId, messageId: message.messageId, error: message.error };
        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_ERROR_RECEIVED, payload);
        sendResponse({}); 
    } else if (message.type === 'STAGE_SCRAPE_RESULT') {
        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, message.payload);
        sendResponse({status: "received", type: message.type}); 
    } else if (message.type === 'DIRECT_SCRAPE_RESULT') {
        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, message.payload);
        sendResponse({}); 
    } else if (message.type === 'uiLoadingStatusUpdate') {
        console.log('[Sidepanel] Forwarding uiLoadingStatusUpdate to eventBus.');
        _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_LOADING_STATUS_UPDATE, message.payload);
    } else if (message.type === 'driveFileListData') {
        console.log('[Sidepanel] Received driveFileListData, calling DriveController handler directly.');
        (0,_Controllers_DriveController_js__WEBPACK_IMPORTED_MODULE_15__.handleDriveFileListResponse)(message);
    } else {
        console.warn('[Sidepanel] Received unknown message type from background:', message.type, message);
    }
}

async function handleSessionCreated(newSessionId) {
    console.log(`[Sidepanel] Orchestrator reported new session created: ${newSessionId}`);
    await setActiveChatSessionId(newSessionId);

    console.log(`[Sidepanel] Explicitly fetching messages for new session ${newSessionId}`);
    try {
        const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbGetSessionRequest(newSessionId);
        const sessionData = await requestDbAndWait(request);
        if (sessionData && sessionData.messages) {
            _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.DBEventNames.MESSAGES_UPDATED_NOTIFICATION, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbMessagesUpdatedNotification(newSessionId, sessionData.messages));
            console.log(`[Sidepanel] Manually triggered message render for new session ${newSessionId}`);
        } else {
            console.warn(`[Sidepanel] No messages found in session data for new session ${newSessionId}. Response data:`, sessionData);
        }
    } catch (error) {
        console.error(`[Sidepanel] Failed to fetch messages for new session ${newSessionId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)(`Failed to load initial messages for new chat: ${error.message}`);
    }
}

async function handleNewChat() {
    console.log("[Sidepanel] New Chat button clicked.");
    await setActiveChatSessionId(null);
    (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__.clearInput)();
    (0,_Home_uiController_js__WEBPACK_IMPORTED_MODULE_2__.focusInput)();
}

async function handleChatSessionClick(event) {
    const sessionId = event.currentTarget.dataset.sessionId;
    if (sessionId && sessionId !== activeSessionId) {
        console.log(`[Sidepanel] Session list item clicked: ${sessionId}`);
        await loadAndDisplaySession(sessionId);
    } else if (sessionId === activeSessionId) {
        console.log(`[Sidepanel] Clicked already active session: ${sessionId}`);
        (0,_Home_chatRenderer_js__WEBPACK_IMPORTED_MODULE_3__.scrollToBottom)();
                } else {
        console.warn("[Sidepanel] Session list click event missing sessionId:", event.currentTarget);
    }
}

async function loadAndDisplaySession(sessionId) {
    if (!sessionId) {
        console.log("[Sidepanel] No session ID to load, setting renderer to null.");
        await setActiveChatSessionId(null);
        return; 
    }

    console.log(`[Sidepanel] Loading session data for: ${sessionId}`);
    let sessionData = null; 

    try {
        const request = new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbGetSessionRequest(sessionId);
        sessionData = await requestDbAndWait(request); 

        console.log(`[Sidepanel] Session data successfully loaded for ${sessionId}.`);
        await setActiveChatSessionId(sessionId);

        if (sessionData && sessionData.messages) {
            console.log(`[Sidepanel] Manually triggering message render for loaded session ${sessionId}.`);
            _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.DBEventNames.MESSAGES_UPDATED_NOTIFICATION, new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbMessagesUpdatedNotification(sessionId, sessionData.messages));
        } else {
            console.warn(`[Sidepanel] No messages found in loaded session data for ${sessionId}. Displaying empty chat.`);
             _eventBus_js__WEBPACK_IMPORTED_MODULE_8__.eventBus.publish(_events_eventNames_js__WEBPACK_IMPORTED_MODULE_16__.DBEventNames.MESSAGES_UPDATED_NOTIFICATION,
                 new _events_dbEvents_js__WEBPACK_IMPORTED_MODULE_9__.DbMessagesUpdatedNotification(sessionId, { messages: [] })
             );
        }

    } catch (error) {
        console.error(`[Sidepanel] Failed to load session ${sessionId}:`, error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)(`Failed to load chat: ${error.message}`);
        await setActiveChatSessionId(null);
    }
}

async function handleDetach() {
    if (!currentTabId) {
        console.error('Cannot detach: Missing tab ID');
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)('Cannot detach: Missing tab ID');
        return;
    }
    const currentSessionId = getActiveChatSessionId();

    try {
        const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({ 
            type: 'getPopupForTab', 
            tabId: currentTabId 
        });

        if (response && response.popupId) {
            await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().windows.update(response.popupId, { focused: true });
            return; 
        }

        const storageKey = `detachedSessionId_${currentTabId}`;
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({
            [storageKey]: currentSessionId
        });
        console.log(`Sidepanel: Saved session ID ${currentSessionId} for detach key ${storageKey}.`);

        const popup = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().windows.create({
            url: webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
            type: 'popup',
            width: 400,
            height: 600
        });

        if (popup?.id) { 
            await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({ 
                type: 'popupCreated', 
                tabId: currentTabId,
                popupId: popup.id
            });
            } else {
             throw new Error("Failed to create popup window.");
        }

                } catch (error) {
        console.error('Error during detach:', error);
        (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)(`Error detaching chat: ${error.message}`); 
                }
            }



async function handlePageChange(event) {
    if (!event || !event.pageId) return;
    console.log(`[Sidepanel] Navigation changed to: ${event.pageId}`);

    if (!isDbReady) {
        console.log("[Sidepanel] DB not ready yet, skipping session load on initial navigation event.");
        return; 
    }

    if (event.pageId === 'page-home') {
        console.log("[Sidepanel] Navigated to home page, checking for specific session load signal...");
        try {
            const { lastSessionId } = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(['lastSessionId']);
            if (lastSessionId) {
                console.log(`[Sidepanel] Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
                await loadAndDisplaySession(lastSessionId);
                await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.remove('lastSessionId'); 
            } else {
                console.log("[Sidepanel] No load signal found. Resetting to welcome state.");
                await loadAndDisplaySession(null); 
            }
        } catch (error) {
            console.error("[Sidepanel] Error checking/loading session based on signal:", error);
            (0,_Utilities_generalUtils_js__WEBPACK_IMPORTED_MODULE_6__.showError)("Failed to load session state."); 
            await loadAndDisplaySession(null); 
        }
    }
}
})();

/******/ })()
;
//# sourceMappingURL=sidepanel.js.map