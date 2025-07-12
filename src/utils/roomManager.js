import bcrypt from 'bcryptjs';

class RoomManager {
  constructor() {
    this.rooms = this.loadRooms();
  }

  loadRooms() {
    try {
      const stored = localStorage.getItem('secureRooms');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading rooms:', error);
      return {};
    }
  }

  saveRooms() {
    try {
      localStorage.setItem('secureRooms', JSON.stringify(this.rooms));
    } catch (error) {
      console.error('Error saving rooms:', error);
    }
  }

  generateRoomKey() {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  }

  async createRoom(roomData) {
    try {
      const roomKey = this.generateRoomKey();
      const hashedPassword = await bcrypt.hash(roomData.password, 10);
      
      const room = {
        id: roomKey,
        name: roomData.name,
        password: hashedPassword,
        maxParticipants: roomData.maxParticipants || 10,
        isPrivate: roomData.isPrivate || false,
        createdAt: new Date().toISOString(),
        participants: [],
        code: '// Welcome to secure collaborative coding!\n// This room is password protected\n\nconsole.log("Hello, secure world!");',
        language: 'javascript'
      };

      this.rooms[roomKey] = room;
      this.saveRooms();
      
      return { success: true, room };
    } catch (error) {
      console.error('Error creating room:', error);
      return { success: false, error: 'Failed to create room' };
    }
  }

  async joinRoom(roomKey, password, user) {
    try {
      const room = this.rooms[roomKey];
      
      if (!room) {
        return { success: false, error: 'Room not found' };
      }

      const passwordMatch = await bcrypt.compare(password, room.password);
      if (!passwordMatch) {
        return { success: false, error: 'Invalid password' };
      }

      // Check if user already in room
      const existingParticipant = room.participants.find(p => p.id === user.id);
      if (existingParticipant) {
        return { success: true, room, alreadyJoined: true };
      }

      // Check participant limit
      if (room.participants.length >= room.maxParticipants) {
        return { success: false, error: 'Room is full' };
      }

      // Add user to room
      room.participants.push({
        ...user,
        joinedAt: new Date().toISOString()
      });

      this.saveRooms();
      
      return { success: true, room };
    } catch (error) {
      console.error('Error joining room:', error);
      return { success: false, error: 'Failed to join room' };
    }
  }

  leaveRoom(roomKey, userId) {
    try {
      const room = this.rooms[roomKey];
      if (room) {
        room.participants = room.participants.filter(p => p.id !== userId);
        this.saveRooms();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }

  updateRoomCode(roomKey, code) {
    try {
      const room = this.rooms[roomKey];
      if (room) {
        room.code = code;
        this.saveRooms();
      }
    } catch (error) {
      console.error('Error updating room code:', error);
    }
  }

  getRoomsByUser(userId) {
    try {
      return Object.values(this.rooms).filter(room => 
        room.participants.some(p => p.id === userId)
      );
    } catch (error) {
      console.error('Error getting user rooms:', error);
      return [];
    }
  }
}

export const roomManager = new RoomManager();
export default roomManager;