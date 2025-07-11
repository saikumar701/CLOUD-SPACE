import React, { useEffect, useRef, useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

export default function CollaborativeEditor({ roomId }) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const awarenessRef = useRef(null);
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [isInitialized, setIsInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");
  const [userCursors, setUserCursors] = useState(new Map());

  // Generate consistent user info
  const userInfo = useRef({
    name: localStorage.getItem("guestName") || `User_${Math.floor(Math.random() * 1000)}`,
    color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 50%)`,
    id: Math.random().toString(36).substr(2, 9)
  });

  // Initialize Yjs document and WebRTC provider
  const initializeCollaboration = useCallback(() => {
    try {
      // Clean up existing connections
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (providerRef.current) {
        providerRef.current.destroy();
        providerRef.current = null;
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
        ydocRef.current = null;
      }

      // Create new Yjs document
      ydocRef.current = new Y.Doc();
      
      // Create WebRTC provider with multiple signaling servers
      providerRef.current = new WebrtcProvider(
        `studyhub-editor-${roomId}`,
        ydocRef.current,
        {
          signaling: [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com'
          ],
          password: null,
          maxConns: 20,
          filterBcConns: true,
          peerOpts: {
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
              ]
            }
          }
        }
      );

      awarenessRef.current = providerRef.current.awareness;

      // Set up connection status tracking
      providerRef.current.on('status', (event) => {
        console.log('Provider status:', event.status);
        setIsConnected(event.status === 'connected');
        setConnectionStatus(event.status === 'connected' ? 'Connected' : 'Connecting...');
        
        if (event.status === 'connected') {
          setupAwareness();
        }
      });

      // Set up peer tracking
      providerRef.current.on('peers', (event) => {
        console.log('Peers changed:', event);
        updateConnectedUsers();
      });

      // Initial setup
      setTimeout(() => {
        setupAwareness();
        updateConnectedUsers();
      }, 1000);

    } catch (error) {
      console.error('Error initializing collaboration:', error);
      setConnectionStatus('Connection failed');
    }
  }, [roomId]);

  // Set up awareness (user presence)
  const setupAwareness = useCallback(() => {
    if (!awarenessRef.current) return;

    try {
      // Set local user state
      awarenessRef.current.setLocalStateField('user', {
        name: userInfo.current.name,
        color: userInfo.current.color,
        id: userInfo.current.id
      });

      // Listen for awareness changes
      awarenessRef.current.on('change', (changes) => {
        console.log('Awareness changed:', changes);
        updateConnectedUsers();
        updateUserCursors();
      });

      console.log('Awareness set up successfully');
    } catch (error) {
      console.error('Error setting up awareness:', error);
    }
  }, []);

  // Update connected users count
  const updateConnectedUsers = useCallback(() => {
    if (!awarenessRef.current) return;
    
    try {
      const states = awarenessRef.current.getStates();
      setConnectedUsers(states.size);
      console.log('Connected users:', states.size);
    } catch (error) {
      console.error('Error updating connected users:', error);
    }
  }, []);

  // Update user cursors
  const updateUserCursors = useCallback(() => {
    if (!awarenessRef.current) return;

    try {
      const states = awarenessRef.current.getStates();
      const cursors = new Map();
      
      states.forEach((state, clientId) => {
        if (state.user && clientId !== awarenessRef.current.clientID) {
          cursors.set(clientId, state.user);
        }
      });
      
      setUserCursors(cursors);
    } catch (error) {
      console.error('Error updating user cursors:', error);
    }
  }, []);

  // Handle Monaco editor mount
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    console.log('Editor mounted, setting up collaboration...');
    
    // Wait a bit for everything to be ready
    setTimeout(() => {
      setupMonacoBinding();
    }, 1500);
  }, []);

  // Set up Monaco binding for real-time collaboration
  const setupMonacoBinding = useCallback(() => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) {
      console.log('Not ready for binding yet...');
      setTimeout(setupMonacoBinding, 500);
      return;
    }

    try {
      // Get the shared text type
      const yText = ydocRef.current.getText('monaco-content');
      
      // Create Monaco binding
      bindingRef.current = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        awarenessRef.current
      );

      console.log('Monaco binding created successfully');
      setIsInitialized(true);

      // Add custom styles for collaborative cursors
      addCollaborativeCursorStyles();

      // Focus editor
      editorRef.current.focus();

    } catch (error) {
      console.error('Error setting up Monaco binding:', error);
      // Retry after a delay
      setTimeout(setupMonacoBinding, 1000);
    }
  }, []);

  // Add CSS for collaborative cursors
  const addCollaborativeCursorStyles = useCallback(() => {
    const styleId = 'collaborative-cursor-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .yRemoteSelection {
        background-color: rgba(255, 255, 0, 0.2);
        pointer-events: none;
      }
      
      .yRemoteSelectionHead {
        position: absolute;
        border-left: 2px solid;
        border-top: 2px solid;
        border-bottom: 2px solid;
        height: 100%;
        box-sizing: border-box;
        pointer-events: none;
      }
      
      .yRemoteSelectionHead::after {
        position: absolute;
        content: attr(data-yjs-user);
        color: white;
        background-color: inherit;
        font-size: 11px;
        font-weight: 500;
        line-height: 1.2;
        user-select: none;
        white-space: nowrap;
        padding: 2px 6px;
        border-radius: 3px;
        top: -1.8em;
        left: -2px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        z-index: 1000;
      }
      
      .yRemoteSelectionHead[data-yjs-user=""] {
        display: none;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLanguage);
      }
    }
  }, []);

  // Initialize collaboration on mount
  useEffect(() => {
    initializeCollaboration();

    // Cleanup on unmount
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
  }, [initializeCollaboration]);

  // Language options
  const languages = [
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "cpp", label: "C++" },
    { value: "csharp", label: "C#" },
    { value: "html", label: "HTML" },
    { value: "css", label: "CSS" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
    { value: "sql", label: "SQL" },
    { value: "php", label: "PHP" },
    { value: "go", label: "Go" },
    { value: "rust", label: "Rust" }
  ];

  // Get default content for language
  const getDefaultContent = (lang) => {
    const templates = {
      javascript: `// 🚀 Collaborative JavaScript Editor
// Real-time code collaboration - changes sync instantly!

function welcomeMessage() {
    console.log('Welcome to collaborative coding!');
    console.log('Start typing and see real-time changes from other users');
}

// Try editing this code with multiple users
const users = ['Alice', 'Bob', 'Charlie'];
users.forEach(user => {
    console.log(\`Hello, \${user}! Ready to code together?\`);
});

welcomeMessage();`,

      typescript: `// 🚀 Collaborative TypeScript Editor
// Type-safe collaborative coding with real-time sync

interface User {
    id: string;
    name: string;
    isOnline: boolean;
}

interface CollaborativeSession {
    roomId: string;
    users: User[];
    startTime: Date;
}

function createSession(roomId: string): CollaborativeSession {
    return {
        roomId,
        users: [],
        startTime: new Date()
    };
}

// Real-time collaboration in action!
const session = createSession('${roomId}');
console.log('Session created:', session);`,

      python: `# 🚀 Collaborative Python Editor
# Real-time pair programming made easy!

def welcome_to_collaboration():
    """Welcome message for collaborative coding"""
    print("🎉 Welcome to real-time Python collaboration!")
    print("Changes sync instantly across all users")
    return "Happy coding together!"

# Try editing this with multiple users
users = ["Alice", "Bob", "Charlie"]
for user in users:
    print(f"Hello, {user}! Ready to code together?")

# Collaborative functions
def fibonacci(n):
    """Generate Fibonacci sequence collaboratively"""
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

if __name__ == "__main__":
    welcome_to_collaboration()
    print("Fibonacci(10):", fibonacci(10))`,

      java: `// 🚀 Collaborative Java Editor
// Enterprise-level real-time code collaboration

public class CollaborativeCode {
    private static final String ROOM_ID = "${roomId}";
    
    public static void main(String[] args) {
        System.out.println("🎉 Welcome to collaborative Java coding!");
        System.out.println("Room ID: " + ROOM_ID);
        
        CollaborativeSession session = new CollaborativeSession();
        session.startCoding();
    }
}

class CollaborativeSession {
    public void startCoding() {
        System.out.println("Starting collaborative session...");
        System.out.println("Changes sync in real-time!");
        
        // Try editing this with multiple users
        String[] users = {"Alice", "Bob", "Charlie"};
        for (String user : users) {
            System.out.println("Hello, " + user + "! Ready to code together?");
        }
    }
}`,

      html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Collaborative HTML Editor</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255, 255, 255, 0.1);
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(10px);
        }
        .highlight {
            background: rgba(255, 255, 0, 0.3);
            padding: 2px 4px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Welcome to Collaborative Web Development!</h1>
        <p>This HTML editor supports <span class="highlight">real-time collaboration</span>.</p>
        <p>Multiple users can edit this HTML simultaneously and see changes instantly!</p>
        
        <h2>Features:</h2>
        <ul>
            <li>✅ Real-time synchronization</li>
            <li>✅ Multi-user editing</li>
            <li>✅ Live cursor tracking</li>
            <li>✅ Instant updates</li>
        </ul>
        
        <p><strong>Room ID:</strong> ${roomId}</p>
        <p><em>Start editing and invite others to collaborate!</em></p>
    </div>
</body>
</html>`
    };
    
    return templates[lang] || `// 🚀 Collaborative ${lang.toUpperCase()} Editor\n// Start coding together in real-time!\n\nconsole.log('Welcome to collaborative coding!');`;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Enhanced Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
            
            {/* Connection Status */}
            <div className="flex items-center space-x-2 text-sm">
              <div className={`w-3 h-3 rounded-full transition-colors ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`}></div>
              <span className={`font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                {connectionStatus}
              </span>
            </div>

            {/* Sync Status */}
            {isInitialized && (
              <div className="flex items-center space-x-2 text-sm text-green-400">
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Live Sync</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-300">
            {/* Connected Users */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span className="font-medium">
                {connectedUsers} user{connectedUsers !== 1 ? 's' : ''} online
              </span>
            </div>
            
            {/* Room Info */}
            <div className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="text-xs font-mono">Room: {roomId}</span>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2 bg-blue-600 px-3 py-1 rounded-lg">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: userInfo.current.color }}
              ></div>
              <span className="text-xs font-medium">{userInfo.current.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          defaultValue={getDefaultContent(language)}
          theme="vs-dark"
          onMount={handleEditorDidMount}
          options={{
            // Core editor options
            fontSize: 14,
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Monaco', 'Menlo', monospace",
            fontLigatures: true,
            lineHeight: 1.6,
            
            // Layout options
            automaticLayout: true,
            wordWrap: "on",
            wrappingIndent: "indent",
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            
            // Visual options
            minimap: { enabled: true, scale: 1 },
            lineNumbers: "on",
            glyphMargin: true,
            folding: true,
            renderWhitespace: "selection",
            renderLineHighlight: "all",
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: true,
            roundedSelection: false,
            
            // Editing options
            autoIndent: "full",
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 2,
            insertSpaces: true,
            
            // IntelliSense options
            wordBasedSuggestions: true,
            parameterHints: { enabled: true },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            
            // Advanced options
            colorDecorators: true,
            codeLens: true,
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: true,
              indentation: true
            },
            
            // Collaboration-specific options
            readOnly: false,
            contextmenu: true,
            mouseWheelZoom: true,
            multiCursorModifier: "ctrlCmd",
            selectionHighlight: true,
            occurrencesHighlight: true
          }}
        />
        
        {/* Loading Overlay */}
        {!isInitialized && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Initializing Collaboration...</p>
              <p className="text-sm text-gray-400 mt-2">Setting up real-time sync</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Language: {languages.find(l => l.value === language)?.label}</span>
            <span>UTF-8</span>
            <span>LF</span>
            <span>Spaces: 2</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Collaborative Mode</span>
            {isConnected && isInitialized && (
              <span className="text-green-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Live Sync Active
              </span>
            )}
            {!isInitialized && (
              <span className="text-yellow-400 flex items-center">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-1"></div>
                Initializing...
              </span>
            )}
            {!isConnected && isInitialized && (
              <span className="text-red-400 flex items-center">
                <div className="w-2 h-2 bg-red-400 rounded-full mr-1"></div>
                Connection Lost
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}