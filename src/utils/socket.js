import { io } from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    // Use a mock socket for demo purposes since we don't have a real server
    this.socket = this.createMockSocket();
    this.isConnected = true;
    return this.socket;
  }

  createMockSocket() {
    const mockSocket = {
      id: Math.random().toString(36).substr(2, 9),
      connected: true,
      listeners: {},
      
      emit: (event, data) => {
        console.log('Socket emit:', event, data);
        // Simulate server response for demo
        setTimeout(() => {
          if (event === 'join-room') {
            this.trigger('user-joined', {
              userId: data.userId,
              username: data.username,
              roomId: data.roomId
            });
            this.trigger('room-users', {
              users: [
                { id: data.userId, username: data.username, cursor: null }
              ]
            });
          } else if (event === 'code-change') {
            // Broadcast to other mock users
            this.trigger('code-change', data);
          } else if (event === 'cursor-change') {
            this.trigger('cursor-change', data);
          }
        }, 100);
      },

      on: (event, callback) => {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
      },

      off: (event, callback) => {
        if (this.listeners[event]) {
          this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
      },

      trigger: (event, data) => {
        if (this.listeners[event]) {
          this.listeners[event].forEach(callback => callback(data));
        }
      },

      disconnect: () => {
        this.connected = false;
        this.listeners = {};
      }
    };

    return mockSocket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketManager = new SocketManager();
export default socketManager;