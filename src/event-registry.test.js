const jestMock = require('jest-mock');
const { createEventRegistry } = require('./event-registry');

describe('Event Registry', () => {
    let on, emit, history;

    beforeEach(() => {
        ({ on, emit, history } = createEventRegistry());
    });

    it('provides functions', () => {
        expect(on).toBeDefined();
        expect(emit).toBeDefined();
        expect(history).toBeDefined();
    });

    it('listens for events', () => {
        const handler = jestMock.fn();
        on('event', handler);
        emit('event');
        expect(handler).toHaveBeenCalled();
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

    it('unique events only emit once', () => {
        const unique = createEventRegistry({ uniqueEvents: true });
        const { on, emit } = unique;
        const handler1 = jestMock.fn();
        const handler2 = jestMock.fn();

        emit('event');
        on('event', handler1);
        on('event', handler2);
        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });

    it('handles unique events (register -> emit)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true });
        const handler = jestMock.fn();

        on('event', handler);
        emit('event');
        expect(handler).toHaveBeenCalled();
    });

    it('handles unique events (emit -> register)', () => {
        const { on, emit } = createEventRegistry({ uniqueEvents: true });
        const handler = jestMock.fn();

        emit('event');
        on('event', handler);
        expect(handler).toHaveBeenCalled();
    });

    it('unregisters handlers', () => {
        const handler = jestMock.fn();
        const unregister = on('event', handler);
        emit('event');
        unregister();
        emit('event');
        expect(handler).toHaveBeenCalledTimes(1);
    });
});