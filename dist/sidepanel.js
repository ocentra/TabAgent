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

/***/ "./src/Components/HistoryItem.ts":
/*!***************************************!*\
  !*** ./src/Components/HistoryItem.ts ***!
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
    if (!historyItemElement)
        return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');
    if (!previewSpan || !renameInput)
        return;
    historyItemElement.classList.add('is-editing');
    previewSpan.style.display = 'none';
    renameInput.style.display = 'block';
    renameInput.value = previewSpan.textContent || '';
    renameInput.focus();
    renameInput.select();
}
function cancelEditing(historyItemElement) {
    if (!historyItemElement)
        return;
    const previewSpan = historyItemElement.querySelector('.history-item-preview');
    const renameInput = historyItemElement.querySelector('.history-item-rename-input');
    if (!previewSpan || !renameInput)
        return;
    renameInput.style.display = 'none';
    previewSpan.style.display = 'block';
    historyItemElement.classList.remove('is-editing');
    // No need to reset value here as it wasn't submitted
}
// --- Main Component Rendering Function ---
function renderHistoryItemComponent(props) {
    const { entry, onStarClick = () => { }, onDownloadClick = () => { }, onDeleteClick = () => { }, onLoadClick = () => { }, onRenameSubmit = () => { }, onShareClick = () => { }, onPreviewClick = () => { } } = props;
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
            }
            else {
                // If title is empty or unchanged, just cancel
                cancelEditing(item);
            }
        });
        // Use a wrapper to ensure correct event type for keydown
        renameInput.addEventListener('keydown', function (event) {
            const keyboardEvent = event;
            if (keyboardEvent.key === 'Enter') {
                keyboardEvent.preventDefault();
                const newTitle = renameInput.value.trim();
                const originalTitle = previewSpan.textContent;
                if (newTitle && newTitle !== originalTitle) {
                    onRenameSubmit(entry.id, newTitle); // Call parent's submit handler
                }
                else {
                    // If title is empty or unchanged, just cancel
                    cancelEditing(item);
                }
            }
            else if (keyboardEvent.key === 'Escape') {
                keyboardEvent.preventDefault();
                cancelEditing(item); // Cancel editing on Escape
            }
        });
    }
    // Action Button Listeners
    const starButton = item.querySelector('[data-action="toggle-star"]');
    if (starButton)
        starButton.addEventListener('click', (e) => { e.stopPropagation(); onStarClick(entry.id); });
    const downloadButton = item.querySelector('[data-action="download-chat"]');
    if (downloadButton)
        downloadButton.addEventListener('click', (e) => { e.stopPropagation(); onDownloadClick(entry.id); });
    const shareButton = item.querySelector('[data-action="share-chat"]');
    if (shareButton)
        shareButton.addEventListener('click', (e) => { e.stopPropagation(); onShareClick(entry.id); });
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
            }
            else {
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
                        if (otherPreviewBtn)
                            otherPreviewBtn.innerHTML = previewIconSvg; // Restore icon
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
    if (loadButton)
        loadButton.addEventListener('click', (e) => { e.stopPropagation(); onLoadClick(entry.id); });
    // Optional: Add listener to card body for loading if desired
    // const cardBody = item.querySelector('.card-body');
    // if (cardBody) cardBody.addEventListener('click', (e) => { e.stopPropagation(); onLoadClick(entry.id); });
    return item;
}


/***/ }),

/***/ "./src/Controllers/DiscoverController.ts":
/*!***********************************************!*\
  !*** ./src/Controllers/DiscoverController.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeDiscoverController: () => (/* binding */ initializeDiscoverController)
/* harmony export */ });
// src/Controllers/DiscoverController.js
let isInitialized = false;
function initializeDiscoverController( /* Pass necessary elements or functions if needed */) {
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

/***/ "./src/Controllers/DriveController.ts":
/*!********************************************!*\
  !*** ./src/Controllers/DriveController.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeDriveController: () => (/* binding */ initializeDriveController)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _notifications__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../notifications */ "./src/notifications.ts");
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");



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
let showNotificationDep = _notifications__WEBPACK_IMPORTED_MODULE_1__.showNotification;
let debounceDep = null;
function showDriveViewerModal() {
    console.log("Attempting to show Drive modal...");
    if (isDriveOpen)
        return;
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
    if (driveViewerSearch)
        driveViewerSearch.value = '';
    updateInsertButtonState();
    renderSelectedFiles();
    console.log("Fetching root content and making modal visible.");
    fetchAndDisplayViewerFolderContent('root');
    driveViewerModal.classList.remove('hidden');
    isDriveOpen = true;
}
function hideDriveViewerModal() {
    if (!isDriveOpen)
        return;
    if (!driveViewerModal)
        return;
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
    if (!driveViewerList)
        return;
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
        }
        else {
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
        if (!driveViewerList)
            return;
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
        type: _events_eventNames__WEBPACK_IMPORTED_MODULE_2__.RuntimeMessageTypes.GET_DRIVE_FILE_LIST,
        folderId: folderId
    })
        .then((response) => {
        isFetchingDriveList = false;
        if (response && response.success && response.files) {
            console.log(`[DriveController] Success! Caching and rendering ${response.files.length} files.`);
            driveFilesCache[folderId] = response.files;
            renderDriveViewerItems(response.files);
        }
        else {
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
        if (driveViewerList)
            driveViewerList.innerHTML = `<div class="text-center text-red-500 p-4">Error sending request.</div>`;
    });
}
function handleDriveItemClick(event) {
    event.stopPropagation();
    const itemElement = event.currentTarget;
    const itemId = (itemElement.dataset.id || '');
    const itemName = (itemElement.dataset.name || '');
    const mimeType = (itemElement.dataset.mimeType || '');
    const iconLink = (itemElement.dataset.iconLink || '');
    if (!itemId || !mimeType) {
        console.error("DriveController: Clicked Drive item missing ID or mimeType.");
        return;
    }
    if (mimeType === GOOGLE_FOLDER_MIME_TYPE) {
        console.log(`DriveController: Navigating into folder: ${itemName} (${itemId})`);
        currentFolderId = itemId;
        currentFolderPath.push({ id: itemId, name: itemName });
        driveSearchTerm = '';
        if (driveViewerSearch)
            driveViewerSearch.value = '';
        fetchAndDisplayViewerFolderContent(itemId);
    }
    else {
        console.log(`DriveController: Toggling selection for file: ${itemName} (${itemId})`);
        toggleFileSelection(itemId, itemElement, { id: itemId, name: itemName, mimeType: mimeType, iconLink: iconLink });
    }
}
function updateBreadcrumbs() {
    if (!driveViewerBreadcrumbsContainer)
        return;
    driveViewerBreadcrumbsContainer.innerHTML = '';
    currentFolderPath.forEach((folder, index) => {
        const crumbElement = document.createElement(index === currentFolderPath.length - 1 ? 'span' : 'button');
        crumbElement.textContent = folder.name;
        crumbElement.dataset.id = folder.id;
        crumbElement.dataset.index = String(index);
        if (index < currentFolderPath.length - 1) {
            crumbElement.className = 'text-blue-600 hover:underline dark:text-blue-400 cursor-pointer';
            crumbElement.addEventListener('click', handleBreadcrumbClick);
            const separator = document.createElement('span');
            separator.textContent = ' / ';
            separator.className = 'mx-1 text-gray-400';
            if (driveViewerBreadcrumbsContainer)
                driveViewerBreadcrumbsContainer.appendChild(crumbElement);
            if (driveViewerBreadcrumbsContainer)
                driveViewerBreadcrumbsContainer.appendChild(separator);
        }
        else {
            crumbElement.className = 'font-semibold';
            if (driveViewerBreadcrumbsContainer)
                driveViewerBreadcrumbsContainer.appendChild(crumbElement);
        }
    });
}
function handleBreadcrumbClick(event) {
    const targetIndex = parseInt(event.currentTarget.dataset.index || '', 10);
    const targetFolderId = event.currentTarget.dataset.id || '';
    if (isNaN(targetIndex) || !targetFolderId) {
        console.error("DriveController: Invalid breadcrumb data.");
        return;
    }
    if (targetFolderId === currentFolderId)
        return;
    console.log(`DriveController: Breadcrumb click - Navigating to index ${targetIndex} (${targetFolderId})`);
    currentFolderPath = currentFolderPath.slice(0, Number(targetIndex) + 1);
    currentFolderId = targetFolderId;
    driveSearchTerm = '';
    if (driveViewerSearch)
        driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(targetFolderId);
}
function toggleFileSelection(fileId, element, fileData) {
    if (selectedDriveFiles[fileId]) {
        delete selectedDriveFiles[fileId];
        element?.classList.remove('selected');
    }
    else {
        selectedDriveFiles[fileId] = fileData;
        element?.classList.add('selected');
    }
    renderSelectedFiles();
    updateInsertButtonState();
}
function renderSelectedFiles() {
    if (!driveViewerSelectedArea)
        return;
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
    }
    else {
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
        if (!driveViewerList)
            return;
        const listItem = driveViewerList.querySelector(`.drive-viewer-item[data-id="${fileId}"]`);
        if (listItem)
            listItem.classList.remove('selected');
    }
}
function updateInsertButtonState() {
    if (!driveViewerInsert)
        return;
    const count = Object.keys(selectedDriveFiles).length;
    driveViewerInsert.disabled = count === 0;
    driveViewerInsert.textContent = `Insert (${count})`;
}
function handleDriveSearchInput(event) {
    driveSearchTerm = event.target.value.trim();
    console.log(`DriveController: Filtering Drive items by term: "${driveSearchTerm}"`);
    if (driveFilesCache[currentFolderId]) {
        renderDriveViewerItems(driveFilesCache[currentFolderId]);
    }
    else {
        if (driveViewerList)
            driveViewerList.innerHTML = `<div class="text-center text-gray-500 dark:text-gray-400 p-4">Folder not loaded or empty.</div>`;
    }
}
function handleDriveBackButtonClick() {
    if (currentFolderPath.length <= 1)
        return;
    const parentFolder = currentFolderPath[currentFolderPath.length - 2];
    currentFolderPath.pop();
    currentFolderId = parentFolder.id;
    console.log(`DriveController: Back button click - Navigating to ${parentFolder.name} (${parentFolder.id})`);
    driveSearchTerm = '';
    if (driveViewerSearch)
        driveViewerSearch.value = '';
    fetchAndDisplayViewerFolderContent(parentFolder.id);
}
function updateHeaderState() {
    if (!driveViewerBack)
        return;
    if (currentFolderPath.length > 1) {
        driveViewerBack.classList.remove('hidden');
    }
    else {
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
    const searchElem = document.getElementById('drive-viewer-search');
    driveViewerSearch = (searchElem instanceof HTMLInputElement) ? searchElem : null;
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
    }
    else if (driveViewerSearch) {
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

/***/ "./src/Controllers/HistoryPopupController.ts":
/*!***************************************************!*\
  !*** ./src/Controllers/HistoryPopupController.ts ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeHistoryPopup: () => (/* binding */ initializeHistoryPopup)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _Components_HistoryItem__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Components/HistoryItem */ "./src/Components/HistoryItem.ts");
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _notifications__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../notifications */ "./src/notifications.ts");
/* harmony import */ var _navigation__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../navigation */ "./src/navigation.ts");
/* harmony import */ var _Utilities_downloadUtils__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../Utilities/downloadUtils */ "./src/Utilities/downloadUtils.ts");
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
    }
    else {
        if (itemIndex !== -1) {
            console.log(`[HistoryPopupController] Updating session ${sessionId} in local list.`);
            currentHistoryItems[itemIndex] = {
                ...currentHistoryItems[itemIndex],
                ...updatedSessionData
            };
            listChanged = true;
        }
        else {
            console.log(`[HistoryPopupController] Adding new/updated session ${sessionId} to local list.`);
            currentHistoryItems.push(updatedSessionData);
            listChanged = true;
        }
    }
    if (listChanged && historyPopupElement && !historyPopupElement.classList.contains('hidden')) {
        console.log(`[HistoryPopupController] Popup visible and list changed, calling renderHistoryList()`);
        renderHistoryList();
    }
    else {
        console.log(`[HistoryPopupController] Popup not visible or list unchanged, skipping renderHistoryList()`);
    }
}
function renderHistoryList() {
    if (!isInitialized || !historyListElement)
        return;
    console.log(`[HistoryPopupController] Rendering history list (Search: "${currentSearchTerm}")...`);
    let filteredItems = currentHistoryItems;
    if (currentSearchTerm) {
        const lowerCaseTerm = currentSearchTerm.toLowerCase();
        filteredItems = currentHistoryItems.filter(entry => (entry.name || '').toLowerCase().includes(lowerCaseTerm));
        console.log(`[HistoryPopupController] Filtered down to ${filteredItems.length} sessions.`);
    }
    else {
        console.log(`[HistoryPopupController] Rendering all ${filteredItems.length} sessions (no search term).`);
    }
    historyListElement.innerHTML = '';
    if (filteredItems.length === 0) {
        const message = currentSearchTerm
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No history items match "${currentSearchTerm}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No chat history yet.</p>';
        historyListElement.innerHTML = message;
    }
    else {
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
            const itemElement = (0,_Components_HistoryItem__WEBPACK_IMPORTED_MODULE_2__.renderHistoryItemComponent)(props);
            if (itemElement && historyListElement) {
                historyListElement.appendChild(itemElement);
            }
        });
    }
    console.log("[HistoryPopupController] History list rendered.");
}
async function showPopup() {
    if (!isInitialized || !historyPopupElement || !requestDbAndWaitFunc)
        return;
    console.log("[Trace][HistoryPopupController] showPopup: Requesting all sessions...");
    try {
        const sessionsArray = await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsRequest());
        console.log("[Trace][HistoryPopupController] showPopup: Received sessionsArray:", sessionsArray);
        if (Array.isArray(sessionsArray) && sessionsArray.length > 0) {
            console.log("[Trace][HistoryPopupController] showPopup: First session item sample:", sessionsArray[0]);
        }
        else if (sessionsArray === null || sessionsArray === undefined) {
            console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is null or undefined.");
        }
        else {
            console.log("[Trace][HistoryPopupController] showPopup: sessionsArray is empty or not an array:", typeof sessionsArray);
        }
        currentHistoryItems = sessionsArray || [];
        console.log(`[Trace][HistoryPopupController] showPopup: Assigned ${currentHistoryItems.length} sessions to currentHistoryItems.`);
        renderHistoryList();
        historyPopupElement.classList.remove('hidden');
    }
    catch (error) {
        console.error("[Trace][HistoryPopupController] showPopup: Error fetching history list:", error);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Failed to load history.", 'error');
        if (historyListElement) {
            historyListElement.innerHTML = '<p class="p-4 text-center text-red-500 dark:text-red-400">Error loading history. Please try again.</p>';
        }
        historyPopupElement.classList.remove('hidden');
    }
}
function hidePopup() {
    if (!isInitialized || !historyPopupElement)
        return;
    console.log("[HistoryPopupController] Hiding popup.");
    historyPopupElement.classList.add('hidden');
}
function handleSearchInput(event) {
    if (!isInitialized)
        return;
    currentSearchTerm = event.target.value.trim();
    renderHistoryList();
}
async function handleLoadClick(sessionId) {
    console.log(`[HistoryPopupController] Load clicked: ${sessionId}`);
    if (!sessionId)
        return;
    try {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ lastSessionId: sessionId });
        (0,_navigation__WEBPACK_IMPORTED_MODULE_5__.navigateTo)('page-home');
        hidePopup();
    }
    catch (error) {
        console.error("[HistoryPopupController] Error setting storage or navigating:", error);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Failed to load chat.", 'error');
    }
}
async function handleStarClick(sessionId) {
    if (!sessionId || !requestDbAndWaitFunc)
        return;
    console.log(`[HistoryPopupController] Star clicked: ${sessionId}`);
    try {
        await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest(sessionId));
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Star toggled", 'success');
    }
    catch (error) {
        const err = error;
        console.error("[HistoryPopupController] Error toggling star:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to toggle star: ${err.message}`, 'error');
    }
}
async function handleDeleteClick(sessionId, itemElement) {
    if (!sessionId || !itemElement || !requestDbAndWaitFunc)
        return;
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
        await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest(sessionId));
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Chat deletion initiated...", 'info');
    }
    catch (error) {
        const err = error;
        console.error("[HistoryPopupController] Error deleting chat:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to delete chat: ${err.message}`, 'error');
        itemElement.classList.remove('is-deleting');
        itemElement.querySelectorAll('button').forEach(btn => btn.disabled = false);
        footer?.querySelector('.deleting-message')?.remove();
        const normalActionsContainer = itemElement.querySelector('[data-normal-container]');
        if (normalActionsContainer)
            normalActionsContainer.classList.remove('hidden');
        const confirmActionsContainer = itemElement.querySelector('[data-confirm-container]');
        if (confirmActionsContainer)
            confirmActionsContainer.classList.add('hidden');
    }
}
async function handleRenameSubmit(sessionId, newName) {
    if (!sessionId || !newName || !requestDbAndWaitFunc)
        return;
    console.log(`[HistoryPopupController] Rename submitted: ${sessionId} to "${newName}"`);
    try {
        await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Rename successful", 'success');
    }
    catch (error) {
        const err = error;
        console.error("[HistoryPopupController] Error submitting rename:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)(`Failed to rename chat: ${err.message}`, 'error');
    }
}
async function handleDownloadClick(sessionId) {
    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils__WEBPACK_IMPORTED_MODULE_6__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, (msg, type) => (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)(msg, type));
    }
    else {
        console.error("[HistoryPopupController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications__WEBPACK_IMPORTED_MODULE_4__.showNotification)("Download failed: Internal setup error.", 'error');
    }
}
function handleShareClick(sessionId) {
    console.log(`[HistoryPopupController] Share clicked: ${sessionId}`);
}
async function handlePreviewClick(sessionId, contentElement) {
    if (!sessionId || !contentElement || !requestDbAndWaitFunc) {
        console.error("[HistoryPopupController] Preview failed: Missing sessionId, contentElement, or requestDbAndWaitFunc.");
        return;
    }
    console.log(`[HistoryPopupController] Handling preview click for: ${sessionId}`);
    contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 italic text-xs">Loading preview...</span>';
    try {
        const sessionData = await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest(sessionId));
        if (!sessionData || !sessionData.messages || sessionData.messages.length === 0) {
            contentElement.innerHTML = '<span class="text-gray-500 dark:text-gray-400 text-xs">No messages in this chat.</span>';
            return;
        }
        const messagesToPreview = sessionData.messages.slice(0, 3);
        const previewHtml = messagesToPreview.map((msg) => {
            const sender = msg.sender === 'user' ? 'You' : (msg.sender === 'ai' ? 'Agent' : 'System');
            const text = (msg.text || '')
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .substring(0, 100) + (msg.text && msg.text.length > 100 ? '...' : '');
            return `<div class="preview-message mb-1 last:mb-0"><span class="font-medium">${sender}:</span><span class="ml-1">${text}</span></div>`;
        }).join('');
        contentElement.innerHTML = previewHtml;
    }
    catch (error) {
        const err = error;
        console.error(`[HistoryPopupController] Error fetching preview for ${sessionId}:`, err);
        contentElement.innerHTML = `<span class="text-red-500 text-xs">Error loading preview: ${err.message}</span>`;
    }
}
document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type, (e) => handleSessionUpdate(e.detail));
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
        if (closeHistoryButtonElement)
            closeHistoryButtonElement.addEventListener('click', hidePopup);
        const debouncedSearchHandler = (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_3__.debounce)(handleSearchInput, 300);
        if (historySearchElement)
            historySearchElement.addEventListener('input', debouncedSearchHandler);
        isInitialized = true;
        console.log("[HistoryPopupController] Initialization successful. History will be rendered when popup is shown.");
        return {
            show: showPopup,
            hide: hidePopup
        };
    }
    catch (error) {
        console.error("[HistoryPopupController] Error during initialization listeners/subscriptions:", error);
        isInitialized = false;
        return null;
    }
}


/***/ }),

/***/ "./src/Controllers/LibraryController.ts":
/*!**********************************************!*\
  !*** ./src/Controllers/LibraryController.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeLibraryController: () => (/* binding */ initializeLibraryController)
/* harmony export */ });
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _Components_HistoryItem__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Components/HistoryItem */ "./src/Components/HistoryItem.ts");
/* harmony import */ var _Utilities_downloadUtils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../Utilities/downloadUtils */ "./src/Utilities/downloadUtils.ts");
/* harmony import */ var _notifications__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../notifications */ "./src/notifications.ts");
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _navigation__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../navigation */ "./src/navigation.ts");
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_7__);






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
    if (!requestDbAndWaitFunc)
        return;
    try {
        await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbToggleStarRequest(sessionId));
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Star toggled", 'success');
    }
    catch (error) {
        const err = error;
        console.error("[LibraryController] Error toggling star:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to toggle star: ${err.message}`, 'error');
    }
}
async function handleDeleteClick(sessionId) {
    console.log(`[LibraryController] Delete clicked: ${sessionId}`);
    if (!requestDbAndWaitFunc)
        return;
    if (confirm('Are you sure you want to delete this chat history item? This cannot be undone.')) {
        try {
            await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbDeleteSessionRequest(sessionId));
            (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Chat deleted", 'success');
        }
        catch (error) {
            const err = error;
            console.error("[LibraryController] Error deleting chat:", err);
            (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to delete chat: ${err.message}`, 'error');
        }
    }
}
async function handleRenameSubmit(sessionId, newName) {
    console.log(`[LibraryController] Rename submitted: ${sessionId} to "${newName}"`);
    if (!requestDbAndWaitFunc)
        return;
    try {
        await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbRenameSessionRequest(sessionId, newName));
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Rename successful", 'success');
    }
    catch (error) {
        const err = error;
        console.error("[LibraryController] Error submitting rename:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)(`Failed to rename chat: ${err.message}`, 'error');
    }
}
async function handleDownloadClick(sessionId) {
    if (requestDbAndWaitFunc) {
        (0,_Utilities_downloadUtils__WEBPACK_IMPORTED_MODULE_2__.initiateChatDownload)(sessionId, requestDbAndWaitFunc, (msg, type) => (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)(msg, type));
    }
    else {
        console.error("[LibraryController] Cannot download: requestDbAndWaitFunc not available.");
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Download failed: Internal setup error.", 'error');
    }
}
async function handleLoadClick(sessionId) {
    console.log(`[LibraryController] Load clicked: ${sessionId}`);
    try {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_7___default().storage.local.set({ lastSessionId: sessionId });
        (0,_navigation__WEBPACK_IMPORTED_MODULE_5__.navigateTo)('page-home');
    }
    catch (error) {
        const err = error;
        console.error("[LibraryController] Error setting storage or navigating:", err);
        (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Failed to load chat.", 'error');
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_7___default().storage.local.remove('lastSessionId');
    }
}
function handleShareClick(sessionId) {
    console.log(`[LibraryController] Share clicked: ${sessionId}`);
    (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Share functionality not yet implemented.", 'info');
}
function handlePreviewClick(sessionId, contentElement) {
    console.log(`[LibraryController] Preview clicked: ${sessionId}`);
    (0,_notifications__WEBPACK_IMPORTED_MODULE_3__.showNotification)("Preview functionality not yet implemented.", 'info');
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
        }
        else {
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
        const responsePayload = await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbGetStarredSessionsRequest());
        currentStarredItems = Array.isArray(responsePayload) ? responsePayload : (responsePayload?.sessions || []);
        console.log(`[LibraryController] Received ${currentStarredItems.length} starred items.`);
        renderLibraryList(currentSearchFilter);
    }
    catch (error) {
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
        }
        else {
            console.log(`[LibraryController] Session ${sessionId} was already starred. Updating data.`);
            currentStarredItems[itemIndex] = {
                ...currentStarredItems[itemIndex],
                name: updatedSessionData.title || currentStarredItems[itemIndex].name,
                lastUpdated: updatedSessionData.timestamp || currentStarredItems[itemIndex].lastUpdated,
                isStarred: true
            };
        }
    }
    else {
        if (itemIndex !== -1) {
            console.log(`[LibraryController] Session ${sessionId} is no longer starred. Removing from list.`);
            currentStarredItems.splice(itemIndex, 1);
        }
        else {
            console.log(`[LibraryController] Session ${sessionId} is not starred and was not in the list.`);
        }
    }
    const libraryPage = document.getElementById('page-library');
    if (libraryPage && !libraryPage.classList.contains('hidden')) {
        console.log("[LibraryController] Library page is active, re-rendering list with filter.");
        currentSearchFilter = librarySearchInput?.value.trim() || '';
        renderLibraryList(currentSearchFilter);
    }
    else {
        console.log("[LibraryController] Library page not active, internal list updated passively.");
    }
}
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_6__.UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handleNavigationChange(e.detail));
function renderLibraryList(filter = '') {
    if (!isInitialized || !starredListElement)
        return;
    console.log(`[LibraryController] Rendering with filter "${filter}"`);
    let itemsToRender = [...currentStarredItems];
    if (filter) {
        const searchTerm = filter.toLowerCase();
        itemsToRender = itemsToRender.filter(entry => (entry.name || '').toLowerCase().includes(searchTerm));
    }
    itemsToRender.sort((a, b) => b.lastUpdated - a.lastUpdated);
    starredListElement.innerHTML = '';
    if (itemsToRender.length === 0) {
        const message = filter
            ? `<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items match "${filter}".</p>`
            : '<p class="p-4 text-center text-gray-500 dark:text-gray-400 italic">No starred items yet.</p>';
        starredListElement.innerHTML = message;
    }
    else {
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
            const itemElement = (0,_Components_HistoryItem__WEBPACK_IMPORTED_MODULE_1__.renderHistoryItemComponent)(props);
            if (itemElement && starredListElement) {
                starredListElement.appendChild(itemElement);
            }
        });
    }
    console.log(`[LibraryController] Rendered ${itemsToRender.length} items.`);
}
const handleSearchInput = (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_4__.debounce)((event) => {
    if (!isInitialized)
        return;
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
    // --- Add event listener for session updates ---
    document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbSessionUpdatedNotification.type, (e) => handleSessionUpdate(e.detail));
    return {};
}


/***/ }),

/***/ "./src/Controllers/SettingsController.ts":
/*!***********************************************!*\
  !*** ./src/Controllers/SettingsController.ts ***!
  \***********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSettingsController: () => (/* binding */ initializeSettingsController)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _sidepanel__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../sidepanel */ "./src/sidepanel.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
// src/Controllers/SettingsController.js



let isInitialized = false;
const updateThemeButtonText = (button) => {
    if (!button)
        return;
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
            }
            else {
                htmlElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                console.log(`[SettingsToggle] Added dark class, set localStorage to dark`);
            }
            updateThemeButtonText(themeToggleButton);
        };
        const placeholderText = settingsPageContainer.querySelector('p');
        if (placeholderText) {
            placeholderText.insertAdjacentElement('afterend', themeToggleButton);
        }
        else {
            settingsPageContainer.appendChild(themeToggleButton);
        }
    }
    else {
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
            const target = event.target;
            valueSpan.textContent = target.value;
        });
        console.log(`[SettingsController] Setup slider ${sliderId} with value display ${valueSpanId}`);
    }
    else {
        if (!slider)
            console.warn(`[SettingsController] Slider element not found: #${sliderId}`);
        if (!valueSpan)
            console.warn(`[SettingsController] Value span element not found: #${valueSpanId}`);
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
            }
            catch (error) {
                console.error('[SettingsController] Error opening log viewer popup:', error);
            }
        });
        console.log('[SettingsController] Added listener to View Logs button.');
        const resetDbButton = document.getElementById('resetDbButton');
        if (resetDbButton) {
            resetDbButton.addEventListener('click', async () => {
                console.log('[SettingsController] Reset DB button clicked.');
                try {
                    const request = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_2__.DbResetDatabaseRequest();
                    const result = await (0,_sidepanel__WEBPACK_IMPORTED_MODULE_1__.sendDbRequestSmart)(request);
                    if (result && result.success) {
                        alert('Database reset successfully!');
                    }
                    else {
                        alert('Database reset failed.');
                    }
                    console.log('[SettingsController] Reset DB result:', result);
                }
                catch (e) {
                    alert('Failed to reset database: ' + (e.message || e));
                    console.error('[SettingsController] Reset DB error:', e);
                }
            });
        }
        console.log('[SettingsController] Added Reset DB button next to View Logs button.');
    }
    else {
        console.warn('[SettingsController] View Logs button (viewLogsButton) not found.');
    }
    isInitialized = true;
    console.log("[SettingsController] Initialized successfully.");
    return {};
}


/***/ }),

