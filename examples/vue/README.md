# Vue example

This example shows how to mount `lineage-viewer` from Vue without a framework adapter.

Create a Vite Vue TypeScript app, install `lineage-viewer@alpha`, and copy `App.vue` into the app:

```sh
npm create vite@latest lineage-vue-demo -- --template vue-ts
cd lineage-vue-demo
npm install lineage-viewer@alpha
```

The example uses a template ref and the Web Component's public properties. No `isCustomElement` compiler option is required.
