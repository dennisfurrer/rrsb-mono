"use client";

import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchSetupForm } from "@/components/match-setup-form";

export default function MatchSetupPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
        {t("matchSetup.title")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>{t("matchSetup.createAssignment")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchSetupForm />
        </CardContent>
      </Card>
    </div>
  );
}