/***/ "./src/Controllers/SpacesController.ts":
/*!*********************************************!*\
  !*** ./src/Controllers/SpacesController.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeSpacesController: () => (/* binding */ initializeSpacesController)
/* harmony export */ });
// src/Controllers/SpacesController.js
let isInitialized = false;
function initializeSpacesController( /* Pass necessary elements or functions if needed */) {
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

/***/ "./src/DB/db.ts":
/*!**********************!*\
  !*** ./src/DB/db.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   autoEnsureDbInitialized: () => (/* binding */ autoEnsureDbInitialized),
/* harmony export */   forwardDbRequest: () => (/* binding */ forwardDbRequest),
/* harmony export */   lastDbInitStatus: () => (/* binding */ lastDbInitStatus)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _dbEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
/* harmony import */ var _idbChat__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./idbChat */ "./src/DB/idbChat.ts");
/* harmony import */ var _idbLog__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./idbLog */ "./src/DB/idbLog.ts");
// db.js






const DB_INIT_TIMEOUT = 15000;
let isDbReadyFlag = false;
let currentExtensionSessionId = null;
let previousExtensionSessionId = null;
let dbInitPromise = null;
let isDbInitInProgress = false;
let dbWorker = null;
let dbWorkerReady = false;
let dbWorkerRequestId = 0;
const dbWorkerCallbacks = {};
let lastDbInitStatus = null;
let currentChat = null;
let dbReadyResolve = null;
// Logging flags for manifest batch fetch and general DB operations
const LOG_GENERAL = true;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
function resetDbReadyPromise() {
    dbReadyResolve = () => { };
}
class AppError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
async function withTimeout(promise, ms, errorMessage = `Operation timed out after ${ms}ms`) {
    let timeoutId = undefined;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new AppError('TIMEOUT', errorMessage)), ms);
    });
    try {
        return await Promise.race([promise, timeout]);
    }
    finally {
        if (timeoutId !== undefined)
            clearTimeout(timeoutId);
    }
}
function createDbWorker() {
    if (!dbWorker) {
        const workerUrl = webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.getURL('DB/indexedDBBackendWorker.js');
        console.log('[DB] Creating new DB Worker with URL:', workerUrl);
        let workerCreated = false;
        try {
            dbWorker = new Worker(workerUrl, { type: 'module' });
            workerCreated = true;
        }
        catch (workerErr) {
            console.error('[DB] Failed to create DB Worker:', workerErr);
            dbWorker = null;
            dbWorkerReady = false;
            // Optionally, you could throw or handle this error further here
            return null;
        }
        if (workerCreated) {
            dbWorker.onmessage = (event) => {
                const { requestId, type, result, error, stack } = event.data;
                const { type: evtType, requestId: evtReqId, error: evtError } = event.data || {};
                console.log('[DB] Worker onmessage:', { type: evtType, requestId: evtReqId, error: evtError });
                if (evtType === 'query' && evtReqId && result) {
                    console.log('[DB][TEST] Worker onmessage for requestId:', evtReqId, 'result:', result);
                }
                if (requestId && dbWorkerCallbacks[requestId]) {
                    const callback = dbWorkerCallbacks[requestId];
                    delete dbWorkerCallbacks[requestId];
                    if (error) {
                        let errObj = error;
                        if (typeof error === 'string') {
                            errObj = new Error(error);
                            if (stack)
                                errObj.stack = stack;
                        }
                        else if (error instanceof Object && !(error instanceof Error)) {
                            errObj = new Error(error.message || 'Worker error object');
                            Object.assign(errObj, error);
                            if (stack)
                                errObj.stack = stack;
                        }
                        console.error('[DB] Worker callback.reject:', errObj, 'for requestId:', requestId);
                        callback.reject(errObj);
                    }
                    else {
                        console.log('[DB] Worker callback.resolve:', result, 'for requestId:', requestId);
                        callback.resolve(result);
                    }
                }
                else if (type === 'debug') {
                    console.log(`[DB Worker Debug] ${event.data.message}`);
                }
                else if (type === 'fatal') {
                    console.error(`[DB Worker Fatal] ${event.data.error}`, event.data.stack);
                    Object.values(dbWorkerCallbacks).forEach((cb) => cb.reject(new Error('DB Worker encountered a fatal error')));
                    Object.keys(dbWorkerCallbacks).forEach(key => delete dbWorkerCallbacks[key]);
                }
                else if (type === _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.WORKER_READY) {
                    dbWorkerReady = true;
                    console.log('[DB] DB Worker signaled script ready.');
                }
                else if (requestId) {
                    // This is a normal response to a request, no warning needed.
                }
                else {
                    // Instead of logging the full event.data object, log only key fields for clarity and memory safety
                    const { type: unknownType, requestId: unknownReqId, error: unknownError } = event.data || {};
                    console.warn('[DB] Worker received unknown message type:', unknownType, { requestId: unknownReqId, error: unknownError });
                }
            };
            dbWorker.onerror = (errEvent) => {
                console.error('[DB] Uncaught error in DB Worker:', errEvent.message, errEvent);
                Object.values(dbWorkerCallbacks).forEach((cb) => cb.reject(new Error(`DB Worker crashed: ${errEvent.message || 'Unknown worker error'}`)));
                Object.keys(dbWorkerCallbacks).forEach(key => delete dbWorkerCallbacks[key]);
                dbWorker = null;
                dbWorkerReady = false;
            };
            console.log('[DB] DB Worker created and event handlers attached.');
        }
    }
    else {
        console.log('[DB] Returning existing DB Worker instance.');
    }
    return dbWorker;
}
// Helper to ensure dbWorker is not null
function getDbWorker() {
    if (!dbWorker)
        throw new AppError('WORKER_NOT_INITIALIZED', 'DB Worker is not initialized');
    return dbWorker;
}
function checkDbAndStoreReadiness(result) {
    if (!result || typeof result !== 'object') {
        console.warn('[DB] checkDbAndStoreReadiness received invalid result:', result);
        return { allSuccess: false, failures: ['Invalid result object'] };
    }
    let allSuccess = true;
    const failures = [];
    for (const [dbName, dbStatus] of Object.entries(result)) {
        if (!dbStatus || typeof dbStatus !== 'object' || !('success' in dbStatus) || !dbStatus.success) {
            allSuccess = false;
            failures.push(`${dbName} (DB init: ${dbStatus?.error?.message || 'failed'})`);
        }
        if (dbStatus && typeof dbStatus === 'object' && 'stores' in dbStatus && dbStatus.stores) {
            for (const [storeName, storeStatus] of Object.entries(dbStatus.stores)) {
                if (!storeStatus || typeof storeStatus !== 'object' || !('success' in storeStatus) || !storeStatus.success) {
                    allSuccess = false;
                    failures.push(`${dbName}.${storeName} (Store init: ${storeStatus?.error?.message || 'failed'})`);
                }
            }
        }
    }
    return { allSuccess, failures };
}
async function autoEnsureDbInitialized() {
    resetDbReadyPromise(); // Ensure _dbReadyResolve is always a function
    if (isDbReadyFlag && lastDbInitStatus?.success) {
        const result = { success: true, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
        smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbInitializationCompleteNotification(result));
        return result;
    }
    if (isDbInitInProgress) {
        return dbInitPromise; // Return the existing promise
    }
    isDbInitInProgress = true;
    dbInitPromise = (async () => {
        try {
            console.log('[DB] autoEnsureDbInitialized: Initializing databases and backend.');
            let ids = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.get(['currentLogSessionId', 'previousLogSessionId']);
            if (!ids.currentLogSessionId) {
                ids.currentLogSessionId = crypto.randomUUID();
                await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().storage.local.set({ currentLogSessionId: ids.currentLogSessionId });
            }
            currentExtensionSessionId = ids.currentLogSessionId;
            previousExtensionSessionId = ids.previousLogSessionId || null;
            const worker = createDbWorker();
            if (!worker) {
                const errorMsg = '[DB] Failed to initialize DB Worker. Aborting DB initialization.';
                console.error(errorMsg);
                isDbReadyFlag = false;
                if (typeof dbReadyResolve === 'function')
                    dbReadyResolve(false);
                lastDbInitStatus = { error: errorMsg, success: false };
                const errorResponse = { success: false, error: errorMsg, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
                smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbInitializationCompleteNotification(errorResponse));
                throw new AppError('WORKER_NOT_INITIALIZED', errorMsg);
            }
            if (!dbWorkerReady) {
                console.log('[DB] Waiting for DB worker to become ready...');
                await new Promise((resolveWorkerReady, rejectWorkerReady) => {
                    const timeout = setTimeout(() => rejectWorkerReady(new Error(`Worker '${_dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.WORKER_READY}' signal timeout after 10s`)), 10000);
                    const checkWorker = () => {
                        if (dbWorkerReady) {
                            clearTimeout(timeout);
                            resolveWorkerReady();
                        }
                        else {
                            setTimeout(checkWorker, 50);
                        }
                    };
                    checkWorker();
                });
                console.log('[DB] DB Worker is ready.');
            }
            const payloadForWorker = { schemaConfig: _idbSchema__WEBPACK_IMPORTED_MODULE_2__.schema }; // Make sure 'schema' is defined and imported
            const requestId = (++dbWorkerRequestId).toString();
            console.log('[DB] Sending INIT_CUSTOM_IDBS to worker:', { requestId, type: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.INIT_CUSTOM_IDBS, payload: payloadForWorker });
            const initOpPromise = new Promise((resolve, reject) => {
                dbWorkerCallbacks[requestId] = { resolve, reject };
            });
            if (!dbWorker)
                throw new AppError('WORKER_NOT_INITIALIZED', 'DB Worker is not initialized');
            dbWorker.postMessage({ requestId, action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.INIT_CUSTOM_IDBS, payload: payloadForWorker });
            const resultFromWorker = await withTimeout(initOpPromise, DB_INIT_TIMEOUT, 'DB Init operation with worker timed out');
            lastDbInitStatus = resultFromWorker;
            const { allSuccess, failures } = checkDbAndStoreReadiness(resultFromWorker);
            isDbReadyFlag = allSuccess;
            if (typeof dbReadyResolve === 'function')
                dbReadyResolve(allSuccess);
            const responsePayload = { success: allSuccess, dbStatus: resultFromWorker, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
            if (!allSuccess) {
                const errorMsg = `One or more databases/stores failed to initialize: ${failures.join(', ')}.`;
                console.error('[DB]', errorMsg, 'Details:', resultFromWorker);
                responsePayload.error = new AppError('DB_INIT_FAILED', errorMsg, { failures, dbStatus: resultFromWorker });
            }
            smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbInitializationCompleteNotification(responsePayload));
            if (!allSuccess)
                throw responsePayload.error; // Throw if not successful
            return responsePayload;
        }
        catch (err) {
            console.error('[DB] autoEnsureDbInitialized -> CRITICAL Initialization failed:', err.message);
            isDbReadyFlag = false;
            if (typeof dbReadyResolve === 'function')
                dbReadyResolve(false);
            lastDbInitStatus = lastDbInitStatus || { error: err.message, success: false };
            const errorResponse = { success: false, error: err, dbStatus: lastDbInitStatus, sessionIds: { currentExtensionSessionId, previousExtensionSessionId } };
            smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbInitializationCompleteNotification(errorResponse));
            throw err; // Re-throw the error to be caught by the caller of autoEnsureDbInitialized
        }
        finally {
            isDbInitInProgress = false;
        }
    })();
    return dbInitPromise;
}
// Unified handler for both DbInitializeRequest and DbEnsureInitializedRequest
async function handleDbEnsureInitialized(event) {
    try {
        const result = await autoEnsureDbInitialized();
        return new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedResponse(event?.requestId || crypto.randomUUID(), result.success, result, result.success ? null : result.error);
    }
    catch (e) {
        return new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedResponse(event?.requestId || crypto.randomUUID(), false, null, e);
    }
}
async function handleRequest(event, internalHandler, ResponseClass, timeout = 10000, successDataExtractor = (result) => result.data, errorDetailsExtractor = (errorResult) => ({ errorDetails: errorResult?.error })) {
    const requestId = event?.requestId || crypto.randomUUID();
    try {
        if (!isDbReadyFlag) { // Secondary check
            throw new AppError('DB_NOT_READY', 'Database is not ready after initialization attempt.');
        }
        const result = await withTimeout(internalHandler(event.payload), timeout);
        if (result && result.success === false) {
            throw new AppError('INTERNAL_OPERATION_FAILED', result.error || 'Unknown internal error from handler', errorDetailsExtractor(result));
        }
        const responseData = successDataExtractor(result);
        return new ResponseClass(requestId, true, responseData);
    }
    catch (error) {
        const errObj = error;
        console.error(`[DB] Error in handleRequest for ${event?.type} (reqId: ${requestId}):`, errObj.message, errObj.details || errObj);
        const appError = (error instanceof AppError) ? error : new AppError('UNKNOWN_HANDLER_ERROR', errObj.message || 'Failed in request handler', { originalErrorName: errObj.name, originalErrorStack: errObj.stack, details: errObj.details });
        return new ResponseClass(requestId, false, null, appError);
    }
}
// --- Handler Functions ---
async function handleDbGetReadyStateRequest(event) {
    return new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetReadyStateResponse(event.requestId, true, { ready: isDbReadyFlag });
}
async function handleDbCreateSessionRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.initialMessage?.text)
            throw new AppError('INVALID_INPUT', 'Missing initialMessage or message text');
        // Create new chat regardless of currentChat state for this specific request
        const newChat = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.createChat(payload.initialMessage.text, getDbWorker(), {
            initialMessageSender: payload.initialMessage.sender || 'user',
        });
        if (!newChat)
            throw new AppError('DB_OPERATION_FAILED', 'Failed to create chat session (Chat.createChat returned null)');
        currentChat = newChat;
        await publishSessionUpdate(currentChat.id, 'create', currentChat);
        const messages = await currentChat.getMessages(); // Assumes createChat adds the initial message
        await publishMessagesUpdate(currentChat.id, messages);
        await publishStatusUpdate(currentChat.id, currentChat.status);
        return { success: true, data: newChat };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbCreateSessionResponse, 5000, (res) => res.data.id);
}
async function handleDbGetSessionRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId)
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        if (currentChat && currentChat.id === payload.sessionId)
            return { success: true, data: currentChat };
        const worker = getDbWorker();
        const chat = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            return { success: false, error: `Session ${payload.sessionId} not found` };
        // Load all messages for this chat
        const messages = [];
        for (const msgId of chat.message_ids) {
            const msg = await chat.getMessage(msgId);
            if (msg) {
                // Load all attachments for this message, if any
                if (msg.attachment_ids && msg.attachment_ids.length > 0 && typeof msg.getAttachments === 'function') {
                    msg.attachments = await msg.getAttachments();
                }
                messages.push(msg);
            }
        }
        // Attach messages to chat object for return
        chat.messages = messages;
        return { success: true, data: chat };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionResponse);
}
async function handleDbAddMessageRequest(event) {
    return handleRequest(event, async (payload) => {
        console.log('[DB][TRACE] handleDbAddMessageRequest: sessionId:', payload?.sessionId, 'messageObject:', payload?.messageObject);
        if (!payload?.sessionId || !payload.messageObject?.text)
            throw new AppError('INVALID_INPUT', 'Session ID and message text are required');
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        const messageId = await chat.addMessage(payload.messageObject); // Pass full messageObject
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat;
        await publishSessionUpdate(chat.id, 'update', chat);
        const messages = await chat.getMessages();
        await publishMessagesUpdate(chat.id, messages);
        return { success: true, data: { newMessageId: messageId } };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageResponse);
}
async function handleDbUpdateMessageRequest(event) {
    return handleRequest(event, async (payload) => {
        console.log('[DB][TRACE] handleDbUpdateMessageRequest: sessionId:', payload?.sessionId, 'messageId:', payload?.messageId, 'updates:', payload?.updates);
        if (!payload?.sessionId || !payload.messageId || !payload.updates || (payload.updates.text === undefined && payload.updates.isLoading === undefined && payload.updates.content === undefined /* Added content */)) {
            throw new AppError('INVALID_INPUT', 'Session ID, message ID, and updates (text, content or isLoading) are required');
        }
        if (typeof payload.messageId !== 'string') {
            console.error('[DB] handleDbUpdateMessageRequest: messageId is not a string:', payload.messageId);
            throw new AppError('INVALID_INPUT', 'messageId must be a string');
        }
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        const message = await chat.getMessage(payload.messageId);
        if (!message)
            throw new AppError('NOT_FOUND', `Message ${payload.messageId} not found.`);
        await message.update(payload.updates);
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat;
        await publishSessionUpdate(chat.id, 'update', chat);
        const messages = await chat.getMessages();
        await publishMessagesUpdate(chat.id, messages);
        return { success: true, data: true };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbUpdateMessageResponse);
}
async function handleDbDeleteMessageRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId || !payload.messageId)
            throw new AppError('INVALID_INPUT', 'Session ID and message ID are required');
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        const deleted = await chat.deleteMessage(payload.messageId, { deleteAttachments: true, deleteKGNRels: true, deleteOrphanedEmbedding: true }); // Options from Chat class
        if (!deleted)
            throw new AppError('DB_OPERATION_FAILED', `Failed to delete message ${payload.messageId}.`);
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat; // Chat object state might change (message_ids)
        await publishSessionUpdate(chat.id, 'update', chat);
        const messages = await chat.getMessages();
        await publishMessagesUpdate(chat.id, messages);
        return { success: true, data: true };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbDeleteMessageResponse);
}
async function handleDbUpdateStatusRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId || !payload.status)
            throw new AppError('INVALID_INPUT', 'Session ID and status are required');
        const validStatuses = ['idle', 'processing', 'complete', 'error'];
        if (!validStatuses.includes(payload.status))
            throw new AppError('INVALID_INPUT', `Invalid status: ${payload.status}`);
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        await chat.update({ status: payload.status });
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat;
        await publishSessionUpdate(chat.id, 'update', chat);
        await publishStatusUpdate(chat.id, payload.status);
        return { success: true, data: chat };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbUpdateStatusResponse);
}
async function handleDbToggleStarRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId)
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        await chat.update({ isStarred: !chat.isStarred });
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat;
        await publishSessionUpdate(chat.id, 'update', chat);
        return { success: true, data: chat };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarResponse);
}
async function handleDbGetAllSessionsRequest(event) {
    return handleRequest(event, async () => {
        const worker = getDbWorker();
        const chats = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.getAllChats(worker);
        return { success: true, data: chats };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsResponse, 5000, (res) => (res.data || []).sort((a, b) => (b.chat_timestamp || 0) - (a.chat_timestamp || 0)));
}
async function handleDbGetStarredSessionsRequest(event) {
    return handleRequest(event, async () => {
        const worker = getDbWorker();
        const chats = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.getAllChats(worker);
        const starred = chats.filter((c) => c.isStarred);
        return { success: true, data: starred };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsResponse, 5000, (res) => (res.data || []).map((s) => ({ sessionId: s.id, name: s.title, lastUpdated: (s.chat_timestamp || 0), isStarred: s.isStarred }))
        .sort((a, b) => b.lastUpdated - a.lastUpdated));
}
async function handleDbDeleteSessionRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId)
            throw new AppError('INVALID_INPUT', 'Session ID is required');
        const worker = getDbWorker();
        const deleteResult = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.deleteChat(payload.sessionId, worker, undefined, { deleteMessages: true, deleteSummaries: true, deleteKGNRels: true, deleteOrphanedEmbedding: true });
        if (!deleteResult.success)
            throw new AppError('DB_OPERATION_FAILED', deleteResult.error || `Failed to delete session ${payload.sessionId}`);
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = null;
        await publishSessionUpdate(payload.sessionId, 'delete', { id: payload.sessionId });
        return { success: true, data: true };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionResponse);
}
async function handleDbRenameSessionRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.sessionId || !payload.newName)
            throw new AppError('INVALID_INPUT', 'Session ID and new name are required');
        const worker = getDbWorker();
        let chat = (currentChat && currentChat.id === payload.sessionId) ? currentChat : await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(payload.sessionId, worker);
        if (!chat)
            throw new AppError('NOT_FOUND', `Chat session ${payload.sessionId} not found.`);
        await chat.update({ title: payload.newName });
        if (currentChat && currentChat.id === payload.sessionId)
            currentChat = chat;
        await publishSessionUpdate(chat.id, 'rename', chat);
        return { success: true, data: chat };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionResponse);
}
async function handleDbAddLogRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.logEntryData)
            throw new AppError('INVALID_INPUT', 'Missing logEntryData');
        const worker = getDbWorker();
        const logId = await _idbLog__WEBPACK_IMPORTED_MODULE_5__.LogEntry.create(payload.logEntryData, worker);
        return { success: true, data: { logId } };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddLogResponse);
}
async function handleDbGetLogsRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.filters)
            throw new AppError('INVALID_INPUT', 'Missing filters');
        const worker = getDbWorker();
        const logs = await _idbLog__WEBPACK_IMPORTED_MODULE_5__.LogEntry.getAll(worker, payload.filters);
        return { success: true, data: logs };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetLogsResponse);
}
async function handleDbGetUniqueLogValuesRequest(event) {
    return handleRequest(event, async (payload) => {
        if (!payload?.fieldName)
            throw new AppError('INVALID_INPUT', 'Missing fieldName');
        const worker = getDbWorker();
        const logs = await _idbLog__WEBPACK_IMPORTED_MODULE_5__.LogEntry.getAll(worker);
        const uniqueValues = Array.from(new Set(logs.map((l) => l[payload.fieldName]).filter(Boolean)));
        return { success: true, data: uniqueValues };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetUniqueLogValuesResponse);
}
async function handleDbClearLogsRequest(event) {
    return handleRequest(event, async () => {
        const worker = getDbWorker();
        const logs = await _idbLog__WEBPACK_IMPORTED_MODULE_5__.LogEntry.getAll(worker);
        const sessionsToKeep = new Set([currentExtensionSessionId, previousExtensionSessionId].filter(Boolean));
        let deletedCount = 0;
        const deletePromises = logs
            .filter(log => !sessionsToKeep.has(log.extensionSessionId))
            .map(log => log.delete().then(() => deletedCount++).catch(e => console.warn(`Failed to delete log ${log.id}`, e)));
        await Promise.all(deletePromises);
        return { success: true, data: { deletedCount } };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsResponse);
}
async function handleDbGetCurrentAndLastLogSessionIdsRequest(event) {
    return new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetCurrentAndLastLogSessionIdsResponse(event.requestId, true, {
        currentLogSessionId: currentExtensionSessionId,
        previousLogSessionId: previousExtensionSessionId
    });
}
async function handleDbResetDatabaseRequest(event) {
    return handleRequest(event, async () => {
        console.log("[DB] Attempting database reset via DBActions.RESET worker command.");
        const worker = getDbWorker(); // Get the current worker (throws if not available)
        await new Promise((resolve, reject) => {
            const reqId = crypto.randomUUID();
            dbWorkerCallbacks[reqId] = { resolve, reject };
            worker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.RESET, payload: null, requestId: reqId });
        });
        currentChat = null;
        console.log("[DB] Database reset complete. Re-initializing DB state.");
        isDbReadyFlag = false;
        lastDbInitStatus = null;
        dbInitPromise = null; // Clear any pending init
        await autoEnsureDbInitialized(); // This will use the existing worker or create a new one if needed
        return { success: true, data: true };
    }, _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbResetDatabaseResponse, 15000);
}
// --- DB Handler Map ---
const dbHandlerMap = {
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetReadyStateRequest.type]: handleDbGetReadyStateRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbCreateSessionRequest.type]: handleDbCreateSessionRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest.type]: handleDbGetSessionRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageRequest.type]: handleDbAddMessageRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbUpdateMessageRequest.type]: handleDbUpdateMessageRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbDeleteMessageRequest.type]: handleDbDeleteMessageRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbUpdateStatusRequest.type]: handleDbUpdateStatusRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbToggleStarRequest.type]: handleDbToggleStarRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetAllSessionsRequest.type]: handleDbGetAllSessionsRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetStarredSessionsRequest.type]: handleDbGetStarredSessionsRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbDeleteSessionRequest.type]: handleDbDeleteSessionRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbRenameSessionRequest.type]: handleDbRenameSessionRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddLogRequest.type]: handleDbAddLogRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetLogsRequest.type]: handleDbGetLogsRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetUniqueLogValuesRequest.type]: handleDbGetUniqueLogValuesRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbClearLogsRequest.type]: handleDbClearLogsRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetCurrentAndLastLogSessionIdsRequest.type]: handleDbGetCurrentAndLastLogSessionIdsRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbResetDatabaseRequest.type]: handleDbResetDatabaseRequest,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbInitializeRequest.type]: handleDbEnsureInitialized,
    [_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbEnsureInitializedRequest.type]: handleDbEnsureInitialized,
};
// --- Notification Publishing ---
function smartNotify(notification) {
    if (typeof window === 'undefined' || !window.document) {
        try {
            webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage(notification).catch((e) => console.warn(`[DB] Error sending notification to runtime: ${e.message}`, notification.type));
        }
        catch (e) {
            const errObj = e;
            console.warn(`[DB] Failed to call browser.runtime.sendMessage (maybe not in extension context): ${errObj.message}`);
        }
    }
    else {
        document.dispatchEvent(new CustomEvent(notification.type, { detail: notification }));
        if (_idbSchema__WEBPACK_IMPORTED_MODULE_2__.dbChannel)
            _idbSchema__WEBPACK_IMPORTED_MODULE_2__.dbChannel.postMessage(notification);
        else
            console.warn("[DB] dbChannel not initialized for smartNotify.");
    }
}
async function publishSessionUpdate(sessionId, updateType = 'update', sessionDataOverride = null) {
    try {
        let sessionData = sessionDataOverride;
        if (!sessionData) {
            if (!sessionId) {
                if (updateType === 'delete')
                    sessionData = { id: null };
                else
                    return;
            }
            else {
                const worker = getDbWorker();
                const chat = await _idbChat__WEBPACK_IMPORTED_MODULE_4__.Chat.read(sessionId, worker);
                if (chat)
                    sessionData = chat;
                else if (updateType === 'delete')
                    sessionData = { id: sessionId };
                else {
                    console.warn(`[DB] publishSessionUpdate: Session ${sessionId} not found for ${updateType}.`);
                    return;
                }
            }
        }
        // Load all messages and their attachments for the session
        if (sessionData && sessionData.message_ids && typeof sessionData.getMessage === 'function') {
            const messages = [];
            for (const msgId of sessionData.message_ids) {
                const msg = await sessionData.getMessage(msgId);
                if (msg) {
                    if (msg.attachment_ids && msg.attachment_ids.length > 0 && typeof msg.getAttachments === 'function') {
                        msg.attachments = await msg.getAttachments();
                    }
                    messages.push(msg);
                }
            }
            sessionData.messages = messages;
        }
        const plainSession = (sessionData && typeof sessionData.toJSON === 'function') ? sessionData.toJSON() : JSON.parse(JSON.stringify(sessionData || {}));
        smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification(sessionId, plainSession, updateType));
    }
    catch (e) {
        console.error('[DB] Failed to publish session update:', e, { sessionId, updateType });
    }
}
async function publishMessagesUpdate(sessionId, messages) {
    try {
        if (!Array.isArray(messages)) {
            console.error('[DB] publishMessagesUpdate: messages not an array:', messages);
            return;
        }
        // Use toJSON and filter out any unserializable fields as a safety net
        const plainMessages = messages.map(m => {
            let json = (typeof m.toJSON === 'function' ? m.toJSON() : { ...m });
            // Remove any unserializable fields just in case
            delete json.dbWorker;
            delete json.modelWorker;
            return json;
        });
        smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbMessagesUpdatedNotification(sessionId, plainMessages));
    }
    catch (e) {
        console.error('[DB] Failed to publish messages update:', e, { sessionId });
    }
}
async function publishStatusUpdate(sessionId, status) {
    try {
        smartNotify(new _dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbStatusUpdatedNotification(sessionId, status));
    }
    catch (e) {
        console.error('[DB] Failed to publish status update:', e, { sessionId });
    }
}
// --- Message Listener for External Requests ---
webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type || !dbHandlerMap[message.type]) {
        if (Object.values(_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DBEventNames).includes(message?.type)) {
            // console.warn(`[DB] No handler mapped for DBEvent type: ${message.type}`);
        }
        return false;
    }
    console.log(`[DB] Received message for DB: ${message.type}, ReqID: ${message.requestId}`);
    forwardDbRequest(message)
        .then(responseObject => {
        // console.log(`[DB] Sending response for ${message.type} (ReqID: ${message.requestId}):`, responseObject);
        sendResponse(responseObject);
    })
        .catch(err => {
        console.error(`[DB] Error processing request ${message.type} (ReqID: ${message.requestId}):`, err);
        // Construct a generic error response if one isn't already formed by forwardDbRequest
        const errorResponse = {
            success: false,
            error: err.message || 'Unknown error in DB request processing chain',
            requestId: message.requestId,
            type: `${message.type}_RESPONSE` // Attempt to form a conventional response type
        };
        if (err instanceof AppError) {
            errorResponse.code = err.code;
            errorResponse.details = err.details;
        }
        sendResponse(errorResponse);
    });
    return true;
});
async function forwardDbRequest(request) {
    const handler = dbHandlerMap[request?.type];
    if (!handler) { // Should have been caught by listener, but defensive check
        console.error(`[DB] CRITICAL: No handler found in forwardDbRequest for type: ${request?.type}`);
        const NoHandlerErrorResponse = globalThis[request.type.replace("Request", "Response")];
        if (NoHandlerErrorResponse && typeof NoHandlerErrorResponse === 'function') {
            return new NoHandlerErrorResponse(request.requestId, false, null, new AppError('NO_HANDLER', `No handler for ${request.type}`));
        }
        return { success: false, error: `No handler for ${request.type}`, requestId: request.requestId, type: `${request.type}_ERROR_RESPONSE` };
    }
    try {
        return await handler(request);
    }
    catch (err) {
        console.error(`[DB] Synchronous or unhandled promise error in handler for ${request.type}:`, err);
        const appError = (err instanceof AppError) ? err : new AppError('HANDLER_EXECUTION_ERROR', err.message || `Error executing handler for ${request.type}`, { originalError: err });
        const ResponseClass = globalThis[request.type.replace("Request", "Response")];
        if (ResponseClass && typeof ResponseClass === 'function') {
            return new ResponseClass(request.requestId, false, null, appError);
        }
        return { success: false, error: appError.message, details: appError.details, requestId: request.requestId, type: `${request.type}_ERROR_RESPONSE` };
    }
}



