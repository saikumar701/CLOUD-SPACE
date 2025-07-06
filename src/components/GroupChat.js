import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import CollaborativeEditor from "./CollaborativeEditor";
import EditorWindow from "./EditorWindow";

const GroupChat = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const bottomRef = useRef(null);

  const userName =
    auth.currentUser?.displayName ||
    localStorage.getItem("guestName") ||
    `Guest_${Math.floor(1000 + Math.random() * 9000)}`;

  useEffect(() => {
    const q = query(
      collection(db, "groups", roomId, "messages"),
      orderBy("createdAt")
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    await addDoc(collection(db, "groups", roomId, "messages"), {
      text: newMsg,
      sender: userName,
      createdAt: serverTimestamp(),
    });
    setNewMsg("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Chat Section */}
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Room: {roomId} - Chat</h1>
          <button
            onClick={() => setShowEditor(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Open Editor
          </button>
        </div>

        <div className="h-96 overflow-y-auto mb-4 border rounded p-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-2 my-1 rounded max-w-md break-words ${
                msg.sender === userName
                  ? "bg-blue-100 ml-auto text-right"
                  : "bg-gray-100 mr-auto text-left"
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={handleKeyDown}
            className="px-3 py-2 border rounded w-full"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <EditorWindow roomId={roomId} onClose={() => setShowEditor(false)} />
      )}
    </div>
  );
};

export default GroupChat;