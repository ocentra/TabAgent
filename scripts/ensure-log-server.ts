#!/usr/bin/env node
/**
 * Ensure log server is running with latest code
 * Kills and restarts if already running on port 3333
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const LOG_SERVER_PORT = 3333;

async function getProcessOnPort(port: number): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    if (!stdout.trim()) return null;
    
    // Extract PID from netstat output (last column)
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      if (line.includes('LISTENING')) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(parseInt(pid))) {
          return pid;
        }
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

async function killProcess(pid: string): Promise<void> {
  try {
    await execAsync(`taskkill /F /PID ${pid}`);
    console.log(`🔪 Killed old log server process (PID: ${pid})`);
  } catch (error) {
    // Process might already be dead, ignore
  }
}

async function startLogServer(): Promise<void> {
  console.log('📝 Starting log server with latest code...');
  
  // Use VBScript to start process completely hidden (Windows-specific solution)
  const vbsPath = 'scripts/start-log-server-hidden.vbs';
  const child = spawn('cscript', ['//nologo', vbsPath], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  });
  
  child.unref(); // Allow parent to exit independently
  
  // Wait for it to start
  await new Promise(resolve => setTimeout(resolve, 1500));
  console.log('✅ Log server started on http://localhost:3333');
}

async function main() {
  const pid = await getProcessOnPort(LOG_SERVER_PORT);
  
  if (pid) {
    console.log(`🔄 Log server detected on port ${LOG_SERVER_PORT}, restarting with latest code...`);
    await killProcess(pid);
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait for port to free
  }
  
  await startLogServer();
}

main().catch(err => {
  console.error('❌ Error ensuring log server:', err);
  process.exit(0); // Don't fail the build if log server fails
});

