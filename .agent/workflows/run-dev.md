---
description: Run the Electron application in development mode
---

# Run Development Server

This workflow starts the Electron application in development mode with hot reload.

## Steps

1. **Ensure dependencies are installed**
   ```powershell
   npm install
   ```

2. **Start the development server**
   // turbo
   ```powershell
   npm run start
   ```

3. **Open DevTools (if not auto-opened)**
   - Press `Ctrl+Shift+I` in the Electron window
   - Or add `mainWindow.webContents.openDevTools()` to main process

## Expected Result

The Electron application window opens with the AutoHotkey GUI wrapper interface. DevTools are available for debugging.

## Troubleshooting

- **Port already in use:** Check if another instance is running
- **Module not found:** Run `npm install` again
- **Window doesn't open:** Check console for errors in main process
