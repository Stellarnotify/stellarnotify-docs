const fs = require('fs');
const path = require('path');

// Find and patch Docusaurus bundler to disable webpackbar
const bundlerPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@docusaurus',
  'bundler',
  'lib',
  'webpack',
  'plugins.js'
);

if (!fs.existsSync(bundlerPath)) {
  console.log('Bundler plugins file not found, trying alternative paths...');
  
  // Try to find any file that imports webpackbar
  const searchPaths = [
    'node_modules/@docusaurus/core/lib',
    'node_modules/@docusaurus/bundler/lib'
  ];
  
  // Instead, let's just override webpackbar's constructor directly
  const webpackbarIndexPath = path.join(__dirname, '..', 'node_modules', 'webpackbar', 'dist', 'index.cjs');
  
  if (!fs.existsSync(webpackbarIndexPath)) {
    console.log('Webpackbar not found, exiting');
    process.exit(0);
  }
  
  let content = fs.readFileSync(webpackbarIndexPath, 'utf8');
  
  // Replace the constructor's super call to use only valid options
  content = content.replace(
    'super({ activeModules: true });',
    'super({ activeModules: false, modules: false }); // Patched to prevent webpack errors'
  );
  
  // Also patch the constructor to not store incompatible options
  content = content.replace(
    'this.options = Object.assign({}, DEFAULTS, options);',
    'this.options = Object.assign({}, DEFAULTS, options); this._patchedOptions = { activeModules: false };'
  );
  
  fs.writeFileSync(webpackbarIndexPath, content, 'utf8');
  console.log('Successfully patched webpackbar constructor!');
  process.exit(0);
}

console.log('Found bundler at:', bundlerPath);
let content = fs.readFileSync(bundlerPath, 'utf8');

// Disable webpackbar plugin
const originalContent = content;
content = content.replace(/new\s+WebpackBar\([^)]*\)/g, '/* WebpackBar disabled */');

if (content === originalContent) {
  console.log('Pattern not found in bundler plugins');
} else {
  fs.writeFileSync(bundlerPath, content, 'utf8');
  console.log('Successfully disabled WebpackBar plugin!');
}
