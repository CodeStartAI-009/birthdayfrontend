import React from "react";
import { Routes, Route } from "react-router-dom";
import UploadForm from "./components/UploadForm";
import PlaybackPage from "./components/PlaybackPage";
import "./index.css";
export default function App() {
  return (
    
 
      <Routes>
        {/* Upload form route */}
        <Route path="/" element={<UploadForm />} />

        {/* Playback route with token */}
        <Route path="/play/:token" element={<PlaybackPage />} />
      </Routes>
    
  );
}
