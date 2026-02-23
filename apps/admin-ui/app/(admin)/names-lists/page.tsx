"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { getNamesLists, createNamesList } from "@/lib/api";
import type { NamesList } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NamesListsPage() {
  const [lists, setLists] = useState<NamesList[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const { t } = useTranslation();

  const loadLists = () => {
    getNamesLists()
      .then((res) => setLists(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadLists, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createNamesList(newName.trim());
      setNewName("");
      loadLists();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("namesLists.title")}</h1>

      <div className="flex gap-2 max-w-md">
        <Input
          placeholder={t("namesLists.newPlaceholder")}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />
        <Button onClick={handleCreate} disabled={creating}>
          {creating ? t("creating") : t("create")}
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("namesLists.name")}</TableHead>
            <TableHead>{t("namesLists.entries")}</TableHead>
            <TableHead>{t("namesLists.created")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lists.map((list) => (
            <TableRow key={list.id}>
              <TableCell>
                <Link
                  href={`/names-lists/${list.id}`}
                  className="text-primary hover:underline"
                >
                  {list.name}
                </Link>
              </TableCell>
              <TableCell>{list._count?.entries ?? 0}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(list.createdAt).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
          {lists.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                {t("namesLists.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
