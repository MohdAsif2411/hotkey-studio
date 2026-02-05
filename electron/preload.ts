import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // AutoHotkey Management
    ahk: {
        checkInstallation: () => ipcRenderer.invoke('ahk:check-installation'),
        install: () => ipcRenderer.invoke('ahk:install'),
        getVersion: () => ipcRenderer.invoke('ahk:get-version'),
        onInstallProgress: (callback: (progress: any) => void) => {
            ipcRenderer.on('ahk:install-progress', (_event: IpcRendererEvent, progress: any) => callback(progress));
        }
    },

    // Script Management
    script: {
        list: () => ipcRenderer.invoke('script:list'),
        read: (scriptPath: string) => ipcRenderer.invoke('script:read', scriptPath),
        save: (scriptPath: string, content: string) => ipcRenderer.invoke('script:save', scriptPath, content),
        delete: (scriptPath: string) => ipcRenderer.invoke('script:delete', scriptPath),
        create: (scriptName: string, content: string) => ipcRenderer.invoke('script:create', scriptName, content)
    },

    // Process Management
    process: {
        runScript: (scriptPath: string) => ipcRenderer.invoke('process:run-script', scriptPath),
        stopScript: (pid: number) => ipcRenderer.invoke('process:stop-script', pid),
        listRunning: () => ipcRenderer.invoke('process:list-running')
    },

    // Macro Recorder
    macro: {
        startRecording: () => ipcRenderer.invoke('macro:start-recording'),
        stopRecording: () => ipcRenderer.invoke('macro:stop-recording'),
        generateScript: (recording: any) => ipcRenderer.invoke('macro:generate-script', recording)
    },

    // Compiler
    compiler: {
        checkAvailable: () => ipcRenderer.invoke('compiler:check-available'),
        compileScript: (scriptPath: string, options: any) => ipcRenderer.invoke('compiler:compile-script', scriptPath, options)
    },

    // Settings
    settings: {
        get: (key: string) => ipcRenderer.invoke('settings:get', key),
        set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value)
    }
});

// Type definitions for TypeScript (optional, for Angular)
export interface ElectronAPI {
    ahk: {
        checkInstallation: () => Promise<{ success: boolean; data?: any; error?: string }>;
        install: () => Promise<{ success: boolean; data?: any; error?: string }>;
        getVersion: () => Promise<{ success: boolean; data?: string; error?: string }>;
        onInstallProgress: (callback: (progress: any) => void) => void;
    };
    script: {
        list: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
        read: (scriptPath: string) => Promise<{ success: boolean; data?: string; error?: string }>;
        save: (scriptPath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        delete: (scriptPath: string) => Promise<{ success: boolean; error?: string }>;
        create: (scriptName: string, content: string) => Promise<{ success: boolean; data?: string; error?: string }>;
    };
    process: {
        runScript: (scriptPath: string) => Promise<{ success: boolean; data?: number; error?: string }>;
        stopScript: (pid: number) => Promise<{ success: boolean; error?: string }>;
        listRunning: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
    };
    macro: {
        startRecording: () => Promise<{ success: boolean; error?: string }>;
        stopRecording: () => Promise<{ success: boolean; data?: any; error?: string }>;
        generateScript: (recording: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    };
    compiler: {
        checkAvailable: () => Promise<{ success: boolean; data?: boolean; error?: string }>;
        compileScript: (scriptPath: string, options: any) => Promise<{ success: boolean; data?: string; error?: string }>;
    };
    settings: {
        get: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
        set: (key: string, value: any) => Promise<{ success: boolean; error?: string }>;
    };
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
