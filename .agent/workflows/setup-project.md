---
description: Set up the Electron project structure for AutoHotkey GUI wrapper
---

# Setup Project Structure

This workflow sets up the complete directory structure and base files for the AutoHotkey GUI wrapper application.

## Steps

1. **Create source directories**
   ```powershell
   mkdir -p src/main, src/renderer/styles, src/renderer/scripts, src/renderer/components, src/preload, assets, resources
   ```

2. **Create main process files**
   - Create `src/main/index.js` - Main Electron entry point
   - Create `src/main/ahk-manager.js` - AutoHotkey installation manager
   - Create `src/main/script-manager.js` - Script file operations
   - Create `src/main/process-manager.js` - Script execution manager

3. **Create renderer files**
   - Create `src/renderer/index.html` - Main application window
   - Create `src/renderer/styles/main.css` - Main stylesheet
   - Create `src/renderer/scripts/app.js` - Main application logic

4. **Create preload script**
   - Create `src/preload/preload.js` - Secure IPC bridge

5. **Update package.json**
   - Add project metadata
   - Add dependencies: electron, electron-builder
   - Add build scripts
   - Configure electron-builder

6. **Install dependencies**
   // turbo
   ```powershell
   npm install
   ```

7. **Verify structure**
   ```powershell
   tree /F src
   ```

## Expected Result

A complete project structure ready for development with all necessary directories and base files created.
