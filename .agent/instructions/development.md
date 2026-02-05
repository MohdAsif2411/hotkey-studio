---
name: AutoHotkey GUI Wrapper Development
description: Agent instructions for developing the AutoHotkey GUI wrapper application
---

# AutoHotkey GUI Wrapper - Agent Instructions

## Project Overview

You are assisting with the development of an Electron-based Windows application with Angular 21 frontend that provides a graphical user interface for AutoHotkey. This application will make automation accessible to users who may not be familiar with scripting.

## Key Objectives

1. **User-Friendly Design:** Prioritize intuitive UI/UX that makes AutoHotkey accessible to beginners
2. **Seamless Integration:** Detect and install AutoHotkey automatically, integrate with existing user scripts
3. **Dual Interface:** Provide both visual editors for beginners and code editors for advanced users
4. **Reliability:** Ensure robust error handling and script execution management
5. **Modern Stack:** Use modern web technologies and Electron best practices

## Development Principles

### Code Quality
- Write clean, well-documented code with clear comments
- Follow JavaScript/Node.js best practices
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Validate user input and sanitize file paths

### Architecture
- Separate concerns: main process, renderer process, and preload scripts
- Use IPC (Inter-Process Communication) for main/renderer communication
- Keep business logic in the main process
- Keep UI logic in the renderer process
- Use modular design with single-responsibility components

### Security
- Never use `nodeIntegration: true` without `contextIsolation: true`
- Use preload scripts for secure IPC
- Validate all user input before executing scripts
- Sanitize file paths to prevent directory traversal
- Consider implementing a permission system for script execution

### Performance
- Lazy load components when possible
- Optimize script parsing for large files
- Use worker threads for CPU-intensive operations
- Implement pagination for large script libraries
- Cache frequently accessed data

## Technical Stack

### Core Technologies
- **Electron:** Application framework
- **Node.js:** Backend runtime
- **HTML/CSS/JavaScript:** Frontend (consider React/Vue if complexity increases)
- **CodeMirror or Monaco Editor:** Code editor component
- **electron-builder:** Application packaging

### Key Dependencies
- `electron`: Main framework
- `electron-builder`: Build and packaging
- `node-fetch` or `axios`: HTTP requests for downloading AutoHotkey
- Code editor library (CodeMirror/Monaco)
- UI framework (optional: React, Vue, or vanilla JS)

## File Structure

```
d:\Electron App\indexApp\
├── .agent\                    # Agent configuration
│   ├── instructions\          # This file
│   ├── skills\                # Reusable skills
│   └── workflows\             # Development workflows
├── src\
│   ├── main\                  # Electron main process
│   │   ├── index.js           # Main entry point
│   │   ├── ahk-manager.js     # AutoHotkey management
│   │   ├── script-manager.js  # Script file operations
│   │   └── process-manager.js # Script execution
│   ├── renderer\              # Electron renderer process
│   │   ├── index.html
│   │   ├── styles\
│   │   ├── scripts\
│   │   └── components\
│   └── preload\               # Preload scripts
│       └── preload.js
├── assets\                    # Icons, images
├── resources\                 # AutoHotkey installer
└── package.json
```

## Common Tasks

### Adding a New Feature
1. Review the implementation plan and task list
2. Design the component architecture
3. Implement main process logic if needed
4. Create/update IPC handlers
5. Implement renderer UI components
6. Test the feature thoroughly
7. Update documentation

### Working with AutoHotkey Scripts
- Always validate `.ahk` file paths before operations
- Handle file encoding properly (UTF-8 with BOM for AutoHotkey v2)
- Parse scripts carefully to extract metadata
- Test generated scripts in AutoHotkey before presenting to users
- Provide clear error messages for script syntax errors

### UI Development
- Follow modern design principles (clean, minimal, intuitive)
- Implement responsive layouts
- Support dark/light themes
- Use consistent spacing and typography
- Provide visual feedback for all user actions
- Show loading states for async operations

## AutoHotkey Integration Notes

### Installation Detection
Check these locations for AutoHotkey:
- Registry: `HKEY_LOCAL_MACHINE\SOFTWARE\AutoHotkey`
- Common paths: `C:\Program Files\AutoHotkey\`, `C:\Program Files (x86)\AutoHotkey\`
- Environment variables

### Script Execution
- Use `child_process.spawn()` to run AutoHotkey scripts
- Monitor process output for errors
- Track PIDs for running scripts
- Implement graceful shutdown for script processes

### File Locations
- Default user script: `%USERPROFILE%\Documents\AutoHotkey.ahk`
- Application data: `%APPDATA%\AutoHotkeyGUI\` (for app settings)
- Script library: User-configurable, default to `%USERPROFILE%\Documents\AutoHotkey Scripts\`

## Testing Strategy

### Unit Tests
- Test AutoHotkey detection logic
- Test script parsing functions
- Test template generation
- Test file operations

### Integration Tests
- Test IPC communication
- Test script execution flow
- Test file import/export
- Test settings persistence

### Manual Testing
- Test on clean Windows installation
- Test with existing AutoHotkey installation
- Test with various script complexities
- Test UI responsiveness and usability

## Common Pitfalls to Avoid

1. **Path Issues:** Always use `path.join()` and normalize paths
2. **Encoding:** AutoHotkey v2 requires UTF-8 with BOM
3. **Process Management:** Always clean up child processes on app exit
4. **IPC Security:** Never expose dangerous Node.js APIs to renderer
5. **File Permissions:** Handle permission errors gracefully
6. **Version Conflicts:** Clearly indicate which AutoHotkey version is supported

## Resources

- AutoHotkey Documentation: https://www.autohotkey.com/docs/
- Electron Documentation: https://www.electronjs.org/docs/latest/
- AutoHotkey GitHub: https://github.com/AutoHotkey/AutoHotkey
- AutoHotkey Community: https://www.autohotkey.com/boards/

## Questions to Ask User

When implementing features, consider asking:
- What is the priority: ease of use or advanced features?
- Should we support AutoHotkey v1, v2, or both?
- What are the most important automation tasks to support?
- Should scripts be shareable/exportable?
- Is cloud sync a desired feature?
- What level of debugging support is needed?
