"use client";

import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
  lastSynced: string | null;
  recordsSynced: number;
  errors: number;
  apiKey: string;
  webhookUrl: string;
  syncFrequency: "realtime" | "hourly" | "daily" | "weekly";
}

const initialIntegrations: Integration[] = [
  {
    id: "greenhouse",
    name: "Greenhouse",
    description: "ATS sync - Import candidates, jobs, and interview data",
    category: "ATS",
    connected: true,
    lastSynced: "2 minutes ago",
    recordsSynced: 12450,
    errors: 0,
    apiKey: "gh_key_••••••••",
    webhookUrl: "https://api.company.com/webhooks/greenhouse",
    syncFrequency: "realtime",
  },
  {
    id: "lever",
    name: "Lever",
    description: "ATS sync - Bidirectional candidate and pipeline sync",
    category: "ATS",
    connected: false,
    lastSynced: null,
    recordsSynced: 0,
    errors: 0,
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "hourly",
  },
  {
    id: "workday",
    name: "Workday",
    description: "HRIS sync - Employee records and organizational data",
    category: "HRIS",
    connected: true,
    lastSynced: "1 hour ago",
    recordsSynced: 3200,
    errors: 2,
    apiKey: "wd_key_••••••••",
    webhookUrl: "https://api.company.com/webhooks/workday",
    syncFrequency: "daily",
  },
  {
    id: "slack",
    name: "Slack",
    description: "Notifications - Interview reminders and hiring updates",
    category: "Notifications",
    connected: true,
    lastSynced: "5 minutes ago",
    recordsSynced: 890,
    errors: 0,
    apiKey: "xoxb-••••••••",
    webhookUrl: "https://hooks.slack.com/services/T00/B00/xxx",
    syncFrequency: "realtime",
  },
  {
    id: "teams",
    name: "Microsoft Teams",
    description: "Notifications - Team channels and direct messages",
    category: "Notifications",
    connected: false,
    lastSynced: null,
    recordsSynced: 0,
    errors: 0,
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "realtime",
  },
  {
    id: "google-calendar",
    name: "Google Calendar",
    description: "Scheduling - Sync interview slots and availability",
    category: "Scheduling",
    connected: true,
    lastSynced: "10 minutes ago",
    recordsSynced: 2340,
    errors: 0,
    apiKey: "goog_••••••••",
    webhookUrl: "https://api.company.com/webhooks/gcal",
    syncFrequency: "realtime",
  },
  {
    id: "outlook",
    name: "Outlook",
    description: "Scheduling - Calendar integration and email sync",
    category: "Scheduling",
    connected: false,
    lastSynced: null,
    recordsSynced: 0,
    errors: 0,
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "hourly",
  },
  {
    id: "linkedin",
    name: "LinkedIn Recruiter",
    description: "Sourcing - Import candidate profiles and InMail sync",
    category: "Sourcing",
    connected: true,
    lastSynced: "30 minutes ago",
    recordsSynced: 5680,
    errors: 1,
    apiKey: "li_key_••••••••",
    webhookUrl: "https://api.company.com/webhooks/linkedin",
    syncFrequency: "hourly",
  },
  {
    id: "indeed",
    name: "Indeed",
    description: "Job posting - Publish jobs and receive applications",
    category: "Job Posting",
    connected: true,
    lastSynced: "15 minutes ago",
    recordsSynced: 4200,
    errors: 0,
    apiKey: "ind_key_••••••••",
    webhookUrl: "https://api.company.com/webhooks/indeed",
    syncFrequency: "hourly",
  },
  {
    id: "docusign",
    name: "DocuSign",
    description: "E-signatures - Send and track offer letter signatures",
    category: "E-signatures",
    connected: false,
    lastSynced: null,
    recordsSynced: 0,
    errors: 0,
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "realtime",
  },
  {
    id: "zoom",
    name: "Zoom",
    description: "Video - Auto-create meeting links for interviews",
    category: "Video",
    connected: true,
    lastSynced: "8 minutes ago",
    recordsSynced: 1560,
    errors: 0,
    apiKey: "zoom_key_••••••••",
    webhookUrl: "https://api.company.com/webhooks/zoom",
    syncFrequency: "realtime",
  },
  {
    id: "github",
    name: "GitHub",
    description: "Assessment - Code review and technical assessment integration",
    category: "Assessment",
    connected: false,
    lastSynced: null,
    recordsSynced: 0,
    errors: 0,
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "daily",
  },
];

const categoryIcons: Record<string, string> = {
  ATS: "A",
  HRIS: "H",
  Notifications: "N",
  Scheduling: "S",
  Sourcing: "So",
  "Job Posting": "J",
  "E-signatures": "E",
  Video: "V",
  Assessment: "G",
};

const categoryColors: Record<string, string> = {
  ATS: "bg-indigo-100 text-indigo-600",
  HRIS: "bg-purple-100 text-purple-600",
  Notifications: "bg-amber-100 text-amber-600",
  Scheduling: "bg-emerald-100 text-emerald-600",
  Sourcing: "bg-blue-100 text-blue-600",
  "Job Posting": "bg-rose-100 text-rose-600",
  "E-signatures": "bg-teal-100 text-teal-600",
  Video: "bg-cyan-100 text-cyan-600",
  Assessment: "bg-slate-100 text-slate-600",
};

