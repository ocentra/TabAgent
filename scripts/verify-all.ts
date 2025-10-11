#!/usr/bin/env ts-node
/**
 * verify-all.ts
 * Verify all build outputs with TypeScript
 */

import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const platform = process.platform;

console.log('🔍 Tab Agent Build Verification');
console.log('================================');
console.log('');

let allGood = true;

// Check Extension
console.log('📱 Checking Extension...');
const extensionDir = join(rootDir, 'TabAgentDist', 'Extension');
const extensionFiles = [
    'manifest.json',
    'background.js',
    'sidepanel.html',
    'sidepanel.js',
    'content.js'
];

for (const file of extensionFiles) {
    const filePath = join(extensionDir, file);
    if (existsSync(filePath)) {
        const size = (statSync(filePath).size / 1024).toFixed(1);
        console.log(`  ✅ ${file} (${size} KB)`);
    } else {
        console.log(`  ❌ Missing: ${file}`);
        allGood = false;
    }
}

// Check Native Host Binaries
console.log('');
console.log('🖥️  Checking Native Host Binaries...');

const binaryPaths: Record<string, string> = {
    'Windows': join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'windows', 'tabagent-host.exe'),
    'macOS': join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'macos', 'tabagent-host'),
    'Linux': join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'linux', 'tabagent-host')
};

for (const [platformName, binaryPath] of Object.entries(binaryPaths)) {
    if (existsSync(binaryPath)) {
        const size = (statSync(binaryPath).size / 1024 / 1024).toFixed(1);
        const fileName = binaryPath.split(/[\\/]/).pop();
        console.log(`  ✅ ${platformName}: ${fileName} (${size} MB)`);
    } else {
        console.log(`  ⚠️  ${platformName}: Not built (build on ${platformName} to create)`);
    }
}

// Check Installers
console.log('');
console.log('📦 Checking Installers...');

const installerPaths: Record<string, string> = {
    'Windows MSI': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'windows', 'TabAgent-Setup.msi'),
    'macOS PKG': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'macos', 'TabAgent-Setup.pkg'),
    'Linux DEB': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'linux', 'tabagent_1.0.0_amd64.deb'),
    'Linux RPM': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'linux', 'tabagent-1.0.0-1.x86_64.rpm')
};

for (const [name, installerPath] of Object.entries(installerPaths)) {
    if (existsSync(installerPath)) {
        const size = (statSync(installerPath).size / 1024 / 1024).toFixed(1);
        console.log(`  ✅ ${name} (${size} MB)`);
    } else {
        console.log(`  ⚠️  ${name}: Not built`);
    }
}

// Check Installer Scripts
console.log('');
console.log('📝 Checking Installer Scripts...');

const scriptPaths: Record<string, string> = {
    'Windows GUI': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'windows', 'install-gui.ps1'),
    'macOS GUI': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'macos', 'install-gui.sh'),
    'Linux Script': join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'linux', 'install.sh')
};

for (const [name, scriptPath] of Object.entries(scriptPaths)) {
    if (existsSync(scriptPath)) {
        console.log(`  ✅ ${name}`);
    } else {
        console.log(`  ❌ ${name}: Missing`);
        allGood = false;
    }
}

// Summary
console.log('');
console.log('=================================');

if (allGood) {
    console.log('✅ All essential files verified!');
    console.log('');
    console.log('🚀 Ready to test!');
    
    const currentPlatformInstallers: Record<string, string | undefined> = {
        win32: installerPaths['Windows MSI'],
        darwin: installerPaths['macOS PKG'],
        linux: installerPaths['Linux DEB']
    };
    
    const installerPath = currentPlatformInstallers[platform];
    
    if (installerPath && existsSync(installerPath)) {
        if (platform === 'win32') {
            console.log(`   Run: ${installerPath}`);
        } else if (platform === 'darwin') {
            console.log(`   Run: open "${installerPath}"`);
        } else {
            console.log(`   Run: sudo dpkg -i "${installerPath}"`);
        }
    } else {
        console.log('   Build installer: npm run build:installer');
    }
    process.exit(0);
} else {
    console.log('❌ Some essential files are missing!');
    console.log('   Run: npm run build:all');
    process.exit(1);
}

