import React from "react";
import CollaborativeEditor from "./CollaborativeEditor";

const EditorWindow = ({ roomId, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-4/5 h-4/5 flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold">Collaborative Editor - Room: {roomId}</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 text-2xl"
          >
            &times;
          </button>
        </div>
        <div className="flex-1">
          <CollaborativeEditor roomId={roomId} />
        </div>
      </div>
    </div>
  );
};

export default EditorWindow;