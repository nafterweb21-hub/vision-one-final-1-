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
    
    // Check if the file has our recently injected import
    if (content.includes('import { toast } from "react-hot-toast"')) {
      // Replace the import
      let newContent = content.replace(
        'import { toast } from "react-hot-toast"', 
        'import { toast as hotToast } from "react-hot-toast"'
      );
      
      // Replace toast.error with hotToast.error
      newContent = newContent.replace(/\btoast\.error\(/g, 'hotToast.error(');
      
      if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Fixed: ${filePath}`);
        modifiedCount++;
      }
    }
  }
});

console.log(`\nFinished fixing toast shadowing in ${modifiedCount} files.`);
