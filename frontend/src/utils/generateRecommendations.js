import disasterData from "../data/disaster_risk_dataset_india.json";
import {
  buildRecommendationKey,
  getGapWeight,
  getPriorityFromScore,
  getRecommendation,
  getRiskWeight,
  getSeasonalBoost,
} from "./recommendationEngine";

export function generateRecommendations(trainingData = []) {
  const results = [];

  Object.entries(disasterData).forEach(([disaster, states]) => {
    Object.entries(states).forEach(([state, risks]) => {
      ["high", "moderate"].forEach((level) => {
        (risks[level] || []).forEach((district) => {
          const lastTraining = trainingData
            .filter(
              (training) =>
                training.district === district &&
                training.disaster === disaster,
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

          const riskWeight = getRiskWeight(level);
          const gapWeight = getGapWeight(lastTraining?.date);
          const seasonalBoost = getSeasonalBoost(disaster);
          const score = riskWeight * gapWeight * seasonalBoost;
          const priority = getPriorityFromScore(score);

          results.push({
            key: buildRecommendationKey({ state, district, disaster }),
            district,
            state,
            disaster,
            score,
            priority,
            recommendation: getRecommendation(disaster),
          });
        });
      });
    });
  });

  return results;
}
