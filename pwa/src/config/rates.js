// Your business rates configuration
// Update these with your actual rates

export const RATES = {
  // Material costs per square foot
  material: {
    asphalt: 3.50,
    metal: 8.00,
    tile: 12.00,
    slate: 15.00,
    composite: 6.00,
  },

  // Labor costs per square foot
  labor: {
    standard: 5.00,
    premium: 7.50,
    commercial: 10.00,
  },

  // Operating hours (24-hour format)
  operatingHours: {
    monday: { start: 8, end: 17 },
    tuesday: { start: 8, end: 17 },
    wednesday: { start: 8, end: 17 },
    thursday: { start: 8, end: 17 },
    friday: { start: 8, end: 17 },
    saturday: { start: 9, end: 14 },
    sunday: { start: null, end: null }, // Closed
  },

  // Minimum/Maximum job values
  minimumJobValue: 500,
  maximumJobsPerDay: 5,

  // Service area radius in miles
  serviceAreaRadius: 50,
};

// Check if currently available
export const isAvailableNow = () => {
  const now = new Date();
  const dayName = now.toLocaleDateString("en-US", { weekday: "lowercase" });
  const hours = RATES.operatingHours[dayName];

  if (!hours || hours.start === null) return false;

  const currentHour = now.getHours();
  return currentHour >= hours.start && currentHour < hours.end;
};
