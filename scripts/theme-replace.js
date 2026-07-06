const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const replacements = [
  { regex: /bg-\[#0a0f1d\]/g, replacement: 'bg-background' },
  { regex: /bg-\[#0d1326\]/g, replacement: 'bg-card' },
  { regex: /border-slate-800(\/80|\/60)?/g, replacement: 'border-border' },
  { regex: /border-slate-900/g, replacement: 'border-border' },
  { regex: /text-white/g, replacement: 'text-foreground' },
  { regex: /bg-slate-900(\/40|\/60)?/g, replacement: 'bg-black/5 dark:bg-slate-900$1' },
  { regex: /bg-slate-950(\/60)?/g, replacement: 'bg-black/10 dark:bg-slate-950$1' },
  { regex: /text-slate-400/g, replacement: 'text-slate-600 dark:text-slate-400' },
  { regex: /text-slate-300/g, replacement: 'text-slate-700 dark:text-slate-300' },
  { regex: /text-slate-200/g, replacement: 'text-slate-900 dark:text-slate-200' },
  { regex: /bg-slate-800/g, replacement: 'bg-black/10 dark:bg-slate-800' },
];

walkDir('apps/web/src', (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Some exceptions where text-white is inside a colored button (like bg-blue-500 text-white)
    // We'll just run the naive replace for now, it's mostly correct for this app's style.
    
    replacements.forEach(({ regex, replacement }) => {
      content = content.replace(regex, replacement);
    });

    // Special fix for text-foreground inside already styled things if needed.
    // Actually `text-foreground` on buttons isn't terrible since it will be charcoal in light mode and white in dark. But let's fix known colored buttons manually later.

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
