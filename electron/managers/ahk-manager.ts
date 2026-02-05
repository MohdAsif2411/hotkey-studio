import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as os from 'os';

const execPromise = promisify(exec);

export interface AHKInstallationStatus {
    installed: boolean;
    path: string | null;
    version: string | null;
    source?: 'registry' | 'common-path' | 'path-env';
}

export interface InstallProgress {
    stage: 'downloading' | 'installing' | 'verifying' | 'complete';
    progress: number;
    message?: string;
}

export class AHKManager {
    private ahkPath: string | null = null;
    private version: string | null = null;

    constructor() {
        // Initialize
    }

    /**
     * Check if AutoHotkey v2 is installed
     */
    async checkInstallation(): Promise<AHKInstallationStatus> {
        // Try registry first (most reliable)
        const registryPath = await this.checkRegistry();
        if (registryPath) {
            const exePath = path.join(registryPath, 'v2', 'AutoHotkey.exe');
            try {
                await fs.access(exePath);
                const version = await this.getVersionFromExecutable(exePath);
                this.ahkPath = exePath;
                this.version = version;
                return { installed: true, path: exePath, version, source: 'registry' };
            } catch {
                // Registry entry exists but file doesn't
            }
        }

        // Try common installation paths
        const commonPath = await this.checkCommonPaths();
        if (commonPath) {
            const version = await this.getVersionFromExecutable(commonPath);
            this.ahkPath = commonPath;
            this.version = version;
            return { installed: true, path: commonPath, version, source: 'common-path' };
        }

        // Try PATH environment variable
        const pathEnvPath = await this.checkPATH();
        if (pathEnvPath) {
            const version = await this.getVersionFromExecutable(pathEnvPath);
            this.ahkPath = pathEnvPath;
            this.version = version;
            return { installed: true, path: pathEnvPath, version, source: 'path-env' };
        }

        return { installed: false, path: null, version: null };
    }

    /**
     * Check Windows Registry for AutoHotkey installation
     */
    private async checkRegistry(): Promise<string | null> {
        try {
            // Check HKLM (system-wide installation)
            const { stdout: hklmStdout } = await execPromise(
                'reg query "HKLM\\SOFTWARE\\AutoHotkey" /v InstallDir 2>nul',
                { encoding: 'utf8' }
            );
            const hklmMatch = hklmStdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
            if (hklmMatch) {
                return hklmMatch[1].trim();
            }
        } catch {
            // HKLM key not found, try HKCU
        }

        try {
            // Check HKCU (user installation)
            const { stdout: hkcuStdout } = await execPromise(
                'reg query "HKCU\\SOFTWARE\\AutoHotkey" /v InstallDir 2>nul',
                { encoding: 'utf8' }
            );
            const hkcuMatch = hkcuStdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
            if (hkcuMatch) {
                return hkcuMatch[1].trim();
            }
        } catch {
            // HKCU key not found
        }

        return null;
    }

