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
    
    // Quick check if file has alert(
    if (content.includes('alert(')) {
      // Replace window.alert( and alert( with toast.error(
      // We will just use toast.error for all since most alerts are error messages
      const newContent = content.replace(/\bwindow\.alert\(/g, 'toast.error(').replace(/\balert\(/g, 'toast.error(');
      
      // If we actually modified something
      if (content !== newContent) {
        let finalContent = newContent;
        // Inject import if not present
        if (!finalContent.includes("import { toast } from 'react-hot-toast'") && !finalContent.includes('import { toast } from "react-hot-toast"')) {
          const importStmt = `import { toast } from "react-hot-toast";\n`;
          
          // Check for "use client" or 'use client'
          if (finalContent.startsWith('"use client"') || finalContent.startsWith("'use client'")) {
            const firstNewLine = finalContent.indexOf('\n');
            finalContent = finalContent.slice(0, firstNewLine + 1) + importStmt + finalContent.slice(firstNewLine + 1);
          } else {
            finalContent = importStmt + finalContent;
          }
        }
        
        fs.writeFileSync(filePath, finalContent, 'utf8');
        console.log(`Modified: ${filePath}`);
        modifiedCount++;
      }
    }
  }
});

console.log(`\nFinished replacing alerts in ${modifiedCount} files.`);
