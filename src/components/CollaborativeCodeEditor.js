import React, { useEffect, useRef, useState, useCallback } from 'react';
import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/dracula.css';
import 'codemirror/theme/material.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/clike/clike';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/css/css';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/edit/closetag';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldgutter.css';
import socketManager from '../utils/socketManager';
import roomManager from '../utils/roomManager';
import { toast } from 'react-hot-toast';

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', mode: 'javascript' },
  { value: 'python', label: 'Python', mode: 'python' },
  { value: 'java', label: 'Java', mode: 'text/x-java' },
  { value: 'cpp', label: 'C++', mode: 'text/x-c++src' },
  { value: 'c', label: 'C', mode: 'text/x-csrc' },
  { value: 'html', label: 'HTML', mode: 'xml' },
  { value: 'css', label: 'CSS', mode: 'css' },
  { value: 'json', label: 'JSON', mode: 'application/json' }
];

const THEMES = [
  { value: 'dracula', label: 'Dracula' },
  { value: 'material', label: 'Material' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'default', label: 'Default' }
];

const CollaborativeCodeEditor = ({ roomId, roomData, currentUser }) => {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [currentTheme, setCurrentTheme] = useState('dracula');
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Connecting...');
  const [isRemoteChange, setIsRemoteChange] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    try {
      socketRef.current = socketManager.connect();
      
      if (socketRef.current) {
        setIsConnected(true);
        setSyncStatus('Connected');
        
        // Join room
        socketRef.current.emit('join-room', {
          roomId,
          userId: currentUser.id,
          username: currentUser.name
        });

        // Set up event listeners
        socketRef.current.on('user-joined', (data) => {
          if (data.userId !== currentUser.id) {
            toast.success(`${data.username} joined the room`);
          }
        });

        socketRef.current.on('room-users', (data) => {
          setConnectedUsers(data.users || []);
        });

        socketRef.current.on('code-change', (data) => {
          if (data.userId !== currentUser.id && editorRef.current) {
            setIsRemoteChange(true);
            editorRef.current.setValue(data.code);
            setSyncStatus('Synced');
            setTimeout(() => setSyncStatus('Connected'), 1000);
          }
        });

        socketRef.current.on('code-sync', (data) => {
          if (editorRef.current && data.code) {
            setIsRemoteChange(true);
            editorRef.current.setValue(data.code);
            if (data.language && data.language !== currentLanguage) {
              setCurrentLanguage(data.language);
            }
          }
        });

        socketRef.current.on('language-change', (data) => {
          if (data.userId !== currentUser.id) {
            setCurrentLanguage(data.language);
            toast.success(`Language changed to ${data.language}`);
          }
        });
      }
    } catch (error) {
      console.error('Socket connection error:', error);
      setSyncStatus('Connection failed');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('user-joined');
        socketRef.current.off('room-users');
        socketRef.current.off('code-change');
        socketRef.current.off('code-sync');
        socketRef.current.off('language-change');
      }
    };
  }, [roomId, currentUser]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!textareaRef.current || isInitialized) return;

    try {
      const editor = CodeMirror.fromTextArea(textareaRef.current, {
        mode: LANGUAGES.find(lang => lang.value === currentLanguage)?.mode || 'javascript',
        theme: currentTheme,
        lineNumbers: true,
        autoCloseBrackets: true,
        autoCloseTags: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        matchBrackets: true,
        showCursorWhenSelecting: true,
        styleActiveLine: true,
        value: roomData?.code || '// Welcome to collaborative coding!\n// Start typing to see real-time synchronization\n\nconsole.log("Hello, collaborative world!");'
      });

      editorRef.current = editor;

      // Handle code changes
      editor.on('change', (instance, changeObj) => {
        if (isRemoteChange) {
          setIsRemoteChange(false);
          return;
        }

        const code = instance.getValue();
        
        // Update room data
        roomManager.updateRoomCode(roomId, code);

        // Emit to other users
        if (socketRef.current && isConnected) {
          socketRef.current.emit('code-change', {
            roomId,
            userId: currentUser.id,
            code,
            timestamp: Date.now()
          });
          setSyncStatus('Syncing...');
          setTimeout(() => setSyncStatus('Connected'), 500);
        }
      });

      // Handle cursor changes
      editor.on('cursorActivity', (instance) => {
        const cursor = instance.getCursor();
        if (socketRef.current && isConnected) {
          socketRef.current.emit('cursor-change', {
            roomId,
            userId: currentUser.id,
            cursor: { line: cursor.line, ch: cursor.ch },
            timestamp: Date.now()
          });
        }
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('CodeMirror initialization error:', error);
      toast.error('Failed to initialize editor');
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [currentLanguage, currentTheme, isConnected, roomId, roomData]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    setCurrentLanguage(newLanguage);
    if (editorRef.current) {
      const mode = LANGUAGES.find(lang => lang.value === newLanguage)?.mode || 'javascript';
      editorRef.current.setOption('mode', mode);
      
      // Emit language change to other users
      if (socketRef.current && isConnected) {
        socketRef.current.emit('language-change', {
          roomId,
          userId: currentUser.id,
          language: newLanguage,
          timestamp: Date.now()
        });
      }
    }
  }, [roomId, currentUser.id, isConnected]);

  // Handle theme change
  const handleThemeChange = useCallback((newTheme) => {
    setCurrentTheme(newTheme);
    if (editorRef.current) {
      editorRef.current.setOption('theme', newTheme);
    }
  }, []);

  // Run code function
  const runCode = useCallback(() => {
    if (!editorRef.current) return;
    
    const code = editorRef.current.getValue();
    toast.success('Code execution simulated (connect to backend for real execution)');
    console.log('Executing code:', code);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Enhanced Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <select
              value={currentLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            {/* Theme Selector */}
            <select
              value={currentTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              {THEMES.map((theme) => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>

            {/* Run Button */}
            <button
              onClick={runCode}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h6" />
              </svg>
              <span>Run</span>
            </button>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-300">
            {/* Sync Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                syncStatus === 'Connected' ? 'bg-green-400' :
                syncStatus === 'Syncing...' ? 'bg-yellow-400 animate-pulse' :
                syncStatus === 'Synced' ? 'bg-blue-400' : 'bg-red-400'
              }`}></div>
              <span className="font-medium">{syncStatus}</span>
            </div>

            {/* Connected Users */}
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>{connectedUsers.length} online</span>
            </div>

            {/* Room Info */}
            <div className="bg-blue-600 px-3 py-1 rounded-lg text-xs font-medium">
              Room: {roomId}
            </div>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <textarea
          ref={textareaRef}
          className="hidden"
          defaultValue=""
        />
        
        {!isInitialized && (
          <div className="absolute inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Initializing Collaborative Editor...</p>
              <p className="text-sm text-gray-400 mt-2">Setting up real-time synchronization</p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Language: {LANGUAGES.find(l => l.value === currentLanguage)?.label}</span>
            <span>Theme: {THEMES.find(t => t.value === currentTheme)?.label}</span>
            <span>UTF-8</span>
            <span>Spaces: 2</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span>Google Meet Level Collaboration</span>
            <span className="text-green-400">🔒 Secure</span>
            {isConnected && isInitialized && (
              <span className="text-green-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Real-time Sync Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeCodeEditor;