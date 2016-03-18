/**
 * Sinon.JS 1.17.2, 2015/10/21
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @author Contributors: https://github.com/cjohansen/Sinon.JS/blob/master/AUTHORS
 *
 * (The BSD License)
 *
 * Copyright (c) 2010-2014, Christian Johansen, christian@cjohansen.no
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 * are permitted provided that the following conditions are met:
 *
 *     * Redistributions of source code must retain the above copyright notice,
 *       this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright notice,
 *       this list of conditions and the following disclaimer in the documentation
 *       and/or other materials provided with the distribution.
 *     * Neither the name of Christian Johansen nor the names of his contributors
 *       may be used to endorse or promote products derived from this software
 *       without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
var sinon = (function () {
  "use strict";
  // eslint-disable-line no-unused-vars

  var sinonModule;
  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    sinonModule = module.exports = require("./sinon/util/core");
    require("./sinon/extend");
    require("./sinon/walk");
    require("./sinon/typeOf");
    require("./sinon/times_in_words");
    require("./sinon/spy");
    require("./sinon/call");
    require("./sinon/behavior");
    require("./sinon/stub");
    require("./sinon/mock");
    require("./sinon/collection");
    require("./sinon/assert");
    require("./sinon/sandbox");
    require("./sinon/test");
    require("./sinon/test_case");
    require("./sinon/match");
    require("./sinon/format");
    require("./sinon/log_error");
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
    sinonModule = module.exports;
  } else {
    sinonModule = {};
  }

  return sinonModule;
}());

/**
 * @depend ../../sinon.js
 */
/**
 * Sinon core utilities. For internal use only.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal) {

  var div = typeof document !== "undefined" && document.createElement("div");
  var hasOwn = Object.prototype.hasOwnProperty;

  function isDOMNode(obj) {
    var success = false;

    try {
      obj.appendChild(div);
      success = div.parentNode === obj;
    } catch (e) {
      return false;
    } finally {
      try {
        obj.removeChild(div);
      } catch (e) {
        // Remove failed, not much we can do about that
      }
    }

    return success;
  }

  function isElement(obj) {
    return div && obj && obj.nodeType === 1 && isDOMNode(obj);
  }

  function isFunction(obj) {
    return typeof obj === "function" || !!(obj && obj.constructor && obj.call && obj.apply);
  }

  function isReallyNaN(val) {
    return typeof val === "number" && isNaN(val);
  }

  function mirrorProperties(target, source) {
    for (var prop in source) {
      if (!hasOwn.call(target, prop)) {
        target[prop] = source[prop];
      }
    }
  }

  function isRestorable(obj) {
    return typeof obj === "function" && typeof obj.restore === "function" && obj.restore.sinon;
  }

  // Cheap way to detect if we have ES5 support.
  var hasES5Support = "keys" in Object;

  function makeApi(sinon) {
    sinon.wrapMethod = function wrapMethod(object, property, method) {
      if (!object) {
        throw new TypeError("Should wrap property of object");
      }

      if (typeof method !== "function" && typeof method !== "object") {
        throw new TypeError("Method wrapper should be a function or a property descriptor");
      }

      function checkWrappedMethod(wrappedMethod) {
        var error;

        if (!isFunction(wrappedMethod)) {
          error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
              property + " as function");
        } else if (wrappedMethod.restore && wrappedMethod.restore.sinon) {
          error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
        } else if (wrappedMethod.calledBefore) {
          var verb = wrappedMethod.returns ? "stubbed" : "spied on";
          error = new TypeError("Attempted to wrap " + property + " which is already " + verb);
        }

        if (error) {
          if (wrappedMethod && wrappedMethod.stackTrace) {
            error.stack += "\n--------------\n" + wrappedMethod.stackTrace;
          }
          throw error;
        }
      }

      var error, wrappedMethod, i;

      // IE 8 does not support hasOwnProperty on the window object and Firefox has a problem
      // when using hasOwn.call on objects from other frames.
      var owned = object.hasOwnProperty ? object.hasOwnProperty(property) : hasOwn.call(object, property);

      if (hasES5Support) {
        var methodDesc = (typeof method === "function") ? {value: method} : method;
        var wrappedMethodDesc = sinon.getPropertyDescriptor(object, property);

        if (!wrappedMethodDesc) {
          error = new TypeError("Attempted to wrap " + (typeof wrappedMethod) + " property " +
              property + " as function");
        } else if (wrappedMethodDesc.restore && wrappedMethodDesc.restore.sinon) {
          error = new TypeError("Attempted to wrap " + property + " which is already wrapped");
        }
        if (error) {
          if (wrappedMethodDesc && wrappedMethodDesc.stackTrace) {
            error.stack += "\n--------------\n" + wrappedMethodDesc.stackTrace;
          }
          throw error;
        }

        var types = sinon.objectKeys(methodDesc);
        for (i = 0; i < types.length; i++) {
          wrappedMethod = wrappedMethodDesc[types[i]];
          checkWrappedMethod(wrappedMethod);
        }

        mirrorProperties(methodDesc, wrappedMethodDesc);
        for (i = 0; i < types.length; i++) {
          mirrorProperties(methodDesc[types[i]], wrappedMethodDesc[types[i]]);
        }
        Object.defineProperty(object, property, methodDesc);
      } else {
        wrappedMethod = object[property];
        checkWrappedMethod(wrappedMethod);
        object[property] = method;
        method.displayName = property;
      }

      method.displayName = property;

      // Set up a stack trace which can be used later to find what line of
      // code the original method was created on.
      method.stackTrace = (new Error("Stack Trace for original")).stack;

      method.restore = function () {
        // For prototype properties try to reset by delete first.
        // If this fails (ex: localStorage on mobile safari) then force a reset
        // via direct assignment.
        if (!owned) {
          // In some cases `delete` may throw an error
          try {
            delete object[property];
          } catch (e) {} // eslint-disable-line no-empty
          // For native code functions `delete` fails without throwing an error
          // on Chrome < 43, PhantomJS, etc.
        } else if (hasES5Support) {
          Object.defineProperty(object, property, wrappedMethodDesc);
        }

        // Use strict equality comparison to check failures then force a reset
        // via direct assignment.
        if (object[property] === method) {
          object[property] = wrappedMethod;
        }
      };

      method.restore.sinon = true;

      if (!hasES5Support) {
        mirrorProperties(method, wrappedMethod);
      }

      return method;
    };

    sinon.create = function create(proto) {
      var F = function () {};
      F.prototype = proto;
      return new F();
    };

    sinon.deepEqual = function deepEqual(a, b) {
      if (sinon.match && sinon.match.isMatcher(a)) {
        return a.test(b);
      }

      if (typeof a !== "object" || typeof b !== "object") {
        return isReallyNaN(a) && isReallyNaN(b) || a === b;
      }

      if (isElement(a) || isElement(b)) {
        return a === b;
      }

      if (a === b) {
        return true;
      }

      if ((a === null && b !== null) || (a !== null && b === null)) {
        return false;
      }

      if (a instanceof RegExp && b instanceof RegExp) {
        return (a.source === b.source) && (a.global === b.global) &&
            (a.ignoreCase === b.ignoreCase) && (a.multiline === b.multiline);
      }

      var aString = Object.prototype.toString.call(a);
      if (aString !== Object.prototype.toString.call(b)) {
        return false;
      }

      if (aString === "[object Date]") {
        return a.valueOf() === b.valueOf();
      }

      var prop;
      var aLength = 0;
      var bLength = 0;

      if (aString === "[object Array]" && a.length !== b.length) {
        return false;
      }

      for (prop in a) {
        if (a.hasOwnProperty(prop)) {
          aLength += 1;

          if (!(prop in b)) {
            return false;
          }

          if (!deepEqual(a[prop], b[prop])) {
            return false;
          }
        }
      }

      for (prop in b) {
        if (b.hasOwnProperty(prop)) {
          bLength += 1;
        }
      }

      return aLength === bLength;
    };

    sinon.functionName = function functionName(func) {
      var name = func.displayName || func.name;

      // Use function decomposition as a last resort to get function
      // name. Does not rely on function decomposition to work - if it
      // doesn't debugging will be slightly less informative
      // (i.e. toString will say 'spy' rather than 'myFunc').
      if (!name) {
        var matches = func.toString().match(/function ([^\s\(]+)/);
        name = matches && matches[1];
      }

      return name;
    };

    sinon.functionToString = function toString() {
      if (this.getCall && this.callCount) {
        var thisValue,
            prop;
        var i = this.callCount;

        while (i--) {
          thisValue = this.getCall(i).thisValue;

          for (prop in thisValue) {
            if (thisValue[prop] === this) {
              return prop;
            }
          }
        }
      }

      return this.displayName || "sinon fake";
    };

    sinon.objectKeys = function objectKeys(obj) {
      if (obj !== Object(obj)) {
        throw new TypeError("sinon.objectKeys called on a non-object");
      }

      var keys = [];
      var key;
      for (key in obj) {
        if (hasOwn.call(obj, key)) {
          keys.push(key);
        }
      }

      return keys;
    };

    sinon.getPropertyDescriptor = function getPropertyDescriptor(object, property) {
      var proto = object;
      var descriptor;

      while (proto && !(descriptor = Object.getOwnPropertyDescriptor(proto, property))) {
        proto = Object.getPrototypeOf(proto);
      }
      return descriptor;
    };

    sinon.getConfig = function (custom) {
      var config = {};
      custom = custom || {};
      var defaults = sinon.defaultConfig;

      for (var prop in defaults) {
        if (defaults.hasOwnProperty(prop)) {
          config[prop] = custom.hasOwnProperty(prop) ? custom[prop] : defaults[prop];
        }
      }

      return config;
    };

    sinon.defaultConfig = {
      injectIntoThis: true,
      injectInto: null,
      properties: ["spy", "stub", "mock", "clock", "server", "requests"],
      useFakeTimers: true,
      useFakeServer: true
    };

    sinon.timesInWords = function timesInWords(count) {
      return count === 1 && "once" ||
          count === 2 && "twice" ||
          count === 3 && "thrice" ||
          (count || 0) + " times";
    };

    sinon.calledInOrder = function (spies) {
      for (var i = 1, l = spies.length; i < l; i++) {
        if (!spies[i - 1].calledBefore(spies[i]) || !spies[i].called) {
          return false;
        }
      }

      return true;
    };

    sinon.orderByFirstCall = function (spies) {
      return spies.sort(function (a, b) {
        // uuid, won't ever be equal
        var aCall = a.getCall(0);
        var bCall = b.getCall(0);
        var aId = aCall && aCall.callId || -1;
        var bId = bCall && bCall.callId || -1;

        return aId < bId ? -1 : 1;
      });
    };

    sinon.createStubInstance = function (constructor) {
      if (typeof constructor !== "function") {
        throw new TypeError("The constructor should be a function.");
      }
      return sinon.stub(sinon.create(constructor.prototype));
    };

    sinon.restore = function (object) {
      if (object !== null && typeof object === "object") {
        for (var prop in object) {
          if (isRestorable(object[prop])) {
            object[prop].restore();
          }
        }
      } else if (isRestorable(object)) {
        object.restore();
      }
    };

    return sinon;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports) {
    makeApi(exports);
  }

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * @depend util/core.js
 */
