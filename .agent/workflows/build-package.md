---
description: Build and package the application for Windows distribution
---

# Build and Package Application

This workflow builds the Electron application and creates a Windows installer.

## Steps

1. **Clean previous builds**
   ```powershell
   if (Test-Path dist) { Remove-Item -Recurse -Force dist }
   ```

2. **Run production build**
   ```powershell
   npm run build
   ```

3. **Create installer**
   ```powershell
   npm run dist
   ```

4. **Verify output**
   ```powershell
   dir dist
   ```

## Expected Result

The `dist` folder contains:
- `.exe` installer for Windows
- Unpacked application files
- Build artifacts

## Distribution

The installer in `dist` can be distributed to users. It will:
- Install the application
- Create desktop shortcut
- Add to Start Menu
- Optionally install AutoHotkey if not present

## Notes

- Ensure version number is updated in `package.json` before building
- Test the installer on a clean Windows VM before distribution
- Consider code signing for production releases
