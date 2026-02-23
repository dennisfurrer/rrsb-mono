"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  getNamesList,
  addNamesListEntry,
  deleteNamesListEntry,
  uploadNamesListCsv,
} from "@/lib/api";
import type { NamesList, NamesListEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function NamesListDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const [list, setList] = useState<NamesList | null>(null);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newIOC, setNewIOC] = useState("");
  const [uploading, setUploading] = useState(false);

  const loadList = () => {
    getNamesList(id)
      .then((res) => setList(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(loadList, [id]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await addNamesListEntry(id, newName.trim(), newIOC.trim());
      setNewName("");
      setNewIOC("");
      loadList();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteNamesListEntry(id, entryId);
      loadList();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadNamesListCsv(id, file);
      alert(t("namesLists.detail.imported", { count: result.data.count }));
      loadList();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) return <div className="text-muted-foreground">{t("loading")}</div>;
  if (!list) return <div>{t("namesLists.detail.notFound")}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{list.name}</h1>

      <div className="flex gap-2 items-end max-w-lg">
        <div className="flex-1 space-y-1">
          <Label>{t("namesLists.detail.playerName")}</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("namesLists.detail.namePlaceholder")}
          />
        </div>
        <div className="w-24 space-y-1">
          <Label>IOC</Label>
          <Input
            value={newIOC}
            onChange={(e) => setNewIOC(e.target.value)}
            placeholder="SUI"
          />
        </div>
        <Button onClick={handleAdd}>{t("create")}</Button>
      </div>

      <div className="flex gap-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="text-sm"
        />
        {uploading && (
          <span className="text-sm text-muted-foreground">{t("namesLists.detail.uploading")}</span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>{t("namesLists.name")}</TableHead>
            <TableHead>IOC</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.entries?.map((entry, i) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
              <TableCell>{entry.playerName}</TableCell>
              <TableCell>{entry.nationalityIOC}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  className="text-destructive"
                >
                  {t("remove")}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!list.entries || list.entries.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {t("namesLists.detail.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