(function (sinonGlobal) {

  function makeApi(sinon) {

    // Adapted from https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
    var hasDontEnumBug = (function () {
      var obj = {
        constructor: function () {
          return "0";
        },
        toString: function () {
          return "1";
        },
        valueOf: function () {
          return "2";
        },
        toLocaleString: function () {
          return "3";
        },
        prototype: function () {
          return "4";
        },
        isPrototypeOf: function () {
          return "5";
        },
        propertyIsEnumerable: function () {
          return "6";
        },
        hasOwnProperty: function () {
          return "7";
        },
        length: function () {
          return "8";
        },
        unique: function () {
          return "9";
        }
      };

      var result = [];
      for (var prop in obj) {
        if (obj.hasOwnProperty(prop)) {
          result.push(obj[prop]());
        }
      }
      return result.join("") !== "0123456789";
    })();

    /* Public: Extend target in place with all (own) properties from sources in-order. Thus, last source will
     *         override properties in previous sources.
     *
     * target - The Object to extend
     * sources - Objects to copy properties from.
     *
     * Returns the extended target
     */
    function extend(target /*, sources */) {
      var sources = Array.prototype.slice.call(arguments, 1);
      var source, i, prop;

      for (i = 0; i < sources.length; i++) {
        source = sources[i];

        for (prop in source) {
          if (source.hasOwnProperty(prop)) {
            target[prop] = source[prop];
          }
        }

        // Make sure we copy (own) toString method even when in JScript with DontEnum bug
        // See https://developer.mozilla.org/en/docs/ECMAScript_DontEnum_attribute#JScript_DontEnum_Bug
        if (hasDontEnumBug && source.hasOwnProperty("toString") && source.toString !== target.toString) {
          target.toString = source.toString;
        }
      }

      return target;
    }

    sinon.extend = extend;
    return sinon.extend;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */
if (typeof sinon === "undefined") {
  this.sinon = {};
}

(function () {

  var push = [].push;

  function makeApi(sinon) {
    sinon.Event = function Event(type, bubbles, cancelable, target) {
      this.initEvent(type, bubbles, cancelable, target);
    };

    sinon.Event.prototype = {
      initEvent: function (type, bubbles, cancelable, target) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.target = target;
      },

      stopPropagation: function () {},

      preventDefault: function () {
        this.defaultPrevented = true;
      }
    };

    sinon.ProgressEvent = function ProgressEvent(type, progressEventRaw, target) {
      this.initEvent(type, false, false, target);
      this.loaded = progressEventRaw.loaded || null;
      this.total = progressEventRaw.total || null;
      this.lengthComputable = !!progressEventRaw.total;
    };

    sinon.ProgressEvent.prototype = new sinon.Event();

    sinon.ProgressEvent.prototype.constructor = sinon.ProgressEvent;

    sinon.CustomEvent = function CustomEvent(type, customData, target) {
      this.initEvent(type, false, false, target);
      this.detail = customData.detail || null;
    };

    sinon.CustomEvent.prototype = new sinon.Event();

    sinon.CustomEvent.prototype.constructor = sinon.CustomEvent;

    sinon.EventTarget = {
      addEventListener: function addEventListener(event, listener) {
        this.eventListeners = this.eventListeners || {};
        this.eventListeners[event] = this.eventListeners[event] || [];
        push.call(this.eventListeners[event], listener);
      },

      removeEventListener: function removeEventListener(event, listener) {
        var listeners = this.eventListeners && this.eventListeners[event] || [];

        for (var i = 0, l = listeners.length; i < l; ++i) {
          if (listeners[i] === listener) {
            return listeners.splice(i, 1);
          }
        }
      },

      dispatchEvent: function dispatchEvent(event) {
        var type = event.type;
        var listeners = this.eventListeners && this.eventListeners[type] || [];

        for (var i = 0; i < listeners.length; i++) {
          if (typeof listeners[i] === "function") {
            listeners[i].call(this, event);
          } else {
            listeners[i].handleEvent(event);
          }
        }

        return !!event.defaultPrevented;
      }
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require) {
    var sinon = require("./core");
    makeApi(sinon);
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * @depend util/core.js
 */
/**
 * Logs errors
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal) {

  // cache a reference to setTimeout, so that our reference won't be stubbed out
  // when using fake timers and errors will still get logged
  // https://github.com/cjohansen/Sinon.JS/issues/381
  var realSetTimeout = setTimeout;

  function makeApi(sinon) {

    function log() {}

    function logError(label, err) {
      var msg = label + " threw exception: ";

      function throwLoggedError() {
        err.message = msg + err.message;
        throw err;
      }

      sinon.log(msg + "[" + err.name + "] " + err.message);

      if (err.stack) {
        sinon.log(err.stack);
      }

      if (logError.useImmediateExceptions) {
        throwLoggedError();
      } else {
        logError.setTimeout(throwLoggedError, 0);
      }
    }

    // When set to true, any errors logged will be thrown immediately;
    // If set to false, the errors will be thrown in separate execution frame.
    logError.useImmediateExceptions = false;

    // wrap realSetTimeout with something we can stub in tests
    logError.setTimeout = function (func, timeout) {
      realSetTimeout(func, timeout);
    };

    var exports = {};
    exports.log = sinon.log = log;
    exports.logError = sinon.logError = logError;

    return exports;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon // eslint-disable-line no-undef
));

/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XDomainRequest object
 */
if (typeof sinon === "undefined") {
  this.sinon = {};
}

// wrapper for global
(function (global) {

  var xdr = { XDomainRequest: global.XDomainRequest };
  xdr.GlobalXDomainRequest = global.XDomainRequest;
  xdr.supportsXDR = typeof xdr.GlobalXDomainRequest !== "undefined";
  xdr.workingXDR = xdr.supportsXDR ? xdr.GlobalXDomainRequest : false;

  function makeApi(sinon) {
    sinon.xdr = xdr;

    function FakeXDomainRequest() {
      this.readyState = FakeXDomainRequest.UNSENT;
      this.requestBody = null;
      this.requestHeaders = {};
      this.status = 0;
      this.timeout = null;

      if (typeof FakeXDomainRequest.onCreate === "function") {
        FakeXDomainRequest.onCreate(this);
      }
    }

    function verifyState(x) {
      if (x.readyState !== FakeXDomainRequest.OPENED) {
        throw new Error("INVALID_STATE_ERR");
      }

      if (x.sendFlag) {
        throw new Error("INVALID_STATE_ERR");
      }
    }

    function verifyRequestSent(x) {
      if (x.readyState === FakeXDomainRequest.UNSENT) {
        throw new Error("Request not sent");
      }
      if (x.readyState === FakeXDomainRequest.DONE) {
        throw new Error("Request done");
      }
    }

    function verifyResponseBodyType(body) {
      if (typeof body !== "string") {
        var error = new Error("Attempted to respond to fake XDomainRequest with " +
            body + ", which is not a string.");
        error.name = "InvalidBodyException";
        throw error;
      }
    }

    sinon.extend(FakeXDomainRequest.prototype, sinon.EventTarget, {
      open: function open(method, url) {
        this.method = method;
        this.url = url;

        this.responseText = null;
        this.sendFlag = false;

        this.readyStateChange(FakeXDomainRequest.OPENED);
      },

      readyStateChange: function readyStateChange(state) {
        this.readyState = state;
        var eventName = "";
        switch (this.readyState) {
          case FakeXDomainRequest.UNSENT:
            break;
          case FakeXDomainRequest.OPENED:
            break;
          case FakeXDomainRequest.LOADING:
            if (this.sendFlag) {
              //raise the progress event
              eventName = "onprogress";
            }
            break;
          case FakeXDomainRequest.DONE:
            if (this.isTimeout) {
              eventName = "ontimeout";
            } else if (this.errorFlag || (this.status < 200 || this.status > 299)) {
              eventName = "onerror";
            } else {
              eventName = "onload";
            }
            break;
        }

        // raising event (if defined)
        if (eventName) {
          if (typeof this[eventName] === "function") {
            try {
              this[eventName]();
            } catch (e) {
              sinon.logError("Fake XHR " + eventName + " handler", e);
            }
          }
        }
      },

      send: function send(data) {
        verifyState(this);

        if (!/^(get|head)$/i.test(this.method)) {
          this.requestBody = data;
        }
        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";

        this.errorFlag = false;
        this.sendFlag = true;
        this.readyStateChange(FakeXDomainRequest.OPENED);

        if (typeof this.onSend === "function") {
          this.onSend(this);
        }
      },

      abort: function abort() {
        this.aborted = true;
        this.responseText = null;
        this.errorFlag = true;

        if (this.readyState > sinon.FakeXDomainRequest.UNSENT && this.sendFlag) {
          this.readyStateChange(sinon.FakeXDomainRequest.DONE);
          this.sendFlag = false;
        }
      },

      setResponseBody: function setResponseBody(body) {
        verifyRequestSent(this);
        verifyResponseBodyType(body);

        var chunkSize = this.chunkSize || 10;
        var index = 0;
        this.responseText = "";

        do {
          this.readyStateChange(FakeXDomainRequest.LOADING);
          this.responseText += body.substring(index, index + chunkSize);
          index += chunkSize;
        } while (index < body.length);

        this.readyStateChange(FakeXDomainRequest.DONE);
      },

      respond: function respond(status, contentType, body) {
        // content-type ignored, since XDomainRequest does not carry this
        // we keep the same syntax for respond(...) as for FakeXMLHttpRequest to ease
        // test integration across browsers
        this.status = typeof status === "number" ? status : 200;
        this.setResponseBody(body || "");
      },

      simulatetimeout: function simulatetimeout() {
        this.status = 0;
        this.isTimeout = true;
        // Access to this should actually throw an error
        this.responseText = undefined;
        this.readyStateChange(FakeXDomainRequest.DONE);
      }
    });

    sinon.extend(FakeXDomainRequest, {
      UNSENT: 0,
      OPENED: 1,
      LOADING: 3,
      DONE: 4
    });

    sinon.useFakeXDomainRequest = function useFakeXDomainRequest() {
      sinon.FakeXDomainRequest.restore = function restore(keepOnCreate) {
        if (xdr.supportsXDR) {
          global.XDomainRequest = xdr.GlobalXDomainRequest;
        }

        delete sinon.FakeXDomainRequest.restore;

        if (keepOnCreate !== true) {
          delete sinon.FakeXDomainRequest.onCreate;
        }
      };
      if (xdr.supportsXDR) {
        global.XDomainRequest = sinon.FakeXDomainRequest;
      }
      return sinon.FakeXDomainRequest;
    };

    sinon.FakeXDomainRequest = FakeXDomainRequest;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("../extend");
    require("./event");
    require("../log_error");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
})(typeof global !== "undefined" ? global : self);

/**
 * @depend core.js
 * @depend ../extend.js
 * @depend event.js
 * @depend ../log_error.js
 */
/**
 * Fake XMLHttpRequest object
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function (sinonGlobal, global) {

  function getWorkingXHR(globalScope) {
    var supportsXHR = typeof globalScope.XMLHttpRequest !== "undefined";
    if (supportsXHR) {
      return globalScope.XMLHttpRequest;
    }

    var supportsActiveX = typeof globalScope.ActiveXObject !== "undefined";
    if (supportsActiveX) {
      return function () {
        return new globalScope.ActiveXObject("MSXML2.XMLHTTP.3.0");
      };
    }

    return false;
  }

  var supportsProgress = typeof ProgressEvent !== "undefined";
  var supportsCustomEvent = typeof CustomEvent !== "undefined";
  var supportsFormData = typeof FormData !== "undefined";
  var supportsArrayBuffer = typeof ArrayBuffer !== "undefined";
  var supportsBlob = typeof Blob === "function";
  var sinonXhr = { XMLHttpRequest: global.XMLHttpRequest };
  sinonXhr.GlobalXMLHttpRequest = global.XMLHttpRequest;
  sinonXhr.GlobalActiveXObject = global.ActiveXObject;
  sinonXhr.supportsActiveX = typeof sinonXhr.GlobalActiveXObject !== "undefined";
  sinonXhr.supportsXHR = typeof sinonXhr.GlobalXMLHttpRequest !== "undefined";
  sinonXhr.workingXHR = getWorkingXHR(global);
  sinonXhr.supportsCORS = sinonXhr.supportsXHR && "withCredentials" in (new sinonXhr.GlobalXMLHttpRequest());

  var unsafeHeaders = {
    "Accept-Charset": true,
    "Accept-Encoding": true,
    Connection: true,
    "Content-Length": true,
    Cookie: true,
    Cookie2: true,
    "Content-Transfer-Encoding": true,
    Date: true,
    Expect: true,
    Host: true,
    "Keep-Alive": true,
    Referer: true,
    TE: true,
    Trailer: true,
    "Transfer-Encoding": true,
    Upgrade: true,
    "User-Agent": true,
    Via: true
  };

  // An upload object is created for each
  // FakeXMLHttpRequest and allows upload
  // events to be simulated using uploadProgress
  // and uploadError.
  function UploadProgress() {
    this.eventListeners = {
      progress: [],
      load: [],
      abort: [],
      error: []
    };
  }

  UploadProgress.prototype.addEventListener = function addEventListener(event, listener) {
    this.eventListeners[event].push(listener);
  };

  UploadProgress.prototype.removeEventListener = function removeEventListener(event, listener) {
    var listeners = this.eventListeners[event] || [];

    for (var i = 0, l = listeners.length; i < l; ++i) {
      if (listeners[i] === listener) {
        return listeners.splice(i, 1);
      }
    }
  };

  UploadProgress.prototype.dispatchEvent = function dispatchEvent(event) {
    var listeners = this.eventListeners[event.type] || [];

    for (var i = 0, listener; (listener = listeners[i]) != null; i++) {
      listener(event);
    }
  };

  // Note that for FakeXMLHttpRequest to work pre ES5
  // we lose some of the alignment with the spec.
  // To ensure as close a match as possible,
  // set responseType before calling open, send or respond;
  function FakeXMLHttpRequest() {
    this.readyState = FakeXMLHttpRequest.UNSENT;
    this.requestHeaders = {};
    this.requestBody = null;
    this.status = 0;
    this.statusText = "";
    this.upload = new UploadProgress();
    this.responseType = "";
    this.response = "";
    if (sinonXhr.supportsCORS) {
      this.withCredentials = false;
    }

    var xhr = this;
    var events = ["loadstart", "load", "abort", "loadend"];

    function addEventListener(eventName) {
      xhr.addEventListener(eventName, function (event) {
        var listener = xhr["on" + eventName];

        if (listener && typeof listener === "function") {
          listener.call(this, event);
        }
      });
    }

    for (var i = events.length - 1; i >= 0; i--) {
      addEventListener(events[i]);
    }

    if (typeof FakeXMLHttpRequest.onCreate === "function") {
      FakeXMLHttpRequest.onCreate(this);
    }
  }

  function verifyState(xhr) {
    if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR");
    }

    if (xhr.sendFlag) {
      throw new Error("INVALID_STATE_ERR");
    }
  }

  function getHeader(headers, header) {
    header = header.toLowerCase();

    for (var h in headers) {
      if (h.toLowerCase() === header) {
        return h;
      }
    }

    return null;
  }

  // filtering to enable a white-list version of Sinon FakeXhr,
  // where whitelisted requests are passed through to real XHR
  function each(collection, callback) {
    if (!collection) {
      return;
    }

    for (var i = 0, l = collection.length; i < l; i += 1) {
      callback(collection[i]);
    }
  }
  function some(collection, callback) {
    for (var index = 0; index < collection.length; index++) {
      if (callback(collection[index]) === true) {
        return true;
      }
    }
    return false;
  }
  // largest arity in XHR is 5 - XHR#open
  var apply = function (obj, method, args) {
    switch (args.length) {
      case 0: return obj[method]();
      case 1: return obj[method](args[0]);
      case 2: return obj[method](args[0], args[1]);
      case 3: return obj[method](args[0], args[1], args[2]);
      case 4: return obj[method](args[0], args[1], args[2], args[3]);
      case 5: return obj[method](args[0], args[1], args[2], args[3], args[4]);
    }
  };

  FakeXMLHttpRequest.filters = [];
  FakeXMLHttpRequest.addFilter = function addFilter(fn) {
    this.filters.push(fn);
  };
  var IE6Re = /MSIE 6/;
  FakeXMLHttpRequest.onResponseEnd = function() {};
  FakeXMLHttpRequest.defake = function defake(fakeXhr, xhrArgs) {
    var xhr = new sinonXhr.workingXHR(); // eslint-disable-line new-cap

    each([
      "open",
      "setRequestHeader",
      "send",
      "abort",
      "getResponseHeader",
      "getAllResponseHeaders",
      "addEventListener",
      "overrideMimeType",
      "removeEventListener"
    ], function (method) {
      fakeXhr[method] = function () {
        return apply(xhr, method, arguments);
      };
    });

    var copyAttrs = function (args) {
      each(args, function (attr) {
        try {
          fakeXhr[attr] = xhr[attr];
        } catch (e) {
          if (!IE6Re.test(navigator.userAgent)) {
            throw e;
          }
        }
      });
    };

    var stateChange = function stateChange() {
      fakeXhr.readyState = xhr.readyState;
      if (xhr.readyState >= FakeXMLHttpRequest.HEADERS_RECEIVED) {
        copyAttrs(["status", "statusText"]);
      }
      if (xhr.readyState >= FakeXMLHttpRequest.LOADING) {
        copyAttrs(["responseText", "response"]);
      }
      if (xhr.readyState === FakeXMLHttpRequest.DONE) {
        copyAttrs(["responseXML"]);
        FakeXMLHttpRequest.onResponseEnd(fakeXhr);
      }
      if (fakeXhr.onreadystatechange) {
        fakeXhr.onreadystatechange.call(fakeXhr, { target: fakeXhr });
      }
    };

    if (xhr.addEventListener) {
      for (var event in fakeXhr.eventListeners) {
        if (fakeXhr.eventListeners.hasOwnProperty(event)) {

          /*eslint-disable no-loop-func*/
          each(fakeXhr.eventListeners[event], function (handler) {
            xhr.addEventListener(event, handler);
          });
          /*eslint-enable no-loop-func*/
        }
      }
      xhr.addEventListener("readystatechange", stateChange);
    } else {
      xhr.onreadystatechange = stateChange;
    }
    apply(xhr, "open", xhrArgs);
  };
  FakeXMLHttpRequest.useFilters = false;

  function verifyRequestOpened(xhr) {
    if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
      throw new Error("INVALID_STATE_ERR - " + xhr.readyState);
    }
  }

  function verifyRequestSent(xhr) {
    if (xhr.readyState === FakeXMLHttpRequest.DONE) {
      throw new Error("Request done");
    }
  }

  function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState !== FakeXMLHttpRequest.HEADERS_RECEIVED) {
      throw new Error("No headers received");
    }
  }

  function verifyResponseBodyType(body) {
    if (typeof body !== "string") {
      var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
          body + ", which is not a string.");
      error.name = "InvalidBodyException";
      throw error;
    }
  }

  function convertToArrayBuffer(body) {
    var buffer = new ArrayBuffer(body.length);
    var view = new Uint8Array(buffer);
    for (var i = 0; i < body.length; i++) {
      var charCode = body.charCodeAt(i);
      if (charCode >= 256) {
        throw new TypeError("arraybuffer or blob responseTypes require binary string, " +
            "invalid character " + body[i] + " found.");
      }
      view[i] = charCode;
    }
    return buffer;
  }

  function isXmlContentType(contentType) {
    return !contentType || /(text\/xml)|(application\/xml)|(\+xml)/.test(contentType);
  }

  function convertResponseBody(responseType, contentType, body) {
    if (responseType === "" || responseType === "text") {
      return body;
    } else if (supportsArrayBuffer && responseType === "arraybuffer") {
      return convertToArrayBuffer(body);
    } else if (responseType === "json") {
      try {
        return JSON.parse(body);
      } catch (e) {
        // Return parsing failure as null
        return null;
      }
    } else if (supportsBlob && responseType === "blob") {
      var blobOptions = {};
      if (contentType) {
        blobOptions.type = contentType;
      }
      return new Blob([convertToArrayBuffer(body)], blobOptions);
    } else if (responseType === "document") {
      if (isXmlContentType(contentType)) {
        return FakeXMLHttpRequest.parseXML(body);
      }
      return null;
    }
    throw new Error("Invalid responseType " + responseType);
  }

  function clearResponse(xhr) {
    if (xhr.responseType === "" || xhr.responseType === "text") {
      xhr.response = xhr.responseText = "";
    } else {
      xhr.response = xhr.responseText = null;
    }
    xhr.responseXML = null;
  }

  FakeXMLHttpRequest.parseXML = function parseXML(text) {
    // Treat empty string as parsing failure
    if (text !== "") {
      try {
        if (typeof DOMParser !== "undefined") {
          var parser = new DOMParser();
          return parser.parseFromString(text, "text/xml");
        }
        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
        xmlDoc.async = "false";
        xmlDoc.loadXML(text);
        return xmlDoc;
      } catch (e) {
        // Unable to parse XML - no biggie
      }
    }

    return null;
  };

  FakeXMLHttpRequest.statusCodes = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    203: "Non-Authoritative Information",
    204: "No Content",
    205: "Reset Content",
    206: "Partial Content",
    207: "Multi-Status",
    300: "Multiple Choice",
    301: "Moved Permanently",
    302: "Found",
    303: "See Other",
    304: "Not Modified",
    305: "Use Proxy",
    307: "Temporary Redirect",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    409: "Conflict",
    410: "Gone",
    411: "Length Required",
    412: "Precondition Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Requested Range Not Satisfiable",
    417: "Expectation Failed",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
    505: "HTTP Version Not Supported"
  };

  function makeApi(sinon) {
    sinon.xhr = sinonXhr;

    sinon.extend(FakeXMLHttpRequest.prototype, sinon.EventTarget, {
      async: true,

      open: function open(method, url, async, username, password) {
        this.method = method;
        this.url = url;
        this.async = typeof async === "boolean" ? async : true;
        this.username = username;
        this.password = password;
        clearResponse(this);
        this.requestHeaders = {};
        this.sendFlag = false;

        if (FakeXMLHttpRequest.useFilters === true) {
          var xhrArgs = arguments;
          var defake = some(FakeXMLHttpRequest.filters, function (filter) {
            return filter.apply(this, xhrArgs);
          });
          if (defake) {
            return FakeXMLHttpRequest.defake(this, arguments);
          }
        }
        this.readyStateChange(FakeXMLHttpRequest.OPENED);
      },

      readyStateChange: function readyStateChange(state) {
        this.readyState = state;

        var readyStateChangeEvent = new sinon.Event("readystatechange", false, false, this);

        if (typeof this.onreadystatechange === "function") {
          try {
            this.onreadystatechange(readyStateChangeEvent);
          } catch (e) {
            sinon.logError("Fake XHR onreadystatechange handler", e);
          }
        }

        switch (this.readyState) {
          case FakeXMLHttpRequest.DONE:
            if (supportsProgress) {
              this.upload.dispatchEvent(new sinon.ProgressEvent("progress", {loaded: 100, total: 100}));
              this.dispatchEvent(new sinon.ProgressEvent("progress", {loaded: 100, total: 100}));
            }
            this.upload.dispatchEvent(new sinon.Event("load", false, false, this));
            this.dispatchEvent(new sinon.Event("load", false, false, this));
            this.dispatchEvent(new sinon.Event("loadend", false, false, this));
            break;
        }

        this.dispatchEvent(readyStateChangeEvent);
      },

      setRequestHeader: function setRequestHeader(header, value) {
        verifyState(this);

        if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
          throw new Error("Refused to set unsafe header \"" + header + "\"");
        }

        if (this.requestHeaders[header]) {
          this.requestHeaders[header] += "," + value;
        } else {
          this.requestHeaders[header] = value;
        }
      },

      // Helps testing
      setResponseHeaders: function setResponseHeaders(headers) {
        verifyRequestOpened(this);
        this.responseHeaders = {};

        for (var header in headers) {
          if (headers.hasOwnProperty(header)) {
            this.responseHeaders[header] = headers[header];
          }
        }

        if (this.async) {
          this.readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
        } else {
          this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
        }
      },

      // Currently treats ALL data as a DOMString (i.e. no Document)
      send: function send(data) {
        verifyState(this);

        if (!/^(get|head)$/i.test(this.method)) {
          var contentType = getHeader(this.requestHeaders, "Content-Type");
          if (this.requestHeaders[contentType]) {
            var value = this.requestHeaders[contentType].split(";");
            this.requestHeaders[contentType] = value[0] + ";charset=utf-8";
          } else if (supportsFormData && !(data instanceof FormData)) {
            this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
          }

          this.requestBody = data;
        }

        this.errorFlag = false;
        this.sendFlag = this.async;
        clearResponse(this);
        this.readyStateChange(FakeXMLHttpRequest.OPENED);

        if (typeof this.onSend === "function") {
          this.onSend(this);
        }

        this.dispatchEvent(new sinon.Event("loadstart", false, false, this));
      },

      abort: function abort() {
        this.aborted = true;
        clearResponse(this);
        this.errorFlag = true;
        this.requestHeaders = {};
        this.responseHeaders = {};

        if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
          this.readyStateChange(FakeXMLHttpRequest.DONE);
          this.sendFlag = false;
        }

        this.readyState = FakeXMLHttpRequest.UNSENT;

        this.dispatchEvent(new sinon.Event("abort", false, false, this));

        this.upload.dispatchEvent(new sinon.Event("abort", false, false, this));

        if (typeof this.onerror === "function") {
          this.onerror();
        }
      },

      getResponseHeader: function getResponseHeader(header) {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
          return null;
        }

        if (/^Set-Cookie2?$/i.test(header)) {
          return null;
        }

        header = getHeader(this.responseHeaders, header);

        return this.responseHeaders[header] || null;
      },

      getAllResponseHeaders: function getAllResponseHeaders() {
        if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
          return "";
        }

        var headers = "";

        for (var header in this.responseHeaders) {
          if (this.responseHeaders.hasOwnProperty(header) &&
              !/^Set-Cookie2?$/i.test(header)) {
            headers += header + ": " + this.responseHeaders[header] + "\r\n";
          }
        }

        return headers;
      },

      setResponseBody: function setResponseBody(body) {
        verifyRequestSent(this);
        verifyHeadersReceived(this);
        verifyResponseBodyType(body);
        var contentType = this.getResponseHeader("Content-Type");

        var isTextResponse = this.responseType === "" || this.responseType === "text";
        clearResponse(this);
        if (this.async) {
          var chunkSize = this.chunkSize || 10;
          var index = 0;

          do {
            this.readyStateChange(FakeXMLHttpRequest.LOADING);

            if (isTextResponse) {
              this.responseText = this.response += body.substring(index, index + chunkSize);
            }
            index += chunkSize;
          } while (index < body.length);
        }

        this.response = convertResponseBody(this.responseType, contentType, body);
        if (isTextResponse) {
          this.responseText = this.response;
        }

        if (this.responseType === "document") {
          this.responseXML = this.response;
        } else if (this.responseType === "" && isXmlContentType(contentType)) {
          this.responseXML = FakeXMLHttpRequest.parseXML(this.responseText);
        }
        this.readyStateChange(FakeXMLHttpRequest.DONE);
      },

      respond: function respond(status, headers, body) {
        this.status = typeof status === "number" ? status : 200;
        this.statusText = FakeXMLHttpRequest.statusCodes[this.status];
        this.setResponseHeaders(headers || {});
        this.setResponseBody(body || "");
      },

      uploadProgress: function uploadProgress(progressEventRaw) {
        if (supportsProgress) {
          this.upload.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
        }
      },

      downloadProgress: function downloadProgress(progressEventRaw) {
        if (supportsProgress) {
          this.dispatchEvent(new sinon.ProgressEvent("progress", progressEventRaw));
        }
      },

      uploadError: function uploadError(error) {
        if (supportsCustomEvent) {
          this.upload.dispatchEvent(new sinon.CustomEvent("error", {detail: error}));
        }
      }
    });

    sinon.extend(FakeXMLHttpRequest, {
      UNSENT: 0,
      OPENED: 1,
      HEADERS_RECEIVED: 2,
      LOADING: 3,
      DONE: 4
    });

    sinon.useFakeXMLHttpRequest = function () {
      FakeXMLHttpRequest.restore = function restore(keepOnCreate) {
        if (sinonXhr.supportsXHR) {
          global.XMLHttpRequest = sinonXhr.GlobalXMLHttpRequest;
        }

        if (sinonXhr.supportsActiveX) {
          global.ActiveXObject = sinonXhr.GlobalActiveXObject;
        }

        delete FakeXMLHttpRequest.restore;

        if (keepOnCreate !== true) {
          delete FakeXMLHttpRequest.onCreate;
        }
      };
      if (sinonXhr.supportsXHR) {
        global.XMLHttpRequest = FakeXMLHttpRequest;
      }

      if (sinonXhr.supportsActiveX) {
        global.ActiveXObject = function ActiveXObject(objId) {
          if (objId === "Microsoft.XMLHTTP" || /^Msxml2\.XMLHTTP/i.test(objId)) {

            return new FakeXMLHttpRequest();
          }

          return new sinonXhr.GlobalActiveXObject(objId);
        };
      }

      return FakeXMLHttpRequest;
    };

    sinon.FakeXMLHttpRequest = FakeXMLHttpRequest;
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("../extend");
    require("./event");
    require("../log_error");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof global !== "undefined" ? global : self
));

/**
 * @depend util/core.js
 */
/**
 * Format functions
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2014 Christian Johansen
 */
