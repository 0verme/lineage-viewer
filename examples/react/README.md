# React example

This example shows how to mount `lineage-viewer` from React without a framework adapter.

Create a Vite React TypeScript app, install `lineage-viewer@alpha`, and copy `main.tsx` into the app's `src/` directory:

```sh
npm create vite@latest lineage-react-demo -- --template react-ts
cd lineage-react-demo
npm install lineage-viewer@alpha
```

The example uses a ref and the Web Component's public properties, so it works with React 18 and React 19.
