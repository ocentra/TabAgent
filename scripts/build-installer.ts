#!/usr/bin/env ts-node
/**
 * build-installer.ts
 * Cross-platform installer build script with TypeScript
 */

import { spawn } from 'child_process';
import { existsSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const platform = process.platform;
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log('📦 Tab Agent Installer Builder');
console.log('==============================');
console.log(`Platform: ${platform}`);
console.log('');

interface InstallerConfig {
    installerDir: string;
    buildScript: string;
    command: string;
    outputFile: string;
    binaryPath: string;
}

const installerConfigs: Record<string, InstallerConfig> = {
    win32: {
        installerDir: join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'windows'),
        buildScript: 'install-gui.ps1',  // PowerShell GUI installer (no MSI needed)
        command: 'powershell',
        outputFile: 'install-gui.ps1',
        binaryPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'windows', 'tabagent-host.exe')
    },
    darwin: {
        installerDir: join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'macos'),
        buildScript: 'build-pkg.sh',
        command: 'bash',
        outputFile: 'TabAgent-Setup.pkg',
        binaryPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'macos', 'tabagent-host')
    },
    linux: {
        installerDir: join(rootDir, 'TabAgentDist', 'NativeApp', 'installers', 'linux'),
        buildScript: 'build-deb.sh',
        command: 'bash',
        outputFile: 'tabagent_1.0.0_amd64.deb',
        binaryPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'linux', 'tabagent-host')
    }
};

const config = installerConfigs[platform];

if (!config) {
    console.error('❌ Unsupported platform:', platform);
    process.exit(1);
}

const buildScriptPath = join(config.installerDir, config.buildScript);

if (!existsSync(buildScriptPath)) {
    console.error(`❌ Build script not found: ${buildScriptPath}`);
    process.exit(1);
}

// Check if binary exists
if (!existsSync(config.binaryPath)) {
    console.error('❌ Native host binary not found!');
    console.error(`   Expected at: ${config.binaryPath}`);
    console.error('');
    console.error('Please build the native host first:');
    console.error('  npm run build:native');
    process.exit(1);
}

console.log('✅ Native host binary found');

// Copy binary to installer directory for build scripts
console.log('📋 Copying binary to installer directory...');
const binaryFileName = isWindows ? 'tabagent-host.exe' : 'tabagent-host';
const targetBinaryPath = join(config.installerDir, binaryFileName);
try {
    copyFileSync(config.binaryPath, targetBinaryPath);
    console.log('✅ Binary copied');
} catch (error) {
    console.error('❌ Failed to copy binary:', error);
    process.exit(1);
}

// Create extension zip file
console.log('📋 Creating extension zip file...');
const extensionSourcePath = join(rootDir, 'TabAgentDist', 'Extension');
const releaseDir = join(rootDir, 'TabAgentDist', 'Release');
const releaseZipPath = join(releaseDir, 'tabagent-extension.zip');
const installerZipPath = join(config.installerDir, 'tabagent-extension.zip');

if (existsSync(extensionSourcePath)) {
    try {
        const { execSync } = await import('child_process');
        const { rmSync } = await import('fs');
        
        // Create Release directory if it doesn't exist
        if (!existsSync(releaseDir)) {
            mkdirSync(releaseDir, { recursive: true });
            console.log('✅ Created Release directory');
        }
        
        // Remove existing zips if they exist
        if (existsSync(releaseZipPath)) {
            rmSync(releaseZipPath);
        }
        if (existsSync(installerZipPath)) {
            rmSync(installerZipPath);
        }
        
        // Create zip file using PowerShell (works on Windows)
        if (isWindows) {
            execSync(`powershell -command "Compress-Archive -Path '${extensionSourcePath}\\*' -DestinationPath '${releaseZipPath}' -Force"`, { stdio: 'inherit' });
        } else {
            // Use zip command for macOS/Linux
            execSync(`cd "${extensionSourcePath}" && zip -r "${releaseZipPath}" .`, { stdio: 'inherit' });
        }
        
        console.log('✅ Extension zip created in Release folder');
        
        // Copy to installer directory for backward compatibility
        copyFileSync(releaseZipPath, installerZipPath);
        console.log('✅ Extension zip copied to installer directory');
        
    } catch (error) {
        console.error('❌ Failed to create extension zip:', error);
        process.exit(1);
    }
} else {
    console.log('⚠️ Extension folder not found, skipping...');
    console.log(`   Expected at: ${extensionSourcePath}`);
}

console.log('');
console.log('✅ Installer preparation complete!');
console.log('');

const outputPath = join(config.installerDir, config.outputFile);

console.log('📦 Installer location:');
console.log(`   ${outputPath}`);
console.log('');
console.log('🚀 To run the installer:');

if (isWindows) {
    console.log('   Option 1: Double-click install-gui.ps1');
    console.log('   Option 2: Right-click > Run with PowerShell');
    console.log(`   Option 3: powershell -ExecutionPolicy Bypass -File "${outputPath}"`);
} else if (isMac) {
    console.log('   Building macOS .pkg installer...');
    const buildProcess = spawn(config.command, [config.buildScript], {
        cwd: config.installerDir,
        stdio: 'inherit',
        shell: true
    });
    
    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('');
            console.log('✅ macOS installer built successfully!');
            console.log(`   open "${outputPath}"`);
        } else {
            console.error(`❌ Build failed with exit code ${code}`);
            process.exit(code || 1);
        }
    });
} else {
    console.log('   Building Linux .deb installer...');
    const buildProcess = spawn(config.command, [config.buildScript], {
        cwd: config.installerDir,
        stdio: 'inherit',
        shell: true
    });
    
    buildProcess.on('close', (code) => {
        if (code === 0) {
            console.log('');
            console.log('✅ Linux installer built successfully!');
            console.log(`   sudo dpkg -i "${outputPath}"`);
        } else {
            console.error(`❌ Build failed with exit code ${code}`);
            process.exit(code || 1);
        }
    });
}

