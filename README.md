# Vue Event Registry

Simple Vue plugin to register, emit and unregister global event handlers inside vue components.

You can also register handlers for unique events, which get called instantly after registration, 
if the event was already emitted.
It doesn't matter when a component is loaded, its unique event handlers get fired properly.

### Features

* Easily add and remove event handlers
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
Registries will not be added to vue if `false` is given instead of a string.

```javascript
Vue.use(VueEventRegistry, {
    name: '$userEvents',
    uniqueName: '$daytimeEvents',
});
```

## Usage

After the setup all vue instances have access to the configured event registries.
With default configuration the registries are accessible from within vue components under 
`this.$events` and `this.$uniqueEvents`.

Both event registries provide following functions:

#### on(event, handler)
Registers event handler and returns function to unregister it
* event: Name of event to listen for _(Type: String, Default: '$events')_
* handler: Event handler _(Type: Function)_

#### emit(event, ...args)
Emits event and executes registered handlers
* event: Name of event _(Type: String)_
* args: Optional arguments passed to event handler

#### history()
Returns array of all registry interactions

## Examples

##### Listen for events 

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

Please create tests for each functionality and run them with:

```bash
npm run test
```