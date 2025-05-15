// src/empty-shim.js
// everything keys off dynamic-import so this never actually runs in the browser
export default {
    diff:  () => { throw new Error('bsdiff-node is not available in the browser') },
    patch: () => { throw new Error('bsdiff-node is not available in the browser') }
};
