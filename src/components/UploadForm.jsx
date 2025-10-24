import React, { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("Happy Birthday");
  const [images, setImages] = useState([]);
  const [audio, setAudio] = useState(null);
  const [video, setVideo] = useState(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const unsignedUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const backendBase = import.meta.env.VITE_API_BASE || "http://localhost:5001";

  // Upload file to Cloudinary
  async function uploadFileToCloud(file, resourceType = "auto") {
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", unsignedUploadPreset);

    const res = await axios.post(url, fd, {
      onUploadProgress: (ev) => {
        const percent = Math.round((ev.loaded * 100) / ev.total);
        setProgress(percent);
      },
    });

    return res.data.secure_url;
  }

  // Handle form submission
  async function handleSubmit(e) {
    e.preventDefault();

    if (!title.trim()) return alert("Please enter a title");
    if (!images.length) return alert("Select at least one image");
    if (!audio) return alert("Select an audio file");
    if (!video) return alert("Select a video file");
    if (!email || !phone || !scheduledAt)
      return alert("Please fill all recipient details");

    try {
      setStatus("Uploading images...");
      const uploadedImages = [];
      for (let i = 0; i < images.length; i++) {
        const url = await uploadFileToCloud(images[i], "image");
        uploadedImages.push(url);
        setProgress(Math.round(((i + 1) / (images.length + 3)) * 100));
      }

      setStatus("Uploading audio...");
      const audioUrl = await uploadFileToCloud(audio, "video");
      setProgress(Math.round(((images.length + 1) / (images.length + 3)) * 100));

      setStatus("Uploading video...");
      const videoUrl = await uploadFileToCloud(video, "video");
      setProgress(Math.round(((images.length + 2) / (images.length + 3)) * 100));

      setStatus("Sending data to backend...");
      const payload = {
        title,
        theme,
        images: uploadedImages,
        audio: audioUrl,
        video: videoUrl,
        recipientEmail: email,
        recipientPhone: phone,
        scheduledAt,
      };

      const res = await axios.post(`${backendBase}/api/projects`, payload);
      setStatus("🎉 Scheduled successfully!");
      alert("✅ Scheduled! Playback token: " + res.data.token);

      // Reset form
      setTitle("");
      setTheme("Happy Birthday");
      setImages([]);
      setAudio(null);
      setVideo(null);
      setEmail("");
      setPhone("");
      setScheduledAt("");
      setProgress(0);
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("❌ Error: " + (err?.response?.data?.error || err.message));
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: "24px auto", padding: 16 }}>
      <h1 style={{ textAlign: "center" }}>🎂 BirthdayMailer</h1>
      <p style={{ textAlign: "center" }}>
        Upload 10 images, 1 audio and 1 video, schedule a date — we’ll send the
        recipient a link on that day.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 700, margin: "20px auto", display: "grid", gap: 12 }}
      >
        <input
          type="text"
          placeholder="Title (required)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        />

        <div>
          <label>Images (up to 10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 10))}
          />
          <small>{images.length} selected</small>
        </div>

        <div>
          <label>Audio</label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => setAudio(e.target.files[0])}
          />
        </div>

        <div>
          <label>Video</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files[0])}
          />
        </div>

        <input
          type="email"
          placeholder="Recipient email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="tel"
          placeholder="Recipient phone (+91...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          required
        />

        <button type="submit">Create & Schedule</button>
        <div>{progress ? `${progress}%` : ""}</div>
        <div style={{ color: "#333" }}>{status}</div>
      </form>
    </div>
  );
}
