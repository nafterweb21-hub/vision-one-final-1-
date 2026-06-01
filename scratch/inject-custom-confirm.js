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
    
    // Check if it contains the mock confirm we inserted earlier
    if (content.includes('((_?: any) => true)(')) {
      
      // Inject the import at the top (after 'use client' if present)
      const importStmt = `import { customConfirm } from "@/lib/customConfirm";\n`;
      let finalContent = content;
      
      if (!finalContent.includes('import { customConfirm }')) {
        if (finalContent.startsWith('"use client"') || finalContent.startsWith("'use client'")) {
          const firstNewLine = finalContent.indexOf('\n');
          finalContent = finalContent.slice(0, firstNewLine + 1) + importStmt + finalContent.slice(firstNewLine + 1);
        } else {
          finalContent = importStmt + finalContent;
        }
      }
      
      // Replace the mock confirm with await customConfirm(
      // We wrap the await in parenthesis just in case: `(await customConfirm(`
      // And we need to add a closing parenthesis.
      // But adding a closing parenthesis with regex is tricky if there are nested parentheses in the string.
      // Actually, since `!await customConfirm(...)` is valid JS, let's just use `await customConfirm(`.
      
      // However, if the original was `if (((_?: any) => true)("..."))`, replacing with `await customConfirm(` gives `if (await customConfirm("..."))`.
      finalContent = finalContent.replace(/\(\(_\?: any\) => true\)\(/g, 'await customConfirm(');
      
      // Now, what if the surrounding function isn't async?
      // For instance: `function onDelete() {` -> `async function onDelete() {`
      // Or `const onDelete = () => {` -> `const onDelete = async () => {`
      // Since it's hard to accurately find the enclosing function with regex, 
      // we'll rely on the TypeScript compiler to tell us which functions need `async`,
      // or we can try a best-effort replacement for common patterns.
      // Often, handlers are `const handleDelete = (id) =>` or `function onVoid()`.
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`Injected customConfirm in: ${filePath}`);
      modifiedCount++;
    }
  }
});

console.log(`\nFinished injecting customConfirm in ${modifiedCount} files.`);
