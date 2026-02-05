---
description: Initialize Angular 19 application within Electron project
---

# Setup Angular 19 with Electron

This workflow sets up Angular 19 with standalone components within the Electron project structure.

## Prerequisites

- Node.js 18+ and npm installed
- Angular CLI 19 installed globally

## Steps

1. **Install Angular CLI 19**
   // turbo
   ```powershell
   npm install -g @angular/cli@19
   ```

2. **Create Angular 19 application (standalone by default)**
   ```powershell
   ng new src --routing --style=scss --skip-git --standalone
   ```
   
   When prompted:
   - Would you like to add server-side rendering (SSR)? **No**
   - Would you like to enable Server-Side Rendering (SSR) and Static Site Generation (SSG/Prerendering)? **No**

3. **Navigate to Angular app**
   ```powershell
   cd src
   ```

4. **Install required dependencies**
   // turbo
   ```powershell
   npm install ngx-monaco-editor-v2 --save
   npm install @angular/material @angular/cdk --save
   ```

5. **Configure Angular Material**
   ```powershell
   ng add @angular/material
   ```
   
   When prompted:
   - Choose a prebuilt theme: **Custom** or **Azure/Blue**
   - Set up global Angular Material typography styles? **Yes**
   - Include the Angular animations module? **Yes**

6. **Generate feature components (all standalone)**
   // turbo
   ```powershell
   ng generate component features/dashboard --standalone
   ng generate component features/editor --standalone
   ng generate component features/hotkey-builder --standalone
   ng generate component features/macro-recorder --standalone
   ng generate component features/template-gallery --standalone
   ng generate component features/script-library --standalone
   ng generate component features/settings --standalone
   ng generate component layout/main-layout --standalone
   ng generate component layout/sidebar --standalone
   ng generate component layout/header --standalone
   ```

7. **Generate core services**
   // turbo
   ```powershell
   ng generate service core/services/electron-ipc
   ng generate service core/services/theme
   ng generate service core/services/settings
   ```

8. **Update Angular configuration for Electron**
   - Modify `angular.json` to set output path for Electron
   - Configure base href for file:// protocol

9. **Return to project root**
   ```powershell
   cd ..
   ```

## Expected Result

Angular 19 application is set up with:
- Standalone components (no NgModules)
- Feature-driven folder structure
- All necessary components and services scaffolded
- Material Design configured
- Monaco Editor installed

## Angular 19 Key Features Used

- **Standalone Components:** All components are standalone by default
- **Signals:** For reactive state management
- **Modern Control Flow:** `@if`, `@for`, `@defer` syntax
- **inject() Function:** For dependency injection
- **provideRouter:** Functional router configuration

## Next Steps

- Configure Electron to load Angular app
- Set up IPC communication between Angular and Electron
- Implement routing with lazy loading
- Create app.routes.ts with feature routes
