import React from "react";

export default function QuoteCard({ quote, onAccept, onDecline, onExpand, isExpanded }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "#ff9800";
      case "accepted":
        return "#4caf50";
      case "declined":
        return "#f44336";
      default:
        return "#999";
    }
  };

  return (
    <div
      style={{
        background: "#111",
        border: `2px solid ${getStatusColor(quote.status)}`,
        borderRadius: "8px",
        marginBottom: "12px",
        overflow: "hidden",
      }}
    >
      <div
        onClick={onExpand}
        style={{
          padding: "12px 16px",
          background: "#1a1a1a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <div>
          <div style={{ fontWeight: "bold", fontSize: "16px" }}>
            {quote.customerName}
          </div>
          <div style={{ fontSize: "12px", color: "#aaa", marginTop: "4px" }}>
            {new Date(quote.submittedAt).toLocaleDateString()} at{" "}
            {new Date(quote.submittedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <span
          style={{
            background: getStatusColor(quote.status),
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: "bold",
          }}
        >
          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
        </span>
      </div>

      {isExpanded && (
        <div style={{ padding: "16px", borderTop: "1px solid #333" }}>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
              CONTACT
            </div>
            <div>
              {quote.phone && (
                <div>
                  📞 <a href={`tel:${quote.phone}`} style={{ color: "#00aa88" }}>{quote.phone}</a>
                </div>
              )}
              {quote.email && (
                <div>
                  📧{" "}
                  <a href={`mailto:${quote.email}`} style={{ color: "#00aa88" }}>
                    {quote.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {(quote.roofType || quote.roofSquares || quote.pitch) && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                PROJECT DETAILS
              </div>
              <div style={{ fontSize: "14px" }}>
                {quote.roofType && <div>Type: {quote.roofType}</div>}
                {quote.roofSquares && <div>Squares: {quote.roofSquares}</div>}
                {quote.pitch && <div>Pitch: {quote.pitch}</div>}
                {quote.notes && <div>Notes: {quote.notes}</div>}
              </div>
            </div>
          )}

          {quote.estimatedCost && (
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12px", color: "#aaa", marginBottom: "4px" }}>
                ESTIMATE
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "#00ff88",
                }}
              >
                ${quote.estimatedCost.toFixed(2)}
              </div>
            </div>
          )}

          {quote.status === "pending" && (
            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={onAccept}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#4caf50",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✓ Accept Job
              </button>
              <button
                onClick={onDecline}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#f44336",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                ✗ Decline
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
