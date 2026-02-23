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
import { Trash2, Upload } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-text-muted">
        <span className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }
  if (!list) return <div className="text-text-muted">{t("namesLists.detail.notFound")}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-display font-extrabold text-text-primary tracking-tight">
        {list.name}
      </h1>

      <div className="flex gap-2 items-end max-w-lg">
        <div className="flex-1 space-y-2">
          <Label>{t("namesLists.detail.playerName")}</Label>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("namesLists.detail.namePlaceholder")}
          />
        </div>
        <div className="w-24 space-y-2">
          <Label>IOC</Label>
          <Input
            value={newIOC}
            onChange={(e) => setNewIOC(e.target.value)}
            placeholder="SUI"
          />
        </div>
        <Button variant="brand" onClick={handleAdd}>{t("create")}</Button>
      </div>

      <div className="flex gap-3 items-center">
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-border text-xs text-text-secondary hover:text-text-primary hover:bg-white/[0.04] transition-all duration-150 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          CSV
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleUpload}
            className="hidden"
          />
        </label>
        {uploading && (
          <span className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-3 h-3 border-[1.5px] border-brand border-t-transparent rounded-full animate-spin" />
            {t("namesLists.detail.uploading")}
          </span>
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
              <TableCell className="text-text-muted font-mono text-xs">{i + 1}</TableCell>
              <TableCell className="text-text-primary">{entry.playerName}</TableCell>
              <TableCell className="text-text-secondary font-mono text-xs">{entry.nationalityIOC}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(entry.id)}
                  className="text-danger h-7 w-7 p-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!list.entries || list.entries.length === 0) && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-text-muted py-8">
                {t("namesLists.detail.empty")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
