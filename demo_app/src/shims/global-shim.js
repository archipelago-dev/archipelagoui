// src/shims/global-shim.js
// A tiny shim so `import global from 'global'` works
const g = typeof window !== 'undefined' ? window : {};
export default g;
