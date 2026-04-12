const disasterByTheme = {
  Flood: ["flood", "rescue"],
  Cyclone: ["cyclone"],
  Earthquake: ["earthquake"],
  Drought: ["drought", "water management"],
  Landslide: ["landslide", "slope safety"],
  Heatwave: ["heatwave", "heatstroke"],
};

const recommendationMap = {
  Flood: "Flood Rescue Training",
  Cyclone: "Cyclone Evacuation Training",
  Earthquake: "Earthquake Drill",
  Drought: "Water Management Training",
  Landslide: "Slope Safety Training",
  Heatwave: "Heatstroke Awareness",
};

export function getRiskWeight(risk) {
  return risk === "high" ? 3 : 2;
}

export function getGapWeight(lastTrainingDate) {
  if (!lastTrainingDate) return 3;

  const now = new Date();
  const diffMonths =
    (now - new Date(lastTrainingDate)) / (1000 * 60 * 60 * 24 * 30);

  if (diffMonths >= 6) return 3;
  if (diffMonths >= 3) return 2;
  return 1;
}

export function getSeasonalBoost(disaster) {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 6 && disaster === "Heatwave") return 1.5;
  if (month >= 6 && month <= 9 && disaster === "Flood") return 1.5;
  if (month >= 10 && month <= 11 && disaster === "Cyclone") return 1.5;

  return 1;
}

export function getRecommendation(disaster) {
  return recommendationMap[disaster];
}

export function getDisasterFromTheme(theme = "") {
  const normalizedTheme = theme.toLowerCase();

  for (const [disaster, keywords] of Object.entries(disasterByTheme)) {
    if (keywords.some((keyword) => normalizedTheme.includes(keyword))) {
      return disaster;
    }
  }

  return null;
}

export function getPriorityFromScore(score) {
  if (score >= 7) return "High";
  if (score >= 4) return "Medium";
  return "Low";
}

export function getColor(priority) {
  if (priority === "High") return "#dc2626";
  if (priority === "Medium") return "#f59e0b";
  return "#16a34a";
}

export function buildRecommendationKey({ state, district, disaster }) {
  return [state || "", district || "", disaster || ""].join("::");
}
