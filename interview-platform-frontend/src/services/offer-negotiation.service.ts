import api from "@/lib/axios";

export interface OfferNegotiation {
  id: string;
  offerId: string;
  candidateId: string;
  status: "ACTIVE" | "COUNTER_PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  currentOffer: Record<string, unknown>;
  counterOffers: Record<string, unknown>[];
  aiSuggestion: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface AISuggestion {
  recommendedAction: string;
  reasoning: string;
  suggestedTerms: Record<string, unknown>;
  marketData: Record<string, unknown>;
}

export const offerNegotiationService = {
  start: (data: { offerId: string; candidateId: string; currentOffer: Record<string, unknown> }) => api.post<OfferNegotiation>("/api/v1/offer-negotiations", data),
  submitCounter: (id: string, counterOffer: Record<string, unknown>) => api.post<OfferNegotiation>(`/api/v1/offer-negotiations/${id}/counter`, counterOffer),
  getAISuggestion: (id: string) => api.get<AISuggestion>(`/api/v1/offer-negotiations/${id}/ai-suggestion`),
  resolve: (id: string, status: string) => api.post<OfferNegotiation>(`/api/v1/offer-negotiations/${id}/resolve`, { status }),
  listByCandidate: (candidateId: string) => api.get<OfferNegotiation[]>(`/api/v1/offer-negotiations/candidate/${candidateId}`),
};
