import React, { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

export default function CollaborativeEditor({ roomId }) {
  const ydocRef = useRef();
  const providerRef = useRef();
  const bindingRef = useRef();
  const editorRef = useRef();
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [language, setLanguage] = useState("javascript");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Create Yjs doc & provider only ONCE
    ydocRef.current = new Y.Doc();
    
    // Use multiple signaling servers for better connectivity
    providerRef.current = new WebrtcProvider(`code-editor-${roomId}`, ydocRef.current, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ],
      password: null,
      maxConns: 20,
      filterBcConns: true,
      peerOpts: {}
    });

    // Wait for provider to be ready before setting up awareness
    const setupAwareness = () => {
      if (providerRef.current && providerRef.current.awareness) {
        // Set user info
        providerRef.current.awareness.setLocalStateField('user', {
          name: localStorage.getItem("guestName") || "Anonymous",
          color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          colorLight: `#${Math.floor(Math.random()*16777215).toString(16)}33`
        });

        // Track connected users
        const updateConnectedUsers = () => {
          if (providerRef.current && providerRef.current.awareness) {
            setConnectedUsers(providerRef.current.awareness.getStates().size);
          }
        };

        providerRef.current.awareness.on('change', updateConnectedUsers);
        updateConnectedUsers();

        setIsInitialized(true);
      }
    };

    // Track connection status
    const handleStatusChange = (event) => {
      setIsConnected(event.status === 'connected');
      if (event.status === 'connected') {
        setupAwareness();
      }
    };

    providerRef.current.on('status', handleStatusChange);

    // Try to setup awareness immediately if already connected
    setTimeout(setupAwareness, 100);

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }
    };
  }, [roomId]);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Wait for provider to be initialized
    const initializeBinding = () => {
      if (!providerRef.current || !ydocRef.current || !isInitialized) {
        setTimeout(initializeBinding, 100);
        return;
      }

      try {
        // Get the shared text type
        const yText = ydocRef.current.getText("monaco");

        // Create Monaco binding for real-time collaboration
        bindingRef.current = new MonacoBinding(
          yText,
          editor.getModel(),
          new Set([editor]),
          providerRef.current.awareness
        );

        // Add custom CSS for collaborative cursors
        const style = document.createElement('style');
        style.textContent = `
          .yRemoteSelection {
            background-color: rgba(255, 255, 0, 0.3);
          }
          .yRemoteSelectionHead {
            position: absolute;
            border-left: 2px solid orange;
            border-top: 2px solid orange;
            border-bottom: 2px solid orange;
            height: 100%;
            box-sizing: border-box;
          }
          .yRemoteSelectionHead::after {
            position: absolute;
            content: attr(data-yjs-user);
            color: white;
            background-color: orange;
            font-size: 12px;
            font-style: normal;
            font-weight: normal;
            line-height: normal;
            user-select: none;
            white-space: nowrap;
            padding: 2px 6px;
            border-radius: 3px;
            top: -1.5em;
            left: -2px;
          }
        `;
        document.head.appendChild(style);

        // Focus the editor
        editor.focus();
      } catch (error) {
        console.error("Error initializing Monaco binding:", error);
      }
    };

    initializeBinding();
  };

  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" }
  ];

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (editorRef.current && window.monaco) {
      const model = editorRef.current.getModel();
      if (model) {
        // Change the language of the current model
        window.monaco.editor.setModelLanguage(model, newLanguage);
      }
    }
  };

  const getDefaultContent = (lang) => {
    const templates = {
      javascript: "// Welcome to collaborative coding!\n// Start typing and see real-time changes from other users\n\nfunction hello() {\n    console.log('Hello, collaborative world!');\n}\n\nhello();",
      typescript: "// TypeScript collaborative editor\n// Type-safe coding with real-time collaboration\n\ninterface User {\n    name: string;\n    id: number;\n}\n\nfunction greetUser(user: User): string {\n    return `Hello, ${user.name}!`;\n}",
      python: "# Python collaborative editor\n# Code together in real-time!\n\ndef hello_world():\n    print('Hello from collaborative Python!')\n    return 'Welcome to pair programming'\n\nif __name__ == '__main__':\n    hello_world()",
      java: "// Java collaborative editor\n// Real-time pair programming\n\npublic class CollaborativeCode {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, collaborative Java!\");\n    }\n}",
      cpp: "// C++ collaborative editor\n// Code together in real-time\n\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello, collaborative C++!\" << endl;\n    return 0;\n}",
      html: "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Collaborative HTML</title>\n</head>\n<body>\n    <h1>Welcome to collaborative web development!</h1>\n    <p>Edit this HTML together in real-time.</p>\n</body>\n</html>",
      css: "/* Collaborative CSS Editor */\n/* Style together in real-time! */\n\nbody {\n    font-family: 'Arial', sans-serif;\n    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n    margin: 0;\n    padding: 20px;\n}\n\n.container {\n    max-width: 800px;\n    margin: 0 auto;\n    background: white;\n    border-radius: 10px;\n    padding: 20px;\n    box-shadow: 0 10px 30px rgba(0,0,0,0.1);\n}",
      json: "{\n  \"project\": \"Collaborative Editor\",\n  \"description\": \"Real-time code collaboration\",\n  \"features\": [\n    \"Multi-user editing\",\n    \"Syntax highlighting\",\n    \"Live cursors\",\n    \"Multiple languages\"\n  ],\n  \"users\": {\n    \"connected\": 0,\n    \"active\": true\n  }\n}",
      markdown: "# Collaborative Markdown Editor\n\nWelcome to **real-time collaborative editing**!\n\n## Features\n- ✅ Multi-user editing\n- ✅ Live cursor tracking\n- ✅ Syntax highlighting\n- ✅ Multiple programming languages\n\n## Getting Started\n1. Share the room ID with your collaborators\n2. Start typing and see changes in real-time\n3. Use different programming languages\n\n### Code Example\n```javascript\nfunction collaborate() {\n    console.log('Coding together is awesome!');\n}\n```\n\n> Happy collaborative coding! 🚀",
      sql: "-- Collaborative SQL Editor\n-- Write queries together in real-time!\n\n-- Create a sample table\nCREATE TABLE users (\n    id INTEGER PRIMARY KEY,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE,\n    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n-- Insert sample data\nINSERT INTO users (name, email) VALUES \n('Alice Johnson', 'alice@example.com'),\n('Bob Smith', 'bob@example.com');\n\n-- Query the data\nSELECT * FROM users WHERE created_at >= DATE('now', '-7 days');"
    };
    return templates[lang] || "// Start coding collaboratively!";
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languages.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
          
          <div className="flex items-center space-x-2 text-sm text-gray-300">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-300">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <span>{connectedUsers} user{connectedUsers !== 1 ? 's' : ''} online</span>
          </div>
          
          <div className="text-xs bg-gray-700 px-2 py-1 rounded">
            Room: {roomId}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <Editor
          height="100%"
          language={language}
          defaultValue={getDefaultContent(language)}
          theme="vs-dark"
          onMount={handleMount}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'Fira Code', 'Monaco', 'Menlo', monospace",
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: true,
            smoothScrolling: true,
            contextmenu: true,
            mouseWheelZoom: true,
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            lineDecorationsWidth: 10,
            lineNumbersMinChars: 3,
            renderLineHighlight: "all",
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
            automaticLayout: true,
            formatOnPaste: true,
            formatOnType: true,
            autoIndent: "full",
            tabSize: 2,
            insertSpaces: true,
            wordBasedSuggestions: true,
            parameterHints: {
              enabled: true
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            wordWrap: "on",
            wrappingIndent: "indent",
            colorDecorators: true,
            codeLens: true,
            folding: true,
            foldingStrategy: "indentation",
            showFoldingControls: "always",
            unfoldOnClickAfterEndOfLine: true,
            bracketPairColorization: {
              enabled: true
            }
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Language: {languages.find(l => l.value === language)?.label}</span>
          <span>UTF-8</span>
          <span>LF</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Collaborative Mode</span>
          {isConnected && isInitialized && (
            <span className="text-green-400">● Synced</span>
          )}
          {!isInitialized && (
            <span className="text-yellow-400">● Initializing...</span>
          )}
        </div>
      </div>
    </div>
  );
}