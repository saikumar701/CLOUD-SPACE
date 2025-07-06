import React, { useState } from "react";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [guestName, setGuestName] = useState("");

  const googleLogin = () => {
    signInWithPopup(auth, provider).then(() => navigate("/dashboard"));
  };

  const guestLogin = () => {
    if (!guestName.trim()) return;
    sessionStorage.setItem("guestName", guestName);
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <div className="bg-white text-black p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <button
          onClick={googleLogin}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4 w-full"
        >
          Sign in with Google
        </button>
        <input
          type="text"
          placeholder="Enter your name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="px-3 py-2 border rounded w-full mb-2"
        />
        <button
          onClick={guestLogin}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}
