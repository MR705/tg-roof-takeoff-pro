import React, { useState, useEffect } from "react";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Listen for new quote notifications
    const handleNewQuote = (event) => {
      const { detail } = event;
      
      // Show browser notification
      if (Notification.permission === "granted") {
        new Notification("New Quote Request", {
          body: `${detail.customerName} - ${detail.estimatedCost}`,
          icon: "/manifest.json",
          badge: "/icon.png",
          tag: detail.quoteId,
        });
      }

      // Add to notification center
      setNotifications((prev) => [
        { id: Date.now(), ...detail, timestamp: new Date() },
        ...prev.slice(0, 9), // Keep last 10
      ]);
    };

    window.addEventListener("new-quote", handleNewQuote);
    return () => window.removeEventListener("new-quote", handleNewQuote);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, right: 0, maxWidth: "300px" }}>
      {notifications.map((notif) => (
        <div
          key={notif.id}
          style={{
            background: "#00aa88",
            color: "#fff",
            padding: "12px 16px",
            margin: "8px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "slideIn 0.3s ease-in",
          }}
        >
          <div style={{ fontWeight: "bold" }}>{notif.customerName}</div>
          <div style={{ fontSize: "12px", marginTop: "4px" }}>💰 ${notif.estimatedCost}</div>
        </div>
      ))}
    </div>
  );
}
