#!/usr/bin/env tsx
/**
 * release-dist.ts
 * Complete automated release for TabAgent Extension
 * 
 * This script handles EVERYTHING:
 * - Version bump
 * - Build extension
 * - Create zip
 * - Commit to TabAgentDist submodule
 * - Create git tag
 * - Push to GitHub
 * - Create GitHub release
 * 
 * Usage:
 *   npm run release  (1.0.0 -> 1.0.1)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const distDir = join(rootDir, 'TabAgentDist');

console.log('🚀 Tab Agent Complete Release Script');
console.log('=====================================');
console.log('');

// Read current version
const packagePath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
const currentVersion = packageJson.version;

// Calculate new version (patch bump)
const [major, minor, patch] = currentVersion.split('.').map(Number);
const newVersion = `${major}.${minor}.${patch + 1}`;

console.log(`📦 Current version: ${currentVersion}`);
console.log(`📦 New version: ${newVersion}`);
console.log('');

// Update package.json
console.log('📝 Step 1/8: Updating package.json...');
packageJson.version = newVersion;
writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('   ✅ package.json updated');

// Update manifest.json
console.log('📝 Step 2/8: Updating manifest.json...');
const manifestPath = join(rootDir, 'manifest.json');
const manifestJson = JSON.parse(readFileSync(manifestPath, 'utf-8'));
manifestJson.version = newVersion;
writeFileSync(manifestPath, JSON.stringify(manifestJson, null, 2) + '\n');
console.log('   ✅ manifest.json updated');

// Build extension
console.log('');
console.log('🔨 Step 3/8: Building extension...');
try {
    execSync('npm run build:extension', { cwd: rootDir, stdio: 'inherit' });
    console.log('   ✅ Extension built successfully');
} catch (error) {
    console.error('   ❌ Build failed:', error);
    process.exit(1);
}

// Create release zip
console.log('');
console.log('📦 Step 4/8: Creating release zip...');
try {
    execSync('npm run build:installer', { cwd: rootDir, stdio: 'inherit' });
    console.log('   ✅ Release zip created');
} catch (error) {
    console.error('   ❌ Failed to create release zip:', error);
    process.exit(1);
}

// Git operations in TabAgentDist submodule
console.log('');
console.log('📝 Step 5/8: Committing to TabAgentDist...');

if (!existsSync(distDir)) {
    console.error('   ❌ TabAgentDist directory not found!');
    process.exit(1);
}

try {
    // Check if there are changes to commit
    const status = execSync('git status --porcelain', { cwd: distDir, encoding: 'utf-8' });
    
    if (status.trim().length > 0) {
        // Stage all changes
        execSync('git add -A', { cwd: distDir });
        console.log('   ✅ Changes staged');
        
        // Commit
        execSync(`git commit -m "Release v${newVersion}"`, { cwd: distDir });
        console.log('   ✅ Changes committed');
    } else {
        console.log('   ℹ️  No changes to commit');
    }
} catch (error: any) {
    console.error('   ⚠️  Git commit failed:', error.message);
}

// Create tag in TabAgentDist
console.log('');
console.log('🏷️  Step 6/8: Creating git tag...');
try {
    // Delete tag if it exists
    try {
        execSync(`git tag -d v${newVersion}`, { cwd: distDir, stdio: 'ignore' });
    } catch (e) {
        // Tag doesn't exist, that's fine
    }
    
    // Create new tag
    execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd: distDir });
    console.log(`   ✅ Tag v${newVersion} created`);
} catch (error: any) {
    console.error('   ❌ Failed to create tag:', error.message);
    process.exit(1);
}

// Push to GitHub
console.log('');
console.log('📤 Step 7/8: Pushing to GitHub...');
try {
    // Push commits
    execSync('git push origin main', { cwd: distDir, stdio: 'inherit' });
    console.log('   ✅ Commits pushed');
    
    // Push tag (with force to overwrite if exists)
    execSync(`git push origin v${newVersion} --force`, { cwd: distDir, stdio: 'inherit' });
    console.log('   ✅ Tag pushed');
} catch (error: any) {
    console.error('   ⚠️  Push failed:', error.message);
    console.log('   ℹ️  You may need to push manually: cd TabAgentDist && git push origin main && git push origin v' + newVersion);
}

// Create GitHub release
console.log('');
console.log('🎉 Step 8/8: Creating GitHub release...');

const zipPath = join(distDir, 'Release', 'tabagent-extension.zip');
if (!existsSync(zipPath)) {
    console.error('   ❌ Release zip not found:', zipPath);
    process.exit(1);
}

// Check if GitHub CLI is available
let hasGhCli = false;
try {
    execSync('gh --version', { stdio: 'ignore' });
    hasGhCli = true;
} catch (e) {
    hasGhCli = false;
}

if (hasGhCli) {
    try {
        const releaseNotes = `## Tab Agent v${newVersion}\n\nExtension release ${newVersion}`;
        
        // Create release with gh CLI
        execSync(
            `gh release create v${newVersion} "${zipPath}" --repo ocentra/TabAgentDist --title "Tab Agent v${newVersion}" --notes "${releaseNotes}"`,
            { cwd: distDir, stdio: 'inherit' }
        );
        
        console.log('   ✅ GitHub release created!');
    } catch (error: any) {
        console.error('   ⚠️  GitHub release creation failed:', error.message);
        console.log('   ℹ️  You can create it manually at: https://github.com/ocentra/TabAgentDist/releases/new');
    }
} else {
    console.log('   ℹ️  GitHub CLI not found. Please create release manually:');
    console.log('');
    console.log('   1. Go to: https://github.com/ocentra/TabAgentDist/releases/new');
    console.log(`   2. Select tag: v${newVersion}`);
    console.log(`   3. Title: Tab Agent v${newVersion}`);
    console.log(`   4. Upload file: ${zipPath}`);
    console.log('   5. Click "Publish release"');
    console.log('');
    console.log('   Or install GitHub CLI: https://cli.github.com/');
}

// Summary
console.log('');
console.log('=====================================');
console.log('🎉 Release Process Complete!');
console.log('');
console.log(`✅ Version: ${currentVersion} → ${newVersion}`);
console.log(`✅ Extension built: TabAgentDist/Extension/`);
console.log(`✅ Release zip: TabAgentDist/Release/tabagent-extension.zip`);
console.log(`✅ Git tag: v${newVersion}`);
console.log(`✅ Pushed to: https://github.com/ocentra/TabAgentDist`);
console.log('');

if (hasGhCli) {
    console.log(`🌐 GitHub Release: https://github.com/ocentra/TabAgentDist/releases/tag/v${newVersion}`);
} else {
    console.log('⚠️  Please complete the GitHub release manually (see instructions above)');
}

console.log('');
console.log('🎊 Your extension is ready for users to download!');
console.log('');

