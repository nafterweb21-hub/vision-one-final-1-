const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath, replacements);
    } else if (stat.isFile() && fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
      }
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

// 1. Copy folders
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isFile()) {
      fs.copyFileSync(fromPath, toPath);
    } else {
      copyFolderSync(fromPath, toPath);
    }
  });
}

const baseDir = path.join(__dirname, 'src', 'app', 'dashboard', 'profiles');
const materialDir = path.join(baseDir, 'material-types');
const weldingDir = path.join(baseDir, 'welding-types');
const jointDir = path.join(baseDir, 'joint-profiles');

// Copy
copyFolderSync(materialDir, weldingDir);
copyFolderSync(materialDir, jointDir);

// Rename component files
fs.renameSync(
  path.join(weldingDir, 'components', 'MaterialTypeForm.tsx'),
  path.join(weldingDir, 'components', 'WeldingTypeForm.tsx')
);
fs.renameSync(
  path.join(jointDir, 'components', 'MaterialTypeForm.tsx'),
  path.join(jointDir, 'components', 'JointProfileForm.tsx')
);

// Replace in welding-types
replaceInDir(weldingDir, [
  ['MaterialType', 'WeldingType'],
  ['Material Type', 'Welding Type'],
  ['material-types', 'welding-types'],
  ['material categories', 'welding types'],
  ['categories', 'types'],
  ['Category', 'Type']
]);

// Replace in joint-profiles
replaceInDir(jointDir, [
  ['MaterialType', 'JointProfile'],
  ['Material Type', 'Joint Profile'],
  ['material-types', 'joint-profiles'],
  ['material categories', 'joint profiles'],
  ['categories', 'profiles'],
  ['type', 'joint'],
  ['Type', 'Joint'],
  ['Category', 'Profile']
]);

console.log("Done updating files.");
