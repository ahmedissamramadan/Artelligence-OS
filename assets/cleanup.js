const fs = require('fs');
const path = require('path');
const downloadsDir = '/Users/ahmedissamramadan/Downloads';
const destBase = path.join(downloadsDir, 'Artelligence OS');

const folders = {
  Solara: ['solara', 'reel', 'fashion'],
  Tohamy: ['tohamy', 'تشطيب', 'فيلا'],
  Upwork: ['upwork', 'proposal', 'catalog']
};

console.log(`[Artelligence CleanUp Daemon] Sweeping downloads folder at ${new Date().toISOString()}...`);

try {
  // Create destination folders if not exist
  if (!fs.existsSync(destBase)) fs.mkdirSync(destBase, { recursive: true });
  Object.keys(folders).forEach(f => {
    const p = path.join(destBase, f);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  const files = fs.readdirSync(downloadsDir);
  let movedCount = 0;

  files.forEach(file => {
    const filePath = path.join(downloadsDir, file);
    if (fs.statSync(filePath).isDirectory() || file.startsWith('.')) return;

    const fileLower = file.toLowerCase();
    let destinationFolder = null;
    for (const [folderName, keywords] of Object.entries(folders)) {
      const matches = keywords.some(keyword => fileLower.includes(keyword));
      if (matches) {
        destinationFolder = folderName;
        break;
      }
    }

    if (destinationFolder) {
      const targetPath = path.join(destBase, destinationFolder, file);
      let finalTargetPath = targetPath;
      if (fs.existsSync(targetPath)) {
        const ext = path.extname(file);
        const base = path.basename(file, ext);
        finalTargetPath = path.join(destBase, destinationFolder, `${base}_${Date.now()}${ext}`);
      }
      fs.renameSync(filePath, finalTargetPath);
      movedCount++;
      console.log(`Moved: ${file} -> ${destinationFolder}`);
    }
  });

  console.log(`[Artelligence CleanUp Daemon] Success. Sorted ${movedCount} files.`);
} catch (e) {
  console.error(`[Artelligence CleanUp Daemon] Error during sweep:`, e.message);
}
