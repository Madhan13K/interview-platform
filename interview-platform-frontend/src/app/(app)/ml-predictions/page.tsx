"use client";

import { useState, useEffect } from "react";
import { mlScoringService } from "@/services/ml-scoring.service";

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: string;
  samplesUsed: number;
}

interface Prediction {
  candidateId: string;
  candidateName: string;
  jobTitle: string;
  score: number;
  confidence: number;
  topFactors: string[];
}

export default function MlPredictionsPage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);

  useEffect(() => {
    mlScoringService.getMetrics()
      .then((m) => setMetrics(m))
      .catch(() => setMetrics(null))
      .finally(() => setLoading(false));
  }, []);

  const handleTrain = async () => {
    setTraining(true);
    try {
      await mlScoringService.train("current-org");
      const m = await mlScoringService.getMetrics();
      setMetrics(m);
    } catch (err) {
      console.error("Training failed:", err);
    } finally {
      setTraining(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><p>Loading ML predictions...</p></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ML Predictions</h1>
        <button
          onClick={handleTrain}
          disabled={training}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {training ? "Training..." : "Retrain Model"}
        </button>
      </div>

      {/* Model Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{(metrics.accuracy * 100).toFixed(1)}%</p>
            <p className="text-sm text-slate-500">Accuracy</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{(metrics.precision * 100).toFixed(1)}%</p>
            <p className="text-sm text-slate-500">Precision</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{(metrics.recall * 100).toFixed(1)}%</p>
            <p className="text-sm text-slate-500">Recall</p>
          </div>
          <div className="bg-white rounded-lg border p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{(metrics.f1Score * 100).toFixed(1)}%</p>
            <p className="text-sm text-slate-500">F1 Score</p>
          </div>
        </div>
      )}

      {metrics && (
        <div className="bg-white rounded-lg border p-4 mb-6">
          <p className="text-sm text-slate-500">
            Last trained: {new Date(metrics.lastTrained).toLocaleDateString()} | Samples: {metrics.samplesUsed.toLocaleString()}
          </p>
        </div>
      )}

      {/* Predictions List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Top Predictions</h2>
        </div>
        <div className="divide-y">
          {predictions.map((p) => (
            <div key={p.candidateId} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.candidateName}</p>
                <p className="text-sm text-slate-500">{p.jobTitle}</p>
                <div className="flex gap-1 mt-1">
                  {p.topFactors.map((f) => (
                    <span key={f} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{f}</span>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-green-600">{(p.score * 100).toFixed(0)}%</p>
                <p className="text-xs text-slate-400">Confidence: {(p.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))}
          {predictions.length === 0 && (
            <div className="text-center py-12 text-slate-400">No predictions available. Train the model first.</div>
          )}
        </div>
      </div>
    </div>
  );
}
