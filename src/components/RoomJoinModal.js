import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import bcrypt from 'bcryptjs';

const RoomJoinModal = ({ onJoinRoom, onClose }) => {
  const [joinData, setJoinData] = useState({
    roomKey: '',
    password: ''
  });
  const [isJoining, setIsJoining] = useState(false);

  const joinSecureRoom = async () => {
    if (!joinData.roomKey.trim() || !joinData.password.trim()) {
      toast.error('Room key and password are required');
      return;
    }

    setIsJoining(true);

    try {
      const existingRooms = JSON.parse(localStorage.getItem('secureRooms') || '{}');
      const room = existingRooms[joinData.roomKey.toUpperCase()];

      if (!room) {
        toast.error('Room not found');
        setIsJoining(false);
        return;
      }

      const passwordMatch = await bcrypt.compare(joinData.password, room.password);
      if (!passwordMatch) {
        toast.error('Invalid password');
        setIsJoining(false);
        return;
      }

      if (room.participants.length >= room.maxParticipants) {
        toast.error('Room is full');
        setIsJoining(false);
        return;
      }

      toast.success('Joining secure room...');
      onJoinRoom(room);
    } catch (error) {
      console.error('Error joining room:', error);
      toast.error('Failed to join room');
    } finally {
      setIsJoining(false);
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
          <h2 className="text-2xl font-bold text-gray-800">Join Secure Room</h2>
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
              Room Key
            </label>
            <input
              type="text"
              value={joinData.roomKey}
              onChange={(e) => setJoinData({ ...joinData, roomKey: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Enter room key (e.g., ABC123DEF456)"
              maxLength={12}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Password
            </label>
            <input
              type="password"
              value={joinData.password}
              onChange={(e) => setJoinData({ ...joinData, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter room password"
              onKeyDown={(e) => e.key === 'Enter' && joinSecureRoom()}
            />
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
            onClick={joinSecureRoom}
            disabled={isJoining}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Need the room key and password?</p>
              <p className="mt-1">Ask the room creator to share the secure credentials with you.</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RoomJoinModal;