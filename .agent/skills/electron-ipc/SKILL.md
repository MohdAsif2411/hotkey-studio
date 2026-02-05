---
name: Electron IPC Communication
description: Secure communication between main and renderer processes in Electron
---

# Electron IPC Communication Skill

This skill provides patterns for secure Inter-Process Communication (IPC) between Electron's main and renderer processes.

## Purpose

Implement secure communication between:
- Main process (Node.js backend)
- Renderer process (UI frontend)

## Security Best Practices

**CRITICAL:** Never use `nodeIntegration: true` without `contextIsolation: true`. This exposes dangerous Node.js APIs to the renderer process.

**Recommended Pattern:**
1. Enable `contextIsolation: true`
2. Use preload scripts to expose safe APIs
3. Use `ipcMain` and `ipcRenderer` for communication

## Implementation Pattern

### 1. Main Process Setup (src/main/index.js)

```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, '../preload/preload.js'),
            contextIsolation: true,  // REQUIRED
            nodeIntegration: false   // REQUIRED
        }
    });

    mainWindow.loadFile('src/renderer/index.html');
}

app.whenReady().then(() => {
    createWindow();
    
    // Register IPC handlers
    registerIPCHandlers();
});

function registerIPCHandlers() {
    // Handle requests from renderer
    ipcMain.handle('get-ahk-status', async () => {
        // Check AutoHotkey installation
        return { installed: true, version: '2.0' };
    });
    
    ipcMain.handle('run-script', async (event, scriptPath) => {
        // Run AutoHotkey script
        // Return result
    });
    
    ipcMain.handle('save-script', async (event, scriptPath, content) => {
        // Save script to file
        // Return success/error
    });
}
```

### 2. Preload Script (src/preload/preload.js)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // AutoHotkey operations
    getAHKStatus: () => ipcRenderer.invoke('get-ahk-status'),
    runScript: (scriptPath) => ipcRenderer.invoke('run-script', scriptPath),
    saveScript: (scriptPath, content) => ipcRenderer.invoke('save-script', scriptPath, content),
    
    // Script management
    listScripts: () => ipcRenderer.invoke('list-scripts'),
    deleteScript: (scriptPath) => ipcRenderer.invoke('delete-script', scriptPath),
    
    // Event listeners
    onScriptError: (callback) => {
        ipcRenderer.on('script-error', (event, error) => callback(error));
    },
    onScriptOutput: (callback) => {
        ipcRenderer.on('script-output', (event, output) => callback(output));
    }
});
```

### 3. Renderer Process (src/renderer/scripts/app.js)

```javascript
// Access exposed APIs
async function checkAutoHotkey() {
    try {
        const status = await window.electronAPI.getAHKStatus();
        console.log('AutoHotkey status:', status);
        
        if (status.installed) {
            document.getElementById('ahk-status').textContent = 
                `AutoHotkey ${status.version} installed`;
        } else {
            document.getElementById('ahk-status').textContent = 
                'AutoHotkey not found';
        }
    } catch (error) {
        console.error('Failed to check AutoHotkey:', error);
    }
}

async function runScript(scriptPath) {
    try {
        const result = await window.electronAPI.runScript(scriptPath);
        console.log('Script started:', result);
    } catch (error) {
        console.error('Failed to run script:', error);
        alert('Error running script: ' + error.message);
    }
}

// Listen for events
window.electronAPI.onScriptError((error) => {
    console.error('Script error:', error);
    showNotification('Script Error', error.message);
});

// Initialize
checkAutoHotkey();
```

## Common IPC Patterns

### Request-Response (invoke/handle)

Use for operations that return a result:

```javascript
// Main process
ipcMain.handle('channel-name', async (event, arg1, arg2) => {
    // Process request
    return result;
});

// Renderer process
const result = await window.electronAPI.methodName(arg1, arg2);
```

### One-Way Messages (send/on)

Use for notifications and events:

```javascript
// Main process sends to renderer
mainWindow.webContents.send('event-name', data);

// Renderer listens
ipcRenderer.on('event-name', (event, data) => {
    // Handle event
});
```

### Bidirectional Communication

```javascript
// Renderer sends to main
ipcRenderer.send('message-to-main', data);

// Main listens
ipcMain.on('message-to-main', (event, data) => {
    // Process and reply
    event.reply('reply-channel', result);
});

// Renderer listens for reply
ipcRenderer.on('reply-channel', (event, result) => {
    // Handle reply
});
```

## Error Handling

Always handle errors in IPC calls:

```javascript
// Main process
ipcMain.handle('risky-operation', async (event, arg) => {
    try {
        const result = await performOperation(arg);
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Renderer process
const response = await window.electronAPI.riskyOperation(arg);
if (response.success) {
    // Handle success
} else {
    // Handle error
    console.error(response.error);
}
```

## Security Checklist

- [ ] `contextIsolation: true` is set
- [ ] `nodeIntegration: false` is set
- [ ] Only safe APIs are exposed via contextBridge
- [ ] User input is validated in main process
- [ ] File paths are sanitized
- [ ] No dangerous Node.js APIs (fs, child_process) exposed directly

## References

- Electron IPC Documentation: https://www.electronjs.org/docs/latest/tutorial/ipc
- Electron Security: https://www.electronjs.org/docs/latest/tutorial/security
- Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