/***/ }),

/***/ "./src/DB/dbActions.ts":
/*!*****************************!*\
  !*** ./src/DB/dbActions.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DBActions: () => (/* binding */ DBActions)
/* harmony export */ });
// Action constants for IndexedDB backend worker and related classes
const DBActions = Object.freeze({
    PUT: 'put',
    GET: 'get',
    GET_ALL: 'getAll',
    QUERY: 'query',
    DELETE: 'delete',
    CLEAR: 'clear',
    ADD_FILE_CHUNK: 'addFileChunk',
    GET_FILE_CHUNK: 'getFileChunk',
    ASSEMBLE_FILE: 'assembleFile',
    INIT_CUSTOM_IDBS: 'initCustomIDBs',
    RESET: 'reset',
    EXPORT_DATABASE: 'exportDatabase',
    IMPORT_DATABASE: 'importDatabase',
    CLEANUP_OLD_DATA: 'cleanupOldData',
    GET_CHANGES_SINCE: 'getChangesSince',
    MARK_AS_DELETED: 'markAsDeleted',
    APPLY_SYNCED_RECORD: 'applySyncedRecord',
    SEARCH: 'search',
    WORKER_READY: 'ready',
    QUERY_MANIFESTS: 'queryManifests',
    // Add more actions as needed
});


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

/***/ "./src/DB/idbAttachment.ts":
/*!*********************************!*\
  !*** ./src/DB/idbAttachment.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Attachment: () => (/* binding */ Attachment)
/* harmony export */ });
/* harmony import */ var _idbBase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbBase */ "./src/DB/idbBase.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
// idbAttachment.ts



class Attachment extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(message_id, file_name, mime_type, data, dbWorker, options = {}) {
        super(options.id || crypto.randomUUID(), file_name, dbWorker);
        this.message_id = message_id;
        this.file_name = file_name;
        this.mime_type = mime_type;
        this.data = data;
        const now = Date.now();
        this.created_at = options.created_at || now;
        this.updated_at = options.updated_at || now;
    }
    static async create(message_id, file_name, mime_type, data, dbWorker, options = {}) {
        const tempAtt = new Attachment(message_id, file_name, mime_type, data, dbWorker, options);
        return tempAtt.saveToDB();
    }
    static async read(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && event.data.result) {
                        const attData = event.data.result;
                        resolve(new Attachment(attData.message_id, attData.file_name, attData.mime_type, attData.data, dbWorker, { id: attData.id, created_at: attData.created_at, updated_at: attData.updated_at }));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get attachment (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_ATTACHMENTS, id], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for get attachment (id: ${id}) confirmation`));
            }, 5000);
        });
    }
    async update(updates) {
        const { id, dbWorker, created_at, message_id, ...allowedUpdates } = updates;
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete() {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete attachment (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_ATTACHMENTS, this.id], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for delete attachment (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now;
        }
        const { dbWorker, ...attachmentData } = this;
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Attachment saved, but worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save attachment'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({
                action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.PUT,
                payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_ATTACHMENTS, attachmentData],
                requestId
            });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for attachment (id: ${this.id}) save confirmation`));
            }, 5000);
        });
    }
    static async getAllByMessageId(message_id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && Array.isArray(event.data.result)) {
                        const attachments = event.data.result.map((attData) => new Attachment(attData.message_id, attData.file_name, attData.mime_type, attData.data, dbWorker, { id: attData.id, created_at: attData.created_at, updated_at: attData.updated_at }));
                        resolve(attachments);
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve([]);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get attachments for message_id: ${message_id}`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            const queryObj = { from: _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_ATTACHMENTS, where: { message_id: message_id }, orderBy: [{ field: 'message_id', direction: 'asc' }] };
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.QUERY, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, queryObj], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for getAllByMessageId (message_id: ${message_id}) confirmation`));
            }, 5000);
        });
    }
}


/***/ }),

/***/ "./src/DB/idbBase.ts":
/*!***************************!*\
  !*** ./src/DB/idbBase.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BaseCRUD: () => (/* binding */ BaseCRUD)
/* harmony export */ });
// idbBase.ts
// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.
class BaseCRUD {
    constructor(id, label, dbWorker) {
        this.id = id;
        this.label = label;
        this.dbWorker = dbWorker;
    }
    static async create(..._args) {
        throw new Error('Static create() not implemented');
    }
    static async read(_id, ..._args) {
        throw new Error('Static read() not implemented');
    }
    // UPDATE (static, optional)
    static async update(_id, _updates, ..._args) {
        throw new Error('Static update() not implemented');
    }
    // DELETE (static, optional)
    static async delete(_id, ..._args) {
        throw new Error('Static delete() not implemented');
    }
}


/***/ }),

/***/ "./src/DB/idbChat.ts":
/*!***************************!*\
  !*** ./src/DB/idbChat.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Chat: () => (/* binding */ Chat)
/* harmony export */ });
/* harmony import */ var _idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbKnowledgeGraph */ "./src/DB/idbKnowledgeGraph.ts");
/* harmony import */ var _idbMessage__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbMessage */ "./src/DB/idbMessage.ts");
/* harmony import */ var _idbSummary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./idbSummary */ "./src/DB/idbSummary.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
/* harmony import */ var _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./idbEmbedding */ "./src/DB/idbEmbedding.ts");
// idbChat.ts
// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.






class Chat extends _idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__.KnowledgeGraphNode {
    constructor(id, title, dbWorker, kgn_created_at, kgn_updated_at, options = {}) {
        super(id, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.NodeType.Chat, title, dbWorker, kgn_created_at, kgn_updated_at, options.kgn_properties ? JSON.stringify(options.kgn_properties) : undefined, options.kgn_embedding_id, options.modelWorker);
        this.isStarred = false;
        this.status = 'idle';
        this.message_ids = [];
        this.summary_ids = [];
        this.title = title;
        this.user_id = options.user_id || '';
        this.tabId = options.tabId;
        this.chat_timestamp = options.chat_timestamp || kgn_created_at;
        this.isStarred = options.isStarred || false;
        this.status = options.status || 'idle';
        this.message_ids = options.message_ids || [];
        this.summary_ids = options.summary_ids || [];
        this.chat_metadata_json = options.chat_metadata ? JSON.stringify(options.chat_metadata) : undefined;
        this.topic = options.topic;
        this.domain = options.domain;
    }
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            tabId: this.tabId,
            chat_timestamp: this.chat_timestamp,
            title: this.title,
            isStarred: this.isStarred,
            status: this.status,
            message_ids: this.message_ids,
            summary_ids: this.summary_ids,
            chat_metadata_json: this.chat_metadata_json,
            topic: this.topic,
            domain: this.domain,
            kgn_type: this.type,
            kgn_label: this.label,
            kgn_properties_json: this.properties_json,
            kgn_embedding_id: this.embedding_id,
            kgn_created_at: this.created_at,
            kgn_updated_at: this.updated_at
            // dbWorker and modelWorker are intentionally omitted
        };
    }
    get chat_metadata() {
        try {
            return this.chat_metadata_json ? JSON.parse(this.chat_metadata_json) : undefined;
        }
        catch (e) {
            console.error(`Failed to parse chat_metadata_json for chat ${this.id}:`, e);
            return undefined;
        }
    }
    set chat_metadata(data) {
        this.chat_metadata_json = data ? JSON.stringify(data) : undefined;
    }
    static async createChat(initialTitleOrPrompt, dbWorker, options = {}) {
        const chatId = options.id || crypto.randomUUID();
        const now = Date.now();
        const title = initialTitleOrPrompt.length > 50 ? initialTitleOrPrompt.split(' ').slice(0, 7).join(' ') + '...' : initialTitleOrPrompt;
        let kgn_embedding_id_to_set;
        if (options.kgn_embeddingInput && options.kgn_embeddingModel) {
            const existingEmbedding = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.getByInputAndModel(options.kgn_embeddingInput, options.kgn_embeddingModel, dbWorker);
            if (existingEmbedding) {
                kgn_embedding_id_to_set = existingEmbedding.id;
                if (options.kgn_embeddingVector !== undefined) {
                    const vectorBuffer = _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.toArrayBuffer(options.kgn_embeddingVector);
                    if (!_idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__.KnowledgeGraphNode.areArrayBuffersEqual(vectorBuffer, existingEmbedding.vector)) {
                        await existingEmbedding.update({ vector: vectorBuffer });
                    }
                }
            }
            else {
                let vectorToSave;
                if (options.kgn_embeddingVector !== undefined) {
                    vectorToSave = _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.toArrayBuffer(options.kgn_embeddingVector);
                }
                else if (options.modelWorker) {
                    vectorToSave = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.generateVectorWithModelWorker(options.kgn_embeddingInput, options.kgn_embeddingModel, options.modelWorker);
                }
                else {
                    throw new Error("Chat.createChat: Cannot create embedding - kgn_embeddingVector not provided and modelWorker is missing.");
                }
                kgn_embedding_id_to_set = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.create(options.kgn_embeddingInput, vectorToSave, options.kgn_embeddingModel, dbWorker);
            }
        }
        const chat = new Chat(chatId, title, dbWorker, now, now, {
            user_id: options.user_id, tabId: options.tabId, chat_timestamp: now,
            isStarred: options.isStarred, status: options.status, topic: options.topic, domain: options.domain,
            kgn_properties: options.kgn_properties, kgn_embedding_id: kgn_embedding_id_to_set, modelWorker: options.modelWorker
        });
        await chat.saveToDB();
        if (initialTitleOrPrompt.length > title.length || (initialTitleOrPrompt && options.initialMessageSender)) {
            await chat.addMessage({
                text: initialTitleOrPrompt,
                sender: options.initialMessageSender || 'user'
            });
        }
        const dbChat = await Chat.read(chatId, dbWorker, options.modelWorker);
        if (!dbChat)
            throw new Error('Failed to retrieve chat from DB after creation');
        return dbChat;
    }
    async saveToDB() {
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = this.chat_timestamp;
        }
        this.label = this.title;
        await super.saveToDB();
        const requestId = crypto.randomUUID();
        const chatDataForStore = {
            id: this.id, // Ensure id is part of the object
            user_id: this.user_id,
            tabId: this.tabId,
            chat_timestamp: this.chat_timestamp,
            title: this.title,
            isStarred: this.isStarred,
            status: this.status,
            message_ids: this.message_ids,
            summary_ids: this.summary_ids,
            chat_metadata_json: this.chat_metadata_json,
            topic: this.topic,
            domain: this.domain,
            kgn_type: this.type, kgn_label: this.label, kgn_properties_json: this.properties_json,
            kgn_embedding_id: this.embedding_id, kgn_created_at: this.created_at, kgn_updated_at: this.updated_at,
        };
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Chat saved, but DB_CHATS worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save chat to DB_CHATS'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.PUT, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_CHATS, chatDataForStore], requestId });
            setTimeout(() => { this.dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout for DB_CHATS save (id: ${this.id})`)); }, 5000);
        });
    }
    static async read(id, dbWorker, modelWorker) {
        const requestId = crypto.randomUUID();
        const chatData = await new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get chat (id: ${id}) from DB_CHATS`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_CHATS, id], requestId });
            setTimeout(() => { dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout getting chat ${id}`)); }, 5000);
        });
        if (chatData) {
            return new Chat(chatData.id, chatData.title, dbWorker, chatData.kgn_created_at, chatData.kgn_updated_at, {
                user_id: chatData.user_id, tabId: chatData.tabId, chat_timestamp: chatData.chat_timestamp,
                isStarred: chatData.isStarred, status: chatData.status, message_ids: chatData.message_ids || [],
                summary_ids: chatData.summary_ids || [],
                chat_metadata: chatData.chat_metadata_json ? JSON.parse(chatData.chat_metadata_json) : undefined,
                topic: chatData.topic, domain: chatData.domain,
                kgn_properties: chatData.kgn_properties_json ? JSON.parse(chatData.kgn_properties_json) : undefined,
                kgn_embedding_id: chatData.kgn_embedding_id, modelWorker: modelWorker
            });
        }
        return undefined;
    }
    async update(updates) {
        const { ...allowedUpdates } = updates;
        if (allowedUpdates.title !== undefined) {
            this.title = allowedUpdates.title;
            this.label = allowedUpdates.title;
        }
        if (allowedUpdates.chat_metadata && typeof allowedUpdates.chat_metadata === 'object') {
            this.chat_metadata = allowedUpdates.chat_metadata;
            delete allowedUpdates.chat_metadata;
        }
        else if (allowedUpdates.chat_metadata_json !== undefined) {
            this.chat_metadata_json = allowedUpdates.chat_metadata_json;
        }
        if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
            this.properties = allowedUpdates.properties;
            delete allowedUpdates.properties;
        }
        else if (allowedUpdates.properties_json !== undefined) {
            this.properties_json = allowedUpdates.properties_json;
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete(options = {}) {
        const { deleteMessages = true, deleteSummaries = true, deleteKGNRels = true, deleteOrphanedEmbedding = false } = options;
        if (deleteMessages) {
            for (const msgId of this.message_ids) {
                const message = await _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.read(msgId, this.dbWorker, this.modelWorker);
                if (message) {
                    await message.delete({ deleteAttachments: true, deleteKGNRels: true, deleteOrphanedEmbedding: true })
                        .catch(e => console.warn(`Failed to delete message ${msgId} for chat ${this.id}: ${e.message}`));
                }
            }
            this.message_ids = [];
        }
        if (deleteSummaries) {
            for (const summaryId of this.summary_ids) {
                const summary = await _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.read(summaryId, this.dbWorker);
                if (summary) {
                    await summary.delete().catch(e => console.warn(`Failed to delete summary ${summaryId} for chat ${this.id}: ${e.message}`));
                }
            }
            this.summary_ids = [];
        }
        const requestId = crypto.randomUUID();
        await new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete chat (id: ${this.id}) from DB_CHATS`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_CHATS, this.id], requestId });
            setTimeout(() => { this.dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout deleting chat ${this.id} from DB_CHATS`)); }, 5000);
        });
        await super.delete({ deleteOrphanedEmbedding, deleteEdges: deleteKGNRels });
    }
    async addMessage(data) {
        const content = data.text || (data.attachment ? data.attachment.file_name : (data.attachmentsData && data.attachmentsData.length > 0 ? data.attachmentsData[0].file_name : 'Message with attachments'));
        if (!data.text && !data.attachment && (!data.attachmentsData || data.attachmentsData.length === 0)) {
            throw new Error("Cannot add an empty message without text or attachments.");
        }
        const messageId = await _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.createMessage(this.id, data.sender, content, this.dbWorker, {
            message_type: data.message_type, metadata: data.metadata,
            kgn_properties: data.kgn_properties, kgn_embeddingInput: data.kgn_embeddingInput,
            kgn_embeddingModel: data.kgn_embeddingModel, kgn_embeddingVector: data.kgn_embeddingVector,
            modelWorker: this.modelWorker
        });
        if (!this.message_ids.includes(messageId)) {
            this.message_ids.push(messageId);
        }
        const messageInstance = await _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.read(messageId, this.dbWorker, this.modelWorker);
        if (!messageInstance)
            throw new Error("Failed to retrieve newly created message for attachment processing.");
        if (data.attachment) {
            await messageInstance.addAttachment(data.attachment);
        }
        if (data.attachmentsData) {
            for (const attData of data.attachmentsData) {
                await messageInstance.addAttachment(attData);
            }
        }
        await this.saveToDB(); // Save chat after message_ids and potential attachments are processed
        return messageId;
    }
    async getMessage(messageId) {
        return _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.read(messageId, this.dbWorker, this.modelWorker);
    }
    async getMessages() {
        const messages = [];
        for (const msgId of this.message_ids) {
            const msg = await _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.read(msgId, this.dbWorker, this.modelWorker);
            if (msg)
                messages.push(msg);
        }
        return messages;
    }
    async deleteMessage(messageId, deleteOptions = {}) {
        const msg = await _idbMessage__WEBPACK_IMPORTED_MODULE_1__.Message.read(messageId, this.dbWorker, this.modelWorker);
        if (msg && msg.chat_id === this.id) {
            await msg.delete(deleteOptions);
            const initialLength = this.message_ids.length;
            this.message_ids = this.message_ids.filter(id => id !== messageId);
            if (this.message_ids.length < initialLength) {
                await this.saveToDB();
                return true;
            }
        }
        return false;
    }
    async addSummary(message_ids_for_summary, summary_text, options) {
        const summaryId = await _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.create(this.id, // chat_id
        summary_text, this.dbWorker, {
            ...options,
            message_ids: message_ids_for_summary,
            start_message_id: options?.start_message_id || (message_ids_for_summary.length > 0 ? message_ids_for_summary[0] : null),
            end_message_id: options?.end_message_id || (message_ids_for_summary.length > 0 ? message_ids_for_summary[message_ids_for_summary.length - 1] : null),
        });
        if (!this.summary_ids.includes(summaryId)) {
            this.summary_ids.push(summaryId);
            await this.saveToDB();
        }
        return summaryId;
    }
    async getSummary(summaryId) {
        return _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.read(summaryId, this.dbWorker);
    }
    async getSummaries() {
        const summaries = [];
        for (const summaryId of this.summary_ids) {
            const summary = await _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.read(summaryId, this.dbWorker);
            if (summary)
                summaries.push(summary);
        }
        return summaries;
    }
    async deleteSummary(summaryId) {
        const summary = await _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.read(summaryId, this.dbWorker);
        if (summary && summary.chat_id === this.id) {
            await summary.delete();
            const initialLength = this.summary_ids.length;
            this.summary_ids = this.summary_ids.filter(id => id !== summaryId);
            if (this.summary_ids.length < initialLength) {
                await this.saveToDB();
                return true;
            }
        }
        return false;
    }
    static async updateChat(chatId, updates, dbWorker, modelWorker) {
        const chat = await Chat.read(chatId, dbWorker, modelWorker);
        if (!chat)
            return { success: false, error: 'Chat not found' };
        try {
            await chat.update(updates);
            const updatedChat = await Chat.read(chatId, dbWorker, modelWorker);
            return { success: true, chat: updatedChat };
        }
        catch (e) {
            return { success: false, error: e.message || 'Update failed' };
        }
    }
    static async deleteChat(chatId, dbWorker, modelWorker, options = {}) {
        const chat = await Chat.read(chatId, dbWorker, modelWorker);
        if (!chat)
            return { success: false, error: 'Chat not found' };
        try {
            await chat.delete(options);
            return { success: true };
        }
        catch (e) {
            return { success: false, error: e.message || 'Delete failed' };
        }
    }
    static async addMessageToChat(chatId, data, dbWorker, modelWorker) {
        const chat = await Chat.read(chatId, dbWorker, modelWorker);
        if (!chat)
            return { success: false, error: 'Chat not found' };
        try {
            const messageId = await chat.addMessage(data);
            return { success: true, messageId };
        }
        catch (e) {
            return { success: false, error: e.message || 'Add message failed' };
        }
    }
    static async getAllChats(dbWorker) {
        const requestId = crypto.randomUUID();
        const chatDatas = await new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to get all chats from DB_CHATS'));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.GET_ALL, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_CHATS], requestId });
            setTimeout(() => { dbWorker.removeEventListener('message', handleMessage); reject(new Error('Timeout getting all chats')); }, 5000);
        });
        return (chatDatas || []).map(chatData => new Chat(chatData.id, chatData.title, dbWorker, chatData.kgn_created_at, chatData.kgn_updated_at, {
            user_id: chatData.user_id, tabId: chatData.tabId, chat_timestamp: chatData.chat_timestamp,
            isStarred: chatData.isStarred, status: chatData.status, message_ids: chatData.message_ids || [],
            summary_ids: chatData.summary_ids || [],
            chat_metadata: chatData.chat_metadata_json ? JSON.parse(chatData.chat_metadata_json) : undefined,
            topic: chatData.topic, domain: chatData.domain,
            kgn_properties: chatData.kgn_properties_json ? JSON.parse(chatData.kgn_properties_json) : undefined,
            kgn_embedding_id: chatData.kgn_embedding_id
        }));
    }
}


/***/ }),

/***/ "./src/DB/idbEmbedding.ts":
/*!********************************!*\
  !*** ./src/DB/idbEmbedding.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Embedding: () => (/* binding */ Embedding)
/* harmony export */ });
/* harmony import */ var _idbBase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbBase */ "./src/DB/idbBase.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
// idbEmbedding.ts
// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.



class Embedding extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(id, input, vector, model, created_at, updated_at, dbWorker, label // optional, defaults to input
    ) {
        super(id, label ?? input, dbWorker);
        this.input = input;
        this.vector = vector;
        this.model = model;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }
    static toArrayBuffer(arr) {
        if (arr instanceof ArrayBuffer)
            return arr;
        if (arr instanceof Float32Array)
            return ArrayBuffer.prototype.slice.call(arr.buffer, arr.byteOffset, arr.byteOffset + arr.byteLength);
        return new Float32Array(arr).buffer;
    }
    static fromArrayBuffer(buf) {
        return new Float32Array(buf);
    }
    static async create(input, vectorData, model, dbWorker, options = {}) {
        const id = options.id || crypto.randomUUID();
        const now = Date.now();
        const vector = Embedding.toArrayBuffer(vectorData);
        const embeddingInstance = new Embedding(id, input, vector, model, now, now, dbWorker, options.label);
        return embeddingInstance.saveToDB();
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now;
        }
        const embeddingData = { ...this };
        if ('dbWorker' in embeddingData)
            delete embeddingData.dbWorker;
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Embedding saved, but worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save embedding'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.PUT, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_EMBEDDINGS, embeddingData], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for embedding (id: ${this.id}) save confirmation`));
            }, 5000);
        });
    }
    static async get(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && event.data.result) {
                        const embData = event.data.result;
                        resolve(new Embedding(embData.id, embData.input, embData.vector, embData.model, embData.created_at, embData.updated_at, dbWorker, embData.label));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get embedding (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_EMBEDDINGS, id], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for get embedding (id: ${id}) confirmation`));
            }, 5000);
        });
    }
    static async getByInputAndModel(input, model, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && Array.isArray(event.data.result)) {
                        const results = event.data.result;
                        if (results.length > 0) {
                            const embData = results[0];
                            resolve(new Embedding(embData.id, embData.input, embData.vector, embData.model, embData.created_at, embData.updated_at, dbWorker, embData.label));
                        }
                        else {
                            resolve(undefined);
                        }
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get embedding by input/model`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            const queryObj = { from: _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_EMBEDDINGS, where: { input: input, model: model }, limit: 1, orderBy: [{ field: 'input', direction: 'asc' }] };
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.QUERY, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, queryObj], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for getByInputAndModel confirmation for input: "${input.substring(0, 30)}..."`));
            }, 5000);
        });
    }
    async update(updates) {
        const { ...allowedUpdates } = updates;
        if (allowedUpdates.vector && !(allowedUpdates.vector instanceof ArrayBuffer)) {
            allowedUpdates.vector = Embedding.toArrayBuffer(allowedUpdates.vector);
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete() {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete embedding (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_EMBEDDINGS, this.id], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for delete embedding (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    static async generateVectorWithModelWorker(input, model, modelWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleModelResponse = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    modelWorker.removeEventListener('message', handleModelResponse);
                    if (event.data.success && event.data.vector instanceof ArrayBuffer) {
                        resolve(event.data.vector);
                    }
                    else if (event.data.success) {
                        reject(new Error('Model worker returned success but no valid vector.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Model worker failed to generate embedding vector.'));
                    }
                }
            };
            modelWorker.addEventListener('message', handleModelResponse);
            modelWorker.postMessage({ action: 'generateEmbeddingVector', input, model, requestId });
            setTimeout(() => {
                modelWorker.removeEventListener('message', handleModelResponse);
                reject(new Error(`Timeout waiting for model worker to generate vector for input: "${input.substring(0, 30)}..."`));
            }, 15000);
        });
    }
}


/***/ }),

/***/ "./src/DB/idbKnowledgeGraph.ts":
/*!*************************************!*\
  !*** ./src/DB/idbKnowledgeGraph.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   KnowledgeGraphEdge: () => (/* binding */ KnowledgeGraphEdge),
/* harmony export */   KnowledgeGraphNode: () => (/* binding */ KnowledgeGraphNode)
/* harmony export */ });
/* harmony import */ var _idbBase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbBase */ "./src/DB/idbBase.ts");
/* harmony import */ var _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbEmbedding */ "./src/DB/idbEmbedding.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
// idbKnowledgeGraph.ts
// NOTE: All DB worker messages should use { action: ... } not { type: ... } for action property.




class KnowledgeGraphNode extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(id, type, label, dbWorker, created_at, updated_at, properties_json, embedding_id, modelWorker) {
        super(id, label, dbWorker);
        this.edgesOut = [];
        this.edgesIn = [];
        this.type = type;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.properties_json = properties_json;
        this.embedding_id = embedding_id;
        this.modelWorker = modelWorker;
    }
    get properties() {
        try {
            return this.properties_json ? JSON.parse(this.properties_json) : undefined;
        }
        catch (e) {
            console.error(`Failed to parse node properties_json for node ${this.id}:`, e);
            return undefined;
        }
    }
    set properties(data) {
        this.properties_json = data ? JSON.stringify(data) : undefined;
    }
    static async create(type, label, dbWorker, options = {}) {
        const id = options.id || crypto.randomUUID();
        const now = Date.now();
        const properties_json = options.properties ? JSON.stringify(options.properties) : undefined;
        let embedding_id_to_set = undefined;
        if (options.embeddingInput && options.embeddingModel) {
            const existingEmbedding = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.getByInputAndModel(options.embeddingInput, options.embeddingModel, dbWorker);
            if (existingEmbedding) {
                embedding_id_to_set = existingEmbedding.id;
                if (options.embeddingVector !== undefined) {
                    const vectorBuffer = _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.toArrayBuffer(options.embeddingVector);
                    if (!KnowledgeGraphNode.areArrayBuffersEqual(vectorBuffer, existingEmbedding.vector)) {
                        await existingEmbedding.update({ vector: vectorBuffer });
                    }
                }
            }
            else {
                let vectorToSave;
                if (options.embeddingVector !== undefined) {
                    vectorToSave = _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.toArrayBuffer(options.embeddingVector);
                }
                else if (options.modelWorker) {
                    vectorToSave = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.generateVectorWithModelWorker(options.embeddingInput, options.embeddingModel, options.modelWorker);
                }
                else {
                    throw new Error("KnowledgeGraphNode.create: Cannot create embedding - embeddingVector not provided and modelWorker is missing.");
                }
                embedding_id_to_set = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.create(options.embeddingInput, vectorToSave, options.embeddingModel, dbWorker);
            }
        }
        const nodeInstance = new KnowledgeGraphNode(id, type, label, dbWorker, now, now, properties_json, embedding_id_to_set, options.modelWorker);
        return nodeInstance.saveToDB();
    }
    static async read(id, dbWorker, modelWorker) {
        const nodeData = await KnowledgeGraphNode.getKGNNodeData(id, dbWorker);
        if (nodeData) {
            return KnowledgeGraphNode.fromKGNData(nodeData, dbWorker, modelWorker);
        }
        return undefined;
    }
    static fromKGNData(data, dbWorker, modelWorker) {
        return new KnowledgeGraphNode(data.id, data.type, data.label, dbWorker, data.created_at, data.updated_at, data.properties_json, data.embedding_id, modelWorker);
    }
    static async getKGNNodeData(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get KGN node data (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_NODES, id], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for get KGN node data (id: ${id}) confirmation`));
            }, 5000);
        });
    }
    async update(updates) {
        const { id, dbWorker, modelWorker, created_at, edgesOut, edgesIn, embedding, type, ...allowedUpdates } = updates;
        if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
            this.properties = allowedUpdates.properties;
            delete allowedUpdates.properties;
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete(options = {}) {
        const { deleteOrphanedEmbedding = false, deleteEdges = true } = options;
        if (deleteEdges) {
            await this.deleteAllEdges();
        }
        if (deleteOrphanedEmbedding && this.embedding_id) {
            const emb = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.get(this.embedding_id, this.dbWorker);
            if (emb) {
                await emb.delete().catch(e => console.warn(`Attempted to delete embedding ${this.embedding_id}, but failed: ${e.message}`));
            }
        }
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete KGN node data (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_NODES, this.id], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for delete KGN node data (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now;
        }
        const { dbWorker, modelWorker, edgesOut, edgesIn, embedding, type, label, properties_json, embedding_id, created_at, updated_at, ...nodeSpecificsForStore } = this;
        const nodeDataForStore = {
            id: this.id, // Ensure id is part of the object if not captured by spread
            type: this.type,
            label: this.label,
            properties_json: this.properties_json,
            embedding_id: this.embedding_id,
            created_at: this.created_at,
            updated_at: this.updated_at,
        };
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Node data saved, but worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save node data'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({
                action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.PUT,
                payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_NODES, nodeDataForStore],
                requestId
            });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for node data (id: ${this.id}) save confirmation`));
            }, 5000);
        });
    }
    async getEmbedding() {
        if (this.embedding && this.embedding.id === this.embedding_id) {
            return this.embedding;
        }
        if (this.embedding_id) {
            this.embedding = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_1__.Embedding.get(this.embedding_id, this.dbWorker);
            return this.embedding;
        }
        return undefined;
    }
    async addEdge(direction, target_node_id, edge_type, metadata) {
        const from_id = direction === 'out' ? this.id : target_node_id;
        const to_id = direction === 'out' ? target_node_id : this.id;
        const edgeId = await KnowledgeGraphEdge.create(from_id, to_id, edge_type, this.dbWorker, { metadata });
        return edgeId;
    }
    async fetchEdges(direction = 'both') {
        const fetchedEdges = await KnowledgeGraphEdge.getEdgesByNodeId(this.id, direction, this.dbWorker);
        if (direction === 'out') {
            this.edgesOut = fetchedEdges;
        }
        else if (direction === 'in') {
            this.edgesIn = fetchedEdges;
        }
        else {
            this.edgesOut = [];
            this.edgesIn = [];
            fetchedEdges.forEach(edge => {
                if (edge.from_node_id === this.id)
                    this.edgesOut.push(edge);
                if (edge.to_node_id === this.id) {
                    if (!this.edgesIn.find(e => e.id === edge.id) && !this.edgesOut.find(e => e.id === edge.id && edge.from_node_id === edge.to_node_id)) {
                        this.edgesIn.push(edge);
                    }
                    else if (edge.from_node_id !== this.id && !this.edgesIn.find(e => e.id === edge.id)) {
                        this.edgesIn.push(edge);
                    }
                }
            });
        }
    }
    async deleteEdge(edgeId) {
        const edge = await KnowledgeGraphEdge.read(edgeId, this.dbWorker);
        if (edge && (edge.from_node_id === this.id || edge.to_node_id === this.id)) {
            await edge.delete();
            this.edgesOut = this.edgesOut.filter(e => e.id !== edgeId);
            this.edgesIn = this.edgesIn.filter(e => e.id !== edgeId);
            return true;
        }
        return false;
    }
    async deleteAllEdges() {
        const allRelatedEdges = await KnowledgeGraphEdge.getEdgesByNodeId(this.id, 'both', this.dbWorker);
        const uniqueEdgeIds = Array.from(new Set(allRelatedEdges.map(e => e.id)));
        for (const edgeId of uniqueEdgeIds) {
            const edgeInstance = await KnowledgeGraphEdge.read(edgeId, this.dbWorker);
            if (edgeInstance) {
                await edgeInstance.delete();
            }
        }
        this.edgesOut = [];
        this.edgesIn = [];
    }
    static areArrayBuffersEqual(buf1, buf2) {
        if (buf1.byteLength !== buf2.byteLength)
            return false;
        const view1 = new Uint8Array(buf1);
        const view2 = new Uint8Array(buf2);
        for (let i = 0; i < view1.length; i++) {
            if (view1[i] !== view2[i])
                return false;
        }
        return true;
    }
}
class KnowledgeGraphEdge extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(id, from_node_id, to_node_id, edge_type, created_at, dbWorker, metadata_json, fromNode, toNode) {
        super(id, edge_type, dbWorker); // use edge_type as label for now
        this.from_node_id = from_node_id;
        this.to_node_id = to_node_id;
        this.edge_type = edge_type;
        this.metadata_json = metadata_json;
        this.created_at = created_at;
        if (fromNode)
            this.fromNode = fromNode;
        if (toNode)
            this.toNode = toNode;
    }
    get metadata() {
        try {
            return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
        }
        catch (e) {
            console.error(`Failed to parse edge metadata_json for edge ${this.id}:`, e);
            return undefined;
        }
    }
    set metadata(data) {
        this.metadata_json = data ? JSON.stringify(data) : undefined;
    }
    static async create(from_node_id, to_node_id, edge_type, dbWorker, options = {}) {
        const id = options.id || crypto.randomUUID();
        const now = Date.now();
        const metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
        const edgeInstance = new KnowledgeGraphEdge(id, from_node_id, to_node_id, edge_type, now, dbWorker, metadata_json);
        return edgeInstance.saveToDB();
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        if (!this.created_at) {
            this.created_at = Date.now();
        }
        const { dbWorker, fromNode, toNode, ...edgeData } = this;
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Edge saved, but worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save edge'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({
                action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.PUT,
                payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_EDGES, edgeData],
                requestId
            });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for edge (id: ${this.id}) save confirmation`));
            }, 5000);
        });
    }
    async update(updates) {
        const { id, dbWorker, created_at, from_node_id, to_node_id, fromNode, toNode, ...allowedUpdates } = updates;
        if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
            this.metadata = allowedUpdates.metadata;
            delete allowedUpdates.metadata;
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete() {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete edge (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_EDGES, this.id], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for delete edge (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    static async getEdgesByNodeId(nodeId, direction, dbWorker) {
        const results = [];
        const errors = [];
        const fetchDirection = async (dir) => {
            const requestId = crypto.randomUUID();
            const indexName = dir === 'out' ? 'from_node_id' : 'to_node_id';
            const queryObj = { from: _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_EDGES, where: { [indexName]: nodeId }, orderBy: [{ field: indexName, direction: 'asc' }] };
            return new Promise((resolveQuery, rejectQuery) => {
                const handleMessage = (event) => {
                    if (event.data && event.data.requestId === requestId) {
                        dbWorker.removeEventListener('message', handleMessage);
                        if (event.data.success && Array.isArray(event.data.result)) {
                            event.data.result.forEach((edgeData) => {
                                results.push(new KnowledgeGraphEdge(edgeData.id, edgeData.from_node_id, edgeData.to_node_id, edgeData.edge_type, edgeData.created_at, dbWorker, edgeData.metadata_json));
                            });
                            resolveQuery();
                        }
                        else if (event.data.success) {
                            resolveQuery();
                        }
                        else {
                            const err = new Error(event.data.error || `Failed to get edges for node ${nodeId}, direction ${dir}`);
                            errors.push(err);
                            rejectQuery(err);
                        }
                    }
                };
                dbWorker.addEventListener('message', handleMessage);
                dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.QUERY, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, queryObj], requestId });
                setTimeout(() => {
                    dbWorker.removeEventListener('message', handleMessage);
                    const err = new Error(`Timeout for getEdgesByNodeId (node: ${nodeId}, dir: ${dir})`);
                    errors.push(err);
                    rejectQuery(err);
                }, 5000);
            });
        };
        if (direction === 'out' || direction === 'both') {
            await fetchDirection('out').catch(e => { });
        }
        if (direction === 'in' || direction === 'both') {
            await fetchDirection('in').catch(e => { });
        }
        if (errors.length > 0 && results.length === 0) {
            throw new Error(`Failed to fetch edges: ${errors.map(e => e.message).join(', ')}`);
        }
        if (direction === 'both' && results.length > 0) {
            return Array.from(new Map(results.map(edge => [edge.id, edge])).values());
        }
        return results;
    }
    /**
     * Fetch a single log entry by its unique ID.
     * For fetching all or filtered logs, use getAll or the filtering methods.
     */
    static async read(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && event.data.result) {
                        const edgeData = event.data.result;
                        resolve(new KnowledgeGraphEdge(edgeData.id, edgeData.from_node_id, edgeData.to_node_id, edgeData.edge_type, edgeData.created_at, dbWorker, edgeData.metadata_json));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get edge (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_3__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_2__.DBNames.DB_KNOWLEDGE_GRAPH_EDGES, id], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for get edge (id: ${id}) confirmation`));
            }, 5000);
        });
    }
}


/***/ }),

/***/ "./src/DB/idbLog.ts":
/*!**************************!*\
  !*** ./src/DB/idbLog.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LogEntry: () => (/* binding */ LogEntry)
/* harmony export */ });
/* harmony import */ var _idbBase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbBase */ "./src/DB/idbBase.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
// idbLog.ts



class LogEntry extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(id, timestamp, level, message, component, extensionSessionId, dbWorker, chatSessionId) {
        super(id, message, dbWorker); // Use message as label for consistency
        this.timestamp = timestamp;
        this.level = level;
        this.message = message;
        this.component = component;
        this.extensionSessionId = extensionSessionId;
        this.chatSessionId = chatSessionId;
    }
    static async create(data, dbWorker) {
        const id = crypto.randomUUID();
        const record = { id, ...data };
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to create log entry'));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.PUT, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, record], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error('Timeout waiting for create log entry confirmation'));
            }, 5000);
        });
    }
    /**
     * Fetch a single log entry by its unique ID.
     * For fetching all or filtered logs, use getAll or the filtering methods.
     */
    static async read(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && event.data.result) {
                        const l = event.data.result;
                        resolve(new LogEntry(l.id, l.timestamp, l.level, l.message, l.component, l.extensionSessionId, dbWorker, l.chatSessionId));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get log entry (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, id], requestId });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for get log entry (id: ${id}) confirmation`));
            }, 5000);
        });
    }
    async update(updates) {
        Object.assign(this, updates);
        await this.saveToDB();
    }
    async delete() {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete log entry (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, this.id], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for delete log entry (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        const record = {
            id: this.id,
            timestamp: this.timestamp,
            level: this.level,
            message: this.message,
            component: this.component,
            extensionSessionId: this.extensionSessionId,
            chatSessionId: this.chatSessionId
        };
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save log entry'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.PUT, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, record], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error('Timeout waiting for save log entry confirmation'));
            }, 5000);
        });
    }
    static async getAll(dbWorker, filters) {
        const requestId = crypto.randomUUID();
        // Build where clause for queryObj
        let where = {};
        if (filters?.levels) {
            if (filters.levels.length === 1) {
                where.level = filters.levels[0];
            }
            else if (filters.levels.length > 1) {
                where.level = { op: 'in', value: filters.levels };
            }
        }
        if (filters?.component) {
            where.component = filters.component;
        }
        // If no filters, don't include where
        const queryObj = {
            from: _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS,
            orderBy: [{ field: 'timestamp', direction: 'desc' }]
        };
        if (Object.keys(where).length > 0) {
            queryObj.where = where;
        }
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && Array.isArray(event.data.result)) {
                        resolve(event.data.result.map((l) => new LogEntry(l.id, l.timestamp, l.level, l.message, l.component, l.extensionSessionId, dbWorker, l.chatSessionId)));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve([]);
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to get logs'));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({
                action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.QUERY,
                payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_LOGS, queryObj],
                requestId
            });
            setTimeout(() => {
                dbWorker.removeEventListener('message', handleMessage);
                reject(new Error('Timeout waiting for log query confirmation'));
            }, 5000);
        });
    }
    static async getByLevel(level, dbWorker) {
        return LogEntry.getAll(dbWorker, { levels: [level] });
    }
    static async getByLevels(levels, dbWorker) {
        return LogEntry.getAll(dbWorker, { levels });
    }
    static async getByComponent(component, dbWorker) {
        return LogEntry.getAll(dbWorker, { component });
    }
    static async getByComponentAndLevels(component, levels, dbWorker) {
        return LogEntry.getAll(dbWorker, { component, levels });
    }
}


