"use client";

import { useState } from "react";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  price: string;
  priceMonthly: number | null;
  features: string[];
  interviewLimit: number;
  userLimit: number;
  storageGB: number;
  aiCallsLimit: number;
  popular?: boolean;
  contactSales?: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  pdfUrl: string;
}

interface UsageMetric {
  label: string;
  current: number;
  limit: number;
  unit: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0/mo",
    priceMonthly: 0,
    features: [
      "5 interviews/month",
      "1 team member",
      "Basic AI feedback",
      "7-day history",
      "Email support",
    ],
    interviewLimit: 5,
    userLimit: 1,
    storageGB: 1,
    aiCallsLimit: 20,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    priceMonthly: 29,
    features: [
      "50 interviews/month",
      "5 team members",
      "Advanced AI feedback",
      "30-day history",
      "Priority email support",
      "Custom branding",
    ],
    interviewLimit: 50,
    userLimit: 5,
    storageGB: 10,
    aiCallsLimit: 200,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79/mo",
    priceMonthly: 79,
    features: [
      "Unlimited interviews",
      "25 team members",
      "Full AI suite",
      "Unlimited history",
      "Priority support",
      "Custom branding",
      "API access",
      "Advanced analytics",
    ],
    interviewLimit: 999,
    userLimit: 25,
    storageGB: 50,
    aiCallsLimit: 1000,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contact Sales",
    priceMonthly: null,
    features: [
      "Unlimited everything",
      "Unlimited team members",
      "Full AI suite + custom models",
      "Unlimited history",
      "Dedicated support",
      "White-label solution",
      "API access",
      "Advanced analytics",
      "SSO & SAML",
      "Custom integrations",
    ],
    interviewLimit: 9999,
    userLimit: 9999,
    storageGB: 500,
    aiCallsLimit: 9999,
    contactSales: true,
  },
];

const MOCK_INVOICES: Invoice[] = [
  { id: "inv_001", date: "2024-06-01", amount: "$79.00", status: "paid", pdfUrl: "#" },
  { id: "inv_002", date: "2024-05-01", amount: "$79.00", status: "paid", pdfUrl: "#" },
  { id: "inv_003", date: "2024-04-01", amount: "$79.00", status: "paid", pdfUrl: "#" },
  { id: "inv_004", date: "2024-03-01", amount: "$79.00", status: "paid", pdfUrl: "#" },
  { id: "inv_005", date: "2024-02-01", amount: "$29.00", status: "paid", pdfUrl: "#" },
  { id: "inv_006", date: "2024-01-01", amount: "$29.00", status: "failed", pdfUrl: "#" },
];

const MOCK_USAGE: UsageMetric[] = [
  { label: "Interviews", current: 67, limit: 999, unit: "interviews" },
  { label: "Team Members", current: 12, limit: 25, unit: "users" },
  { label: "Storage", current: 23, limit: 50, unit: "GB" },
  { label: "AI Calls", current: 482, limit: 1000, unit: "calls" },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function BillingPage() {
  const [currentPlanId, setCurrentPlanId] = useState("professional");
  const [loading, setLoading] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<string | null>(null);

  const currentPlan = PLANS.find((p) => p.id === currentPlanId)!;

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgradingPlanId(planId);
      setLoading(true);

      const response = await api.post("/api/v1/billing/checkout", {
        planId,
        organizationId: "org_default",
        email: "user@example.com",
        successUrl: `${window.location.origin}/settings/billing?success=true`,
        cancelUrl: `${window.location.origin}/settings/billing?canceled=true`,
      });

      const { checkoutUrl } = response.data;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    } finally {
      setLoading(false);
      setUpgradingPlanId(null);
    }
  };

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Billing & Subscription</h1>
            <Badge variant="default">{currentPlan.name}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage your subscription plan, payment methods, and billing history.
          </p>
        </div>
      </div>

      {/* ─── Current Plan Card ────────────────────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Current Plan</CardTitle>
              <CardDescription>
                Your subscription renews on July 1, 2024
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Change Plan
              </Button>
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                Cancel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Info */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Plan</p>
                <p className="text-lg font-semibold text-slate-900">{currentPlan.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Price</p>
                <p className="text-lg font-semibold text-slate-900">{currentPlan.price}</p>
              </div>
            </div>

            {/* Usage Summary */}
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Interviews this month</p>
                <p className="text-lg font-semibold text-slate-900">
                  67 / {currentPlan.interviewLimit === 999 ? "Unlimited" : currentPlan.interviewLimit}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Team members</p>
                <p className="text-lg font-semibold text-slate-900">
                  12 / {currentPlan.userLimit}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <p className="text-sm text-slate-500">Key features</p>
              <ul className="space-y-1">
                {currentPlan.features.slice(0, 4).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                    <svg className="h-4 w-4 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Plans Grid ───────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? "border-indigo-300 ring-2 ring-indigo-100"
                    : "border-slate-200"
                } ${isCurrent ? "bg-slate-50" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-indigo-600 text-white border-0">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="mt-2">
                    {plan.contactSales ? (
                      <p className="text-lg font-bold text-slate-900">Contact Sales</p>
                    ) : (
                      <p className="text-2xl font-bold text-slate-900">
                        {plan.priceMonthly === 0 ? "Free" : `$${plan.priceMonthly}`}
                        {plan.priceMonthly !== null && plan.priceMonthly > 0 && (
                          <span className="text-sm font-normal text-slate-500">/mo</span>
                        )}
                      </p>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                        <svg className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    {isCurrent ? (
                      <Button variant="secondary" className="w-full" disabled>
                        Current Plan
                      </Button>
                    ) : plan.contactSales ? (
                      <Button variant="outline" className="w-full">
                        Contact Sales
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => handleUpgrade(plan.id)}
                        disabled={loading && upgradingPlanId === plan.id}
                      >
                        {loading && upgradingPlanId === plan.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          "Upgrade"
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ─── Payment Method ───────────────────────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Payment Method</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Update Payment Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            {/* Card Icon */}
            <div className="h-12 w-16 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">Visa ending in 4242</p>
              <p className="text-xs text-slate-500">Expires 12/2025</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* ─── Invoice History ──────────────────────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Invoice History</CardTitle>
          <CardDescription>Download past invoices and track payment status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_INVOICES.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium text-slate-900">
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="text-slate-700">{invoice.amount}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="link" size="sm" className="text-indigo-600">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Usage Metrics ────────────────────────────────────────────────────── */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Usage This Month</CardTitle>
          <CardDescription>Monitor your current usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {MOCK_USAGE.map((metric) => {
              const percentage = Math.min((metric.current / metric.limit) * 100, 100);
              const isNearLimit = percentage >= 80;
              const isOverLimit = percentage >= 95;

              return (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-700">{metric.label}</p>
                    <p className="text-sm text-slate-500">
                      <span className={`font-semibold ${isOverLimit ? "text-red-600" : isNearLimit ? "text-amber-600" : "text-slate-900"}`}>
                        {metric.current}
                      </span>
                      {" / "}
                      {metric.limit >= 999 ? "Unlimited" : metric.limit} {metric.unit}
                    </p>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOverLimit
                          ? "bg-red-500"
                          : isNearLimit
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
