---
name: AutoHotkey Installation Manager
description: Detect and install AutoHotkey programmatically
---

# AutoHotkey Installation Manager Skill

This skill provides functionality to detect if AutoHotkey is installed and install it if needed.

## Purpose

- Detect AutoHotkey installation on Windows
- Download AutoHotkey installer
- Install AutoHotkey programmatically
- Verify installation success

## Detection Strategy

### 1. Check Registry

```javascript
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function checkRegistry() {
    try {
        const { stdout } = await execPromise(
            'reg query "HKLM\\SOFTWARE\\AutoHotkey" /v InstallDir',
            { encoding: 'utf8' }
        );
        
        // Parse registry output
        const match = stdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
        if (match) {
            return match[1].trim();
        }
    } catch (error) {
        // Key not found
        return null;
    }
}
```

### 2. Check Common Paths

```javascript
const fs = require('fs').promises;
const path = require('path');

async function checkCommonPaths() {
    const commonPaths = [
        'C:\\Program Files\\AutoHotkey\\AutoHotkey.exe',
        'C:\\Program Files (x86)\\AutoHotkey\\AutoHotkey.exe',
        path.join(process.env.LOCALAPPDATA, 'Programs\\AutoHotkey\\AutoHotkey.exe')
    ];
    
    for (const ahkPath of commonPaths) {
        try {
            await fs.access(ahkPath);
            return ahkPath;
        } catch {
            continue;
        }
    }
    
    return null;
}
```

### 3. Check PATH Environment

```javascript
async function checkPATH() {
    try {
        const { stdout } = await execPromise('where AutoHotkey.exe');
        return stdout.trim().split('\n')[0];
    } catch {
        return null;
    }
}
```

### Combined Detection

```javascript
async function detectAutoHotkey() {
    // Try registry first
    let installPath = await checkRegistry();
    if (installPath) {
        const exePath = path.join(installPath, 'AutoHotkey.exe');
        try {
            await fs.access(exePath);
            return { installed: true, path: exePath, source: 'registry' };
        } catch {
            // Registry entry exists but file doesn't
        }
    }
    
    // Try common paths
    installPath = await checkCommonPaths();
    if (installPath) {
        return { installed: true, path: installPath, source: 'common-path' };
    }
    
    // Try PATH
    installPath = await checkPATH();
    if (installPath) {
        return { installed: true, path: installPath, source: 'path' };
    }
    
    return { installed: false, path: null, source: null };
}
```

## Get AutoHotkey Version

```javascript
async function getAutoHotkeyVersion(exePath) {
    try {
        const { stdout } = await execPromise(`"${exePath}" /version`);
        const match = stdout.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : 'unknown';
    } catch (error) {
        // Fallback: check file properties
        try {
            const { stdout } = await execPromise(
                `wmic datafile where name="${exePath.replace(/\\/g, '\\\\')}" get Version /value`
            );
            const match = stdout.match(/Version=(.+)/);
            return match ? match[1].trim() : 'unknown';
        } catch {
            return 'unknown';
        }
    }
}
```

## Installation

### Download AutoHotkey

```javascript
const https = require('https');
const fs = require('fs');

function downloadAutoHotkey(version = 'v2', destPath) {
    return new Promise((resolve, reject) => {
        // AutoHotkey download URLs
        const urls = {
            v2: 'https://www.autohotkey.com/download/ahk-v2.exe',
            v1: 'https://www.autohotkey.com/download/ahk-install.exe'
        };
        
        const url = urls[version];
        const file = fs.createWriteStream(destPath);
        
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve(destPath);
                    });
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(destPath);
                });
            }
        }).on('error', (error) => {
            fs.unlink(destPath, () => {});
            reject(error);
        });
    });
}
```

### Install AutoHotkey

```javascript
const { spawn } = require('child_process');

function installAutoHotkey(installerPath, silent = true) {
    return new Promise((resolve, reject) => {
        // Silent installation arguments
        const args = silent ? ['/S'] : [];
        
        const installer = spawn(installerPath, args, {
            detached: true,
            stdio: 'ignore'
        });
        
        installer.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Installation failed with code ${code}`));
            }
        });
        
        installer.on('error', (error) => {
            reject(error);
        });
    });
}
```

### Complete Installation Flow

```javascript
async function ensureAutoHotkeyInstalled(progressCallback) {
    // Check if already installed
    const detection = await detectAutoHotkey();
    
    if (detection.installed) {
        const version = await getAutoHotkeyVersion(detection.path);
        return { 
            alreadyInstalled: true, 
            path: detection.path, 
            version 
        };
    }
    
    // Download installer
    progressCallback?.({ stage: 'downloading', progress: 0 });
    const tempDir = require('os').tmpdir();
    const installerPath = path.join(tempDir, 'ahk-installer.exe');
    
    await downloadAutoHotkey('v2', installerPath);
    progressCallback?.({ stage: 'downloading', progress: 100 });
    
    // Install
    progressCallback?.({ stage: 'installing', progress: 0 });
    await installAutoHotkey(installerPath, true);
    progressCallback?.({ stage: 'installing', progress: 100 });
    
    // Verify installation
    progressCallback?.({ stage: 'verifying', progress: 0 });
    const newDetection = await detectAutoHotkey();
    
    if (!newDetection.installed) {
        throw new Error('Installation completed but AutoHotkey not detected');
    }
    
    const version = await getAutoHotkeyVersion(newDetection.path);
    progressCallback?.({ stage: 'complete', progress: 100 });
    
    // Cleanup
    try {
        await fs.unlink(installerPath);
    } catch {}
    
    return { 
        alreadyInstalled: false, 
        path: newDetection.path, 
        version 
    };
}
```

## Usage Example

```javascript
// In main process
ipcMain.handle('ensure-autohotkey', async (event) => {
    try {
        const result = await ensureAutoHotkeyInstalled((progress) => {
            // Send progress updates to renderer
            event.sender.send('ahk-install-progress', progress);
        });
        
        return { success: true, data: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
});
```

## Error Handling

Common errors to handle:
- Download failures (network issues)
- Installation failures (permissions, antivirus)
- Verification failures (corrupted installer)
- User cancellation

## Testing

Test on various scenarios:
- Clean system (no AutoHotkey)
- System with AutoHotkey v1
- System with AutoHotkey v2
- System with AutoHotkey in non-standard location
- System with limited permissions

## References

- AutoHotkey Download: https://www.autohotkey.com/download/
- Silent Installation: https://www.autohotkey.com/docs/Program.htm#install
