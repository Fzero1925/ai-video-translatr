#!/usr/bin/env node
/**
 * Master Generator - Pre-Market Brief
 * Generates all pages: main, SEO pages, crypto, RSS, sitemap, archive
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Pre-Market Brief Master Generator\n');

const scripts = [
    { name: 'Main Brief', file: 'generate.js' },
    { name: 'SEO Pages', file: 'generate-pages.js' },
    { name: 'RSS & Sitemap', file: 'generate-rss.js' },
    { name: 'Crypto', file: 'generate-crypto.js' }
];

for (const script of scripts) {
    console.log(`\n📄 Running ${script.name}...`);
    try {
        execSync(`node ${script.file}`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`❌ ${script.name} failed:`, e.message);
    }
}

console.log('\n✅ All pages generated!\n');

// Auto-commit if in git repo
try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    if (gitStatus.trim()) {
        console.log('📝 Committing changes...');
        execSync('git add -A');
        const date = new Date().toISOString().split('T')[0];
        execSync(`git commit -m "Daily update: ${date}"`);
        console.log('✅ Committed to git');
    } else {
        console.log('ℹ️ No changes to commit');
    }
} catch (e) {
    console.log('ℹ️ Git commit skipped');
}

console.log('\n🎉 Done! Next steps:');
console.log('1. Push to GitHub when ready');
console.log('2. Enable GitHub Pages');
console.log('3. Apply for AdSense');
