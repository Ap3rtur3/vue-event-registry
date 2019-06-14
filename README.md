# Vue Event Registry

Simple Vue plugin to easily register, emit and unregister global event handlers inside vue components.

You can also register handlers for unique events, which get called instantly after registration, 
if the event was already emitted. Unique events only get emitted once.
It doesn't matter when a component is loaded, its unique event handlers get fired properly.

Native document events do not execute event handlers registered with `on()`.
Use `native()` to register event handlers for document events like "click" for example.

### Why

The main purpose of this plugin is to handle events between independent application modules or components, 
which get loaded at different times. I wanted a way to handle events from another module, even though they already
have been emitted, that's what the unique event registry is for.

Another core functionality is the way event handlers get removed by calling the remove function, 
which gets returned by registering an event handler.

### Features

* Add and remove event handlers
* Promises 
* Asynchronous registration of unique events
* Native document events
* Lightweight (\~ 2kb)
* Zero dependencies

## Setup

Install with npm:

```bash
npm install --save vue-event-registry
```

Alternatively install with yarn:

```bash
yarn add vue-event-registry
```

Use plugin in Vue

```javascript
import Vue from 'vue';
import VueEventRegistry from 'vue-event-registry';

Vue.use(VueEventRegistry);

new Vue().$mount('#app')
```

#### Plugin options

The property names of both event registries can be customized. 
Registries will not be created and added to vue, if `false` is given instead of a string.

```javascript
// Example with custom event registry names
Vue.use(VueEventRegistry, {
    name: '$userEvents',
    uniqueName: '$achievements',
});
```

#### Custom event registries

You can create more event registries, by importing the factory function.
These registries do not depend on Vue and can be used wherever you want.

```javascript
import VueEventRegistry, { createEventRegistry } from 'vue-event-registry';

// Example: Global registries in window object
window.eventRegistry = createEventRegistry();
window.uniqueEventRegistry = createEventRegistry({ uniqueEvents: true });
```

#### createEventRegistry([options])
Returns newly created event registry

|Parameter|Type|Default|Description|
|---|---|---|---|
|options|object||Optional event registry config|
|options.debug|boolean|false|Enables debug messages|
|options.uniqueEvents|boolean|false|Creates registry for unique events|

## Usage

After the setup all vue instances have access to the configured event registries.
With default configuration the registries are accessible from within vue components under 
`this.$events` and `this.$uniqueEvents`.

##### An Event registry provides following functions:

#### on(event, handler)
Registers event handler for custom events and returns function to unregister it

|Parameter|Type|Default|Description|
|---|---|---|---|
|event|string|_required_|Name of event|
|handler|function|_required_|Event handler|

#### wait(event[, options])
Returns promise to wait for given event registered with `on()`

|Parameter|Type|Default|Description|
|---|---|---|---|
|event|string|_required_|Name of event|
|options|object||Waiting options|
|options.timeout|number \| boolean|false|Time in milliseconds until promise settles, disable with `false`|
|options.resolveOnTimeout|boolean|true|Controls wether promise is resolved or rejected on timeout|

#### native(event, handler[, target])
Registers event handler for native events and returns function to unregister it

|Parameter|Type|Default|Description|
|---|---|---|---|
|event|string|_required_|Name of event|
|handler|function|_required_|Event handler|
|target|EventTarget|window|Optional event target, needs `addEventListener()` method|

**Note:** Use `document.dispatchEvent()` to emit registered events.
If the event target should get removed from the DOM, then its event handlers get removed as well.

#### emit(event[, ...args])
Emits event, executes registered handlers and returns array of executed handlers

|Parameter|Type|Default|Description|
|---|---|---|---|
|event|string|_required_|Name of event|
|args|arguments||Optional arguments which get passed to event handler|

#### history()
Returns array of all registry interactions

## Examples

##### Listen for events 

Register event handlers.

```javascript
export default {
    created() {
        // Register handler after async image loading is complete
        this.$events.on('image:loaded', (image, error) => {
            if (error) {
                // Handle error
            } else {
                // Do stuff
            }
        });
    }
}
```

##### Emit events 

Emit events and optionally pass parameters to event handlers.

```javascript
export default {
    created() {
        fetch('https://example.com/img').then((image) => {
            this.$events.emit('image:loaded', image);
        }).catch((error) => {
            this.$events.emit('image:loaded', null, error);
        });
    }
}
```

##### Remove event handlers

Remove event handlers by calling the function returned by `on()`.
If you do not call this function, then event handlers will get executed, even if the component is already destroyed.

```javascript
export default {
    created() {
        this.removeHandler = this.$events.on('user:clicked', () => {});
    },
    destroyed() {
        this.removeHandler();
    }
}
```

##### Unique events

Unique events can only be emitted once until the page is reloaded and a new vue root instance is created.

```javascript
export default {
    created() {
        this.$uniqueEvents.on('user:accepted-cookies', () => {});
    }
}
```

```html
<template>
    <button @click="$uniqueEvents.emit('user:accepted-cookies')">
        Accept cookies
    </button>
</template>
```

##### Wait for events

The function `wait()` will return a promise to wait until the event was emitted.
In this example component A will stop execution until component B was created.
Component C will wait for both A and B, or continue without them if the promise timed out.

```javascript
// Component A
export default {
    async created() {
        await this.$uniqueEvents.wait('b:created');
        this.$uniqueEvents.emit('a:created');
    }
}
```
```javascript
// Component B
export default {
    created() {
        this.$uniqueEvents.emit('b:created');
    }
}
```
```javascript
// Component C
export default {
    async created() {
        await Promise.all([
            this.$uniqueEvents.wait('a:created', { timeout: 2000 }),
            this.$uniqueEvents.wait('b:created', { timeout: 2000 }),
        ]);
        this.$uniqueEvents.emit('c:created');
    }
}
```

##### Native event handlers

Register native document events with `native()`. 
These get emitted by document events, not the `emit()` function.
If you want to trigger those events yourself, use `document.dispatchEvent()`.

```javascript
export default {
    created() {
        // Listen for general click event
        this.removeClickHandler = this.$events.native('click', () => {});
        // Listen for mouseover on dom element 
        const element = document.getElementById('your-id');
        this.removeMouseoverHandler = this.$events.native('mouseover', () => {}, element);
    },
    destroyed() {
        this.removeClickHandler();
        this.removeMouseoverHandler();
    }
}
```

## Development 

If you want to contribute, then fork and checkout the repository.
Navigate to local files and install dev dependencies:

```bash
npm install
```

[Jest](https://jestjs.io/docs/en/getting-started) is used as testing framework.
Create tests for each functionality and run them with:

```bash
npm run test
```

Push your changes to a feature branch and create a pull request.

## Todo 

* More tests
* More examples / use cases

## License

MIT