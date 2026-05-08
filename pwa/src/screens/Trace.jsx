import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DarkHeader from "../components/DarkHeader";
import { polygonArea } from "../services/area";
import styles from "./Trace.module.css";

export default function Trace() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [polygons, setPolygons] = useState([]);
  const [currentPolygon, setCurrentPolygon] = useState([]);
  const [scaleRatio, setScaleRatio] = useState(null);
  const [stats, setStats] = useState({ totalArea: 0, totalSquares: 0 });

  useEffect(() => {
    const imageData = localStorage.getItem("roofImage");
    const ratio = localStorage.getItem("scaleRatio");

    if (!imageData || !ratio) {
      navigate("/scale");
      return;
    }

    setScaleRatio(parseFloat(ratio));

    const img = new Image();
    img.onload = () => {
      setImage(img);
      drawImage(img, [], []);
    };
    img.src = imageData;
  }, [navigate]);

  const drawImage = (img, polys, currentPoly) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;

    // Draw image
    ctx.drawImage(img, 0, 0);

    // Draw completed polygons
    polys.forEach((poly, polyIdx) => {
      ctx.fillStyle = "rgba(0, 255, 0, 0.15)";
      ctx.strokeStyle = "#00ff00";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      poly.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Label
      const centroid = calculateCentroid(poly);
      ctx.fillStyle = "#ffff00";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`S${polyIdx + 1}`, centroid.x, centroid.y);
    });

    // Draw current polygon
    if (currentPoly.length > 0) {
      ctx.strokeStyle = "#ffff00";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(currentPoly[0].x, currentPoly[0].y);
      currentPoly.forEach((point) => ctx.lineTo(point.x, point.y));
      if (currentPoly.length > 1) {
        ctx.lineTo(currentPoly[0].x, currentPoly[0].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw points
      currentPoly.forEach((point, idx) => {
        ctx.fillStyle = "#ffff00";
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffff00";
        ctx.font = "12px Arial";
        ctx.fillText(`${idx + 1}`, point.x + 12, point.y - 5);
      });
    }
  };

  const calculateCentroid = (poly) => {
    let x = 0,
      y = 0;
    poly.forEach((p) => {
      x += p.x;
      y += p.y;
    });
    return { x: x / poly.length, y: y / poly.length };
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint = { x, y };
    const newCurrentPoly = [...currentPolygon, newPoint];
    setCurrentPolygon(newCurrentPoly);
    drawImage(image, polygons, newCurrentPoly);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    if (currentPolygon.length < 3) {
      alert("Need at least 3 points to create a polygon");
      return;
    }

    const newPolygons = [...polygons, currentPolygon];
    setPolygons(newPolygons);
    setCurrentPolygon([]);
    drawImage(image, newPolygons, []);
    calculateStats(newPolygons);
  };

  const calculateStats = (polys) => {
    let totalArea = 0;
    polys.forEach((poly) => {
      const pixelArea = polygonArea(poly.map((p) => [p.x, p.y]));
      const realArea = pixelArea * scaleRatio * scaleRatio;
      totalArea += realArea;
    });

    const totalSquares = totalArea / 100; // 1 square = 100 sq ft
    setStats({ totalArea, totalSquares });
  };

  const handleUndo = () => {
    if (currentPolygon.length > 0) {
      const newPoly = currentPolygon.slice(0, -1);
      setCurrentPolygon(newPoly);
      drawImage(image, polygons, newPoly);
    } else if (polygons.length > 0) {
      const newPolygons = polygons.slice(0, -1);
      setPolygons(newPolygons);
      drawImage(image, newPolygons, []);
      calculateStats(newPolygons);
    }
  };

  const handleClearAll = () => {
    if (confirm("Clear all polygons?")) {
      setPolygons([]);
      setCurrentPolygon([]);
      setStats({ totalArea: 0, totalSquares: 0 });
      drawImage(image, [], []);
    }
  };

  const handleProceedToEstimate = () => {
    if (polygons.length === 0) {
      alert("Please trace at least one section");
      return;
    }
    const projectData = {
      polygons,
      stats,
      scaleRatio,
    };
    localStorage.setItem("projectData", JSON.stringify(projectData));
    navigate("/estimate");
  };

  return (
    <div className={styles.container}>
      <DarkHeader title="Trace Roof Sections" />
      <div className={styles.content}>
        <p className={styles.instruction}>
          Click to add points. Double-click to finish a polygon.
        </p>

        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onDoubleClick={handleDoubleClick}
          className={styles.canvas}
          style={{ cursor: "crosshair" }}
        />

        <div className={styles.statsSection}>
          <div className={styles.stat}>
            <span>Sections:</span>
            <strong>{polygons.length}</strong>
          </div>
          <div className={styles.stat}>
            <span>Total Area:</span>
            <strong>{stats.totalArea.toFixed(1)} sq ft</strong>
          </div>
          <div className={styles.stat}>
            <span>Squares:</span>
            <strong>{stats.totalSquares.toFixed(1)}</strong>
          </div>
        </div>

        <div className={styles.buttonGroup}>
          <button onClick={handleUndo} className={styles.undoButton}>
            ↶ Undo
          </button>
          <button onClick={handleClearAll} className={styles.clearButton}>
            Clear All
          </button>
          <button
            onClick={handleProceedToEstimate}
            disabled={polygons.length === 0}
            className={styles.proceedButton}
          >
            Proceed to Estimate →
          </button>
        </div>

        {currentPolygon.length > 0 && (
          <p className={styles.status}>
            Current polygon: {currentPolygon.length} points (double-click to finish)
          </p>
        )}
      </div>
    </div>
  );
}
