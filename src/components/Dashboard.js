import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [groupName, setGroupName] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [groups, setGroups] = useState([]);
  const navigate = useNavigate();

  const userName =
    auth.currentUser?.displayName ||
    localStorage.getItem("guestName") ||
    (() => {
      const guest = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem("guestName", guest);
      return guest;
    })();

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "groups"), (snapshot) => {
      setGroups(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const createGroup = async () => {
    if (!groupName.trim()) return;

    const docRef = await addDoc(collection(db, "groups"), {
      name: groupName,
      createdBy: userName,
    });
    setGroupName("");
    navigate(`/group/${docRef.id}`);
  };

  const joinGroup = () => {
    if (!joinRoomId.trim()) return;
    navigate(`/group/${joinRoomId}`);
  };

  const handleLogout = () => {
    if (auth.currentUser) signOut(auth);
    localStorage.removeItem("guestName");
    navigate("/");
  };

  const handleDeleteGroup = async (id, e) => {
    e.stopPropagation(); // Prevent navigation when clicking delete button
    const confirmed = window.confirm("Are you sure you want to delete this room? This action cannot be undone.");
    if (confirmed) {
      try {
        // First delete the room document
        await deleteDoc(doc(db, "groups", id));
        
        // Optional: You might want to delete all messages in the room too
        // This would require additional Firestore queries
      } catch (error) {
        console.error("Error deleting room: ", error);
        alert("Failed to delete room. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Hi, {userName} 👋</h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="New group name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="px-3 py-2 border rounded w-full"
        />
        <button
          onClick={createGroup}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
          className="px-3 py-2 border rounded w-full"
        />
        <button
          onClick={joinGroup}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((group) => (
          <div
            key={group.id}
            className="bg-white p-4 rounded shadow relative cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => navigate(`/group/${group.id}`)}
          >
            <h2 className="text-lg font-semibold">
              {group.name}
            </h2>
            <p className="text-sm text-gray-500">
              Created by: {group.createdBy}
            </p>
            <p className="text-xs text-gray-400">Room ID: {group.id}</p>

            {group.createdBy === userName && (
              <button
                onClick={(e) => handleDeleteGroup(group.id, e)}
                className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                title="Delete room"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;