(function (sinonGlobal, formatio) {

  function makeApi(sinon) {
    function valueFormatter(value) {
      return "" + value;
    }

    function getFormatioFormatter() {
      var formatter = formatio.configure({
        quoteStrings: false,
        limitChildrenCount: 250
      });

      function format() {
        return formatter.ascii.apply(formatter, arguments);
      }

      return format;
    }

    function getNodeFormatter() {
      try {
        var util = require("util");
      } catch (e) {
        /* Node, but no util module - would be very old, but better safe than sorry */
      }

      function format(v) {
        var isObjectWithNativeToString = typeof v === "object" && v.toString === Object.prototype.toString;
        return isObjectWithNativeToString ? util.inspect(v) : v;
      }

      return util ? format : valueFormatter;
    }

    var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
    var formatter;

    if (isNode) {
      try {
        formatio = require("formatio");
      }
      catch (e) {} // eslint-disable-line no-empty
    }

    if (formatio) {
      formatter = getFormatioFormatter();
    } else if (isNode) {
      formatter = getNodeFormatter();
    } else {
      formatter = valueFormatter;
    }

    sinon.format = formatter;
    return sinon.format;
  }

  function loadDependencies(require, exports, module) {
    var sinon = require("./util/core");
    module.exports = makeApi(sinon);
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  if (isAMD) {
    define(loadDependencies);
    return;
  }

  if (isNode) {
    loadDependencies(require, module.exports, module);
    return;
  }

  if (sinonGlobal) {
    makeApi(sinonGlobal);
  }
}(
    typeof sinon === "object" && sinon, // eslint-disable-line no-undef
    typeof formatio === "object" && formatio // eslint-disable-line no-undef
));

/**
 * @depend fake_xdomain_request.js
 * @depend fake_xml_http_request.js
 * @depend ../format.js
 * @depend ../log_error.js
 */
/**
 * The Sinon "server" mimics a web server that receives requests from
 * sinon.FakeXMLHttpRequest and provides an API to respond to those requests,
 * both synchronously and asynchronously. To respond synchronuously, canned
 * answers have to be provided upfront.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  var push = [].push;

  function responseArray(handler) {
    var response = handler;

    if (Object.prototype.toString.call(handler) !== "[object Array]") {
      response = [200, {}, handler];
    }

    if (typeof response[2] !== "string") {
      throw new TypeError("Fake server response body should be string, but was " +
          typeof response[2]);
    }

    return response;
  }

  var wloc = typeof window !== "undefined" ? window.location : {};
  var rCurrLoc = new RegExp("^" + wloc.protocol + "//" + wloc.host);

  function matchOne(response, reqMethod, reqUrl) {
    var rmeth = response.method;
    var matchMethod = !rmeth || rmeth.toLowerCase() === reqMethod.toLowerCase();
    var url = response.url;
    var matchUrl = !url || url === reqUrl || (typeof url.test === "function" && url.test(reqUrl));

    return matchMethod && matchUrl;
  }

  function match(response, request) {
    var requestUrl = request.url;

    if (!/^https?:\/\//.test(requestUrl) || rCurrLoc.test(requestUrl)) {
      requestUrl = requestUrl.replace(rCurrLoc, "");
    }

    if (matchOne(response, this.getHTTPMethod(request), requestUrl)) {
      if (typeof response.response === "function") {
        var ru = response.url;
        var args = [request].concat(ru && typeof ru.exec === "function" ? ru.exec(requestUrl).slice(1) : []);
        return response.response.apply(response, args);
      }

      return true;
    }

    return false;
  }

  function makeApi(sinon) {
    var leoConfiguration = null;
    sinon.fakeServer = {
      create: function (config) {
        var server = sinon.create(this);
        server.configure(config);
        if (!sinon.xhr.supportsCORS) {
          this.xhr = sinon.useFakeXDomainRequest();
        } else {
          this.xhr = sinon.useFakeXMLHttpRequest();
        }
        server.requests = [];

        this.xhr.onCreate = function (xhrObj) {
          server.addRequest(xhrObj);
        };

        return server;
      },
      configure: function (config) {
        var whitelist = {
          "autoRespond": true,
          "autoRespondAfter": true,
          "respondImmediately": true,
          "fakeHTTPMethods": true
        };
        var setting;

        config = config || {};
        for (setting in config) {
          if (whitelist.hasOwnProperty(setting) && config.hasOwnProperty(setting)) {
            this[setting] = config[setting];
          }
        }
      },
      addRequest: function addRequest(xhrObj) {
        var server = this;
        push.call(this.requests, xhrObj);

        xhrObj.onSend = function () {
          server.handleRequest(this);

          if (server.respondImmediately) {
            server.respond();
          } else if (server.autoRespond && !server.responding) {
            var request = this;
            leoConfiguration = leoConfiguration || angular.element(document.body).injector().get('leoConfiguration');
            var state = leoConfiguration.fetchStatesByUrlAndMethod(request.url, request.method);
            var delay;
            if(state && state.activeOption && state.activeOption.hasOwnProperty('delay')) {
              delay = state.activeOption.delay;
            } else {
              delay = server.autoRespondAfter || 10;
            }

            setTimeout(function () {
              server.responding = false;
              server.respond();
            }, delay);

            server.responding = true;
          }
        };
      },

      getHTTPMethod: function getHTTPMethod(request) {
        if (this.fakeHTTPMethods && /post/i.test(request.method)) {
          var matches = (request.requestBody || "").match(/_method=([^\b;]+)/);
          return matches ? matches[1] : request.method;
        }

        return request.method;
      },

      handleRequest: function handleRequest(xhr) {
        if (xhr.async) {
          if (!this.queue) {
            this.queue = [];
          }

          push.call(this.queue, xhr);
        } else {
          this.processRequest(xhr);
        }
      },

      log: function log(response, request) {
        var str;

        str = "Request:\n" + sinon.format(request) + "\n\n";
        str += "Response:\n" + sinon.format(response) + "\n\n";

        sinon.log(str);
      },

      respondWith: function respondWith(method, url, body) {
        if (arguments.length === 1 && typeof method !== "function") {
          this.response = responseArray(method);
          return;
        }

        if (!this.responses) {
          this.responses = [];
        }

        if (arguments.length === 1) {
          body = method;
          url = method = null;
        }

        if (arguments.length === 2) {
          body = url;
          url = method;
          method = null;
        }

        push.call(this.responses, {
          method: method,
          url: url,
          response: typeof body === "function" ? body : responseArray(body)
        });
      },

      respond: function respond() {
        if (arguments.length > 0) {
          this.respondWith.apply(this, arguments);
        }

        var queue = this.queue || [];
        var requests = queue.splice(0, queue.length);

        for (var i = 0; i < requests.length; i++) {
          this.processRequest(requests[i]);
        }
      },

      processRequest: function processRequest(request) {
        try {
          if (request.aborted) {
            return;
          }

          var response = this.response || [404, {}, ""];

          if (this.responses) {
            for (var l = this.responses.length, i = l - 1; i >= 0; i--) {
              if (match.call(this, this.responses[i], request)) {
                response = this.responses[i].response;
                break;
              }
            }
          }

          if (request.readyState !== 4) {
            this.log(response, request);
            request.respond(response[0], response[1], response[2]);
          }
        } catch (e) {
          sinon.logError("Fake server request processing", e);
        }
      },

      restore: function restore() {
        return this.xhr.restore && this.xhr.restore.apply(this.xhr, arguments);
      }
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, exports, module) {
    var sinon = require("./core");
    require("./fake_xdomain_request");
    require("./fake_xml_http_request");
    require("../format");
    makeApi(sinon);
    module.exports = sinon;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * Fake timer API
 * setTimeout
 * setInterval
 * clearTimeout
 * clearInterval
 * tick
 * reset
 * Date
 *
 * Inspired by jsUnitMockTimeOut from JsUnit
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  function makeApi(s, lol) {
    /*global lolex */
    var llx = typeof lolex !== "undefined" ? lolex : lol;

    s.useFakeTimers = function () {
      var now;
      var methods = Array.prototype.slice.call(arguments);

      if (typeof methods[0] === "string") {
        now = 0;
      } else {
        now = methods.shift();
      }

      var clock = llx.install(now || 0, methods);
      clock.restore = clock.uninstall;
      return clock;
    };

    s.clock = {
      create: function (now) {
        return llx.createClock(now);
      }
    };

    s.timers = {
      setTimeout: setTimeout,
      clearTimeout: clearTimeout,
      setImmediate: (typeof setImmediate !== "undefined" ? setImmediate : undefined),
      clearImmediate: (typeof clearImmediate !== "undefined" ? clearImmediate : undefined),
      setInterval: setInterval,
      clearInterval: clearInterval,
      Date: Date
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require, epxorts, module, lolex) {
    var core = require("./core");
    makeApi(core, lolex);
    module.exports = core;
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require, module.exports, module, require("lolex"));
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

/**
 * @depend fake_server.js
 * @depend fake_timers.js
 */
/**
 * Add-on for sinon.fakeServer that automatically handles a fake timer along with
 * the FakeXMLHttpRequest. The direct inspiration for this add-on is jQuery
 * 1.3.x, which does not use xhr object's onreadystatehandler at all - instead,
 * it polls the object for completion with setInterval. Dispite the direct
 * motivation, there is nothing jQuery-specific in this file, so it can be used
 * in any environment where the ajax implementation depends on setInterval or
 * setTimeout.
 *
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2010-2013 Christian Johansen
 */
(function () {

  function makeApi(sinon) {
    function Server() {}
    Server.prototype = sinon.fakeServer;

    sinon.fakeServerWithClock = new Server();

    sinon.fakeServerWithClock.addRequest = function addRequest(xhr) {
      if (xhr.async) {
        if (typeof setTimeout.clock === "object") {
          this.clock = setTimeout.clock;
        } else {
          this.clock = sinon.useFakeTimers();
          this.resetClock = true;
        }

        if (!this.longestTimeout) {
          var clockSetTimeout = this.clock.setTimeout;
          var clockSetInterval = this.clock.setInterval;
          var server = this;

          this.clock.setTimeout = function (fn, timeout) {
            server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

            return clockSetTimeout.apply(this, arguments);
          };

          this.clock.setInterval = function (fn, timeout) {
            server.longestTimeout = Math.max(timeout, server.longestTimeout || 0);

            return clockSetInterval.apply(this, arguments);
          };
        }
      }

      return sinon.fakeServer.addRequest.call(this, xhr);
    };

    sinon.fakeServerWithClock.respond = function respond() {
      var returnVal = sinon.fakeServer.respond.apply(this, arguments);

      if (this.clock) {
        this.clock.tick(this.longestTimeout || 0);
        this.longestTimeout = 0;

        if (this.resetClock) {
          this.clock.restore();
          this.resetClock = false;
        }
      }

      return returnVal;
    };

    sinon.fakeServerWithClock.restore = function restore() {
      if (this.clock) {
        this.clock.restore();
      }

      return sinon.fakeServer.restore.apply(this, arguments);
    };
  }

  var isNode = typeof module !== "undefined" && module.exports && typeof require === "function";
  var isAMD = typeof define === "function" && typeof define.amd === "object" && define.amd;

  function loadDependencies(require) {
    var sinon = require("./core");
    require("./fake_server");
    require("./fake_timers");
    makeApi(sinon);
  }

  if (isAMD) {
    define(loadDependencies);
  } else if (isNode) {
    loadDependencies(require);
  } else {
    makeApi(sinon); // eslint-disable-line no-undef
  }
}());

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
function leoActivator($compile) {
    return {
        restrict: 'A',
        controllerAs: 'leonardo',
        controller: LeoActivator,
        bindToController: true,
        link: function (scope, elem) {
            console.log('enter link');
            var el = angular.element('<div ng-click="leonardo.activate()" class="leonardo-activator" ng-show="leonardo.isLeonardoVisible"></div>');
            var win = angular.element([
                '<div class="leonardo-window">',
                '<div class="leonardo-header">',
                '<div class="menu">',
                '<ul>',
                '<li>LEONARDO</li>',
                '<li ng-class="{ \'leo-selected-tab\': leonardo.activeTab === \'scenarios\' }" ng-click="leonardo.selectTab(\'scenarios\')">Scenarios</li>',
                '<li ng-class="{ \'leo-selected-tab\': leonardo.activeTab === \'recorder\' }" ng-click="leonardo.selectTab(\'recorder\')">Recorder</li>',
                '<li ng-class="{ \'leo-selected-tab\': leonardo.activeTab === \'export\' }" ng-click="leonardo.selectTab(\'export\')">Exported Code</li>',
                '</ul>',
                '</div>',
                '</div>',
                '<leo-window-body></leo-window-body>',
                '</div>',
                '</div>'
            ].join(''));
            $compile(el)(scope);
            $compile(win)(scope);
            elem.append(el);
            elem.append(win);
            win[0].addEventListener('webkitTransitionEnd', function () {
                if (!document.body.classList.contains('pull-top')) {
                    document.body.classList.add("pull-top-closed");
                }
            }, false);
        }
    };
}
exports.leoActivator = leoActivator;
leoActivator.$inject = ['$compile'];
var LeoActivator = (function () {
    function LeoActivator($scope, $document) {
        var _this = this;
        this.isLeonardoVisible = true;
        this.activeTab = 'scenarios';
        $document.on('keypress', function (e) {
            if (e.shiftKey && e.ctrlKey) {
                switch (e.keyCode) {
                    case 12:
                        _this.isLeonardoVisible = !_this.isLeonardoVisible;
                        break;
                    case 11:
                        _this.activate();
                        break;
                    default:
                        break;
                }
                $scope.$apply();
            }
        });
    }
    LeoActivator.prototype.selectTab = function (name) {
        this.activeTab = name;
    };
    LeoActivator.prototype.activate = function () {
        if (!document.body.classList.contains('pull-top')) {
            document.body.classList.add('pull-top');
            document.body.classList.remove('pull-top-closed');
            document.getElementById('filter').focus();
        }
        else {
            document.body.classList.remove('pull-top');
        }
    };
    return LeoActivator;
})();

},{}],2:[function(require,module,exports){
leoConfiguration.$inject = ['leoStorage', '$rootScope'];
function leoConfiguration(leoStorage, $rootScope) {
    var _states = [], _scenarios = {}, _requestsLog = [], _savedStates = [];
    return {
        addState: addState,
        addStates: addStates,
        getActiveStateOption: getActiveStateOption,
        getStates: fetchStates,
        deactivateState: deactivateState,
        deactivateAllStates: deactivateAll,
        activateStateOption: activateStateOption,
        addScenario: addScenario,
        addScenarios: addScenarios,
        getScenario: getScenario,
        getScenarios: getScenarios,
        setActiveScenario: setActiveScenario,
        getRecordedStates: getRecordedStates,
        getRequestsLog: getRequestsLog,
        loadSavedStates: loadSavedStates,
        addSavedState: addSavedState,
        addOrUpdateSavedState: addOrUpdateSavedState,
        fetchStatesByUrlAndMethod: fetchStatesByUrlAndMethod,
        removeState: removeState,
        removeOption: removeOption,
        _logRequest: logRequest
    };
    function upsertOption(state, name, active) {
        var statesStatus = leoStorage.getStates();
        statesStatus[state] = {
            name: name || findStateOption(state).name,
            active: active
        };
        leoStorage.setStates(statesStatus);
    }
    function fetchStatesByUrlAndMethod(url, method) {
        return fetchStates().filter(function (state) {
            return state.url && new RegExp(state.url).test(url) && state.verb.toLowerCase() === method.toLowerCase();
        })[0];
    }
    function fetchStates() {
        var activeStates = leoStorage.getStates();
        var statesCopy = _states.map(function (state) {
            return angular.copy(state);
        });
        statesCopy.forEach(function (state) {
            var option = activeStates[state.name];
            state.active = !!option && option.active;
            state.activeOption = !!option ?
                state.options.filter(function (_option) {
                    return _option.name === option.name;
                })[0] : state.options[0];
        });
        return statesCopy;
    }
    function deactivateAll() {
        var statesStatus = leoStorage.getStates();
        Object.keys(statesStatus).forEach(function (stateKey) {
            statesStatus[stateKey].active = false;
        });
        leoStorage.setStates(statesStatus);
    }
    function findStateOption(name) {
        return fetchStates().filter(function (state) {
            return state.name === name;
        })[0].activeOption;
    }
    function getActiveStateOption(name) {
        var state = fetchStates().filter(function (state) {
            return state.name === name;
        })[0];
        return (state && state.active && findStateOption(name)) || null;
    }
    function addState(stateObj) {
        stateObj.options.forEach(function (option) {
            upsert({
                state: stateObj.name,
                url: stateObj.url,
                verb: stateObj.verb,
                name: option.name,
                status: option.status,
                data: option.data,
                delay: option.delay
            });
        });
        $rootScope.$broadcast('leonardo:stateChanged', stateObj);
    }
    function addStates(statesArr) {
        if (angular.isArray(statesArr)) {
            statesArr.forEach(function (stateObj) {
                addState(stateObj);
            });
        }
        else {
            console.warn('leonardo: addStates should get an array');
        }
    }
    function upsert(stateObj) {
        var verb = stateObj.verb || 'GET', state = stateObj.state, name = stateObj.name, url = stateObj.url, status = stateObj.status || 200, data = angular.isDefined(stateObj.data) ? stateObj.data : {}, delay = stateObj.delay || 0;
        var defaultState = {};
        var defaultOption = {};
        if (!state) {
            console.log("leonardo: cannot upsert - state is mandatory");
            return;
        }
        var stateItem = _states.filter(function (_state) {
            return _state.name === state;
        })[0] || defaultState;
        angular.extend(stateItem, {
            name: state,
            url: url || stateItem.url,
            verb: verb,
            options: stateItem.options || []
        });
        if (stateItem === defaultState) {
            _states.push(stateItem);
        }
        var option = stateItem.options.filter(function (_option) {
            return _option.name === name;
        })[0] || defaultOption;
        angular.extend(option, {
            name: name,
            status: status,
            data: data,
            delay: delay
        });
        if (option === defaultOption) {
            stateItem.options.push(option);
        }
    }
    function addScenario(scenario) {
        if (scenario && typeof scenario.name === 'string') {
            _scenarios[scenario.name] = scenario;
        }
        else {
            throw 'addScenario method expects a scenario object with name property';
        }
    }
    function addScenarios(scenarios) {
        angular.forEach(scenarios, addScenario);
    }
    function getScenarios() {
        return Object.keys(_scenarios);
    }
    function getScenario(name) {
        if (!_scenarios[name]) {
            return;
        }
        return _scenarios[name].states;
    }
    function setActiveScenario(name) {
        var scenario = getScenario(name);
        if (!scenario) {
            console.warn("leonardo: could not find scenario named " + name);
            return;
        }
        deactivateAll();
        scenario.forEach(function (state) {
            upsertOption(state.name, state.option, true);
        });
    }
    function activateStateOption(state, optionName) {
        upsertOption(state, optionName, true);
    }
    function deactivateState(state) {
        upsertOption(state, null, false);
    }
    function logRequest(method, url, data, status) {
        if (method && url && !(url.indexOf(".html") > 0)) {
            var req = {
                verb: method,
                data: data,
                url: url.trim(),
                status: status,
                timestamp: new Date()
            };
            req.state = fetchStatesByUrlAndMethod(req.url, req.verb);
            _requestsLog.push(req);
        }
    }
    function getRequestsLog() {
        return _requestsLog;
    }
    function loadSavedStates() {
        _savedStates = leoStorage.getSavedStates();
        addStates(_savedStates);
    }
    function addSavedState(state) {
        _savedStates.push(state);
        leoStorage.setSavedStates(_savedStates);
        addState(state);
    }
    function addOrUpdateSavedState(state) {
        var option = state.activeOption;
        var _savedState = _savedStates.filter(function (_state) {
            return _state.name === state.name;
        })[0];
        if (_savedState) {
            var _savedOption = _savedState.options.filter(function (_option) {
                return _option.name === option.name;
            })[0];
            if (_savedOption) {
                _savedOption.status = option.status;
                _savedOption.delay = option.delay;
                _savedOption.data = option.data;
            }
            else {
                _savedState.options.push(option);
            }
            leoStorage.setSavedStates(_savedStates);
        }
        var _state = _states.filter(function (__state) {
            return __state.name === state.name;
        })[0];
        if (_state) {
            var _option = _state.options.filter(function (__option) {
                return __option.name === option.name;
            })[0];
            if (_option) {
                _option.status = option.status;
                _option.delay = option.delay;
                _option.data = option.data;
            }
            else {
                _state.options.push(option);
            }
            $rootScope.$broadcast('leonardo:stateChanged');
        }
    }
    function removeStateByName(name) {
        var index = 0;
        _states.forEach(function (state, i) {
            if (state.name === name) {
                index = i;
            }
        });
        _states.splice(index, 1);
    }
    function removeSavedStateByName(name) {
        var index = 0;
        _savedStates.forEach(function (state, i) {
            if (state.name === name) {
                index = i;
            }
        });
        _savedStates.splice(index, 1);
    }
    function removeState(state) {
        removeStateByName(state.name);
        removeSavedStateByName(state.name);
        leoStorage.setSavedStates(_savedStates);
    }
    function removeStateOptionByName(stateName, optionName) {
        var sIndex = null;
        var oIndex = null;
        _states.forEach(function (state, i) {
            if (state.name === stateName) {
                sIndex = i;
            }
        });
        if (sIndex !== null) {
            _states[sIndex].options.forEach(function (option, i) {
                if (option.name === optionName) {
                    oIndex = i;
                }
            });
            if (oIndex !== null) {
                _states[sIndex].options.splice(oIndex, 1);
            }
        }
    }
    function removeSavedStateOptionByName(stateName, optionName) {
        var sIndex = null;
        var oIndex = null;
        _savedStates.forEach(function (state, i) {
            if (state.name === stateName) {
                sIndex = i;
            }
        });
        if (sIndex !== null) {
            _savedStates[sIndex].options.forEach(function (option, i) {
                if (option.name === optionName) {
                    oIndex = i;
                }
            });
            if (oIndex !== null) {
                _savedStates[sIndex].options.splice(oIndex, 1);
            }
        }
    }
    function removeOption(state, option) {
        removeStateOptionByName(state.name, option.name);
        removeSavedStateOptionByName(state.name, option.name);
        leoStorage.setSavedStates(_savedStates);
        activateStateOption(_states[0].name, _states[0].options[0].name);
    }
    function getRecordedStates() {
        var requestsArr = _requestsLog
            .map(function (req) {
            var state = fetchStatesByUrlAndMethod(req.url, req.verb);
            return {
                name: state ? state.name : req.verb + " " + req.url,
                verb: req.verb,
                url: req.url,
                options: [{
                        name: req.status >= 200 && req.status < 300 ? 'Success' : 'Failure',
                        status: req.status,
                        data: req.data
                    }]
            };
        });
        console.log(angular.toJson(requestsArr, true));
        return requestsArr;
    }
}
exports.leoConfiguration = leoConfiguration;

},{}],3:[function(require,module,exports){
function jsonFormatter() {
    return {
        restrict: 'E',
        scope: {
            jsonString: '=',
            onError: '&',
            onSuccess: '&'
        },
        controller: JsonFormatterCtrl,
        bindToController: true,
        controllerAs: 'leoJsonFormatterCtrl',
        template: '<textarea ng-model="leoJsonFormatterCtrl.jsonString" ng-change="leoJsonFormatterCtrl.valueChanged()" />'
    };
}
exports.jsonFormatter = jsonFormatter;
;
var JsonFormatterCtrl = (function () {
    function JsonFormatterCtrl($scope) {
        $scope.$watch('jsonString', function () {
            this.valueChanged();
        }.bind(this));
    }
    JsonFormatterCtrl.prototype.valueChanged = function () {
        try {
            JSON.parse(this.jsonString);
            this.onSuccess({ value: this.jsonString });
        }
        catch (e) {
            this.onError({ msg: e.message });
        }
    };
    ;
    return JsonFormatterCtrl;
})();

},{}],4:[function(require,module,exports){
var LeonardoProvider = (function () {
    function LeonardoProvider() {
        this.prefix = '';
        this.$get = [function leonardoProvider() {
                return {
                    getAppPrefix: function () {
                        return this.prefix;
                    }
                };
            }];
    }
    LeonardoProvider.prototype.setAppPrefix = function (prefix) {
        this.prefix = prefix;
    };
    ;
    return LeonardoProvider;
})();
exports.LeonardoProvider = LeonardoProvider;

},{}],5:[function(require,module,exports){
var activator_drv_1 = require('./activator.drv');
var configuration_srv_1 = require('./configuration.srv');
var leonardo_prov_1 = require('./leonardo.prov');
var request_drv_1 = require('./request.drv');
var select_drv_1 = require('./select.drv');
var state_item_drv_1 = require('./state-item.drv');
var storage_srv_1 = require('./storage.srv');
var leo_json_formatter_drv_1 = require('./leo-json-formatter.drv');
var window_body_drv_1 = require('./window-body.drv');
angular.module('leonardo', ['leonardo.templates'])
    .directive('leoActivator', activator_drv_1.leoActivator)
    .directive('leoRequest', request_drv_1.leoRequest)
    .directive('leoSelect', select_drv_1.leoSelect)
    .directive('leoStateItem', state_item_drv_1.leoStateItem)
    .directive('leoJsonFormatter', leo_json_formatter_drv_1.jsonFormatter)
    .directive('leoWindowBody', window_body_drv_1.windowBodyDirective)
    .service('leoStorage', storage_srv_1.Storage)
    .factory('leoConfiguration', configuration_srv_1.leoConfiguration)
    .provider('$leonardo', leonardo_prov_1.LeonardoProvider)
    .run([
    'leoConfiguration',
    '$document',
    '$rootScope',
    '$compile',
    '$timeout', function (leoConfiguration, $document, $rootScope, $compile, $timeout) {
        var server = sinon.fakeServer.create({
            autoRespond: true,
            autoRespondAfter: 10
        });
        sinon.FakeXMLHttpRequest.useFilters = true;
        sinon.FakeXMLHttpRequest.addFilter(function (method, url) {
            if (url.indexOf('.html') > 0 && url.indexOf('template') >= 0) {
                return true;
            }
            var state = leoConfiguration.fetchStatesByUrlAndMethod(url, method);
            return !(state && state.active);
        });
        sinon.FakeXMLHttpRequest.onResponseEnd = function (xhr) {
            var res = xhr.response;
            try {
                res = JSON.parse(xhr.response);
            }
            catch (e) { }
            leoConfiguration._logRequest(xhr.method, xhr.url, res, xhr.status);
        };
        server.respondWith(function (request) {
            var state = leoConfiguration.fetchStatesByUrlAndMethod(request.url, request.method), activeOption = leoConfiguration.getActiveStateOption(state.name);
            if (!!activeOption) {
                var responseData = angular.isFunction(activeOption.data) ? activeOption.data() : activeOption.data;
                request.respond(activeOption.status, { "Content-Type": "application/json" }, JSON.stringify(responseData));
                leoConfiguration._logRequest(request.method, request.url, responseData, activeOption.status);
            }
            else {
                console.warn('could not find a state for the following request', request);
            }
        });
        leoConfiguration.loadSavedStates();
        var el = $compile('<div leo-activator></div>')($rootScope);
        $timeout(function () {
            $document[0].body.appendChild(el[0]);
        });
    }]);
if (typeof module !== "undefined" && typeof exports !== "undefined" && module.exports === exports) {
    module.exports = 'leonardo';
}
console.log('loaded');

},{"./activator.drv":1,"./configuration.srv":2,"./leo-json-formatter.drv":3,"./leonardo.prov":4,"./request.drv":6,"./select.drv":7,"./state-item.drv":8,"./storage.srv":9,"./window-body.drv":10}],6:[function(require,module,exports){
function leoRequest() {
    return {
        restrict: 'E',
        templateUrl: 'request.html',
        scope: {
            request: '=',
            onSelect: '&'
        },
        controllerAs: 'leoRequest',
        bindToController: true,
        controller: LeoRequest
    };
}
exports.leoRequest = leoRequest;
;
var LeoRequest = (function () {
    function LeoRequest() {
    }
    LeoRequest.prototype.select = function () {
        this.onSelect();
    };
    return LeoRequest;
})();

},{}],7:[function(require,module,exports){
function leoSelect() {
    return {
        restrict: 'E',
        templateUrl: 'select.html',
        scope: {
            state: '=',
            onChange: '&',
            onDelete: '&',
            disabled: '&'
        },
        controller: LeoSelectController,
        bindToController: true,
        controllerAs: 'leoSelect',
        link: function (scope, elm, attr, ctrl) {
            ctrl.setScope(scope);
        }
    };
}
exports.leoSelect = leoSelect;
var LeoSelectController = (function () {
    function LeoSelectController($document) {
        this.$document = $document;
        this.$inject = ['$document'];
        this.entityId = ++LeoSelectController.count;
        this.open = false;
        this.scope = null;
    }
    LeoSelectController.prototype.setScope = function (scope) {
        this.scope = scope;
    };
    ;
    LeoSelectController.prototype.selectOption = function ($event, option) {
        $event.preventDefault();
        $event.stopPropagation();
        this.state.activeOption = option;
        this.open = false;
        this.onChange({ state: this.state });
    };
    ;
    LeoSelectController.prototype.removeOption = function (option) {
        this.onDelete({ state: this.state, option: option });
    };
    ;
    LeoSelectController.prototype.toggle = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        if (!this.disabled())
            this.open = !this.open;
        if (this.open)
            this.attachEvent();
    };
    ;
    LeoSelectController.prototype.clickEvent = function (event) {
        var _this = this;
        var className = event.target.getAttribute('class');
        if (!className || className.indexOf('leo-dropdown-entity-' + this.entityId) == -1) {
            this.scope.$apply(function () {
                _this.open = false;
            });
            this.removeEvent();
        }
    };
    LeoSelectController.prototype.attachEvent = function () {
        this.$document.bind('click', this.clickEvent);
    };
    ;
    LeoSelectController.prototype.removeEvent = function () {
        this.$document.unbind('click', this.clickEvent);
    };
    ;
    LeoSelectController.count = 0;
    return LeoSelectController;
})();

},{}],8:[function(require,module,exports){
function leoStateItem() {
    return {
        restrict: 'E',
        templateUrl: 'state-item.html',
        scope: {
            state: '=',
            ajaxState: '=',
            onOptionChanged: '&',
            onRemoveState: '&',
            onRemoveOption: '&',
            onToggleClick: '&'
        },
        controllerAs: 'leoStateItem',
        bindToController: true,
        controller: LeoStateItem
    };
}
exports.leoStateItem = leoStateItem;
var LeoStateItem = (function () {
    function LeoStateItem() {
    }
    LeoStateItem.prototype.toggleClick = function ($event) {
        $event.preventDefault();
        $event.stopPropagation();
        this.onToggleClick({
            state: this.state
        });
    };
    ;
    LeoStateItem.prototype.removeState = function () {
        this.onRemoveState({
            state: this.state
        });
    };
    ;
    LeoStateItem.prototype.removeOption = function (state, option) {
        this.onRemoveOption({
            state: state,
            option: option
        });
    };
    ;
    LeoStateItem.prototype.updateState = function (state) {
        this.onOptionChanged({
            state: state
        });
    };
    return LeoStateItem;
})();

},{}],9:[function(require,module,exports){
var Storage = (function () {
    function Storage($rootScope, $window, $leonardo) {
        this.$rootScope = $rootScope;
        this.$window = $window;
        this.$leonardo = $leonardo;
        this.$inject = ['$rootScope', '$window', '$leonardo'];
        this.APP_PREFIX = $leonardo.getAppPrefix() + "_";
        this.STATES_STORE_KEY = this.APP_PREFIX + "leonardo-states";
        this.SAVED_STATES_KEY = this.APP_PREFIX + "leonardo-unregistered-states";
    }
    Storage.prototype._getItem = function (key) {
        var item = this.$window.localStorage.getItem(key);
        if (!item) {
            return null;
        }
        return angular.fromJson(item);
    };
    Storage.prototype._setItem = function (key, data) {
        this.$window.localStorage.setItem(key, angular.toJson(data));
    };
    Storage.prototype.getStates = function () {
        return this._getItem(this.STATES_STORE_KEY) || {};
    };
    Storage.prototype.setStates = function (states) {
        this._setItem(this.STATES_STORE_KEY, states);
        this.$rootScope.$emit('leonardo:setStates');
    };
    Storage.prototype.getSavedStates = function () {
        return this._getItem(this.SAVED_STATES_KEY) || [];
    };
    Storage.prototype.setSavedStates = function (states) {
        this._setItem(this.SAVED_STATES_KEY, states);
    };
    return Storage;
})();
exports.Storage = Storage;
;

},{}],10:[function(require,module,exports){
windowBodyDirective.$inject = ['$http', 'leoConfiguration', '$timeout'];
function windowBodyDirective($http, leoConfiguration, $timeout) {
    return {
        restrict: 'E',
        templateUrl: 'window-body.html',
        scope: true,
        controller: LeoWindowBody,
        bindToController: true,
        controllerAs: 'leoWindowBody',
        require: ['^leoActivator', 'leoWindowBody'],
        link: function (scope, el, attr, controllers) {
            var leoActivator = controllers[0];
            var leoWindowBody = controllers[1];
            leoWindowBody.hasActiveOption = function () {
                return this.requests.filter(function (request) {
                    return !!request.active;
                }).length;
            };
            leoWindowBody.saveUnregisteredState = function () {
                var stateName = this.detail.state;
                leoConfiguration.addSavedState({
                    name: stateName,
                    verb: leoWindowBody.detail._unregisteredState.verb,
                    url: leoWindowBody.detail._unregisteredState.url,
                    options: [
                        {
                            name: leoWindowBody.detail.option,
                            status: leoWindowBody.detail.status,
                            data: leoWindowBody.detail.value,
                            delay: leoWindowBody.detail.delay
                        }
                    ]
                });
                leoActivator.selectTab('scenarios');
            };
            leoWindowBody.test = {
                url: '',
                value: undefined
            };
            leoWindowBody.submit = function (url) {
                leoWindowBody.test.value = undefined;
                leoWindowBody.url = url;
                if (url) {
                    $http.get(url).success(function (res) {
                        leoWindowBody.test.value = res;
                    });
                }
            };
        }
    };
}
exports.windowBodyDirective = windowBodyDirective;
var LeoWindowBody = (function () {
    function LeoWindowBody($scope, leoConfiguration, $timeout) {
        var _this = this;
        this.$scope = $scope;
        this.leoConfiguration = leoConfiguration;
        this.$timeout = $timeout;
        this.$inject = ['$scope', 'leoConfiguration', '$timeout'];
        this.detail = {
            option: 'success',
            delay: 0,
            status: 200
        };
        this.states = this.leoConfiguration.getStates();
        this.scenarios = this.leoConfiguration.getScenarios();
        this.requests = this.leoConfiguration.getRequestsLog();
        $scope.$watch('leoWindowBody.detail.value', function (value) {
            if (!value) {
                return;
            }
            try {
                _this.detail.stringValue = value ? JSON.stringify(value, null, 4) : '';
                _this.detail.error = '';
            }
            catch (e) {
                _this.detail.error = e.message;
            }
        });
        $scope.$watch('leoWindowBody.detail.stringValue', function (value) {
            try {
                _this.detail.value = value ? JSON.parse(value) : {};
                _this.detail.error = '';
            }
            catch (e) {
                _this.detail.error = e.message;
            }
        });
        $scope.$on('leonardo:stateChanged', function (event, stateObj) {
            _this.states = leoConfiguration.getStates();
            var state = _this.states.filter(function (state) {
                return state.name === stateObj.name;
            })[0];
            if (state) {
                state.highlight = true;
                $timeout(function () {
                    state.highlight = false;
                }, 3000);
            }
        });
    }
    LeoWindowBody.prototype.removeStateByName = function (name) {
        this.states = this.states.filter(function (state) {
            return state.name !== name;
        });
    };
    ;
    LeoWindowBody.prototype.removeOptionByName = function (stateName, optionName) {
        this.states.forEach(function (state, i) {
            if (state.name === stateName) {
                state.options = state.options.filter(function (option) {
                    return option.name !== optionName;
                });
            }
        });
    };
    ;
    LeoWindowBody.prototype.removeState = function (state) {
        this.leoConfiguration.removeState(state);
        this.removeStateByName(state.name);
    };
    ;
    LeoWindowBody.prototype.removeOption = function (state, option) {
        if (state.options.length === 1) {
            this.removeState(state);
        }
        else {
            this.leoConfiguration.removeOption(state, option);
            this.removeOptionByName(state.name, option.name);
            state.activeOption = state.options[0];
        }
    };
    ;
    LeoWindowBody.prototype.editState = function (state) {
        this.editedState = angular.copy(state);
        this.editedState.dataStringValue = JSON.stringify(this.editedState.activeOption.data);
    };
    ;
    LeoWindowBody.prototype.onEditOptionSuccess = function (str) {
        this.editedState.activeOption.data = JSON.parse(str);
        this.editedState.error = '';
    };
    ;
    LeoWindowBody.prototype.onEditOptionJsonError = function (msg) {
        this.editedState.error = msg;
    };
    ;
    LeoWindowBody.prototype.saveEditedState = function () {
        this.leoConfiguration.addOrUpdateSavedState(this.editedState);
        this.closeEditedState();
    };
    ;
    LeoWindowBody.prototype.closeEditedState = function () {
        this.editedState = null;
    };
    ;
    LeoWindowBody.prototype.notHasUrl = function (option) {
        return !option.url;
    };
    ;
    LeoWindowBody.prototype.hasUrl = function (option) {
        return !!option.url;
    };
    ;
    LeoWindowBody.prototype.deactivate = function () {
        this.states.forEach(function (state) {
            state.active = false;
        });
        this.leoConfiguration.deactivateAllStates();
    };
    ;
    LeoWindowBody.prototype.toggleState = function (state) {
        state.active = !state.active;
        this.updateState(state);
    };
    LeoWindowBody.prototype.updateState = function (state) {
        if (state.active) {
            this.leoConfiguration.activateStateOption(state.name, state.activeOption.name);
        }
        else {
            this.leoConfiguration.deactivateState(state.name);
        }
        if (this.selectedState === state) {
            this.editState(state);
        }
    };
    ;
    LeoWindowBody.prototype.activateScenario = function (scenario) {
        this.activeScenario = scenario;
        this.leoConfiguration.setActiveScenario(scenario);
        this.states = this.leoConfiguration.getStates();
    };
    LeoWindowBody.prototype.stateItemSelected = function (state) {
        if (state === this.selectedState) {
            this.editedState = this.selectedState = null;
        }
        else {
            this.selectedState = state;
            this.editState(state);
        }
    };
    LeoWindowBody.prototype.requestSelect = function (request) {
        var optionName;
        this.requests.forEach(function (request) {
            request.active = false;
        });
        request.active = true;
        if (request.state && request.state.name) {
            optionName = request.state.name + ' option ' + request.state.options.length;
        }
        angular.extend(this.detail, {
            state: (request.state && request.state.name) || '',
            option: optionName || '',
            delay: 0,
            status: request.status || 200,
            stateActive: !!request.state,
            value: request.data || {}
        });
        this.detail._unregisteredState = request;
    };
    LeoWindowBody.prototype.getStatesForExport = function () {
        this.exportStates = this.leoConfiguration.getStates();
    };
    return LeoWindowBody;
})();

},{}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvbGVvbmFyZG8vYWN0aXZhdG9yLmRydi50cyIsInNyYy9sZW9uYXJkby9jb25maWd1cmF0aW9uLnNydi50cyIsInNyYy9sZW9uYXJkby9sZW8tanNvbi1mb3JtYXR0ZXIuZHJ2LnRzIiwic3JjL2xlb25hcmRvL2xlb25hcmRvLnByb3YudHMiLCJzcmMvbGVvbmFyZG8vbGVvbmFyZG8udHMiLCJzcmMvbGVvbmFyZG8vcmVxdWVzdC5kcnYudHMiLCJzcmMvbGVvbmFyZG8vc2VsZWN0LmRydi50cyIsInNyYy9sZW9uYXJkby9zdGF0ZS1pdGVtLmRydi50cyIsInNyYy9sZW9uYXJkby9zdG9yYWdlLnNydi50cyIsInNyYy9sZW9uYXJkby93aW5kb3ctYm9keS5kcnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNNQSxzQkFBNkIsUUFBeUI7SUFFcEQsTUFBTSxDQUFDO1FBQ0wsUUFBUSxFQUFFLEdBQUc7UUFDYixZQUFZLEVBQUUsVUFBVTtRQUN4QixVQUFVLEVBQUUsWUFBWTtRQUN4QixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLElBQUksRUFBRSxVQUFTLEtBQWEsRUFBRSxJQUFzQjtZQUNsRCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzFCLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsNEdBQTRHLENBQUMsQ0FBQztZQUN2SSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUMxQiwrQkFBK0I7Z0JBQzdCLCtCQUErQjtnQkFDN0Isb0JBQW9CO2dCQUNsQixNQUFNO2dCQUNKLG1CQUFtQjtnQkFDbkIsMklBQTJJO2dCQUMzSSx3SUFBd0k7Z0JBQ3hJLHlJQUF5STtnQkFDM0ksT0FBTztnQkFDVCxRQUFRO2dCQUNWLFFBQVE7Z0JBQ1IscUNBQXFDO2dCQUNyQyxRQUFRO2dCQUNWLFFBQVE7YUFDUCxDQUFD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RXRCLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1lBQ3hDLFVBQVUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyxVQUFVLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzlFLENBQUM7UUFFRCxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDMUIsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDbEQsTUFBTSxFQUFFLFVBQVUsSUFBSSxFQUFFO1lBQ3hCLEtBQUssRUFBRSxDQUFDO1lBQ1IsTUFBTSxFQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksR0FBRztZQUM3QixXQUFXLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLO1lBQzVCLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUU7U0FDMUIsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUM7SUFDM0MsQ0FBQztJQUVELDBDQUFrQixHQUFsQjtRQUNFLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3hELENBQUM7SUFDSCxvQkFBQztBQUFELENBM01BLEFBMk1DLElBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IElDb21waWxlU2VydmljZSA9IGFuZ3VsYXIuSUNvbXBpbGVTZXJ2aWNlO1xuaW1wb3J0IElEaXJlY3RpdmUgPSBhbmd1bGFyLklEaXJlY3RpdmU7XG5pbXBvcnQgSUF1Z21lbnRlZEpRdWVyeSA9IGFuZ3VsYXIuSUF1Z21lbnRlZEpRdWVyeTtcbmltcG9ydCBJU2NvcGUgPSBhbmd1bGFyLklTY29wZTtcbmltcG9ydCBJRG9jdW1lbnRTZXJ2aWNlID0gYW5ndWxhci5JRG9jdW1lbnRTZXJ2aWNlO1xuXG5leHBvcnQgZnVuY3Rpb24gbGVvQWN0aXZhdG9yKCRjb21waWxlOiBJQ29tcGlsZVNlcnZpY2UpOklEaXJlY3RpdmUge1xuXG4gIHJldHVybiB7XG4gICAgcmVzdHJpY3Q6ICdBJyxcbiAgICBjb250cm9sbGVyQXM6ICdsZW9uYXJkbycsXG4gICAgY29udHJvbGxlcjogTGVvQWN0aXZhdG9yLFxuICAgIGJpbmRUb0NvbnRyb2xsZXI6IHRydWUsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGU6IElTY29wZSwgZWxlbTogSUF1Z21lbnRlZEpRdWVyeSkge1xuICAgICAgY29uc29sZS5sb2coJ2VudGVyIGxpbmsnKTtcbiAgICAgIHZhciBlbCA9IGFuZ3VsYXIuZWxlbWVudCgnPGRpdiBuZy1jbGljaz1cImxlb25hcmRvLmFjdGl2YXRlKClcIiBjbGFzcz1cImxlb25hcmRvLWFjdGl2YXRvclwiIG5nLXNob3c9XCJsZW9uYXJkby5pc0xlb25hcmRvVmlzaWJsZVwiPjwvZGl2PicpO1xuICAgICAgdmFyIHdpbiA9IGFuZ3VsYXIuZWxlbWVudChbXG4gICAgICAnPGRpdiBjbGFzcz1cImxlb25hcmRvLXdpbmRvd1wiPicsXG4gICAgICAgICc8ZGl2IGNsYXNzPVwibGVvbmFyZG8taGVhZGVyXCI+JyxcbiAgICAgICAgICAnPGRpdiBjbGFzcz1cIm1lbnVcIj4nLFxuICAgICAgICAgICAgJzx1bD4nLFxuICAgICAgICAgICAgICAnPGxpPkxFT05BUkRPPC9saT4nLFxuICAgICAgICAgICAgICAnPGxpIG5nLWNsYXNzPVwieyBcXCdsZW8tc2VsZWN0ZWQtdGFiXFwnOiBsZW9uYXJkby5hY3RpdmVUYWIgPT09IFxcJ3NjZW5hcmlvc1xcJyB9XCIgbmctY2xpY2s9XCJsZW9uYXJkby5zZWxlY3RUYWIoXFwnc2NlbmFyaW9zXFwnKVwiPlNjZW5hcmlvczwvbGk+JyxcbiAgICAgICAgICAgICAgJzxsaSBuZy1jbGFzcz1cInsgXFwnbGVvLXNlbGVjdGVkLXRhYlxcJzogbGVvbmFyZG8uYWN0aXZlVGFiID09PSBcXCdyZWNvcmRlclxcJyB9XCIgbmctY2xpY2s9XCJsZW9uYXJkby5zZWxlY3RUYWIoXFwncmVjb3JkZXJcXCcpXCI+UmVjb3JkZXI8L2xpPicsXG4gICAgICAgICAgICAgICc8bGkgbmctY2xhc3M9XCJ7IFxcJ2xlby1zZWxlY3RlZC10YWJcXCc6IGxlb25hcmRvLmFjdGl2ZVRhYiA9PT0gXFwnZXhwb3J0XFwnIH1cIiBuZy1jbGljaz1cImxlb25hcmRvLnNlbGVjdFRhYihcXCdleHBvcnRcXCcpXCI+RXhwb3J0ZWQgQ29kZTwvbGk+JyxcbiAgICAgICAgICAgICc8L3VsPicsXG4gICAgICAgICAgJzwvZGl2PicsXG4gICAgICAgICc8L2Rpdj4nLFxuICAgICAgICAnPGxlby13aW5kb3ctYm9keT48L2xlby13aW5kb3ctYm9keT4nLFxuICAgICAgICAnPC9kaXY+JyxcbiAgICAgICc8L2Rpdj4nXG4gICAgICBdLmpvaW4oJycpKTtcblxuICAgICAgJGNvbXBpbGUoZWwpKHNjb3BlKTtcbiAgICAgICRjb21waWxlKHdpbikoc2NvcGUpO1xuXG4gICAgICBlbGVtLmFwcGVuZChlbCk7XG4gICAgICBlbGVtLmFwcGVuZCh3aW4pO1xuXG4gICAgICB3aW5bMF0uYWRkRXZlbnRMaXN0ZW5lciggJ3dlYmtpdFRyYW5zaXRpb25FbmQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCFkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucygncHVsbC10b3AnKSl7XG4gICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFwicHVsbC10b3AtY2xvc2VkXCIpO1xuICAgICAgICB9XG4gICAgICB9LCBmYWxzZSApO1xuICAgIH1cbiAgfTtcbn1cbmxlb0FjdGl2YXRvci4kaW5qZWN0ID0gWyckY29tcGlsZSddO1xuXG5jbGFzcyBMZW9BY3RpdmF0b3Ige1xuICBpc0xlb25hcmRvVmlzaWJsZSA9IHRydWU7XG4gIGFjdGl2ZVRhYiA9ICdzY2VuYXJpb3MnO1xuXG4gIGNvbnN0cnVjdG9yICgkc2NvcGUsICRkb2N1bWVudCkge1xuICAgICRkb2N1bWVudC5vbigna2V5cHJlc3MnLCAoZSkgPT4ge1xuXG4gICAgICBpZiAoZS5zaGlmdEtleSAmJiBlLmN0cmxLZXkpIHtcbiAgICAgICAgc3dpdGNoIChlLmtleUNvZGUpIHtcbiAgICAgICAgICBjYXNlIDEyOlxuICAgICAgICAgICAgdGhpcy5pc0xlb25hcmRvVmlzaWJsZSA9ICF0aGlzLmlzTGVvbmFyZG9WaXNpYmxlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxMTpcbiAgICAgICAgICAgIHRoaXMuYWN0aXZhdGUoKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICAkc2NvcGUuJGFwcGx5KCk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzZWxlY3RUYWIobmFtZSkge1xuICAgIHRoaXMuYWN0aXZlVGFiID0gbmFtZTtcbiAgfVxuXG4gIGFjdGl2YXRlKCkge1xuICAgIGlmICghZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuY29udGFpbnMoJ3B1bGwtdG9wJykpIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgncHVsbC10b3AnKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgncHVsbC10b3AtY2xvc2VkJyk7XG4gICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnZmlsdGVyJykuZm9jdXMoKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ3B1bGwtdG9wJyk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQgSVJvb3RTY29wZVNlcnZpY2UgPSBhbmd1bGFyLklSb290U2NvcGVTZXJ2aWNlO1xuXG5sZW9Db25maWd1cmF0aW9uLiRpbmplY3QgPSBbJ2xlb1N0b3JhZ2UnLCAnJHJvb3RTY29wZSddO1xuXG5leHBvcnQgZnVuY3Rpb24gbGVvQ29uZmlndXJhdGlvbiAobGVvU3RvcmFnZSwgJHJvb3RTY29wZTogSVJvb3RTY29wZVNlcnZpY2UpIHtcbiAgdmFyIF9zdGF0ZXMgPSBbXSxcbiAgICBfc2NlbmFyaW9zID0ge30sXG4gICAgX3JlcXVlc3RzTG9nID0gW10sXG4gICAgX3NhdmVkU3RhdGVzID0gW107XG5cbiAgLy8gQ29yZSBBUElcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLVxuICByZXR1cm4ge1xuICAgIGFkZFN0YXRlOiBhZGRTdGF0ZSxcbiAgICBhZGRTdGF0ZXM6IGFkZFN0YXRlcyxcbiAgICBnZXRBY3RpdmVTdGF0ZU9wdGlvbjogZ2V0QWN0aXZlU3RhdGVPcHRpb24sXG4gICAgZ2V0U3RhdGVzOiBmZXRjaFN0YXRlcyxcbiAgICBkZWFjdGl2YXRlU3RhdGU6IGRlYWN0aXZhdGVTdGF0ZSxcbiAgICBkZWFjdGl2YXRlQWxsU3RhdGVzOiBkZWFjdGl2YXRlQWxsLFxuICAgIGFjdGl2YXRlU3RhdGVPcHRpb246IGFjdGl2YXRlU3RhdGVPcHRpb24sXG4gICAgYWRkU2NlbmFyaW86IGFkZFNjZW5hcmlvLFxuICAgIGFkZFNjZW5hcmlvczogYWRkU2NlbmFyaW9zLFxuICAgIGdldFNjZW5hcmlvOiBnZXRTY2VuYXJpbyxcbiAgICBnZXRTY2VuYXJpb3M6IGdldFNjZW5hcmlvcyxcbiAgICBzZXRBY3RpdmVTY2VuYXJpbzogc2V0QWN0aXZlU2NlbmFyaW8sXG4gICAgZ2V0UmVjb3JkZWRTdGF0ZXM6IGdldFJlY29yZGVkU3RhdGVzLFxuICAgIGdldFJlcXVlc3RzTG9nOiBnZXRSZXF1ZXN0c0xvZyxcbiAgICBsb2FkU2F2ZWRTdGF0ZXM6IGxvYWRTYXZlZFN0YXRlcyxcbiAgICBhZGRTYXZlZFN0YXRlOiBhZGRTYXZlZFN0YXRlLFxuICAgIGFkZE9yVXBkYXRlU2F2ZWRTdGF0ZTogYWRkT3JVcGRhdGVTYXZlZFN0YXRlLFxuICAgIGZldGNoU3RhdGVzQnlVcmxBbmRNZXRob2Q6IGZldGNoU3RhdGVzQnlVcmxBbmRNZXRob2QsXG4gICAgcmVtb3ZlU3RhdGU6IHJlbW92ZVN0YXRlLFxuICAgIHJlbW92ZU9wdGlvbjogcmVtb3ZlT3B0aW9uLFxuICAgIF9sb2dSZXF1ZXN0OiBsb2dSZXF1ZXN0XG4gIH07XG5cbiAgZnVuY3Rpb24gdXBzZXJ0T3B0aW9uKHN0YXRlLCBuYW1lLCBhY3RpdmUpIHtcbiAgICB2YXIgc3RhdGVzU3RhdHVzID0gbGVvU3RvcmFnZS5nZXRTdGF0ZXMoKTtcbiAgICBzdGF0ZXNTdGF0dXNbc3RhdGVdID0ge1xuICAgICAgbmFtZTogbmFtZSB8fCBmaW5kU3RhdGVPcHRpb24oc3RhdGUpLm5hbWUsXG4gICAgICBhY3RpdmU6IGFjdGl2ZVxuICAgIH07XG5cbiAgICBsZW9TdG9yYWdlLnNldFN0YXRlcyhzdGF0ZXNTdGF0dXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hTdGF0ZXNCeVVybEFuZE1ldGhvZCh1cmwsIG1ldGhvZCkge1xuICAgIHJldHVybiBmZXRjaFN0YXRlcygpLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS51cmwgJiYgbmV3IFJlZ0V4cChzdGF0ZS51cmwpLnRlc3QodXJsKSAmJiBzdGF0ZS52ZXJiLnRvTG93ZXJDYXNlKCkgPT09IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICAgIH0pWzBdO1xuICB9XG5cbiAgZnVuY3Rpb24gZmV0Y2hTdGF0ZXMoKSB7XG4gICAgdmFyIGFjdGl2ZVN0YXRlcyA9IGxlb1N0b3JhZ2UuZ2V0U3RhdGVzKCk7XG4gICAgdmFyIHN0YXRlc0NvcHkgPSBfc3RhdGVzLm1hcChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBhbmd1bGFyLmNvcHkoc3RhdGUpO1xuICAgIH0pO1xuXG4gICAgc3RhdGVzQ29weS5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgdmFyIG9wdGlvbiA9IGFjdGl2ZVN0YXRlc1tzdGF0ZS5uYW1lXTtcbiAgICAgIHN0YXRlLmFjdGl2ZSA9ICEhb3B0aW9uICYmIG9wdGlvbi5hY3RpdmU7XG4gICAgICBzdGF0ZS5hY3RpdmVPcHRpb24gPSAhIW9wdGlvbiA/XG4gICAgICAgIHN0YXRlLm9wdGlvbnMuZmlsdGVyKGZ1bmN0aW9uIChfb3B0aW9uKSB7XG4gICAgICAgICAgcmV0dXJuIF9vcHRpb24ubmFtZSA9PT0gb3B0aW9uLm5hbWU7XG4gICAgICAgIH0pWzBdIDogc3RhdGUub3B0aW9uc1swXTtcbiAgICB9KTtcblxuICAgIHJldHVybiBzdGF0ZXNDb3B5O1xuICB9XG5cbiAgZnVuY3Rpb24gZGVhY3RpdmF0ZUFsbCgpIHtcbiAgICB2YXIgc3RhdGVzU3RhdHVzID0gbGVvU3RvcmFnZS5nZXRTdGF0ZXMoKTtcbiAgICBPYmplY3Qua2V5cyhzdGF0ZXNTdGF0dXMpLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlS2V5KSB7XG4gICAgICBzdGF0ZXNTdGF0dXNbc3RhdGVLZXldLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuICAgIGxlb1N0b3JhZ2Uuc2V0U3RhdGVzKHN0YXRlc1N0YXR1cyk7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5kU3RhdGVPcHRpb24obmFtZSkge1xuICAgIHJldHVybiBmZXRjaFN0YXRlcygpLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5uYW1lID09PSBuYW1lO1xuICAgIH0pWzBdLmFjdGl2ZU9wdGlvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldEFjdGl2ZVN0YXRlT3B0aW9uKG5hbWUpIHtcbiAgICB2YXIgc3RhdGUgPSBmZXRjaFN0YXRlcygpLmZpbHRlcihmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHJldHVybiBzdGF0ZS5uYW1lID09PSBuYW1lXG4gICAgfSlbMF07XG4gICAgcmV0dXJuIChzdGF0ZSAmJiBzdGF0ZS5hY3RpdmUgJiYgZmluZFN0YXRlT3B0aW9uKG5hbWUpKSB8fCBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gYWRkU3RhdGUoc3RhdGVPYmopIHtcbiAgICBzdGF0ZU9iai5vcHRpb25zLmZvckVhY2goZnVuY3Rpb24gKG9wdGlvbikge1xuICAgICAgdXBzZXJ0KHtcbiAgICAgICAgc3RhdGU6IHN0YXRlT2JqLm5hbWUsXG4gICAgICAgIHVybDogc3RhdGVPYmoudXJsLFxuICAgICAgICB2ZXJiOiBzdGF0ZU9iai52ZXJiLFxuICAgICAgICBuYW1lOiBvcHRpb24ubmFtZSxcbiAgICAgICAgc3RhdHVzOiBvcHRpb24uc3RhdHVzLFxuICAgICAgICBkYXRhOiBvcHRpb24uZGF0YSxcbiAgICAgICAgZGVsYXk6IG9wdGlvbi5kZWxheVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xlb25hcmRvOnN0YXRlQ2hhbmdlZCcsIHN0YXRlT2JqKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFN0YXRlcyhzdGF0ZXNBcnIpIHtcbiAgICBpZiAoYW5ndWxhci5pc0FycmF5KHN0YXRlc0FycikpIHtcbiAgICAgIHN0YXRlc0Fyci5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZU9iaikge1xuICAgICAgICBhZGRTdGF0ZShzdGF0ZU9iaik7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc29sZS53YXJuKCdsZW9uYXJkbzogYWRkU3RhdGVzIHNob3VsZCBnZXQgYW4gYXJyYXknKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiB1cHNlcnQoc3RhdGVPYmopIHtcbiAgICB2YXIgdmVyYiA9IHN0YXRlT2JqLnZlcmIgfHwgJ0dFVCcsXG4gICAgICBzdGF0ZSA9IHN0YXRlT2JqLnN0YXRlLFxuICAgICAgbmFtZSA9IHN0YXRlT2JqLm5hbWUsXG4gICAgICB1cmwgPSBzdGF0ZU9iai51cmwsXG4gICAgICBzdGF0dXMgPSBzdGF0ZU9iai5zdGF0dXMgfHwgMjAwLFxuICAgICAgZGF0YSA9IGFuZ3VsYXIuaXNEZWZpbmVkKHN0YXRlT2JqLmRhdGEpID8gc3RhdGVPYmouZGF0YSA6IHt9LFxuICAgICAgZGVsYXkgPSBzdGF0ZU9iai5kZWxheSB8fCAwO1xuICAgIHZhciBkZWZhdWx0U3RhdGUgPSB7fTtcblxuICAgIHZhciBkZWZhdWx0T3B0aW9uID0ge307XG5cbiAgICBpZiAoIXN0YXRlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcImxlb25hcmRvOiBjYW5ub3QgdXBzZXJ0IC0gc3RhdGUgaXMgbWFuZGF0b3J5XCIpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBzdGF0ZUl0ZW0gPSBfc3RhdGVzLmZpbHRlcihmdW5jdGlvbiAoX3N0YXRlKSB7XG4gICAgICAgIHJldHVybiBfc3RhdGUubmFtZSA9PT0gc3RhdGU7XG4gICAgICB9KVswXSB8fCBkZWZhdWx0U3RhdGU7XG5cbiAgICBhbmd1bGFyLmV4dGVuZChzdGF0ZUl0ZW0sIHtcbiAgICAgIG5hbWU6IHN0YXRlLFxuICAgICAgdXJsOiB1cmwgfHwgc3RhdGVJdGVtLnVybCxcbiAgICAgIHZlcmI6IHZlcmIsXG4gICAgICBvcHRpb25zOiBzdGF0ZUl0ZW0ub3B0aW9ucyB8fCBbXVxuICAgIH0pO1xuXG5cbiAgICBpZiAoc3RhdGVJdGVtID09PSBkZWZhdWx0U3RhdGUpIHtcbiAgICAgIF9zdGF0ZXMucHVzaChzdGF0ZUl0ZW0pO1xuICAgIH1cblxuICAgIHZhciBvcHRpb24gPSBzdGF0ZUl0ZW0ub3B0aW9ucy5maWx0ZXIoZnVuY3Rpb24gKF9vcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIF9vcHRpb24ubmFtZSA9PT0gbmFtZVxuICAgICAgfSlbMF0gfHwgZGVmYXVsdE9wdGlvbjtcblxuICAgIGFuZ3VsYXIuZXh0ZW5kKG9wdGlvbiwge1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgZGF0YTogZGF0YSxcbiAgICAgIGRlbGF5OiBkZWxheVxuICAgIH0pO1xuXG4gICAgaWYgKG9wdGlvbiA9PT0gZGVmYXVsdE9wdGlvbikge1xuICAgICAgc3RhdGVJdGVtLm9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGFkZFNjZW5hcmlvKHNjZW5hcmlvKSB7XG4gICAgaWYgKHNjZW5hcmlvICYmIHR5cGVvZiBzY2VuYXJpby5uYW1lID09PSAnc3RyaW5nJykge1xuICAgICAgX3NjZW5hcmlvc1tzY2VuYXJpby5uYW1lXSA9IHNjZW5hcmlvO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyAnYWRkU2NlbmFyaW8gbWV0aG9kIGV4cGVjdHMgYSBzY2VuYXJpbyBvYmplY3Qgd2l0aCBuYW1lIHByb3BlcnR5JztcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTY2VuYXJpb3Moc2NlbmFyaW9zKSB7XG4gICAgYW5ndWxhci5mb3JFYWNoKHNjZW5hcmlvcywgYWRkU2NlbmFyaW8pO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0U2NlbmFyaW9zKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhfc2NlbmFyaW9zKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFNjZW5hcmlvKG5hbWUpIHtcbiAgICBpZiAoIV9zY2VuYXJpb3NbbmFtZV0pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIF9zY2VuYXJpb3NbbmFtZV0uc3RhdGVzO1xuICB9XG5cbiAgZnVuY3Rpb24gc2V0QWN0aXZlU2NlbmFyaW8obmFtZSkge1xuICAgIHZhciBzY2VuYXJpbyA9IGdldFNjZW5hcmlvKG5hbWUpO1xuICAgIGlmICghc2NlbmFyaW8pIHtcbiAgICAgIGNvbnNvbGUud2FybihcImxlb25hcmRvOiBjb3VsZCBub3QgZmluZCBzY2VuYXJpbyBuYW1lZCBcIiArIG5hbWUpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkZWFjdGl2YXRlQWxsKCk7XG4gICAgc2NlbmFyaW8uZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgIHVwc2VydE9wdGlvbihzdGF0ZS5uYW1lLCBzdGF0ZS5vcHRpb24sIHRydWUpO1xuICAgIH0pO1xuICB9XG5cbiAgZnVuY3Rpb24gYWN0aXZhdGVTdGF0ZU9wdGlvbihzdGF0ZSwgb3B0aW9uTmFtZSkge1xuICAgIHVwc2VydE9wdGlvbihzdGF0ZSwgb3B0aW9uTmFtZSwgdHJ1ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWFjdGl2YXRlU3RhdGUoc3RhdGUpIHtcbiAgICB1cHNlcnRPcHRpb24oc3RhdGUsIG51bGwsIGZhbHNlKTtcbiAgfVxuXG4gIGludGVyZmFjZSBJTmV0d29ya1JlcXVlc3Qge1xuICAgIHZlcmI6IEZ1bmN0aW9uO1xuICAgIGRhdGE6IGFueTtcbiAgICB1cmw/OiBzdHJpbmc7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgdGltZXN0YW1wOiBEYXRlO1xuICAgIHN0YXRlPzogc3RyaW5nO1xuICB9XG5cbiAgZnVuY3Rpb24gbG9nUmVxdWVzdChtZXRob2QsIHVybCwgZGF0YSwgc3RhdHVzKSB7XG4gICAgaWYgKG1ldGhvZCAmJiB1cmwgJiYgISh1cmwuaW5kZXhPZihcIi5odG1sXCIpID4gMCkpIHtcbiAgICAgIHZhciByZXE6IElOZXR3b3JrUmVxdWVzdCA9IHtcbiAgICAgICAgdmVyYjogbWV0aG9kLFxuICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICB1cmw6IHVybC50cmltKCksXG4gICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKClcbiAgICAgIH07XG4gICAgICByZXEuc3RhdGUgPSBmZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kKHJlcS51cmwsIHJlcS52ZXJiKTtcbiAgICAgIF9yZXF1ZXN0c0xvZy5wdXNoKHJlcSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UmVxdWVzdHNMb2coKSB7XG4gICAgcmV0dXJuIF9yZXF1ZXN0c0xvZztcbiAgfVxuXG4gIGZ1bmN0aW9uIGxvYWRTYXZlZFN0YXRlcygpIHtcbiAgICBfc2F2ZWRTdGF0ZXMgPSBsZW9TdG9yYWdlLmdldFNhdmVkU3RhdGVzKCk7XG4gICAgYWRkU3RhdGVzKF9zYXZlZFN0YXRlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRTYXZlZFN0YXRlKHN0YXRlKSB7XG4gICAgX3NhdmVkU3RhdGVzLnB1c2goc3RhdGUpO1xuICAgIGxlb1N0b3JhZ2Uuc2V0U2F2ZWRTdGF0ZXMoX3NhdmVkU3RhdGVzKTtcbiAgICBhZGRTdGF0ZShzdGF0ZSk7XG4gIH1cblxuICBmdW5jdGlvbiBhZGRPclVwZGF0ZVNhdmVkU3RhdGUoc3RhdGUpIHtcbiAgICB2YXIgb3B0aW9uID0gc3RhdGUuYWN0aXZlT3B0aW9uO1xuXG4gICAgLy91cGRhdGUgbG9jYWwgc3RvcmFnZSBzdGF0ZVxuXG4gICAgdmFyIF9zYXZlZFN0YXRlID0gX3NhdmVkU3RhdGVzLmZpbHRlcihmdW5jdGlvbihfc3RhdGUpIHtcbiAgICAgIHJldHVybiBfc3RhdGUubmFtZSA9PT0gc3RhdGUubmFtZTtcbiAgICB9KVswXTtcblxuICAgIGlmIChfc2F2ZWRTdGF0ZSkge1xuICAgICAgdmFyIF9zYXZlZE9wdGlvbiA9IF9zYXZlZFN0YXRlLm9wdGlvbnMuZmlsdGVyKGZ1bmN0aW9uKF9vcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIF9vcHRpb24ubmFtZSA9PT0gb3B0aW9uLm5hbWU7XG4gICAgICB9KVswXTtcblxuICAgICAgaWYgKF9zYXZlZE9wdGlvbikge1xuICAgICAgICBfc2F2ZWRPcHRpb24uc3RhdHVzID0gb3B0aW9uLnN0YXR1cztcbiAgICAgICAgX3NhdmVkT3B0aW9uLmRlbGF5ID0gb3B0aW9uLmRlbGF5O1xuICAgICAgICBfc2F2ZWRPcHRpb24uZGF0YSA9IG9wdGlvbi5kYXRhO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF9zYXZlZFN0YXRlLm9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgICAgfVxuXG4gICAgICBsZW9TdG9yYWdlLnNldFNhdmVkU3RhdGVzKF9zYXZlZFN0YXRlcyk7XG4gICAgfVxuXG5cbiAgICAvL3VwZGF0ZSBpbiBtZW1vcnkgc3RhdGVcblxuICAgIHZhciBfc3RhdGUgPSBfc3RhdGVzLmZpbHRlcihmdW5jdGlvbihfX3N0YXRlKSB7XG4gICAgICByZXR1cm4gX19zdGF0ZS5uYW1lID09PSBzdGF0ZS5uYW1lO1xuICAgIH0pWzBdO1xuXG4gICAgaWYgKF9zdGF0ZSkge1xuICAgICAgdmFyIF9vcHRpb24gPSBfc3RhdGUub3B0aW9ucy5maWx0ZXIoZnVuY3Rpb24oX19vcHRpb24pIHtcbiAgICAgICAgcmV0dXJuIF9fb3B0aW9uLm5hbWUgPT09IG9wdGlvbi5uYW1lO1xuICAgICAgfSlbMF07XG5cbiAgICAgIGlmIChfb3B0aW9uKSB7XG4gICAgICAgIF9vcHRpb24uc3RhdHVzID0gb3B0aW9uLnN0YXR1cztcbiAgICAgICAgX29wdGlvbi5kZWxheSA9IG9wdGlvbi5kZWxheTtcbiAgICAgICAgX29wdGlvbi5kYXRhID0gb3B0aW9uLmRhdGE7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgX3N0YXRlLm9wdGlvbnMucHVzaChvcHRpb24pO1xuICAgICAgfVxuXG4gICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoJ2xlb25hcmRvOnN0YXRlQ2hhbmdlZCcpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVN0YXRlQnlOYW1lKG5hbWUpIHtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIF9zdGF0ZXMuZm9yRWFjaChmdW5jdGlvbiAoc3RhdGUsIGkpIHtcbiAgICAgIGlmIChzdGF0ZS5uYW1lID09PSBuYW1lKSB7XG4gICAgICAgIGluZGV4ID0gaTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIF9zdGF0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVNhdmVkU3RhdGVCeU5hbWUobmFtZSkge1xuICAgIHZhciBpbmRleCA9IDA7XG4gICAgX3NhdmVkU3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlLCBpKSB7XG4gICAgICBpZiAoc3RhdGUubmFtZSA9PT0gbmFtZSkge1xuICAgICAgICBpbmRleCA9IGk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBfc2F2ZWRTdGF0ZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbW92ZVN0YXRlKHN0YXRlKSB7XG5cbiAgICByZW1vdmVTdGF0ZUJ5TmFtZShzdGF0ZS5uYW1lKTtcbiAgICByZW1vdmVTYXZlZFN0YXRlQnlOYW1lKHN0YXRlLm5hbWUpO1xuXG4gICAgbGVvU3RvcmFnZS5zZXRTYXZlZFN0YXRlcyhfc2F2ZWRTdGF0ZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU3RhdGVPcHRpb25CeU5hbWUoc3RhdGVOYW1lLCBvcHRpb25OYW1lKSB7XG4gICAgdmFyIHNJbmRleCA9IG51bGw7XG4gICAgdmFyIG9JbmRleCA9IG51bGw7XG5cbiAgICBfc3RhdGVzLmZvckVhY2goZnVuY3Rpb24gKHN0YXRlLCBpKSB7XG4gICAgICBpZiAoc3RhdGUubmFtZSA9PT0gc3RhdGVOYW1lKSB7XG4gICAgICAgIHNJbmRleCA9IGk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBpZiAoc0luZGV4ICE9PSBudWxsKSB7XG4gICAgICBfc3RhdGVzW3NJbmRleF0ub3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb24sIGkpIHtcbiAgICAgICAgaWYgKG9wdGlvbi5uYW1lID09PSBvcHRpb25OYW1lKSB7XG4gICAgICAgICAgb0luZGV4ID0gaTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChvSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgX3N0YXRlc1tzSW5kZXhdLm9wdGlvbnMuc3BsaWNlKG9JbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVtb3ZlU2F2ZWRTdGF0ZU9wdGlvbkJ5TmFtZShzdGF0ZU5hbWUsIG9wdGlvbk5hbWUpIHtcbiAgICB2YXIgc0luZGV4ID0gbnVsbDtcbiAgICB2YXIgb0luZGV4ID0gbnVsbDtcblxuICAgIF9zYXZlZFN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSwgaSkge1xuICAgICAgaWYgKHN0YXRlLm5hbWUgPT09IHN0YXRlTmFtZSkge1xuICAgICAgICBzSW5kZXggPSBpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgaWYgKHNJbmRleCAhPT0gbnVsbCkge1xuICAgICAgX3NhdmVkU3RhdGVzW3NJbmRleF0ub3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uIChvcHRpb24sIGkpIHtcbiAgICAgICAgaWYgKG9wdGlvbi5uYW1lID09PSBvcHRpb25OYW1lKSB7XG4gICAgICAgICAgb0luZGV4ID0gaTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChvSW5kZXggIT09IG51bGwpIHtcbiAgICAgICAgX3NhdmVkU3RhdGVzW3NJbmRleF0ub3B0aW9ucy5zcGxpY2Uob0luZGV4LCAxKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZW1vdmVPcHRpb24oc3RhdGUsIG9wdGlvbikge1xuICAgIHJlbW92ZVN0YXRlT3B0aW9uQnlOYW1lKHN0YXRlLm5hbWUsIG9wdGlvbi5uYW1lKTtcbiAgICByZW1vdmVTYXZlZFN0YXRlT3B0aW9uQnlOYW1lKHN0YXRlLm5hbWUsIG9wdGlvbi5uYW1lKTtcblxuICAgIGxlb1N0b3JhZ2Uuc2V0U2F2ZWRTdGF0ZXMoX3NhdmVkU3RhdGVzKTtcblxuICAgIGFjdGl2YXRlU3RhdGVPcHRpb24oX3N0YXRlc1swXS5uYW1lLCBfc3RhdGVzWzBdLm9wdGlvbnNbMF0ubmFtZSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRSZWNvcmRlZFN0YXRlcygpIHtcbiAgICB2YXIgcmVxdWVzdHNBcnIgPSBfcmVxdWVzdHNMb2dcbiAgICAgIC5tYXAoZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICB2YXIgc3RhdGUgPSBmZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kKHJlcS51cmwsIHJlcS52ZXJiKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBuYW1lOiBzdGF0ZSA/IHN0YXRlLm5hbWUgOiByZXEudmVyYiArIFwiIFwiICsgcmVxLnVybCxcbiAgICAgICAgICB2ZXJiOiByZXEudmVyYixcbiAgICAgICAgICB1cmw6IHJlcS51cmwsXG4gICAgICAgICAgb3B0aW9uczogW3tcbiAgICAgICAgICAgIG5hbWU6IHJlcS5zdGF0dXMgPj0gMjAwICYmIHJlcS5zdGF0dXMgPCAzMDAgPyAnU3VjY2VzcycgOiAnRmFpbHVyZScsXG4gICAgICAgICAgICBzdGF0dXM6IHJlcS5zdGF0dXMsXG4gICAgICAgICAgICBkYXRhOiByZXEuZGF0YVxuICAgICAgICAgIH1dXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIGNvbnNvbGUubG9nKGFuZ3VsYXIudG9Kc29uKHJlcXVlc3RzQXJyLCB0cnVlKSk7XG4gICAgcmV0dXJuIHJlcXVlc3RzQXJyO1xuICB9XG59XG4iLCJleHBvcnQgZnVuY3Rpb24ganNvbkZvcm1hdHRlcigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHNjb3BlOiB7XG4gICAgICBqc29uU3RyaW5nOiAnPScsXG4gICAgICBvbkVycm9yOiAnJicsXG4gICAgICBvblN1Y2Nlc3M6ICcmJ1xuICAgIH0sXG4gICAgY29udHJvbGxlcjogSnNvbkZvcm1hdHRlckN0cmwsXG4gICAgYmluZFRvQ29udHJvbGxlcjogdHJ1ZSxcbiAgICBjb250cm9sbGVyQXM6ICdsZW9Kc29uRm9ybWF0dGVyQ3RybCcsXG4gICAgdGVtcGxhdGU6ICc8dGV4dGFyZWEgbmctbW9kZWw9XCJsZW9Kc29uRm9ybWF0dGVyQ3RybC5qc29uU3RyaW5nXCIgbmctY2hhbmdlPVwibGVvSnNvbkZvcm1hdHRlckN0cmwudmFsdWVDaGFuZ2VkKClcIiAvPidcbiAgfVxufTtcblxuXG5jbGFzcyBKc29uRm9ybWF0dGVyQ3RybCB7XG4gIHByaXZhdGUganNvblN0cmluZztcbiAgcHJpdmF0ZSBvblN1Y2Nlc3M6IEZ1bmN0aW9uO1xuICBwcml2YXRlIG9uRXJyb3I6IEZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKCRzY29wZSkge1xuICAgICRzY29wZS4kd2F0Y2goJ2pzb25TdHJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLnZhbHVlQ2hhbmdlZCgpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cblxuICB2YWx1ZUNoYW5nZWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIEpTT04ucGFyc2UodGhpcy5qc29uU3RyaW5nKTtcbiAgICAgIHRoaXMub25TdWNjZXNzKHt2YWx1ZTogdGhpcy5qc29uU3RyaW5nfSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICB0aGlzLm9uRXJyb3Ioe21zZzogZS5tZXNzYWdlfSk7XG4gICAgfVxuICB9O1xuXG59IiwiaW1wb3J0IElTZXJ2aWNlUHJvdmlkZXIgPSBhbmd1bGFyLklTZXJ2aWNlUHJvdmlkZXI7XG5cbmV4cG9ydCBjbGFzcyBMZW9uYXJkb1Byb3ZpZGVyIGltcGxlbWVudHMgSVNlcnZpY2VQcm92aWRlciB7XG4gICAgcHJlZml4OnN0cmluZyA9ICcnO1xuXG4gICAgc2V0QXBwUHJlZml4IChwcmVmaXg6c3RyaW5nKSB7XG4gICAgICAgIHRoaXMucHJlZml4ID0gcHJlZml4O1xuICAgIH07XG5cbiAgICAkZ2V0OmFueVtdID0gW2Z1bmN0aW9uIGxlb25hcmRvUHJvdmlkZXIoKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBnZXRBcHBQcmVmaXg6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcmVmaXg7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfV07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vdHlwaW5ncy9hbmd1bGFyanMvYW5ndWxhci5kLnRzXCIgLz5cbmltcG9ydCB7bGVvQWN0aXZhdG9yfSBmcm9tICcuL2FjdGl2YXRvci5kcnYnO1xuaW1wb3J0IHtsZW9Db25maWd1cmF0aW9ufSBmcm9tICcuL2NvbmZpZ3VyYXRpb24uc3J2JztcbmltcG9ydCB7TGVvbmFyZG9Qcm92aWRlcn0gZnJvbSAnLi9sZW9uYXJkby5wcm92JztcbmltcG9ydCB7bGVvUmVxdWVzdH0gZnJvbSAnLi9yZXF1ZXN0LmRydic7XG5pbXBvcnQge2xlb1NlbGVjdH0gZnJvbSAnLi9zZWxlY3QuZHJ2JztcbmltcG9ydCB7bGVvU3RhdGVJdGVtfSBmcm9tICcuL3N0YXRlLWl0ZW0uZHJ2JztcbmltcG9ydCB7U3RvcmFnZX0gZnJvbSAnLi9zdG9yYWdlLnNydic7XG5pbXBvcnQge2pzb25Gb3JtYXR0ZXJ9IGZyb20gJy4vbGVvLWpzb24tZm9ybWF0dGVyLmRydic7XG5pbXBvcnQge3dpbmRvd0JvZHlEaXJlY3RpdmV9IGZyb20gJy4vd2luZG93LWJvZHkuZHJ2JztcblxuZGVjbGFyZSB2YXIgc2lub247XG5cbmFuZ3VsYXIubW9kdWxlKCdsZW9uYXJkbycsIFsnbGVvbmFyZG8udGVtcGxhdGVzJ10pXG4gIC5kaXJlY3RpdmUoJ2xlb0FjdGl2YXRvcicsIGxlb0FjdGl2YXRvcilcbiAgLmRpcmVjdGl2ZSgnbGVvUmVxdWVzdCcsIGxlb1JlcXVlc3QpXG4gIC5kaXJlY3RpdmUoJ2xlb1NlbGVjdCcsIGxlb1NlbGVjdClcbiAgLmRpcmVjdGl2ZSgnbGVvU3RhdGVJdGVtJywgbGVvU3RhdGVJdGVtKVxuICAuZGlyZWN0aXZlKCdsZW9Kc29uRm9ybWF0dGVyJywganNvbkZvcm1hdHRlcilcbiAgLmRpcmVjdGl2ZSgnbGVvV2luZG93Qm9keScsIHdpbmRvd0JvZHlEaXJlY3RpdmUpXG4gIC5zZXJ2aWNlKCdsZW9TdG9yYWdlJywgU3RvcmFnZSlcbiAgLmZhY3RvcnkoJ2xlb0NvbmZpZ3VyYXRpb24nLCBsZW9Db25maWd1cmF0aW9uKVxuICAucHJvdmlkZXIoJyRsZW9uYXJkbycsIExlb25hcmRvUHJvdmlkZXIpXG4gIC5ydW4oW1xuICAgICdsZW9Db25maWd1cmF0aW9uJyxcbiAgICAnJGRvY3VtZW50JyxcbiAgICAnJHJvb3RTY29wZScsXG4gICAgJyRjb21waWxlJyxcbiAgICAnJHRpbWVvdXQnLCBmdW5jdGlvbihsZW9Db25maWd1cmF0aW9uLCAkZG9jdW1lbnQsICRyb290U2NvcGUsICRjb21waWxlLCAkdGltZW91dCkge1xuICAgIHZhciBzZXJ2ZXIgPSBzaW5vbi5mYWtlU2VydmVyLmNyZWF0ZSh7XG4gICAgICBhdXRvUmVzcG9uZDogdHJ1ZSxcbiAgICAgIGF1dG9SZXNwb25kQWZ0ZXI6IDEwXG4gICAgfSk7XG5cbiAgICBzaW5vbi5GYWtlWE1MSHR0cFJlcXVlc3QudXNlRmlsdGVycyA9IHRydWU7XG4gICAgc2lub24uRmFrZVhNTEh0dHBSZXF1ZXN0LmFkZEZpbHRlcihmdW5jdGlvbihtZXRob2QsIHVybCkge1xuICAgICAgaWYgKHVybC5pbmRleE9mKCcuaHRtbCcpID4gMCAmJiB1cmwuaW5kZXhPZigndGVtcGxhdGUnKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgdmFyIHN0YXRlID0gbGVvQ29uZmlndXJhdGlvbi5mZXRjaFN0YXRlc0J5VXJsQW5kTWV0aG9kKHVybCwgbWV0aG9kKTtcbiAgICAgIHJldHVybiAhKHN0YXRlICYmIHN0YXRlLmFjdGl2ZSk7XG4gICAgfSk7XG5cbiAgICBzaW5vbi5GYWtlWE1MSHR0cFJlcXVlc3Qub25SZXNwb25zZUVuZCA9IGZ1bmN0aW9uKHhocikge1xuICAgICAgdmFyIHJlcyA9IHhoci5yZXNwb25zZTtcbiAgICAgIHRyeSB7IHJlcyA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlKTsgfVxuICAgICAgY2F0Y2ggKGUpIHt9XG4gICAgICBsZW9Db25maWd1cmF0aW9uLl9sb2dSZXF1ZXN0KHhoci5tZXRob2QsIHhoci51cmwsIHJlcywgeGhyLnN0YXR1cyk7XG4gICAgfTtcblxuICAgIHNlcnZlci5yZXNwb25kV2l0aChmdW5jdGlvbihyZXF1ZXN0KSB7XG4gICAgICB2YXIgc3RhdGUgPSBsZW9Db25maWd1cmF0aW9uLmZldGNoU3RhdGVzQnlVcmxBbmRNZXRob2QocmVxdWVzdC51cmwsIHJlcXVlc3QubWV0aG9kKSxcbiAgICAgICAgICBhY3RpdmVPcHRpb24gPSBsZW9Db25maWd1cmF0aW9uLmdldEFjdGl2ZVN0YXRlT3B0aW9uKHN0YXRlLm5hbWUpO1xuXG4gICAgICBpZiAoISFhY3RpdmVPcHRpb24pIHtcbiAgICAgICAgdmFyIHJlc3BvbnNlRGF0YSA9IGFuZ3VsYXIuaXNGdW5jdGlvbihhY3RpdmVPcHRpb24uZGF0YSkgPyBhY3RpdmVPcHRpb24uZGF0YSgpIDogYWN0aXZlT3B0aW9uLmRhdGE7XG4gICAgICAgIHJlcXVlc3QucmVzcG9uZChhY3RpdmVPcHRpb24uc3RhdHVzLCB7IFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiIH0sIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlRGF0YSkpO1xuICAgICAgICBsZW9Db25maWd1cmF0aW9uLl9sb2dSZXF1ZXN0KHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgcmVzcG9uc2VEYXRhLCBhY3RpdmVPcHRpb24uc3RhdHVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybignY291bGQgbm90IGZpbmQgYSBzdGF0ZSBmb3IgdGhlIGZvbGxvd2luZyByZXF1ZXN0JywgcmVxdWVzdCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgbGVvQ29uZmlndXJhdGlvbi5sb2FkU2F2ZWRTdGF0ZXMoKTtcblxuICAgIHZhciBlbCA9ICRjb21waWxlKCc8ZGl2IGxlby1hY3RpdmF0b3I+PC9kaXY+JykoJHJvb3RTY29wZSk7XG4gICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAkZG9jdW1lbnRbMF0uYm9keS5hcHBlbmRDaGlsZChlbFswXSk7XG4gICAgfSk7XG4gIH1dKTtcblxuZGVjbGFyZSB2YXIgbW9kdWxlO1xuZGVjbGFyZSB2YXIgZXhwb3J0cztcbi8vIENvbW1vbi5qcyBwYWNrYWdlIG1hbmFnZXIgc3VwcG9ydCAoZS5nLiBDb21wb25lbnRKUywgV2ViUGFjaylcbmlmICh0eXBlb2YgbW9kdWxlICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZiBleHBvcnRzICE9PSBcInVuZGVmaW5lZFwiICYmIG1vZHVsZS5leHBvcnRzID09PSBleHBvcnRzKSB7XG4gIG1vZHVsZS5leHBvcnRzID0gJ2xlb25hcmRvJztcbn1cblxuY29uc29sZS5sb2coJ2xvYWRlZCcpO1xuIiwiaW1wb3J0IElEaXJlY3RpdmUgPSBhbmd1bGFyLklEaXJlY3RpdmU7XG5cbmV4cG9ydCBmdW5jdGlvbiBsZW9SZXF1ZXN0ICgpOklEaXJlY3RpdmUge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICdyZXF1ZXN0Lmh0bWwnLFxuICAgIHNjb3BlOiB7XG4gICAgICByZXF1ZXN0OiAnPScsXG4gICAgICBvblNlbGVjdDogJyYnXG4gICAgfSxcbiAgICBjb250cm9sbGVyQXM6ICdsZW9SZXF1ZXN0JyxcbiAgICBiaW5kVG9Db250cm9sbGVyOiB0cnVlLFxuICAgIGNvbnRyb2xsZXI6IExlb1JlcXVlc3RcbiAgfTtcbn07XG5cbmNsYXNzIExlb1JlcXVlc3Qge1xuICBvblNlbGVjdDpGdW5jdGlvbjtcblxuICBzZWxlY3QoKSB7XG4gICAgdGhpcy5vblNlbGVjdCgpO1xuICB9XG59XG4iLCJpbXBvcnQgSURpcmVjdGl2ZSA9IGFuZ3VsYXIuSURpcmVjdGl2ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGxlb1NlbGVjdCgpOklEaXJlY3RpdmUge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICdzZWxlY3QuaHRtbCcsXG4gICAgc2NvcGU6IHtcbiAgICAgIHN0YXRlOiAnPScsXG4gICAgICBvbkNoYW5nZTogJyYnLFxuICAgICAgb25EZWxldGU6ICcmJyxcbiAgICAgIGRpc2FibGVkOiAnJidcbiAgICB9LFxuICAgIGNvbnRyb2xsZXI6IExlb1NlbGVjdENvbnRyb2xsZXIsXG4gICAgYmluZFRvQ29udHJvbGxlcjogdHJ1ZSxcbiAgICBjb250cm9sbGVyQXM6ICdsZW9TZWxlY3QnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHIsIGN0cmw6IExlb1NlbGVjdENvbnRyb2xsZXIpIHtcbiAgICAgIGN0cmwuc2V0U2NvcGUoc2NvcGUpO1xuICAgIH1cbiAgfVxufVxuXG5jbGFzcyBMZW9TZWxlY3RDb250cm9sbGVyIHtcbiAgJGluamVjdCA9IFsnJGRvY3VtZW50J107XG4gIHByaXZhdGUgZW50aXR5SWQ7XG4gIHByaXZhdGUgc3RhdGljIGNvdW50ID0gMDtcbiAgcHJpdmF0ZSBvcGVuO1xuICBwcml2YXRlIHNjb3BlO1xuICBwcml2YXRlIHN0YXRlO1xuICBvbkNoYW5nZTogRnVuY3Rpb247XG4gIG9uRGVsZXRlOiBGdW5jdGlvbjtcbiAgZGlzYWJsZWQ6IEZ1bmN0aW9uO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgJGRvY3VtZW50KSB7XG4gICAgdGhpcy5lbnRpdHlJZCA9ICsrTGVvU2VsZWN0Q29udHJvbGxlci5jb3VudDtcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLnNjb3BlID0gbnVsbDtcbiAgfVxuXG4gIHNldFNjb3BlIChzY29wZSkge1xuICAgIHRoaXMuc2NvcGUgPSBzY29wZTtcbiAgfTtcblxuICBzZWxlY3RPcHRpb24gKCRldmVudCwgb3B0aW9uKSB7XG4gICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMuc3RhdGUuYWN0aXZlT3B0aW9uID0gb3B0aW9uO1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMub25DaGFuZ2Uoe3N0YXRlOiB0aGlzLnN0YXRlfSk7XG4gIH07XG5cbiAgcmVtb3ZlT3B0aW9uIChvcHRpb24pIHtcbiAgICB0aGlzLm9uRGVsZXRlKHtzdGF0ZTogdGhpcy5zdGF0ZSwgb3B0aW9uOiBvcHRpb259KTtcbiAgfTtcblxuICB0b2dnbGUgKCRldmVudCkge1xuICAgICRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICBpZiAoIXRoaXMuZGlzYWJsZWQoKSkgdGhpcy5vcGVuID0gIXRoaXMub3BlbjtcbiAgICBpZiAodGhpcy5vcGVuKSB0aGlzLmF0dGFjaEV2ZW50KCk7XG4gIH07XG5cbiAgY2xpY2tFdmVudCAoZXZlbnQpIHtcbiAgICB2YXIgY2xhc3NOYW1lID0gZXZlbnQudGFyZ2V0LmdldEF0dHJpYnV0ZSgnY2xhc3MnKTtcbiAgICBpZiAoIWNsYXNzTmFtZSB8fCBjbGFzc05hbWUuaW5kZXhPZignbGVvLWRyb3Bkb3duLWVudGl0eS0nICsgdGhpcy5lbnRpdHlJZCkgPT0gLTEpIHtcbiAgICAgIHRoaXMuc2NvcGUuJGFwcGx5KCgpID0+IHtcbiAgICAgICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgICB9KTtcbiAgICAgIHRoaXMucmVtb3ZlRXZlbnQoKTtcbiAgICB9XG4gIH1cblxuICBhdHRhY2hFdmVudCAoKSB7XG4gICAgdGhpcy4kZG9jdW1lbnQuYmluZCgnY2xpY2snLCB0aGlzLmNsaWNrRXZlbnQpO1xuICB9O1xuXG4gIHJlbW92ZUV2ZW50ICgpIHtcbiAgICB0aGlzLiRkb2N1bWVudC51bmJpbmQoJ2NsaWNrJywgdGhpcy5jbGlja0V2ZW50KTtcbiAgfTtcbn0iLCJleHBvcnQgZnVuY3Rpb24gbGVvU3RhdGVJdGVtICgpIHtcbiAgcmV0dXJuIHtcbiAgICByZXN0cmljdDogJ0UnLFxuICAgIHRlbXBsYXRlVXJsOiAnc3RhdGUtaXRlbS5odG1sJyxcbiAgICBzY29wZToge1xuICAgICAgc3RhdGU6ICc9JyxcbiAgICAgIGFqYXhTdGF0ZTogJz0nLFxuICAgICAgb25PcHRpb25DaGFuZ2VkOiAnJicsXG4gICAgICBvblJlbW92ZVN0YXRlOiAnJicsXG4gICAgICBvblJlbW92ZU9wdGlvbjogJyYnLFxuICAgICAgb25Ub2dnbGVDbGljazogJyYnXG4gICAgfSxcbiAgICBjb250cm9sbGVyQXM6ICdsZW9TdGF0ZUl0ZW0nLFxuICAgIGJpbmRUb0NvbnRyb2xsZXI6IHRydWUsXG4gICAgY29udHJvbGxlcjogTGVvU3RhdGVJdGVtXG4gIH07XG59XG5cbmNsYXNzIExlb1N0YXRlSXRlbSB7XG4gIHByaXZhdGUgc3RhdGU7XG4gIHB1YmxpYyBvblRvZ2dsZUNsaWNrOiBGdW5jdGlvbjtcbiAgcHVibGljIG9uUmVtb3ZlU3RhdGU6IEZ1bmN0aW9uO1xuICBwdWJsaWMgb25SZW1vdmVPcHRpb246IEZ1bmN0aW9uO1xuICBwdWJsaWMgb25PcHRpb25DaGFuZ2VkOiBGdW5jdGlvbjtcblxuICB0b2dnbGVDbGljayAoJGV2ZW50KSB7XG4gICAgJGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgJGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIHRoaXMub25Ub2dnbGVDbGljayh7XG4gICAgICBzdGF0ZTogdGhpcy5zdGF0ZVxuICAgIH0pO1xuICB9O1xuXG4gIHJlbW92ZVN0YXRlICgpIHtcbiAgICB0aGlzLm9uUmVtb3ZlU3RhdGUoe1xuICAgICAgc3RhdGU6IHRoaXMuc3RhdGVcbiAgICB9KTtcbiAgfTtcblxuICByZW1vdmVPcHRpb24gKHN0YXRlLCBvcHRpb24pIHtcbiAgICB0aGlzLm9uUmVtb3ZlT3B0aW9uKHtcbiAgICAgIHN0YXRlOiBzdGF0ZSxcbiAgICAgIG9wdGlvbjogb3B0aW9uXG4gICAgfSk7XG4gIH07XG5cbiAgdXBkYXRlU3RhdGUgKHN0YXRlKSB7XG4gICAgdGhpcy5vbk9wdGlvbkNoYW5nZWQoe1xuICAgICAgc3RhdGU6IHN0YXRlXG4gICAgfSk7XG4gIH1cbn0iLCJleHBvcnQgY2xhc3MgU3RvcmFnZSB7XG4gICRpbmplY3QgPSBbJyRyb290U2NvcGUnLCAnJHdpbmRvdycsICckbGVvbmFyZG8nXTtcbiAgcHJpdmF0ZSBBUFBfUFJFRklYO1xuICBwcml2YXRlIFNUQVRFU19TVE9SRV9LRVk7XG4gIHByaXZhdGUgU0FWRURfU1RBVEVTX0tFWTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlICRyb290U2NvcGUsIHByaXZhdGUgJHdpbmRvdywgcHJpdmF0ZSAkbGVvbmFyZG8pIHtcbiAgICAgIHRoaXMuQVBQX1BSRUZJWCA9IGAkeyRsZW9uYXJkby5nZXRBcHBQcmVmaXgoKX1fYDtcbiAgICAgIHRoaXMuU1RBVEVTX1NUT1JFX0tFWSA9IGAke3RoaXMuQVBQX1BSRUZJWH1sZW9uYXJkby1zdGF0ZXNgO1xuICAgICAgdGhpcy5TQVZFRF9TVEFURVNfS0VZID0gYCR7dGhpcy5BUFBfUFJFRklYfWxlb25hcmRvLXVucmVnaXN0ZXJlZC1zdGF0ZXNgO1xuXG4gIH1cbiAgX2dldEl0ZW0gKGtleSkge1xuICAgIHZhciBpdGVtID0gdGhpcy4kd2luZG93LmxvY2FsU3RvcmFnZS5nZXRJdGVtKGtleSk7XG4gICAgaWYgKCFpdGVtKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGFuZ3VsYXIuZnJvbUpzb24oaXRlbSk7XG4gIH1cblxuICBfc2V0SXRlbShrZXksIGRhdGEpIHtcbiAgICB0aGlzLiR3aW5kb3cubG9jYWxTdG9yYWdlLnNldEl0ZW0oa2V5LCBhbmd1bGFyLnRvSnNvbihkYXRhKSk7XG4gIH1cblxuICBnZXRTdGF0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEl0ZW0odGhpcy5TVEFURVNfU1RPUkVfS0VZKSB8fCB7fTtcbiAgfVxuXG4gIHNldFN0YXRlcyhzdGF0ZXMpIHtcbiAgICB0aGlzLl9zZXRJdGVtKHRoaXMuU1RBVEVTX1NUT1JFX0tFWSwgc3RhdGVzKTtcbiAgICB0aGlzLiRyb290U2NvcGUuJGVtaXQoJ2xlb25hcmRvOnNldFN0YXRlcycpO1xuICB9XG5cbiAgZ2V0U2F2ZWRTdGF0ZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dldEl0ZW0odGhpcy5TQVZFRF9TVEFURVNfS0VZKSB8fCBbXTtcbiAgfVxuXG4gIHNldFNhdmVkU3RhdGVzKHN0YXRlcykge1xuICAgIHRoaXMuX3NldEl0ZW0odGhpcy5TQVZFRF9TVEFURVNfS0VZLCBzdGF0ZXMpO1xuICB9XG59O1xuIiwid2luZG93Qm9keURpcmVjdGl2ZS4kaW5qZWN0ID0gWyckaHR0cCcsICdsZW9Db25maWd1cmF0aW9uJywgJyR0aW1lb3V0J107XG5cbmV4cG9ydCBmdW5jdGlvbiB3aW5kb3dCb2R5RGlyZWN0aXZlKCRodHRwLCBsZW9Db25maWd1cmF0aW9uLCAkdGltZW91dCkge1xuICByZXR1cm4ge1xuICAgIHJlc3RyaWN0OiAnRScsXG4gICAgdGVtcGxhdGVVcmw6ICd3aW5kb3ctYm9keS5odG1sJyxcbiAgICBzY29wZTogdHJ1ZSxcbiAgICBjb250cm9sbGVyOiBMZW9XaW5kb3dCb2R5LFxuICAgIGJpbmRUb0NvbnRyb2xsZXI6IHRydWUsXG4gICAgY29udHJvbGxlckFzOiAnbGVvV2luZG93Qm9keScsXG4gICAgcmVxdWlyZTogWydebGVvQWN0aXZhdG9yJywgJ2xlb1dpbmRvd0JvZHknXSxcbiAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsLCBhdHRyLCBjb250cm9sbGVycykge1xuICAgICAgdmFyIGxlb0FjdGl2YXRvciA9IGNvbnRyb2xsZXJzWzBdO1xuICAgICAgdmFyIGxlb1dpbmRvd0JvZHkgPSBjb250cm9sbGVyc1sxXTtcblxuICAgICAgbGVvV2luZG93Qm9keS5oYXNBY3RpdmVPcHRpb24gPSBmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gdGhpcy5yZXF1ZXN0cy5maWx0ZXIoZnVuY3Rpb24gKHJlcXVlc3QpIHtcbiAgICAgICAgICByZXR1cm4gISFyZXF1ZXN0LmFjdGl2ZTtcbiAgICAgICAgfSkubGVuZ3RoO1xuICAgICAgfTtcblxuICAgICAgbGVvV2luZG93Qm9keS5zYXZlVW5yZWdpc3RlcmVkU3RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdGF0ZU5hbWUgPSB0aGlzLmRldGFpbC5zdGF0ZTtcblxuICAgICAgICBsZW9Db25maWd1cmF0aW9uLmFkZFNhdmVkU3RhdGUoe1xuICAgICAgICAgIG5hbWU6IHN0YXRlTmFtZSxcbiAgICAgICAgICB2ZXJiOiBsZW9XaW5kb3dCb2R5LmRldGFpbC5fdW5yZWdpc3RlcmVkU3RhdGUudmVyYixcbiAgICAgICAgICB1cmw6IGxlb1dpbmRvd0JvZHkuZGV0YWlsLl91bnJlZ2lzdGVyZWRTdGF0ZS51cmwsXG4gICAgICAgICAgb3B0aW9uczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBuYW1lOiBsZW9XaW5kb3dCb2R5LmRldGFpbC5vcHRpb24sXG4gICAgICAgICAgICAgIHN0YXR1czogbGVvV2luZG93Qm9keS5kZXRhaWwuc3RhdHVzLFxuICAgICAgICAgICAgICBkYXRhOiBsZW9XaW5kb3dCb2R5LmRldGFpbC52YWx1ZSxcbiAgICAgICAgICAgICAgZGVsYXk6IGxlb1dpbmRvd0JvZHkuZGV0YWlsLmRlbGF5XG4gICAgICAgICAgICB9XG4gICAgICAgICAgXVxuICAgICAgICB9KTtcblxuICAgICAgICBsZW9BY3RpdmF0b3Iuc2VsZWN0VGFiKCdzY2VuYXJpb3MnKTtcbiAgICAgIH07XG5cbiAgICAgIGxlb1dpbmRvd0JvZHkudGVzdCA9IHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgdmFsdWU6IHVuZGVmaW5lZFxuICAgICAgfTtcblxuICAgICAgbGVvV2luZG93Qm9keS5zdWJtaXQgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgIGxlb1dpbmRvd0JvZHkudGVzdC52YWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgbGVvV2luZG93Qm9keS51cmwgPSB1cmw7XG4gICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAkaHR0cC5nZXQodXJsKS5zdWNjZXNzKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgIGxlb1dpbmRvd0JvZHkudGVzdC52YWx1ZSA9IHJlcztcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG4gIH07XG59XG5cblxuY2xhc3MgTGVvV2luZG93Qm9keSB7XG4gIGVkaXRlZFN0YXRlOmFueTtcbiAgJGluamVjdCA9IFsnJHNjb3BlJywgJ2xlb0NvbmZpZ3VyYXRpb24nLCAnJHRpbWVvdXQnXTtcbiAgc3RhdGVzOiBhbnlbXTtcbiAgcHJpdmF0ZSBkZXRhaWw6IHtcbiAgICBvcHRpb246IHN0cmluZztcbiAgICBkZWxheTogbnVtYmVyO1xuICAgIHN0YXR1czogbnVtYmVyO1xuICAgIHN0cmluZ1ZhbHVlPzogc3RyaW5nO1xuICAgIGVycm9yPzogc3RyaW5nO1xuICAgIHZhbHVlPzogc3RyaW5nO1xuICAgIF91bnJlZ2lzdGVyZWRTdGF0ZT86IGFueTtcbiAgfTtcbiAgcHJpdmF0ZSBzY2VuYXJpb3M7XG4gIHByaXZhdGUgc2VsZWN0ZWRTdGF0ZTtcbiAgcHJpdmF0ZSBhY3RpdmVTY2VuYXJpbztcbiAgcHJpdmF0ZSByZXF1ZXN0czogYW55W107XG4gIHByaXZhdGUgZXhwb3J0U3RhdGVzO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgJHNjb3BlLCBwcml2YXRlIGxlb0NvbmZpZ3VyYXRpb24sIHByaXZhdGUgJHRpbWVvdXQpIHtcbiAgICB0aGlzLmRldGFpbCA9IHtcbiAgICAgIG9wdGlvbjogJ3N1Y2Nlc3MnLFxuICAgICAgZGVsYXk6IDAsXG4gICAgICBzdGF0dXM6IDIwMFxuICAgIH07XG5cbiAgICB0aGlzLnN0YXRlcyA9IHRoaXMubGVvQ29uZmlndXJhdGlvbi5nZXRTdGF0ZXMoKTtcbiAgICB0aGlzLnNjZW5hcmlvcyA9IHRoaXMubGVvQ29uZmlndXJhdGlvbi5nZXRTY2VuYXJpb3MoKTtcbiAgICB0aGlzLnJlcXVlc3RzID0gdGhpcy5sZW9Db25maWd1cmF0aW9uLmdldFJlcXVlc3RzTG9nKCk7XG5cbiAgICAkc2NvcGUuJHdhdGNoKCdsZW9XaW5kb3dCb2R5LmRldGFpbC52YWx1ZScsICh2YWx1ZSkgPT4ge1xuICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmRldGFpbC5zdHJpbmdWYWx1ZSA9IHZhbHVlID8gSlNPTi5zdHJpbmdpZnkodmFsdWUsIG51bGwsIDQpIDogJyc7XG4gICAgICAgIHRoaXMuZGV0YWlsLmVycm9yID0gJyc7XG4gICAgICB9XG4gICAgICBjYXRjaCAoZSkge1xuICAgICAgICB0aGlzLmRldGFpbC5lcnJvciA9IGUubWVzc2FnZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgICRzY29wZS4kd2F0Y2goJ2xlb1dpbmRvd0JvZHkuZGV0YWlsLnN0cmluZ1ZhbHVlJywgKHZhbHVlKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICB0aGlzLmRldGFpbC52YWx1ZSA9IHZhbHVlID8gSlNPTi5wYXJzZSh2YWx1ZSkgOiB7fTtcbiAgICAgICAgdGhpcy5kZXRhaWwuZXJyb3IgPSAnJztcbiAgICAgIH1cbiAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuZGV0YWlsLmVycm9yID0gZS5tZXNzYWdlO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHNjb3BlLiRvbignbGVvbmFyZG86c3RhdGVDaGFuZ2VkJywgKGV2ZW50LCBzdGF0ZU9iaikgPT4ge1xuICAgICAgdGhpcy5zdGF0ZXMgPSBsZW9Db25maWd1cmF0aW9uLmdldFN0YXRlcygpO1xuXG4gICAgICB2YXIgc3RhdGUgPSB0aGlzLnN0YXRlcy5maWx0ZXIoZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5uYW1lID09PSBzdGF0ZU9iai5uYW1lO1xuICAgICAgfSlbMF07XG5cbiAgICAgIGlmIChzdGF0ZSkge1xuICAgICAgICBzdGF0ZS5oaWdobGlnaHQgPSB0cnVlO1xuICAgICAgICAkdGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgc3RhdGUuaGlnaGxpZ2h0ID0gZmFsc2U7XG4gICAgICAgIH0sIDMwMDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgcmVtb3ZlU3RhdGVCeU5hbWUgKG5hbWUpIHtcbiAgICB0aGlzLnN0YXRlcyA9IHRoaXMuc3RhdGVzLmZpbHRlcihmdW5jdGlvbihzdGF0ZSkge1xuICAgICAgcmV0dXJuIHN0YXRlLm5hbWUgIT09IG5hbWU7XG4gICAgfSk7XG4gIH07XG5cblxuICByZW1vdmVPcHRpb25CeU5hbWUgKHN0YXRlTmFtZSwgb3B0aW9uTmFtZSkge1xuICAgIHRoaXMuc3RhdGVzLmZvckVhY2goZnVuY3Rpb24oc3RhdGUsIGkpe1xuICAgICAgaWYgKHN0YXRlLm5hbWUgPT09IHN0YXRlTmFtZSl7XG4gICAgICAgIHN0YXRlLm9wdGlvbnMgPSBzdGF0ZS5vcHRpb25zLmZpbHRlcihmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uLm5hbWUgIT09IG9wdGlvbk5hbWU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9O1xuXG5cbiAgcmVtb3ZlU3RhdGUgKHN0YXRlKXtcbiAgICB0aGlzLmxlb0NvbmZpZ3VyYXRpb24ucmVtb3ZlU3RhdGUoc3RhdGUpO1xuICAgIHRoaXMucmVtb3ZlU3RhdGVCeU5hbWUoc3RhdGUubmFtZSk7XG4gIH07XG5cbiAgcmVtb3ZlT3B0aW9uIChzdGF0ZSwgb3B0aW9uKXtcbiAgICBpZiAoc3RhdGUub3B0aW9ucy5sZW5ndGggPT09IDEpIHtcbiAgICAgIHRoaXMucmVtb3ZlU3RhdGUoc3RhdGUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmxlb0NvbmZpZ3VyYXRpb24ucmVtb3ZlT3B0aW9uKHN0YXRlLCBvcHRpb24pO1xuICAgICAgdGhpcy5yZW1vdmVPcHRpb25CeU5hbWUoc3RhdGUubmFtZSwgb3B0aW9uLm5hbWUpO1xuICAgICAgc3RhdGUuYWN0aXZlT3B0aW9uID0gc3RhdGUub3B0aW9uc1swXTtcbiAgICB9XG4gIH07XG5cbiAgZWRpdFN0YXRlIChzdGF0ZSl7XG4gICAgdGhpcy5lZGl0ZWRTdGF0ZSA9IGFuZ3VsYXIuY29weShzdGF0ZSk7XG4gICAgdGhpcy5lZGl0ZWRTdGF0ZS5kYXRhU3RyaW5nVmFsdWUgPSBKU09OLnN0cmluZ2lmeSh0aGlzLmVkaXRlZFN0YXRlLmFjdGl2ZU9wdGlvbi5kYXRhKTtcbiAgfTtcblxuICBvbkVkaXRPcHRpb25TdWNjZXNzIChzdHIpIHtcbiAgICB0aGlzLmVkaXRlZFN0YXRlLmFjdGl2ZU9wdGlvbi5kYXRhID0gSlNPTi5wYXJzZShzdHIpO1xuICAgIHRoaXMuZWRpdGVkU3RhdGUuZXJyb3IgPSAnJztcbiAgfTtcblxuICBvbkVkaXRPcHRpb25Kc29uRXJyb3IgKG1zZykge1xuICAgIHRoaXMuZWRpdGVkU3RhdGUuZXJyb3IgPSBtc2c7XG4gIH07XG5cbiAgc2F2ZUVkaXRlZFN0YXRlICgpIHtcbiAgICB0aGlzLmxlb0NvbmZpZ3VyYXRpb24uYWRkT3JVcGRhdGVTYXZlZFN0YXRlKHRoaXMuZWRpdGVkU3RhdGUpO1xuICAgIHRoaXMuY2xvc2VFZGl0ZWRTdGF0ZSgpO1xuICB9O1xuXG4gIGNsb3NlRWRpdGVkU3RhdGUgKCkge1xuICAgIHRoaXMuZWRpdGVkU3RhdGUgPSBudWxsO1xuICB9O1xuXG4gIG5vdEhhc1VybCAob3B0aW9uKSB7XG4gICAgcmV0dXJuICFvcHRpb24udXJsO1xuICB9O1xuXG4gIGhhc1VybCAob3B0aW9uKSB7XG4gICAgcmV0dXJuICEhb3B0aW9uLnVybDtcbiAgfTtcblxuICBkZWFjdGl2YXRlICgpIHtcbiAgICB0aGlzLnN0YXRlcy5mb3JFYWNoKGZ1bmN0aW9uIChzdGF0ZSkge1xuICAgICAgc3RhdGUuYWN0aXZlID0gZmFsc2U7XG4gICAgfSk7XG4gICAgdGhpcy5sZW9Db25maWd1cmF0aW9uLmRlYWN0aXZhdGVBbGxTdGF0ZXMoKTtcbiAgfTtcblxuICB0b2dnbGVTdGF0ZSAoc3RhdGUpIHtcbiAgICBzdGF0ZS5hY3RpdmUgPSAhc3RhdGUuYWN0aXZlO1xuICAgIHRoaXMudXBkYXRlU3RhdGUoc3RhdGUpO1xuICB9XG5cblxuICB1cGRhdGVTdGF0ZSAoc3RhdGUpIHtcbiAgICBpZiAoc3RhdGUuYWN0aXZlKSB7XG4gICAgICB0aGlzLmxlb0NvbmZpZ3VyYXRpb24uYWN0aXZhdGVTdGF0ZU9wdGlvbihzdGF0ZS5uYW1lLCBzdGF0ZS5hY3RpdmVPcHRpb24ubmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMubGVvQ29uZmlndXJhdGlvbi5kZWFjdGl2YXRlU3RhdGUoc3RhdGUubmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuc2VsZWN0ZWRTdGF0ZSA9PT0gc3RhdGUpIHtcbiAgICAgIHRoaXMuZWRpdFN0YXRlKHN0YXRlKTtcbiAgICB9XG5cbiAgfTtcblxuICBhY3RpdmF0ZVNjZW5hcmlvIChzY2VuYXJpbykge1xuICAgIHRoaXMuYWN0aXZlU2NlbmFyaW8gPSBzY2VuYXJpbztcbiAgICB0aGlzLmxlb0NvbmZpZ3VyYXRpb24uc2V0QWN0aXZlU2NlbmFyaW8oc2NlbmFyaW8pO1xuICAgIHRoaXMuc3RhdGVzID0gdGhpcy5sZW9Db25maWd1cmF0aW9uLmdldFN0YXRlcygpO1xuICB9XG5cblxuXG5cbiAgc3RhdGVJdGVtU2VsZWN0ZWQgKHN0YXRlKSB7XG4gICAgaWYgKHN0YXRlID09PSB0aGlzLnNlbGVjdGVkU3RhdGUpIHtcbiAgICAgIHRoaXMuZWRpdGVkU3RhdGUgPSB0aGlzLnNlbGVjdGVkU3RhdGUgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnNlbGVjdGVkU3RhdGUgPSBzdGF0ZTtcbiAgICAgIHRoaXMuZWRpdFN0YXRlKHN0YXRlKTtcbiAgICB9XG4gIH1cblxuICByZXF1ZXN0U2VsZWN0IChyZXF1ZXN0KSB7XG4gICAgdmFyIG9wdGlvbk5hbWU7XG4gICAgdGhpcy5yZXF1ZXN0cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXF1ZXN0KSB7XG4gICAgICByZXF1ZXN0LmFjdGl2ZSA9IGZhbHNlO1xuICAgIH0pO1xuXG4gICAgcmVxdWVzdC5hY3RpdmUgPSB0cnVlO1xuXG4gICAgaWYgKHJlcXVlc3Quc3RhdGUgJiYgcmVxdWVzdC5zdGF0ZS5uYW1lKSB7XG4gICAgICBvcHRpb25OYW1lID0gcmVxdWVzdC5zdGF0ZS5uYW1lICsgJyBvcHRpb24gJyArIHJlcXVlc3Quc3RhdGUub3B0aW9ucy5sZW5ndGg7XG4gICAgfVxuXG4gICAgYW5ndWxhci5leHRlbmQodGhpcy5kZXRhaWwsIHtcbiAgICAgIHN0YXRlOiAocmVxdWVzdC5zdGF0ZSAmJiByZXF1ZXN0LnN0YXRlLm5hbWUpIHx8ICcnLFxuICAgICAgb3B0aW9uOiBvcHRpb25OYW1lIHx8ICcnLFxuICAgICAgZGVsYXk6IDAsXG4gICAgICBzdGF0dXM6IHJlcXVlc3Quc3RhdHVzIHx8IDIwMCxcbiAgICAgIHN0YXRlQWN0aXZlOiAhIXJlcXVlc3Quc3RhdGUsXG4gICAgICB2YWx1ZTogcmVxdWVzdC5kYXRhIHx8IHt9XG4gICAgfSk7XG4gICAgdGhpcy5kZXRhaWwuX3VucmVnaXN0ZXJlZFN0YXRlID0gcmVxdWVzdDtcbiAgfVxuXG4gIGdldFN0YXRlc0ZvckV4cG9ydCAoKSB7XG4gICAgdGhpcy5leHBvcnRTdGF0ZXMgPSB0aGlzLmxlb0NvbmZpZ3VyYXRpb24uZ2V0U3RhdGVzKCk7XG4gIH1cbn1cbiJdfQ==

;

(function(module) {
try {
  module = angular.module('leonardo.templates');
} catch (e) {
  module = angular.module('leonardo.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('request.html',
    '<a href="#" class="leo-list-item" ng-click="leoRequest.select()" ng-class="{active: leoRequest.request.active}"><span class="leo-request-verb {{leoRequest.request.verb.toLowerCase()}}">{{leoRequest.request.verb}}</span> <span class="leo-request-name">{{leoRequest.request.url}}</span> <span ng-if="!!leoRequest.request.state" class="leo-request leo-request-existing">{{leoRequest.request.state.name}}</span> <span ng-if="!leoRequest.request.state" class="leo-request leo-request-new">new</span> <span ng-if="!!leoRequest.request.state && leoRequest.request.state.active" class="leo-request leo-request-mocked">mocked</span></a>');
}]);
})();

