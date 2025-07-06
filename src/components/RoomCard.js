import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarGroup, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

const RoomCard = ({ room, onDelete, currentUser }) => {
  const navigate = useNavigate();
  const isOwner = room.createdBy === currentUser;

  // Safe date formatting function
  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    
    try {
      // If it's a Firestore timestamp
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      // If it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      // If it's a string
      if (typeof timestamp === 'string') {
        return new Date(timestamp).toLocaleDateString();
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Safe participant handling
  const renderParticipants = () => {
    if (!room.participants || !Array.isArray(room.participants)) {
      return null;
    }

    return (
      <div className="mt-4">
        <div className="text-xs text-gray-400 mb-1">Participants:</div>
        <AvatarGroup max={4}>
          {room.participants.map((user, index) => (
            <Avatar 
              key={index} 
              alt={user?.name || 'Unknown'} 
              src={user?.photoURL}
            >
              {user?.name?.charAt(0) || '?'}
            </Avatar>
          ))}
        </AvatarGroup>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="p-5">
        <div className="flex justify-between items-start">
          <h3 
            className="text-xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
            onClick={() => navigate(`/group/${room.id}`)}
          >
            {room.name || 'Unnamed Room'}
          </h3>
          {isOwner && (
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(room.id);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Delete />
            </IconButton>
          )}
        </div>
        
        <div className="mt-3 flex items-center text-sm text-gray-500">
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {room.createdBy || 'Unknown'}
          </span>
          <span className="mx-2">•</span>
          <span>{formatDate(room.createdAt)}</span>
        </div>

        {renderParticipants()}
      </div>
      
      <div 
        className="bg-gray-50 px-5 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={() => navigate(`/group/${room.id}`)}
      >
        <span className="text-sm font-medium text-blue-600">Join Room</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default RoomCard;