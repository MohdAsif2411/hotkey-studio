import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

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

  constructor() {
    // TODO: Load data from Electron IPC
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Placeholder - will be replaced with actual IPC calls
    console.log('Dashboard component initialized');
  }
}
