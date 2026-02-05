import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="app-title">AutoHotkey GUI</h1>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-label">Dashboard</span>
          </a>
          
          <a routerLink="/scripts" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📝</span>
            <span class="nav-label">Scripts</span>
          </a>
          
          <a routerLink="/editor" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">✏️</span>
            <span class="nav-label">Editor</span>
          </a>
          
          <a routerLink="/hotkey-builder" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⌨️</span>
            <span class="nav-label">Hotkey Builder</span>
          </a>
          
          <a routerLink="/macro-recorder" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⏺️</span>
            <span class="nav-label">Macro Recorder</span>
          </a>
          
          <a routerLink="/templates" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📚</span>
            <span class="nav-label">Templates</span>
          </a>
          
          <div class="nav-divider"></div>
          
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-label">Settings</span>
          </a>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      background-color: #0d1117;
      color: #c9d1d9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
    }

    .sidebar {
      width: 240px;
      background-color: #161b22;
      border-right: 1px solid #30363d;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 1.5rem 1rem;
      border-bottom: 1px solid #30363d;
    }

    .app-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      color: #58a6ff;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      color: #8b949e;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
      border-left: 3px solid transparent;
    }

    .nav-item:hover {
      background-color: #21262d;
      color: #c9d1d9;
    }

    .nav-item.active {
      background-color: #21262d;
      color: #58a6ff;
      border-left-color: #58a6ff;
    }

    .nav-icon {
      font-size: 1.25rem;
      margin-right: 0.75rem;
      width: 24px;
      text-align: center;
    }

    .nav-label {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .nav-divider {
      height: 1px;
      background-color: #30363d;
      margin: 0.5rem 1rem;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      background-color: #0d1117;
    }

    /* Scrollbar Styling */
    .sidebar-nav::-webkit-scrollbar,
    .main-content::-webkit-scrollbar {
      width: 8px;
    }

    .sidebar-nav::-webkit-scrollbar-track,
    .main-content::-webkit-scrollbar-track {
      background: transparent;
    }

    .sidebar-nav::-webkit-scrollbar-thumb,
    .main-content::-webkit-scrollbar-thumb {
      background: #30363d;
      border-radius: 4px;
    }

    .sidebar-nav::-webkit-scrollbar-thumb:hover,
    .main-content::-webkit-scrollbar-thumb:hover {
      background: #484f58;
    }
  `]
})
export class AppComponent {
  title = 'AutoHotkey GUI Wrapper';
}
