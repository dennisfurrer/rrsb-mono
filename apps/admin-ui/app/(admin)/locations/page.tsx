"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocations, createLocation, updateLocation } from "@/lib/api";
import type { Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const { t } = useTranslation();

  const loadLocations = () => {
    getLocations()
      .then((res) => setLocations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadLocations, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createLocation(newName.trim(), newAddress.trim() || undefined);
      setNewName("");
      setNewAddress("");
      loadLocations();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateLocation(id, {
        name: editName,
        address: editAddress || undefined,
      });
      setEditingId(null);
      loadLocations();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("locations.title")}</h1>

      <div className="flex gap-2 max-w-lg items-end">
        <div className="flex-1 space-y-1">
          <Label>{t("locations.name")}</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("locations.namePlaceholder")}
          />
        </div>
        <div className="flex-1 space-y-1">
          <Label>{t("locations.address")}</Label>
          <Input
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            placeholder={t("locations.addressPlaceholder")}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? t("creating") : t("create")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("locations.name")}</TableHead>
            <TableHead>{t("locations.slug")}</TableHead>
            <TableHead>{t("locations.address")}</TableHead>
            <TableHead>{t("locations.scoreboards")}</TableHead>
            <TableHead>{t("locations.users")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((loc) => (
            <TableRow key={loc.id}>
              <TableCell>
                {editingId === loc.id ? (
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm"
                  />
                ) : (
                  <span>
                    {loc.name}{" "}
                    {loc.isDefault && <Badge variant="secondary">{t("default")}</Badge>}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {loc.slug}
              </TableCell>
              <TableCell>
                {editingId === loc.id ? (
                  <Input
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="h-7 text-sm"
                  />
                ) : (
                  loc.address || "-"
                )}
              </TableCell>
              <TableCell>{loc._count?.scoreboardConfigs ?? 0}</TableCell>
              <TableCell>{loc._count?.users ?? 0}</TableCell>
              <TableCell>
                {editingId === loc.id ? (
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => handleUpdate(loc.id)}>
                      {t("save")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingId(loc.id);
                      setEditName(loc.name);
                      setEditAddress(loc.address || "");
                    }}
                  >
                    {t("edit")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
