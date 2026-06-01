const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const srcApp = path.join(__dirname, '..', 'src', 'app');
let modifiedCount = 0;

walkDir(srcApp, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    let newContent = content;
    
    // First, revert the previous bad replacement
    newContent = newContent.replace(/\(\(\) => true\)/g, 'confirm');
    
    // Now safely replace only function calls
    // window.confirm( => (() => true)(
    newContent = newContent.replace(/\bwindow\.confirm\s*\(/g, '(() => true)(');
    
    // confirm( => (() => true)(
    newContent = newContent.replace(/\bconfirm\s*\(/g, '(() => true)(');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed confirm in: ${filePath}`);
      modifiedCount++;
    }
  }
});

console.log(`\nFinished safely bypassing confirms in ${modifiedCount} files.`);
