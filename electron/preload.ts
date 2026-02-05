import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electron', {
    // AutoHotkey Installation
    checkAHKInstallation: () => ipcRenderer.invoke('ahk:check-installation'),
    installAHK: (callback: (progress: any) => void) => {
        // Set up progress listener
        ipcRenderer.on('ahk:install-progress', (_event: IpcRendererEvent, progress: any) => {
            callback(progress);
        });
        // Start installation
        return ipcRenderer.invoke('ahk:install');
    },

    // Script Management
    createScript: (name: string, content?: string) =>
        ipcRenderer.invoke('script:create', name, content),
    readScript: (path: string) =>
        ipcRenderer.invoke('script:read', path),
    saveScript: (path: string, content: string) =>
        ipcRenderer.invoke('script:save', path, content),
    deleteScript: (path: string) =>
        ipcRenderer.invoke('script:delete', path),
    listScripts: () =>
        ipcRenderer.invoke('script:list'),

    // Process Management
    runScript: (scriptPath: string, ahkExecutable: string) =>
        ipcRenderer.invoke('process:run-script', scriptPath, ahkExecutable),
    stopScript: (pid: number) =>
        ipcRenderer.invoke('process:stop-script', pid),
    isScriptRunning: (pid: number) =>
        ipcRenderer.invoke('process:is-running', pid),
    getRunningScripts: () =>
        ipcRenderer.invoke('process:list-running'),

    // Macro Recorder
    startRecording: () =>
        ipcRenderer.invoke('macro:start-recording'),
    stopRecording: () =>
        ipcRenderer.invoke('macro:stop-recording'),
    pauseRecording: () =>
        ipcRenderer.invoke('macro:pause-recording'),
    resumeRecording: () =>
        ipcRenderer.invoke('macro:resume-recording'),
    generateScriptFromRecording: (recording: any) =>
        ipcRenderer.invoke('macro:generate-script', recording),

    // Compiler
    compileScript: (scriptPath: string, options?: any) =>
        ipcRenderer.invoke('compiler:compile-script', scriptPath, options),

    // File System Dialogs
    openFileDialog: (options?: any) =>
        ipcRenderer.invoke('dialog:open-file', options),
    saveFileDialog: (options?: any) =>
        ipcRenderer.invoke('dialog:save-file', options),
});