(function(module) {
try {
  module = angular.module('leonardo.templates');
} catch (e) {
  module = angular.module('leonardo.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('select.html',
    '<div class="leo-drop-down leo-dropdown-entity-{{leoSelect.entityId}}" ng-disabled="leoSelect.disabled()"><div ng-click="leoSelect.toggle($event)" class="leo-drop-down-selected leo-dropdown-entity-{{leoSelect.entityId}}">{{leoSelect.state.activeOption.name}} <span class="leo-drop-down-icon">+</span></div><div ng-show="leoSelect.open" class="leo-drop-down-items"><span class="leo-drop-down-item" ng-repeat="option in leoSelect.state.options" ng-click="leoSelect.selectOption($event, option)"><span class="leo-delete" ng-click="leoSelect.removeOption(option)">x</span> <span class="leo-drop-down-item-name">{{option.name}}</span></span></div></div>');
}]);
})();

(function(module) {
try {
  module = angular.module('leonardo.templates');
} catch (e) {
  module = angular.module('leonardo.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('state-item.html',
    '<div><div class="onoffswitch"><input ng-checked="leoStateItem.state.active" class="onoffswitch-checkbox" id="{{leoStateItem.state.name}}" type="checkbox" name="{{leoStateItem.state.name}}" value="{{leoStateItem.state.name}}"> <label class="onoffswitch-label" for="{{leoStateItem.state.name}}" ng-click="leoStateItem.toggleClick($event)"><span class="onoffswitch-inner"></span> <span class="onoffswitch-switch"></span></label></div></div><div ng-if="!leoStateItem.ajaxState" class="leo-request-verb non-ajax">None-Ajax</div><div ng-if="leoStateItem.ajaxState"><div class="leo-request-verb {{leoStateItem.state.verb.toLowerCase()}}">{{leoStateItem.state.verb}}</div></div><div class="leo-expand"><h4>{{leoStateItem.state.name}}</h4><span ng-if="leoStateItem.ajaxState" class="url">{{leoStateItem.state.url}}</span></div><div><leo-select state="leoStateItem.state" disabled="!leoStateItem.state.active" on-change="leoStateItem.updateState(state)" on-delete="leoStateItem.removeOption(state,option)"></leo-select></div><button ng-click="leoStateItem.removeState()" title="Remove State">Remove</button>');
}]);
})();

