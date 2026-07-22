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
    
    // Replace window.confirm and confirm with a function that always returns true.
    // This safely evaluates confirm(...) to (() => true)(...) -> true
    let newContent = content
      .replace(/\bwindow\.confirm\b/g, '(() => true)')
      .replace(/\bconfirm\b/g, '(() => true)');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Replaced confirm in: ${filePath}`);
      modifiedCount++;
    }
  }
});

console.log(`\nFinished bypassing confirms in ${modifiedCount} files.`);
