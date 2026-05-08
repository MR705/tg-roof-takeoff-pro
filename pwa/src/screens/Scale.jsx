import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DarkHeader from "../components/DarkHeader";
import styles from "./Scale.module.css";

export default function Scale() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [points, setPoints] = useState([]);
  const [scale, setScale] = useState(null);
  const [measurement, setMeasurement] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const imageData = localStorage.getItem("roofImage");
    if (!imageData) {
      navigate("/upload");
      return;
    }

    const img = new Image();
    img.onload = () => {
      setImage(img);
      drawImage(img, []);
    };
    img.src = imageData;
  }, [navigate]);

  const drawImage = (img, pointsList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw points
    pointsList.forEach((point, idx) => {
      ctx.fillStyle = "#00ff00";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#00ff00";
      ctx.font = "14px Arial";
      ctx.fillText(`P${idx + 1}`, point.x + 15, point.y - 5);
    });

    // Draw line between points
    if (pointsList.length === 2) {
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(pointsList[0].x, pointsList[0].y);
      ctx.lineTo(pointsList[1].x, pointsList[1].y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw distance
      const dist = Math.sqrt(
        Math.pow(pointsList[1].x - pointsList[0].x, 2) +
          Math.pow(pointsList[1].y - pointsList[0].y, 2)
      );
      const midX = (pointsList[0].x + pointsList[1].x) / 2;
      const midY = (pointsList[0].y + pointsList[1].y) / 2;

      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 16px Arial";
      ctx.fillText(`${dist.toFixed(0)} px`, midX + 10, midY - 10);
    }
  };

  const handleCanvasClick = (e) => {
    if (points.length >= 2) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoints = [...points, { x, y }];
    setPoints(newPoints);
    drawImage(image, newPoints);

    if (newPoints.length === 2) {
      const dist = Math.sqrt(
        Math.pow(newPoints[1].x - newPoints[0].x, 2) +
          Math.pow(newPoints[1].y - newPoints[0].y, 2)
      );
      // Store pixel distance
      localStorage.setItem("pixelDistance", dist.toString());
    }
  };

  const handleSetMeasurement = () => {
    if (!measurement || isNaN(measurement)) {
      setErrorMsg("Please enter a valid number");
      return;
    }

    const pixelDist = parseFloat(localStorage.getItem("pixelDistance"));
    const realWorldDist = parseFloat(measurement);
    const ratio = realWorldDist / pixelDist;

    localStorage.setItem("scaleRatio", ratio.toString());
    localStorage.setItem("measurement", measurement);
    navigate("/trace");
  };

  const handleReset = () => {
    setPoints([]);
    setMeasurement("");
    setErrorMsg("");
    drawImage(image, []);
  };

  return (
    <div className={styles.container}>
      <DarkHeader title="Set Scale" />
      <div className={styles.content}>
        <p className={styles.instruction}>
          Tap two points on the image to define a known distance.
        </p>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          className={styles.canvas}
          style={{ cursor: points.length < 2 ? "crosshair" : "default" }}
        />

        {points.length === 2 && (
          <div className={styles.measurementSection}>
            <label>
              Real-world distance ({measurement ? measurement : "feet/meters"})
            </label>
            <input
              type="number"
              placeholder="Enter distance (e.g., 10)"
              value={measurement}
              onChange={(e) => {
                setMeasurement(e.target.value);
                setErrorMsg("");
              }}
              className={styles.input}
            />
            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.buttonGroup}>
              <button
                onClick={handleSetMeasurement}
                className={styles.confirmButton}
              >
                Confirm Scale
              </button>
              <button onClick={handleReset} className={styles.resetButton}>
                Reset
              </button>
            </div>
          </div>
        )}

        {points.length < 2 && (
          <p className={styles.status}>
            Points selected: {points.length}/2
          </p>
        )}
      </div>
    </div>
  );
}