(function(module) {
try {
  module = angular.module('leonardo.templates');
} catch (e) {
  module = angular.module('leonardo.templates', []);
}
module.run(['$templateCache', function($templateCache) {
  $templateCache.put('window-body.html',
    '<div class="leonardo-window-body"><div ng-switch="leonardo.activeTab" class="leonardo-window-options"><div ng-switch-when="recorder" class="leonardo-recorder"><div class="leo-list"><div class="list-group"><leo-request ng-repeat="request in leoWindowBody.requests" request="request" on-select="leoWindowBody.requestSelect(request)"></leo-request></div></div><div class="leo-detail" ng-show="leoWindowBody.hasActiveOption()"><div class="leo-detail-header"><div ng-if="!leoWindowBody.detail.stateActive"><span>Add new state:</span> <input class="leo-detail-state" ng-model="leoWindowBody.detail.state" placeholder="Enter state name"></div><div ng-if="leoWindowBody.detail.stateActive" class="leo-detail-state">Add mocked response for "{{leoWindowBody.detail.state}}"</div></div><div class="leo-detail-option"><div>Response name: <input ng-model="leoWindowBody.detail.option"></div><div>Status code: <input ng-model="leoWindowBody.detail.status"></div><div>Delay: <input ng-model="leoWindowBody.detail.delay"></div><div class="leo-detail-option-json">Response JSON:<div class="leo-error">{{leoWindowBody.detail.error}}</div><textarea ng-model="leoWindowBody.detail.stringValue"></textarea></div></div><div class="leo-action-row"><button ng-click="leoWindowBody.saveUnregisteredState()">{{ leoWindowBody.detail.stateActive ? \'Add Option\' : \'Add State\' }}</button></div></div></div><div ng-switch-when="export" class="leonardo-export" style="padding: 30px"><code contenteditable="" ng-init="leoWindowBody.getStatesForExport()">\n' +
    '\n' +
    '        <div>angular.module(\'leonardo\').run([\'leoConfiguration\', function(leoConfiguration) {</div>\n' +
    '\n' +
    '        <div ng-repeat="state in leoWindowBody.exportStates">\n' +
    '          <div style="margin-left: 10px">leoConfiguration.addStates([</div>\n' +
    '          <pre style="margin-left: 20px">{{state | json}}</pre>\n' +
    '          <div style="margin-left: 10px">])</div>\n' +
    '        </div>\n' +
    '\n' +
    '        <div>}])</div>\n' +
    '\n' +
    '      </code></div><div ng-switch-when="scenarios" class="leonardo-activate"><div class="leonardo-menu"><div>SCENARIOS</div><ul><li ng-class="{ \'selected\': scenario === leoWindowBody.activeScenario }" ng-repeat="scenario in leoWindowBody.scenarios" ng-click="leoWindowBody.activateScenario(scenario)">{{scenario}}</li></ul></div><ul><li><div class="states-filter-wrapper"><label for="filter" class="states-filter-label">Search for state</label> <input id="filter" class="states-filter" type="text" ng-model="leoWindowBody.filter"></div></li><li class="request-item" ng-repeat="state in nonAjaxState = (leoWindowBody.states | filter:leoWindowBody.notHasUrl | filter:{name: leoWindowBody.filter}) track by $index" ng-class="{ \'leo-highlight\': state.highlight, selected:leoWindowBody.selectedState === state}"><leo-state-item ng-class="{}" state="state" ajax-state="false" on-toggle-click="leoWindowBody.toggleState(state)" on-option-changed="leoWindowBody.updateState(state, option)" on-remove-option="leoWindowBody.removeOption(state,option)" on-remove-state="leoWindowBody.removeState(state)" ng-click="leoWindowBody.stateItemSelected(state)"></leo-state-item></li><li class="request-item" ng-repeat="state in ajaxReuslts = (leoWindowBody.states | filter:leoWindowBody.hasUrl | filter:{name: leoWindowBody.filter}) track by $index" ng-class="{ \'leo-highlight\': state.highlight, selected:leoWindowBody.selectedState === state}"><leo-state-item ng-class="{}" state="state" ajax-state="true" on-toggle-click="leoWindowBody.toggleState(state)" on-option-changed="leoWindowBody.updateState(state, option)" on-remove-option="leoWindowBody.removeOption(state,option)" on-remove-state="leoWindowBody.removeState(state)" ng-click="leoWindowBody.stateItemSelected(state)"></leo-state-item></li><li ng-show="!ajaxReuslts.length && !nonAjaxState.length">No Results Found</li></ul><div class="edit-state" ng-class="{visible:!!leoWindowBody.editedState}"><div class="leonardo-edit-option" ng-if="!!leoWindowBody.editedState"><div class="leo-detail"><div class="leo-detail-option"><span class="title">Edit option <b>{{leoWindowBody.editedState.activeOption.name}}</b> for state <b>{{leoWindowBody.editedState.name}}</b></span><div>Status code: <input ng-model="leoWindowBody.editedState.activeOption.status"></div><div>Delay: <input ng-model="leoWindowBody.editedState.activeOption.delay"></div><div class="leo-detail-option-json">Response JSON:<div class="leo-error">{{leoWindowBody.editedState.error}}</div><leo-json-formatter json-string="leoWindowBody.editedState.dataStringValue" on-error="leoWindowBody.onEditOptionJsonError(msg)" on-success="leoWindowBody.onEditOptionSuccess(value)"></leo-json-formatter></div></div><div class="leo-action-row"><button ng-click="leoWindowBody.saveEditedState()">Save</button> <button ng-click="leoWindowBody.closeEditedState()">Cancel</button></div></div></div></div></div><div ng-switch-when="test" class="leonardo-test"><div><label for="url"></label>URL: <input id="url" type="text" ng-model="leoWindowBody.test.url"> <input type="button" ng-click="leoWindowBody.submit(test.url)" value="submit"></div><textarea>{{leoWindowBody.test.value | json}}</textarea></div></div></div>');
}]);
})();

