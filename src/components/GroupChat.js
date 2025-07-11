import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import CollaborativeEditor from "./CollaborativeEditor";
import EditorWindow from "./EditorWindow";
import WhiteboardWindow from "./WhiteboardWindow";
import { motion, AnimatePresence } from "framer-motion";

const GroupChat = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const userName =
    auth.currentUser?.displayName ||
    localStorage.getItem("guestName") ||
    `Guest_${Math.floor(1000 + Math.random() * 9000)}`;

  const userPhoto = auth.currentUser?.photoURL || null;

  useEffect(() => {
    // Listen to room info
    const roomRef = doc(db, "groups", roomId);
    const unsubRoom = onSnapshot(roomRef, (doc) => {
      if (doc.exists()) {
        setRoomInfo({ id: doc.id, ...doc.data() });
      }
    });

    // Listen to messages
    const q = query(
      collection(db, "groups", roomId, "messages"),
      orderBy("createdAt")
    );
    const unsubMessages = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    // Add user to participants when joining
    const addUserToRoom = async () => {
      try {
        await updateDoc(roomRef, {
          participants: arrayUnion({
            name: userName,
            photoURL: userPhoto,
            joinedAt: new Date(),
            lastSeen: new Date()
          }),
          lastActivity: new Date()
        });
      } catch (error) {
        console.error("Error adding user to room:", error);
      }
    };

    addUserToRoom();

    return () => {
      unsubRoom();
      unsubMessages();
    };
  }, [roomId, userName, userPhoto]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    try {
      await addDoc(collection(db, "groups", roomId, "messages"), {
        text: newMsg,
        sender: userName,
        senderPhoto: userPhoto,
        createdAt: serverTimestamp(),
        type: "text"
      });
      setNewMsg("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return "";
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      if (messageDate.getTime() === todayDate.getTime()) {
        return "Today";
      } else if (messageDate.getTime() === todayDate.getTime() - 86400000) {
        return "Yesterday";
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return "";
    }
  };

  const groupMessagesByDate = (messages) => {
    const grouped = {};
    messages.forEach(message => {
      const dateKey = formatDate(message.createdAt);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {roomInfo?.name || `Room ${roomId}`}
                </h1>
                <p className="text-sm text-gray-600">
                  {roomInfo?.participants?.length || 0} participants • Room ID: {roomId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWhiteboard(true)}
                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Whiteboard</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditor(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Code Editor</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Participants Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Participants ({roomInfo?.participants?.length || 0})
              </h3>
              <div className="space-y-3">
                {roomInfo?.participants?.map((participant, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    {participant.photoURL ? (
                      <img
                        src={participant.photoURL}
                        alt={participant.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {participant.name?.charAt(0) || '?'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {participant.name}
                        {participant.name === userName && (
                          <span className="text-xs text-blue-600 ml-1">(You)</span>
                        )}
                      </p>
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                        <span className="text-xs text-gray-500">Online</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg flex flex-col h-[600px]">
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-800 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Group Chat
                </h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                    <div key={date}>
                      {/* Date Separator */}
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {date}
                        </div>
                      </div>

                      {/* Messages for this date */}
                      {dateMessages.map((msg, index) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className={`flex ${msg.sender === userName ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${msg.sender === userName ? 'flex-row-reverse space-x-reverse' : ''}`}>
                            {/* Avatar */}
                            {msg.sender !== userName && (
                              <div className="flex-shrink-0">
                                {msg.senderPhoto ? (
                                  <img
                                    src={msg.senderPhoto}
                                    alt={msg.sender}
                                    className="w-8 h-8 rounded-full"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    {msg.sender?.charAt(0) || '?'}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`rounded-2xl px-4 py-2 ${
                              msg.sender === userName
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-800 rounded-bl-md'
                            }`}>
                              {msg.sender !== userName && (
                                <p className="text-xs font-medium text-gray-600 mb-1">
                                  {msg.sender}
                                </p>
                              )}
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.text}
                              </p>
                              <p className={`text-xs mt-1 ${
                                msg.sender === userName ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                {formatTime(msg.createdAt)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <textarea
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                      rows="1"
                      style={{ minHeight: '44px', maxHeight: '120px' }}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!newMsg.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <EditorWindow roomId={roomId} onClose={() => setShowEditor(false)} />
        )}
      </AnimatePresence>

      {/* Whiteboard Modal */}
      <AnimatePresence>
        {showWhiteboard && (
          <WhiteboardWindow roomId={roomId} onClose={() => setShowWhiteboard(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupChat;