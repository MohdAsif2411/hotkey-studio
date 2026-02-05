---
name: AutoHotkey Script Parser
description: Parse AutoHotkey scripts to extract metadata and hotkey definitions
---

# AutoHotkey Script Parser Skill

This skill provides functionality to parse AutoHotkey scripts and extract useful information.

## Purpose

Parse `.ahk` files to extract:
- Hotkey definitions
- Hotstring definitions
- Script metadata (comments, description)
- Function definitions
- Variable declarations

## Usage

Use this skill when you need to:
- Display existing hotkeys in the UI
- Validate script syntax
- Extract script information for the library view
- Detect hotkey conflicts

## Implementation Pattern

### Basic Hotkey Parsing

AutoHotkey hotkeys follow these patterns:

```ahk
; Single-line hotkey
^!h::MsgBox "Hello"

; Multi-line hotkey
^!t::
{
    MsgBox "Line 1"
    MsgBox "Line 2"
}

; Hotstring
::btw::by the way
```

### Parsing Logic

```javascript
function parseAHKScript(scriptContent) {
    const hotkeys = [];
    const hotstrings = [];
    const lines = scriptContent.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip comments and empty lines
        if (line.startsWith(';') || line === '') continue;
        
        // Parse hotkeys (contains :: but not at start)
        if (line.includes('::') && !line.startsWith('::')) {
            const [trigger, action] = line.split('::');
            hotkeys.push({
                trigger: trigger.trim(),
                action: action ? action.trim() : 'multi-line',
                line: i + 1
            });
        }
        
        // Parse hotstrings (starts with ::)
        if (line.startsWith('::')) {
            const match = line.match(/^::([^:]+)::(.+)$/);
            if (match) {
                hotstrings.push({
                    trigger: match[1],
                    replacement: match[2],
                    line: i + 1
                });
            }
        }
    }
    
    return { hotkeys, hotstrings };
}
```

### Modifier Key Mapping

AutoHotkey uses special symbols for modifier keys:

- `^` = Ctrl
- `!` = Alt
- `+` = Shift
- `#` = Win (Windows key)

Example: `^!h` = Ctrl+Alt+H

### Convert to Human-Readable Format

```javascript
function formatHotkey(trigger) {
    const modifiers = [];
    let key = trigger;
    
    if (trigger.includes('^')) {
        modifiers.push('Ctrl');
        key = key.replace('^', '');
    }
    if (trigger.includes('!')) {
        modifiers.push('Alt');
        key = key.replace('!', '');
    }
    if (trigger.includes('+')) {
        modifiers.push('Shift');
        key = key.replace('+', '');
    }
    if (trigger.includes('#')) {
        modifiers.push('Win');
        key = key.replace('#', '');
    }
    
    return [...modifiers, key.toUpperCase()].join('+');
}

// Example: formatHotkey('^!h') => "Ctrl+Alt+H"
```

## Advanced Features

### Extract Metadata from Comments

```javascript
function extractMetadata(scriptContent) {
    const metadata = {
        name: '',
        description: '',
        author: '',
        version: ''
    };
    
    const lines = scriptContent.split('\n');
    for (const line of lines) {
        if (line.trim().startsWith(';')) {
            const comment = line.trim().substring(1).trim();
            
            if (comment.toLowerCase().startsWith('name:')) {
                metadata.name = comment.substring(5).trim();
            }
            if (comment.toLowerCase().startsWith('description:')) {
                metadata.description = comment.substring(12).trim();
            }
            // Add more metadata fields as needed
        }
    }
    
    return metadata;
}
```

### Detect Conflicts

```javascript
function detectConflicts(scripts) {
    const hotkeyMap = new Map();
    const conflicts = [];
    
    scripts.forEach(script => {
        const parsed = parseAHKScript(script.content);
        parsed.hotkeys.forEach(hotkey => {
            if (hotkeyMap.has(hotkey.trigger)) {
                conflicts.push({
                    trigger: hotkey.trigger,
                    scripts: [hotkeyMap.get(hotkey.trigger), script.name]
                });
            } else {
                hotkeyMap.set(hotkey.trigger, script.name);
            }
        });
    });
    
    return conflicts;
}
```

## Testing

Test the parser with various AutoHotkey script patterns:

```ahk
; Test script
; Name: Test Script
; Description: Testing parser

^!h::MsgBox "Hello"
^!t::ToolTip "Tooltip"
::btw::by the way

#n::
{
    Run "notepad.exe"
    WinWait "Untitled - Notepad"
    WinActivate
}
```

## References

- AutoHotkey Hotkey Documentation: https://www.autohotkey.com/docs/Hotkeys.htm
- AutoHotkey Hotstring Documentation: https://www.autohotkey.com/docs/Hotstrings.htm
