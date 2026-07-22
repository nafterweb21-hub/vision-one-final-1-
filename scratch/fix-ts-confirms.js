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
    
    // Replace (() => true)( with ((_: any) => true)( to accept the string argument passed to confirm
    let newContent = content.replace(/\(\(\) => true\)\(/g, '((_?: any) => true)(');

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Fixed TS args in: ${filePath}`);
      modifiedCount++;
    }
  }
});

console.log(`\nFinished TS fix in ${modifiedCount} files.`);
