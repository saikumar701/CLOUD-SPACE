import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const Dashboard = () => {
  const [groupName, setGroupName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [groups, setGroups] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const navigate = useNavigate();

  const userName =
    auth.currentUser?.displayName ||
    localStorage.getItem("guestName") ||
    (() => {
      const guest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("guestName", guest);
      return guest;
    })();

  const userPhoto = auth.currentUser?.photoURL || null;

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "groups"), (snapshot) => {
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return;
    setIsCreating(true);

    try {
      const docRef = await addDoc(collection(db, "groups"), {
        name: groupName,
        createdBy: userName,
        createdAt: new Date(),
        participants: [{
          name: userName,
          photoURL: userPhoto,
          joinedAt: new Date()
        }],
        isActive: true,
        lastActivity: new Date()
      });
      setGroupName("");
      navigate(`/group/${docRef.id}`);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const joinGroup = async () => {
    if (!joinRoomId.trim()) return;
    
    try {
      // Add user to participants list
      const groupRef = doc(db, "groups", joinRoomId);
      await updateDoc(groupRef, {
        participants: arrayUnion({
          name: userName,
          photoURL: userPhoto,
          joinedAt: new Date()
        }),
        lastActivity: new Date()
      });
      
      setJoinRoomId("");
      setShowJoinModal(false);
      navigate(`/group/${joinRoomId}`);
    } catch (error) {
      console.error("Error joining group:", error);
      // Still navigate even if update fails (room might not exist yet)
      navigate(`/group/${joinRoomId}`);
    }
  };

  const handleLogout = () => {
    if (auth.currentUser) signOut(auth);
    localStorage.removeItem("guestName");
    navigate("/");
  };

  const handleDeleteGroup = async (id, e) => {
    e.stopPropagation();
    const confirmed = window.confirm("Are you sure you want to delete this room? This action cannot be undone.");
    if (confirmed) {
      try {
        await deleteDoc(doc(db, "groups", id));
      } catch (error) {
        console.error("Error deleting room: ", error);
        alert("Failed to delete room. Please try again.");
      }
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      // Add user to participants list
      const groupRef = doc(db, "groups", roomId);
      await updateDoc(groupRef, {
        participants: arrayUnion({
          name: userName,
          photoURL: userPhoto,
          joinedAt: new Date()
        }),
        lastActivity: new Date()
      });
    } catch (error) {
      console.error("Error updating participants:", error);
    }
    navigate(`/group/${roomId}`);
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.createdBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (timestamp) => {
    if (!timestamp) return 'No date';
    try {
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getParticipantCount = (participants) => {
    return participants ? participants.length : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {userPhoto ? (
                <img src={userPhoto} alt="Profile" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                  {userName.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Welcome back, {userName}! 👋</h1>
                <p className="text-gray-600">Ready to collaborate and learn together?</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Create Room Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Create New Room</h2>
            </div>
            <p className="text-gray-600 mb-4">Start a new study session with collaborative tools</p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Enter room name (e.g., 'JavaScript Study Group')"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                onKeyDown={(e) => e.key === 'Enter' && createGroup()}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createGroup}
                disabled={isCreating || !groupName.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  'Create Room'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Join Room Card */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800">Join Existing Room</h2>
            </div>
            <p className="text-gray-600 mb-4">Enter a room ID to join an ongoing session</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowJoinModal(true)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
            >
              Join Room
            </motion.button>
          </motion.div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search rooms by name or creator..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Available Study Rooms ({filteredGroups.length})
          </h2>
        </div>

        <AnimatePresence>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                whileHover={{ scale: 1.03, y: -5 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 cursor-pointer transition-all duration-300"
                onClick={() => handleJoinRoom(group.id)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800 line-clamp-2">
                      {group.name}
                    </h3>
                    {group.createdBy === userName && (
                      <button
                        onClick={(e) => handleDeleteGroup(group.id, e)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete room"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Created by {group.createdBy}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a1 1 0 011 1v1a1 1 0 01-1 1v9a2 2 0 01-2 2H7a2 2 0 01-2-2V10a1 1 0 01-1-1V8a1 1 0 011-1h3z" />
                      </svg>
                      {formatDate(group.createdAt)}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {getParticipantCount(group.participants)} participants
                    </div>
                  </div>

                  {/* Participants Preview */}
                  {group.participants && group.participants.length > 0 && (
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="flex -space-x-2">
                        {group.participants.slice(0, 3).map((participant, index) => (
                          <div key={index} className="relative">
                            {participant.photoURL ? (
                              <img
                                src={participant.photoURL}
                                alt={participant.name}
                                className="w-8 h-8 rounded-full border-2 border-white"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                {participant.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                        ))}
                        {group.participants.length > 3 && (
                          <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                            +{group.participants.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-400 mb-3">
                    Room ID: {group.id}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-4 flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Join Study Session</span>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No rooms found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first study room to get started!'}
            </p>
          </div>
        )}
      </div>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-gray-800 mb-4">Join Study Room</h3>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                onKeyDown={(e) => e.key === 'Enter' && joinGroup()}
                autoFocus
              />
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={joinGroup}
                  disabled={!joinRoomId.trim()}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Join Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;