import { Injectable } from '@angular/core';

// Define the window.electron API interface
interface ElectronAPI {
    // AutoHotkey Installation
    checkAHKInstallation: () => Promise<any>;
    installAHK: (progressCallback?: (progress: any) => void) => Promise<any>;

    // Script Management
    createScript: (name: string, content?: string) => Promise<string>;
    readScript: (path: string) => Promise<string>;
    saveScript: (path: string, content: string) => Promise<void>;
    deleteScript: (path: string) => Promise<void>;
    listScripts: () => Promise<any[]>;

    // Process Management
    runScript: (scriptPath: string, ahkExecutable: string) => Promise<number>;
    stopScript: (pid: number) => Promise<void>;
    isScriptRunning: (pid: number) => Promise<boolean>;
    getRunningScripts: () => Promise<any[]>;

    // Macro Recorder
    startRecording: () => Promise<void>;
    stopRecording: () => Promise<any>;
    pauseRecording: () => Promise<void>;
    resumeRecording: () => Promise<void>;
    generateScriptFromRecording: (recording: any) => Promise<string>;

    // Compiler
    compileScript: (scriptPath: string, options?: any) => Promise<string>;

    // File System
    openFileDialog: (options?: any) => Promise<string | null>;
    saveFileDialog: (options?: any) => Promise<string | null>;
}

// Extend Window interface
declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

@Injectable({
    providedIn: 'root'
})
export class ElectronIpcService {
    private electron: ElectronAPI | undefined;

    constructor() {
        // Check if running in Electron
        if (window.electron) {
            this.electron = window.electron;
        } else {
            console.warn('Electron API not available. Running in browser mode.');
        }
    }

    /**
     * Helper to unwrap Electron IPC responses
     */
    private async unwrapResponse<T>(promise: Promise<any>): Promise<T> {
        const response = await promise;
        if (response && typeof response === 'object' && 'success' in response) {
            if (!response.success) {
                throw new Error(response.error || 'Operation failed');
            }
            return response.data;
        }
        return response;
    }

    /**
     * Check if the app is running in Electron
     */
    isElectron(): boolean {
        return !!this.electron;
    }

    // ==================== AutoHotkey Installation ====================

    async checkAHKInstallation(): Promise<any> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.checkAHKInstallation());
    }

    async installAHK(progressCallback?: (progress: any) => void): Promise<any> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.installAHK(progressCallback || (() => { })));
    }

    // ==================== Script Management ====================

    async createScript(name: string, content?: string): Promise<string> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.createScript(name, content));
    }

    async readScript(path: string): Promise<string> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.readScript(path));
    }

    async saveScript(path: string, content: string): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.saveScript(path, content));
    }

    async deleteScript(path: string): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.deleteScript(path));
    }

    async listScripts(): Promise<any[]> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.listScripts());
    }

    // ==================== Process Management ====================

    async runScript(scriptPath: string, ahkExecutable: string): Promise<number> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.runScript(scriptPath, ahkExecutable));
    }

    async stopScript(pid: number): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.stopScript(pid));
    }

    async isScriptRunning(pid: number): Promise<boolean> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.isScriptRunning(pid));
    }

    async getRunningScripts(): Promise<any[]> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.getRunningScripts());
    }

    // ==================== Macro Recorder ====================

    async startRecording(): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.startRecording());
    }

    async stopRecording(): Promise<any> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.stopRecording());
    }

    async pauseRecording(): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.pauseRecording());
    }

    async resumeRecording(): Promise<void> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.resumeRecording());
    }

    async generateScriptFromRecording(recording: any): Promise<string> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.generateScriptFromRecording(recording));
    }

    // ==================== Compiler ====================

    async compileScript(scriptPath: string, options?: any): Promise<string> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.compileScript(scriptPath, options));
    }

    // ==================== File System ====================

    async openFileDialog(options?: any): Promise<string | null> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.openFileDialog(options));
    }

    async saveFileDialog(options?: any): Promise<string | null> {
        if (!this.electron) throw new Error('Electron API not available');
        return this.unwrapResponse(this.electron.saveFileDialog(options));
    }
}
