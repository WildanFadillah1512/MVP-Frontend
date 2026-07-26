"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Download, Plus, Trash2, Upload } from "lucide-react";
import { api } from '@/lib/api/axios';
import { uploadApi } from '@/features/uploads/api/upload.api';
import { toast } from 'sonner';

const emptyConfig = {
  values: [],
  principles: [],
  files: []
};

export default function CoreValuesPage() {
  const [config, setConfig] = useState<any>(emptyConfig);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState('');

  const canManage = ['OWNER', 'CEO', 'ADMIN'].includes(userRole);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/settings/core-values');
      if (res.data.success) setConfig(res.data.data);
    } catch (error) {
      toast.error('Gagal mengambil etos kerja');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.role?.name || '');
    }
    fetchConfig();
  }, []);

  const updateValue = (index: number, field: 'title' | 'description', value: string) => {
    setConfig((current: any) => ({
      ...current,
      values: current.values.map((item: any, itemIndex: number) => itemIndex === index ? { ...item, [field]: value } : item)
    }));
  };

  const updatePrinciple = (index: number, value: string) => {
    setConfig((current: any) => ({
      ...current,
      principles: current.principles.map((item: string, itemIndex: number) => itemIndex === index ? value : item)
    }));
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const cleaned = {
        values: config.values.filter((item: any) => item.title?.trim() || item.description?.trim()),
        principles: config.principles.filter((item: string) => item.trim()),
        files: config.files
      };
      const res = await api.put('/settings/core-values', cleaned);
      if (res.data.success) {
        setConfig(res.data.data);
        toast.success('Etos kerja berhasil diperbarui');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan etos kerja');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadApi.uploadGenericFile(file, 'CORE_VALUES');
      if (res.success) {
        setConfig((current: any) => ({
          ...current,
          files: [
            ...(current.files || []),
            { name: res.data.fileName || file.name, url: res.data.fileUrl }
          ]
        }));
        toast.success('File berhasil diupload. Simpan untuk menerapkan.');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal upload file');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Etos Kerja, Core, dan Prinsip</h1>
          <p className="mt-1 text-muted-foreground">Rujukan sikap kerja harian untuk seluruh karyawan.</p>
        </div>
        {canManage && (
          <Button onClick={saveConfig} disabled={isSaving || isUploading} className="rounded-xl">
            {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(config.values || []).map((value: any, index: number) => (
          <Card key={index} className="rounded-2xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                {canManage ? (
                  <Input value={value.title || ''} onChange={(event) => updateValue(index, 'title', event.target.value)} className="rounded-xl font-semibold" />
                ) : (
                  value.title
                )}
              </CardTitle>
              {canManage ? (
                <Textarea value={value.description || ''} onChange={(event) => updateValue(index, 'description', event.target.value)} className="mt-2 min-h-[90px] rounded-xl" />
              ) : (
                <CardDescription>{value.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      {canManage && (
        <Button
          type="button"
          variant="outline"
          className="w-fit rounded-xl"
          onClick={() => setConfig((current: any) => ({ ...current, values: [...(current.values || []), { title: '', description: '' }] }))}
        >
          <Plus className="h-4 w-4" />
          Tambah Value
        </Button>
      )}

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>Prinsip Keputusan</CardTitle>
          <CardDescription>Urutan prioritas saat mengambil keputusan kerja.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 text-sm text-foreground md:grid-cols-3">
            {(config.principles || []).map((principle: string, index: number) => (
              <li key={index} className="rounded-xl border bg-muted/30 p-4 font-medium">
                {canManage ? (
                  <Input value={principle} onChange={(event) => updatePrinciple(index, event.target.value)} className="rounded-xl" />
                ) : (
                  `${index + 1}. ${principle}`
                )}
              </li>
            ))}
          </ol>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              className="mt-4 rounded-xl"
              onClick={() => setConfig((current: any) => ({ ...current, principles: [...(current.principles || []), ''] }))}
            >
              <Plus className="h-4 w-4" />
              Tambah Prinsip
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-border shadow-sm">
        <CardHeader>
          <CardTitle>File Panduan</CardTitle>
          <CardDescription>Dokumen dari CEO yang bisa di-download karyawan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {canManage && (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <Label className="mb-2 block">Upload File</Label>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted/50">
                <Upload className="h-4 w-4" />
                {isUploading ? 'Mengupload...' : 'Upload Dokumen'}
                <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
              </label>
            </div>
          )}
          {(config.files || []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">Belum ada file panduan.</p>
          ) : (
            (config.files || []).map((file: any, index: number) => (
              <div key={`${file.url}-${index}`} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <p className="font-semibold text-foreground">{file.name || `File ${index + 1}`}</p>
                  <p className="break-all text-xs text-muted-foreground">{file.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-muted/50">
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                  {canManage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="rounded-lg"
                      onClick={() => setConfig((current: any) => ({ ...current, files: current.files.filter((_: any, fileIndex: number) => fileIndex !== index) }))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
