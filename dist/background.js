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
  } else // removed by dead control flow
{ var mod; }
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

/***/ "./src/DB/dbEvents.ts":
/*!****************************!*\
  !*** ./src/DB/dbEvents.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DBEventNames: () => (/* binding */ DBEventNames),
/* harmony export */   DbAddLogRequest: () => (/* binding */ DbAddLogRequest),
/* harmony export */   DbAddLogResponse: () => (/* binding */ DbAddLogResponse),
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
/* harmony export */   DbEnsureInitializedRequest: () => (/* binding */ DbEnsureInitializedRequest),
/* harmony export */   DbEnsureInitializedResponse: () => (/* binding */ DbEnsureInitializedResponse),
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
/* harmony export */   DbInitWorkerRequest: () => (/* binding */ DbInitWorkerRequest),
/* harmony export */   DbInitWorkerResponse: () => (/* binding */ DbInitWorkerResponse),
/* harmony export */   DbInitializationCompleteNotification: () => (/* binding */ DbInitializationCompleteNotification),
/* harmony export */   DbInitializeRequest: () => (/* binding */ DbInitializeRequest),
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
/* harmony export */   DbUpdateStatusResponse: () => (/* binding */ DbUpdateStatusResponse),
/* harmony export */   DbWorkerCreatedNotification: () => (/* binding */ DbWorkerCreatedNotification)
/* harmony export */ });
// dbEvents.js
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
    DB_ADD_LOG_RESPONSE: 'DbAddLogResponse', // Response for add log, if ever needed (currently fire-and-forget)
    DB_GET_READY_STATE_REQUEST: 'DbGetReadyStateRequest',
    DB_GET_READY_STATE_RESPONSE: 'DbGetReadyStateResponse',
    DB_RESET_DATABASE_REQUEST: 'DbResetDatabaseRequest',
    DB_RESET_DATABASE_RESPONSE: 'DbResetDatabaseResponse',
    // General DB Worker and Initialization
    DB_ENSURE_INITIALIZED_REQUEST: 'DbEnsureInitializedRequest',
    DB_ENSURE_INITIALIZED_RESPONSE: 'DbEnsureInitializedResponse',
    DB_INIT_WORKER_REQUEST: 'DbInitWorkerRequest', // This was unused in db.js handler map
    DB_INIT_WORKER_RESPONSE: 'DbInitWorkerResponse',
    DB_WORKER_ERROR: 'DbWorkerError', // Notification from worker for unhandled errors
    DB_WORKER_RESET: 'DbWorkerReset', // Potential command or notification for worker reset
});
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
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
        this.error = error ? (typeof error === 'string' ? error : (error.message || String(error))) : null;
    }
}
class DbNotificationBase {
    constructor(sessionId) {
        this.sessionId = sessionId;
        this.timestamp = Date.now();
    }
}
// --- Standard Session/Message/Log Events (Existing - no changes needed below unless specified) ---
class DbGetSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, sessionData, error = null) {
        super(originalRequestId, success, sessionData, error);
        this.type = DbGetSessionResponse.type;
    }
}
DbGetSessionResponse.type = DBEventNames.DB_GET_SESSION_RESPONSE;
class DbAddMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, newMessageId, error = null) {
        super(originalRequestId, success, { newMessageId }, error);
        this.type = DbAddMessageResponse.type;
    }
}
DbAddMessageResponse.type = DBEventNames.DB_ADD_MESSAGE_RESPONSE;
class DbUpdateMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbUpdateMessageResponse.type;
    }
}
DbUpdateMessageResponse.type = DBEventNames.DB_UPDATE_MESSAGE_RESPONSE;
class DbUpdateStatusResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbUpdateStatusResponse.type;
    }
}
DbUpdateStatusResponse.type = DBEventNames.DB_UPDATE_STATUS_RESPONSE;
class DbDeleteMessageResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbDeleteMessageResponse.type;
    }
}
DbDeleteMessageResponse.type = DBEventNames.DB_DELETE_MESSAGE_RESPONSE;
class DbToggleStarResponse extends DbResponseBase {
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbToggleStarResponse.type;
    }
}
DbToggleStarResponse.type = DBEventNames.DB_TOGGLE_STAR_RESPONSE;
class DbCreateSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, newSessionId, error = null) {
        super(originalRequestId, success, { newSessionId }, error);
        this.type = DbCreateSessionResponse.type;
    }
    get newSessionId() { return this.data?.newSessionId; }
}
DbCreateSessionResponse.type = DBEventNames.DB_CREATE_SESSION_RESPONSE;
class DbDeleteSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbDeleteSessionResponse.type;
    }
}
DbDeleteSessionResponse.type = DBEventNames.DB_DELETE_SESSION_RESPONSE;
class DbRenameSessionResponse extends DbResponseBase {
    constructor(originalRequestId, success, updatedSessionData, error = null) {
        super(originalRequestId, success, updatedSessionData, error);
        this.type = DbRenameSessionResponse.type;
    }
}
DbRenameSessionResponse.type = DBEventNames.DB_RENAME_SESSION_RESPONSE;
class DbGetAllSessionsResponse extends DbResponseBase {
    constructor(requestId, success, sessions = null, error = null) {
        super(requestId, success, sessions, error); // sessions are directly in 'data'
        this.type = DbGetAllSessionsResponse.type;
    }
}
DbGetAllSessionsResponse.type = DBEventNames.DB_GET_ALL_SESSIONS_RESPONSE;
class DbGetStarredSessionsResponse extends DbResponseBase {
    constructor(requestId, success, starredSessions = null, error = null) {
        super(requestId, success, starredSessions, error); // starredSessions are directly in 'data'
        this.type = DbGetStarredSessionsResponse.type;
    }
}
DbGetStarredSessionsResponse.type = DBEventNames.DB_GET_STARRED_SESSIONS_RESPONSE;
class DbGetReadyStateResponse extends DbResponseBase {
    constructor(originalRequestId, success, readyState, error = null) {
        super(originalRequestId, success, readyState, error);
        this.type = DbGetReadyStateResponse.type;
    }
}
DbGetReadyStateResponse.type = DBEventNames.DB_GET_READY_STATE_RESPONSE;
class DbGetSessionRequest extends DbEventBase {
    constructor(sessionId) {
        super();
        this.type = DbGetSessionRequest.type;
        this.payload = { sessionId };
    }
}
DbGetSessionRequest.type = DBEventNames.DB_GET_SESSION_REQUEST;
class DbAddMessageRequest extends DbEventBase {
    constructor(sessionId, messageObject) {
        super();
        this.type = DbAddMessageRequest.type;
        this.payload = { sessionId, messageObject };
    }
}
DbAddMessageRequest.type = DBEventNames.DB_ADD_MESSAGE_REQUEST;
class DbUpdateMessageRequest extends DbEventBase {
    constructor(sessionId, messageId, updates) {
        super();
        this.type = DbUpdateMessageRequest.type;
        this.payload = { sessionId, messageId, updates };
    }
}
DbUpdateMessageRequest.type = DBEventNames.DB_UPDATE_MESSAGE_REQUEST;
class DbUpdateStatusRequest extends DbEventBase {
    constructor(sessionId, status) {
        super();
        this.type = DbUpdateStatusRequest.type;
        this.payload = { sessionId, status };
    }
}
DbUpdateStatusRequest.type = DBEventNames.DB_UPDATE_STATUS_REQUEST;
class DbDeleteMessageRequest extends DbEventBase {
    constructor(sessionId, messageId) {
        super();
        this.type = DbDeleteMessageRequest.type;
        this.payload = { sessionId, messageId };
    }
}
DbDeleteMessageRequest.type = DBEventNames.DB_DELETE_MESSAGE_REQUEST;
class DbToggleStarRequest extends DbEventBase {
    constructor(sessionId) {
        super();
        this.type = DbToggleStarRequest.type;
        this.payload = { sessionId };
    }
}
DbToggleStarRequest.type = DBEventNames.DB_TOGGLE_STAR_REQUEST;
class DbCreateSessionRequest extends DbEventBase {
    constructor(initialMessage) {
        super();
        this.type = DbCreateSessionRequest.type;
        this.payload = { initialMessage };
    }
}
DbCreateSessionRequest.type = DBEventNames.DB_CREATE_SESSION_REQUEST;
class DbInitializeRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbInitializeRequest.type;
        this.payload = {};
    }
}
DbInitializeRequest.type = DBEventNames.DB_INITIALIZE_REQUEST;
class DbDeleteSessionRequest extends DbEventBase {
    constructor(sessionId) {
        super();
        this.type = DbDeleteSessionRequest.type;
        this.payload = { sessionId };
    }
}
DbDeleteSessionRequest.type = DBEventNames.DB_DELETE_SESSION_REQUEST;
class DbRenameSessionRequest extends DbEventBase {
    constructor(sessionId, newName) {
        super();
        this.type = DbRenameSessionRequest.type;
        this.payload = { sessionId, newName };
    }
}
DbRenameSessionRequest.type = DBEventNames.DB_RENAME_SESSION_REQUEST;
class DbGetAllSessionsRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbGetAllSessionsRequest.type;
    }
}
DbGetAllSessionsRequest.type = DBEventNames.DB_GET_ALL_SESSIONS_REQUEST;
class DbGetStarredSessionsRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbGetStarredSessionsRequest.type;
    }
}
DbGetStarredSessionsRequest.type = DBEventNames.DB_GET_STARRED_SESSIONS_REQUEST;
class DbGetReadyStateRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbGetReadyStateRequest.type;
    }
}
DbGetReadyStateRequest.type = DBEventNames.DB_GET_READY_STATE_REQUEST;
class DbMessagesUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, messages) {
        super(sessionId);
        this.type = DbMessagesUpdatedNotification.type;
        this.payload = { messages };
    }
}
DbMessagesUpdatedNotification.type = DBEventNames.DB_MESSAGES_UPDATED_NOTIFICATION;
class DbStatusUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, status) {
        super(sessionId);
        this.type = DbStatusUpdatedNotification.type;
        this.payload = { status };
    }
}
DbStatusUpdatedNotification.type = DBEventNames.DB_STATUS_UPDATED_NOTIFICATION;
class DbSessionUpdatedNotification extends DbNotificationBase {
    constructor(sessionId, updatedSessionData, updateType = 'update') {
        super(sessionId);
        this.type = DbSessionUpdatedNotification.type;
        this.payload = { session: updatedSessionData, updateType };
    }
}
DbSessionUpdatedNotification.type = DBEventNames.DB_SESSION_UPDATED_NOTIFICATION;
class DbInitializationCompleteNotification {
    constructor({ success, error = null, dbStatus = null, sessionIds = null }) {
        this.type = DbInitializationCompleteNotification.type;
        this.timestamp = Date.now();
        this.payload = { success, error: error ? (typeof error === 'string' ? error : (error.message || String(error))) : null, dbStatus, sessionIds };
    }
}
DbInitializationCompleteNotification.type = DBEventNames.DB_INITIALIZATION_COMPLETE_NOTIFICATION;
class DbGetLogsResponse extends DbResponseBase {
    constructor(originalRequestId, success, logs, error = null) {
        super(originalRequestId, success, logs, error);
        this.type = DbGetLogsResponse.type;
    }
}
DbGetLogsResponse.type = DBEventNames.DB_GET_LOGS_RESPONSE;
class DbGetUniqueLogValuesResponse extends DbResponseBase {
    constructor(originalRequestId, success, values, error = null) {
        super(originalRequestId, success, values, error);
        this.type = DbGetUniqueLogValuesResponse.type;
    }
}
DbGetUniqueLogValuesResponse.type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_RESPONSE;
class DbClearLogsResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = { deletedCount: 0 }, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbClearLogsResponse.type;
    }
}
DbClearLogsResponse.type = DBEventNames.DB_CLEAR_LOGS_RESPONSE;
class DbGetCurrentAndLastLogSessionIdsResponse extends DbResponseBase {
    constructor(originalRequestId, success, ids, error = null) {
        super(originalRequestId, success, ids, error);
        this.type = DbGetCurrentAndLastLogSessionIdsResponse.type;
    }
}
DbGetCurrentAndLastLogSessionIdsResponse.type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_RESPONSE;
class DbAddLogRequest extends DbEventBase {
    constructor(logEntryData) {
        super();
        this.type = DbAddLogRequest.type;
        this.payload = { logEntryData };
    }
}
DbAddLogRequest.type = DBEventNames.DB_ADD_LOG_REQUEST;
class DbAddLogResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbAddLogResponse.type;
    }
}
DbAddLogResponse.type = DBEventNames.DB_ADD_LOG_RESPONSE;
class DbGetLogsRequest extends DbEventBase {
    constructor(filters) {
        super();
        this.type = DbGetLogsRequest.type;
        this.payload = { filters };
    }
}
DbGetLogsRequest.type = DBEventNames.DB_GET_LOGS_REQUEST;
class DbGetUniqueLogValuesRequest extends DbEventBase {
    constructor(fieldName) {
        super();
        this.type = DbGetUniqueLogValuesRequest.type;
        this.payload = { fieldName };
    }
}
DbGetUniqueLogValuesRequest.type = DBEventNames.DB_GET_UNIQUE_LOG_VALUES_REQUEST;
class DbClearLogsRequest extends DbEventBase {
    constructor(filter = 'all') {
        super();
        this.type = DbClearLogsRequest.type;
        this.payload = { filter };
    }
}
DbClearLogsRequest.type = DBEventNames.DB_CLEAR_LOGS_REQUEST;
class DbGetCurrentAndLastLogSessionIdsRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbGetCurrentAndLastLogSessionIdsRequest.type;
    }
}
DbGetCurrentAndLastLogSessionIdsRequest.type = DBEventNames.DB_GET_CURRENT_AND_LAST_LOG_SESSION_IDS_REQUEST;
class DbResetDatabaseRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbResetDatabaseRequest.type;
    }
}
DbResetDatabaseRequest.type = DBEventNames.DB_RESET_DATABASE_REQUEST;
class DbResetDatabaseResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = true, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbResetDatabaseResponse.type;
    }
}
DbResetDatabaseResponse.type = DBEventNames.DB_RESET_DATABASE_RESPONSE;
class DbEnsureInitializedRequest extends DbEventBase {
    constructor() {
        super();
        this.type = DbEnsureInitializedRequest.type;
    }
}
DbEnsureInitializedRequest.type = DBEventNames.DB_ENSURE_INITIALIZED_REQUEST;
class DbEnsureInitializedResponse extends DbResponseBase {
    // data can be { success: boolean, dbStatus: object, sessionIds: object } or null on error
    constructor(originalRequestId, success, data = null, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbEnsureInitializedResponse.type;
    }
}
DbEnsureInitializedResponse.type = DBEventNames.DB_ENSURE_INITIALIZED_RESPONSE;
class DbInitWorkerRequest extends DbEventBase {
    constructor(payload = {}) {
        super();
        this.type = DbInitWorkerRequest.type;
        this.payload = payload;
    }
}
DbInitWorkerRequest.type = DBEventNames.DB_INIT_WORKER_REQUEST;
// DbInitWorkerResponse already exists in your DBEventNames, assuming a simple success/error response.
class DbInitWorkerResponse extends DbResponseBase {
    constructor(originalRequestId, success, data = null, error = null) {
        super(originalRequestId, success, data, error);
        this.type = DbInitWorkerResponse.type;
    }
}
DbInitWorkerResponse.type = DBEventNames.DB_INIT_WORKER_RESPONSE;
// --- Notification Publishing ---
class DbWorkerCreatedNotification {
    constructor(payload) {
        this.type = DbWorkerCreatedNotification.type;
        this.timestamp = Date.now();
        this.payload = payload;
    }
}
DbWorkerCreatedNotification.type = 'DbWorkerCreatedNotification';