/***/ }),

/***/ "./src/DB/idbMessage.ts":
/*!******************************!*\
  !*** ./src/DB/idbMessage.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Message: () => (/* binding */ Message)
/* harmony export */ });
/* harmony import */ var _idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbKnowledgeGraph */ "./src/DB/idbKnowledgeGraph.ts");
/* harmony import */ var _idbAttachment__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbAttachment */ "./src/DB/idbAttachment.ts");
/* harmony import */ var _idbSummary__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./idbSummary */ "./src/DB/idbSummary.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
/* harmony import */ var _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./idbEmbedding */ "./src/DB/idbEmbedding.ts");
// idbMessage.ts






class Message extends _idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__.KnowledgeGraphNode {
    constructor(id, chat_id, sender, content, dbWorker, timestamp, kgn_created_at, kgn_updated_at, options = {}) {
        super(id, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.NodeType.Message, content, dbWorker, kgn_created_at, kgn_updated_at, options.kgn_properties ? JSON.stringify(options.kgn_properties) : undefined, options.kgn_embedding_id, options.modelWorker);
        this.upvotes = 0;
        this.downvotes = 0;
        this.starred = false;
        this.attachment_ids = [];
        this.chat_id = chat_id;
        this.timestamp = timestamp;
        this.sender = sender;
        this.message_type = options.message_type || 'text';
        this.content = content;
        this.metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
        this.attachment_ids = options.attachment_ids || [];
        this.upvotes = options.upvotes || 0;
        this.downvotes = options.downvotes || 0;
        this.starred = options.starred || false;
    }
    get metadata() {
        try {
            return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
        }
        catch (e) {
            console.error(`Failed to parse message metadata_json for message ${this.id}:`, e);
            return undefined;
        }
    }
    set metadata(data) {
        this.metadata_json = data ? JSON.stringify(data) : undefined;
    }
    static async createMessage(chat_id, sender, content, dbWorker, options = {}) {
        const messageId = options.id || crypto.randomUUID();
        const now = Date.now();
        const messageTimestamp = options.timestamp || now;
        let kgn_embedding_id_to_set;
        if (options.kgn_embeddingInput && options.kgn_embeddingModel) {
            const existingEmbedding = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.getByInputAndModel(options.kgn_embeddingInput, options.kgn_embeddingModel, dbWorker);
            if (existingEmbedding) {
                kgn_embedding_id_to_set = existingEmbedding.id;
                if (options.kgn_embeddingVector !== undefined) {
                    const vectorBuffer = _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.toArrayBuffer(options.kgn_embeddingVector);
                    if (!_idbKnowledgeGraph__WEBPACK_IMPORTED_MODULE_0__.KnowledgeGraphNode.areArrayBuffersEqual(vectorBuffer, existingEmbedding.vector)) {
                        await existingEmbedding.update({ vector: vectorBuffer });
                    }
                }
            }
            else {
                let vectorToSave;
                if (options.kgn_embeddingVector !== undefined) {
                    vectorToSave = _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.toArrayBuffer(options.kgn_embeddingVector);
                }
                else if (options.modelWorker) {
                    vectorToSave = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.generateVectorWithModelWorker(options.kgn_embeddingInput, options.kgn_embeddingModel, options.modelWorker);
                }
                else {
                    throw new Error("Message.createMessage: Cannot create embedding - kgn_embeddingVector not provided and modelWorker is missing.");
                }
                kgn_embedding_id_to_set = await _idbEmbedding__WEBPACK_IMPORTED_MODULE_5__.Embedding.create(options.kgn_embeddingInput, vectorToSave, options.kgn_embeddingModel, dbWorker);
            }
        }
        const msg = new Message(messageId, chat_id, sender, content, dbWorker, messageTimestamp, now, now, {
            message_type: options.message_type,
            metadata: options.metadata,
            attachment_ids: options.attachment_ids,
            upvotes: options.upvotes,
            downvotes: options.downvotes,
            starred: options.starred,
            kgn_properties: options.kgn_properties,
            kgn_embedding_id: kgn_embedding_id_to_set,
            modelWorker: options.modelWorker
        });
        await msg.saveToDB();
        return messageId;
    }
    async saveToDB() {
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = this.timestamp;
        }
        this.label = this.content;
        await super.saveToDB();
        const requestId = crypto.randomUUID();
        const { dbWorker, modelWorker, edgesOut, edgesIn, embedding, type, label, properties_json, embedding_id, created_at, updated_at, ...messageSpecificsForStore } = this;
        const messageDataForStore = {
            id: this.id, // Ensure id is part of the object if not captured by spread
            chat_id: this.chat_id,
            timestamp: this.timestamp,
            sender: this.sender,
            message_type: this.message_type,
            content: this.content,
            metadata_json: this.metadata_json,
            upvotes: this.upvotes,
            downvotes: this.downvotes,
            starred: this.starred,
            attachment_ids: this.attachment_ids,
            kgn_type: this.type,
            kgn_label: this.label,
            kgn_properties_json: this.properties_json,
            kgn_embedding_id: this.embedding_id,
            kgn_created_at: this.created_at,
            kgn_updated_at: this.updated_at,
        };
        console.log('[DB][TRACE] Message.saveToDB: messageDataForStore:', messageDataForStore);
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Message saved, but DB_MESSAGES worker did not return a valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save message to DB_MESSAGES'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.PUT, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_MESSAGES, messageDataForStore], requestId });
            setTimeout(() => {
                this.dbWorker.removeEventListener('message', handleMessage);
                reject(new Error(`Timeout waiting for DB_MESSAGES save (id: ${this.id}) confirmation`));
            }, 5000);
        });
    }
    static async read(id, dbWorker, modelWorker) {
        const requestId = crypto.randomUUID();
        const messageData = await new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve(event.data.result);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get message (id: ${id}) from DB_MESSAGES`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_MESSAGES, id], requestId });
            setTimeout(() => { dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout getting message ${id}`)); }, 5000);
        });
        if (messageData) {
            return new Message(messageData.id, messageData.chat_id, messageData.sender, messageData.content, dbWorker, messageData.timestamp, messageData.kgn_created_at, messageData.kgn_updated_at, {
                message_type: messageData.message_type,
                metadata: messageData.metadata_json ? JSON.parse(messageData.metadata_json) : undefined,
                attachment_ids: messageData.attachment_ids || [],
                upvotes: messageData.upvotes, downvotes: messageData.downvotes, starred: messageData.starred,
                kgn_properties: messageData.kgn_properties_json ? JSON.parse(messageData.kgn_properties_json) : undefined,
                kgn_embedding_id: messageData.kgn_embedding_id,
                modelWorker: modelWorker
            });
        }
        return undefined;
    }
    async update(updates) {
        const { id, chat_id, timestamp, created_at, type, label, edgesOut, edgesIn, _embedding, dbWorker, modelWorker, ...allowedUpdates } = updates;
        if (allowedUpdates.content !== undefined) {
            this.content = allowedUpdates.content;
            this.label = allowedUpdates.content;
        }
        if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
            this.metadata = allowedUpdates.metadata;
            delete allowedUpdates.metadata;
        }
        else if (allowedUpdates.metadata_json !== undefined) {
            this.metadata_json = allowedUpdates.metadata_json;
        }
        if (allowedUpdates.properties && typeof allowedUpdates.properties === 'object') {
            this.properties = allowedUpdates.properties;
            delete allowedUpdates.properties;
        }
        else if (allowedUpdates.properties_json !== undefined) {
            this.properties_json = allowedUpdates.properties_json;
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete(options = {}) {
        const { deleteAttachments = true, deleteKGNRels = true, deleteOrphanedEmbedding = false } = options;
        if (deleteAttachments) {
            for (const attId of this.attachment_ids) {
                const attachment = await _idbAttachment__WEBPACK_IMPORTED_MODULE_1__.Attachment.read(attId, this.dbWorker);
                if (attachment) {
                    await attachment.delete().catch(e => console.warn(`Failed to delete attachment ${attId} for message ${this.id}: ${e.message}`));
                }
            }
            this.attachment_ids = [];
        }
        const requestId = crypto.randomUUID();
        await new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete message (id: ${this.id}) from DB_MESSAGES`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_4__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_3__.DBNames.DB_MESSAGES, this.id], requestId });
            setTimeout(() => { this.dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout deleting message ${this.id} from DB_MESSAGES`)); }, 5000);
        });
        await super.delete({ deleteOrphanedEmbedding, deleteEdges: deleteKGNRels });
    }
    async addAttachment(fileData) {
        const newAttachmentId = await _idbAttachment__WEBPACK_IMPORTED_MODULE_1__.Attachment.create(this.id, fileData.file_name, fileData.mime_type, fileData.data, this.dbWorker);
        if (!this.attachment_ids.includes(newAttachmentId)) {
            this.attachment_ids.push(newAttachmentId);
            await this.saveToDB();
        }
        return newAttachmentId;
    }
    async getAttachments() {
        if (!this.attachment_ids || this.attachment_ids.length === 0) {
            return [];
        }
        return _idbAttachment__WEBPACK_IMPORTED_MODULE_1__.Attachment.getAllByMessageId(this.id, this.dbWorker);
    }
    async deleteAttachment(attachmentIdToDelete) {
        const att = await _idbAttachment__WEBPACK_IMPORTED_MODULE_1__.Attachment.read(attachmentIdToDelete, this.dbWorker);
        if (att && att.message_id === this.id) {
            await att.delete();
            const initialLength = this.attachment_ids.length;
            this.attachment_ids = this.attachment_ids.filter(id => id !== attachmentIdToDelete);
            if (this.attachment_ids.length < initialLength) {
                await this.saveToDB();
                return true;
            }
        }
        return false;
    }
    async upvote() { this.upvotes++; await this.update({ upvotes: this.upvotes }); }
    async downvote() { this.downvotes++; await this.update({ downvotes: this.downvotes }); }
    async toggleStarred() { this.starred = !this.starred; await this.update({ starred: this.starred }); }
    async addSummary(summary_text, options) {
        const summaryId = await _idbSummary__WEBPACK_IMPORTED_MODULE_2__.Summary.create(this.id, // message id as chat_id/parent_id
        summary_text, this.dbWorker, {
            ...options,
            message_ids: [this.id],
            start_message_id: options?.start_message_id || this.id,
            end_message_id: options?.end_message_id || this.id,
        });
        this.summary_id = summaryId;
        await this.saveToDB();
        return summaryId;
    }
    toJSON() {
        return {
            id: this.id,
            chat_id: this.chat_id,
            timestamp: this.timestamp,
            sender: this.sender,
            message_type: this.message_type,
            content: this.content,
            metadata_json: this.metadata_json,
            upvotes: this.upvotes,
            downvotes: this.downvotes,
            starred: this.starred,
            attachment_ids: this.attachment_ids,
            summary_id: this.summary_id,
            attachments: this.attachments,
        };
    }
}


/***/ }),

/***/ "./src/DB/idbModel.ts":
/*!****************************!*\
  !*** ./src/DB/idbModel.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   QuantStatus: () => (/* binding */ QuantStatus),
/* harmony export */   addManifestEntry: () => (/* binding */ addManifestEntry),
/* harmony export */   fetchModelMetadataInternal: () => (/* binding */ fetchModelMetadataInternal),
/* harmony export */   fetchRepoFiles: () => (/* binding */ fetchRepoFiles),
/* harmony export */   filterAndValidateFilesInternal: () => (/* binding */ filterAndValidateFilesInternal),
/* harmony export */   getAllManifestEntries: () => (/* binding */ getAllManifestEntries),
/* harmony export */   getFromIndexedDB: () => (/* binding */ getFromIndexedDB),
/* harmony export */   getManifestEntry: () => (/* binding */ getManifestEntry),
/* harmony export */   openModelCacheDB: () => (/* binding */ openModelCacheDB),
/* harmony export */   parseQuantFromFilename: () => (/* binding */ parseQuantFromFilename),
/* harmony export */   saveToIndexedDB: () => (/* binding */ saveToIndexedDB)
/* harmony export */ });
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");

