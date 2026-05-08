import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DarkHeader from "../components/DarkHeader";
import styles from "./Upload.module.css";

export default function Upload() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        // Store in localStorage
        localStorage.setItem("roofImage", imageData);
        localStorage.setItem("fileName", file.name);
        setPreview(imageData);
        setFileName(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProceedToScale = () => {
    if (preview) {
      navigate("/scale");
    }
  };

  return (
    <div className={styles.container}>
      <DarkHeader title="Upload Roof Image" />
      <div className={styles.content}>
        <div className={styles.uploadArea}>
          <label htmlFor="imageInput" className={styles.uploadLabel}>
            <div className={styles.uploadIcon}>📸</div>
            <p>Tap to select a roof image</p>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              capture="environment"
              className={styles.hiddenInput}
            />
          </label>
        </div>

        {preview && (
          <div className={styles.previewSection}>
            <h3>Preview</h3>
            <img src={preview} alt="Roof preview" className={styles.preview} />
            <p className={styles.fileName}>{fileName}</p>
          </div>
        )}

        <button
          onClick={handleProceedToScale}
          disabled={!preview}
          className={styles.proceedButton}
        >
          Proceed to Scale →
        </button>
      </div>
    </div>
  );
}
