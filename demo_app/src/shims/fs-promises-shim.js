// src/shims/fs-promises-shim.js

// we only stub out the methods your client code actually calls.
// You can expand this list if you need more.

export async function readFile(_path, _options) {
    throw new Error('fs.promises.readFile is not available in the browser');
}

export async function writeFile(_path, _data, _opts) {
    throw new Error('fs.promises.writeFile is not available in the browser');
}

export async function stat(_path) {
    return { isFile: () => false, isDirectory: () => false, size: 0, mtimeMs: 0 };
}

export async function readdir(_path, _opts) {
    return [];
}

export async function mkdir(_path, _opts) {
    // no-op
}

export async function rm(_path, _opts) {
    // no-op
}

export async function access(_path, _mode) {
    return; // no-op
}

// …and so on for any other fs.promises methods your code uses.
export async function copyFile(_src, _dest) {

}
export async function unlink(_path) {

}
export async function symlink(_src, _dest) {

}
export async function chmod(_path, _mode) {

}
export async function lstat(_path) {
    return { isFile: () => false, isDirectory: () => false, size: 0, mtimeMs: 0 };
}
export async function rmdir(_path) {

}
export async function rename(_oldPath, _newPath) {

}
export async function open(_path, _flags, _mode) {

}

export async function utimes(_path, _atime, _mtime) {

}

export async function realpath(_path) {
    return _path;
}