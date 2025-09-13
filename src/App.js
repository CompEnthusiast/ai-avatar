import React, { useEffect, useRef, useState } from "react";

function App() {
  const iframeRef = useRef(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [format, setFormat] = useState("png");
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); // new

  useEffect(() => {
    const iframe = iframeRef.current;

    const subscribe = () => {
      iframe.contentWindow.postMessage(
        JSON.stringify({
          target: "readyplayerme",
          type: "subscribe",
          eventName: "v1.avatar.exported",
        }),
        "*"
      );
    };

    const handleMessage = (event) => {
      let data;
      try {
        data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        return;
      }
      if (data.source !== "readyplayerme") return;

      if (data.eventName === "v1.avatar.exported") {
        setAvatarUrl(data.data.url);
        setImageLoaded(false); // reset loader when new avatar arrives
      }
    };

    iframe.addEventListener("load", subscribe);
    window.addEventListener("message", handleMessage);

    return () => {
      iframe.removeEventListener("load", subscribe);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const downloadAvatar = async () => {
    if (!avatarUrl) return alert("Please create an avatar first!");
    setDownloading(true);

    try {
      const fileUrl = format === "png" ? `${avatarUrl}.png` : avatarUrl;
      const ext = format === "png" ? "png" : "glb";

      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `my-avatar.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Error downloading avatar");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="app">
      <h1 className="title">Realistic AI Avatar Maker</h1>

      <iframe
        ref={iframeRef}
        src="https://demo.readyplayer.me/avatar?frameApi"
        title="Ready Player Me Avatar"
        className="avatar-frame"
        allow="camera *; microphone *"
      />

      {avatarUrl && (
        <div className="download-section">
          {/* Skeleton while loading */}
          {!imageLoaded && <div className="skeleton"></div>}

          {/* Actual avatar image */}
          <img
            src={`${avatarUrl}.png`}
            alt="Avatar Preview"
            className="avatar-preview"
            style={{ display: imageLoaded ? "block" : "none" }}
            onLoad={() => setImageLoaded(true)}
          />

          <div style={{ marginBottom: "10px" }}>
            <label style={{ marginRight: "10px" }}>Format:</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="png">PNG</option>
              <option value="glb">GLB</option>
            </select>
          </div>

          <button
            className="download-btn"
            onClick={downloadAvatar}
            disabled={downloading}
          >
            {downloading ? "Downloading…" : "Download Avatar"}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
