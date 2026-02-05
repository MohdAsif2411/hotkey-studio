import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface ScriptInfo {
    name: string;
    path: string;
    size: number;
    modified: Date;
    content?: string;
}

export class ScriptManager {
    private scriptsDirectory: string;

    constructor() {
        // Default scripts directory
        this.scriptsDirectory = path.join(os.homedir(), 'Documents', 'AutoHotkey Scripts');
        this.ensureScriptsDirectory();
    }

    /**
     * Ensure scripts directory exists
     */
    private async ensureScriptsDirectory(): Promise<void> {
        try {
            await fs.mkdir(this.scriptsDirectory, { recursive: true });
        } catch (error) {
            console.error('Failed to create scripts directory:', error);
        }
    }

    /**
     * Set custom scripts directory
     */
    setScriptsDirectory(directory: string): void {
        this.scriptsDirectory = directory;
        this.ensureScriptsDirectory();
    }

    /**
     * Get scripts directory
     */
    getScriptsDirectory(): string {
        return this.scriptsDirectory;
    }

    /**
     * List all scripts in the directory
     */
    async listScripts(): Promise<ScriptInfo[]> {
        try {
            const files = await fs.readdir(this.scriptsDirectory);
            const scripts: ScriptInfo[] = [];

            for (const file of files) {
                if (file.endsWith('.ahk')) {
                    const filePath = path.join(this.scriptsDirectory, file);
                    const stats = await fs.stat(filePath);

                    scripts.push({
                        name: file,
                        path: filePath,
                        size: stats.size,
                        modified: stats.mtime
                    });
                }
            }

            return scripts;
        } catch (error) {
            console.error('Failed to list scripts:', error);
            return [];
        }
    }

    /**
     * Read script content
     */
    async readScript(scriptPath: string): Promise<string> {
        try {
            const content = await fs.readFile(scriptPath, 'utf-8');
            return content;
        } catch (error: any) {
            throw new Error(`Failed to read script: ${error.message}`);
        }
    }

    /**
     * Save script content
     */
    async saveScript(scriptPath: string, content: string): Promise<void> {
        try {
            // Ensure UTF-8 with BOM for AutoHotkey v2
            const bom = '\ufeff';
            await fs.writeFile(scriptPath, bom + content, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to save script: ${error.message}`);
        }
    }

    /**
     * Create new script
     */
    async createScript(scriptName: string, content: string = ''): Promise<string> {
        try {
            // Ensure .ahk extension
            if (!scriptName.endsWith('.ahk')) {
                scriptName += '.ahk';
            }

            const scriptPath = path.join(this.scriptsDirectory, scriptName);

            // Check if file already exists
            try {
                await fs.access(scriptPath);
                throw new Error('Script already exists');
            } catch {
                // File doesn't exist, proceed
            }

            // Create script with default template if content is empty
            const defaultContent = content || `; AutoHotkey v2 Script
; Name: ${scriptName}
; Created: ${new Date().toLocaleDateString()}

#Requires AutoHotkey v2.0

; Your hotkeys and code here
`;

            await this.saveScript(scriptPath, defaultContent);
            return scriptPath;
        } catch (error: any) {
            throw new Error(`Failed to create script: ${error.message}`);
        }
    }

    /**
     * Delete script
     */
    async deleteScript(scriptPath: string): Promise<void> {
        try {
            await fs.unlink(scriptPath);
        } catch (error: any) {
            throw new Error(`Failed to delete script: ${error.message}`);
        }
    }

    /**
     * Duplicate script
     */
    async duplicateScript(scriptPath: string): Promise<string> {
        try {
            const content = await this.readScript(scriptPath);
            const parsedPath = path.parse(scriptPath);

            let newName = `${parsedPath.name} - Copy${parsedPath.ext}`;
            let newPath = path.join(parsedPath.dir, newName);
            let counter = 1;

            // Find unique name
            while (true) {
                try {
                    await fs.access(newPath);
                    newName = `${parsedPath.name} - Copy ${counter}${parsedPath.ext}`;
                    newPath = path.join(parsedPath.dir, newName);
                    counter++;
                } catch {
                    break;
                }
            }

            await this.saveScript(newPath, content);
            return newPath;
        } catch (error: any) {
            throw new Error(`Failed to duplicate script: ${error.message}`);
        }
    }
}
