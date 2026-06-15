const fs = require('fs');
const path = require('path');

function obfuscateFile(filePath) {
    if (!filePath.endsWith('.php')) return;
    
    console.log(`Obfuscating ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if already obfuscated or empty
    if (content.includes('eval(base64_decode') || content.trim() === '') return;

    // Remove opening <?php and closing ?>
    let code = content.replace(/^<\?php/, '').replace(/\?>$/, '').trim();
    
    // Base64 encode the code
    const encoded = Buffer.from(code).toString('base64');
    
    // Wrap in eval
    const obfuscated = `<?php\n// Encrypted by PingDart\neval(base64_decode('${encoded}'));\n`;
    
    fs.writeFileSync(filePath, obfuscated);
}

function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else {
            obfuscateFile(fullPath);
        }
    }
}

const targetDir = process.argv[2];
if (!targetDir) {
    console.error("Please provide a target directory.");
    process.exit(1);
}

processDirectory(targetDir);
console.log("✅ PHP Obfuscation Complete!");
