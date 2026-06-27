"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ThemeMode = "light" | "dark" | "system";

interface ColorScheme {
  name: string;
  primary: string;
  accent: string;
  background: string;
  foreground: string;
}

const COLOR_SCHEMES: ColorScheme[] = [
  { name: "Indigo", primary: "#4f46e5", accent: "#818cf8", background: "#f8fafc", foreground: "#1e293b" },
  { name: "Blue", primary: "#2563eb", accent: "#60a5fa", background: "#f8fafc", foreground: "#1e293b" },
  { name: "Purple", primary: "#7c3aed", accent: "#a78bfa", background: "#f8fafc", foreground: "#1e293b" },
  { name: "Teal", primary: "#0d9488", accent: "#5eead4", background: "#f8fafc", foreground: "#1e293b" },
  { name: "Rose", primary: "#e11d48", accent: "#fb7185", background: "#f8fafc", foreground: "#1e293b" },
  { name: "Amber", primary: "#d97706", accent: "#fbbf24", background: "#f8fafc", foreground: "#1e293b" },
];

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<ThemeMode>("system");
  const [selectedScheme, setSelectedScheme] = useState<ColorScheme>(COLOR_SCHEMES[0]);
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [systemPreference, setSystemPreference] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Detect system preference
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPreference(mediaQuery.matches ? "dark" : "light");

    const handler = (e: MediaQueryListEvent) => {
      setSystemPreference(e.matches ? "dark" : "light");
    };
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem("theme-mode") as ThemeMode | null;
    const savedScheme = localStorage.getItem("color-scheme");
    const savedFontSize = localStorage.getItem("font-size") as typeof fontSize | null;

    if (savedTheme) setTheme(savedTheme);
    if (savedScheme) {
      const scheme = COLOR_SCHEMES.find((s) => s.name === savedScheme);
      if (scheme) setSelectedScheme(scheme);
    }
    if (savedFontSize) setFontSize(savedFontSize);
  }, []);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    localStorage.setItem("theme-mode", newTheme);

    const root = document.documentElement;
    if (newTheme === "dark" || (newTheme === "system" && systemPreference === "dark")) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleSchemeChange = (scheme: ColorScheme) => {
    setSelectedScheme(scheme);
    localStorage.setItem("color-scheme", scheme.name);
    document.documentElement.style.setProperty("--color-primary", scheme.primary);
    document.documentElement.style.setProperty("--color-accent", scheme.accent);
  };

  const handleFontSizeChange = (size: typeof fontSize) => {
    setFontSize(size);
    localStorage.setItem("font-size", size);
  };

  const effectiveTheme = theme === "system" ? systemPreference : theme;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Appearance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "system"] as ThemeMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => handleThemeChange(mode)}
                className={`relative p-4 rounded-lg border-2 transition-all ${
                  theme === mode
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-full h-20 rounded-md mb-3 ${
                  mode === "light" ? "bg-white border border-slate-200" :
                  mode === "dark" ? "bg-slate-800 border border-slate-700" :
                  "bg-gradient-to-r from-white to-slate-800 border border-slate-300"
                }`}>
                  <div className="p-2 space-y-1.5">
                    <div className={`h-2 w-3/4 rounded ${mode === "dark" ? "bg-slate-600" : "bg-slate-200"}`} />
                    <div className={`h-2 w-1/2 rounded ${mode === "dark" ? "bg-slate-600" : "bg-slate-200"}`} />
                    <div className={`h-2 w-2/3 rounded ${mode === "dark" ? "bg-slate-600" : "bg-slate-200"}`} />
                  </div>
                </div>
                <span className="text-sm font-medium capitalize text-slate-700">{mode}</span>
                {theme === mode && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">
            System preference detected: <strong>{systemPreference}</strong> |
            Active theme: <strong>{effectiveTheme}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Color Scheme</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.name}
                onClick={() => handleSchemeChange(scheme)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedScheme.name === scheme.name
                    ? "border-indigo-500"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: scheme.primary }} />
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: scheme.accent }} />
                </div>
                <span className="text-sm font-medium text-slate-700">{scheme.name}</span>
              </button>
            ))}
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <button
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: selectedScheme.primary }}
              >
                Primary Button
              </button>
              <button
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: selectedScheme.accent }}
              >
                Accent Button
              </button>
              <span
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: selectedScheme.accent + "30", color: selectedScheme.primary }}
              >
                Badge
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Font Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {(["sm", "base", "lg"] as const).map((size) => (
              <button
                key={size}
                onClick={() => handleFontSizeChange(size)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  fontSize === size
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <span className={`font-medium text-slate-700 ${
                  size === "sm" ? "text-sm" : size === "base" ? "text-base" : "text-lg"
                }`}>
                  {size === "sm" ? "Small" : size === "base" ? "Default" : "Large"}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accessibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Reduced Motion</p>
              <p className="text-xs text-slate-500">Minimize animations and transitions</p>
            </div>
            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                reducedMotion ? "bg-indigo-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  reducedMotion ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Compact Mode</p>
              <p className="text-xs text-slate-500">Reduce padding and spacing for denser layout</p>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                compactMode ? "bg-indigo-500" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  compactMode ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
