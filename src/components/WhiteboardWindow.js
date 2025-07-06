import React, { useEffect, useRef } from "react";
import { Dialog, DialogTitle, DialogContent, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { fabric } from "fabric";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

const WhiteboardWindow = ({ roomId, onClose }) => {
  const canvasRef = useRef(null);
  const fabricCanvas = useRef(null);
  const ydoc = useRef(new Y.Doc());
  const provider = useRef(null);

  useEffect(() => {
    // Initialize Fabric canvas
    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: true,
      width: 800,
      height: 500,
      backgroundColor: '#ffffff'
    });

    // Set default brush
    fabricCanvas.current.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas.current);
    fabricCanvas.current.freeDrawingBrush.color = '#000000';
    fabricCanvas.current.freeDrawingBrush.width = 3;

    // Initialize Yjs and WebRTC
    provider.current = new WebrtcProvider(`whiteboard-${roomId}`, ydoc.current, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
        'wss://y-webrtc-signaling-us.herokuapp.com'
      ]
    });

    const ymap = ydoc.current.getMap('whiteboard');

    // Sync local changes to Yjs
    fabricCanvas.current.on('object:added', (e) => {
      if (!e.target.__skipSync) {
        const key = e.target.__key || Date.now().toString();
        ymap.set(key, e.target.toObject());
        e.target.__key = key;
      }
    });

    fabricCanvas.current.on('object:modified', (e) => {
      if (!e.target.__skipSync && e.target.__key) {
        ymap.set(e.target.__key, e.target.toObject());
      }
    });

    fabricCanvas.current.on('object:removed', (e) => {
      if (!e.target.__skipSync && e.target.__key) {
        ymap.delete(e.target.__key);
      }
    });

    // Apply remote changes to canvas
    ymap.observe((event) => {
      event.keysChanged.forEach((key) => {
        if (ymap.has(key)) {
          // Add or update object
          const objData = ymap.get(key);
          const existing = fabricCanvas.current.getObjects().find(obj => obj.__key === key);
          
          if (existing) {
            existing.__skipSync = true;
            existing.set(objData);
            existing.__skipSync = false;
          } else {
            fabric.util.enlivenObjects([objData], (objects) => {
              const obj = objects[0];
              obj.__skipSync = true;
              obj.__key = key;
              fabricCanvas.current.add(obj);
              obj.__skipSync = false;
            });
          }
        } else {
          // Remove object
          const toRemove = fabricCanvas.current.getObjects().find(obj => obj.__key === key);
          if (toRemove) {
            toRemove.__skipSync = true;
            fabricCanvas.current.remove(toRemove);
          }
        }
      });
    });

    return () => {
      provider.current?.destroy();
      ydoc.current?.destroy();
      fabricCanvas.current.dispose();
    };
  }, [roomId]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        style: {
          height: "90vh",
          borderRadius: "12px"
        }
      }}
    >
      <DialogTitle>
        <div className="flex justify-between items-center">
          <span>Collaborative Whiteboard - Room: {roomId}</span>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </div>
      </DialogTitle>
      <DialogContent dividers>
        <canvas 
          ref={canvasRef}
          className="border rounded-lg w-full h-full"
        />
      </DialogContent>
    </Dialog>
  );
};

export default WhiteboardWindow;