    /**
     * Check common installation paths
     */
    private async checkCommonPaths(): Promise<string | null> {
        const commonPaths = [
            path.join('C:', 'Program Files', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join('C:', 'Program Files (x86)', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env.PROGRAMFILES || '', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || '', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
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

    /**
     * Check PATH environment variable
     */
    private async checkPATH(): Promise<string | null> {
        try {
            const { stdout } = await execPromise('where AutoHotkey.exe 2>nul');
            const paths = stdout.trim().split('\n');

            // Prefer v2 installation
            for (const foundPath of paths) {
                if (foundPath.includes('v2')) {
                    return foundPath.trim();
                }
            }

            // Return first found if no v2 specific path
            return paths[0]?.trim() || null;
        } catch {
            return null;
        }
    }

    /**
     * Get version from AutoHotkey executable
     */
    private async getVersionFromExecutable(exePath: string): Promise<string> {
        try {
            // Try running with --version flag
            const { stdout } = await execPromise(`"${exePath}" --version 2>nul`);
            const match = stdout.match(/(\d+\.\d+\.\d+)/);
            if (match) {
                return match[1];
            }
        } catch {
            // Version flag not supported, try file properties
        }

        try {
            // Use PowerShell to get file version
            const psCommand = `(Get-Item "${exePath.replace(/\\/g, '\\\\')}").VersionInfo.FileVersion`;
            const { stdout } = await execPromise(`powershell -Command "${psCommand}"`);
            const version = stdout.trim();
            if (version && version !== '') {
                return version;
            }
        } catch {
            // Could not get version
        }

        return 'unknown';
    }

    /**
     * Install AutoHotkey v2
     */
    async installAutoHotkey(progressCallback?: (progress: InstallProgress) => void): Promise<{ path: string; version: string }> {
        try {
            // Download installer
            progressCallback?.({ stage: 'downloading', progress: 0, message: 'Downloading AutoHotkey v2 installer...' });

            const tempDir = os.tmpdir();
            const installerPath = path.join(tempDir, 'AutoHotkey_v2_setup.exe');

            await this.downloadInstaller(installerPath, (progress) => {
                progressCallback?.({ stage: 'downloading', progress, message: `Downloading... ${progress}%` });
            });

            progressCallback?.({ stage: 'downloading', progress: 100, message: 'Download complete' });

            // Install
            progressCallback?.({ stage: 'installing', progress: 0, message: 'Installing AutoHotkey v2...' });
            await this.runInstaller(installerPath);
            progressCallback?.({ stage: 'installing', progress: 100, message: 'Installation complete' });

            // Verify installation
            progressCallback?.({ stage: 'verifying', progress: 0, message: 'Verifying installation...' });
            const status = await this.checkInstallation();

            if (!status.installed || !status.path) {
                throw new Error('Installation completed but AutoHotkey v2 not detected');
            }

            progressCallback?.({ stage: 'verifying', progress: 100, message: 'Verification complete' });

            // Cleanup
            try {
                await fs.unlink(installerPath);
            } catch {
                // Ignore cleanup errors
            }

            progressCallback?.({ stage: 'complete', progress: 100, message: 'AutoHotkey v2 installed successfully' });

            return {
                path: status.path,
                version: status.version || 'unknown'
            };
        } catch (error: any) {
            throw new Error(`Failed to install AutoHotkey v2: ${error.message}`);
        }
    }

    /**
     * Download AutoHotkey v2 installer
     */
    private downloadInstaller(destPath: string, progressCallback?: (progress: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            // AutoHotkey v2 download URL
            const downloadUrl = 'https://www.autohotkey.com/download/ahk-v2.exe';

            https.get(downloadUrl, (response) => {
                // Follow redirects
                if (response.statusCode === 301 || response.statusCode === 302) {
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        reject(new Error('Redirect location not found'));
                        return;
                    }

                    https.get(redirectUrl, (redirectResponse) => {
                        this.handleDownloadResponse(redirectResponse, destPath, progressCallback, resolve, reject);
                    }).on('error', reject);
                } else {
                    this.handleDownloadResponse(response, destPath, progressCallback, resolve, reject);
                }
            }).on('error', reject);
        });
    }

    /**
     * Handle download response
     */
    private handleDownloadResponse(
        response: any,
        destPath: string,
        progressCallback: ((progress: number) => void) | undefined,
        resolve: () => void,
        reject: (error: Error) => void
    ): void {
        const file = require('fs').createWriteStream(destPath);
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk: Buffer) => {
            downloadedSize += chunk.length;
            if (totalSize > 0 && progressCallback) {
                const progress = Math.round((downloadedSize / totalSize) * 100);
                progressCallback(progress);
            }
        });

        response.pipe(file);

        file.on('finish', () => {
            file.close();
            resolve();
        });

        file.on('error', (error: Error) => {
            require('fs').unlink(destPath, () => { });
            reject(error);
        });
    }

    /**
     * Run AutoHotkey installer silently
     */
    private async runInstaller(installerPath: string): Promise<void> {
        try {
            // Run installer with silent flag (/S for NSIS installers)
            await execPromise(`"${installerPath}" /S`);

            // Wait for installation to complete (installer runs in background)
            await new Promise(resolve => setTimeout(resolve, 5000));
        } catch (error: any) {
            throw new Error(`Installer failed: ${error.message}`);
        }
    }

    /**
     * Get AutoHotkey version
     */
    async getVersion(): Promise<string> {
        if (this.version) {
            return this.version;
        }

        const status = await this.checkInstallation();
        return status.version || 'unknown';
    }

    /**
     * Get AutoHotkey executable path
     */
    getExecutablePath(): string {
        if (!this.ahkPath) {
            throw new Error('AutoHotkey not installed or path not set');
        }
        return this.ahkPath;
    }

    /**
     * Set AutoHotkey path manually
     */
    setExecutablePath(path: string): void {
        this.ahkPath = path;
    }
}
