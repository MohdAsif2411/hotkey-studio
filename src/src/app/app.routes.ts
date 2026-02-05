import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'editor',
        loadComponent: () => import('./features/editor/editor.component').then(m => m.EditorComponent)
    },
    {
        path: 'hotkey-builder',
        loadComponent: () => import('./features/hotkey-builder/hotkey-builder.component').then(m => m.HotkeyBuilderComponent)
    },
    {
        path: 'macro-recorder',
        loadComponent: () => import('./features/macro-recorder/macro-recorder.component').then(m => m.MacroRecorderComponent)
    },
    {
        path: 'templates',
        loadComponent: () => import('./features/template-gallery/template-gallery.component').then(m => m.TemplateGalleryComponent)
    },
    {
        path: 'scripts',
        loadComponent: () => import('./features/script-library/script-library.component').then(m => m.ScriptLibraryComponent)
    },
    {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
