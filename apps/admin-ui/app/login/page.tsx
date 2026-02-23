"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import {
  SUPPORTED_LOCALES,
  LOCALE_LABELS,
  changeLanguage,
} from "@/lib/i18n";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || t("login.failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, var(--surface-2), var(--surface-1), var(--surface-0))",
      }}
    >
      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
        }}
      />
      {/* Brand ambient glow */}
      <div
        className="pointer-events-none fixed"
        style={{
          width: "600px",
          height: "400px",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <div className="flex flex-col items-center mb-10">
            <Image
              src="/rrsb-header.png"
              alt="Round Robin Sports"
              width={300}
              height={75}
              className="w-64 h-auto object-contain mb-4"
              priority
            />
            <p className="text-xs uppercase tracking-[0.25em] text-text-muted font-medium">
              {t("appName")}
            </p>
          </div>

          {/* Card */}
          <div
            className="w-full rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 50%, rgba(255,255,255,0.02) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.3), 0 4px 24px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)",
            }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  {t("login.email")}
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoFocus
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/[0.06] text-sm text-text-primary placeholder:text-text-muted/30 outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  {t("login.password")}
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-white/[0.06] text-sm text-text-primary placeholder:text-text-muted/30 outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/15 transition-all"
                />
              </div>

              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 px-4 py-3 rounded-lg bg-brand text-brand-text text-sm font-semibold ring-1 ring-inset ring-white/10 shadow-sm shadow-brand/20 hover:brightness-110 disabled:opacity-40 transition-all"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-[1.5px] border-brand-text border-t-transparent rounded-full animate-spin" />
                    {t("login.submitting")}
                  </span>
                ) : (
                  t("login.submit")
                )}
              </button>
            </form>
          </div>

          {/* Language switcher */}
          <div className="mt-6 flex gap-2">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => changeLanguage(locale)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all duration-150",
                  i18n.language === locale
                    ? "text-brand bg-brand/[0.08] border border-brand/10"
                    : "text-text-muted/40 hover:text-text-muted border border-transparent"
                )}
              >
                {LOCALE_LABELS[locale]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
