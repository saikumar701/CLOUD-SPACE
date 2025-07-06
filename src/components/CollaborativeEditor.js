import React, { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";

export default function CollaborativeEditor({ roomId }) {
  const ydocRef = useRef();
  const providerRef = useRef();

  useEffect(() => {
    // create Yjs doc & provider only ONCE
    ydocRef.current = new Y.Doc();
    providerRef.current = new WebrtcProvider(roomId, ydocRef.current);

    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, [roomId]);

  const handleMount = (editor, monaco) => {
    const yText = ydocRef.current.getText("monaco");

    new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      providerRef.current.awareness
    );
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Editor
        height="100%"
        defaultLanguage="javascript"
        defaultValue="// Start coding collaboratively!"
        theme="vs-dark"
        onMount={handleMount}
        options={{
          minimap: { enabled: true },
          fontSize: 14,
          wordWrap: "on",
          automaticLayout: true,
        }}
      />
    </div>
  );
}