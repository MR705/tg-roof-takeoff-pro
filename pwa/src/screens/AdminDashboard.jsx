import React, { useState, useEffect } from "react";
import DarkHeader from "../components/DarkHeader";

export default function AdminDashboard() {
  const [quotes, setQuotes] = useState([]);
  const [availability, setAvailability] = useState("available");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // all, pending, accepted, declined
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchQuotes();
    // Poll for new quotes every 30 seconds
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotes");
      const data = await res.json();
      setQuotes(data || []);
    } catch (err) {
      console.error("Error fetching quotes:", err);
    }
    setLoading(false);
  };

  const updateQuoteStatus = async (quoteId, status) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const updated = await res.json();
      setQuotes(quotes.map((q) => (q.id === quoteId ? updated : q)));
    } catch (err) {
      console.error("Error updating quote:", err);
    }
  };

  const filteredQuotes = quotes.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === "pending").length,
    accepted: quotes.filter((q) => q.status === "accepted").length,
    declined: quotes.filter((q) => q.status === "declined").length,
  };

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

  const getStatusLabel = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div style={{ background: "#000", color: "#eee", minHeight: "100vh" }}>
      <DarkHeader title="Admin Dashboard" />

      {/* Availability Toggle */}
      <div
        style={{
          padding: "16px",
          background: "#111",
          borderBottom: "1px solid #333",
        }}
      >
        <label style={{ marginRight: 16, fontWeight: "bold" }}>
          Your Status:
        </label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          style={{
            padding: "8px 12px",
            background: "#222",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          <option value="available">✓ Available</option>
          <option value="busy">⊘ Busy</option>
          <option value="offline">✗ Offline</option>
        </select>
        <span
          style={{
            marginLeft: 16,
            padding: "4px 12px",
            background:
              availability === "available"
                ? "#4caf50"
                : availability === "busy"
                ? "#ff9800"
                : "#f44336",
            borderRadius: "4px",
            fontSize: "12px",
          }}
        >
          {availability.toUpperCase()}
        </span>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "12px",
          padding: "16px",
          background: "#111",
          borderBottom: "1px solid #333",
        }}
      >
        <div style={{ background: "#222", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>
            {stats.total}
          </div>
          <div style={{ fontSize: "12px", color: "#aaa" }}>Total Quotes</div>
        </div>
        <div style={{ background: "#ff9800", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>
            {stats.pending}
          </div>
          <div style={{ fontSize: "12px", color: "#fff" }}>Pending</div>
        </div>
        <div style={{ background: "#4caf50", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>
            {stats.accepted}
          </div>
          <div style={{ fontSize: "12px", color: "#fff" }}>Accepted</div>
        </div>
        <div style={{ background: "#f44336", padding: "12px", borderRadius: "8px" }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#fff" }}>
            {stats.declined}
          </div>
          <div style={{ fontSize: "12px", color: "#fff" }}>Declined</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "12px 16px",
          borderBottom: "1px solid #333",
          overflowX: "auto",
        }}
      >
        {["all", "pending", "accepted", "declined"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              background: filter === f ? "#00aa88" : "#222",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: filter === f ? "bold" : "normal",
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Quotes List */}
      <div style={{ padding: "16px" }}>
        {loading && (
          <div style={{ textAlign: "center", color: "#aaa" }}>Loading...</div>
        )}

        {!loading && filteredQuotes.length === 0 && (
          <div style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>
            No quotes found
          </div>
        )}

        {!loading &&
          filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              style={{
                background: "#111",
                border: `2px solid ${getStatusColor(quote.status)}`,
                borderRadius: "8px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              {/* Header */}
              <div
                onClick={() =>
                  setExpandedId(expandedId === quote.id ? null : quote.id)
                }
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
                    {new Date(quote.submittedAt).toLocaleTimeString()}
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
                  {getStatusLabel(quote.status)}
                </span>
              </div>

              {/* Expanded Details */}
              {expandedId === quote.id && (
                <div style={{ padding: "16px", borderTop: "1px solid #333" }}>
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>Contact</div>
                    <div style={{ marginTop: "4px" }}>
                      📞 {quote.phone}
                      {quote.email && <div>📧 {quote.email}</div>}
                    </div>
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ fontSize: "12px", color: "#aaa" }}>Project Details</div>
                    <div style={{ marginTop: "4px" }}>
                      {quote.roofType && <div>Type: {quote.roofType}</div>}
                      {quote.roofSquares && <div>Squares: {quote.roofSquares}</div>}
                      {quote.pitch && <div>Pitch: {quote.pitch}</div>}
                      {quote.notes && <div>Notes: {quote.notes}</div>}
                    </div>
                  </div>

                  {quote.estimatedCost && (
                    <div style={{ marginBottom: "12px" }}>
                      <div style={{ fontSize: "12px", color: "#aaa" }}>Estimate</div>
                      <div
                        style={{
                          marginTop: "4px",
                          fontSize: "20px",
                          fontWeight: "bold",
                          color: "#00ff88",
                        }}
                      >
                        ${quote.estimatedCost.toFixed(2)}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {quote.status === "pending" && (
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                      <button
                        onClick={() => updateQuoteStatus(quote.id, "accepted")}
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
                        onClick={() => updateQuoteStatus(quote.id, "declined")}
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

                  {quote.status !== "pending" && (
                    <button
                      onClick={() => updateQuoteStatus(quote.id, "pending")}
                      style={{
                        width: "100%",
                        padding: "10px",
                        background: "#ff9800",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        marginTop: "16px",
                      }}
                    >
                      ↶ Reopen
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
