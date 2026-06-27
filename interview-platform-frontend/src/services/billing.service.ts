import api from "@/lib/api";

export const billingService = {
  getPlans: () => api.get("/api/v1/billing/plans"),
  getCurrentPlan: () => api.get("/api/v1/billing/subscription"),
  subscribe: (planId: string) => api.post("/api/v1/billing/subscribe", { planId }),
  cancelSubscription: () => api.post("/api/v1/billing/cancel"),
  getInvoices: () => api.get("/api/v1/billing/invoices"),
  createCheckout: (planId: string) => api.post("/api/v1/billing/checkout", { planId }),
};