// --- Types ---
var QuantStatus;
(function (QuantStatus) {
    QuantStatus["Available"] = "available";
    QuantStatus["Downloaded"] = "downloaded";
    QuantStatus["Failed"] = "failed";
    QuantStatus["NotFound"] = "not_found";
    QuantStatus["Unavailable"] = "unavailable";
    QuantStatus["Unsupported"] = "unsupported";
})(QuantStatus || (QuantStatus = {}));
const prefix = '[IDBModel]';
const LOG_GENERAL = false;
const LOG_DEBUG = false;
const LOG_ERROR = true;
const LOG_WARN = true;
// Canonical opener for model cache DB
async function openModelCacheDB() {
    if (LOG_GENERAL)
        console.log(prefix, '[openModelCacheDB] Opening TabAgentModels DB');
    const dbName = _idbSchema__WEBPACK_IMPORTED_MODULE_0__.DBNames.DB_MODELS;
    const dbConfig = _idbSchema__WEBPACK_IMPORTED_MODULE_0__.modelCacheSchema[dbName];
    const storeNames = Object.keys(dbConfig.stores);
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(dbName, dbConfig.version);
        req.onupgradeneeded = (event) => {
            const db = req.result;
            if (LOG_DEBUG)
                console.log(prefix, '[openModelCacheDB] onupgradeneeded event', event);
            for (const storeName of storeNames) {
                if (!db.objectStoreNames.contains(storeName)) {
                    const storeConfig = dbConfig.stores[storeName];
                    db.createObjectStore(storeName, { keyPath: storeConfig.keyPath });
                    if (LOG_DEBUG)
                        console.log(prefix, `[openModelCacheDB] Created object store: ${storeName}`);
                }
            }
        };
        req.onsuccess = (event) => {
            if (LOG_DEBUG)
                console.log(prefix, '[openModelCacheDB] onsuccess event', event);
            if (LOG_DEBUG)
                console.log(prefix, '[openModelCacheDB] Success');
            resolve(req.result);
        };
        req.onerror = (event) => {
            if (LOG_ERROR)
                console.error(prefix, '[openModelCacheDB] onerror event', event);
            if (LOG_ERROR)
                console.error(prefix, '[openModelCacheDB] Error', req.error);
            reject(req.error);
        };
        req.onblocked = (event) => {
            if (LOG_WARN)
                console.warn(prefix, '[openModelCacheDB] onblocked event', event);
            reject(new Error('openModelCacheDB: DB open request was blocked.'));
        };
    });
}
// Update all helpers to use openModelCacheDB
async function getFromIndexedDB(url) {
    if (LOG_GENERAL)
        console.log(prefix, '[getFromIndexedDB] Getting', url);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(url);
        req.onsuccess = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[getFromIndexedDB] Success for', url, req.result);
            const result = req.result;
            resolve(result ? result.blob : null);
        };
        req.onerror = () => {
            if (LOG_ERROR)
                console.error(prefix, '[getFromIndexedDB] Error for', url, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[getFromIndexedDB] Transaction complete for', url);
        };
        tx.onerror = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[getFromIndexedDB] Transaction error for', url, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[getFromIndexedDB] Transaction aborted for', url, e);
        };
    });
}
async function saveToIndexedDB(url, blob) {
    if (LOG_GENERAL)
        console.log(prefix, '[saveToIndexedDB] Saving', url);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        const store = tx.objectStore('files');
        const req = store.put({ url, blob });
        req.onsuccess = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[saveToIndexedDB] Saved', url, blob);
            resolve(undefined);
        };
        req.onerror = () => {
            if (LOG_ERROR)
                console.error(prefix, '[saveToIndexedDB] Error saving', url, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[saveToIndexedDB] Transaction complete for', url);
        };
        tx.onerror = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[saveToIndexedDB] Transaction error for', url, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[saveToIndexedDB] Transaction aborted for', url, e);
        };
    });
}
async function getManifestEntry(repo) {
    if (LOG_GENERAL)
        console.log(prefix, '[getManifestEntry] Getting', repo);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('manifest', 'readonly');
        const store = tx.objectStore('manifest');
        const req = store.get(repo);
        req.onsuccess = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[getManifestEntry] Success for', repo, req.result);
            resolve(req.result || null);
        };
        req.onerror = () => {
            if (LOG_ERROR)
                console.error(prefix, '[getManifestEntry] Error for', repo, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[getManifestEntry] Transaction complete for', repo);
        };
        tx.onerror = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[getManifestEntry] Transaction error for', repo, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[getManifestEntry] Transaction aborted for', repo, e);
        };
    });
}
async function addManifestEntry(repo, entry) {
    if (!entry || typeof entry !== 'object' || entry.repo !== repo) {
        throw new Error(`[addManifestEntry] Invalid entry: must be an object with repo === ${repo}`);
    }
    if (LOG_GENERAL)
        console.log(prefix, '[addManifestEntry] Adding/Updating', repo, entry);
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('manifest', 'readwrite');
        const store = tx.objectStore('manifest');
        const req = store.put(entry);
        req.onsuccess = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[addManifestEntry] Added/Updated', repo, entry);
            resolve();
        };
        req.onerror = () => {
            if (LOG_ERROR)
                console.error(prefix, '[addManifestEntry] Error for', repo, req.error);
            reject(req.error);
        };
        tx.oncomplete = () => {
            if (LOG_DEBUG)
                console.log(prefix, '[addManifestEntry] Transaction complete for', repo);
        };
        tx.onerror = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[addManifestEntry] Transaction error for', repo, e);
        };
        tx.onabort = (e) => {
            if (LOG_ERROR)
                console.error(prefix, '[addManifestEntry] Transaction aborted for', repo, e);
        };
    });
}
async function fetchRepoFiles(repo) {
    if (LOG_GENERAL)
        console.log(prefix, '[fetchRepoFiles] Fetching', repo);
    const url = `https://huggingface.co/api/models/${repo}`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            if (LOG_ERROR)
                console.error(prefix, '[fetchRepoFiles] Failed for', repo, resp.status, resp.statusText);
            throw new Error(`Failed to fetch repo files for ${repo}`);
        }
        const json = await resp.json();
        if (LOG_DEBUG)
            console.log(prefix, '[fetchRepoFiles] Success for', repo, json);
        // Return both siblings and pipeline_tag (task)
        return { siblings: json.siblings || [], task: json.pipeline_tag || 'text-generation' };
    }
    catch (err) {
        if (LOG_ERROR)
            console.error(prefix, '[fetchRepoFiles] Exception for', repo, err);
        throw err;
    }
}
function parseQuantFromFilename(filename) {
    if (LOG_GENERAL)
        console.log(prefix, '[parseQuantFromFilename] Parsing', filename);
    const match = filename.match(/model_([a-z0-9_]+)\.onnx$/i);
    const quant = match ? match[1] : null;
    if (LOG_DEBUG)
        console.log(prefix, '[parseQuantFromFilename] Result', quant);
    return quant;
}
async function fetchModelMetadataInternal(modelId) {
    const apiUrl = `https://huggingface.co/api/models/${encodeURIComponent(modelId)}`;
    if (LOG_GENERAL)
        console.log(prefix, `Fetching model metadata from: ${apiUrl}`);
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(prefix, `Failed to fetch model file list for ${modelId}: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Metadata fetch failed (${response.status}): ${response.statusText}`);
        }
        const metadata = await response.json();
        if (LOG_GENERAL)
            console.log(prefix, `Model metadata fetched successfully for ${modelId}.`);
        return metadata;
    }
    catch (error) {
        if (LOG_ERROR)
            console.error(prefix, `Error fetching metadata for ${modelId}:`, error);
        throw error;
    }
}
async function filterAndValidateFilesInternal(metadata, modelId, baseRepoUrl) {
    const hfFileEntries = metadata.siblings || [];
    // Only keep files we care about
    const filteredEntries = hfFileEntries.filter((f) => f.rfilename.endsWith('.onnx') || f.rfilename.endsWith('on') || f.rfilename.endsWith('.txt'));
    if (filteredEntries.length === 0) {
        return { neededFileEntries: [], message: "No .onnx, on, or .txt files found in model metadata." };
    }
    async function getFileSizeWithHEAD(url) {
        try {
            const headResp = await fetch(url, { method: 'HEAD' });
            if (headResp.ok) {
                const len = headResp.headers.get('Content-Length');
                return len ? parseInt(len, 10) : null;
            }
        }
        catch (e) {
            console.warn('[ModelMetadata]', `HEAD request failed for ${url}:`, e);
        }
        return null;
    }
    // Ensure size is set for each entry
    const sizePromises = filteredEntries.map(async (entry) => {
        if (typeof entry.size !== 'number' || !isFinite(entry.size) || entry.size <= 0) {
            const url = baseRepoUrl + entry.rfilename;
            const size = await getFileSizeWithHEAD(url);
            if (size && isFinite(size) && size > 0) {
                entry.size = size;
            }
            else {
                entry.skip = true;
            }
        }
    });
    await Promise.all(sizePromises);
    // Now build full manifest objects
    const neededFileEntries = filteredEntries.filter((e) => !e.skip).map((entry) => {
        const fileName = entry.rfilename;
        const fileType = fileName.split('.').pop();
        const size = entry.size;
        const totalChunks = Math.ceil(size / (10 * 1024 * 1024)); // Use CHUNK_SIZE if available
        const chunkGroupId = `${modelId}/${fileName}`;
        return {
            id: `${chunkGroupId}:manifest`,
            type: 'manifest',
            chunkGroupId,
            fileName,
            folder: modelId,
            fileType,
            size,
            totalChunks,
            chunkSizeUsed: 10 * 1024 * 1024, // Use CHUNK_SIZE if available
            status: 'missing',
            addedAt: Date.now(),
        };
    });
    return { neededFileEntries, message: null };
}
async function getAllManifestEntries() {
    const db = await openModelCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('manifest', 'readonly');
        const store = tx.objectStore('manifest');
        const req = store.getAll();
        req.onsuccess = () => {
            resolve(req.result || []);
        };
        req.onerror = () => {
            reject(req.error);
        };
    });
}


/***/ }),

/***/ "./src/DB/idbSchema.ts":
/*!*****************************!*\
  !*** ./src/DB/idbSchema.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DBNames: () => (/* binding */ DBNames),
/* harmony export */   LogLevel: () => (/* binding */ LogLevel),
/* harmony export */   NodeType: () => (/* binding */ NodeType),
/* harmony export */   dbChannel: () => (/* binding */ dbChannel),
/* harmony export */   modelCacheSchema: () => (/* binding */ modelCacheSchema),
/* harmony export */   schema: () => (/* binding */ schema)
/* harmony export */ });
// idbSchema.ts
const DBNames = Object.freeze({
    DB_USER_DATA: 'TabAgentUserData',
    DB_LOGS: 'TabAgentLogs',
    DB_MODELS: 'TabAgentModels',
    DB_CHATS: 'TabAgentChats',
    DB_MESSAGES: 'TabAgentMessages',
    DB_EMBEDDINGS: 'TabAgentEmbeddings',
    DB_KNOWLEDGE_GRAPH_NODES: 'TabAgentKnowledgeGraphNodes',
    DB_KNOWLEDGE_GRAPH_EDGES: 'TabAgentKnowledgeGraphEdges',
    DB_CHAT_SUMMARIES: 'TabAgentChatSummaries',
    DB_ATTACHMENTS: 'TabAgentAttachments',
});
var NodeType;
(function (NodeType) {
    NodeType["Chat"] = "chat";
    NodeType["Message"] = "message";
    NodeType["Embedding"] = "embedding";
    NodeType["Attachment"] = "attachment";
    NodeType["Summary"] = "summary";
})(NodeType || (NodeType = {}));
var LogLevel;
(function (LogLevel) {
    LogLevel["Info"] = "info";
    LogLevel["Log"] = "log";
    LogLevel["Warn"] = "warn";
    LogLevel["Error"] = "error";
    LogLevel["Debug"] = "debug";
})(LogLevel || (LogLevel = {}));
const schema = {
    [DBNames.DB_USER_DATA]: {
        version: 2,
        stores: {
            [DBNames.DB_CHATS]: {
                keyPath: 'id',
                indexes: [{ name: 'chat_timestamp', keyPath: 'chat_timestamp' }, { name: 'user_id', keyPath: 'user_id' }]
            },
            [DBNames.DB_MESSAGES]: {
                keyPath: 'id',
                indexes: [{ name: 'chat_id', keyPath: 'chat_id' }, { name: 'timestamp', keyPath: 'timestamp' }]
            },
            [DBNames.DB_EMBEDDINGS]: {
                keyPath: 'id',
                indexes: [{ name: 'input', keyPath: 'input', unique: false }, { name: 'model', keyPath: 'model', unique: false }]
            },
            [DBNames.DB_KNOWLEDGE_GRAPH_NODES]: {
                keyPath: 'id',
                indexes: [{ name: 'type', keyPath: 'type', unique: false }, { name: 'label', keyPath: 'label', unique: false }, { name: 'embedding_id', keyPath: 'embedding_id', unique: false }]
            },
            [DBNames.DB_KNOWLEDGE_GRAPH_EDGES]: {
                keyPath: 'id',
                indexes: [{ name: 'from_node_id', keyPath: 'from_node_id', unique: false }, { name: 'to_node_id', keyPath: 'to_node_id', unique: false }, { name: 'edge_type', keyPath: 'edge_type', unique: false }]
            },
            [DBNames.DB_ATTACHMENTS]: {
                keyPath: 'id',
                indexes: [{ name: 'message_id', keyPath: 'message_id' }]
            },
            [DBNames.DB_CHAT_SUMMARIES]: {
                keyPath: 'id',
                indexes: [{ name: 'chat_id', keyPath: 'chat_id' }, { name: 'created_at', keyPath: 'created_at' }]
            },
        }
    },
    [DBNames.DB_LOGS]: {
        version: 1,
        stores: { [DBNames.DB_LOGS]: { keyPath: 'id', indexes: [{ name: 'timestamp', keyPath: 'timestamp' }, { name: 'level', keyPath: 'level' }] } }
    },
};
const dbChannel = new BroadcastChannel('tabagent-db');
const modelCacheSchema = {
    [DBNames.DB_MODELS]: {
        version: 2,
        stores: {
            files: {
                keyPath: 'url', // or just use the URL as the key
                indexes: [] // No indexes needed for simple file storage
            },
            manifest: {
                keyPath: 'repo', // repo name as the key
                indexes: [] // No indexes needed for now
            }
        }
    }
};


/***/ }),

/***/ "./src/DB/idbSummary.ts":
/*!******************************!*\
  !*** ./src/DB/idbSummary.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Summary: () => (/* binding */ Summary)
/* harmony export */ });
/* harmony import */ var _idbBase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./idbBase */ "./src/DB/idbBase.ts");
/* harmony import */ var _idbSchema__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _dbActions__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dbActions */ "./src/DB/dbActions.ts");
// idbSummary.ts



