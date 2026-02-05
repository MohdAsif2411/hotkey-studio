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
            // Try v2 subdirectory first, then root directory
            const possiblePaths = [
                path.join(registryPath, 'v2', 'AutoHotkey.exe'),
                path.join(registryPath, 'AutoHotkey.exe'),
                path.join(registryPath, 'AutoHotkey64.exe'),
                path.join(registryPath, 'AutoHotkey32.exe')
            ];

            for (const exePath of possiblePaths) {
                try {
                    await fs.access(exePath);
                    const version = await this.getVersionFromExecutable(exePath);
                    // Verify it's v2
                    if (version.startsWith('2.') || version.startsWith('v2.')) {
                        this.ahkPath = exePath;
                        this.version = version;
                        return { installed: true, path: exePath, version, source: 'registry' };
                    }
                } catch {
                    continue;
                }
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
        // Check multiple registry locations
        const registryPaths = [
            'HKLM\\SOFTWARE\\AutoHotkey',
            'HKLM\\SOFTWARE\\Wow6432Node\\AutoHotkey',  // 64-bit systems
            'HKCU\\SOFTWARE\\AutoHotkey'
        ];

        for (const regPath of registryPaths) {
            try {
                const { stdout } = await execPromise(
                    `reg query "${regPath}" /v InstallDir 2>nul`,
                    { encoding: 'utf8' }
                );
                const match = stdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
                if (match) {
                    return match[1].trim();
                }
            } catch {
                // Try next registry path
                continue;
            }
        }

        return null;
    }

    /**
     * Check common installation paths
     */
    private async checkCommonPaths(): Promise<string | null> {
        const commonPaths = [
            // AutoHotkey v2 specific paths (v2 subdirectory)
            path.join('C:', 'Program Files', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join('C:', 'Program Files (x86)', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env.PROGRAMFILES || '', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || '', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            // Also check root AutoHotkey directory (some installers put v2 here)
            path.join('C:', 'Program Files', 'AutoHotkey', 'AutoHotkey.exe'),
            path.join('C:', 'Program Files (x86)', 'AutoHotkey', 'AutoHotkey.exe'),
            path.join(process.env.PROGRAMFILES || '', 'AutoHotkey', 'AutoHotkey.exe'),
            path.join(process.env['PROGRAMFILES(X86)'] || '', 'AutoHotkey', 'AutoHotkey.exe'),
            // User-specific installation
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'AutoHotkey', 'v2', 'AutoHotkey.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'AutoHotkey', 'AutoHotkey.exe'),
        ];

        for (const ahkPath of commonPaths) {
            try {
                await fs.access(ahkPath);
                // Verify it's actually v2 by checking version
                const version = await this.getVersionFromExecutable(ahkPath);
                if (version.startsWith('2.') || version.startsWith('v2.')) {
                    return ahkPath;
                }
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

            // Wait a moment to ensure file is fully released by the OS
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Install
            progressCallback?.({ stage: 'installing', progress: 0, message: 'Installing AutoHotkey v2...' });
            await this.runInstaller(installerPath);
            progressCallback?.({ stage: 'installing', progress: 100, message: 'Installation complete' });

            // Verify installation with retry logic
            progressCallback?.({ stage: 'verifying', progress: 0, message: 'Verifying installation...' });

            // Wait longer for registry to be updated
            await new Promise(resolve => setTimeout(resolve, 3000));

            let status = await this.checkInstallation();
            let retries = 0;
            const maxRetries = 3;

            // Retry detection if not found immediately
            while (!status.installed && retries < maxRetries) {
                retries++;
                progressCallback?.({ stage: 'verifying', progress: (retries / maxRetries) * 100, message: `Retrying detection (${retries}/${maxRetries})...` });
                await new Promise(resolve => setTimeout(resolve, 2000));
                status = await this.checkInstallation();
            }

            if (!status.installed || !status.path) {
                throw new Error('Installation completed but AutoHotkey v2 not detected. Please restart the application or check manually.');
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
            // AutoHotkey v2 download URL - use the actual installer, not portable exe
            // Latest version from GitHub releases
            const downloadUrl = 'https://github.com/AutoHotkey/AutoHotkey/releases/download/v2.0.18/AutoHotkey_2.0.18_setup.exe';

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
            // Wait for the file stream to fully close before resolving
            file.close((err: any) => {
                if (err) {
                    reject(err);
                } else {
                    // Add a small delay to ensure file is fully released
                    setTimeout(() => resolve(), 500);
                }
            });
        });

        file.on('error', (error: Error) => {
            file.close(() => {
                require('fs').unlink(destPath, () => { });
            });
            reject(error);
        });
    }

    /**
     * Run AutoHotkey installer silently
     */
    private async runInstaller(installerPath: string): Promise<void> {
        try {
            // AutoHotkey v2 installer uses custom flags (not standard Inno Setup)
            // Correct flags based on official documentation:
            // /silent - silent installation (shows progress, no prompts)
            // /Elevate - install for all users (requires admin)
            const installerFlags = '/silent';

            await execPromise(`"${installerPath}" ${installerFlags}`);

            // Wait for installation to complete
            // AutoHotkey v2 installer typically takes 5-10 seconds
            await new Promise(resolve => setTimeout(resolve, 10000));
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
