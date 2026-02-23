"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getLocations,
} from "@/lib/api";
import type { User, Location } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, X, Trash2, ChevronDown } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { t } = useTranslation();

  // Create form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState("PARTNER_ADMIN");
  const [locationId, setLocationId] = useState("");
  const [creating, setCreating] = useState(false);

  const loadData = () => {
    Promise.all([getUsers(), getLocations()])
      .then(([uRes, lRes]) => {
        setUsers(uRes.data);
        setLocations(lRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createUser({
        email,
        password,
        displayName,
        role,
        locationId: locationId || undefined,
      });
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("PARTNER_ADMIN");
      setLocationId("");
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("users.confirmDelete"))) return;
    try {
      await deleteUser(id);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }

  const selectClasses = "flex h-9 w-full rounded-lg bg-white/[0.02] border border-border px-3 pr-8 text-sm text-text-primary appearance-none focus:outline-none focus:ring-1 focus:ring-brand/20 focus:border-brand/20 transition-all duration-150";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
          {t("users.title")}
        </h1>
        <Button
          variant={showCreate ? "ghost" : "brand"}
          onClick={() => setShowCreate(!showCreate)}
        >
          {showCreate ? (
            <><X className="w-4 h-4" /> {t("cancel")}</>
          ) : (
            <><Plus className="w-4 h-4" /> {t("users.createUser")}</>
          )}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{t("users.newUser")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>{t("users.email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.password")}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.displayName")}</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("users.role")}</Label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="PARTNER_ADMIN">{t("users.roles.PARTNER_ADMIN")}</option>
                    <option value="ADMIN">{t("users.roles.ADMIN")}</option>
                    <option value="SUPER_ADMIN">{t("users.roles.SUPER_ADMIN")}</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("users.location")}</Label>
                <div className="relative">
                  <select
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="">{t("none")}</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                </div>
              </div>
              <Button variant="brand" type="submit" disabled={creating}>
                {creating ? t("creating") : t("create")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("users.name")}</TableHead>
            <TableHead>{t("users.email")}</TableHead>
            <TableHead>{t("users.role")}</TableHead>
            <TableHead>{t("users.location")}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="text-text-primary">{u.displayName}</TableCell>
              <TableCell className="text-sm text-text-secondary">{u.email}</TableCell>
              <TableCell>
                <Badge variant={
                  u.role === "SUPER_ADMIN" ? "brand" :
                  u.role === "ADMIN" ? "info" :
                  "default"
                }>
                  {t(`users.roles.${u.role}`)}
                </Badge>
              </TableCell>
              <TableCell className="text-text-secondary">{u.location?.name || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-danger h-7 w-7 p-0"
                  onClick={() => handleDelete(u.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
