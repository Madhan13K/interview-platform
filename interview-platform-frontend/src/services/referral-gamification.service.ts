import api from "@/lib/api";

export const referralGamificationService = {
  getLeaderboard: (limit?: number) => api.get(`/api/v1/referral-gamification/leaderboard?limit=${limit || 10}`),
  getMyStats: () => api.get("/api/v1/referral-gamification/me"),
  getBadges: () => api.get("/api/v1/referral-gamification/badges"),
  awardPoints: (userId: string, action: string, points: number) => api.post("/api/v1/referral-gamification/award", { userId, action, points }),
};
