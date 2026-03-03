import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
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
        console.log('[AHK] Checking installation...');

        // Try registry first (most reliable)
        const registryPath = await this.checkRegistry();
        if (registryPath) {
            console.log('[AHK] Registry InstallDir found:', registryPath);
            // Try multiple executable names in registry path
            const possiblePaths = [
                path.join(registryPath, 'v2', 'AutoHotkey.exe'),
                path.join(registryPath, 'v2', 'AutoHotkey64.exe'),
                path.join(registryPath, 'v2', 'AutoHotkey32.exe'),
                path.join(registryPath, 'AutoHotkey.exe'),
                path.join(registryPath, 'AutoHotkey64.exe'),
                path.join(registryPath, 'AutoHotkey32.exe')
            ];

            for (const exePath of possiblePaths) {
                console.log('[AHK] Checking path:', exePath);
                try {
                    await fs.access(exePath);
                    console.log('[AHK] File exists:', exePath);
                    const version = await this.getVersionFromExecutable(exePath);
                    console.log('[AHK] Detected version:', version);
                    this.ahkPath = exePath;
                    this.version = version;
                    return { installed: true, path: exePath, version, source: 'registry' };
                } catch (e: any) {
                    console.log('[AHK] Path not accessible:', exePath, e.message);
                    continue;
                }
            }
        }

        // Try common installation paths
        const commonPath = await this.checkCommonPaths();
        if (commonPath) {
            console.log('[AHK] Found via common path:', commonPath);
            const version = await this.getVersionFromExecutable(commonPath);
            this.ahkPath = commonPath;
            this.version = version;
            return { installed: true, path: commonPath, version, source: 'common-path' };
        }

        // Try PATH environment variable
        const pathEnvPath = await this.checkPATH();
        if (pathEnvPath) {
            console.log('[AHK] Found via PATH:', pathEnvPath);
            const version = await this.getVersionFromExecutable(pathEnvPath);
            this.ahkPath = pathEnvPath;
            this.version = version;
            return { installed: true, path: pathEnvPath, version, source: 'path-env' };
        }

        console.log('[AHK] AutoHotkey not found.');
        return { installed: false, path: null, version: null };
    }

    /**
     * Check Windows Registry for AutoHotkey installation
     */
    private async checkRegistry(): Promise<string | null> {
        const registryPaths = [
            'HKLM\\SOFTWARE\\AutoHotkey',
            'HKLM\\SOFTWARE\\Wow6432Node\\AutoHotkey',
            'HKCU\\SOFTWARE\\AutoHotkey'
        ];

        for (const regPath of registryPaths) {
            try {
                console.log('[AHK] Querying registry:', regPath);
                const { stdout } = await execPromise(
                    `reg query "${regPath}" /v InstallDir 2>nul`,
                    { encoding: 'utf8' }
                );
                const match = stdout.match(/InstallDir\s+REG_SZ\s+(.+)/);
                if (match) {
                    const installDir = match[1].trim();
                    console.log('[AHK] Registry InstallDir:', installDir);
                    return installDir;
                }
            } catch {
                continue;
            }
        }

        return null;
    }

    /**
     * Check common installation paths
     * NOTE: Use string concatenation for drive paths, NOT path.join('C:', ...)
     * because path.join('C:', 'foo') produces 'C:foo' on Windows (missing backslash)
     */
    private async checkCommonPaths(): Promise<string | null> {
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
        const programFilesX86 = process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)';
        const localAppData = process.env.LOCALAPPDATA || '';

        const commonPaths = [
            // v2 subdirectory (standard installation)
            `${programFiles}\\AutoHotkey\\v2\\AutoHotkey.exe`,
            `${programFiles}\\AutoHotkey\\v2\\AutoHotkey64.exe`,
            `${programFiles}\\AutoHotkey\\v2\\AutoHotkey32.exe`,
            `${programFilesX86}\\AutoHotkey\\v2\\AutoHotkey.exe`,
            `${programFilesX86}\\AutoHotkey\\v2\\AutoHotkey64.exe`,
            // Root AutoHotkey directory
            `${programFiles}\\AutoHotkey\\AutoHotkey.exe`,
            `${programFiles}\\AutoHotkey\\AutoHotkey64.exe`,
            `${programFilesX86}\\AutoHotkey\\AutoHotkey.exe`,
            // User-specific installation
            ...(localAppData ? [
                `${localAppData}\\Programs\\AutoHotkey\\v2\\AutoHotkey.exe`,
                `${localAppData}\\Programs\\AutoHotkey\\v2\\AutoHotkey64.exe`,
                `${localAppData}\\Programs\\AutoHotkey\\AutoHotkey.exe`,
            ] : []),
        ];

        for (const ahkPath of commonPaths) {
            try {
                await fs.access(ahkPath);
                console.log('[AHK] Found via common path:', ahkPath);
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
            const { stdout } = await execPromise('where AutoHotkey.exe 2>nul', { encoding: 'utf8' });
            const paths = stdout.trim().split('\n').map(p => p.trim()).filter(p => p.length > 0);
            console.log('[AHK] Found in PATH:', paths);

            // Prefer v2 installation
            for (const foundPath of paths) {
                if (foundPath.includes('v2')) {
                    return foundPath;
                }
            }

            return paths[0] || null;
        } catch {
            return null;
        }
    }

    /**
     * Get version from AutoHotkey executable
     */
    private async getVersionFromExecutable(exePath: string): Promise<string> {
        // Method 1: Use PowerShell to get file version info (most reliable)
        try {
            const escapedPath = exePath.replace(/'/g, "''");
            const psCommand = `(Get-Item '${escapedPath}').VersionInfo.ProductVersion`;
            const { stdout } = await execPromise(
                `powershell -NoProfile -Command "${psCommand}"`,
                { encoding: 'utf8', timeout: 5000 }
            );
            const version = stdout.trim();
            if (version && version !== '' && /\d+\.\d+/.test(version)) {
                console.log('[AHK] Version from PowerShell ProductVersion:', version);
                return version;
            }
        } catch (e: any) {
            console.log('[AHK] PowerShell ProductVersion failed:', e.message);
        }

        // Method 2: Try FileVersion
        try {
            const escapedPath = exePath.replace(/'/g, "''");
            const psCommand = `(Get-Item '${escapedPath}').VersionInfo.FileVersion`;
            const { stdout } = await execPromise(
                `powershell -NoProfile -Command "${psCommand}"`,
                { encoding: 'utf8', timeout: 5000 }
            );
            const version = stdout.trim();
            if (version && version !== '' && /\d+\.\d+/.test(version)) {
                console.log('[AHK] Version from PowerShell FileVersion:', version);
                return version;
            }
        } catch (e: any) {
            console.log('[AHK] PowerShell FileVersion failed:', e.message);
        }

        console.log('[AHK] Could not determine version, returning "unknown"');
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

            // Delete old installer if exists
            try { await fs.unlink(installerPath); } catch { /* ignore */ }

            await this.downloadFile(
                'https://www.autohotkey.com/download/ahk-v2.exe',
                installerPath,
                (progress) => {
                    progressCallback?.({ stage: 'downloading', progress, message: `Downloading... ${progress}%` });
                }
            );

            progressCallback?.({ stage: 'downloading', progress: 100, message: 'Download complete' });
            console.log('[AHK] Download complete:', installerPath);

            // Verify file exists and has size
            const stat = await fs.stat(installerPath);
            console.log('[AHK] Installer size:', stat.size, 'bytes');
            if (stat.size < 1000) {
                throw new Error('Downloaded file is too small, download may have failed');
            }

            // Wait for file release
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Install
            progressCallback?.({ stage: 'installing', progress: 0, message: 'Installing AutoHotkey v2...' });
            await this.runInstaller(installerPath);
            progressCallback?.({ stage: 'installing', progress: 100, message: 'Installation complete' });

            // Verify installation with retry logic
            progressCallback?.({ stage: 'verifying', progress: 0, message: 'Verifying installation...' });

            let status: AHKInstallationStatus = { installed: false, path: null, version: null };
            const maxRetries = 5;

            for (let i = 0; i < maxRetries; i++) {
                console.log(`[AHK] Detection attempt ${i + 1}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
                status = await this.checkInstallation();

                if (status.installed) {
                    console.log('[AHK] Detected successfully on attempt', i + 1);
                    break;
                }

                progressCallback?.({ stage: 'verifying', progress: ((i + 1) / maxRetries) * 100, message: `Retrying detection (${i + 1}/${maxRetries})...` });
            }

            if (!status.installed || !status.path) {
                throw new Error(
                    'Installation completed but AutoHotkey v2 not detected. ' +
                    'It may have installed successfully - please restart the application to check.'
                );
            }

            progressCallback?.({ stage: 'verifying', progress: 100, message: 'Verification complete' });

            // Cleanup
            try { await fs.unlink(installerPath); } catch { /* ignore */ }

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
     * Download a file with redirect following (GitHub uses multiple 302s)
     */
    private downloadFile(url: string, destPath: string, progressCallback?: (progress: number) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            const doRequest = (requestUrl: string, redirectCount: number = 0) => {
                if (redirectCount > 5) {
                    reject(new Error('Too many redirects'));
                    return;
                }

                const protocol = requestUrl.startsWith('https') ? https : http;

                console.log(`[AHK] Downloading from: ${requestUrl} (redirect #${redirectCount})`);

                protocol.get(requestUrl, { headers: { 'User-Agent': 'HotkeyStudio/1.0' } }, (response) => {
                    // Follow redirects
                    if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode)) {
                        const redirectUrl = response.headers.location;
                        if (!redirectUrl) {
                            reject(new Error('Redirect without location header'));
                            return;
                        }
                        console.log('[AHK] Following redirect to:', redirectUrl);
                        response.resume(); // Consume response to free memory
                        doRequest(redirectUrl, redirectCount + 1);
                        return;
                    }

                    if (response.statusCode !== 200) {
                        reject(new Error(`HTTP ${response.statusCode}: Failed to download`));
                        return;
                    }

                    const fsSync = require('fs');
                    const file = fsSync.createWriteStream(destPath);
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
                        file.close((err: any) => {
                            if (err) reject(err);
                            else {
                                console.log(`[AHK] Downloaded ${downloadedSize} bytes`);
                                setTimeout(() => resolve(), 500);
                            }
                        });
                    });

                    file.on('error', (error: Error) => {
                        file.close(() => {
                            fsSync.unlink(destPath, () => { });
                        });
                        reject(error);
                    });
                }).on('error', reject);
            };

            doRequest(url);
        });
    }

    /**
     * Run AutoHotkey installer silently
     */
    private async runInstaller(installerPath: string): Promise<void> {
        try {
            // AutoHotkey v2 installer supports /silent flag
            // Try /silent first, fall back without flags if it fails
            console.log('[AHK] Running installer:', installerPath);

            try {
                await execPromise(`"${installerPath}" /silent`, { timeout: 60000 });
                console.log('[AHK] Installer completed with /silent flag');
            } catch (silentError: any) {
                console.log('[AHK] /silent failed, trying without flags:', silentError.message);
                // The installer may have still succeeded even if execPromise threw
                // (some installers return non-zero exit codes)
                // Wait and check
            }

            // Wait for installation to finish
            await new Promise(resolve => setTimeout(resolve, 5000));
            console.log('[AHK] Post-install wait completed');
        } catch (error: any) {
            console.log('[AHK] Installer error (may still have succeeded):', error.message);
            // Don't throw - installation may have succeeded even with an error
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
    setExecutablePath(exePath: string): void {
        this.ahkPath = exePath;
    }
}
