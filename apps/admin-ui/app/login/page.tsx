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
import { ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
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
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#060907]">
      {/* Layered background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(18,23,21,0.9) 0%, #060907 70%)",
        }}
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Accent ambient glow — behind logo */}
      <div
        className="pointer-events-none fixed"
        style={{
          width: "500px",
          height: "500px",
          top: "28%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(212,168,67,0.04) 0%, transparent 60%)",
        }}
      />

      {/* Brand ambient glow — bottom */}
      <div
        className="pointer-events-none fixed"
        style={{
          width: "800px",
          height: "400px",
          bottom: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          background: "radial-gradient(ellipse, rgba(52,211,153,0.03) 0%, transparent 70%)",
        }}
      />

      {/* Decorative lines */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/[0.03] to-transparent" />
      </div>

      <div className="relative w-full max-w-[380px]">
        <div className="flex flex-col items-center">
          {/* Logo with glow ring */}
          <div className="relative mb-4">
            <div
              className="absolute inset-0 -m-4 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(212,168,67,0.06) 0%, transparent 70%)",
              }}
            />
            <Image
              src="/round-robin-logo.png"
              alt="Round Robin Sports"
              width={80}
              height={80}
              className="w-20 h-20 object-contain relative"
              priority
            />
          </div>

          {/* Brand text */}
          <div className="flex flex-col items-center mb-5">
            <h1 className="text-2xl font-display font-extrabold tracking-tight">
              <span className="text-text-primary">RRSB</span>{" "}
              <span className="text-accent/70">Admin</span>
            </h1>
          </div>

          {/* Card */}
          <div
            className="w-full rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(170deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.005) 40%, rgba(255,255,255,0.01) 100%)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(0,0,0,0.4), 0 8px 40px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            {/* Card top accent line */}
            <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />

            <div className="p-8 pt-7">
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="email"
                    className={cn(
                      "text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-colors duration-200",
                      focused === "email" ? "text-accent/70" : "text-text-muted/60"
                    )}
                  >
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
                    onFocus={() => setFocused("email")}
                    onBlur={() => setFocused(null)}
                    placeholder="ronnie147@worldsnooker.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-text-primary placeholder:text-text-muted/20 outline-none focus:border-accent/25 focus:bg-white/[0.03] focus:shadow-[0_0_0_3px_rgba(212,168,67,0.06)] transition-all duration-200"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label
                    htmlFor="password"
                    className={cn(
                      "text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-colors duration-200",
                      focused === "password" ? "text-accent/70" : "text-text-muted/60"
                    )}
                  >
                    {t("login.password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.05] text-sm text-text-primary placeholder:text-text-muted/20 outline-none focus:border-accent/25 focus:bg-white/[0.03] focus:shadow-[0_0_0_3px_rgba(212,168,67,0.06)] transition-all duration-200"
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/[0.06] border border-danger/10">
                    <p className="text-sm text-danger">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full mt-2 px-4 py-3 rounded-xl bg-brand text-brand-text text-sm font-semibold ring-1 ring-inset ring-white/[0.12] shadow-[0_2px_12px_rgba(52,211,153,0.15)] hover:shadow-[0_4px_20px_rgba(52,211,153,0.2)] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-[1.5px] border-brand-text border-t-transparent rounded-full animate-spin" />
                      {t("login.submitting")}
                    </span>
                  ) : (
                    <>
                      {t("login.submit")}
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Language switcher */}
          <div className="mt-8 flex gap-1">
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale}
                onClick={() => changeLanguage(locale)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[0.65rem] font-semibold uppercase tracking-[0.15em] transition-all duration-200",
                  i18n.language === locale
                    ? "text-accent/80 bg-accent/[0.06] border border-accent/[0.08]"
                    : "text-text-muted/30 hover:text-text-muted/50 border border-transparent"
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
