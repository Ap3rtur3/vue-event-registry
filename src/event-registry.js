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

    // Stores history of registry actions
    const history = [];

    // Returns event handlers, optionally creates empty set if none are found
    const _eventHandlers = (event, failOnMissingEvent = false) => {
        let handlers = registry.get(event);

        if (!handlers) {
            if (failOnMissingEvent) {
                return null;
            }

            handlers = [];
            registry.set(event, handlers);
        }

        return handlers;
    };

    // Checks if given event has already been fired
    const _eventWasEmitted = event => {
        const index = history.findIndex(record => record.action === `emit` && record.event === event);
        return index > -1;
    };

    // Returns emitted events with given event name
    const _emittedEvents = event => {
        return history.filter(record => record.action === `emit` && record.event === event);
    };

    // Registers event handler and returns function to remove it from event handlers
    const on = (event, handler) => {
        // Add handler
        const handlers = _eventHandlers(event);
        handlers.push(handler);
        history.push({
            event,
            handler,
            action: `on`,
        });

        // Execute and return immediately if event is unique and was already emitted
        if (uniqueEvents && _eventWasEmitted(event)) {
            const emitted = _emittedEvents(event);
            const arguments = (emitted.length > 0) ? emitted[emitted.length - 1] : [];
            return handler(...arguments);
        }

        // Return function to remove event handler 
        return () => {
            const index = handlers.findIndex(h => h === handler);

            if (index > -1) {
                handlers.splice(index, 1);
                history.push({
                    event,
                    action: `unregister`,
                });
            }
        };
    };

    // Emits event and returns array of executed handlers
    const emit = (event, ...args) => {
        // Do nothing if event is unique and was already emitted
        if (uniqueEvents && _eventWasEmitted(event)) {
            if (debug) {
                console.log(`[Event Registry] Unique event "${event}" was already emitted!`);
            }
            return [];
        }

        // Do nothing if no handlers are registered
        const handlers = _eventHandlers(event);
        if (!handlers) {
            if (debug) {
                console.log(`[Event Registry] No event handlers registered for "${event}"!`);
            }
            return [];
        }

        history.push({
            event,
            action: `emit`,
            handlers,
            arguments: args,
        });

        return handlers.map(handler => handler(...args));
    };

    return {
        on,
        emit,
        history: () => Array.from(history),
    };
};

module.exports = {
    createEventRegistry,
};