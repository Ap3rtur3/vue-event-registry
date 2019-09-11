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

export interface EventRegistry {
    on(event: string, handler: Function): RemoveEventListenerCallback;
    native(event: string, handler: Function, target?: EventTarget): RemoveEventListenerCallback;
    wait(event: string, handler: Function): Promise<any | ErrorMessage>;
    emit(event: string, ...args: any): Array<any>;
    history(): Array<object>;
}

export function createEventRegistry(options?: EventRegistryFactory): EventRegistry;


