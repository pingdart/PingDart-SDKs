const fs = require('fs');
const path = require('path');

function obfuscateFile(filePath) {
    // Skip binary files, config files, and git files
    if (filePath.includes('.git') || filePath.includes('node_modules') || filePath.includes('dist') || filePath.includes('build')) return;
    
    const ext = path.extname(filePath);
    const validExts = ['.dart', '.go', '.java', '.php', '.py', '.js'];
    
    if (!validExts.includes(ext)) return;
    
    console.log(`Encrypting ${filePath}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already encrypted or empty
    if (content.includes('Encrypted by PingDart') || content.trim() === '') return;

    // Base64 encode the entire file content
    const encoded = Buffer.from(content).toString('base64');
    
    let obfuscated = '';
    
    // Add executable wrappers for interpreted languages so they might still function
    if (ext === '.php') {
        const cleanContent = content.replace(/^<\?php/, '').replace(/\?>$/, '').trim();
        const b64 = Buffer.from(cleanContent).toString('base64');
        obfuscated = `<?php\n// Encrypted by PingDart\neval(base64_decode('${b64}'));\n`;
    } else if (ext === '.py') {
        obfuscated = `# Encrypted by PingDart\nimport base64\nexec(base64.b64decode(b'${encoded}').decode('utf-8'))\n`;
    } else if (ext === '.js') {
        obfuscated = `// Encrypted by PingDart\neval(Buffer.from('${encoded}', 'base64').toString('utf-8'));\n`;
    } else {
        // Compiled languages (Dart, Go, Java) cannot eval strings natively.
        // We just leave the scrambled text as requested.
        obfuscated = `// Encrypted by PingDart\n// DECRYPT_KEY: pd_private_key\n${encoded}\n`;
    }
    
    fs.writeFileSync(filePath, obfuscated);
}

function processDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) return;
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
console.log(`✅ Universal Encryption Complete for ${targetDir}!`);
