#!/usr/bin/env ts-node
/**
 * build-native.ts
 * Cross-platform native host build script with TypeScript
 */

import { spawn } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Platform detection
const platform = process.platform;
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log('🔨 Tab Agent Native Host Builder');
console.log('=================================');
console.log(`Platform: ${platform}`);
console.log('');

// Build configuration
interface BuildConfig {
    script: string;
    command: string;
    outputPath: string;
}

const buildConfigs: Record<string, BuildConfig> = {
    win32: {
        script: join(rootDir, 'Server', 'build-tool', 'build.bat'),
        command: 'cmd',
        outputPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'windows', 'tabagent-host.exe')
    },
    darwin: {
        script: join(rootDir, 'Server', 'build-tool', 'build-macos.sh'),
        command: 'bash',
        outputPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'macos', 'tabagent-host')
    },
    linux: {
        script: join(rootDir, 'Server', 'build-tool', 'build-linux.sh'),
        command: 'bash',
        outputPath: join(rootDir, 'TabAgentDist', 'NativeApp', 'binaries', 'linux', 'tabagent-host')
    }
};

const config = buildConfigs[platform];

if (!config) {
    console.error('❌ Unsupported platform:', platform);
    process.exit(1);
}

// Check if build script exists
if (!existsSync(config.script)) {
    console.error(`❌ Build script not found: ${config.script}`);
    process.exit(1);
}

// Check if rebuild needed
function needsRebuild(): boolean {
    if (!existsSync(config.outputPath)) {
        console.log('📦 Output not found, build required');
        return true;
    }
    
    const outputTime = statSync(config.outputPath).mtimeMs;
    const serverDir = join(rootDir, 'Server');
    const sourceFiles = [
        join(serverDir, 'native_host.py'),
        join(serverDir, 'config.py'),
        join(serverDir, 'requirements.txt')
    ];
    
    for (const sourceFile of sourceFiles) {
        if (existsSync(sourceFile)) {
            const sourceTime = statSync(sourceFile).mtimeMs;
            if (sourceTime > outputTime) {
                console.log(`📝 ${sourceFile.split(/[\\/]/).pop()} changed, rebuild required`);
                return true;
            }
        }
    }
    
    console.log('✅ Native host is up to date, skipping build');
    return false;
}

if (!needsRebuild()) {
    console.log('✅ Native host build skipped (no changes)');
    process.exit(0);
}

// Run build
console.log('🔨 Building native host...');
console.log('');

const args = isWindows ? ['/c', config.script] : [config.script];
const buildProcess = spawn(config.command, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
});

buildProcess.on('error', (error) => {
    console.error('❌ Build failed:', error);
    process.exit(1);
});

buildProcess.on('close', (code) => {
    if (code === 0) {
        console.log('');
        console.log('✅ Native host built successfully!');
        console.log(`📦 Output: ${config.outputPath}`);
        process.exit(0);
    } else {
        console.error(`❌ Build failed with exit code ${code}`);
        process.exit(code || 1);
    }
});

