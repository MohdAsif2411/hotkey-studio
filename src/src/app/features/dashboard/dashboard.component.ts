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
    template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="subtitle">Welcome to AutoHotkey GUI Wrapper</p>
      </header>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-content">
            <div class="stat-value">{{ scriptStats().total }}</div>
            <div class="stat-label">Total Scripts</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon running">▶️</div>
          <div class="stat-content">
            <div class="stat-value">{{ scriptStats().running }}</div>
            <div class="stat-label">Running Scripts</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon enabled">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ scriptStats().enabled }}</div>
            <div class="stat-label">Enabled Scripts</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⌨️</div>
          <div class="stat-content">
            <div class="stat-value">{{ activeHotkeys() }}</div>
            <div class="stat-label">Active Hotkeys</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <section class="quick-actions-section">
        <h2 class="section-title">Quick Actions</h2>
        <div class="quick-actions-grid">
          @for (action of quickActions(); track action.title) {
            <div class="action-card" [style.border-left-color]="action.color">
              <div class="action-icon">{{ action.icon }}</div>
              <div class="action-content">
                <h3 class="action-title">{{ action.title }}</h3>
                <p class="action-description">{{ action.description }}</p>
              </div>
              <button class="action-button">
                <span>Open</span>
                <span class="arrow">→</span>
              </button>
            </div>
          }
        </div>
      </section>

      <!-- Recent Scripts -->
      <section class="recent-section">
        <div class="section-header">
          <h2 class="section-title">Recent Scripts</h2>
          <a href="#" class="view-all">View All →</a>
        </div>
        
        @if (recentScripts().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <h3>No scripts yet</h3>
            <p>Create your first AutoHotkey script to get started</p>
            <button class="primary-button">Create Script</button>
          </div>
        } @else {
          <div class="scripts-list">
            @for (script of recentScripts(); track script.name) {
              <div class="script-item">
                <div class="script-icon">📝</div>
                <div class="script-info">
                  <div class="script-name">{{ script.name }}</div>
                  <div class="script-meta">Modified {{ script.modified }}</div>
                </div>
                <div class="script-status" [class.active]="script.running">
                  {{ script.running ? 'Running' : 'Stopped' }}
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- AutoHotkey Status -->
      <section class="ahk-status-section">
        <h2 class="section-title">AutoHotkey Status</h2>
        <div class="status-card">
          @if (ahkInstalled()) {
            <div class="status-content">
              <div class="status-icon success">✓</div>
              <div class="status-info">
                <div class="status-title">AutoHotkey v2 Installed</div>
                <div class="status-detail">Version {{ ahkVersion() }}</div>
              </div>
            </div>
          } @else {
            <div class="status-content">
              <div class="status-icon warning">⚠️</div>
              <div class="status-info">
                <div class="status-title">AutoHotkey Not Installed</div>
                <div class="status-detail">Click below to install AutoHotkey v2</div>
              </div>
              <button class="install-button">Install Now</button>
            </div>
          }
        </div>
      </section>
    </div>
  `,
    styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #c9d1d9;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      color: #8b949e;
      margin: 0;
      font-size: 1rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      font-size: 2rem;
      opacity: 0.8;
    }

    .stat-icon.running {
      animation: pulse 2s infinite;
    }

    .stat-icon.enabled {
      color: #3fb950;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #58a6ff;
      line-height: 1;
    }

    .stat-label {
      color: #8b949e;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    /* Sections */
    .quick-actions-section,
    .recent-section,
    .ahk-status-section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #c9d1d9;
      margin: 0 0 1rem 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .view-all {
      color: #58a6ff;
      text-decoration: none;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .view-all:hover {
      color: #79c0ff;
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-left: 3px solid;
      border-radius: 8px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .action-card:hover {
      background: #1c2128;
      transform: translateX(4px);
    }

    .action-icon {
      font-size: 2rem;
    }

    .action-content {
      flex: 1;
    }

    .action-title {
      font-size: 1rem;
      font-weight: 600;
      color: #c9d1d9;
      margin: 0 0 0.25rem 0;
    }

    .action-description {
      font-size: 0.875rem;
      color: #8b949e;
      margin: 0;
    }

    .action-button {
      background: #21262d;
      border: 1px solid #30363d;
      color: #58a6ff;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .action-button:hover {
      background: #30363d;
      border-color: #58a6ff;
    }

    .arrow {
      transition: transform 0.2s ease;
    }

    .action-card:hover .arrow {
      transform: translateX(4px);
    }

    /* Empty State */
    .empty-state {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 3rem 2rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 4rem;
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      color: #c9d1d9;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #8b949e;
      margin: 0 0 1.5rem 0;
    }

    .primary-button {
      background: #238636;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .primary-button:hover {
      background: #2ea043;
    }

    /* Scripts List */
    .scripts-list {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow: hidden;
    }

    .script-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #30363d;
      transition: background 0.2s ease;
    }

    .script-item:last-child {
      border-bottom: none;
    }

    .script-item:hover {
      background: #1c2128;
    }

    .script-icon {
      font-size: 1.5rem;
    }

    .script-info {
      flex: 1;
    }

    .script-name {
      font-weight: 500;
      color: #c9d1d9;
      margin-bottom: 0.25rem;
    }

    .script-meta {
      font-size: 0.75rem;
      color: #8b949e;
    }

    .script-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #21262d;
      color: #8b949e;
    }

    .script-status.active {
      background: #238636;
      color: white;
    }

    /* AutoHotkey Status */
    .status-card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .status-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-icon {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .status-icon.success {
      background: rgba(35, 134, 54, 0.2);
      color: #3fb950;
    }

    .status-icon.warning {
      background: rgba(187, 128, 9, 0.2);
      color: #d29922;
    }

    .status-info {
      flex: 1;
    }

    .status-title {
      font-weight: 600;
      color: #c9d1d9;
      margin-bottom: 0.25rem;
    }

    .status-detail {
      font-size: 0.875rem;
      color: #8b949e;
    }

    .install-button {
      background: #58a6ff;
      color: #0d1117;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .install-button:hover {
      background: #79c0ff;
    }
  `]
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
