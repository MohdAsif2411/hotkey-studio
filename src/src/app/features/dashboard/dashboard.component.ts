import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';

interface QuickAction {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
}

interface ScriptStatus {
  total: number;
  running: number;
  enabled: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  // Signals for reactive state
  scriptStats = signal<ScriptStatus>({
    total: 0,
    running: 0,
    enabled: 0
  });

  activeHotkeys = signal(0);
  ahkInstalled = signal(false);
  ahkVersion = signal('unknown');

  quickActions = signal<QuickAction[]>([
    {
      icon: '✏️',
      title: 'New Script',
      description: 'Create a new AutoHotkey script',
      route: '/editor',
      color: '#58a6ff'
    },
    {
      icon: '⏺️',
      title: 'Record Macro',
      description: 'Record mouse and keyboard actions',
      route: '/macro-recorder',
      color: '#f85149'
    },
    {
      icon: '⌨️',
      title: 'Build Hotkey',
      description: 'Visual hotkey builder',
      route: '/hotkey-builder',
      color: '#a371f7'
    },
    {
      icon: '📚',
      title: 'Browse Templates',
      description: 'Use pre-built script templates',
      route: '/templates',
      color: '#3fb950'
    }
  ]);

  recentScripts = signal<any[]>([]);

  constructor(private ipcService: ElectronIpcService) {
    this.loadDashboardData();
  }

  private async loadDashboardData(): Promise<void> {
    console.log('Dashboard component initialized');

    // Check AutoHotkey installation status
    await this.checkAHKStatus();

    // TODO: Load script stats and recent scripts from IPC
  }

  /**
   * Check if AutoHotkey is installed
   */
  async checkAHKStatus(): Promise<void> {
    try {
      const ahkStatus = await this.ipcService.checkAHKInstallation();
      this.ahkInstalled.set(ahkStatus.installed);
      this.ahkVersion.set(ahkStatus.version || 'unknown');

      console.log('AutoHotkey status:', ahkStatus);
    } catch (error: any) {
      console.error('Failed to check AHK installation:', error);
      this.ahkInstalled.set(false);
      this.ahkVersion.set('unknown');
    }
  }

  /**
   * Install AutoHotkey v2
   */
  async installAutoHotkey(): Promise<void> {
    try {
      console.log('Starting AutoHotkey installation...');

      const result = await this.ipcService.installAHK((progress) => {
        console.log(`Installation progress: ${progress.stage} - ${progress.message} (${progress.progress}%)`);
      });

      console.log('AutoHotkey installed successfully:', result);

      // Refresh status
      await this.checkAHKStatus();

      alert(`AutoHotkey v2 installed successfully!\nVersion: ${result.version}\nPath: ${result.path}`);
    } catch (error: any) {
      console.error('Failed to install AutoHotkey:', error);
      alert(`Failed to install AutoHotkey: ${error.message}`);
    }
  }
}
