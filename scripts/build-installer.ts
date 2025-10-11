#!/usr/bin/env ts-node
/**
 * build-installer.ts
 * Cross-platform installer build script with TypeScript
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
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
        buildScript: 'build-msi.bat',
        command: 'cmd',
        outputFile: 'TabAgent-Setup.msi',
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

// Check platform-specific tools
if (isWindows) {
    console.log('🔍 Checking for WiX Toolset...');
    console.log('⚠️  If build fails, install: choco install wixtoolset');
}

console.log('');
console.log('🔨 Building installer...');
console.log('');

const args = isWindows ? ['/c', config.buildScript] : [config.buildScript];
const buildProcess = spawn(config.command, args, {
    cwd: config.installerDir,
    stdio: 'inherit',
    shell: true
});

buildProcess.on('error', (error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});

buildProcess.on('close', (code) => {
    const outputPath = join(config.installerDir, config.outputFile);
    
    if (code === 0) {
        console.log('');
        console.log('✅ Installer built successfully!');
        console.log(`📦 Output: ${outputPath}`);
        console.log('');
        console.log('🚀 To test the installer:');
        if (isWindows) {
            console.log(`   ${outputPath}`);
            console.log('   (Double-click to run)');
        } else if (isMac) {
            console.log(`   open "${outputPath}"`);
        } else {
            console.log(`   sudo dpkg -i "${outputPath}"`);
        }
        process.exit(0);
    } else {
        console.error(`❌ Build failed with exit code ${code}`);
        process.exit(code || 1);
    }
});

