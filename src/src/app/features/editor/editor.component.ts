import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import loader from '@monaco-editor/loader';
import { ElectronIpcService } from '../../core/services/electron-ipc.service';

// Declare monaco for TypeScript
declare const monaco: typeof import('monaco-editor');

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss'
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef;

  private editor: any = null;
  private monacoLoaded = false;
  private currentScriptPid: number | null = null;

  // Signals for reactive state
  currentFile = signal<string | null>(null);
  isRunning = signal(false);
  cursorPosition = signal({ line: 1, column: 1 });

  constructor(private ipcService: ElectronIpcService) { }

  async ngAfterViewInit(): Promise<void> {
    await this.initializeMonaco();
  }

  ngOnDestroy(): void {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  private async initializeMonaco(): Promise<void> {
    if (!this.editorContainer) {
      return;
    }

    try {
      // Configure Monaco loader to use assets
      loader.config({
        paths: {
          vs: 'assets/monaco/vs'
        }
      });

      // Load Monaco
      const monacoInstance = await loader.init();
      this.monacoLoaded = true;

      // Create editor
      this.editor = monacoInstance.editor.create(this.editorContainer.nativeElement, {
        value: this.getDefaultScript(),
        language: 'plaintext', // We'll use plaintext for now
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        minimap: {
          enabled: true
        },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 4,
        insertSpaces: true
      });

      // Listen to cursor position changes
      this.editor.onDidChangeCursorPosition((e: any) => {
        this.cursorPosition.set({
          line: e.position.lineNumber,
          column: e.position.column
        });
      });

      // Listen to content changes
      this.editor.onDidChangeModelContent(() => {
        // Mark file as modified (can add dirty flag later)
      });
    } catch (error) {
      console.error('Failed to initialize Monaco Editor:', error);
    }
  }

  private getDefaultScript(): string {
    return `; AutoHotkey v2 Script
; Created: ${new Date().toLocaleDateString()}

#Requires AutoHotkey v2.0

; Example hotkey - Press Ctrl+J to show a message
^j:: {
    MsgBox "Hello from AutoHotkey v2!"
}

; Example hotstring - Type "btw" followed by space/tab/enter
::btw::by the way

; Your code here...
`;
  }

  newScript(): void {
    if (this.editor) {
      this.editor.setValue(this.getDefaultScript());
      this.currentFile.set(null);
    }
  }

  async openScript(): Promise<void> {
    try {
      // Open file dialog
      const filePath = await this.ipcService.openFileDialog({
        title: 'Open AutoHotkey Script',
        filters: [
          { name: 'AutoHotkey Scripts', extensions: ['ahk'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!filePath) {
        return; // User cancelled
      }

      // Read script content
      const content = await this.ipcService.readScript(filePath);

      // Update editor
      if (this.editor) {
        this.editor.setValue(content);
        this.currentFile.set(filePath);
      }
    } catch (error: any) {
      console.error('Failed to open script:', error);
      alert(`Failed to open script: ${error.message}`);
    }
  }

  async saveScript(): Promise<void> {
    if (!this.editor) {
      return;
    }

    const content = this.editor.getValue();

    try {
      let filePath = this.currentFile();

      // If no current file, show save dialog
      if (!filePath) {
        filePath = await this.ipcService.saveFileDialog({
          title: 'Save AutoHotkey Script',
          defaultPath: 'script.ahk',
          filters: [
            { name: 'AutoHotkey Scripts', extensions: ['ahk'] },
            { name: 'All Files', extensions: ['*'] }
          ]
        });

        if (!filePath) {
          return; // User cancelled
        }

        this.currentFile.set(filePath);
      }

      // Save the script
      await this.ipcService.saveScript(filePath, content);
      alert('Script saved successfully!');
    } catch (error: any) {
      console.error('Failed to save script:', error);
      alert(`Failed to save script: ${error.message}`);
    }
  }

  async runScript(): Promise<void> {
    const filePath = this.currentFile();

    if (!filePath) {
      alert('Please save the script first before running it.');
      return;
    }

    try {
      // Check if AutoHotkey is installed
      const ahkStatus = await this.ipcService.checkAHKInstallation();

      if (!ahkStatus.installed) {
        const install = confirm('AutoHotkey v2 is not installed. Would you like to install it now?');
        if (install) {
          await this.ipcService.installAHK((progress) => {
            console.log('Installation progress:', progress);
          });
        } else {
          return;
        }
      }

      // Run the script
      const pid = await this.ipcService.runScript(filePath, ahkStatus.path || '');
      this.currentScriptPid = pid;
      this.isRunning.set(true);

      console.log(`Script running with PID: ${pid}`);
    } catch (error: any) {
      console.error('Failed to run script:', error);
      alert(`Failed to run script: ${error.message}`);
    }
  }

  async stopScript(): Promise<void> {
    if (!this.currentScriptPid) {
      alert('No script is currently running.');
      return;
    }

    try {
      await this.ipcService.stopScript(this.currentScriptPid);
      this.isRunning.set(false);
      this.currentScriptPid = null;
      console.log('Script stopped successfully');
    } catch (error: any) {
      console.error('Failed to stop script:', error);
      alert(`Failed to stop script: ${error.message}`);
    }
  }

  getEditorContent(): string {
    return this.editor?.getValue() || '';
  }

  setEditorContent(content: string): void {
    this.editor?.setValue(content);
  }
}