/***/ }),

/***/ "./src/events/eventNames.ts":
/*!**********************************!*\
  !*** ./src/events/eventNames.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Contexts: () => (/* binding */ Contexts),
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
const UIEventNames = Object.freeze({
    QUERY_SUBMITTED: 'querySubmitted',
    BACKGROUND_RESPONSE_RECEIVED: 'background:responseReceived',
    BACKGROUND_ERROR_RECEIVED: 'background:errorReceived',
    BACKGROUND_SCRAPE_STAGE_RESULT: 'background:scrapeStageResult',
    BACKGROUND_SCRAPE_RESULT_RECEIVED: 'background:scrapeResultReceived',
    REQUEST_MODEL_LOAD: 'ui:requestModelLoad',
    WORKER_READY: 'worker:ready',
    WORKER_ERROR: 'worker:error',
    NAVIGATION_PAGE_CHANGED: 'navigation:pageChanged',
    SCRAPE_PAGE: 'SCRAPE_PAGE',
    SCRAPE_ACTIVE_TAB: 'SCRAPE_ACTIVE_TAB',
    DYNAMIC_SCRIPT_MESSAGE_TYPE: 'offscreenIframeResult',
    MODEL_WORKER_LOADING_PROGRESS: 'modelWorkerLoadingProgress', // For when the worker itself is loading the model (pipeline init)
    MODEL_SELECTION_CHANGED: 'ui:modelSelectionChanged', // When model or ONNX variant dropdown changes
    REQUEST_MODEL_DOWNLOAD_ACTION: 'ui:requestModelDownloadAction', // When user clicks "Download Model" button
    REQUEST_MODEL_EXECUTION: 'ui:requestModelExecution', // When user clicks "Load Model" button (to load into worker)
    WORKER_STATE_CHANGED: 'worker:stateChanged', // Generic event for worker state updates (ready, error, etc.)
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
    UNINITIALIZED: 'uninitialized',
    CREATING_WORKER: 'creating_worker',
    LOADING_MODEL: 'loading_model',
    MODEL_READY: 'model_ready',
    GENERATING: 'generating',
    IDLE: 'idle',
    WORKER_ENV_READY: 'workerEnvReady',
    INIT: 'init',
    GENERATE: 'generate',
    RESET: 'reset',
    SET_BASE_URL: 'setBaseUrl',
    SET_ENV_CONFIG: 'setEnvConfig',
    MANIFEST_UPDATED: 'manifestUpdated',
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
/*!***************************!*\
  !*** ./src/background.ts ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./DB/dbEvents */ "./src/DB/dbEvents.ts");



const CONTEXT_PREFIX = '[Background]';
let detachedPopups = {}; // TabId to Popup WindowId
let popupIdToTabId = {}; // Popup WindowId to Original TabId
const DNR_RULE_ID_1 = 1;
const DNR_RULE_PRIORITY_1 = 1;
let currentLogSessionId = null;
let previousLogSessionId = null;
async function initializeSessionIds() {
    let { currentLogSessionId: storedCurrentId, previousLogSessionId: storedPreviousId } = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
    if (storedCurrentId) {
        currentLogSessionId = storedCurrentId;
        previousLogSessionId = storedPreviousId || null;
    }
    else {
        currentLogSessionId = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ currentLogSessionId: currentLogSessionId });
        if (storedPreviousId) {
            previousLogSessionId = storedPreviousId;
        }
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ previousLogSessionId: currentLogSessionId });
    }
    console.log(CONTEXT_PREFIX + ' Current log session ID:', currentLogSessionId);
    console.log(CONTEXT_PREFIX + ' Previous log session ID:', previousLogSessionId);
}
async function updateDeclarativeNetRequestRules() {
    try {
        const currentRules = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().declarativeNetRequest.getDynamicRules();
        const rulesToRemove = currentRules.filter((rule) => rule.id === DNR_RULE_ID_1).map((rule) => rule.id);
        const rulesToAdd = [
            {
                id: DNR_RULE_ID_1,
                priority: DNR_RULE_PRIORITY_1,
                action: {
                    type: 'modifyHeaders',
                    responseHeaders: [
                        { header: 'x-frame-options', operation: 'remove' },
                        { header: 'X-Frame-Options', operation: 'remove' },
                        { header: 'content-security-policy', operation: 'remove' },
                        { header: 'Content-Security-Policy', operation: 'remove' }
                    ]
                },
                condition: {
                    resourceTypes: ['main_frame'],
                    urlFilter: '|http*://*/*|'
                }
            }
        ];
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().declarativeNetRequest.updateDynamicRules({
            removeRuleIds: rulesToRemove,
            addRules: rulesToAdd
        });
        console.log(CONTEXT_PREFIX + ' Declarative Net Request rules updated successfully.');
    }
    catch (error) {
        console.error("Error updating Declarative Net Request rules:", error);
    }
}
async function scrapeUrlWithTempTabExecuteScript(url, chatId, messageId) {
    console.log(CONTEXT_PREFIX + ' [BG-Scrape] Temp Tab + executeScript: ' + url);
    let tempTabId = null;
    const TEMP_TAB_LOAD_TIMEOUT = 30000;
    return new Promise((resolve, reject) => {
        (async () => {
            const cleanupAndReject = (errorMsg, errorObj = null) => {
                const finalError = errorObj ? errorObj : new Error(errorMsg);
                console.warn(CONTEXT_PREFIX + `[BG-Scrape] Cleanup & Reject: ${errorMsg}`, errorObj);
                if (tempTabId !== null) {
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.remove(tempTabId).catch((err) => console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId}: ${err.message}`));
                    tempTabId = null;
                }
                reject(finalError);
            };
            try {
                const tab = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.create({ url: url, active: false });
                tempTabId = tab.id;
                if (!tempTabId) {
                    cleanupAndReject('[BG-Scrape] Failed to get temporary tab ID.');
                    return;
                }
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] Created temp tab ' + tempTabId + '.');
                let loadTimeoutId = null;
                const loadPromise = new Promise((resolveLoad, rejectLoad) => {
                    const listener = (tabIdUpdated, changeInfo) => {
                        if (tabIdUpdated === tempTabId && changeInfo.status === 'complete') {
                            console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tab ' + tempTabId + ' loaded.');
                            if (loadTimeoutId)
                                clearTimeout(loadTimeoutId);
                            webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.onUpdated.removeListener(listener);
                            resolveLoad();
                        }
                    };
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.onUpdated.addListener(listener);
                    loadTimeoutId = setTimeout(() => {
                        webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.onUpdated.removeListener(listener);
                        rejectLoad(new Error(`Timeout (${TEMP_TAB_LOAD_TIMEOUT / 1000}s) waiting for page load in tab ${tempTabId}.`));
                    }, TEMP_TAB_LOAD_TIMEOUT);
                });
                await loadPromise;
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] Injecting pageExtractor.js into tab ' + tempTabId + '...');
                await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().scripting.executeScript({
                    target: { tabId: tempTabId },
                    files: ['pageExtractor.js']
                });
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] pageExtractor.js INJECTED into tab ' + tempTabId + '.');
                const injectionResults = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().scripting.executeScript({
                    target: { tabId: tempTabId },
                    func: () => {
                        if (window.TabAgentPageExtractor && typeof window.TabAgentPageExtractor.extract === 'function') {
                            try {
                                return window.TabAgentPageExtractor.extract(document);
                            }
                            catch (e) {
                                const errMsg = e instanceof Error ? e.message : String(e);
                                const errStack = e instanceof Error ? e.stack : '';
                                return { error: `Error in PageExtractor.extract: ${errMsg} (Stack: ${errStack})` };
                            }
                        }
                        else {
                            return { error: 'TabAgentPageExtractor.extract function not found on window.' };
                        }
                    }
                });
                if (!injectionResults || injectionResults.length === 0 || !injectionResults[0].result) {
                    cleanupAndReject('[BG-Scrape] No result from executeScript.', injectionResults?.[0]?.error);
                    return;
                }
                const scriptResult = injectionResults[0].result;
                console.log('[BG-Scrape] Extracted scriptResult:', scriptResult);
                if (scriptResult?.error) {
                    cleanupAndReject(`[BG-Scrape] Script error: ${scriptResult.error}`, scriptResult);
                    return;
                }
                // Update the placeholder message in the DB via forwardToSidePanel
                if (typeof forwardToSidePanel === 'function' && chatId && messageId) {
                    // Add __type marker to the extraction object
                    const extractionWithType = { ...scriptResult, __type: "PageExtractor" };
                    const updateMsg = {
                        type: _DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__.DBEventNames.DB_UPDATE_MESSAGE_REQUEST,
                        payload: {
                            sessionId: chatId,
                            messageId: messageId,
                            updates: {
                                text: "```json\n" + JSON.stringify(scriptResult, null, 2) + "\n```",
                                content: "```json\n" + JSON.stringify(scriptResult, null, 2) + "\n```",
                                extraction: extractionWithType,
                                type: "code",
                                metadata: JSON.stringify({
                                    language: "json",
                                    isJson: true,
                                    extractionType: "PageExtractor",
                                    extraction: extractionWithType
                                })
                            }
                        }
                    };
                    forwardToSidePanel(updateMsg);
                }
                resolve(scriptResult);
            }
            catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                cleanupAndReject(`[BG-Scrape] Error: ${errMsg}`, error);
            }
            finally {
                if (tempTabId !== null) {
                    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.remove(tempTabId).catch((err) => console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error removing tab ${tempTabId} in finally: ${err.message}`));
                }
            }
        })();
    });
}
async function scrapeUrlMultiStage(url, chatId, messageId) {
    console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Starting for ' + url + '. ChatID: ' + chatId + ', MessageID: ' + messageId);
    const sendStageResult = (stageResult) => {
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Sending WORKER_SCRAPE_STAGE_RESULT Stage ' + stageResult.stage + ', Success: ' + stageResult.success);
        webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({ type: _events_eventNames__WEBPACK_IMPORTED_MODULE_1__.RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT, payload: stageResult })
            .catch((e) => console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Failed to send result Stage ${stageResult.stage}:`, e));
    };
    try {
        const executeScriptResult = await scrapeUrlWithTempTabExecuteScript(url, chatId, messageId);
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Stage 1 Succeeded for ' + url + '.');
        sendStageResult({ stage: 1, success: true, chatId, messageId, method: 'tempTabExecuteScript', url, length: executeScriptResult?.text?.length || 0, ...executeScriptResult });
    }
    catch (stage1Error) {
        const errMsg = stage1Error instanceof Error ? stage1Error.message : String(stage1Error);
        console.warn(CONTEXT_PREFIX + `[BG-ScrapeOrch] Stage 1 Failed for ${url}: ${errMsg}`);
        sendStageResult({ stage: 1, success: false, chatId, messageId, method: 'tempTabExecuteScript', error: errMsg });
    }
    finally {
        console.log(CONTEXT_PREFIX + ' [BG-ScrapeOrch] Finished for ' + url + '.');
    }
}
async function getDriveToken() {
    return new Promise((resolve, reject) => {
        webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().identity.getAuthToken({ interactive: true }, (token) => {
            if ((webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime).lastError)
                reject(new Error((webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime).lastError.message));
            else
                resolve(token);
        });
    });
}
async function fetchDriveFileList(token, folderId = 'root') {
    const fields = "files(id, name, mimeType, iconLink, webViewLink, size, createdTime, modifiedTime)";
    const query = `'${folderId}' in parents and trashed=false`;
    const url = `https://www.googleapis.com/drive/v3/files?${new URLSearchParams({ pageSize: '100', q: query, fields, orderBy: 'folder,modifiedTime desc' })}`;
    console.log(CONTEXT_PREFIX + ' [BG-Drive] Fetching list for folder ' + folderId);
    const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } });
    if (!response.ok) {
        const errorData = await response.text();
        console.error(CONTEXT_PREFIX + `[BG-Drive] API error (Folder: ${folderId}):`, response.status, errorData);
        throw new Error(`Drive API Error ${response.status} (Folder: ${folderId}): ${errorData || response.statusText}`);
    }
    const data = await response.json();
    console.log(CONTEXT_PREFIX + ' [BG-Drive] API success (Folder: ' + folderId + '). Found ' + (data.files?.length || 0) + ' items.');
    return data.files || [];
}
async function forwardToSidePanel(message) {
    console.log(CONTEXT_PREFIX + ' Attempting to forward message type: ' + message?.type + ' to active side panel.');
    try {
        // This relies on sidepanel.js having an active onMessage listener.
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage(message);
        console.log(CONTEXT_PREFIX + ' Message type: ' + message?.type + ' forwarded (presumed to side panel).');
        return { success: true };
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(CONTEXT_PREFIX + ` Error forwarding message type '${message?.type}' to side panel:`, errMsg);
        return { success: false, error: `Side panel not available or error: ${errMsg}` };
    }
}
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onInstalled.addListener(async (details) => {
    console.log(CONTEXT_PREFIX + ' onInstalled. Reason:', details.reason);
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Error setting side panel behavior:', error));
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(null).then((items) => {
        const keysToRemove = Object.keys(items).filter((key) => key.startsWith('detachedState_'));
        if (keysToRemove.length > 0)
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.remove(keysToRemove);
    });
});
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onStartup.addListener(async () => {
    console.log(CONTEXT_PREFIX + ' onStartup event.');
    await initializeSessionIds();
});
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().action.onClicked.addListener(async (tab) => {
    console.log(CONTEXT_PREFIX + ' Action clicked for tab ' + (tab.id || 'N/A'));
});
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().windows.onRemoved.addListener(async (windowId) => {
    console.log(CONTEXT_PREFIX + ' Window removed: ' + windowId);
    const tabId = popupIdToTabId[windowId];
    if (tabId) {
        console.log(CONTEXT_PREFIX + ' Popup window ' + windowId + ' for tab ' + tabId + ' was closed.');
        delete detachedPopups[tabId];
        delete popupIdToTabId[windowId];
        try {
            await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.remove(`detachedState_${tabId}`);
        }
        catch (error) {
            console.error(`Error cleaning storage for tab ${tabId} on popup close:`, error);
        }
    }
});
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(CONTEXT_PREFIX + ` Received message type: '${message?.type}' from: ${sender.id}`, message);
    if (!message || !message.type) {
        console.warn(CONTEXT_PREFIX + ' Received message without type:', message, 'From:', sender.id);
        return false;
    }
    const { type, payload } = message;
    let isResponseAsync = false;
    if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_1__.RuntimeMessageTypes.SCRAPE_REQUEST) {
        isResponseAsync = true;
        (async () => {
            try {
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] SCRAPE_REQUEST received. Payload:', payload);
                // Check if the URL is already open in any tab
                const tabs = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.query({ url: payload?.url });
                console.log(CONTEXT_PREFIX + ' [BG-Scrape] Tabs found for URL', payload?.url, ':', tabs);
                if (tabs && tabs.length > 0) {
                    // Use the first matching tab
                    const tabId = tabs[0].id;
                    console.log(CONTEXT_PREFIX + ' [BG-Scrape] Found open tab (' + tabId + ') for URL: ' + payload?.url + '. Sending SCRAPE_PAGE to content script.');
                    try {
                        const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().tabs.sendMessage(tabId, { type: _events_eventNames__WEBPACK_IMPORTED_MODULE_1__.UIEventNames.SCRAPE_PAGE });
                        console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape response:', response);
                        if (response && response.success) {
                            console.log(CONTEXT_PREFIX + ' [BG-Scrape] Content script scrape succeeded for tab ' + tabId + '.');
                            webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
                                type: _events_eventNames__WEBPACK_IMPORTED_MODULE_1__.RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT,
                                payload: { stage: 1, success: true, chatId: payload?.chatId, messageId: payload?.messageId, method: 'contentScript', url: payload?.url, length: response?.text?.length || 0, ...response }
                            });
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (content script) started.` });
                        }
                        else {
                            console.warn(CONTEXT_PREFIX + `[BG-Scrape] Content script scrape failed or returned error for tab ${tabId}. Falling back to temp tab scrape.`);
                            // Fallback to temp tab scrape
                            await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                            sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                        }
                    }
                    catch (err) {
                        console.warn(CONTEXT_PREFIX + `[BG-Scrape] Error sending SCRAPE_PAGE to content script in tab ${tabId}:`, err);
                        // Fallback to temp tab scrape
                        await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                        sendResponse({ success: true, message: `Scraping for ${payload?.url} (fallback temp tab) started.` });
                    }
                }
                else {
                    console.log(CONTEXT_PREFIX + ' [BG-Scrape] No open tab found for URL:', payload?.url, '. Using temp tab scrape.');
                    // No open tab, use temp tab scrape
                    await scrapeUrlMultiStage(payload?.url, payload?.chatId, payload?.messageId);
                    sendResponse({ success: true, message: `Scraping for ${payload?.url} (temp tab) started.` });
                }
            }
            catch (error) {
                console.error(CONTEXT_PREFIX + ' [BG-Scrape] Error in SCRAPE_REQUEST handler:', error);
                const errMsg = error instanceof Error ? error.message : String(error);
                sendResponse({ success: false, error: errMsg });
            }
        })();
        return isResponseAsync;
    }
    if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_1__.RuntimeMessageTypes.GET_DRIVE_FILE_LIST) {
        isResponseAsync = true;
        (async () => {
            try {
                const token = await getDriveToken();
                const files = await fetchDriveFileList(token, message.folderId);
                sendResponse({ success: true, files: files, folderId: message.folderId });
            }
            catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                sendResponse({ success: false, error: errMsg, folderId: message.folderId });
            }
        })();
        return isResponseAsync;
    }
    if (type === 'popupCreated') {
        const { tabId, popupId } = payload;
        detachedPopups[tabId] = popupId;
        popupIdToTabId[popupId] = tabId;
        console.log(CONTEXT_PREFIX + ' Popup ' + popupId + ' registered for tab ' + tabId + '.');
        sendResponse({ success: true });
        return false;
    }
    if (type === 'getPopupForTab') {
        const existingPopupId = detachedPopups[payload.tabId];
        sendResponse({ popupId: existingPopupId || null });
        return false;
    }
    if (Object.values(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__.DBEventNames).includes(type)) {
        return false;
    }
    if (!Object.values(_events_eventNames__WEBPACK_IMPORTED_MODULE_1__.ModelLoaderMessageTypes).includes(type) &&
        !Object.values(_events_eventNames__WEBPACK_IMPORTED_MODULE_1__.WorkerEventNames).includes(type) &&
        !Object.values(_events_eventNames__WEBPACK_IMPORTED_MODULE_1__.RuntimeMessageTypes).includes(type) &&
        !Object.values(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__.DBEventNames).includes(type) &&
        type !== 'popupCreated' && type !== 'getPopupForTab') {
        return false;
    }
    return false;
});
(async () => {
    await initializeSessionIds();
    await updateDeclarativeNetRequestRules();
    console.log(CONTEXT_PREFIX + ' Initialized.');
})();

})();

/******/ })()
;
//# sourceMappingURL=background.js.map