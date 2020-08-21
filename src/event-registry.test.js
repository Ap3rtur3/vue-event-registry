const jestMock = require('jest-mock');
const { createEventRegistry } = require('./event-registry');

const debug = false;

const simulateClickEvent = (target) => {
    if (target && target.dispatchEvent) {
        target.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));
    } else if (debug) {
        throw Error('Cannot dispatch event on target in simulated click event');
    }
};

const createDOMElement = () => {
    const element = document.createElement('div');
    document.body.appendChild(element);
    return element;
};

describe('Event Registry', () => {
    let on, native, wait, emit, clear, history, handler;

    beforeEach(() => {
        ({ on, native, wait, emit, clear, history } = createEventRegistry({ debug }));
        handler = jestMock.fn();
        jest.useFakeTimers();
    });

    it('provides functions', () => {
        expect(on).toBeDefined();
        expect(native).toBeDefined();
        expect(wait).toBeDefined();
        expect(emit).toBeDefined();
        expect(clear).toBeDefined();
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
        simulateClickEvent(document);
        expect(handler).toHaveBeenCalled();
    });

    it('handles native events with target', () => {
        const target = createDOMElement();
        const miss = createDOMElement();
        const handler2 = jestMock.fn();
        native('click', handler, target);
        native('click', handler2, miss);
        simulateClickEvent(target);
        expect(handler).toHaveBeenCalled();
        expect(handler2).not.toHaveBeenCalled();
    });

    it('handles native unique events', () => {
        const { native } = createEventRegistry({ uniqueEvents: true, debug });
        native('click', handler);
        simulateClickEvent(document);
        simulateClickEvent(document);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it('handles promises', () => {
        const val = 42;
        expect.assertions(1);
        wait('event')
            .then((arg) => {
                expect(arg).toEqual(val);
            });
        emit('event', val);
    });

    it('handles unique promises', () => {
        const { wait, emit } = createEventRegistry({ uniqueEvents: true, debug });
        const val = 42;
        expect.assertions(1);
        emit('event', val);
        wait('event').then(result => {
            expect(result).toEqual(val);
        });
    });

    //it('handles native promises', done => {
    //    const element = createDOMElement();
    //    wait('click', { native: true, element, timeout: 2000, resolveOnTimeout: false })
    //        .then(done)
    //        .catch(() => {
    //            done.fail('Timeout while waiting for native event');
    //        });
    //    setTimeout(() => {
    //        simulateClickEvent(element);
    //    }, 1000);
    //    jest.runAllTimers();
    //});

    it('resolves promise timeout', () => {
        const val = 42, result = null;
        expect.assertions(1);
        wait('event', { timeout: 1000 })
            .then((arg) => {
                expect(arg).toEqual(result);
            });
        setTimeout(() => {
            emit('event', val);
        }, 2000);
        jest.runAllTimers();
    });

    it('rejects promise timeout', done => {
        const resultType = 'string';
        expect.assertions(1);
        wait('event', { timeout: 1000, resolveOnTimeout: false })
            .then(() => {
                done.fail('Promise was resolved instead of being rejected');
            })
            .catch((err) => {
                expect(typeof err).toEqual(resultType);
                done();
            });
        setTimeout(() => {
            emit('event');
        }, 2000);
        jest.runAllTimers();
    });
    
    it('clears single event handler', () => {
        const handler2 = jestMock.fn();
        on('event1', handler);
        on('event2', handler2);
        clear('event1');
        emit('event1');
        emit('event2');
        expect(handler).not.toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });
    
    it('clears all event handlers', () => {
        on('event1', handler);
        on('event2', handler);
        clear();
        emit('event1');
        emit('event2');
        expect(handler).not.toHaveBeenCalled();
    });
});