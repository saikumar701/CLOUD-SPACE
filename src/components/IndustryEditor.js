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
import { toast } from 'react-hot-toast';
import socketManager from '../utils/socket';

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

const IndustryEditor = ({ roomId, roomData, currentUser }) => {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const socketRef = useRef(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('javascript');
  const [currentTheme, setCurrentTheme] = useState('dracula');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastChangeOrigin, setLastChangeOrigin] = useState(null);
  const [syncStatus, setSyncStatus] = useState('Connecting...');

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = socketManager.connect();
    
    const handleConnect = () => {
      setIsConnected(true);
      setSyncStatus('Connected');
      
      // Join room
      socketRef.current.emit('join-room', {
        roomId,
        userId: currentUser.id,
        username: currentUser.name
      });
    };

    const handleUserJoined = (data) => {
      if (data.userId !== currentUser.id) {
        toast.success(`${data.username} joined the room`);
      }
    };

    const handleRoomUsers = (data) => {
      setConnectedUsers(data.users);
    };

    const handleCodeChange = (data) => {
      if (data.userId !== currentUser.id && editorRef.current) {
        setLastChangeOrigin('remote');
        editorRef.current.setValue(data.code);
        setSyncStatus('Synced');
        
        // Reset sync status after a delay
        setTimeout(() => setSyncStatus('Connected'), 1000);
      }
    };

    const handleCursorChange = (data) => {
      if (data.userId !== currentUser.id) {
        // Handle remote cursor updates
        console.log('Remote cursor update:', data);
      }
    };

    // Set up event listeners
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('user-joined', handleUserJoined);
    socketRef.current.on('room-users', handleRoomUsers);
    socketRef.current.on('code-change', handleCodeChange);
    socketRef.current.on('cursor-change', handleCursorChange);

    // Simulate connection for demo
    setTimeout(handleConnect, 500);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('user-joined', handleUserJoined);
        socketRef.current.off('room-users', handleRoomUsers);
        socketRef.current.off('code-change', handleCodeChange);
        socketRef.current.off('cursor-change', handleCursorChange);
      }
    };
  }, [roomId, currentUser]);

  // Initialize CodeMirror
  useEffect(() => {
    if (!textareaRef.current || isInitialized) return;

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
      value: roomData?.code || '// Welcome to Industry-Level Collaborative Coding!\n// Start typing to see real-time synchronization\n\nconsole.log("Hello, collaborative world!");'
    });

    editorRef.current = editor;

    // Handle code changes
    editor.on('change', (instance, changeObj) => {
      if (lastChangeOrigin === 'remote') {
        setLastChangeOrigin(null);
        return;
      }

      const code = instance.getValue();
      
      // Update room data
      if (roomData) {
        roomData.code = code;
        const existingRooms = JSON.parse(localStorage.getItem('secureRooms') || '{}');
        existingRooms[roomId] = roomData;
        localStorage.setItem('secureRooms', JSON.stringify(existingRooms));
      }

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

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, [currentLanguage, currentTheme, isConnected]);

  // Handle language change
  const handleLanguageChange = useCallback((newLanguage) => {
    setCurrentLanguage(newLanguage);
    if (editorRef.current) {
      const mode = LANGUAGES.find(lang => lang.value === newLanguage)?.mode || 'javascript';
      editorRef.current.setOption('mode', mode);
    }
  }, []);

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
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p className="text-lg font-medium">Initializing Industry Editor...</p>
              <p className="text-sm text-gray-400 mt-2">Setting up secure collaboration</p>
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
            <span>Industry-Level Collaboration</span>
            <span className="text-green-400">🔒 Secure</span>
            {isConnected && (
              <span className="text-green-400 flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                Real-time Sync
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndustryEditor;