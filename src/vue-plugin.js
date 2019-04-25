import { createEventRegistry } from './event-registry';

const defaultName = '$events';
const defaultUniqueName = '$uniqueEvents';

const EventRegistryPlugin = {
    install(Vue, options = {}) {
        const { name, uniqueName } = options;

        if (typeof name === 'string') {
            Vue.prototype[name] = createEventRegistry();
        } else if (name !== false) {
            Vue.prototype[defaultName] = createEventRegistry();
        }

        if (typeof uniqueName === 'string') {
            Vue.prototype[uniqueName] = createEventRegistry({ uniqueEvents: true });
        } else if (uniqueName !== false) {
            Vue.prototype[defaultUniqueName] = createEventRegistry({ uniqueEvents: true });
        }
    },
};

export default EventRegistryPlugin;
