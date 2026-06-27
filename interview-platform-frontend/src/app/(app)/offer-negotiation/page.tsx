"use client";

import { useState } from "react";
import { offerNegotiationService, OfferNegotiation } from "@/services/offer-negotiation.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OfferNegotiationPage() {
  const [negotiations, setNegotiations] = useState<OfferNegotiation[]>([]);
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return "default";
      case "REJECTED":
      case "EXPIRED":
        return "destructive";
      case "ACTIVE":
      case "COUNTER_PENDING":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Offer Negotiations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage offer negotiations with AI-powered suggestions and market data
          </p>
        </div>
        <Button>Start Negotiation</Button>
      </div>

      {negotiations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium text-slate-700 mb-2">No Active Negotiations</h3>
            <p className="text-sm text-slate-500 mb-6">
              Start a negotiation from an existing offer to track counter-offers and get AI-powered
              suggestions based on market data.
            </p>
            <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Counter Tracking</h4>
                <p className="text-xs text-slate-500 mt-1">Track all counter-offers in one place</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">AI Suggestions</h4>
                <p className="text-xs text-slate-500 mt-1">Get recommendations based on market rates</p>
              </div>
              <div className="p-4 border border-slate-200 rounded-lg">
                <h4 className="font-medium text-slate-700 text-sm">Resolution Tracking</h4>
                <p className="text-xs text-slate-500 mt-1">Record outcomes and build comp intelligence</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {negotiations.map((neg) => (
            <Card key={neg.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <h3 className="font-medium text-slate-900">Offer {neg.offerId.slice(0, 8)}</h3>
                  <p className="text-sm text-slate-500">
                    Candidate: {neg.candidateId} | Counters: {neg.counterOffers.length}
                  </p>
                </div>
                <Badge variant={getStatusColor(neg.status) as "default" | "secondary" | "destructive" | "outline"}>
                  {neg.status.replace("_", " ")}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
