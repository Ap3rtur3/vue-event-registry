# Vue Event Registry

Simple Vue plugin to register, emit and unregister global event handlers inside vue components.

You can also register handlers for unique events, which get called instantly after registration, 
if the event was already emitted.
It doesn't matter when a component is loaded, its unique event handlers get fired properly.

### Why

The main purpose of this plugin is to handle events between independent application modules or components, 
which get loaded at different times. I wanted a way to handle events from another module, even though they already
have been emitted, that's what the unique event registry is for.

### Features

* Easily add and remove event handlers
* Lightweight (\~ 2kb gzipped)
* Zero dependencies
* Supports asynchronous registration of unique events

## Setup

Install npm plugin

```bash
npm install vue-event-registry
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

```javascript
import VueEventRegistry, { createEventRegistry } from 'vue-event-registry';

// Example: Global registries in window object
window.eventRegistry = createEventRegistry();
window.uniqueEventRegistry = createEventRegistry({ uniqueEvents: true });
```

#### createEventRegistry(options)
Returns newly created event registry
* options: Optional registry config _(Type: Object)_

## Usage

After the setup all vue instances have access to the configured event registries.
With default configuration the registries are accessible from within vue components under 
`this.$events` and `this.$uniqueEvents`.

Both event registries provide following functions:

#### on(event, handler)
Registers event handler and returns function to unregister it
* event: Name of event _(Type: String)_
* handler: Event handler _(Type: Function)_

#### emit(event, ...args)
Emits event and executes registered handlers
* event: Name of event _(Type: String)_
* args: Optional arguments which get passed to event handler

#### history()
Returns array of all registry interactions

## Examples

##### Listen for events 

Register event handlers.

```javascript
export default {
    created() {
        // Register event handler
        this.$events.on('img:loaded', () => {
            // do stuff
        });
        
        // Register event handler whith parameters
        this.$events.on('error', (err) => {
            // handle error
        });
    }
}
```

##### Emit events 

Emit events and optionally pass parameters to event handlers.

```javascript
export default {
    created() {
        fetch('https://example.com/img').then(() => {
            this.$events.emit('img:loaded');
        }).catch((err) => {
            this.$events.emit('error', err);
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

Unique events will be persisted until the page is reloaded and a new vue root instance is created.

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

* More examples, Clarify use cases
* Typescript definitions
* More tests