class Summary extends _idbBase__WEBPACK_IMPORTED_MODULE_0__.BaseCRUD {
    constructor(id, chat_id, summary_text, dbWorker, created_at, updated_at, options = {}) {
        super(id, summary_text, dbWorker);
        this.parent_summary_id = null;
        this.start_message_id = null;
        this.end_message_id = null;
        this.chat_id = chat_id;
        this.summary_text = summary_text;
        this.created_at = created_at;
        this.updated_at = updated_at;
        this.message_ids = options.message_ids || [];
        this.parent_summary_id = options.parent_summary_id === undefined ? null : options.parent_summary_id;
        this.start_message_id = options.start_message_id === undefined ? null : options.start_message_id;
        this.end_message_id = options.end_message_id === undefined ? null : options.end_message_id;
        this.start_timestamp = options.start_timestamp;
        this.end_timestamp = options.end_timestamp;
        this.token_count = options.token_count;
        this.metadata_json = options.metadata ? JSON.stringify(options.metadata) : undefined;
        this.embedding_id = options.embedding_id;
    }
    static async create(chat_id, summary_text, dbWorker, options = {}) {
        const id = options.id || crypto.randomUUID();
        const now = Date.now();
        const summaryInstance = new Summary(id, chat_id, summary_text, dbWorker, now, now, options);
        return summaryInstance.saveToDB();
    }
    get metadata() {
        try {
            return this.metadata_json ? JSON.parse(this.metadata_json) : undefined;
        }
        catch (e) {
            console.error(`Failed to parse summary metadata_json for summary ${this.id}:`, e);
            return undefined;
        }
    }
    set metadata(data) {
        this.metadata_json = data ? JSON.stringify(data) : undefined;
    }
    static async read(id, dbWorker) {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && event.data.result) {
                        const sd = event.data.result;
                        resolve(new Summary(sd.id, sd.chat_id, sd.summary_text, dbWorker, sd.created_at, sd.updated_at, { message_ids: sd.message_ids, parent_summary_id: sd.parent_summary_id, start_message_id: sd.start_message_id, end_message_id: sd.end_message_id, start_timestamp: sd.start_timestamp, end_timestamp: sd.end_timestamp, token_count: sd.token_count, metadata: sd.metadata_json ? JSON.parse(sd.metadata_json) : undefined, embedding_id: sd.embedding_id }));
                    }
                    else if (event.data.success && !event.data.result) {
                        resolve(undefined);
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to get summary (id: ${id})`));
                    }
                }
            };
            dbWorker.addEventListener('message', handleMessage);
            dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.GET, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_CHAT_SUMMARIES, id], requestId });
            setTimeout(() => { dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout getting summary ${id}`)); }, 5000);
        });
    }
    async update(updates) {
        const { id, chat_id, created_at, dbWorker, ...allowedUpdates } = updates;
        if (allowedUpdates.metadata && typeof allowedUpdates.metadata === 'object') {
            this.metadata = allowedUpdates.metadata;
            delete allowedUpdates.metadata;
        }
        Object.assign(this, allowedUpdates);
        await this.saveToDB();
    }
    async delete() {
        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success) {
                        resolve();
                    }
                    else {
                        reject(new Error(event.data.error || `Failed to delete summary (id: ${this.id})`));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({ action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.DELETE, payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_CHAT_SUMMARIES, this.id], requestId });
            setTimeout(() => { this.dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout deleting summary ${this.id}`)); }, 5000);
        });
    }
    async saveToDB() {
        const requestId = crypto.randomUUID();
        const now = Date.now();
        this.updated_at = now;
        if (!this.created_at) {
            this.created_at = now;
        }
        const { dbWorker, ...summaryData } = this;
        return new Promise((resolve, reject) => {
            const handleMessage = (event) => {
                if (event.data && event.data.requestId === requestId) {
                    this.dbWorker.removeEventListener('message', handleMessage);
                    if (event.data.success && typeof event.data.result === 'string') {
                        resolve(event.data.result);
                    }
                    else if (event.data.success) {
                        reject(new Error('Summary saved, but worker did not return valid ID.'));
                    }
                    else {
                        reject(new Error(event.data.error || 'Failed to save summary'));
                    }
                }
            };
            this.dbWorker.addEventListener('message', handleMessage);
            this.dbWorker.postMessage({
                action: _dbActions__WEBPACK_IMPORTED_MODULE_2__.DBActions.PUT,
                payload: [_idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_USER_DATA, _idbSchema__WEBPACK_IMPORTED_MODULE_1__.DBNames.DB_CHAT_SUMMARIES, summaryData],
                requestId
            });
            setTimeout(() => { this.dbWorker.removeEventListener('message', handleMessage); reject(new Error(`Timeout saving summary ${this.id}`)); }, 5000);
        });
    }
}


/***/ }),

/***/ "./src/Home/chatRenderer.ts":
/*!**********************************!*\
  !*** ./src/Home/chatRenderer.ts ***!
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
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var _DB_idbSchema__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../DB/idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_4__);





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
        if (!chatBodyElement)
            return;
        chatBodyElement.innerHTML = '';
        if (messages.length === 0) {
            console.log(`[ChatRenderer handleMessagesUpdate] Active session ${currentSessionId} has no messages. Displaying welcome.`);
            displayWelcomeMessage();
        }
        else {
            messages.forEach((msg) => renderSingleMessage(msg));
            scrollToBottom();
        }
    }
}
function handleSessionMetadataUpdate(notification) {
    if (!notification || !notification.sessionId || !notification.payload?.session)
        return;
    if (notification.sessionId === currentSessionId) {
        const updatedSessionData = notification.payload.session;
        console.log(`[ChatRenderer] Received metadata update for active session ${currentSessionId}. New Title: ${updatedSessionData.title}, Starred: ${updatedSessionData.isStarred}`);
        updateChatHeader(updatedSessionData);
    }
}
document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbMessagesUpdatedNotification.type, (e) => {
    const customEvent = e;
    handleMessagesUpdate(customEvent.detail);
});
document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type, (e) => {
    const customEvent = e;
    handleSessionMetadataUpdate(customEvent.detail);
});
_DB_idbSchema__WEBPACK_IMPORTED_MODULE_3__.dbChannel.onmessage = (event) => {
    console.log('[ChatRenderer] dbChannel event received:', event.data);
    const message = event.data;
    const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
    const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
    console.log(`[ChatRenderer] dbChannel.onmessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
    const type = message?.type;
    if (type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbMessagesUpdatedNotification.type) {
        handleMessagesUpdate(message.payload);
    }
    if (type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type) {
        handleSessionMetadataUpdate(message.payload);
    }
};
// If browser.runtime.onMessage is used for notifications, add a similar log
if (typeof (webextension_polyfill__WEBPACK_IMPORTED_MODULE_4___default()) !== 'undefined' && (webextension_polyfill__WEBPACK_IMPORTED_MODULE_4___default().runtime) && (webextension_polyfill__WEBPACK_IMPORTED_MODULE_4___default().runtime).onMessage) {
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_4___default().runtime.onMessage.addListener((message) => {
        const payloadKeys = message && message.payload ? Object.keys(message.payload) : [];
        const sessionId = message.sessionId || (message.payload && message.payload.session && message.payload.session.id) || 'N/A';
        console.log(`[ChatRenderer] browser.runtime.onMessage: type=${message.type}, sessionId=${sessionId}, payloadKeys=[${payloadKeys.join(', ')}]`);
        const type = message?.type;
        if (type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbMessagesUpdatedNotification.type) {
            handleMessagesUpdate(message.payload);
        }
        if (type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbSessionUpdatedNotification.type) {
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
    }
    else {
        console.log(`[ChatRenderer] Proactively loading messages for new session: ${sessionId}`);
        loadAndRenderMessages(sessionId);
    }
}
function displayWelcomeMessage() {
    if (!chatBodyElement)
        return;
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
            if (chatBodyElement) {
                chatBodyElement.scrollTop = chatBodyElement.scrollHeight;
            }
        });
    }
}
async function loadAndRenderMessages(sessionId) {
    if (!requestDbAndWaitFunc) {
        console.error("[ChatRenderer] Cannot load messages: requestDbAndWait function not available.");
        if (chatBodyElement)
            chatBodyElement.innerHTML = '<div class="p-4 text-red-500">Error: Cannot load chat messages.</div>';
        return;
    }
    if (!sessionId) {
        console.warn("[ChatRenderer] loadAndRenderMessages called with null sessionId. Displaying welcome.");
        displayWelcomeMessage();
        return;
    }
    console.log(`[ChatRenderer] Requesting messages for session ${sessionId}...`);
    try {
        const request = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbGetSessionRequest(sessionId);
        const sessionData = await requestDbAndWaitFunc(request);
        if (sessionData && sessionData.messages) {
            console.log(`[ChatRenderer] Received ${sessionData.messages.length} messages for ${sessionId}. Rendering.`);
            if (chatBodyElement)
                chatBodyElement.innerHTML = '';
            if (sessionData.messages.length === 0) {
                displayWelcomeMessage();
            }
            else {
                sessionData.messages.forEach((msg) => renderSingleMessage(msg));
                scrollToBottom();
            }
        }
        else {
            console.warn(`[ChatRenderer] No messages found in session data for ${sessionId}. Displaying welcome.`, sessionData);
            displayWelcomeMessage();
        }
    }
    catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__.showError)(`Failed to load chat: ${errMsg}`);
        if (chatBodyElement)
            chatBodyElement.innerHTML = `<div class="p-4 text-red-500">Failed to load chat: ${errMsg}</div>`;
    }
}
function updateChatHeader(sessionData) {
    if (!sessionData) {
        console.log('[ChatRenderer] Clearing chat header (no active session).');
    }
    else {
        console.log(`[ChatRenderer] Updating chat header for ${sessionData.id}. Title: ${sessionData.title}, Starred: ${sessionData.isStarred}`);
    }
}
function renderSingleMessage(msg) {
    if (!chatBodyElement)
        return;
    console.log('[ChatRenderer] renderSingleMessage: msg object:', JSON.parse(JSON.stringify(msg)));
    // Prefer content over text for display
    let displayContent = (typeof msg.content === 'string' && msg.content.trim() !== '') ? msg.content : msg.text;
    console.log(`[ChatRenderer] renderSingleMessage: Using displayContent:`, displayContent, ' (from', (msg.content ? 'content' : 'text'), ')');
    // Parse metadata for type detection
    let meta = {};
    try {
        meta = typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {});
    }
    catch {
        console.error('[ChatRenderer] Error parsing metadata for message:', msg.messageId);
    }
    const extraction = meta.extraction;
    const isPageExtractor = (meta.extractionType === 'PageExtractor') || (extraction && extraction.__type === 'PageExtractor');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('flex', 'mb-2');
    messageDiv.id = msg.messageId || `msg-fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    const bubbleDiv = document.createElement('div');
    bubbleDiv.classList.add('rounded-lg', 'break-words', 'relative', 'group', 'p-2', 'min-w-0');
    if (msg.sender !== _events_eventNames__WEBPACK_IMPORTED_MODULE_2__.MessageSenderTypes.USER) {
        bubbleDiv.classList.add('max-w-4xl');
    }
    // Actions container (copy/download) as before
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container absolute top-1 right-1 transition-opacity flex space-x-1 z-10';
    const copyButton = document.createElement('button');
    copyButton.innerHTML = '<img src="icons/copy.svg" alt="Copy" class="w-4 h-4">';
    copyButton.title = 'Copy message text';
    copyButton.onclick = () => {
        let textToCopy = displayContent;
        if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
            textToCopy = JSON.stringify(msg.metadata.scrapeData, null, 2);
        }
        navigator.clipboard.writeText(textToCopy).then(() => {
            window.originalUITooltipController?.showTooltip(copyButton, 'Copied!');
        }).catch((err) => console.error('Failed to copy text: ', err));
    };
    actionsContainer.appendChild(copyButton);
    if (msg.metadata?.type === 'scrape_result_full' && msg.metadata.scrapeData) {
        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '<img src="icons/download.svg" alt="Download" class="w-4 h-4">';
        downloadButton.title = 'Download scrape data as JSON';
        downloadButton.onclick = () => {
            console.log('Download clicked for:', msg.metadata.scrapeData); // Placeholder
            window.originalUITooltipController?.showTooltip(downloadButton, 'Download (placeholder)');
        };
        actionsContainer.appendChild(downloadButton);
    }
    // IMPORTANT: Append actionsContainer AFTER main content is set, or ensure it's not overwritten.
    // For now, we will append it after other content elements are added to bubbleDiv.
    let contentToParse = displayContent || '';
    let specialHeaderHTML = '';
    // --- Special handling for PageExtractor results ---
    if (isPageExtractor && extraction) {
        specialHeaderHTML = `<div class="scrape-header p-2 rounded-t-md bg-gray-200 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600 mb-1"><h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Scraped Page Extraction</h4><p class="text-xs text-gray-500 dark:text-gray-400 break-all">URL: ${extraction.url || 'N/A'}</p></div>`;
        contentToParse = '```json\n' + JSON.stringify(extraction, null, 2) + '\n```';
        console.log('[ChatRenderer] Rendering PageExtractor JSON:', contentToParse);
    }
    else if (displayContent) {
        console.log('[ChatRenderer] Preparing to parse regular message. Input to marked:', contentToParse);
    }
    console.log(`[ChatRenderer] Before style application: msg.sender = ${msg.sender}`);
    // Apply sender-specific alignment and base bubble styling
    if (msg.isLoading) {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'italic', 'border', 'border-gray-300', 'dark:border-gray-500');
    }
    else if (msg.sender === _events_eventNames__WEBPACK_IMPORTED_MODULE_2__.MessageSenderTypes.USER) {
        messageDiv.classList.add('justify-end', 'min-w-0');
        bubbleDiv.classList.add('bg-[rgba(236,253,245,0.51)]', // very subtle green tint
        'dark:bg-[rgba(20,83,45,0.12)]', // subtle dark green tint for dark mode
        'text-green-900', 'dark:text-green-100', 'border', 'border-green-100', 'dark:border-green-900');
    }
    else if (msg.sender === 'error') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-[rgba(254,226,226,0.37)]', // subtle red tint (light)
        'dark:bg-[rgba(120,20,20,0.12)]', // subtle red tint (dark)
        'text-red-700', 'dark:text-red-200', 'border', 'border-red-200', 'dark:border-red-700');
    }
    else if (msg.sender === 'system') {
        messageDiv.classList.add('justify-start');
        bubbleDiv.classList.add('bg-[rgba(219,234,254,0.5)]', // subtle blue tint
        'dark:bg-[rgba(30,41,59,0.2)]', // subtle dark blue/gray for dark mode
        'text-blue-900', 'dark:text-blue-100', 'border', 'border-blue-100', 'dark:border-blue-900');
    }
    else { // Default for 'ai' or other non-user/non-error/non-system senders
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
                if (typeof str !== 'string')
                    return '';
                return str.replace(/[&<>"'/]/g, function (match) {
                    return {
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;',
                        '"': '&quot;',
                        "'": '&#39;',
                        '/': '&#x2F;'
                    }[match] || '';
                });
            };
            // ONLY override the .code() method for now
            localRenderer.code = (tokenOrCode, languageInfoString, isEscaped) => {
                // Log what we receive
                console.log('[ChatRenderer Custom Code] Received arguments:', {
                    tokenOrCode_type: typeof tokenOrCode,
                    tokenOrCode_value: JSON.parse(JSON.stringify(tokenOrCode)), // Deep copy for logging
                    languageInfoString_type: typeof languageInfoString,
                    languageInfoString_value: languageInfoString,
                    isEscaped_value: isEscaped
                });
                let actualCodeString = '';
                let actualLanguageString = languageInfoString || '';
                // let actuallyEscaped = isEscaped; // Not directly used with hljs which expects raw code
                if (typeof tokenOrCode === 'object' && tokenOrCode !== null && typeof tokenOrCode.text === 'string') {
                    actualCodeString = tokenOrCode.text;
                    actualLanguageString = tokenOrCode.lang || actualLanguageString;
                    // actuallyEscaped = typeof tokenOrCode.escaped === 'boolean' ? tokenOrCode.escaped : isEscaped;
                    console.log('[ChatRenderer Custom Code] Interpreted as token object. Using token.text and token.lang.');
                }
                else if (typeof tokenOrCode === 'string') {
                    actualCodeString = tokenOrCode;
                    console.log('[ChatRenderer Custom Code] Interpreted as direct code string.');
                }
                else {
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
                    // highlight expects raw, unescaped code.
                    // actualCodeString should be raw based on Marked default behavior without sanitize: true
                    if (actualLanguageString && window.hljs.getLanguage(actualLanguageString)) {
                        try {
                            highlightedCodeForDisplay = window.hljs.highlight(actualCodeString, { language: actualLanguageString, ignoreIllegals: true }).value;
                            console.log('[ChatRenderer Custom Code] Highlighted with specified language:', actualLanguageString);
                        }
                        catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlight error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    }
                    else {
                        try {
                            const autoResult = window.hljs.highlightAuto(actualCodeString);
                            highlightedCodeForDisplay = autoResult.value;
                            const detectedLang = autoResult.language;
                            console.log('[ChatRenderer Custom Code] Highlighted with auto-detection. Detected:', detectedLang);
                            if (detectedLang) { // If auto-detection was successful
                                safeLanguage = escapeHtmlEntities(detectedLang);
                                langClass = `language-${safeLanguage}`; // Update based on detected language
                            }
                        }
                        catch (e) {
                            console.error('[ChatRenderer Custom Code] hljs.highlightAuto error:', e);
                            highlightedCodeForDisplay = escapeHtmlEntities(actualCodeString);
                        }
                    }
                }
                else {
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
            // Let Marked use its defaults for these.
            const parsedContent = window.marked.parse(contentToParse || '', {
                renderer: localRenderer, // Use the renderer with only .code overridden
                gfm: true,
                breaks: true
            });
            console.log('[ChatRenderer Minimal Custom Marked.parse() output:]', parsedContent);
            mainContentDiv.innerHTML = parsedContent;
            if (window.hljs) {
                console.log('[ChatRenderer] Content set. highlight should have processed via Marked config.');
            }
        }
        catch (e) {
            console.error('Error during marked.parse:', e);
            mainContentDiv.textContent = contentToParse || '';
        }
    }
    else {
        console.warn('Marked not available. Falling back to textContent.');
        mainContentDiv.textContent = contentToParse || '';
    }
    // FOLDOUT LOGIC
    let expanded = true;
    foldoutBtn.onclick = () => {
        expanded = !expanded;
        mainContentDiv.style.display = expanded ? '' : 'none';
        // Rotate chevron
        const svg = foldoutBtn.querySelector('.chevron-icon');
        if (svg)
            svg.style.transform = expanded ? 'rotate(0deg)' : 'rotate(-90deg)';
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
    if (!chatBodyElement)
        return;
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
    if (!chatBodyElement)
        return;
    console.log("[ChatRenderer] Clearing temporary status messages.");
    const tempMessages = chatBodyElement.querySelectorAll(`.${TEMP_MESSAGE_CLASS}`);
    tempMessages.forEach((msg) => msg.remove());
}
// --- END: Temporary Message Functions ---
function initializeObserver() {
    if (observer)
        observer.disconnect(); // Disconnect previous observer if any
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
            if (!target)
                return;
            if (target.classList.contains('code-action-copy-snippet')) {
                const codeToCopy = target.dataset.code;
                if (codeToCopy) {
                    try {
                        await navigator.clipboard.writeText(decodeURIComponent(codeToCopy));
                        window.originalUITooltipController?.showTooltip(target, 'Code Copied!');
                    }
                    catch (err) {
                        console.error('Failed to copy code snippet:', err);
                        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__.showError)('Failed to copy code snippet.');
                    }
                }
            }
            else if (target.classList.contains('code-action-download-snippet')) {
                const codeToDownload = target.dataset.code;
                const lang = target.dataset.lang || 'txt';
                const filename = `snippet.${lang}`;
                if (codeToDownload) {
                    try {
                        downloadFile(filename, decodeURIComponent(codeToDownload), getMimeType(lang));
                        window.originalUITooltipController?.showTooltip(target, 'Downloading...');
                    }
                    catch (err) {
                        console.error('Failed to download code snippet:', err);
                        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__.showError)('Failed to download code snippet.');
                    }
                }
            }
        });
        console.log("[ChatRenderer] Event listeners for code block actions (copy/download) added to chatBody.");
    }
    else {
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

/***/ "./src/Home/fileHandler.ts":
/*!*********************************!*\
  !*** ./src/Home/fileHandler.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   handleAttachClick: () => (/* binding */ handleAttachClick),
/* harmony export */   handleFileSelected: () => (/* binding */ handleFileSelected),
/* harmony export */   initializeFileHandling: () => (/* binding */ initializeFileHandling)
/* harmony export */ });
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _uiController__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./uiController */ "./src/Home/uiController.ts");



let getActiveSessionIdFunc = null;
function initializeFileHandling(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    if (!getActiveSessionIdFunc) {
        console.error("FileHandler: Missing getActiveSessionIdFunc dependency!");
    }
    else {
        console.log("[FileHandler] Initialized (Note: DB/Renderer interaction via events assumed).");
    }
}
async function handleFileSelected(event) {
    if (!getActiveSessionIdFunc) {
        console.error("FileHandler: Not initialized properly (missing getActiveSessionIdFunc).");
        return;
    }
    const input = event.target;
    const files = input.files;
    if (!files || files.length === 0) {
        console.log("FileHandler: No file selected.");
        return;
    }
    const file = files[0];
    console.log(`FileHandler: File selected - ${file.name}, Type: ${file.type}, Size: ${file.size}`);
    const sessionId = getActiveSessionIdFunc();
    if (!sessionId) {
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__.showError)("Please start or select a chat before attaching a file.");
        input.value = '';
        return;
    }
    const fileMessage = {
        sender: 'system',
        text: `📎 Attached file: ${file.name}`,
        timestamp: Date.now(),
        isLoading: false,
    };
    try {
        const request = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageRequest(sessionId, fileMessage);
        eventBus.publish(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbAddMessageRequest.type, request);
        console.log("[FileHandler] Published DbAddMessageRequest for file attachment.");
    }
    catch (error) {
        console.error("FileHandler: Error publishing file attachment message event:", error);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_0__.showError)("Failed to process file attachment.");
    }
    finally {
        input.value = '';
    }
}
function handleAttachClick() {
    console.log("FileHandler: Triggering file input click.");
    (0,_uiController__WEBPACK_IMPORTED_MODULE_2__.triggerFileInputClick)();
}


/***/ }),

/***/ "./src/Home/messageOrchestrator.ts":
/*!*****************************************!*\
  !*** ./src/Home/messageOrchestrator.ts ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeOrchestrator: () => (/* binding */ initializeOrchestrator)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _sidepanel__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../sidepanel */ "./src/sidepanel.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _chatRenderer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./chatRenderer */ "./src/Home/chatRenderer.ts");
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");






let getActiveSessionIdFunc = null;
let onSessionCreatedCallback = null;
let getCurrentTabIdFunc = null;
let isSendingMessage = false; // TODO: Remove this and rely on status check via DB event
function requestDbAndWait(requestEvent) {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const result = await (0,_sidepanel__WEBPACK_IMPORTED_MODULE_2__.sendDbRequestSmart)(requestEvent);
                console.log('[Trace][sidepanel] requestDbAndWait: Raw result', result);
                const response = Array.isArray(result) ? result[0] : result;
                if (response && (response.success || response.error === undefined)) {
                    resolve(response.data || response.payload);
                }
                else {
                    reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
                }
            }
            catch (error) {
                reject(error);
            }
        })();
    });
}
/**
 * Fetches the full chat history for a session and formats it for the model worker.
 * Only includes user and ai messages, mapping sender to role.
 * @param sessionId The chat session ID
 * @returns Promise<Array<{role: string, content: string}>>
 */
async function getChatHistoryForModel(sessionId) {
    const sessionData = await requestDbAndWait(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbGetSessionRequest(sessionId));
    if (!sessionData || !Array.isArray(sessionData.messages))
        return [];
    return sessionData.messages
        .filter((m) => m.sender === 'user' || m.sender === 'ai')
        .map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text || m.content || ''
    }));
}
async function handleQuerySubmit(data) {
    const { text } = data;
    console.log(`[Orchestrator: handleQuerySubmit] received event with text: "${text}"`);
    if (isSendingMessage) {
        console.warn("[Orchestrator handleQuerySubmit]: Already processing a previous submission.");
        return;
    }
    isSendingMessage = true;
    let sessionId = getActiveSessionIdFunc ? getActiveSessionIdFunc() : null;
    const currentTabId = getCurrentTabIdFunc ? getCurrentTabIdFunc() : null;
    let placeholderMessageId = null;
    console.log(`[Orchestrator: handleQuerySubmit] Processing submission. Text: "${text}". Session: ${sessionId}`);
    const isURL = _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.URL_REGEX.test(text);
    try {
        (0,_chatRenderer__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
        const userMessage = { sender: 'user', text: text, timestamp: Date.now(), isLoading: false };
        if (!sessionId) {
            console.log("[Orchestrator: handleQuerySubmit] No active session, creating new one via event.");
            const createRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbCreateSessionRequest(userMessage);
            const createResponse = await requestDbAndWait(createRequest);
            sessionId = createResponse.newSessionId;
            if (onSessionCreatedCallback) {
                onSessionCreatedCallback(sessionId);
            }
            else {
                console.error("[Orchestrator: handleQuerySubmit] onSessionCreatedCallback is missing!");
                throw new Error("Configuration error: Cannot notify about new session.");
            }
        }
        else {
            console.log(`[Orchestrator: handleQuerySubmit] Adding user message to existing session ${sessionId} via event.`);
            (0,_chatRenderer__WEBPACK_IMPORTED_MODULE_4__.clearTemporaryMessages)();
            const addRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, userMessage);
            await requestDbAndWait(addRequest);
        }
        console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'processing' via event`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'processing');
        await requestDbAndWait(statusRequest);
        let placeholder;
        if (isURL) {
            placeholder = { sender: 'system', text: `⏳ Scraping ${text}...`, timestamp: Date.now(), isLoading: true };
        }
        else {
            placeholder = { sender: 'ai', text: 'Thinking...', timestamp: Date.now(), isLoading: true };
        }
        console.log(`[Orchestrator: handleQuerySubmit] Adding placeholder to session ${sessionId} via event.`);
        const addPlaceholderRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbAddMessageRequest(sessionId, placeholder);
        const placeholderResponse = await requestDbAndWait(addPlaceholderRequest);
        console.log(`[Orchestrator: handleQuerySubmit] Placeholder response:`, placeholderResponse);
        placeholderMessageId = placeholderResponse.newMessageId;
        if (typeof placeholderMessageId !== 'string' && placeholderMessageId && placeholderMessageId.newMessageId) {
            placeholderMessageId = placeholderMessageId.newMessageId;
        }
        // Log the type and value for debugging
        if (typeof placeholderMessageId === 'string') {
            console.log(`[Orchestrator: handleQuerySubmit] placeholderMessageId (string):`, placeholderMessageId);
        }
        else {
            console.warn(`[Orchestrator: handleQuerySubmit] placeholderMessageId is not a string! Full value:`, placeholderMessageId);
        }
        if (isURL) {
            // Always send scrape request to background, let background decide how to scrape
            try {
                const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default().runtime.sendMessage({
                    type: _events_eventNames__WEBPACK_IMPORTED_MODULE_5__.RuntimeMessageTypes.SCRAPE_REQUEST,
                    payload: {
                        url: text,
                        chatId: sessionId,
                        messageId: placeholderMessageId,
                        tabId: currentTabId
                    }
                });
                console.log("[Orchestrator: handleQuerySubmit] SCRAPE_REQUEST sent to background.", response);
            }
            catch (error) {
                const errObj = error;
                console.error('[Orchestrator: handleQuerySubmit] Error sending SCRAPE_REQUEST:', errObj.message);
                const errorUpdateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, {
                    isLoading: false, sender: 'error', text: `Failed to initiate scrape: ${errObj.message}`
                });
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error:", e));
                requestDbAndWait(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error:", e));
                isSendingMessage = false;
            }
        }
        else {
            // Instead of sending to background, send directly to model worker
            console.log("[Orchestrator: handleQuerySubmit] Fetching full chat history for model worker.");
            let history = [];
            try {
                history = await getChatHistoryForModel(sessionId);
            }
            catch (e) {
                console.error('[Orchestrator: handleQuerySubmit] Failed to fetch chat history:', e);
                history = [{ role: 'user', content: text }]; // fallback
            }
            const messagePayload = {
                chatId: sessionId,
                messages: history,
                options: { /* model, temp, etc */},
                messageId: placeholderMessageId
            };
            try {
                (0,_sidepanel__WEBPACK_IMPORTED_MODULE_2__.sendToModelWorker)({ type: 'generate', payload: messagePayload });
                // No need to await a response here; model worker will post back via events
            }
            catch (error) {
                const errObj = error;
                console.error('[Orchestrator: handleQuerySubmit] Error sending query to model worker:', errObj);
                const errorText = errObj && typeof errObj.message === 'string' ? errObj.message : 'Unknown error during send/ack';
                const errorPayload = { isLoading: false, sender: 'error', text: `Failed to send query: ${errorText}` };
                const errorUpdateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, placeholderMessageId, errorPayload);
                requestDbAndWait(errorUpdateRequest).catch(e => console.error("Failed to update placeholder on send error (within catch):", e));
                requestDbAndWait(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on send error (within catch):", e));
                isSendingMessage = false; // Reset flag on send error
            }
        }
    }
    catch (error) {
        const errObj = error;
        console.error("[Orchestrator: handleQuerySubmit] Error processing query submission:", errObj);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error: ${errObj.message || errObj}`);
        if (sessionId) {
            console.log(`[Orchestrator: handleQuerySubmit] Setting session ${sessionId} status to 'error' due to processing failure via event`);
            requestDbAndWait(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error')).catch(e => console.error("Failed to set session status on processing error:", e));
        }
        else {
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
        const updateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundMsgResponse] Setting session ${chatId} status to 'idle' after response via event`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'idle');
        await requestDbAndWait(statusRequest);
    }
    catch (error) {
        const errObj = error;
        console.error(`[Orchestrator: handleBackgroundMsgResponse] Error handling background response for chat ${chatId}:`, errObj);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with response: ${errObj.message || errObj}`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on response processing error:", e));
    }
    finally {
        isSendingMessage = false; // TODO: Remove later
    }
}
async function handleBackgroundMsgError(message) {
    console.error(`[Orchestrator: handleBackgroundMsgError] Received error for chat ${message.chatId}, placeholder ${message.messageId}: ${message.error}`);
    (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Error processing request: ${message.error}`); // Show global error regardless
    const sessionId = getActiveSessionIdFunc ? getActiveSessionIdFunc() : null; // Get current session ID
    if (sessionId && message.chatId === sessionId && message.messageId) {
        // Only update DB if the error belongs to the *active* session and has a message ID
        console.log(`[Orchestrator: handleBackgroundMsgError] Attempting to update message ${message.messageId} in active session ${sessionId} with error.`);
        const errorPayload = { isLoading: false, sender: 'error', text: `Error: ${message.error}` };
        const errorUpdateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(sessionId, message.messageId, errorPayload);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error');
        try {
            await requestDbAndWait(errorUpdateRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Error message update successful for session ${sessionId}.`);
            await requestDbAndWait(statusRequest);
            console.log(`[Orchestrator: handleBackgroundMsgError] Session ${sessionId} status set to 'error'.`);
        }
        catch (dbError) {
            const dbErr = dbError;
            console.error('[Orchestrator: handleBackgroundMsgError] Error updating chat/status on background error:', dbErr);
            // Show a more specific UI error if DB update fails
            (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with error status: ${dbErr.message}`);
            // Attempt to set status to error even if message update failed
            try {
                await requestDbAndWait(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(sessionId, 'error'));
            }
            catch (statusError) {
                console.error('[Orchestrator: handleBackgroundMsgError] Failed to set session status on error handling error:', statusError);
            }
        }
    }
    else {
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
        // Use the main extracted content if available
        let mainContent = rest?.extraction?.content || rest?.content || rest?.title || 'Scrape complete.';
        updatePayload = {
            isLoading: false,
            sender: 'system',
            text: mainContent, // <-- Show main extracted content in UI
            content: mainContent, // <-- Also update content for UI rendering
            metadata: {
                type: 'scrape_result_full',
                scrapeData: rest // Put the full data here for the renderer
            }
        };
        finalStatus = 'idle';
    }
    else {
        // If a stage fails, update the message immediately with the error
        const errorText = error || `Scraping failed (Stage ${stage}). Unknown error.`;
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Scrape stage ${stage} failed for chat ${chatId}. Error: ${errorText}`);
        updatePayload = { isLoading: false, sender: 'error', text: `Scraping failed (Stage ${stage}): ${errorText}` };
        finalStatus = 'error';
    }
    // --- Update DB regardless of success/failure based on this stage result --- 
    try {
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updating message ${messageId} for stage ${stage} result.`);
        const updateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Updated placeholder ${messageId} with stage ${stage} result.`);
        // Also set final session status based on this stage outcome
        console.log(`[Orchestrator: handleBackgroundScrapeStage] Setting session ${chatId} status to '${finalStatus}' after stage ${stage} result via event`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    }
    catch (dbError) {
        const dbErr = dbError;
        console.error(`[Orchestrator: handleBackgroundScrapeStage] Failed to update DB after stage ${stage} result:`, dbErr);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with scrape result: ${dbErr.message || dbErr}`);
        // If DB update fails, maybe try setting status to error anyway?
        if (finalStatus !== 'error') {
            try {
                const fallbackStatusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
                await requestDbAndWait(fallbackStatusRequest);
            }
            catch (fallbackError) {
                console.error("Failed to set fallback error status:", fallbackError);
            }
        }
    }
    finally {
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
        // Use the main extracted content if available
        let mainContent = scrapeData?.extraction?.content || scrapeData?.content || scrapeData?.title || 'Scrape complete.';
        updatePayload.text = mainContent;
        updatePayload.content = mainContent; // <-- Also update content for UI rendering
        updatePayload.metadata = {
            type: 'scrape_result_full',
            scrapeData: scrapeData
        };
    }
    else {
        updatePayload.sender = 'error';
        updatePayload.text = `Scraping failed: ${error || 'Unknown error.'}`;
    }
    try {
        const updateRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateMessageRequest(chatId, messageId, updatePayload);
        await requestDbAndWait(updateRequest);
        const finalStatus = success ? 'idle' : 'error';
        console.log(`[Orchestrator: handleBackgroundDirectScrapeResult] Setting session ${chatId} status to '${finalStatus}' after direct scrape result via event`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, finalStatus);
        await requestDbAndWait(statusRequest);
    }
    catch (error) {
        const errObj = error;
        console.error(`[Orchestrator: handleBackgroundDirectScrapeResult] Error handling direct scrape result for chat ${chatId}:`, errObj);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_1__.showError)(`Failed to update chat with direct scrape result: ${errObj.message || errObj}`);
        const statusRequest = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_3__.DbUpdateStatusRequest(chatId, 'error');
        requestDbAndWait(statusRequest).catch(e => console.error("Failed to set session status on direct scrape processing error:", e));
    }
    finally {
        isSendingMessage = false; // TODO: Remove later
    }
}
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.QUERY_SUBMITTED, (e) => handleQuerySubmit(e.detail));
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, (e) => handleBackgroundMsgResponse(e.detail));
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_ERROR_RECEIVED, (e) => handleBackgroundMsgError(e.detail));
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, handleBackgroundScrapeStage);
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_5__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, handleBackgroundDirectScrapeResult);
function initializeOrchestrator(dependencies) {
    getActiveSessionIdFunc = dependencies.getActiveSessionIdFunc;
    onSessionCreatedCallback = (sessionId) => {
        console.log('[Orchestrator] onSessionCreatedCallback registered for sessionId:', sessionId);
        dependencies.onSessionCreatedCallback(sessionId);
    };
    getCurrentTabIdFunc = dependencies.getCurrentTabIdFunc;
    if (!getActiveSessionIdFunc || !onSessionCreatedCallback || !getCurrentTabIdFunc) {
        console.error("Orchestrator: Missing one or more dependencies during initialization!");
        return;
    }
    console.log("[Orchestrator] Initializing and subscribing to application events...");
    console.log("[Orchestrator] Event subscriptions complete.");
}


/***/ }),

/***/ "./src/Home/uiController.ts":
/*!**********************************!*\
  !*** ./src/Home/uiController.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AVAILABLE_MODELS: () => (/* binding */ AVAILABLE_MODELS),
/* harmony export */   adjustTextareaHeight: () => (/* binding */ adjustTextareaHeight),
/* harmony export */   checkInitialized: () => (/* binding */ checkInitialized),
/* harmony export */   clearInput: () => (/* binding */ clearInput),
/* harmony export */   focusInput: () => (/* binding */ focusInput),
/* harmony export */   getCurrentlySelectedModel: () => (/* binding */ getCurrentlySelectedModel),
/* harmony export */   getInputValue: () => (/* binding */ getInputValue),
/* harmony export */   getModelSelectorOptions: () => (/* binding */ getModelSelectorOptions),
/* harmony export */   initializeUI: () => (/* binding */ initializeUI),
/* harmony export */   normalizeQuant: () => (/* binding */ normalizeQuant),
/* harmony export */   onModelDropdownChange: () => (/* binding */ onModelDropdownChange),
/* harmony export */   setActiveSession: () => (/* binding */ setActiveSession),
/* harmony export */   triggerFileInputClick: () => (/* binding */ triggerFileInputClick),
/* harmony export */   updateQuantDropdown: () => (/* binding */ updateQuantDropdown)
/* harmony export */ });
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _chatRenderer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./chatRenderer */ "./src/Home/chatRenderer.ts");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _DB_idbSchema__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../DB/idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../DB/idbModel */ "./src/DB/idbModel.ts");







