import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { AHKManager } from './managers/ahk-manager';
import { ScriptManager } from './managers/script-manager';
import { ProcessManager } from './managers/process-manager';

let mainWindow: BrowserWindow | null = null;

// Managers
const ahkManager = new AHKManager();
const scriptManager = new ScriptManager();
const processManager = new ProcessManager();

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        },
        frame: true,
        titleBarStyle: 'default',
        backgroundColor: '#1e1e1e',
        show: false
    });

    // Load Angular app
    // In development: http://localhost:4200
    // In production: file://dist/angular/browser/index.html
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    if (isDev) {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../angular/browser/index.html'));
    }

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.whenReady().then(() => {
    createWindow();
    registerIPCHandlers();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('before-quit', () => {
    // Cleanup: stop all running scripts
    processManager.stopAllScripts();
});

// IPC Handlers
function registerIPCHandlers(): void {
    // AutoHotkey Management
    ipcMain.handle('ahk:check-installation', async () => {
        try {
            const status = await ahkManager.checkInstallation();
            return { success: true, data: status };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ahk:install', async (event) => {
        try {
            const result = await ahkManager.installAutoHotkey((progress) => {
                event.sender.send('ahk:install-progress', progress);
            });
            return { success: true, data: result };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('ahk:get-version', async () => {
        try {
            const version = await ahkManager.getVersion();
            return { success: true, data: version };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Script Management
    ipcMain.handle('script:list', async () => {
        try {
            const scripts = await scriptManager.listScripts();
            return { success: true, data: scripts };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('script:read', async (_event, scriptPath: string) => {
        try {
            const content = await scriptManager.readScript(scriptPath);
            return { success: true, data: content };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('script:save', async (_event, scriptPath: string, content: string) => {
        try {
            await scriptManager.saveScript(scriptPath, content);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('script:delete', async (_event, scriptPath: string) => {
        try {
            await scriptManager.deleteScript(scriptPath);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('script:create', async (_event, scriptName: string, content: string) => {
        try {
            const scriptPath = await scriptManager.createScript(scriptName, content);
            return { success: true, data: scriptPath };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Process Management
    ipcMain.handle('process:run-script', async (event, scriptPath: string) => {
        try {
            const pid = await processManager.runScript(scriptPath, ahkManager.getExecutablePath());
            return { success: true, data: pid };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('process:stop-script', async (_event, pid: number) => {
        try {
            await processManager.stopScript(pid);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('process:list-running', async () => {
        try {
            const running = processManager.getRunningScripts();
            return { success: true, data: running };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Macro Recorder
    ipcMain.handle('macro:start-recording', async () => {
        try {
            // TODO: Import and initialize MacroRecorder
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('macro:stop-recording', async () => {
        try {
            // TODO: Stop recording and return recording data
            return { success: true, data: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('macro:generate-script', async (_event, recording: any) => {
        try {
            // TODO: Generate script from recording
            return { success: true, data: '' };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Compiler
    ipcMain.handle('compiler:check-available', async () => {
        try {
            // TODO: Import and initialize Compiler
            return { success: true, data: false };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('compiler:compile-script', async (_event, scriptPath: string, options: any) => {
        try {
            // TODO: Compile script
            return { success: true, data: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    // Settings
    ipcMain.handle('settings:get', async (_event, key: string) => {
        try {
            // TODO: Implement settings storage
            return { success: true, data: null };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('settings:set', async (_event, key: string, value: any) => {
        try {
            // TODO: Implement settings storage
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    });
}
