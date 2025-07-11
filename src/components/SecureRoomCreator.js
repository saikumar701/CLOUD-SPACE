import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const SecureRoomCreator = ({ onRoomCreated, onClose }) => {
  const [roomData, setRoomData] = useState({
    name: '',
    password: '',
    maxParticipants: 10,
    isPrivate: true
  });
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomKey = () => {
    return Math.random().toString(36).substr(2, 12).toUpperCase();
  };

  const createSecureRoom = async () => {
    if (!roomData.name.trim() || !roomData.password.trim()) {
      toast.error('Room name and password are required');
      return;
    }

    if (roomData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsCreating(true);

    try {
      const roomKey = generateRoomKey();
      const hashedPassword = await bcrypt.hash(roomData.password, 10);
      
      const secureRoom = {
        id: roomKey,
        name: roomData.name,
        password: hashedPassword,
        maxParticipants: roomData.maxParticipants,
        isPrivate: roomData.isPrivate,
        createdAt: new Date(),
        participants: [],
        code: '// Welcome to secure collaborative coding!\n// This room is password protected\n\nconsole.log("Hello, secure world!");'
      };

      // Store in localStorage for demo (in production, use secure backend)
      const existingRooms = JSON.parse(localStorage.getItem('secureRooms') || '{}');
      existingRooms[roomKey] = secureRoom;
      localStorage.setItem('secureRooms', JSON.stringify(existingRooms));

      toast.success('Secure room created successfully!');
      onRoomCreated(secureRoom);
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Secure Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomData.name}
              onChange={(e) => setRoomData({ ...roomData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter room name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Password
            </label>
            <input
              type="password"
              value={roomData.password}
              onChange={(e) => setRoomData({ ...roomData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter secure password (min 6 chars)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Participants
            </label>
            <select
              value={roomData.maxParticipants}
              onChange={(e) => setRoomData({ ...roomData, maxParticipants: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5 participants</option>
              <option value={10}>10 participants</option>
              <option value={20}>20 participants</option>
              <option value={50}>50 participants</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrivate"
              checked={roomData.isPrivate}
              onChange={(e) => setRoomData({ ...roomData, isPrivate: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
              Private room (hidden from public list)
            </label>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={createSecureRoom}
            disabled={isCreating}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating...' : 'Create Room'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700">
              <p className="font-medium">Security Features:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Password-protected access</li>
                <li>Unique room keys</li>
                <li>Participant limits</li>
                <li>Private room option</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SecureRoomCreator;