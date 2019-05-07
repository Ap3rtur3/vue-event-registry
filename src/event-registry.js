/**
 * Returns event registry object containing the functions on, emit and history
 *
 * @param Object config
 * config:
 *      - Bool uniqueEvents: Event handlers only trigger once or instantly if event was already emitted
 */
const createEventRegistry = ({
    uniqueEvents = false,
    debug = false,
} = {}) => {
    // Stores handlers for each event
    const registry = new Map();

    // Stores registered native events and functions to unregister them
    const nativeEvents = new Map();

    // Stores history of registry actions
    const history = [];

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
                _pushHistory('unregister', event, handler)
            }
        };
    };

    // Registers native event handler
    const _registerNativeHandler = (target, event, handler) => {
        const _handler = (...args) => {
            if (uniqueEvents && _eventWasEmitted(event, true)) {
                if (debug) {
                    log(`Unique event "${event}" was already emitted!`);
                }
                return;
            }
            _pushHistory('emit', event, _handler, args, true);
            handler(...args);
        };
        target.addEventListener(event, _handler);
        _pushHistory('on', event, _handler, true)

        // Return function to remove event handler 
        return () => {
            if (target) {
                target.removeEventListener(event, _handler);
                _pushHistory('unregister', event, _handler, [], true);
            }
        };
    };

    // Validate given event
    const _validateEvent = (event) => {
        if (typeof event !== 'string') {
            debug && log(`Registered event is not a string!`, event);
            return false;
        } else if (event.length === 0) {
            debug && log(`Registered event is empty!`, event);
            return false;
        }
        return true;
    };

    // Registers event handler and returns function to remove it from event handlers
    const on = (event, handler) => {
        if (!_validateEvent(event))
            return;

        if (typeof handler !== 'function') {
            debug && log('Registered handler is not a function!', handler);
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
            debug && log('Registered handler is not a function!', handler);
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
            if (debug) {
                log(`Unique event "${event}" was already emitted!`);
            }
            return [];
        }
        
        // Do nothing if no handlers are registered
        const handlers = _eventHandlers(event);
        if (!handlers) {
            if (debug) {
                log(`No event handlers registered for "${event}"!`);
            }
            return [];
        }
        
        _pushHistory('emit', event, handlers, args);
        return handlers.map(handler => handler(...args));
    };

    return {
        on,
        native,
        emit,
        history: () => Array.from(history),
    };
};

const log = (msg, ...args) => {
    console.log(`[Event Registry] ${msg}`, ...args);
};

module.exports = {
    createEventRegistry,
};