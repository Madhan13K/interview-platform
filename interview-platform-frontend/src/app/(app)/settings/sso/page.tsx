"use client";

import { useState, useEffect, useCallback } from "react";
import { ssoService, SsoConfiguration, CreateSsoConfigRequest } from "@/services/sso.service";
import { useActionFeedback } from "@/hooks/use-action-feedback";

type ProviderType = "OKTA" | "ONELOGIN" | "AZURE_AD" | "CUSTOM";

const providerLabels: Record<ProviderType, string> = {
  OKTA: "Okta",
  ONELOGIN: "OneLogin",
  AZURE_AD: "Azure AD",
  CUSTOM: "Custom SAML",
};

export default function SsoSettingsPage() {
  const [configs, setConfigs] = useState<SsoConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SsoConfiguration | null>(null);
  const [tenantId, setTenantId] = useState("default");
  const { withFeedback } = useActionFeedback();

  const [formData, setFormData] = useState<CreateSsoConfigRequest>({
    tenantId: "default",
    providerType: "OKTA",
    entityId: "",
    metadataUrl: "",
    certificate: "",
    enabled: false,
  });

  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ssoService.getByTenant(tenantId);
      setConfigs(data);
    } catch (err) {
      console.error("Failed to fetch SSO configurations:", err);
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleCreate = async () => {
    await withFeedback(
      async () => {
        await ssoService.create({ ...formData, tenantId });
        setShowCreateForm(false);
        resetForm();
        await fetchConfigs();
      },
      { successTitle: "SSO configuration created successfully" }
    );
  };

  const handleUpdate = async () => {
    if (!editingConfig) return;
    await withFeedback(
      async () => {
        await ssoService.update(editingConfig.id, {
          providerType: formData.providerType,
          entityId: formData.entityId,
          metadataUrl: formData.metadataUrl,
          certificate: formData.certificate,
          enabled: formData.enabled,
        });
        setEditingConfig(null);
        resetForm();
        await fetchConfigs();
      },
      { successTitle: "SSO configuration updated successfully" }
    );
  };

  const handleToggle = async (config: SsoConfiguration) => {
    await withFeedback(
      async () => {
        await ssoService.toggle(config.id);
        await fetchConfigs();
      },
      { successTitle: `SSO ${config.enabled ? "disabled" : "enabled"} successfully` }
    );
  };

  const handleDelete = async (configId: string) => {
    if (!confirm("Are you sure you want to delete this SSO configuration?")) return;
    await withFeedback(
      async () => {
        await ssoService.delete(configId);
        await fetchConfigs();
      },
      { successTitle: "SSO configuration deleted successfully" }
    );
  };

  const startEdit = (config: SsoConfiguration) => {
    setEditingConfig(config);
    setFormData({
      tenantId: config.tenantId,
      providerType: config.providerType,
      entityId: config.entityId,
      metadataUrl: config.metadataUrl || "",
      certificate: config.certificate || "",
      enabled: config.enabled,
    });
  };

  const resetForm = () => {
    setFormData({
      tenantId: "default",
      providerType: "OKTA",
      entityId: "",
      metadataUrl: "",
      certificate: "",
      enabled: false,
    });
  };

  const getProviderIcon = (type: ProviderType) => {
    switch (type) {
      case "OKTA":
        return (
          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm">OK</span>
          </div>
        );
      case "ONELOGIN":
        return (
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold text-sm">1L</span>
          </div>
        );
      case "AZURE_AD":
        return (
          <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center">
            <span className="text-sky-600 dark:text-sky-400 font-bold text-sm">AD</span>
          </div>
        );
      case "CUSTOM":
        return (
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
            <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">SP</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SSO Configuration</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage SAML 2.0 Single Sign-On providers for your organization
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add SSO Provider
          </button>
        </div>

        {/* Tenant Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Organization / Tenant
          </label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-64 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Enter tenant ID"
          />
        </div>

        {/* Create/Edit Form */}
        {(showCreateForm || editingConfig) && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              {editingConfig ? "Edit SSO Configuration" : "Add SSO Provider"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Provider Type *
                </label>
                <select
                  value={formData.providerType}
                  onChange={(e) => setFormData({ ...formData, providerType: e.target.value as ProviderType })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="OKTA">Okta</option>
                  <option value="ONELOGIN">OneLogin</option>
                  <option value="AZURE_AD">Azure AD</option>
                  <option value="CUSTOM">Custom SAML</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Entity ID (Issuer) *
                </label>
                <input
                  type="text"
                  value={formData.entityId}
                  onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="https://your-idp.com/entity-id"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Metadata URL
                </label>
                <input
                  type="url"
                  value={formData.metadataUrl}
                  onChange={(e) => setFormData({ ...formData, metadataUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="https://your-idp.com/metadata.xml"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  X.509 Certificate
                </label>
                <textarea
                  value={formData.certificate}
                  onChange={(e) => setFormData({ ...formData, certificate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono"
                  rows={4}
                  placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Enable immediately</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingConfig(null);
                  resetForm();
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={editingConfig ? handleUpdate : handleCreate}
                disabled={!formData.entityId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingConfig ? "Update Configuration" : "Create Configuration"}
              </button>
            </div>
          </div>
        )}

        {/* Configurations List */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48 mx-auto mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-32 mx-auto" />
            </div>
          </div>
        ) : configs.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No SSO Providers Configured</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Add a SAML 2.0 identity provider to enable single sign-on for your organization.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => (
              <div
                key={config.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getProviderIcon(config.providerType)}
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        {providerLabels[config.providerType]}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Entity ID: {config.entityId}
                      </p>
                      {config.metadataUrl && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-md">
                          Metadata: {config.metadataUrl}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Status badge */}
                    <span
                      className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        config.enabled
                          ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      }`}
                    >
                      {config.enabled ? "Active" : "Disabled"}
                    </span>
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(config)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        config.enabled ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          config.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => startEdit(config)}
                      className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">SAML 2.0 Configuration Guide</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1.5">
            <li>1. Create a SAML application in your Identity Provider (IdP)</li>
            <li>2. Set the ACS URL to: <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">https://your-domain.com/api/v1/sso/saml/callback</code></li>
            <li>3. Set the Entity ID / Audience to match your application identifier</li>
            <li>4. Copy the IdP metadata URL or certificate and paste it here</li>
            <li>5. Enable the configuration once testing is complete</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
