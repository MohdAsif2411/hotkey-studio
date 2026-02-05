import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execPromise = promisify(exec);

export interface CompileOptions {
    icon?: string;
    compression?: 'none' | 'upx';
    base?: 'AutoHotkey32.exe' | 'AutoHotkey64.exe';
    outputPath?: string;
}

export class Compiler {
    private ahk2exePath: string | null = null;

    constructor() {
        // Initialize
    }

    /**
     * Find Ahk2Exe compiler
     */
    private async findAhk2Exe(): Promise<string> {
        if (this.ahk2exePath) {
            return this.ahk2exePath;
        }

        // Common Ahk2Exe locations
        const commonPaths = [
            path.join('C:', 'Program Files', 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'),
            path.join('C:', 'Program Files (x86)', 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'AutoHotkey', 'Compiler', 'Ahk2Exe.exe'),
        ];

        for (const compilerPath of commonPaths) {
            try {
                await fs.access(compilerPath);
                this.ahk2exePath = compilerPath;
                return compilerPath;
            } catch {
                continue;
            }
        }

        throw new Error('Ahk2Exe compiler not found. Please ensure AutoHotkey v2 is installed.');
    }

    /**
     * Compile AutoHotkey script to executable
     */
    async compileScript(
        scriptPath: string,
        options: CompileOptions = {}
    ): Promise<string> {
        try {
            const ahk2exe = await this.findAhk2Exe();

            // Determine output path
            const parsedPath = path.parse(scriptPath);
            const outputPath = options.outputPath || path.join(parsedPath.dir, `${parsedPath.name}.exe`);

            // Build command arguments
            const args: string[] = [
                `/in "${scriptPath}"`,
                `/out "${outputPath}"`
            ];

            if (options.icon) {
                args.push(`/icon "${options.icon}"`);
            }

            if (options.base) {
                args.push(`/base "${options.base}"`);
            }

            if (options.compression === 'upx') {
                args.push('/compress 1');
            } else if (options.compression === 'none') {
                args.push('/compress 0');
            }

            // Execute compiler
            const command = `"${ahk2exe}" ${args.join(' ')}`;
            await execPromise(command);

            // Verify output file exists
            try {
                await fs.access(outputPath);
                return outputPath;
            } catch {
                throw new Error('Compilation completed but output file not found');
            }
        } catch (error: any) {
            throw new Error(`Failed to compile script: ${error.message}`);
        }
    }

    /**
     * Check if compiler is available
     */
    async isCompilerAvailable(): Promise<boolean> {
        try {
            await this.findAhk2Exe();
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Get compiler version
     */
    async getCompilerVersion(): Promise<string> {
        try {
            const ahk2exe = await this.findAhk2Exe();
            // Ahk2Exe doesn't have a version flag, return 'available'
            return 'available';
        } catch {
            return 'not found';
        }
    }
}
