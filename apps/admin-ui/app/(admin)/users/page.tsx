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

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("users.title")}</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? t("cancel") : t("users.createUser")}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>{t("users.newUser")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3 max-w-md">
              <div className="space-y-1">
                <Label>{t("users.email")}</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t("users.password")}</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t("users.displayName")}</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>{t("users.role")}</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="PARTNER_ADMIN">{t("users.roles.PARTNER_ADMIN")}</option>
                  <option value="ADMIN">{t("users.roles.ADMIN")}</option>
                  <option value="SUPER_ADMIN">{t("users.roles.SUPER_ADMIN")}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>{t("users.location")}</Label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                >
                  <option value="">{t("none")}</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={creating}>
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
              <TableCell>{u.displayName}</TableCell>
              <TableCell className="text-sm">{u.email}</TableCell>
              <TableCell>
                <Badge variant="secondary">{t(`users.roles.${u.role}`)}</Badge>
              </TableCell>
              <TableCell>{u.location?.name || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => handleDelete(u.id)}
                >
                  {t("delete")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
