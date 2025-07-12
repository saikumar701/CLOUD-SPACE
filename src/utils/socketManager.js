class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.roomData = new Map();
  }

  // Create a mock socket that simulates real-time collaboration
  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = this.createMockSocket();
    this.isConnected = true;
    return this.socket;
  }

  createMockSocket() {
    const mockSocket = {
      id: Math.random().toString(36).substr(2, 9),
      connected: true,
      
      emit: (event, data) => {
        console.log('Socket emit:', event, data);
        
        // Simulate server responses for different events
        setTimeout(() => {
          switch (event) {
            case 'join-room':
              this.handleJoinRoom(data);
              break;
            case 'code-change':
              this.handleCodeChange(data);
              break;
            case 'cursor-change':
              this.handleCursorChange(data);
              break;
            case 'language-change':
              this.handleLanguageChange(data);
              break;
          }
        }, 50); // Simulate network latency
      },

      on: (event, callback) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
      },

      off: (event, callback) => {
        if (this.listeners.has(event)) {
          const callbacks = this.listeners.get(event);
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        }
      },

      disconnect: () => {
        this.connected = false;
        this.isConnected = false;
        this.listeners.clear();
      }
    };

    return mockSocket;
  }

  handleJoinRoom(data) {
    const { roomId, userId, username } = data;
    
    // Get or create room data
    if (!this.roomData.has(roomId)) {
      this.roomData.set(roomId, {
        users: [],
        code: '// Welcome to collaborative coding!\n// Start typing to see real-time synchronization\n\nconsole.log("Hello, collaborative world!");',
        language: 'javascript'
      });
    }

    const room = this.roomData.get(roomId);
    
    // Add user if not already present
    const existingUser = room.users.find(u => u.id === userId);
    if (!existingUser) {
      room.users.push({
        id: userId,
        username,
        cursor: null,
        joinedAt: new Date()
      });
    }

    // Emit events
    this.emit('user-joined', {
      userId,
      username,
      roomId
    });

    this.emit('room-users', {
      users: room.users
    });

    this.emit('code-sync', {
      code: room.code,
      language: room.language
    });
  }

  handleCodeChange(data) {
    const { roomId, code, userId } = data;
    
    if (this.roomData.has(roomId)) {
      const room = this.roomData.get(roomId);
      room.code = code;
      
      // Broadcast to other users
      this.emit('code-change', {
        code,
        userId,
        timestamp: Date.now()
      });
    }
  }

  handleCursorChange(data) {
    const { roomId, cursor, userId } = data;
    
    if (this.roomData.has(roomId)) {
      const room = this.roomData.get(roomId);
      const user = room.users.find(u => u.id === userId);
      if (user) {
        user.cursor = cursor;
      }
      
      this.emit('cursor-change', {
        cursor,
        userId,
        timestamp: Date.now()
      });
    }
  }

  handleLanguageChange(data) {
    const { roomId, language, userId } = data;
    
    if (this.roomData.has(roomId)) {
      const room = this.roomData.get(roomId);
      room.language = language;
      
      this.emit('language-change', {
        language,
        userId,
        timestamp: Date.now()
      });
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Socket event error:', error);
        }
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }
}

// Singleton instance
export const socketManager = new SocketManager();
export default socketManager;