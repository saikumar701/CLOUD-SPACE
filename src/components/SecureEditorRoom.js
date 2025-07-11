import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import IndustryEditor from './IndustryEditor';

const SecureEditorRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomData, setRoomData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser] = useState({
    id: Math.random().toString(36).substr(2, 9),
    name: localStorage.getItem('guestName') || `User_${Math.floor(Math.random() * 1000)}`,
    joinedAt: new Date()
  });

  useEffect(() => {
    // Load room data
    const loadRoomData = () => {
      try {
        const existingRooms = JSON.parse(localStorage.getItem('secureRooms') || '{}');
        const room = existingRooms[roomId];
        
        if (!room) {
          toast.error('Room not found');
          navigate('/dashboard');
          return;
        }

        // Add current user to participants if not already present
        const existingParticipant = room.participants.find(p => p.id === currentUser.id);
        if (!existingParticipant) {
          room.participants.push(currentUser);
          existingRooms[roomId] = room;
          localStorage.setItem('secureRooms', JSON.stringify(existingRooms));
        }

        setRoomData(room);
        setParticipants(room.participants);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading room:', error);
        toast.error('Failed to load room');
        navigate('/dashboard');
      }
    };

    loadRoomData();
  }, [roomId, navigate, currentUser]);

  const leaveRoom = () => {
    // Remove user from participants
    if (roomData) {
      const existingRooms = JSON.parse(localStorage.getItem('secureRooms') || '{}');
      const room = existingRooms[roomId];
      if (room) {
        room.participants = room.participants.filter(p => p.id !== currentUser.id);
        existingRooms[roomId] = room;
        localStorage.setItem('secureRooms', JSON.stringify(existingRooms));
      }
    }
    
    toast.success('Left the room');
    navigate('/dashboard');
  };

  const copyRoomInfo = () => {
    const roomInfo = `Room: ${roomData.name}\nKey: ${roomId}\nPassword: [Ask room creator]`;
    navigator.clipboard.writeText(roomInfo).then(() => {
      toast.success('Room info copied to clipboard');
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium">Loading secure room...</p>
          <p className="text-gray-400 mt-2">Verifying access permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  {roomData.name}
                  <span className="ml-2 bg-green-600 text-xs px-2 py-1 rounded-full">SECURE</span>
                </h1>
                <p className="text-sm text-gray-400">
                  {participants.length}/{roomData.maxParticipants} participants • Room: {roomId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={copyRoomInfo}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Share</span>
              </button>
              
              <button
                onClick={leaveRoom}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Participants Sidebar */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 p-4">
          <h3 className="text-white font-semibold mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Participants ({participants.length})
          </h3>
          
          <div className="space-y-3">
            {participants.map((participant) => (
              <div key={participant.id} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-700">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {participant.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {participant.name}
                    {participant.id === currentUser.id && (
                      <span className="text-xs text-blue-400 ml-1">(You)</span>
                    )}
                  </p>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gray-700 rounded-lg">
            <h4 className="text-white text-sm font-medium mb-2">Room Security</h4>
            <div className="space-y-2 text-xs text-gray-300">
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Password Protected
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Real-time Sync
              </div>
              <div className="flex items-center">
                <svg className="w-3 h-3 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Encrypted Connection
              </div>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <IndustryEditor 
            roomId={roomId} 
            roomData={roomData} 
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  );
};

export default SecureEditorRoom;