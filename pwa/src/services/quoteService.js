// Quote management service

export const quoteService = {
  // Fetch all quotes
  async fetchQuotes() {
    try {
      const res = await fetch("/api/quotes");
      if (!res.ok) throw new Error("Failed to fetch quotes");
      return await res.json();
    } catch (err) {
      console.error("Error fetching quotes:", err);
      return [];
    }
  },

  // Get single quote
  async getQuote(quoteId) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`);
      if (!res.ok) throw new Error("Failed to fetch quote");
      return await res.json();
    } catch (err) {
      console.error("Error fetching quote:", err);
      return null;
    }
  },

  // Update quote status
  async updateQuoteStatus(quoteId, status) {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update quote");
      return await res.json();
    } catch (err) {
      console.error("Error updating quote:", err);
      return null;
    }
  },

  // Send notification to admin
  async notifyAdmin(quoteData) {
    try {
      const res = await fetch("/api/notify-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteData),
      });
      if (!res.ok) throw new Error("Failed to send notification");
      return await res.json();
    } catch (err) {
      console.error("Error sending notification:", err);
      return null;
    }
  },

  // Calculate estimate based on rates
  calculateEstimate(roofSquares, materialCost, laborCost, pitch = 1) {
    const baseArea = roofSquares * 100; // Convert squares to sq ft
    const pitchMultiplier = Math.sqrt(1 + (pitch / 12) ** 2);
    const adjustedArea = baseArea * pitchMultiplier;

    return {
      baseArea,
      adjustedArea,
      material: adjustedArea * materialCost,
      labor: adjustedArea * laborCost,
      total: adjustedArea * (materialCost + laborCost),
    };
  },
};
