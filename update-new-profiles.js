const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath, replacements);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
      let content = fs.readFileSync(fullPath, 'utf8');
      for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
      }
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

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
const baseApiDir = path.join(__dirname, 'src', 'app', 'api', 'profiles');

const templateDir = path.join(baseDir, 'welding-types');
const templateApiDir = path.join(baseApiDir, 'welding-types');

const paintingDir = path.join(baseDir, 'painting-method');
const paintingApiDir = path.join(baseApiDir, 'painting-method');

const incotermDir = path.join(baseDir, 'incoterm');
const incotermApiDir = path.join(baseApiDir, 'incoterm');

// Copy
copyFolderSync(templateDir, paintingDir);
copyFolderSync(templateApiDir, paintingApiDir);
copyFolderSync(templateDir, incotermDir);
copyFolderSync(templateApiDir, incotermApiDir);

// Rename files
fs.renameSync(
  path.join(paintingDir, 'components', 'WeldingTypeForm.tsx'),
  path.join(paintingDir, 'components', 'PaintingMethodForm.tsx')
);
fs.renameSync(
  path.join(incotermDir, 'components', 'WeldingTypeForm.tsx'),
  path.join(incotermDir, 'components', 'IncotermForm.tsx')
);

// Replace in Painting Method
const paintingReplacements = [
  ['WeldingType', 'PaintingMethodProfile'],
  ['Welding Type', 'Painting Method'],
  ['welding-types', 'painting-method'],
  ['WeldingTypeForm', 'PaintingMethodForm'],
  ['type:', 'method:'],
  ['type:', 'method:'],
  ['!body.type', '!body.method'],
  ['type: body', 'method: body'],
  ['setFormtype', 'setFormMethod'],
  ['formtype', 'formMethod'],
  ['WeldingTypeProfile', 'PaintingMethodProfile'],
  ['welding type', 'painting method']
];

replaceInDir(paintingDir, paintingReplacements);
replaceInDir(paintingApiDir, paintingReplacements);

// Replace in Incoterm
const incotermReplacements = [
  ['WeldingType', 'IncotermProfile'],
  ['Welding Type', 'Incoterm'],
  ['welding-types', 'incoterm'],
  ['WeldingTypeForm', 'IncotermForm'],
  ['type:', 'incoterm:'],
  ['!body.type', '!body.incoterm'],
  ['type: body', 'incoterm: body'],
  ['setFormtype', 'setFormIncoterm'],
  ['formtype', 'formIncoterm'],
  ['WeldingTypeProfile', 'IncotermProfile'],
  ['welding type', 'incoterm']
];

replaceInDir(incotermDir, incotermReplacements);
replaceInDir(incotermApiDir, incotermReplacements);

console.log("Done updating profiles.");
