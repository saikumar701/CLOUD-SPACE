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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="bg-slate-800 text-white p-8 rounded-xl shadow-xl w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-6">Log in to StudyHub</h1>

        <button
          onClick={googleLogin}
          className="bg-white text-slate-800 px-4 py-2 rounded-lg w-full mb-4 flex items-center justify-center gap-2 hover:bg-slate-100 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Sign in with Google</span>
        </button>

        <div className="flex items-center gap-2 my-4">
          <div className="flex-1 h-px bg-slate-600"></div>
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-600"></div>
        </div>

        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Enter your name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="pl-10 pr-3 py-2 rounded-lg w-full bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 absolute top-3 left-3 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A9 9 0 1112 21a8.961 8.961 0 01-6.879-3.196zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        <button
          onClick={guestLogin}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg w-full font-medium flex items-center justify-center gap-2 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Continue as Guest</span>
        </button>
      </div>
    </div>
  );
}
