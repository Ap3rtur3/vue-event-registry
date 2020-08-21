type RemoveEventListenerCallback = () => void;
type ErrorMessage = string;

export default interface EventRegistryPlugin {
    name?: string;
    uniqueName?: string;
}

interface EventRegistryFactory {
    uniqueEvents?: boolean;
    debug?: boolean;
}

interface WaitOptions {
    timeout?: number|boolean;
    resolveOnTimeout?: boolean;
}

export interface EventRegistry {
    on(event: string, handler: Function): RemoveEventListenerCallback;
    native(event: string, handler: Function, target?: EventTarget): RemoveEventListenerCallback;
    wait(event: string, options?: WaitOptions): Promise<any | ErrorMessage>;
    emit(event: string, ...args: any): Array<any>;
    clear(event?: string): void;
    history(): Array<object>;
}

export declare function createEventRegistry(options?: EventRegistryFactory): EventRegistry;


