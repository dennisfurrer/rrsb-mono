"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchSetupForm } from "@/components/match-setup-form";
import { TableGrid } from "@/components/table-grid";
import { getLocations } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function MatchSetupPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tableNumbers, setTableNumbers] = useState<number[]>([]);

  useEffect(() => {
    getLocations()
      .then((res) => {
        const loc = user?.locationId
          ? res.data.find((l) => l.id === user.locationId)
          : res.data[0];
        setTableNumbers(loc?.tableNumbers ?? []);
      })
      .catch(() => {});
  }, [user]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
        {t("matchSetup.title")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>{t("matchSetup.createAssignment")}</CardTitle>
          </CardHeader>
          <CardContent>
            <MatchSetupForm />
          </CardContent>
        </Card>

        {tableNumbers.length > 0 && (
          <div className="space-y-4">
            <TableGrid tableNumbers={tableNumbers} columns={1} />
          </div>
        )}
      </div>
    </div>
  );
}
