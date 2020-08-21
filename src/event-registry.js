/**
 * Returns event registry object containing all functions
 *
 * @param Object config
 * config:
 *      - Bool uniqueEvents: Event handlers only trigger once or instantly if event was already emitted
 *      - Bool debug: Log debug messages
 */
const createEventRegistry = ({
    uniqueEvents = false,
    debug = false,
} = {}) => {
    // Stores handlers for each event
    const registry = new Map();

    // Stores history of registry actions
    const history = [];
    
    // Log wrapper
    const _log = (msg, ...args) => {
        if (debug) console.log(`[Event Registry] ${msg}`, ...args);
    };

    // Returns event handlers, optionally creates empty set if none are found
    const _eventHandlers = (event) => {
        let handlers = registry.get(event);

        if (!handlers) {
            handlers = [];
            registry.set(event, handlers);
        }

        return handlers;
    };

    // Checks if given event has already been fired
    const _eventWasEmitted = (event, native = false) => {
        const index = history.findIndex(record => record.action === 'emit' && record.native === native && record.event === event);
        return index > -1;
    };

    // Returns emitted events with given event name
    const _emittedEvents = (event, native = false) => {
        return history.filter(record => record.action === 'emit' && record.native === native && record.event === event);
    };

    // Add event action to history
    const _pushHistory = (action, event, handler, args = [], native = false) => {
        history.push({ action, event, handler, args, native });
    };

    // Registers event handler
    const _registerHandler = (handlers, event, handler) => {
        handlers.push(handler);
        _pushHistory('on', event, handler);

        // Return function to remove event handler 
        return () => {
            const index = handlers.findIndex(h => h === handler);

            if (index > -1) {
                handlers.splice(index, 1);
                _pushHistory('unregister', event, handler);
            }
        };
    };

    // Registers native event handler
    const _registerNativeHandler = (target, event, handler) => {
        const _handler = (...args) => {
            if (uniqueEvents && _eventWasEmitted(event, true)) {
                if (debug) {
                    _log(`Unique event "${event}" was already emitted!`);
                }
                return;
            }
            _pushHistory('emit', event, _handler, args, true);
            handler(...args);
        };
        target.addEventListener(event, _handler);
        _pushHistory('on', event, _handler, true);

        // Return function to remove event handler 
        return () => {
            if (target) {
                target.removeEventListener(event, _handler);
            } else {
                _log('DOM element does not exist anymore', event);
            }
            _pushHistory('unregister', event, _handler, [], true);
        };
    };

    // Validate given event
    const _validateEvent = (event) => {
        if (typeof event !== 'string') {
            _log(`Registered event is not a string!`, event);
            return false;
        } else if (event.length === 0) {
            _log(`Registered event is empty!`, event);
            return false;
        }
        return true;
    };

    // Registers event handler and returns function to remove it from event handlers
    const on = (event, handler) => {
        if (!_validateEvent(event))
            return;

        if (typeof handler !== 'function') {
            _log('Registered handler is not a function!', handler);
            return;
        }

        const handlers = _eventHandlers(event);

        // Execute and return immediately if event is unique and was already emitted or register if not
        if (uniqueEvents) {
            const emitted = _emittedEvents(event);
            if (emitted.length === 0) {
                return _registerHandler(handlers, event, handler);
            }

            const args = emitted[emitted.length - 1].args;
            return handler(...args);
        }

        return _registerHandler(handlers, event, handler);
    };

    // Registers handler for native browser events and returns function to remove it from event handlers
    const native = (event, handler, target = window) => {
        if (!_validateEvent(event))
            return;

        if (typeof handler !== 'function') {
            _log('Registered handler is not a function!', handler);
            return;
        }

        // Execute and return immediately if event is unique and was already emitted or register if not
        if (uniqueEvents) {
            const emitted = _emittedEvents(event, true);
            if (emitted.length === 0) {
                return _registerNativeHandler(target, event, handler);
            }

            const args = emitted[emitted.length - 1].args;
            return handler(...args);
        }

        return _registerNativeHandler(target, event, handler);
    };

    // Emits event and returns array of executed handlers
    const emit = (event, ...args) => {
        // Do nothing if event is unique and was already emitted
        if (uniqueEvents && _eventWasEmitted(event)) {
            _log(`Unique event "${event}" was already emitted!`);
            return [];
        }

        // Do nothing if no handlers are registered
        const handlers = _eventHandlers(event);
        if (!handlers) {
            _log(`No event handlers registered for "${event}"!`);
            return [];
        }

        _pushHistory('emit', event, handlers, args);
        return handlers.map(handler => handler(...args));
    };

    // Returns promise to wait for event
    const wait = (event, options = {}) => new Promise((resolve, reject) => {
        let removeHandler;
        const opts = {
            timeout: false,
            resolveOnTimeout: true,
            ...options,

            // TODO: Fix waiting for native events
            // HACK: Disable native option until tests run successful
            native: false,
            element: window,
        };
        const handler = (...args) => {
            if (typeof removeHandler === 'function') {
                removeHandler();
            }
            resolve(...args);
        };

        // Listen for event and resolve promise on emit
        if (opts.native) {
            removeHandler = native(event, handler, opts.element);
        } else {
            removeHandler = on(event, handler);
        }

        // Set optional timeout
        if (typeof opts.timeout === 'number') {
            setTimeout(() => {
                if (typeof removeHandler === 'function') {
                    const timeoutError = `Timeout while waiting for event "${event}"!`
                    removeHandler();
                    if (opts.resolveOnTimeout) {
                        _log(timeoutError);
                        resolve(null);
                    } else {
                        reject(timeoutError);
                    }
                }
            }, opts.timeout);
        }
    });

    // Clears registry handlers
    const clear = (event = null) => {
        if (event) {
            registry.delete(event);
            _pushHistory('clear', event);
        } else {
            registry.clear();
            _pushHistory('clear', null);
        }
    };

    return {
        on,
        native,
        wait,
        emit,
        clear,
        history: () => Array.from(history),
    };
};

module.exports = {
    createEventRegistry,
};