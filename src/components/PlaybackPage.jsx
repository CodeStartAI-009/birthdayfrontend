import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function PlaybackPage() {
  const { token } = useParams();
  const [project, setProject] = useState(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [slideshowEnded, setSlideshowEnded] = useState(false);

  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

  // Fetch project
  useEffect(() => {
    async function fetchProject() {
      try {
        const res = await axios.get(`${API_BASE}/api/play/${token}`);
        setProject(res.data.project);
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err.response?.data?.error || "Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [token]);

  // Slideshow + audio sync
  useEffect(() => {
    if (!project || !started || !audioRef.current) return;

    const audio = audioRef.current;
    const images = project.images || [];
    const count = images.length || 1;

    function startSlideshow() {
      const duration = audio.duration || 0;
      if (!duration || duration === Infinity || Number.isNaN(duration)) return;

      const per = duration / count;
      setIndex(0);
      let i = 0;

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        i++;
        if (i >= count) {
          clearInterval(timerRef.current);
          setSlideshowEnded(true);
          if (project.video && videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          setIndex(i);
        }
      }, per * 1000);
    }

    audio.addEventListener("loadedmetadata", startSlideshow);
    audio.addEventListener("play", startSlideshow);

    return () => {
      audio.removeEventListener("loadedmetadata", startSlideshow);
      audio.removeEventListener("play", startSlideshow);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [project, started]);

  const handleStart = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
      setStarted(true);
    }
  };

  if (loading)
    return <div style={styles.loading}>Loading...</div>;

  if (error)
    return <div style={styles.error}>
      {error.includes("not available")
        ? "⏳ This project will be available at the scheduled time."
        : error}
    </div>;

  if (!project)
    return <div style={styles.loading}>Project not found</div>;

  return (
    <div style={styles.container}>
      {!started && (
        <button style={styles.startButton} onClick={handleStart}>
          ▶ Start Playback
        </button>
      )}

      {/* Slideshow */}
      {!slideshowEnded && project.images && project.images.length > 0 && (
        <div style={styles.slideshowWrapper}>
          <img
            key={index}
            src={project.images[index]}
            alt={`slide-${index}`}
            style={{ ...styles.slideImage, opacity: started ? 1 : 0 }}
          />
        </div>
      )}

      {/* Audio */}
      {project.audio && (
        <audio
          ref={audioRef}
          src={project.audio}
          controls
          autoPlay={started}
          style={{ display: started ? "block" : "none" }}
        />
      )}

      {/* Video */}
      {slideshowEnded && project.video && (
        <div style={styles.videoWrapper}>
          <video
            ref={videoRef}
            src={project.video}
            controls
            autoPlay
            style={styles.video}
          />
        </div>
      )}
    </div>
  );
}

// CSS-in-JS
const styles = {
  container: {
    width: "100vw",
    height: "100vh",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  loading: {
    color: "#fff",
    textAlign: "center",
    marginTop: 40,
  },
  error: {
    color: "red",
    textAlign: "center",
    marginTop: 40,
  },
  startButton: {
    position: "absolute",
    zIndex: 10,
    padding: "16px 32px",
    fontSize: 22,
    cursor: "pointer",
    borderRadius: 8,
    backgroundColor: "#ff4081",
    color: "#fff",
    border: "none",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
  },
  slideshowWrapper: {
    width: "100vw",
    height: "100vh",
    position: "relative",
  },
  slideImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    position: "absolute",
    top: 0,
    left: 0,
    transition: "opacity 1s ease-in-out",
  },
  videoWrapper: {
    width: "100vw",
    height: "100vh",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
};
