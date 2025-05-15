// sync-versions.mjs (ES Module compatible)

import fs from 'fs';
import path from 'path';

const versionFilePath = path.resolve('.', '.version');

if (!fs.existsSync(versionFilePath)) {
    console.error('❌ .version file not found.');
    process.exit(1);
}

const newVersion = fs.readFileSync(versionFilePath, 'utf-8').trim();

if (!newVersion) {
    console.error('❌ .version file is empty.');
    process.exit(1);
}

function updateVersionInPackageJson(filePath) {
    const pkg = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(filePath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✅ Updated ${filePath}`);
}

function processDirectory(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    entries.forEach(entry => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
            processDirectory(fullPath);
        } else if (entry.isFile() && entry.name === 'package.json') {
            updateVersionInPackageJson(fullPath);
        }
    });
}

processDirectory(path.resolve('.'));
console.log(`\n🚀 All versions synchronized to: ${newVersion}`);