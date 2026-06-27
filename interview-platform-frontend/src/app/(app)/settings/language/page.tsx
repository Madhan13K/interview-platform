"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  direction: "ltr" | "rtl";
  completeness: number;
}

const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", direction: "ltr", completeness: 100 },
  { code: "es", name: "Spanish", nativeName: "Español", direction: "ltr", completeness: 95 },
  { code: "fr", name: "French", nativeName: "Français", direction: "ltr", completeness: 92 },
  { code: "de", name: "German", nativeName: "Deutsch", direction: "ltr", completeness: 90 },
  { code: "pt", name: "Portuguese", nativeName: "Português", direction: "ltr", completeness: 88 },
  { code: "ja", name: "Japanese", nativeName: "日本語", direction: "ltr", completeness: 85 },
  { code: "zh", name: "Chinese (Simplified)", nativeName: "简体中文", direction: "ltr", completeness: 83 },
  { code: "ko", name: "Korean", nativeName: "한국어", direction: "ltr", completeness: 80 },
  { code: "ar", name: "Arabic", nativeName: "العربية", direction: "rtl", completeness: 75 },
  { code: "he", name: "Hebrew", nativeName: "עברית", direction: "rtl", completeness: 72 },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", direction: "ltr", completeness: 68 },
  { code: "tr", name: "Turkish", nativeName: "Türkçe", direction: "ltr", completeness: 65 },
];

interface PreviewStrings {
  greeting: string;
  button: string;
  description: string;
  date: string;
}

const PREVIEW_STRINGS: Record<string, PreviewStrings> = {
  en: { greeting: "Welcome back!", button: "Get Started", description: "Manage your interviews and candidates", date: "June 28, 2026" },
  es: { greeting: "¡Bienvenido de vuelta!", button: "Comenzar", description: "Gestione sus entrevistas y candidatos", date: "28 de junio de 2026" },
  fr: { greeting: "Bon retour !", button: "Commencer", description: "Gérez vos entretiens et candidats", date: "28 juin 2026" },
  de: { greeting: "Willkommen zurück!", button: "Loslegen", description: "Verwalten Sie Ihre Interviews und Kandidaten", date: "28. Juni 2026" },
  pt: { greeting: "Bem-vindo de volta!", button: "Começar", description: "Gerencie suas entrevistas e candidatos", date: "28 de junho de 2026" },
  ja: { greeting: "おかえりなさい！", button: "始める", description: "面接と候補者を管理する", date: "2026年6月28日" },
  zh: { greeting: "欢迎回来！", button: "开始", description: "管理您的面试和候选人", date: "2026年6月28日" },
  ko: { greeting: "돌아오신 것을 환영합니다!", button: "시작하기", description: "인터뷰와 후보자를 관리하세요", date: "2026년 6월 28일" },
  ar: { greeting: "!مرحبًا بعودتك", button: "ابدأ", description: "إدارة المقابلات والمرشحين", date: "٢٨ يونيو ٢٠٢٦" },
  he: { greeting: "!ברוך שובך", button: "התחל", description: "נהל את הראיונות והמועמדים שלך", date: "28 ביוני 2026" },
  hi: { greeting: "वापसी पर स्वागत है!", button: "शुरू करें", description: "अपने साक्षात्कार और उम्मीदवारों का प्रबंधन करें", date: "28 जून 2026" },
  tr: { greeting: "Tekrar hoş geldiniz!", button: "Başla", description: "Mülakatlarınızı ve adaylarınızı yönetin", date: "28 Haziran 2026" },
};

export default function LanguageSettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [rtlEnabled, setRtlEnabled] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem("preferred-language");
    if (saved) {
      setSelectedLanguage(saved);
      const lang = LANGUAGES.find((l) => l.code === saved);
      if (lang?.direction === "rtl") setRtlEnabled(true);
    }
  }, []);

  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang?.direction === "rtl") {
      setRtlEnabled(true);
    } else {
      setRtlEnabled(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem("preferred-language", selectedLanguage);

    // Apply RTL
    if (rtlEnabled) {
      document.documentElement.setAttribute("dir", "rtl");
    } else {
      document.documentElement.setAttribute("dir", "ltr");
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSaving(false);
  };

  const currentLang = LANGUAGES.find((l) => l.code === selectedLanguage);
  const preview = PREVIEW_STRINGS[selectedLanguage] || PREVIEW_STRINGS.en;

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Language & Region</h1>
          <p className="text-sm text-slate-500 mt-1">
            Choose your preferred language and text direction
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Auto-detect */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Auto-detect Language</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Automatically use your browser&apos;s preferred language
            </p>
          </div>
          <button
            onClick={() => setAutoDetect(!autoDetect)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              autoDetect ? "bg-indigo-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                autoDetect ? "translate-x-5" : ""
              }`}
            />
          </button>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Language</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search languages..."
            className="w-full px-3 py-2 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-indigo-300"
          />

          {/* Language Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
            {filteredLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedLanguage === lang.code
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{lang.name}</p>
                    <p className="text-xs text-slate-500">{lang.nativeName}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {lang.direction === "rtl" && (
                      <Badge className="text-xs bg-purple-100 text-purple-700">RTL</Badge>
                    )}
                    {selectedLanguage === lang.code && (
                      <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                {/* Completeness bar */}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${lang.completeness}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{lang.completeness}%</span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* RTL Toggle */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Right-to-Left (RTL) Layout</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable RTL text direction for languages like Arabic and Hebrew
            </p>
          </div>
          <button
            onClick={() => setRtlEnabled(!rtlEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              rtlEnabled ? "bg-indigo-500" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                rtlEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`p-6 rounded-lg border border-slate-200 bg-slate-50 space-y-4 ${
              rtlEnabled ? "text-right" : "text-left"
            }`}
            dir={rtlEnabled ? "rtl" : "ltr"}
          >
            <h2 className="text-xl font-bold text-slate-900">{preview.greeting}</h2>
            <p className="text-sm text-slate-600">{preview.description}</p>
            <div className="flex items-center gap-3" style={{ direction: rtlEnabled ? "rtl" : "ltr" }}>
              <Button className="bg-indigo-600 text-white">{preview.button}</Button>
              <span className="text-xs text-slate-400">{preview.date}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex items-center gap-2" style={{ direction: rtlEnabled ? "rtl" : "ltr" }}>
              <Badge variant="secondary">
                {currentLang?.nativeName} ({currentLang?.code.toUpperCase()})
              </Badge>
              {currentLang?.direction === "rtl" && (
                <Badge className="bg-purple-100 text-purple-700">RTL Active</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