let queryInput, sendButton, chatBody, attachButton, fileInput, loadingIndicatorElement, newChatButton, modelLoadProgress;
let isInitialized = false;
let attachFileCallback = null;
let currentSessionId = null;
let modelSelectorDropdown = null;
let quantSelectorDropdown = null;
let loadModelButton = null;
let isLoadingModel = false; // Track loading state
let currentLoadId = null;
let lastSeenLoadId = null;
// Define available models (can be moved elsewhere later)
const AVAILABLE_MODELS = {
    // Model ID (value) : Display Name
    "HuggingFaceTB/SmolLM2-360M-Instruct": "SmolLM2-360M Instruct",
    "onnx-models/all-MiniLM-L6-v2-onnx": "MiniLM-L6-v2",
    // Add more models here as needed
};
document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbStatusUpdatedNotification.type, (e) => {
    const customEvent = e;
    console.log('[UIController] Received DbStatusUpdatedNotification: ', customEvent.detail);
    handleStatusUpdate(customEvent.detail);
});
// Add this at the top level to ensure UI progress bar updates
webextension_polyfill__WEBPACK_IMPORTED_MODULE_3___default().runtime.onMessage.addListener((message, sender, sendResponse) => {
    const type = message?.type;
    console.log('[UIController] browser.runtime.onMessage Received progress update: ', message.type, message.payload);
    if (message.type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbStatusUpdatedNotification.type) {
        handleStatusUpdate(message.payload);
    }
    if (Object.values(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DBEventNames).includes(type)) {
        return false;
    }
});
_DB_idbSchema__WEBPACK_IMPORTED_MODULE_4__.dbChannel.onmessage = (event) => {
    const message = event.data;
    const type = message?.type;
    console.log('[UIController] dbChannel.onmessage Received progress update: ', message.type, message.payload);
    if (type === _DB_dbEvents__WEBPACK_IMPORTED_MODULE_1__.DbStatusUpdatedNotification.type) {
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
    modelLoadProgress = document.getElementById('model-load-progress');
    modelSelectorDropdown = document.getElementById('model-selector');
    quantSelectorDropdown = document.getElementById('onnx-variant-selector');
    loadModelButton = document.getElementById('load-model-button');
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
    modelSelectorDropdown?.addEventListener('change', _handleModelOrVariantChange);
    quantSelectorDropdown?.addEventListener('change', _handleModelOrVariantChange);
    loadModelButton?.addEventListener('click', _handleLoadModelButtonClick);
}
function removeListeners() {
    queryInput?.removeEventListener('input', adjustTextareaHeight);
    queryInput?.removeEventListener('keydown', handleEnterKey);
    sendButton?.removeEventListener('click', handleSendButtonClick);
    attachButton?.removeEventListener('click', handleAttachClick);
    modelSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    quantSelectorDropdown?.removeEventListener('change', _handleModelOrVariantChange);
    loadModelButton?.removeEventListener('click', _handleLoadModelButtonClick);
}
function handleEnterKey(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        const messageText = getInputValue();
        if (messageText && !queryInput.disabled) {
            console.log("[UIController] Enter key pressed. Publishing ui:querySubmitted");
            document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
            clearInput();
        }
        else {
            console.log("[UIController] Enter key pressed, but input is empty or disabled.");
        }
    }
}
function handleSendButtonClick() {
    const messageText = getInputValue();
    if (messageText && !queryInput.disabled) {
        console.log("[UIController] Send button clicked. Publishing ui:querySubmitted");
        document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.QUERY_SUBMITTED, { detail: { text: messageText } }));
        clearInput();
    }
    else {
        console.log("[UIController] Send button clicked, but input is empty or disabled.");
    }
}
function handleAttachClick() {
    if (attachFileCallback) {
        attachFileCallback();
    }
}
// In uiController.ts, add this new exported function:
function getModelSelectorOptions() {
    if (!modelSelectorDropdown)
        return [];
    return Array.from(modelSelectorDropdown.options).map(opt => opt.value).filter(Boolean);
}
function adjustTextareaHeight() {
    if (!queryInput)
        return;
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
    if (!isInitialized || !queryInput || !sendButton)
        return;
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
function handleStatusUpdate(notification) {
    if (!isInitialized || !notification || !notification.sessionId || !notification.payload)
        return;
    if (notification.sessionId === currentSessionId) {
        setInputStateInternal(notification.payload.status || 'idle');
    }
}
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_WORKER_LOADING_PROGRESS, (e) => {
    handleModelWorkerLoadingProgress(e.detail);
});
function handleModelWorkerLoadingProgress(payload) {
    if (!payload)
        return;
    // Double progress trigger detection
    if (payload.loadId !== lastSeenLoadId) {
        console.warn('[UIController] New loadId detected in progress:', payload.loadId);
        if (lastSeenLoadId) {
            console.error('[UIController] DOUBLE PROGRESS TRIGGER! Previous:', lastSeenLoadId, 'New:', payload.loadId);
        }
        lastSeenLoadId = payload.loadId;
    }
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    const progressBar = document.getElementById('model-load-progress-bar');
    const progressInner = document.getElementById('model-load-progress-inner');
    if (!statusDiv || !statusText || !progressBar || !progressInner) {
        console.warn('[UIController] Model load progress bar not found.');
        return;
    }
    statusDiv.style.display = 'block';
    progressBar.style.width = '100%';
    // Handle error
    if (payload.status === 'error' || payload.error) {
        statusText.textContent = payload.error || 'Error loading model';
        progressInner.style.background = '#f44336'; // red
        progressInner.style.width = '100%';
        isLoadingModel = false;
        if (loadModelButton) {
            loadModelButton.disabled = false;
            setLoadModelButtonText('Load Model');
        }
        enableInput();
        setTimeout(() => { statusDiv.style.display = 'none'; }, 1500);
        lastSeenLoadId = null;
        return;
    }
    let percent = payload.progress || payload.percent || 0;
    percent = Math.max(0, Math.min(100, percent));
    progressInner.style.width = percent + '%';
    progressInner.style.background = '#4caf50'; // green
    function formatBytes(bytes) {
        if (!bytes && bytes !== 0)
            return '';
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    function truncateFileName(name, maxLen = 32) {
        if (!name)
            return '';
        return name.length > maxLen ? name.slice(0, maxLen - 3) + '...' : name;
    }
    let text = '';
    let shortFile = payload.file ? truncateFileName(payload.file) : '';
    switch (payload.status) {
        case 'initiate':
            text = `Starting download: ${shortFile}`;
            break;
        case 'progress':
            text = `Downloading ${shortFile}`;
            if (typeof payload.loaded === 'number' && typeof payload.total === 'number') {
                text += `... ${Math.round(percent)}% (${formatBytes(payload.loaded)} / ${formatBytes(payload.total)})`;
            }
            else {
                text += `... ${Math.round(percent)}%`;
            }
            break;
        case 'done':
            text = `${shortFile} downloaded. Preparing pipeline...`;
            break;
        case 'ready':
            text = `Model ready!`;
            break;
        default:
            text = 'Loading...';
    }
    statusText.textContent = text;
    if ((percent >= 100 || payload.status === 'done' || payload.status === 'ready') && !(payload.status === 'error' || payload.error)) {
        isLoadingModel = false;
        if (loadModelButton) {
            loadModelButton.disabled = false;
            setLoadModelButtonText('Load Model');
        }
        enableInput();
        setTimeout(() => { statusDiv.style.display = 'none'; }, 150);
        lastSeenLoadId = null;
    }
}
function getCurrentlySelectedModel() {
    if (!modelSelectorDropdown || !quantSelectorDropdown)
        return { modelId: null, quant: null };
    return {
        modelId: modelSelectorDropdown.value || null,
        quant: quantSelectorDropdown.value || null,
    };
}
function normalizeQuant(quantDisplay) {
    // Remove emoji and non-alphanumeric characters (except underscore)
    const cleaned = quantDisplay.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    const map = {
        'auto': 'auto',
        'fp32': 'fp32',
        'fp16': 'fp16',
        'int8': 'int8',
        'uint8': 'uint8',
        'q4': 'q4',
        'q4f16': 'q4f16',
        'bnb4': 'bnb4',
        'nf4': 'nf4',
    };
    return map[cleaned] || cleaned;
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
    newChatButton = document.getElementById('new-chat-button');
    if (newChatButton && callbacks?.onNewChat) {
        newChatButton.addEventListener('click', callbacks.onNewChat);
    }
    isInitialized = true;
    setInputStateInternal('idle');
    adjustTextareaHeight();
    console.log("[UIController] Initialized successfully.");
    console.log(`[UIController] Returning elements: chatBody is ${chatBody ? 'found' : 'NULL'}, fileInput is ${fileInput ? 'found' : 'NULL'}`);
    (0,_chatRenderer__WEBPACK_IMPORTED_MODULE_2__.clearTemporaryMessages)();
    disableInput("Download or load a model from dropdown to begin.");
    console.log("[UIController] Initializing UI elements...");
    console.log("[UIController] Attempting to find model selector...");
    const modelSelector = document.getElementById('model-selector');
    console.log(modelSelector ? "[UIController] Model selector found." : "[UIController] WARNING: Model selector NOT found!");
    if (modelSelector) {
        modelSelector.innerHTML = ''; // Clear existing options
        console.log("[UIController] Populating model selector. Available models:", AVAILABLE_MODELS);
        let hasModel = false;
        for (const [modelId, displayName] of Object.entries(AVAILABLE_MODELS)) {
            console.log(`[UIController] Adding option: ${displayName} (${modelId})`);
            const option = document.createElement('option');
            option.value = modelId;
            option.textContent = displayName;
            modelSelector.appendChild(option);
            hasModel = true;
        }
        if (!hasModel) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            option.selected = true;
            modelSelector.appendChild(option);
        }
        modelSelector.disabled = !hasModel;
        if (loadModelButton) {
            const loadBtn = loadModelButton;
            if (hasModel && modelSelector.value) {
                loadBtn.style.display = '';
                loadBtn.disabled = false;
            }
            else {
                loadBtn.style.display = 'none';
                loadBtn.disabled = true;
            }
            modelSelector.addEventListener('change', () => {
                if (loadModelButton) {
                    const loadBtn = loadModelButton;
                    if (modelSelector.value) {
                        loadBtn.style.display = '';
                        loadBtn.disabled = false;
                    }
                    else {
                        loadBtn.style.display = 'none';
                        loadBtn.disabled = true;
                    }
                }
            });
        }
    }
    else {
        console.warn("[UIController] Model selector dropdown not found.");
        if (loadModelButton)
            loadModelButton.style.display = 'none';
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
function disableInput(reason = "Processing...") {
    if (!isInitialized || !queryInput || !sendButton)
        return;
    queryInput.disabled = true;
    queryInput.placeholder = reason;
    sendButton.disabled = true;
}
function enableInput() {
    if (!isInitialized || !queryInput || !sendButton)
        return;
    queryInput.disabled = false;
    queryInput.placeholder = "Ask Tab Agent...";
    sendButton.disabled = queryInput.value.trim() === '';
}
function _handleModelOrVariantChange() {
    if (!modelSelectorDropdown || !quantSelectorDropdown)
        return;
    const modelId = modelSelectorDropdown.value;
    const quant = quantSelectorDropdown.value;
    console.log(`[UIController] Model or variant changed by user. Dispatching ${_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_SELECTION_CHANGED}`, { modelId, quant });
    document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.MODEL_SELECTION_CHANGED, {
        detail: { modelId, quant }
    }));
}
function _handleLoadModelButtonClick() {
    if (!modelSelectorDropdown || !loadModelButton)
        return;
    const modelId = modelSelectorDropdown.value;
    if (!modelId) {
        console.warn("[UIController] Load Model button clicked, but no model selected.");
        return;
    }
    if (isLoadingModel)
        return;
    isLoadingModel = true;
    currentLoadId = Date.now().toString() + Math.random().toString(36).slice(2);
    const statusDiv = document.getElementById('model-load-status');
    if (statusDiv)
        statusDiv.style.display = 'block';
    disableInput("Loading model...");
    loadModelButton.disabled = true;
    setLoadModelButtonText('Loading...');
    const badge = document.getElementById('device-badge');
    if (badge)
        badge.style.display = 'none';
    const quantDropdown = document.getElementById('onnx-variant-selector');
    const quant = quantDropdown ? quantDropdown.value : '';
    document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.REQUEST_MODEL_EXECUTION, {
        detail: { modelId, quant, loadId: currentLoadId }
    }));
}
let repoQuantsCache = {};
async function updateQuantDropdown() {
    const modelDropdown = document.getElementById('model-selector');
    const quantDropdown = document.getElementById('onnx-variant-selector');
    if (!modelDropdown || !quantDropdown)
        return;
    // Get all manifest entries in one call
    const allManifests = await (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.getAllManifestEntries)();
    const modelRepos = getModelSelectorOptions();
    // Build the cache dictionary: repo → manifest data
    repoQuantsCache = {};
    for (const repo of modelRepos) {
        const manifestEntry = allManifests.find(entry => entry.repo === repo);
        if (manifestEntry) {
            repoQuantsCache[repo] = manifestEntry;
        }
    }
    // Now populate the quant dropdown based on currently selected repo
    populateQuantDropdownForSelectedRepo();
}
function populateQuantDropdownForSelectedRepo() {
    const modelDropdown = document.getElementById('model-selector');
    const quantDropdown = document.getElementById('onnx-variant-selector');
    const loadModelButton = document.getElementById('load-model-button');
    const statusDiv = document.getElementById('model-load-status');
    const statusText = document.getElementById('model-load-status-text');
    if (!modelDropdown || !quantDropdown)
        return;
    const selectedRepo = modelDropdown.value;
    if (!selectedRepo || !repoQuantsCache[selectedRepo]) {
        quantDropdown.innerHTML = '';
        quantDropdown.disabled = true;
        return;
    }
    const manifestEntry = repoQuantsCache[selectedRepo];
    // --- Save current selection ---
    const prevSelectedQuant = quantDropdown.value;
    // Clear the dropdown
    quantDropdown.innerHTML = '';
    // Check if any quant is unsupported
    const unsupported = Object.values(manifestEntry.quants).some(q => q.status === _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.Unsupported);
    if (unsupported) {
        // Show error message in status area
        if (statusDiv && statusText) {
            statusDiv.style.display = 'block';
            statusText.textContent = "This model's task is not supported by the current runtime.";
        }
        // Disable load button
        if (loadModelButton) {
            loadModelButton.disabled = true;
            setLoadModelButtonText('Unsupported');
            loadModelButton.style.opacity = '0.5';
            loadModelButton.style.cursor = 'not-allowed';
        }
        // Disable quant dropdown
        quantDropdown.disabled = true;
        return;
    }
    else {
        // Hide error if previously shown
        if (statusDiv && statusText) {
            statusDiv.style.display = 'none';
            statusText.textContent = '';
        }
        // Enable controls
        quantDropdown.disabled = false;
        if (loadModelButton) {
            loadModelButton.disabled = false;
            setLoadModelButtonText('Load Model');
            loadModelButton.style.opacity = '';
            loadModelButton.style.cursor = '';
        }
    }
    // Populate quant dropdown with options for selected repo
    for (const quant in manifestEntry.quants) {
        const option = document.createElement('option');
        option.value = quant;
        // Set status indicator
        let dot = '⚪'; // default gray
        switch (manifestEntry.quants[quant].status) {
            case _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.Downloaded:
                dot = '🟢';
                break;
            case _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.Available:
                dot = '🟡';
                break;
            case _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.Failed:
                dot = '🔴';
                break;
            case _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.NotFound:
            case _DB_idbModel__WEBPACK_IMPORTED_MODULE_5__.QuantStatus.Unavailable:
                dot = '⚪';
                break;
        }
        option.textContent = `${quant} ${dot}`;
        quantDropdown.appendChild(option);
    }
    // --- Restore previous selection if possible ---
    if (prevSelectedQuant && manifestEntry.quants[prevSelectedQuant]) {
        quantDropdown.value = prevSelectedQuant;
    }
}
document.getElementById('model-selector')?.addEventListener('change', onModelDropdownChange);
// Call this when model dropdown changes
function onModelDropdownChange() {
    populateQuantDropdownForSelectedRepo();
}
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === _events_eventNames__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.MANIFEST_UPDATED) {
        console.log(`[UIController] Received MANIFEST_UPDATED event. Updating quant dropdown.`);
        updateQuantDropdown();
    }
});
document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.WorkerEventNames.MANIFEST_UPDATED, () => {
    console.log(`[UIController] Received DOM MANIFEST_UPDATED event. Updating quant dropdown.`);
    updateQuantDropdown();
});
// Add this helper near the top, after loadModelButton is defined
function setLoadModelButtonText(text) {
    if (loadModelButton)
        loadModelButton.textContent = text;
}


/***/ }),

/***/ "./src/Utilities/dbChannels.ts":
/*!*************************************!*\
  !*** ./src/Utilities/dbChannels.ts ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   llmChannel: () => (/* binding */ llmChannel),
/* harmony export */   logChannel: () => (/* binding */ logChannel)
/* harmony export */ });
const llmChannel = new BroadcastChannel('tabagent-llm');
const logChannel = new BroadcastChannel('tabagent-logs');


/***/ }),

/***/ "./src/Utilities/downloadFormatter.ts":
/*!********************************************!*\
  !*** ./src/Utilities/downloadFormatter.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   downloadHtmlFile: () => (/* binding */ downloadHtmlFile),
/* harmony export */   formatChatToHtml: () => (/* binding */ formatChatToHtml)
/* harmony export */ });
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Formats a chat session object into a self-contained HTML string.
 * @param sessionData - The chat session object from the database.
 * @returns {string} - The generated HTML string.
 */
function formatChatToHtml(sessionData) {
    if (!sessionData)
        return '';
    const title = sessionData.title || 'Chat Session';
    const messagesHtml = (sessionData.messages || []).map((msg) => {
        const senderClass = msg.sender === _events_eventNames__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.USER ? 'user-message' : 'other-message';
        const senderLabel = msg.sender === _events_eventNames__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.USER ? 'You' : (msg.sender === _events_eventNames__WEBPACK_IMPORTED_MODULE_0__.MessageSenderTypes.AI ? 'Agent' : 'System');
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
 * @param htmlContent - The HTML string to download.
 * @param filename - The suggested filename (e.g., "chat_session.html").
 * @param onError - Optional callback function to handle errors.
 */
async function downloadHtmlFile(htmlContent, filename, onError) {
    try {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        console.log(`Initiating download for: ${filename} (prompting user)`);
        try {
            const downloadId = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });
            // Always revoke the URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            if (downloadId) {
                console.log(`Download initiated (or dialog opened) with ID: ${downloadId}`);
            }
            else {
                console.log("Download cancelled by user (no downloadId assigned).");
            }
        }
        catch (err) {
            setTimeout(() => URL.revokeObjectURL(url), 100);
            const message = err?.message || String(err);
            console.error("Download API error:", message);
            if (!message || !message.toLowerCase().includes('cancel')) {
                if (onError) {
                    onError(`Download failed: ${message || 'Unknown error'}`);
                }
                else {
                    console.error("No error handler provided for download failure.");
                    alert(`Download failed: ${message || 'Unknown error'}. Ensure extension has permissions.`);
                }
            }
            else {
                console.log("Download cancelled by user.");
            }
        }
    }
    catch (error) {
        console.error("Error creating blob or initiating download:", error);
        if (onError) {
            onError("An error occurred while preparing the download.");
        }
        else {
            console.error("No error handler provided for download preparation error.");
            alert("An error occurred while preparing the download.");
        }
    }
}


/***/ }),

/***/ "./src/Utilities/downloadUtils.ts":
/*!****************************************!*\
  !*** ./src/Utilities/downloadUtils.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initiateChatDownload: () => (/* binding */ initiateChatDownload)
/* harmony export */ });
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _downloadFormatter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./downloadFormatter */ "./src/Utilities/downloadFormatter.ts");


/**
 * Fetches, formats, and initiates the download for a chat session.
 * @param {string} sessionId - The ID of the session to download.
 * @param {Function} requestDbAndWaitFunc - The function to make DB requests.
 * @param {Function} showNotificationFunc - The function to display notifications.
 */
async function initiateChatDownload(sessionId, requestDbAndWaitFunc, showNotificationFunc) {
    if (!sessionId || !requestDbAndWaitFunc || !showNotificationFunc) {
        console.error("[initiateChatDownload] Failed: Missing sessionId, requestDbAndWaitFunc, or showNotificationFunc.");
        if (showNotificationFunc)
            showNotificationFunc("Download failed due to internal error.", 'error');
        return;
    }
    console.log(`[initiateChatDownload] Preparing download for: ${sessionId}`);
    showNotificationFunc("Preparing download...", 'info');
    try {
        const sessionData = await requestDbAndWaitFunc(new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_0__.DbGetSessionRequest(sessionId));
        if (!sessionData) {
            throw new Error("Chat session data not found.");
        }
        const htmlContent = (0,_downloadFormatter__WEBPACK_IMPORTED_MODULE_1__.formatChatToHtml)(sessionData);
        const safeTitle = (sessionData.title || sessionData.name || 'Chat_Session').replace(/[^a-z0-9_\-.]/gi, '_').replace(/_{2,}/g, '_');
        const filename = `${safeTitle}_${sessionId.substring(0, 8)}.html`;
        (0,_downloadFormatter__WEBPACK_IMPORTED_MODULE_1__.downloadHtmlFile)(htmlContent, filename, (errorMessage) => {
            showNotificationFunc(errorMessage, 'error');
        });
    }
    catch (error) {
        console.error(`[initiateChatDownload] Error preparing download for ${sessionId}:`, error);
        let message = 'Unknown error';
        if (error instanceof Error)
            message = error.message;
        showNotificationFunc(`Failed to prepare download: ${message}`, 'error');
    }
}


/***/ }),

/***/ "./src/Utilities/generalUtils.ts":
/*!***************************************!*\
  !*** ./src/Utilities/generalUtils.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   URL_REGEX: () => (/* binding */ URL_REGEX),
/* harmony export */   debounce: () => (/* binding */ debounce),
/* harmony export */   getActiveTab: () => (/* binding */ getActiveTab),
/* harmony export */   getActiveTabUrl: () => (/* binding */ getActiveTabUrl),
/* harmony export */   showError: () => (/* binding */ showError),
/* harmony export */   showWarning: () => (/* binding */ showWarning)
/* harmony export */ });
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_0__);

function showError(message) {
    const container = document.getElementById('ui-inline-messages');
    if (!container)
        return;
    const errorDiv = document.createElement('div');
    errorDiv.style.background = '#fff1f0';
    errorDiv.style.color = '#a8071a';
    errorDiv.style.border = '1px solid #ffa39e';
    errorDiv.style.borderRadius = '4px';
    errorDiv.style.padding = '4px 10px';
    errorDiv.style.margin = '2px 0';
    errorDiv.style.fontSize = '0.92em';
    errorDiv.style.display = 'inline-block';
    errorDiv.style.maxWidth = '100%';
    errorDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
    errorDiv.textContent = message;
    container.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
}
function showWarning(message) {
    const container = document.getElementById('ui-inline-messages');
    if (!container)
        return;
    const warnDiv = document.createElement('div');
    warnDiv.style.background = '#fffbe6';
    warnDiv.style.color = '#856404';
    warnDiv.style.border = '1px solid #ffe58f';
    warnDiv.style.borderRadius = '4px';
    warnDiv.style.padding = '4px 10px';
    warnDiv.style.margin = '2px 0';
    warnDiv.style.fontSize = '0.92em';
    warnDiv.style.display = 'inline-block';
    warnDiv.style.maxWidth = '100%';
    warnDiv.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
    warnDiv.textContent = message;
    container.appendChild(warnDiv);
    setTimeout(() => warnDiv.remove(), 5000);
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
        .then((tabs) => {
        if (tabs && tabs.length > 0) {
            return tabs[0];
        }
        else {
            return null;
        }
    })
        .catch((error) => {
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
        .then((tabs) => {
        if (tabs && tabs.length > 0 && tabs[0].url) {
            return tabs[0].url;
        }
        else {
            return null;
        }
    })
        .catch((error) => {
        console.error("Utils: Error querying active tab URL:", error.message);
        return Promise.reject(error);
    });
}


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


/***/ }),

/***/ "./src/navigation.ts":
/*!***************************!*\
  !*** ./src/navigation.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   initializeNavigation: () => (/* binding */ initializeNavigation),
/* harmony export */   navigateTo: () => (/* binding */ navigateTo)
/* harmony export */ });
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./events/eventNames */ "./src/events/eventNames.ts");
/**
 * @reference lib="dom"
 */
// Add EXTENSION_CONTEXT to the Window interface

window.EXTENSION_CONTEXT = _events_eventNames__WEBPACK_IMPORTED_MODULE_0__.Contexts.OTHERS;
let pageContainers = document.querySelectorAll('.page-container');
let navButtons = document.querySelectorAll('.nav-button');
let mainHeaderTitle = document.querySelector('#header h1');
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
    }
    else {
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
    }
    else if (mainHeaderTitle) {
        mainHeaderTitle.textContent = 'Tab Agent';
    }
    navButtons.forEach(button => {
        const btn = button;
        if (btn.dataset.page === pageId) {
            btn.classList.add('active');
        }
        else {
            btn.classList.remove('active');
        }
    });
    document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_0__.UIEventNames.NAVIGATION_PAGE_CHANGED, { detail: { pageId } }));
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
        const btn = button;
        btn.addEventListener('click', () => {
            const pageId = btn.dataset.page;
            if (pageId) {
                navigateTo(pageId);
            }
        });
    });
    navigateTo('page-home');
    console.log(CONTEXT_PREFIX + "Navigation initialized.");
}



/***/ }),

/***/ "./src/notifications.ts":
/*!******************************!*\
  !*** ./src/notifications.ts ***!
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
 * @param message - The notification message
 * @param type - The notification type
 * @param duration - Duration in ms
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

/***/ "./src/sidepanel.ts":
/*!**************************!*\
  !*** ./src/sidepanel.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   sendDbRequestSmart: () => (/* binding */ sendDbRequestSmart),
/* harmony export */   sendToModelWorker: () => (/* binding */ sendToModelWorker)
/* harmony export */ });
/* harmony import */ var _DB_db__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./DB/db */ "./src/DB/db.ts");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! webextension-polyfill */ "./node_modules/webextension-polyfill/dist/browser-polyfill.js");
/* harmony import */ var webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(webextension_polyfill__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./navigation */ "./src/navigation.ts");
/* harmony import */ var _Home_chatRenderer__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Home/chatRenderer */ "./src/Home/chatRenderer.ts");
/* harmony import */ var _Home_messageOrchestrator__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./Home/messageOrchestrator */ "./src/Home/messageOrchestrator.ts");
/* harmony import */ var _Home_fileHandler__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./Home/fileHandler */ "./src/Home/fileHandler.ts");
/* harmony import */ var _Home_uiController__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./Home/uiController */ "./src/Home/uiController.ts");
/* harmony import */ var _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./Utilities/generalUtils */ "./src/Utilities/generalUtils.ts");
/* harmony import */ var _notifications__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./notifications */ "./src/notifications.ts");
/* harmony import */ var _DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./DB/dbEvents */ "./src/DB/dbEvents.ts");
/* harmony import */ var _Controllers_HistoryPopupController__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./Controllers/HistoryPopupController */ "./src/Controllers/HistoryPopupController.ts");
/* harmony import */ var _Controllers_LibraryController__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./Controllers/LibraryController */ "./src/Controllers/LibraryController.ts");
/* harmony import */ var _Controllers_DiscoverController__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./Controllers/DiscoverController */ "./src/Controllers/DiscoverController.ts");
/* harmony import */ var _Controllers_SettingsController__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./Controllers/SettingsController */ "./src/Controllers/SettingsController.ts");
/* harmony import */ var _Controllers_SpacesController__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./Controllers/SpacesController */ "./src/Controllers/SpacesController.ts");
/* harmony import */ var _Controllers_DriveController__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./Controllers/DriveController */ "./src/Controllers/DriveController.ts");
/* harmony import */ var _events_eventNames__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./events/eventNames */ "./src/events/eventNames.ts");
/* harmony import */ var _Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! ./Utilities/dbChannels */ "./src/Utilities/dbChannels.ts");
/* harmony import */ var _DB_idbSchema__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! ./DB/idbSchema */ "./src/DB/idbSchema.ts");
/* harmony import */ var _DB_idbModel__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! ./DB/idbModel */ "./src/DB/idbModel.ts");
// --- Imports ---






















