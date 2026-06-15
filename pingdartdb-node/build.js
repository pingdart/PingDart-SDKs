/**
 * PingDartDB Node SDK — Build & Obfuscation Script
 * 
 * Usage:
 *   node build.js             → Obfuscates src/ into dist/
 *   node build.js --preview   → Shows a sample of obfuscated output without writing files
 * 
 * Before publishing to npm:
 *   1. Run: node build.js
 *   2. Change package.json "main" to "dist/index.js"
 *   3. Run: npm publish --access public
 */

const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Obfuscation configuration — Maximum protection settings
// ─────────────────────────────────────────────────────────────────────────────
const OBFUSCATOR_OPTIONS = {
    // Core encoding
    compact: true,
    simplify: true,
    
    // String encryption — Hides all string literals inside encoded arrays
    stringArray: true,
    stringArrayEncoding: ['rc4'],          // RC4 encode the string array itself
    stringArrayThreshold: 1,              // 100% of strings go through the array
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayIndexShift: true,
    stringArrayWrappersCount: 5,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 5,
    stringArrayWrappersType: 'function',

    // Control flow — Makes logic structure impossible to read
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.9,  // 90% of blocks flattened

    // Dead code injection — Injects fake logic to confuse reverse engineers
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.5,      // 50% fake code mixed in

    // Identifier renaming — All variable/function names become _0x1a2b3c style
    identifierNamesGenerator: 'hexadecimal',
    renameGlobals: false,                 // Keep module.exports intact for Node.js

    // Number encoding — Hides numeric literals
    numbersToExpressions: true,

    // Source map — Disable entirely (never ship source maps)
    sourceMap: false,

    // Self-defending — Makes the code break if anyone tries to format/prettify it
    selfDefending: true,                  // ⚠️ Code crashes if beautified

    // Debug protection — Disables browser DevTools (extra protection)
    debugProtection: false,               // Keep false for Node.js (not browser)
    disableConsoleOutput: false,          // Keep console.log working for users

    // Transformations
    transformObjectKeys: true,
    unicodeEscapeSequence: false,         // Keep false — breaks Node.js module resolution
};

// ─────────────────────────────────────────────────────────────────────────────
// Files to obfuscate
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_DIR = path.join(__dirname, 'src');
const DIST_DIR   = path.join(__dirname, 'dist');
const ENTRY      = path.join(__dirname, 'index.js');

const SOURCE_FILES = ['PingDartDB.js', 'QueryBuilder.js', 'SchemaBuilder.js'];

// ─────────────────────────────────────────────────────────────────────────────
// Build
// ─────────────────────────────────────────────────────────────────────────────

function obfuscateFile(inputPath, outputPath) {
    const source = fs.readFileSync(inputPath, 'utf8');
    const result = JavaScriptObfuscator.obfuscate(source, OBFUSCATOR_OPTIONS);
    const obfuscated = result.getObfuscatedCode();
    
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, obfuscated, 'utf8');
    
    const inputSize  = (fs.statSync(inputPath).size / 1024).toFixed(1);
    const outputSize = (Buffer.byteLength(obfuscated) / 1024).toFixed(1);
    
    console.log(`  ✅  ${path.basename(inputPath)}`);
    console.log(`       ${inputSize} KB (source)  →  ${outputSize} KB (obfuscated)`);
}

function build() {
    const isPreview = process.argv.includes('--preview');
    
    console.log('\n══════════════════════════════════════════════════');
    console.log('  PingDartDB SDK — Build & Obfuscator');
    console.log('══════════════════════════════════════════════════\n');
    
    if (isPreview) {
        console.log('📋 Preview mode — reading QueryBuilder.js...\n');
        const sample = fs.readFileSync(path.join(SOURCE_DIR, 'QueryBuilder.js'), 'utf8');
        // Only obfuscate first 500 chars for preview speed
        const preview = JavaScriptObfuscator.obfuscate(sample.slice(0, 500), OBFUSCATOR_OPTIONS);
        console.log('Sample output (first 500 chars of QueryBuilder.js):\n');
        console.log(preview.getObfuscatedCode().slice(0, 400) + '...\n');
        return;
    }
    
    // Clean dist/
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
        console.log('🗑️  Cleaned old dist/\n');
    }
    
    console.log('🔒 Obfuscating source files:\n');
    
    // Obfuscate each SDK source file
    for (const filename of SOURCE_FILES) {
        const src = path.join(SOURCE_DIR, filename);
        const dst = path.join(DIST_DIR, filename);
        if (fs.existsSync(src)) {
            obfuscateFile(src, dst);
        } else {
            console.warn(`  ⚠️  Skipped (not found): ${filename}`);
        }
    }
    
    // Copy index.js — update require paths to point to dist/
    console.log('\n📦 Writing dist/index.js...');
    const indexSrc = fs.readFileSync(ENTRY, 'utf8');
    // Replace require('./src/X') → require('./X') for dist
    const indexDist = indexSrc
        .replace(/require\(['"]\.\/src\//g, "require('./")
        .replace(/require\(["']\.\/src\//g, "require('./");
    fs.writeFileSync(path.join(DIST_DIR, 'index.js'), indexDist, 'utf8');
    console.log('  ✅  dist/index.js');
    
    console.log('\n══════════════════════════════════════════════════');
    console.log('  ✅  Build complete! Files are in ./dist/');
    console.log('\n  Next steps to publish:');
    console.log('  1. Set "main": "dist/index.js" in package.json');
    console.log('  2. Add "files": ["dist", "README.md"] to package.json');
    console.log('  3. Run: npm publish --access public');
    console.log('══════════════════════════════════════════════════\n');
}

build();
