const jestMock = require('jest-mock');
const { createEventRegistry } = require('./event-registry');

const simulateClickEvent = (target = document) => {
    target.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
    }));
};

describe('Event Registry', () => {
    let on, emit, history, native, handler;
    const debug = false;

    beforeEach(() => {
        ({ on, native, emit, history } = createEventRegistry({ debug }));
        handler = jestMock.fn();
    });

    it('provides functions', () => {
        expect(on).toBeDefined();
        expect(emit).toBeDefined();
        expect(history).toBeDefined();
    });

    it('listens for events', () => {
        on('event', handler);
        emit('event');
        expect(handler).toHaveBeenCalled();
    });

    it('executes multiple handlers', () => {
        const handler2 = jestMock.fn();
        on('event', handler);
        on('event', handler2);
        emit('event');
        expect(handler).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });

    it('accepts parameters', done => {
        const arg1 = 1, arg2 = 2;
        expect.assertions(2);
        on('event', (a, b) => {
            expect(a).toEqual(arg1);
            expect(b).toEqual(arg2);
            done();
        });
        emit('event', arg1, arg2);
    });

    it('unregisters handlers', () => {
        const unregister = on('event', handler);
        emit('event');
        unregister();
        emit('event');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles unique events (register -> emit)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true, debug });
        on('event', handler);
        emit('event');
        expect(handler).toHaveBeenCalled();
    });

    it('handles unique events with args (register -> emit)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true, debug });
        const arg1 = 1, arg2 = 2;
        on('event', handler);
        emit('event', arg1, arg2);
        expect(handler).toHaveBeenCalledWith(arg1, arg2);
    });

    it('handles unique events (emit -> register)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true, debug });
        emit('event');
        on('event', handler);
        expect(handler).toHaveBeenCalled();
    });

    it('handles unique events with args (emit -> register)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true, debug });
        const arg1 = 1, arg2 = 2;
        emit('event', arg1, arg2);
        on('event', handler);
        expect(handler).toHaveBeenCalledWith(arg1, arg2);
    });

    it('unique events only emit once', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true, debug });
        on('event', handler);
        emit('event');
        emit('event');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles native events', () => {
        native('click', handler);
        simulateClickEvent();
        expect(handler).toHaveBeenCalled();
    });

    it('handles native events with target', () => {
        const target = document.createElement('div');
        const miss = document.createElement('div');
        const handler2 = jestMock.fn();
        document.body.appendChild(target);
        document.body.appendChild(miss);
        native('click', handler, target);
        native('click', handler2, miss);
        simulateClickEvent(target);
        expect(handler).toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();
    });

    it('handles native unique events', () => {
        const { native } = createEventRegistry({ uniqueEvents: true, debug });
        native('click', handler);
        simulateClickEvent();
        simulateClickEvent();
        expect(handler).toHaveBeenCalledTimes(1);
    });
});