(function (doc, cssText) {
    var styleEl = doc.createElement("style");
    doc.getElementsByTagName("head")[0].appendChild(styleEl);
    if (styleEl.styleSheet) {
        if (!styleEl.styleSheet.disabled) {
            styleEl.styleSheet.cssText = cssText;
        }
    } else {
        try {
            styleEl.innerHTML = cssText;
        } catch (ignore) {
            styleEl.innerText = cssText;
        }
    }
}(document, ".onoffswitch {\n" +
"  transform: scale(0.8);\n" +
"  position: relative;\n" +
"  left: -8px;\n" +
"  width: 85px;\n" +
"  -webkit-user-select: none;\n" +
"  -moz-user-select: none;\n" +
"  -ms-user-select: none;\n" +
"}\n" +
".onoffswitch-checkbox {\n" +
"  display: none;\n" +
"}\n" +
".onoffswitch-label {\n" +
"  display: block;\n" +
"  overflow: hidden;\n" +
"  cursor: pointer;\n" +
"  border: 2px solid #999999;\n" +
"  border-radius: 20px;\n" +
"}\n" +
".onoffswitch-inner {\n" +
"  display: block;\n" +
"  width: 200%;\n" +
"  margin-left: -100%;\n" +
"  -moz-transition: margin 0.3s ease-in 0s;\n" +
"  -webkit-transition: margin 0.3s ease-in 0s;\n" +
"  -o-transition: margin 0.3s ease-in 0s;\n" +
"  transition: margin 0.3s ease-in 0s;\n" +
"}\n" +
".onoffswitch-inner:before,\n" +
".onoffswitch-inner:after {\n" +
"  display: block;\n" +
"  float: left;\n" +
"  width: 50%;\n" +
"  height: 30px;\n" +
"  padding: 0;\n" +
"  line-height: 30px;\n" +
"  font-size: 14px;\n" +
"  color: white;\n" +
"  font-family: Trebuchet, Arial, sans-serif;\n" +
"  font-weight: bold;\n" +
"  -moz-box-sizing: border-box;\n" +
"  -webkit-box-sizing: border-box;\n" +
"  box-sizing: border-box;\n" +
"}\n" +
".onoffswitch-inner:before {\n" +
"  content: \"ON\";\n" +
"  padding-left: 10px;\n" +
"  background-color: #2FCCFF;\n" +
"  color: #FFFFFF;\n" +
"}\n" +
".onoffswitch-inner:after {\n" +
"  content: \"OFF\";\n" +
"  padding-right: 10px;\n" +
"  background-color: #EEEEEE;\n" +
"  color: #999999;\n" +
"  text-align: right;\n" +
"}\n" +
".onoffswitch-switch {\n" +
"  display: block;\n" +
"  width: 18px;\n" +
"  margin: 6px;\n" +
"  background: #FFFFFF;\n" +
"  border: 2px solid #999999;\n" +
"  border-radius: 20px;\n" +
"  position: absolute;\n" +
"  top: 0;\n" +
"  bottom: 0;\n" +
"  right: 56px;\n" +
"  -moz-transition: all 0.3s ease-in 0s;\n" +
"  -webkit-transition: all 0.3s ease-in 0s;\n" +
"  -o-transition: all 0.3s ease-in 0s;\n" +
"  transition: all 0.3s ease-in 0s;\n" +
"}\n" +
".onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-inner {\n" +
"  margin-left: 0;\n" +
"}\n" +
".onoffswitch-checkbox:checked + .onoffswitch-label .onoffswitch-switch {\n" +
"  right: 0px;\n" +
"}\n" +
".leonardo-activator {\n" +
"  position: fixed;\n" +
"  right: 40px;\n" +
"  bottom: 40px;\n" +
"  width: 128px;\n" +
"  cursor: pointer;\n" +
"  height: 110px;\n" +
"  z-index: 99999;\n" +
"  background-image: url('data:image/png;base64,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');\n" +
"}\n" +
"@-webkit-keyframes leo-highlight-animation {\n" +
"  0% {\n" +
"    background: none;\n" +
"  }\n" +
"  20% {\n" +
"    background: #f08222;\n" +
"  }\n" +
"  100% {\n" +
"    background: none;\n" +
"  }\n" +
"}\n" +
"@keyframes leo-highlight-animation {\n" +
"  0% {\n" +
"    background: none;\n" +
"  }\n" +
"  20% {\n" +
"    background: #f08222;\n" +
"  }\n" +
"  100% {\n" +
"    background: none;\n" +
"  }\n" +
"}\n" +
".leonardo-header {\n" +
"  position: absolute;\n" +
"  z-index: 1;\n" +
"  top: 0;\n" +
"  left: 0;\n" +
"  right: 0;\n" +
"  border-bottom: 1px solid #cccccc;\n" +
"  display: inline-block;\n" +
"  min-height: 44px;\n" +
"}\n" +
".leonardo-header .menu {\n" +
"  font-size: 1.5em;\n" +
"  color: #666666;\n" +
"  text-align: left;\n" +
"  font-weight: bold;\n" +
"  height: 26px;\n" +
"}\n" +
".leonardo-header .menu ul {\n" +
"  margin: 0 20px;\n" +
"  padding: 0;\n" +
"}\n" +
".leonardo-header .menu ul > li {\n" +
"  display: block;\n" +
"  line-height: 44px;\n" +
"  margin-right: 20px;\n" +
"  float: left;\n" +
"  text-align: center;\n" +
"  text-transform: uppercase;\n" +
"  font-size: 12px;\n" +
"  width: 170px;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-header .menu ul > li.leo-selected-tab {\n" +
"  border-top: 3px solid #f08222;\n" +
"}\n" +
".leonardo-header .menu ul > li:first-child {\n" +
"  font-size: 20px;\n" +
"  text-align: left;\n" +
"  padding-top: 3px;\n" +
"}\n" +
".leonardo-window {\n" +
"  position: absolute;\n" +
"  top: 0;\n" +
"  height: 0;\n" +
"  right: 0;\n" +
"  left: 0;\n" +
"  overflow: hidden;\n" +
"  background-color: white;\n" +
"  z-index: 9999;\n" +
"  -webkit-transition: height 1s ease 0s;\n" +
"  -moz-transition: height 1s ease 0s;\n" +
"  -o-transition: height 1s ease 0s;\n" +
"  transition: height 1s ease 0s;\n" +
"}\n" +
".leonardo-window .leonardo-window-body {\n" +
"  padding-top: 48px;\n" +
"  height: 100%;\n" +
"  color: #666666;\n" +
"}\n" +
".leonardo-window .leonardo-window-body .leo-highlight {\n" +
"  -webkit-animation: leo-highlight-animation 1s linear 1;\n" +
"  animation: leo-highlight-animation 1s linear 1;\n" +
"}\n" +
".leonardo-window .leonardo-window-body .request-item {\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-window .leonardo-window-body .request-item:nth-child(even) {\n" +
"  background: #F2F2F2;\n" +
"}\n" +
".leonardo-window .leonardo-window-body .request-item:hover {\n" +
"  background: rgba(47, 204, 255, 0.32);\n" +
"}\n" +
".leonardo-window .leonardo-window-body .request-item.selected {\n" +
"  background: #A6A6A6;\n" +
"  color: white;\n" +
"}\n" +
".leonardo-window .states-filter-wrapper {\n" +
"  margin-left: 0;\n" +
"}\n" +
".leonardo-window .states-filter-wrapper .states-filter-label {\n" +
"  display: block;\n" +
"}\n" +
".leonardo-window .states-filter-wrapper .states-filter {\n" +
"  height: 28px;\n" +
"  font-size: 16px;\n" +
"  width: 200px;\n" +
"  outline: none;\n" +
"}\n" +
".pull-top-closed .leonardo-window {\n" +
"  z-index: -4;\n" +
"}\n" +
".pull-top .leonardo-window {\n" +
"  position: fixed;\n" +
"  overflow: auto;\n" +
"  bottom: 0;\n" +
"  height: 100%;\n" +
"  border-bottom: 1px solid black;\n" +
"  -webkit-transition: height 1s ease 0s;\n" +
"  -moz-transition: height 1s ease 0s;\n" +
"  -o-transition: height 1s ease 0s;\n" +
"  transition: height 1s ease 0s;\n" +
"}\n" +
".pull-top .leonardo-window .leonardo-header {\n" +
"  z-index: 1;\n" +
"}\n" +
".leonardo-window .tabs {\n" +
"  width: 100%;\n" +
"  display: flex;\n" +
"  height: 100px;\n" +
"}\n" +
".leonardo-window .tabs > div {\n" +
"  display: flex;\n" +
"  justify-content: center;\n" +
"  flex-direction: column;\n" +
"  text-align: center;\n" +
"  flex-grow: 1;\n" +
"  margin: 10px;\n" +
"  border: 1px solid grey;\n" +
"  font-size: 24px;\n" +
"  cursor: pointer;\n" +
"}\n" +
".leonardo-window .tabs > div.selected {\n" +
"  background-color: grey;\n" +
"  color: white;\n" +
"  cursor: auto;\n" +
"}\n" +
".leonardo-window .leonardo-window-options {\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-window select {\n" +
"  height: 25px;\n" +
"}\n" +
".leonardo-window button,\n" +
".leonardo-window input[type=\"button\"],\n" +
".leonardo-window select {\n" +
"  background: #219161;\n" +
"  color: white;\n" +
"  border: 0;\n" +
"  font-size: 13px;\n" +
"}\n" +
".leonardo-window input [type=\"text\"],\n" +
".leonardo-window textarea {\n" +
"  border: 1px solid #dddddd;\n" +
"}\n" +
".leo-detail-option {\n" +
"  display: flex;\n" +
"  font-size: 13px;\n" +
"  flex-direction: column;\n" +
"}\n" +
".leo-detail-option div {\n" +
"  margin: 5px 0;\n" +
"}\n" +
".leo-detail-option div input {\n" +
"  width: 150px;\n" +
"}\n" +
".leo-detail-option div.leo-detail-option-json {\n" +
"  flex-direction: column;\n" +
"}\n" +
".leo-detail-option div.leo-detail-option-json textarea {\n" +
"  height: 250px;\n" +
"  width: 100%;\n" +
"  margin-top: 10px;\n" +
"  font-size: 13px;\n" +
"  border: 1px solid #eee;\n" +
"}\n" +
".leo-detail-option div.leo-detail-option-json textarea:focus {\n" +
"  outline: none;\n" +
"}\n" +
".leo-detail-option input {\n" +
"  border-width: 0 0 1px 0;\n" +
"  outline: none;\n" +
"  font-size: 13px;\n" +
"  margin-left: 5px;\n" +
"  width: 200px;\n" +
"}\n" +
".leonardo-activate {\n" +
"  display: flex;\n" +
"  height: 100%;\n" +
"}\n" +
".leonardo-activate .leonardo-menu {\n" +
"  padding: 5px;\n" +
"  flex: 0.5;\n" +
"  border-right: 1px solid #cccccc;\n" +
"}\n" +
".leonardo-activate .leonardo-menu ul {\n" +
"  margin: 0;\n" +
"  padding: 0;\n" +
"}\n" +
".leonardo-activate .leonardo-menu li {\n" +
"  border-width: 0 0 1px 0;\n" +
"  display: block;\n" +
"  cursor: pointer;\n" +
"  font-size: 13px;\n" +
"}\n" +
".leonardo-activate .leonardo-menu li:hover {\n" +
"  text-decoration: underline;\n" +
"}\n" +
".leonardo-activate > ul {\n" +
"  margin: 0;\n" +
"  flex: 3;\n" +
"  list-style: none;\n" +
"  padding: 5px;\n" +
"}\n" +
".leonardo-activate li {\n" +
"  display: flex;\n" +
"  align-items: center;\n" +
"}\n" +
".leonardo-activate li .leo-expand {\n" +
"  flex: 1;\n" +
"}\n" +
".leonardo-activate li .leo-expand .url {\n" +
"  margin-left: 10px;\n" +
"  font-size: 13px;\n" +
"}\n" +
".leonardo-activate li button {\n" +
"  padding: 5px;\n" +
"  margin-left: 10px;\n" +
"}\n" +
".leonardo-activate h4 {\n" +
"  padding: 0;\n" +
"  display: inline;\n" +
"  font-size: 14px;\n" +
"  font-weight: 600;\n" +
"}\n" +
".leonardo-activate select {\n" +
"  width: 200px;\n" +
"}\n" +
".leonardo-activate select[disabled] {\n" +
"  background: rgba(33, 145, 97, 0.5);\n" +
"}\n" +
".leonardo-recorder {\n" +
"  height: 100%;\n" +
"  display: flex;\n" +
"}\n" +
".leonardo-recorder .leo-list {\n" +
"  flex: 3;\n" +
"  border-right: 1px solid #cccccc;\n" +
"}\n" +
".leonardo-recorder .leo-list ul {\n" +
"  padding: 0;\n" +
"  margin: 0;\n" +
"}\n" +
".leonardo-recorder .leo-list leo-request:nth-child(even) a {\n" +
"  background: #F2F2F2;\n" +
"}\n" +
".leonardo-recorder .leo-list leo-request .leo-list-item {\n" +
"  display: flex;\n" +
"  border-bottom: 1px solid #cccccc;\n" +
"  text-decoration: none;\n" +
"  color: #555;\n" +
"  padding: 5px;\n" +
"  font-size: 13px;\n" +
"}\n" +
".leonardo-recorder .leo-list leo-request .leo-list-item.active {\n" +
"  background-color: #ddd !important;\n" +
"}\n" +
".leonardo-recorder .leo-list leo-request .leo-list-item:hover {\n" +
"  background-color: #f5f5f5;\n" +
"}\n" +
".leonardo-recorder .leo-detail {\n" +
"  flex: 2;\n" +
"  display: flex;\n" +
"  flex-direction: column;\n" +
"}\n" +
".leonardo-recorder .leo-detail .leo-detail-header {\n" +
"  padding: 0 5px;\n" +
"  border-bottom: 1px solid #cccccc;\n" +
"}\n" +
".leonardo-recorder .leo-detail .leo-detail-header > div {\n" +
"  margin-bottom: 10px;\n" +
"}\n" +
".leonardo-recorder .leo-detail input {\n" +
"  border-width: 0 0 1px 0;\n" +
"  outline: none;\n" +
"  font-size: 13px;\n" +
"  margin-left: 5px;\n" +
"  width: 200px;\n" +
"}\n" +
".leonardo-recorder .leo-detail .leo-row-flex {\n" +
"  flex-direction: column;\n" +
"  font-size: 13px;\n" +
"  padding: 20px;\n" +
"  height: 300px;\n" +
"}\n" +
".leonardo-recorder .leo-detail .leo-error {\n" +
"  color: Red;\n" +
"}\n" +
".leonardo-recorder .leo-detail .leo-action-row {\n" +
"  padding: 20px;\n" +
"}\n" +
".leonardo-configure table {\n" +
"  width: 100%;\n" +
"}\n" +
".leonardo-configure table td {\n" +
"  border: 1px solid black;\n" +
"  text-align: center;\n" +
"  vertical-align: middle;\n" +
"}\n" +
".leonardo-configure table th {\n" +
"  border: 1px solid black;\n" +
"}\n" +
".leonardo-configure table td:nth-child(3) {\n" +
"  text-align: left;\n" +
"  vertical-align: middle;\n" +
"}\n" +
".leonardo-test {\n" +
"  padding: 20px;\n" +
"}\n" +
".leonardo-test > div {\n" +
"  display: table;\n" +
"}\n" +
".leonardo-test label,\n" +
".leonardo-test input {\n" +
"  display: table-cell;\n" +
"}\n" +
".leonardo-test input {\n" +
"  padding: 10px;\n" +
"  margin: 0 5px;\n" +
"}\n" +
".leonardo-test textarea {\n" +
"  display: block;\n" +
"  height: 400px;\n" +
"  width: 100%;\n" +
"  margin-top: 20px;\n" +
"}\n" +
".leo-request {\n" +
"  border-radius: 4px;\n" +
"  display: inline-block;\n" +
"  padding: 3px 10px;\n" +
"  float: right;\n" +
"  font-size: small;\n" +
"  margin: 0 2px;\n" +
"  color: white;\n" +
"  justify-content: flex-end;\n" +
"  white-space: nowrap;\n" +
"}\n" +
".leo-request-name {\n" +
"  flex-grow: 1;\n" +
"  white-space: nowrap;\n" +
"  overflow: hidden;\n" +
"  text-overflow: ellipsis;\n" +
"  padding-right: 5px;\n" +
"  line-height: 25px;\n" +
"}\n" +
".leo-request-verb {\n" +
"  margin-right: 10px;\n" +
"  background: #000;\n" +
"  color: #fff;\n" +
"  text-align: center;\n" +
"  width: 80px;\n" +
"  height: 25px;\n" +
"  line-height: 25px;\n" +
"  font-size: 14px;\n" +
"}\n" +
".leo-request-verb.post {\n" +
"  background: orange;\n" +
"}\n" +
".leo-request-verb.get {\n" +
"  background: green;\n" +
"}\n" +
".leo-request-verb.jsonp {\n" +
"  background: green;\n" +
"}\n" +
".leo-request-verb.delete {\n" +
"  background: red;\n" +
"}\n" +
".leo-request-verb.put {\n" +
"  background: blue;\n" +
"}\n" +
".leo-request-new {\n" +
"  background: #3b6aca;\n" +
"}\n" +
".leo-request-mocked {\n" +
"  background: #219161;\n" +
"}\n" +
".leo-request-existing {\n" +
"  background: #f08222;\n" +
"}\n" +
".leo-drop-down {\n" +
"  background: #219161;\n" +
"  color: #fff;\n" +
"  border: 0;\n" +
"  border-radius: 4px;\n" +
"  margin-left: 0;\n" +
"  padding: 4px;\n" +
"  position: relative;\n" +
"  cursor: default;\n" +
"  width: 200px;\n" +
"}\n" +
".leo-drop-down[disabled] {\n" +
"  background: rgba(33, 145, 97, 0.5);\n" +
"}\n" +
".leo-drop-down .leo-drop-down-selected {\n" +
"  padding-left: 5px;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-icon {\n" +
"  float: right;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-items {\n" +
"  z-index: 10;\n" +
"  margin-left: 0;\n" +
"  position: absolute;\n" +
"  left: 0;\n" +
"  border: 1px solid black;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-items .leo-drop-down-item {\n" +
"  display: block;\n" +
"  margin-left: 0;\n" +
"  padding: 2px;\n" +
"  min-width: 200px;\n" +
"  background: #fff;\n" +
"  color: #000;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-items .leo-drop-down-item .leo-delete {\n" +
"  display: inline-block;\n" +
"  cursor: pointer;\n" +
"  float: right;\n" +
"  width: 15px;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-items .leo-drop-down-item:hover {\n" +
"  background: #003399;\n" +
"  color: #fff;\n" +
"}\n" +
".leo-drop-down .leo-drop-down-items .leo-drop-down-item .leo-drop-down-item-name {\n" +
"  padding-left: 4px;\n" +
"  display: inline-block;\n" +
"  margin-left: 0;\n" +
"}\n" +
".edit-state {\n" +
"  transition: width 0.3s;\n" +
"  border-left: 1px solid #ccc;\n" +
"  width: 0px;\n" +
"}\n" +
".edit-state.visible {\n" +
"  width: 300px;\n" +
"}\n" +
".leonardo-edit-option {\n" +
"  padding: 5px;\n" +
"  width: 300px;\n" +
"}\n" +
"leo-state-item {\n" +
"  width: 100%;\n" +
"  display: flex;\n" +
"  align-items: center;\n" +
"}"));