type TestStatus = "idle" | "loading" | "success" | "failure";

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, TestStatus>>({});
  const [configForm, setConfigForm] = useState({
    apiKey: "",
    webhookUrl: "",
    syncFrequency: "hourly" as Integration["syncFrequency"],
  });

  const handleConnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, connected: true, lastSynced: "Just now", recordsSynced: 0, errors: 0 }
          : i
      )
    );
  };

  const handleDisconnect = (id: string) => {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, connected: false, lastSynced: null, recordsSynced: 0, errors: 0, apiKey: "", webhookUrl: "" }
          : i
      )
    );
  };

  const openDetail = (integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      apiKey: integration.apiKey,
      webhookUrl: integration.webhookUrl,
      syncFrequency: integration.syncFrequency,
    });
    setShowDetail(true);
  };

  const handleTestConnection = (id: string) => {
    setTestStatus((prev) => ({ ...prev, [id]: "loading" }));
    setTimeout(() => {
      const integration = integrations.find((i) => i.id === id);
      if (integration?.connected) {
        setTestStatus((prev) => ({ ...prev, [id]: "success" }));
      } else {
        setTestStatus((prev) => ({ ...prev, [id]: "failure" }));
      }
      setTimeout(() => {
        setTestStatus((prev) => ({ ...prev, [id]: "idle" }));
      }, 3000);
    }, 1500);
  };

  const handleSaveConfig = () => {
    if (!selectedIntegration) return;
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === selectedIntegration.id
          ? { ...i, apiKey: configForm.apiKey, webhookUrl: configForm.webhookUrl, syncFrequency: configForm.syncFrequency }
          : i
      )
    );
    setShowDetail(false);
    setSelectedIntegration(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your favorite tools and services to streamline your hiring workflow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Connected</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {integrations.filter((i) => i.connected).length} / {integrations.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Records Synced</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {integrations.reduce((sum, i) => sum + i.recordsSynced, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Sync Errors</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {integrations.reduce((sum, i) => sum + i.errors, 0)}
          </p>
          <p className="text-xs text-emerald-600 mt-1">All non-critical</p>
        </div>
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${categoryColors[integration.category] || "bg-slate-100 text-slate-600"}`}>
                  {categoryIcons[integration.category] || "?"}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{integration.name}</h3>
                  <span className="text-xs text-slate-500">{integration.category}</span>
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  integration.connected
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {integration.connected ? "Connected" : "Disconnected"}
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-3">{integration.description}</p>

            {integration.connected && (
              <div className="text-xs text-slate-500 mb-3 space-y-1">
                <p>Last synced: {integration.lastSynced}</p>
                <p>Records: {integration.recordsSynced.toLocaleString()}</p>
                {integration.errors > 0 && (
                  <p className="text-amber-600">{integration.errors} error(s)</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-auto">
              {integration.connected ? (
                <>
                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                  <button
                    onClick={() => openDetail(integration)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    Configure
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleConnect(integration.id)}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Connect
                </button>
              )}
              <button
                onClick={() => handleTestConnection(integration.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  testStatus[integration.id] === "loading"
                    ? "border-slate-300 text-slate-400 cursor-wait"
                    : testStatus[integration.id] === "success"
                    ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                    : testStatus[integration.id] === "failure"
                    ? "border-red-300 text-red-700 bg-red-50"
                    : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
                disabled={testStatus[integration.id] === "loading"}
              >
                {testStatus[integration.id] === "loading"
                  ? "Testing..."
                  : testStatus[integration.id] === "success"
                  ? "OK"
                  : testStatus[integration.id] === "failure"
                  ? "Failed"
                  : "Test"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Detail Dialog */}
      {showDetail && selectedIntegration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {selectedIntegration.name} Configuration
              </h2>
              <button
                onClick={() => { setShowDetail(false); setSelectedIntegration(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Configuration Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter API key..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={configForm.webhookUrl}
                  onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sync Frequency</label>
                <select
                  value={configForm.syncFrequency}
                  onChange={(e) => setConfigForm({ ...configForm, syncFrequency: e.target.value as Integration["syncFrequency"] })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="realtime">Real-time</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            </div>

            {/* Sync History */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Sync History</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-slate-600">Timestamp</th>
                      <th className="text-left px-3 py-2 text-slate-600">Status</th>
                      <th className="text-right px-3 py-2 text-slate-600">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">Today, 10:30 AM</td>
                      <td className="px-3 py-2"><span className="text-emerald-600">Success</span></td>
                      <td className="px-3 py-2 text-right text-slate-700">245</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">Today, 9:30 AM</td>
                      <td className="px-3 py-2"><span className="text-emerald-600">Success</span></td>
                      <td className="px-3 py-2 text-right text-slate-700">189</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">Yesterday, 5:00 PM</td>
                      <td className="px-3 py-2"><span className="text-amber-600">Partial</span></td>
                      <td className="px-3 py-2 text-right text-slate-700">312</td>
                    </tr>
                    <tr className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">Yesterday, 2:00 PM</td>
                      <td className="px-3 py-2"><span className="text-emerald-600">Success</span></td>
                      <td className="px-3 py-2 text-right text-slate-700">198</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Mapping */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Data Mapping</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Candidate Name</span>
                  <span className="text-xs text-indigo-600 font-medium">→ Full Name</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Email Address</span>
                  <span className="text-xs text-indigo-600 font-medium">→ Primary Email</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Phone Number</span>
                  <span className="text-xs text-indigo-600 font-medium">→ Contact Phone</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs text-slate-600">Resume URL</span>
                  <span className="text-xs text-indigo-600 font-medium">→ Document Link</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDetail(false); setSelectedIntegration(null); }}
                className="px-4 py-2 text-sm text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
