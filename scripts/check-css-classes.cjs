/**
 * Verificador de clases CSS — versión que resuelve @import
 */
const fs = require('fs');
const path = require('path');

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.')) continue;
      walk(path.join(dir, e.name), files);
    } else if (e.name.endsWith('.jsx') || e.name.endsWith('.js')) {
      files.push(path.join(dir, e.name));
    }
  }
  return files;
}

const ROOT = path.resolve(__dirname, '..');
const files = walk(path.join(ROOT, 'src'));

// Cache de clases CSS por archivo
const classCache = {};

function getDefinedClasses(cssFile) {
  if (classCache[cssFile]) return classCache[cssFile];
  
  if (!fs.existsSync(cssFile)) {
    classCache[cssFile] = new Set();
    return classCache[cssFile];
  }
  
  const content = fs.readFileSync(cssFile, 'utf-8');
  const classes = new Set();
  
  // Resolver @import
  const importRegex = /@import\s+['"]\.\/(.+?\.module\.css)['"]/g;
  let m;
  while ((m = importRegex.exec(content)) !== null) {
    const importedFile = path.resolve(path.dirname(cssFile), m[1]);
    const imported = getDefinedClasses(importedFile);
    imported.forEach(c => classes.add(c));
  }
  
  // Extraer clases CSS
  const patterns = [
    /\.([a-zA-Z]\w*)\s*[{,]/g,
    /\.([a-zA-Z]\w*)\s*:/g,
    /\.([a-zA-Z]\w*)\./g,
    /\.([a-zA-Z]\w*)[\s)]/g,
    /&\.([a-zA-Z]\w*)/g,
  ];
  
  for (const pattern of patterns) {
    while ((m = pattern.exec(content)) !== null) {
      classes.add(m[1]);
    }
  }
  
  classCache[cssFile] = classes;
  return classes;
}

let totalMissing = 0;
const results = [];

for (const absPath of files) {
  const content = fs.readFileSync(absPath, 'utf-8');
  const styleImport = content.match(/import\s+styles\s+from\s+['"](\..+?\.module\.css)['"]/);
  if (!styleImport) continue;

  const cssFile = path.resolve(path.dirname(absPath), styleImport[1]);
  if (!fs.existsSync(cssFile)) {
    console.log(`❌ ${path.relative(ROOT, absPath)}: CSS not found: ${styleImport[1]}`);
    continue;
  }

  const definedClasses = getDefinedClasses(cssFile);
  
  const usedClasses = new Set();
  const regex = /styles\.([a-zA-Z]\w*)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    usedClasses.add(match[1]);
  }

  if (usedClasses.size === 0) continue;

  const missing = [];
  for (const cls of usedClasses) {
    if (!definedClasses.has(cls)) {
      missing.push(cls);
    }
  }

  if (missing.length > 0) {
    totalMissing += missing.length;
    results.push({ file: path.relative(ROOT, absPath), missing });
    console.log(`\n❌ ${path.relative(ROOT, absPath)}`);
    console.log(`   Missing (${missing.length}): ${missing.join(', ')}`);
  }
}

console.log(`\n\n========================================`);
console.log(`Files with missing classes: ${results.length}`);
console.log(`Total missing classes: ${totalMissing}`);
if (results.length === 0) {
  console.log('\n✅ ALL GOOD - No missing classes found!');
} else {
  console.log('\n❌ Files to fix:');
  for (const r of results) {
    console.log(`  ${r.file}: ${r.missing.length} classes missing`);
  }
}