// --- Constants ---
const LOG_QUEUE_MAX = 1000;
const senderId = 'sidepanel-' + Math.random().toString(36).slice(2) + '-' + Date.now();
// --- Global State ---
let activeSessionId = null;
let isPopup = false;
let originalTabIdFromPopup = null;
let currentTabId = null;
let isDbReady = false;
let historyPopupController = null;
let logQueue = [];
const prefix = '[Sidepanel]';
let modelWorker = null;
let currentModelIdInWorker = null;
let modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.UNINITIALIZED;
let isModelWorkerEnvReady = false;
// Track the currently loaded model and quant (onnx variant)
let currentLoadedModel = { modelId: null, quant: null };
function syncToggleLoadButton() {
    const modelDropdown = document.getElementById('model-selector');
    const quantDropdown = document.getElementById('onnx-variant-selector');
    const loadBtn = document.getElementById('load-model-button');
    if (!modelDropdown || !quantDropdown || !loadBtn)
        return;
    const selectedModelId = modelDropdown.value;
    const selectedQuant = quantDropdown.value;
    if (selectedModelId === currentLoadedModel.modelId &&
        selectedQuant === currentLoadedModel.quant &&
        selectedModelId && selectedQuant) {
        loadBtn.style.display = 'none';
    }
    else {
        loadBtn.style.display = '';
    }
}
(function () {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const contextParam = urlParams.get('context');
        const viewParam = urlParams.get('view');
        window.EXTENSION_CONTEXT =
            contextParam === 'popup'
                ? _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.Contexts.POPUP
                : viewParam === 'logs'
                    ? _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.Contexts.OTHERS
                    : _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.Contexts.MAIN_UI;
    }
    catch (e) {
        window.EXTENSION_CONTEXT = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.Contexts.UNKNOWN;
        console.error(`${prefix} Error setting EXTENSION_CONTEXT:`, e);
    }
})();
// Marked Setup
if (window.marked) {
    window.marked.setOptions({
        highlight: function (code, lang) {
            if (lang && window.hljs && window.hljs.getLanguage(lang)) {
                try {
                    return window.hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
                }
                catch (e) {
                    console.error(`${prefix} hljs error:`, e);
                }
            }
            else if (window.hljs) {
                try {
                    return window.hljs.highlightAuto(code).value;
                }
                catch (e) {
                    console.error(`${prefix} hljs auto error:`, e);
                }
            }
            const escapeHtml = (htmlStr) => htmlStr
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
    console.log(`${prefix} Marked globally configured to use highlight.`);
}
else {
    console.error(`${prefix} Marked library (window.marked) not found.`);
}
function isDbRequest(type) {
    return typeof type === 'string' && type.endsWith('_REQUEST');
}
function isDbLocalContext() {
    return typeof _DB_db__WEBPACK_IMPORTED_MODULE_0__.forwardDbRequest === 'function';
}
async function sendDbRequestSmart(request) {
    console.log(`${prefix} sendDbRequestSmart called`, { request });
    let response;
    if (isDbLocalContext()) {
        response = await (0,_DB_db__WEBPACK_IMPORTED_MODULE_0__.forwardDbRequest)(request);
        console.log(`${prefix} sendDbRequestSmart got local response`, { response });
    }
    else {
        response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage(request);
        console.log(`${prefix} sendDbRequestSmart got remote response`, { response });
    }
    return response;
}
function sendDbRequestViaChannel(request) {
    _DB_idbSchema__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage(request);
}
function requestDbAndWait(requestEvent) {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const result = await sendDbRequestSmart(requestEvent);
                console.log(`${prefix} requestDbAndWait: Raw result`, result);
                const response = Array.isArray(result) ? result[0] : result;
                if (response && (response.success || response.error === undefined)) {
                    resolve(response.data || response.payload);
                }
                else {
                    reject(new Error(response?.error || `DB operation ${requestEvent.type} failed`));
                }
            }
            catch (error) {
                reject(error);
            }
        })();
    });
}
function bufferOrWriteLog(logPayload) {
    if (!isDbReady) {
        if (logQueue.length >= LOG_QUEUE_MAX) {
            logQueue.shift();
        }
        logQueue.push(logPayload);
    }
    else {
        const req = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DbAddLogRequest(logPayload);
        sendDbRequestViaChannel(req);
    }
}
_Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__.logChannel.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'LOG_TO_DB' && payload) {
        bufferOrWriteLog(payload);
    }
};
function showDeviceBadge(executionProvider, providerNote) {
    let badge = document.getElementById('device-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.id = 'device-badge';
        badge.style.display = 'inline-block';
        badge.style.marginLeft = '12px';
        badge.style.padding = '2px 10px';
        badge.style.border = '2px solid #888';
        badge.style.borderRadius = '8px';
        badge.style.fontWeight = 'bold';
        badge.style.fontSize = '0.95em';
        badge.style.background = '#f8f8f8';
        badge.style.color = executionProvider && executionProvider.includes('webgpu') ? '#1a7f37' : '#333';
        badge.style.borderColor = executionProvider && executionProvider.includes('webgpu') ? '#1a7f37' : '#888';
        badge.style.verticalAlign = 'middle';
        badge.style.transition = 'all 0.2s';
        const loadBtn = document.getElementById('load-model-button');
        if (loadBtn && loadBtn.parentNode) {
            loadBtn.parentNode.insertBefore(badge, loadBtn.nextSibling);
        }
        else {
            document.body.appendChild(badge);
        }
    }
    if (!executionProvider) {
        badge.textContent = 'Unknown';
    }
    else if (executionProvider.includes('webgpu')) {
        badge.textContent = 'GPU (WebGPU)';
    }
    else if (executionProvider.includes('wasm')) {
        badge.textContent = 'CPU (WASM)';
    }
    else {
        badge.textContent = executionProvider;
    }
    badge.style.display = '';
    badge.title = providerNote || '';
}
function hideDeviceBadge() {
    const badge = document.getElementById('device-badge');
    if (badge)
        badge.style.display = 'none';
}
function handleModelWorkerMessage(event) {
    const { type, payload } = event.data;
    // console.log(`${prefix} Message from model worker: Type: ${type}`, payload);
    // For use in WORKER_READY case
    const modelDropdown = document.getElementById('model-selector');
    const quantDropdown = document.getElementById('onnx-variant-selector');
    const loadBtn = document.getElementById('load-model-button');
    switch (type) {
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_SCRIPT_READY:
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_SCRIPT_READY;
            console.log(`${prefix} Model worker script is ready. 'init' message should have been sent.`);
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_ENV_READY:
            isModelWorkerEnvReady = true;
            console.log(`${prefix} Model worker environment is ready.`);
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.LOADING_STATUS:
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.LOADING_MODEL;
            console.log(`${prefix} Worker loading status:`, payload);
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_READY: {
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.MODEL_READY;
            currentModelIdInWorker = payload.modelId;
            currentLoadedModel = {
                modelId: payload.modelId,
                quant: payload.quant || (quantDropdown ? quantDropdown.value : null)
            };
            syncToggleLoadButton();
            if (loadBtn)
                loadBtn.style.display = 'none';
            showDeviceBadge(payload.executionProvider, payload.warning);
            // Always show what quantization was actually loaded
            let quantMsg = `Model loaded with quantization: '${payload.quant}'.`;
            if (payload.fallback) {
                quantMsg += ` Requested quantization '${payload.requestedQuant}' was not available, so fallback to '${payload.quant}' was used.`;
            }
            (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showWarning)(quantMsg);
            if (payload.warning) {
                (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showWarning)(payload.warning);
            }
            console.log(`${prefix} Model ${payload.modelId} loaded successfully!`);
            console.log(`${prefix} Model worker is ready with model: ${payload.modelId}, quant: ${payload.quant}, fallback: ${payload.fallback}, executionProvider: ${payload.executionProvider}, warning: ${payload.warning}`);
            break;
        }
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR:
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR;
            isModelWorkerEnvReady = false;
            hideDeviceBadge();
            console.error(`${prefix} Model worker reported an error:`, payload);
            (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Worker Error: ${payload}`);
            currentModelIdInWorker = null;
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.RESET_COMPLETE:
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.UNINITIALIZED;
            isModelWorkerEnvReady = false;
            currentModelIdInWorker = null;
            hideDeviceBadge();
            console.log(`${prefix} Model worker reset complete.`);
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.MODEL_WORKER_LOADING_PROGRESS:
            document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.MODEL_WORKER_LOADING_PROGRESS, { detail: payload }));
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.GENERATION_COMPLETE: {
            console.log(`${prefix} GENERATION_COMPLETE payload:`, payload);
            let aiReply = '';
            if (Array.isArray(payload.text)) {
                const assistantMsg = payload.text.find((m) => m.role === 'assistant');
                aiReply = assistantMsg ? assistantMsg.content : JSON.stringify(payload.text);
            }
            else if (typeof payload.text === 'string') {
                aiReply = payload.text;
            }
            else {
                aiReply = JSON.stringify(payload.text);
            }
            document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, {
                detail: {
                    chatId: payload.chatId,
                    messageId: payload.messageId,
                    text: aiReply
                }
            }));
            break;
        }
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.GENERATION_ERROR:
            document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_ERROR_RECEIVED, {
                detail: {
                    chatId: payload.chatId,
                    messageId: payload.messageId,
                    error: payload.error
                }
            }));
            break;
        case _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.MANIFEST_UPDATED:
            document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.MANIFEST_UPDATED));
            break;
        default:
            console.warn(`${prefix} Unhandled message type from model worker: ${type}`, payload);
    }
}
function handleModelWorkerError(error) {
    let errorMessage;
    if (error instanceof ErrorEvent) {
        errorMessage = error.message;
        console.error(`${prefix} Uncaught error in model worker:`, error.message, error.filename, error.lineno, error.colno, error.error);
    }
    else if (error instanceof Event && 'message' in error) {
        errorMessage = error.message;
        console.error(`${prefix} Uncaught error in model worker:`, error);
    }
    else {
        errorMessage = String(error);
        console.error(`${prefix} Uncaught error in model worker:`, error);
    }
    modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR;
    currentModelIdInWorker = null;
    (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Critical Worker Failure: ${errorMessage}`);
    if (modelWorker) {
        modelWorker.terminate();
        modelWorker = null;
    }
}
function initializeModelWorker() {
    if (modelWorker && modelWorkerState !== _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR && modelWorkerState !== _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.UNINITIALIZED) {
        console.log(`${prefix} Model worker already exists and is not in an error/uninitialized state. State: ${modelWorkerState}`);
        return;
    }
    if (modelWorker) {
        console.log(`${prefix} Terminating existing model worker before creating a new one.`);
        modelWorker.terminate();
        modelWorker = null;
    }
    isModelWorkerEnvReady = false;
    console.log(`${prefix} Initializing model worker...`);
    try {
        const workerUrl = webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.getURL('modelworker.js');
        modelWorker = new Worker(workerUrl, { type: 'module' });
        modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.CREATING_WORKER;
        modelWorker.onmessage = handleModelWorkerMessage;
        modelWorker.onerror = handleModelWorkerError;
        console.log(`${prefix} Model worker instance created and listeners attached.`);
    }
    catch (error) {
        console.error(`${prefix} Failed to create model worker:`, error);
        modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR;
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Failed to initialize model worker: ${error.message}`);
    }
    if (modelWorker && modelWorkerState !== _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR) {
        const extensionBaseUrl = webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.getURL('');
        modelWorker.postMessage({ type: _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.SET_BASE_URL, baseUrl: extensionBaseUrl });
    }
}
function terminateModelWorker() {
    if (modelWorker) {
        console.log(`${prefix} Terminating model worker.`);
        modelWorker.terminate();
        modelWorker = null;
    }
    currentModelIdInWorker = null;
    modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.UNINITIALIZED;
    isModelWorkerEnvReady = false;
    hideDeviceBadge();
    console.log(`${prefix} Model worker terminated. Chat input would be disabled.`);
}
function sendToModelWorker(message) {
    if (!modelWorker || modelWorkerState === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.CREATING_WORKER && message.type !== _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.INIT) {
        console.warn(`${prefix} Model worker not ready to receive message type '${message.type}'. State: ${modelWorkerState}`);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)("Model worker is not ready. Please wait or try reloading.");
        return;
    }
    try {
        modelWorker.postMessage(message);
    }
    catch (error) {
        console.error(`${prefix} Error posting message to model worker:`, error, message);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Error communicating with model worker: ${error.message}`);
    }
}
function sendUiEvent(type, payload) {
    webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({ type, payload });
}
function getActiveChatSessionId() {
    return activeSessionId;
}
async function setActiveChatSessionId(newSessionId) {
    console.log(`${prefix} Setting active session ID to: ${newSessionId}`);
    activeSessionId = newSessionId;
    if (newSessionId) {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.set({ lastSessionId: newSessionId });
    }
    else {
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.remove('lastSessionId');
    }
    (0,_Home_chatRenderer__WEBPACK_IMPORTED_MODULE_3__.setActiveSessionId)(newSessionId);
    (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.setActiveSession)(newSessionId);
}
// --- Channel Handlers ---
if (window.EXTENSION_CONTEXT === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.Contexts.MAIN_UI) {
    _DB_idbSchema__WEBPACK_IMPORTED_MODULE_18__.dbChannel.onmessage = async (event) => {
        const { type, payload, requestId, senderId: reqSenderId, responseType } = event.data;
        if (!isDbRequest(type))
            return;
        try {
            const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                type,
                payload,
                requestId,
                senderId: reqSenderId,
            });
            const respType = responseType || type + '_RESPONSE';
            _DB_idbSchema__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage({ type: respType, payload: response, requestId, senderId });
        }
        catch (err) {
            const respType = responseType || type + '_RESPONSE';
            _DB_idbSchema__WEBPACK_IMPORTED_MODULE_18__.dbChannel.postMessage({
                type: respType,
                payload: { success: false, error: err.message },
                requestId,
                senderId,
            });
        }
    };
    _Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__.llmChannel.onmessage = async (event) => {
        const { type, payload, requestId, senderId: msgSenderId } = event.data;
        if (msgSenderId && msgSenderId.startsWith('sidepanel-') && msgSenderId !== senderId) {
            console.log(`${prefix} Message from another sidepanel context, ignoring`, { msgSenderId, senderId });
            return;
        }
        if ([
            _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_SCRIPT_READY, _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.WORKER_READY,
            _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.LOADING_STATUS, _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR, _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.RESET_COMPLETE
        ].includes(type)) {
            return;
        }
        if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.SEND_CHAT_MESSAGE) {
            console.log(`${prefix} llmChannel: Received SEND_CHAT_MESSAGE, forwarding to model worker.`);
            sendToModelWorker({ type: 'generate', payload });
        }
        else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.INTERRUPT_GENERATION) {
            console.log(`${prefix} llmChannel: Received INTERRUPT_GENERATION, forwarding to model worker.`);
            sendToModelWorker({ type: 'interrupt', payload });
        }
        else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.RESET_WORKER) {
            console.log(`${prefix} llmChannel: Received RESET_WORKER. Terminating worker.`);
            terminateModelWorker();
            _Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__.llmChannel.postMessage({
                type: _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.RESET_WORKER + '_RESPONSE',
                payload: { success: true, message: "Worker reset." },
                requestId,
                senderId: 'sidepanel',
                timestamp: Date.now(),
            });
        }
        else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.LOAD_MODEL) {
            console.warn(`${prefix} llmChannel: Received legacy LOAD_MODEL. Use UIEventNames.REQUEST_MODEL_EXECUTION. Triggering load for:`, payload);
            const modelToLoad = payload.modelId || payload.model;
            const onnxToLoad = payload.quant;
            if (modelToLoad && onnxToLoad && onnxToLoad !== 'all') {
                document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.REQUEST_MODEL_EXECUTION, {
                    detail: { modelId: modelToLoad, quant: onnxToLoad }
                }));
            }
            else {
                const errorMsg = `LOAD_MODEL received with invalid/missing modelId or quant. Model: ${modelToLoad}, Quant: ${onnxToLoad}`;
                console.error(`${prefix} ${errorMsg}`);
                _Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__.llmChannel.postMessage({
                    type: _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.LOAD_MODEL + '_RESPONSE',
                    payload: { success: false, error: errorMsg },
                    requestId, senderId: 'sidepanel', timestamp: Date.now(),
                });
            }
        }
        else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.GET_MODEL_WORKER_STATE) {
            _Utilities_dbChannels__WEBPACK_IMPORTED_MODULE_17__.llmChannel.postMessage({
                type: _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RuntimeMessageTypes.GET_MODEL_WORKER_STATE + '_RESPONSE',
                payload: { state: modelWorkerState, modelId: currentModelIdInWorker },
                requestId,
                senderId: 'sidepanel',
                timestamp: Date.now(),
            });
        }
        else {
            console.log(`${prefix} llmChannel: Received unhandled message type for sidepanel: ${type}`, payload);
        }
        console.log(`${prefix} onmessage END`, { type, requestId, payload, msgSenderId, timestamp: Date.now() });
    };
}
// --- Event Handlers ---
function handleMessage(message, sender, sendResponse) {
    const { type } = message;
    if (Object.values(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DBEventNames).includes(type)) {
        return false;
    }
    if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RawDirectMessageTypes.WORKER_GENERIC_RESPONSE) {
        sendUiEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_RESPONSE_RECEIVED, {
            chatId: message.chatId,
            messageId: message.messageId,
            text: message.text,
        });
    }
    else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RawDirectMessageTypes.WORKER_GENERIC_ERROR) {
        sendUiEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_ERROR_RECEIVED, {
            chatId: message.chatId,
            messageId: message.messageId,
            error: message.error,
        });
        sendResponse({});
    }
    else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RawDirectMessageTypes.WORKER_SCRAPE_STAGE_RESULT) {
        sendUiEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_SCRAPE_STAGE_RESULT, message.payload);
        sendResponse({ status: 'received', type });
    }
    else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.RawDirectMessageTypes.WORKER_DIRECT_SCRAPE_RESULT) {
        sendUiEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.BACKGROUND_SCRAPE_RESULT_RECEIVED, message.payload);
        sendResponse({});
    }
    else if (type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.InternalEventBusMessageTypes.BACKGROUND_EVENT_BROADCAST ||
        type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.MODEL_WORKER_LOADING_PROGRESS) {
        // No action needed
    }
    else {
        console.warn(`${prefix} Received unknown message type from background:`, type, message);
    }
}
async function handleSessionCreated(newSessionId) {
    console.log(`${prefix} Orchestrator reported new session created: ${newSessionId}`);
    console.log(`${prefix} handleSessionCreated callback received sessionId:`, newSessionId);
    await setActiveChatSessionId(newSessionId);
    try {
        const request = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DbGetSessionRequest(newSessionId);
        const sessionData = await requestDbAndWait(request);
        if (!sessionData?.messages) {
            console.warn(`${prefix} No messages found in session data for new session ${newSessionId}.`, sessionData);
        }
    }
    catch (error) {
        const err = error;
        console.error(`${prefix} Failed to fetch messages for new session ${newSessionId}:`, err);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Failed to load initial messages for new chat: ${err.message}`);
    }
}
async function handleNewChat() {
    console.log(`${prefix} New Chat button clicked.`);
    await setActiveChatSessionId(null);
    (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.clearInput)();
    (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.focusInput)();
}
async function loadAndDisplaySession(sessionId) {
    if (!sessionId) {
        console.log(`${prefix} No session ID to load, setting renderer to null.`);
        await setActiveChatSessionId(null);
        return;
    }
    console.log(`${prefix} Loading session data for: ${sessionId}`);
    try {
        const request = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DbGetSessionRequest(sessionId);
        const sessionData = await requestDbAndWait(request);
        console.log(`${prefix} Session data successfully loaded for ${sessionId}.`);
        await setActiveChatSessionId(sessionId);
        if (!sessionData?.messages) {
            console.warn(`${prefix} No messages found in loaded session data for ${sessionId}.`);
        }
    }
    catch (error) {
        const err = error;
        console.error(`${prefix} Failed to load session ${sessionId}:`, err);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Failed to load chat: ${err.message}`);
        await setActiveChatSessionId(null);
    }
}
async function handleDetach() {
    if (!currentTabId) {
        console.error('Cannot detach: Missing tab ID');
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)('Cannot detach: Missing tab ID');
        return;
    }
    const currentSessionId = getActiveChatSessionId();
    try {
        const response = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
            type: 'getPopupForTab',
            tabId: currentTabId,
        });
        if (response?.popupId) {
            await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().windows.update(response.popupId, { focused: true });
            return;
        }
        const storageKey = `detachedSessionId_${currentTabId}`;
        await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.set({ [storageKey]: currentSessionId });
        console.log(`${prefix} Saved session ID ${currentSessionId} for detach key ${storageKey}.`);
        const popup = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().windows.create({
            url: webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.getURL(`sidepanel.html?context=popup&originalTabId=${currentTabId}`),
            type: 'popup',
            width: 400,
            height: 600,
        });
        if (popup?.id) {
            await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.sendMessage({
                type: 'popupCreated',
                tabId: currentTabId,
                popupId: popup.id,
            });
        }
        else {
            throw new Error('Failed to create popup window.');
        }
    }
    catch (error) {
        const err = error;
        console.error(`${prefix} Error during detach:`, err);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Error detaching chat: ${err.message}`);
    }
}
async function handlePageChange(event) {
    if (!event?.pageId)
        return;
    console.log(`${prefix} Navigation changed to: ${event.pageId}`);
    if (!isDbReady) {
        console.log(`${prefix} DB not ready yet, skipping session load on initial navigation event.`);
        return;
    }
    if (event.pageId === 'page-home') {
        console.log(`${prefix} Navigated to home page, checking for specific session load signal...`);
        try {
            const { lastSessionId } = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.get(['lastSessionId']);
            if (lastSessionId) {
                console.log(`${prefix} Found load signal: ${lastSessionId}. Loading session and clearing signal.`);
                await loadAndDisplaySession(lastSessionId);
                await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.remove('lastSessionId');
            }
            else {
                console.log(`${prefix} No load signal found. Resetting to welcome state.`);
                await loadAndDisplaySession(null);
            }
        }
        catch (error) {
            const err = error;
            console.error(`${prefix} Error checking/loading session based on signal:`, err);
            (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)('Failed to load session state.');
            await loadAndDisplaySession(null);
        }
    }
}
// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log(`${prefix} DOM Content Loaded.`);
    const urlParams = new URLSearchParams(window.location.search);
    const requestedView = urlParams.get('view');
    // Log Viewer Mode
    if (requestedView === 'logs') {
        console.log(`${prefix} Initializing in Log Viewer Mode.`);
        document.body.classList.add('log-viewer-mode');
        document.getElementById('header')?.classList.add('hidden');
        document.getElementById('bottom-nav')?.classList.add('hidden');
        document
            .querySelectorAll('#main-content > .page-container:not(#page-log-viewer)')
            .forEach((el) => el.classList.add('hidden'));
        const logViewerPage = document.getElementById('page-log-viewer');
        if (logViewerPage) {
            logViewerPage.classList.remove('hidden');
        }
        else {
            console.error(`${prefix} CRITICAL: #page-log-viewer element not found!`);
            document.body.innerHTML =
                "<p style='color:red; padding: 1em;'>Error: Log viewer UI component failed to load.</p>";
            return;
        }
        try {
            const logViewerModule = await __webpack_require__.e(/*! import() */ "src_Controllers_LogViewerController_ts").then(__webpack_require__.bind(__webpack_require__, /*! ./Controllers/LogViewerController */ "./src/Controllers/LogViewerController.ts"));
            await logViewerModule.initializeLogViewerController();
            console.log(`${prefix} Log Viewer Controller initialized.`);
        }
        catch (err) {
            const error = err;
            console.error(`${prefix} Failed to load or initialize LogViewerController:`, error);
            if (logViewerPage) {
                logViewerPage.innerHTML = `<div style='color:red; padding: 1em;'>Error initializing log viewer: ${error.message}</div>`;
            }
        }
        return;
    }
    // Standard Mode
    console.log(`${prefix} Initializing in Standard Mode.`);
    document.getElementById('page-log-viewer')?.classList.add('hidden');
    // Initialize UI and Core Components
    try {
        const uiInitResult = await (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.initializeUI)({
            onNewChat: handleNewChat,
            onAttachFile: _Home_fileHandler__WEBPACK_IMPORTED_MODULE_5__.handleAttachClick,
        });
        if (!uiInitResult)
            throw new Error('UI initialization failed');
        const { chatBody, fileInput } = uiInitResult;
        console.log(`${prefix} UI Controller Initialized.`);
        if (!chatBody) {
            console.error(`${prefix} CRITICAL: chatBody is null before initializeRenderer!`);
            throw new Error('chatBody is null');
        }
        (0,_Home_chatRenderer__WEBPACK_IMPORTED_MODULE_3__.initializeRenderer)(chatBody, requestDbAndWait);
        console.log(`${prefix} Chat Renderer Initialized.`);
        (0,_navigation__WEBPACK_IMPORTED_MODULE_2__.initializeNavigation)();
        console.log(`${prefix} Navigation Initialized.`);
        document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.NAVIGATION_PAGE_CHANGED, (e) => handlePageChange(e.detail));
        (0,_Home_fileHandler__WEBPACK_IMPORTED_MODULE_5__.initializeFileHandling)({
            getActiveSessionIdFunc: getActiveChatSessionId,
        });
        console.log(`${prefix} File Handler Initialized.`);
        if (fileInput) {
            fileInput.addEventListener('change', _Home_fileHandler__WEBPACK_IMPORTED_MODULE_5__.handleFileSelected);
        }
        else {
            console.warn(`${prefix} File input element not found before adding listener.`);
        }
        const activeTab = await (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.getActiveTab)();
        currentTabId = activeTab?.id;
        console.log(`${prefix} Current Tab ID: ${currentTabId}`);
        (0,_Home_messageOrchestrator__WEBPACK_IMPORTED_MODULE_4__.initializeOrchestrator)({
            getActiveSessionIdFunc: getActiveChatSessionId,
            onSessionCreatedCallback: handleSessionCreated,
            getCurrentTabIdFunc: () => currentTabId,
        });
        console.log(`${prefix} Message Orchestrator Initialized.`);
        webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().runtime.onMessage.addListener(handleMessage);
        console.log(`${prefix} Background message listener added.`);
        // Initialize Controllers
        const historyPopupElement = document.getElementById('history-popup');
        const historyListElement = document.getElementById('history-list');
        const historySearchElement = document.getElementById('history-search');
        const closeHistoryButtonElement = document.getElementById('close-history');
        const historyButton = document.getElementById('history-button');
        const detachButton = document.getElementById('detach-button');
        if (historyPopupElement && historyListElement && historySearchElement && closeHistoryButtonElement) {
            historyPopupController = (0,_Controllers_HistoryPopupController__WEBPACK_IMPORTED_MODULE_10__.initializeHistoryPopup)({
                popupContainer: historyPopupElement,
                listContainer: historyListElement,
                searchInput: historySearchElement,
                closeButton: closeHistoryButtonElement,
            }, requestDbAndWait);
            if (!historyPopupController) {
                console.error(`${prefix} History Popup Controller initialization failed.`);
            }
        }
        else {
            console.warn(`${prefix} Could not find all required elements for History Popup Controller.`);
        }
        if (historyButton && historyPopupController) {
            historyButton.addEventListener('click', () => historyPopupController.show());
        }
        else {
            console.warn(`${prefix} History button or controller not available for listener.`);
        }
        if (detachButton) {
            detachButton.addEventListener('click', handleDetach);
        }
        else {
            console.warn(`${prefix} Detach button not found.`);
        }
        const libraryListElement = document.getElementById('starred-list');
        if (libraryListElement) {
            (0,_Controllers_LibraryController__WEBPACK_IMPORTED_MODULE_11__.initializeLibraryController)({ listContainer: libraryListElement }, requestDbAndWait);
            console.log(`${prefix} Library Controller Initialized.`);
        }
        else {
            console.warn(`${prefix} Could not find #starred-list element for Library Controller.`);
        }
        document.addEventListener(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.UIEventNames.REQUEST_MODEL_EXECUTION, async (e) => {
            const { modelId, quant, loadId } = e.detail;
            if (!modelId) {
                (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)('No model selected.');
                return;
            }
            if (modelWorker && (currentModelIdInWorker !== modelId || modelWorkerState === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR)) {
                console.log(`${prefix} Terminating current worker before loading new model. Current: ${currentModelIdInWorker}, New: ${modelId}, State: ${modelWorkerState}`);
                terminateModelWorker();
            }
            if (!modelWorker) {
                initializeModelWorker();
            }
            if (!modelWorker) {
                (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)("Failed to create/initialize model worker. Cannot load model.");
                modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.ERROR;
                return;
            }
            const waitForEnvReady = async (timeoutMs = 5000) => {
                if (isModelWorkerEnvReady)
                    return;
                console.log(`${prefix} Waiting for model worker environment to be ready...`);
                const start = Date.now();
                while (!isModelWorkerEnvReady) {
                    if (Date.now() - start > timeoutMs) {
                        throw new Error("Timed out waiting for model worker environment to be ready.");
                    }
                    await new Promise(res => setTimeout(res, 50));
                }
                console.log(`${prefix} Model worker environment is now ready. Proceeding to load model.`);
            };
            try {
                await waitForEnvReady();
            }
            catch (e) {
                const err = e;
                (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(err.message || "Model worker failed to initialize.");
                return;
            }
            // Normalize quantization value before sending INIT
            const normQuant = (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.normalizeQuant)(quant || '');
            // Get the task from the manifest
            const manifestEntry = await (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.getManifestEntry)(modelId);
            const task = manifestEntry && manifestEntry.task ? manifestEntry.task : 'text-generation';
            console.log(`${prefix} UI would show: Initializing worker for ${modelId} with quant: ${normQuant}, task: ${task}...`);
            modelWorkerState = _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.LOADING_MODEL;
            currentModelIdInWorker = modelId;
            modelWorker.postMessage({
                type: _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.INIT,
                payload: { modelId, quant: normQuant, task, loadId }
            });
        });
        (0,_Controllers_DiscoverController__WEBPACK_IMPORTED_MODULE_12__.initializeDiscoverController)();
        console.log(`${prefix} Discover Controller Initialized.`);
        (0,_Controllers_SettingsController__WEBPACK_IMPORTED_MODULE_13__.initializeSettingsController)();
        console.log(`${prefix} Settings Controller Initialized.`);
        (0,_Controllers_SpacesController__WEBPACK_IMPORTED_MODULE_14__.initializeSpacesController)();
        console.log(`${prefix} Spaces Controller Initialized.`);
        (0,_Controllers_DriveController__WEBPACK_IMPORTED_MODULE_15__.initializeDriveController)({
            requestDbAndWaitFunc: requestDbAndWait,
            getActiveChatSessionId,
            setActiveChatSessionId,
            showNotification: _notifications__WEBPACK_IMPORTED_MODULE_8__.showNotification,
            debounce: _Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.debounce,
        });
        console.log(`${prefix} Drive Controller Initialized.`);
        const popupContext = urlParams.get('context');
        originalTabIdFromPopup = popupContext === 'popup' ? urlParams.get('originalTabId') : null;
        isPopup = popupContext === 'popup';
        console.log(`${prefix} Context: ${isPopup ? 'Popup' : 'Sidepanel'}${isPopup ? ', Original Tab: ' + originalTabIdFromPopup : ''}`);
        if (isPopup && originalTabIdFromPopup) {
            const storageKey = `detachedSessionId_${originalTabIdFromPopup}`;
            const result = await webextension_polyfill__WEBPACK_IMPORTED_MODULE_1___default().storage.local.get(storageKey);
            const detachedSessionId = result[storageKey];
            if (detachedSessionId) {
                console.log(`${prefix} Found detached session ID: ${detachedSessionId}. Loading...`);
                await loadAndDisplaySession(detachedSessionId);
            }
            else {
                console.log(`${prefix} No detached session ID found for key ${storageKey}. Starting fresh.`);
                await setActiveChatSessionId(null);
            }
        }
        else {
            console.log(`${prefix} Starting fresh. Loading empty/welcome state.`);
            await loadAndDisplaySession(null);
        }
        await ensureManifestForDropdownRepos();
        const dbInitSuccess = await initializeDatabase();
        if (!dbInitSuccess)
            return;
        console.log(`${prefix} Initialization complete.`);
        const modelDropdownEl = document.getElementById('model-selector');
        const quantDropdownEl = document.getElementById('onnx-variant-selector');
        if (modelDropdownEl) {
            modelDropdownEl.addEventListener('change', async () => {
                hideDeviceBadge();
                syncToggleLoadButton();
            });
        }
        if (quantDropdownEl) {
            quantDropdownEl.addEventListener('change', () => {
                hideDeviceBadge();
                syncToggleLoadButton();
            });
        }
        // Initial toggle
        syncToggleLoadButton();
        if (modelWorker) {
            const originalOnMessage = modelWorker.onmessage;
            modelWorker.onmessage = function (event) {
                if (event.data && event.data.type === _events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.MANIFEST_UPDATED) {
                    syncToggleLoadButton();
                }
                if (typeof originalOnMessage === 'function') {
                    originalOnMessage.call(this, event);
                }
            };
        }
    }
    catch (error) {
        const err = error;
        console.error(`${prefix} Initialization failed:`, err);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Initialization failed: ${err.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
        }
    }
});
document.addEventListener(_DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DbInitializationCompleteNotification.type, async (e) => {
    console.log(`${prefix} DbInitializationCompleteNotification received.`, e.detail);
});
async function initializeDatabase() {
    try {
        const result = await (0,_DB_db__WEBPACK_IMPORTED_MODULE_0__.autoEnsureDbInitialized)();
        if (result?.success) {
            console.log(`${prefix} DB initialized directly.`);
            isDbReady = true;
            for (const logPayload of logQueue) {
                const req = new _DB_dbEvents__WEBPACK_IMPORTED_MODULE_9__.DbAddLogRequest(logPayload);
                sendDbRequestViaChannel(req);
            }
            logQueue = [];
            return true;
        }
        else {
            throw new Error(`Database initialization failed: ${result?.error || 'Unknown error'}`);
        }
    }
    catch (error) {
        const err = error;
        console.error(`${prefix} DB Initialization failed:`, err);
        (0,_Utilities_generalUtils__WEBPACK_IMPORTED_MODULE_7__.showError)(`Initialization failed: ${err.message}. Please try reloading.`);
        const chatBody = document.getElementById('chat-body');
        if (chatBody) {
            chatBody.innerHTML = `<div class="p-4 text-red-500">Critical Error: ${err.message}. Please reload the extension.</div>`;
        }
        return false;
    }
}
async function ensureManifestForDropdownRepos() {
    const dropdownRepos = (0,_Home_uiController__WEBPACK_IMPORTED_MODULE_6__.getModelSelectorOptions)();
    const allManifests = await (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.getAllManifestEntries)();
    const haveRepos = new Set(allManifests.map(entry => entry.repo));
    console.log(`${prefix} [Manifest] Have repos:`, haveRepos);
    console.log(`${prefix} [Manifest] Dropdown repos:`, dropdownRepos);
    for (const repo of dropdownRepos) {
        if (haveRepos.has(repo)) {
            console.log(`${prefix} [Manifest] Repo ${repo} already in manifest, skipping fetch.`);
            continue;
        }
        try {
            const { siblings, task } = await (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.fetchRepoFiles)(repo);
            const files = siblings;
            const quantMap = {};
            for (const file of files) {
                const fname = file.rfilename ? file.rfilename.split('/').pop() : '';
                if (file.rfilename && file.rfilename.endsWith('.onnx')) {
                    let quant = (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.parseQuantFromFilename)(file.rfilename);
                    if (!quant) {
                        quant = fname === 'model.onnx' ? 'fp32' : fname || 'unknown_quant';
                    }
                    quant = '' + quant;
                    if (!quantMap[quant])
                        quantMap[quant] = { files: [], status: _DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.QuantStatus.Available };
                    quantMap[quant].files.push(file.rfilename);
                }
            }
            for (const file of files) {
                if (file.rfilename && file.rfilename.endsWith('.json')) {
                    for (const quant in quantMap) {
                        quantMap[quant].files.push(file.rfilename);
                    }
                }
            }
            const entry = { repo, quants: quantMap, task };
            await (0,_DB_idbModel__WEBPACK_IMPORTED_MODULE_19__.addManifestEntry)(repo, entry);
            console.log(`${prefix}[Manifest] Added entry for repo: ${repo}`, entry);
        }
        catch (e) {
            console.warn(`${prefix} [Manifest] Failed to fetch/add entry for repo: ${repo}`, e);
        }
    }
    document.dispatchEvent(new CustomEvent(_events_eventNames__WEBPACK_IMPORTED_MODULE_16__.WorkerEventNames.MANIFEST_UPDATED));
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
/******/ 			return "assets/" + chunkId + "-" + "94b2a155d436bf940581" + ".js";
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
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"sidepanel": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunktabagent"] = self["webpackChunktabagent"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/sidepanel.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=sidepanel.js.map