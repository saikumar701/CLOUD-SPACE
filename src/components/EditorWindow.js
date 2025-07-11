import React from "react";
import CollaborativeEditor from "./CollaborativeEditor";
import { motion } from "framer-motion";

const EditorWindow = ({ roomId, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-gray-900 rounded-xl shadow-2xl w-full h-full max-w-[95vw] max-h-[95vh] flex flex-col overflow-hidden border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="flex justify-between items-center p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            {/* Traffic Light Buttons */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 cursor-pointer transition-colors" onClick={onClose}></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 cursor-pointer transition-colors"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 cursor-pointer transition-colors"></div>
            </div>
            
            {/* Title */}
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <h2 className="text-lg font-bold text-white">
                Collaborative Code Editor
              </h2>
              <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                LIVE
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-400">
              Room: <span className="font-mono text-blue-400">{roomId}</span>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-700 transition-all duration-200 group"
              title="Close Editor"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          <CollaborativeEditor roomId={roomId} />
        </div>

        {/* Footer */}
        <div className="bg-gray-800 border-t border-gray-700 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                Industry-Level Collaboration
              </span>
              <span>•</span>
              <span>Real-time Synchronization</span>
              <span>•</span>
              <span>Multi-user Support</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span>Powered by Yjs & WebRTC</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditorWindow;