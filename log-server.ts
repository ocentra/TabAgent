#!/usr/bin/env node
/**
 * Simple log server for TabAgent extension
 * Receives logs from extension and exposes them via HTTP
 */

import express from 'express';
import cors from 'cors';

const app = express() as any;
const PORT = 3333;

// Store logs in memory (last 1000)
const logs: any[] = [];
const MAX_LOGS = 1000;

// Middleware
app.use(cors());
app.use(express.json());

// Web UI - Terminal-style log viewer
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>TabAgent Logs - Terminal</title>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
      background: #0a0a0a; 
      color: #00ff00; 
      height: 100vh; 
      display: flex; 
      flex-direction: column;
      overflow: hidden;
    }
    
    .terminal-header { 
      background: #1a1a1a; 
      padding: 12px 20px; 
      border-bottom: 2px solid #00ff00; 
      display: flex; 
      align-items: center; 
      justify-content: space-between;
    }
    
    .terminal-title { 
      color: #00ff00; 
      font-size: 16px; 
      font-weight: bold; 
      display: flex; 
      align-items: center; 
      gap: 8px;
    }
    
    .terminal-controls { 
      display: flex; 
      gap: 8px; 
      align-items: center; 
      flex-wrap: wrap;
    }
    
    .terminal-controls label { 
      color: #888; 
      font-size: 12px; 
      display: flex; 
      align-items: center; 
      gap: 6px;
    }
    
    select, input[type="text"], input[type="number"] { 
      padding: 4px 8px; 
      background: #0a0a0a; 
      color: #00ff00; 
      border: 1px solid #333; 
      border-radius: 3px; 
      font-family: inherit;
      font-size: 12px;
    }
    
    input[type="text"] { width: 200px; }
    input[type="number"] { width: 70px; }
    
    select:focus, input:focus { 
      outline: none; 
      border-color: #00ff00; 
    }
    
    button { 
      padding: 5px 12px; 
      background: #1a1a1a; 
      color: #00ff00; 
      border: 1px solid #00ff00; 
      border-radius: 3px; 
      cursor: pointer; 
      font-family: inherit;
      font-size: 12px;
      transition: all 0.2s;
    }
    
    button:hover { 
      background: #00ff00; 
      color: #0a0a0a; 
    }
    
    button.clear { 
      border-color: #ff3333; 
      color: #ff3333; 
    }
    
    button.clear:hover { 
      background: #ff3333; 
      color: #0a0a0a; 
    }
    
    .stats { 
      color: #666; 
      font-size: 11px; 
      padding: 0 8px;
    }
    
    .terminal-body { 
      flex: 1; 
      overflow-y: auto; 
      padding: 12px 20px; 
      background: #0a0a0a;
      font-size: 13px;
      line-height: 1.4;
    }
    
    .log-line { 
      margin-bottom: 8px; 
      padding: 6px 0;
      border-left: 3px solid transparent;
      padding-left: 8px;
    }
    
    .log-line:hover { 
      background: #111; 
      border-left-color: #00ff00;
    }
    
    .log-meta { 
      display: inline-block;
      margin-right: 8px;
    }
    
    .timestamp { color: #666; }
    
    .level-error { color: #ff3333; font-weight: bold; }
    .level-warn { color: #ffaa00; font-weight: bold; }
    .level-log { color: #00ff00; }
    .level-info { color: #00aaff; }
    .level-debug { color: #aa00ff; }
    
    .context { 
      color: #00aaff; 
      padding: 1px 6px; 
      border-radius: 2px; 
      font-size: 11px;
    }
    
    .message { 
      color: #ddd; 
      word-break: break-word; 
      white-space: pre-wrap;
      margin-left: 4px;
    }
    
    .no-logs { 
      text-align: center; 
      padding: 60px 20px; 
      color: #444; 
      font-size: 14px;
    }
    
    .terminal-body::-webkit-scrollbar { width: 10px; }
    .terminal-body::-webkit-scrollbar-track { background: #0a0a0a; }
    .terminal-body::-webkit-scrollbar-thumb { background: #333; border-radius: 5px; }
    .terminal-body::-webkit-scrollbar-thumb:hover { background: #555; }
    
    input[type="checkbox"] {
      cursor: pointer;
      width: 14px;
      height: 14px;
    }
  </style>
</head>
<body>
  <div class="terminal-header">
    <div class="terminal-title">
      <span>⚡ TabAgent Logger</span>
    </div>
    
    <div class="terminal-controls">
      <button onclick="clearLogs()" class="clear">⌫ Clear</button>
      
      <label>
        Context:
        <select id="contextFilter" onchange="applyFilters()">
          <option value="">All</option>
        </select>
      </label>
      
      <label>
        Level:
        <select id="levelFilter" onchange="applyFilters()">
          <option value="">All</option>
          <option value="error">Error</option>
          <option value="warn">Warn</option>
          <option value="log">Log</option>
          <option value="info">Info</option>
          <option value="debug">Debug</option>
        </select>
      </label>
      
      <label>
        Search:
        <input type="text" id="searchFilter" placeholder="Filter messages..." oninput="applyFilters()">
      </label>
      
      <label>
        Show:
        <input type="number" id="limitInput" value="100" min="10" max="1000" step="50" onchange="applyFilters()">
      </label>
      
      <label>
        <input type="checkbox" id="autoRefresh" checked>
        Live
      </label>
      
      <span class="stats" id="stats">─</span>
    </div>
  </div>
  
  <div class="terminal-body" id="logContainer">
    <div class="no-logs">Waiting for logs...</div>
  </div>
  
  <script>
    let autoRefreshInterval = null;
    let allContexts = new Set();
    
    async function applyFilters() {
      const level = document.getElementById('levelFilter').value;
      const context = document.getElementById('contextFilter').value;
      const search = document.getElementById('searchFilter').value.toLowerCase();
      const limit = document.getElementById('limitInput').value;
      
      let url = '/logs?limit=' + limit;
      if (level) url += '&level=' + level;
      if (context) url += '&context=' + context;
      
      try {
        const response = await fetch(url);
        const data = await response.json();
        
        // Update context filter options
        updateContextFilter(data.logs);
        
        // Apply client-side search filter
        let filtered = data.logs;
        if (search) {
          filtered = filtered.filter(log => 
            log.message.toLowerCase().includes(search) ||
            log.context.toLowerCase().includes(search)
          );
        }
        
        const total = data.count;
        const shown = filtered.length;
        document.getElementById('stats').textContent = 
          shown === total ? \`\${total} logs\` : \`\${shown}/\${total} logs\`;
        
        renderLogs(filtered);
      } catch (err) {
        document.getElementById('stats').textContent = '⚠ Error: ' + err.message;
      }
    }
    
    function updateContextFilter(logs) {
      const contextFilter = document.getElementById('contextFilter');
      const currentValue = contextFilter.value;
      
      // Collect all unique contexts
      logs.forEach(log => allContexts.add(log.context));
      
      // Rebuild options
      const sortedContexts = Array.from(allContexts).sort();
      contextFilter.innerHTML = '<option value="">All</option>' + 
        sortedContexts.map(ctx => \`<option value="\${ctx}">\${ctx}</option>\`).join('');
      
      // Restore selection
      if (currentValue && sortedContexts.includes(currentValue)) {
        contextFilter.value = currentValue;
      }
    }
    
    function renderLogs(logs) {
      const container = document.getElementById('logContainer');
      
      if (logs.length === 0) {
        container.innerHTML = '<div class="no-logs">No logs match your filters.</div>';
        return;
      }
      
      container.innerHTML = logs.map(log => {
        const time = new Date(log.timestamp).toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        });
        
        return \`
          <div class="log-line">
            <span class="log-meta timestamp">\${time}</span>
            <span class="log-meta level-\${log.level}">[\${log.level.toUpperCase()}]</span>
            <span class="log-meta context">\${log.context}</span>
            <span class="message">\${escapeHtml(log.message)}</span>
          </div>
        \`;
      }).join('');
      
      // Auto-scroll to bottom
      container.scrollTop = container.scrollHeight;
    }
    
    async function clearLogs() {
      try {
        await fetch('/clear', { method: 'POST' });
        allContexts.clear();
        document.getElementById('searchFilter').value = '';
        applyFilters();
      } catch (err) {
        alert('Error clearing logs: ' + err.message);
      }
    }
    
    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Auto-refresh toggle
    document.getElementById('autoRefresh').addEventListener('change', (e) => {
      if (e.target.checked) {
        autoRefreshInterval = setInterval(applyFilters, 2000);
      } else {
        if (autoRefreshInterval) clearInterval(autoRefreshInterval);
      }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+L to clear
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearLogs();
      }
      // Ctrl+F to focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchFilter').focus();
      }
    });
    
    // Initial load
    applyFilters();
    autoRefreshInterval = setInterval(applyFilters, 2000);
  </script>
</body>
</html>
  `);
});

// POST endpoint - extension sends logs here
app.post('/log', (req, res) => {
  const { level, message, timestamp, context, data } = req.body;
  
  const logEntry = {
    timestamp: timestamp || new Date().toISOString(),
    level: level || 'log',
    message: message || '',
    context: context || 'unknown',
    data: data || null
  };
  
  logs.push(logEntry);
  
  // Keep only last MAX_LOGS
  if (logs.length > MAX_LOGS) {
    logs.shift();
  }
  
  res.json({ success: true, logsStored: logs.length });
});

// GET endpoint - fetch logs
app.get('/logs', (req, res) => {
  const { level, context, since, limit } = req.query;
  
  let filtered = [...logs];
  
  // Filter by level
  if (level) {
    filtered = filtered.filter(log => log.level === level);
  }
  
  // Filter by context
  if (context) {
    filtered = filtered.filter(log => log.context === context);
  }
  
  // Filter by timestamp
  if (since) {
    const sinceDate = new Date(since as string);
    filtered = filtered.filter(log => new Date(log.timestamp) > sinceDate);
  }
  
  // Limit results
  const maxLimit = parseInt(limit as string) || 100;
  filtered = filtered.slice(-maxLimit);
  
  res.json({
    count: filtered.length,
    logs: filtered
  });
});

// Clear logs (DELETE method)
app.delete('/logs', (req, res) => {
  const count = logs.length;
  logs.length = 0;
  res.json({ success: true, cleared: count });
});

// Clear logs (POST method for convenience)
app.post('/clear', (req, res) => {
  const count = logs.length;
  logs.length = 0;
  res.json({ success: true, cleared: count });
});

// Start server
app.listen(PORT, () => {
  console.log(`📝 TabAgent Log Server running on http://localhost:${PORT}`);
  console.log(`   POST /log      - Extension sends logs here`);
  console.log(`   GET  /logs     - Fetch logs (supports ?level=error&limit=50)`);
  console.log(`   POST /clear    - Clear all logs`);
  console.log(`   DELETE /logs   - Clear all logs`);
});

