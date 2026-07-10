# JSON Playground

`/playground.html` is a local-only browser page for trying lineage JSON with the public `lineage-viewer/define` entry point. It loads a registered sample by default and accepts only a registered `?demo=<id>` URL parameter.

The page pairs a native textarea with an interactive preview, diagnostics, recent events, and selected-node details. JSON is parsed with `JSON.parse` after a 350 ms debounce, or immediately with **Run** / Ctrl+Enter / Cmd+Enter. Parse failures are kept separate from viewer schema diagnostics and leave the previous successful graph visible.

Auto-render can be disabled to keep changes unapplied. The toolbar formats, minifies, copies, downloads, clears, resets samples, and imports one local JSON file up to 2 MB. File contents and editor content are never uploaded or persisted: the page does not use localStorage, IndexedDB, cloud storage, or JSON-in-URL sharing.

Run `npm run build:site` to build all static pages, `npm run preview:site` to inspect them, and `npm run screenshot:playground` to refresh the documentation screenshot.
