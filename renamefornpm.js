// renamefornpm.js (ES Module compatible)

import fs from 'fs';
import path from 'path';

const directoryPath = path.resolve('.'); // current directory
const oldName = /@archipelagoui/g;
const newName = '@archipelagouiui';

function replaceInFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const updatedContent = fileContent.replace(oldName, newName);

    if (fileContent !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf-8');
        console.log(`Updated: ${filePath}`);
    }
}

function processDirectory(directory) {
    const entries = fs.readdirSync(directory, { withFileTypes: true });

    entries.forEach(entry => {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory() && !entry.name.includes('node_modules') && !entry.name.includes('.git')) {
            processDirectory(fullPath);
        } else if (entry.isFile() && fullPath.match(/\.(js|jsx|ts|tsx|json|html|md)$/)) {
            replaceInFile(fullPath);
        }
    });
}

processDirectory(directoryPath);
console.log('Rename operation complete!');
