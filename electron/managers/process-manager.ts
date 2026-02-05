import { spawn, ChildProcess } from 'child_process';

export interface RunningScript {
    pid: number;
    scriptPath: string;
    startTime: Date;
}

export class ProcessManager {
    private runningScripts: Map<number, RunningScript> = new Map();
    private processes: Map<number, ChildProcess> = new Map();

    /**
     * Run an AutoHotkey script
     */
    async runScript(scriptPath: string, ahkExecutable: string): Promise<number> {
        try {
            const process = spawn(ahkExecutable, [scriptPath], {
                detached: false,
                stdio: 'pipe'
            });

            if (!process.pid) {
                throw new Error('Failed to start script process');
            }

            const runningScript: RunningScript = {
                pid: process.pid,
                scriptPath,
                startTime: new Date()
            };

            this.runningScripts.set(process.pid, runningScript);
            this.processes.set(process.pid, process);

            // Handle process events
            process.on('error', (error) => {
                console.error(`Script error (PID ${process.pid}):`, error);
                this.cleanup(process.pid!);
            });

            process.on('exit', (code, signal) => {
                console.log(`Script exited (PID ${process.pid}): code=${code}, signal=${signal}`);
                this.cleanup(process.pid!);
            });

            // Log stdout/stderr
            process.stdout?.on('data', (data) => {
                console.log(`Script output (PID ${process.pid}):`, data.toString());
            });

            process.stderr?.on('data', (data) => {
                console.error(`Script error output (PID ${process.pid}):`, data.toString());
            });

            return process.pid;
        } catch (error: any) {
            throw new Error(`Failed to run script: ${error.message}`);
        }
    }

    /**
     * Stop a running script
     */
    async stopScript(pid: number): Promise<void> {
        const process = this.processes.get(pid);

        if (!process) {
            throw new Error(`No running script found with PID ${pid}`);
        }

        try {
            process.kill('SIGTERM');

            // Force kill after timeout
            setTimeout(() => {
                if (this.processes.has(pid)) {
                    process.kill('SIGKILL');
                }
            }, 5000);

            this.cleanup(pid);
        } catch (error: any) {
            throw new Error(`Failed to stop script: ${error.message}`);
        }
    }

    /**
     * Stop all running scripts
     */
    stopAllScripts(): void {
        for (const pid of this.processes.keys()) {
            try {
                this.stopScript(pid);
            } catch (error) {
                console.error(`Failed to stop script with PID ${pid}:`, error);
            }
        }
    }

    /**
     * Get list of running scripts
     */
    getRunningScripts(): RunningScript[] {
        return Array.from(this.runningScripts.values());
    }

    /**
     * Check if a script is running
     */
    isScriptRunning(pid: number): boolean {
        return this.processes.has(pid);
    }

    /**
     * Cleanup process references
     */
    private cleanup(pid: number): void {
        this.runningScripts.delete(pid);
        this.processes.delete(pid);
    }
}
