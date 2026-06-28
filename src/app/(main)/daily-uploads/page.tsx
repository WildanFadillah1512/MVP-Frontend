"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UploadCloud, FileImage, ExternalLink, CheckCircle2, CloudUpload, File } from "lucide-react";
import { uploadApi } from '@/features/uploads/api/upload.api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export default function DailyUploadsPage() {
  const [uploads, setUploads] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchUploads = async () => {
    try {
      const res = await uploadApi.getMyUploads();
      if (res.success) setUploads(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchUploads(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) setSelectedFile(e.dataTransfer.files[0]);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) { toast.error('Pilih file terlebih dahulu'); return; }
    setIsUploading(true);
    try {
      const res = await uploadApi.uploadFile(selectedFile);
      if (res.success) {
        toast.success('File berhasil diunggah ke Cloud!');
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchUploads();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengunggah file. Pastikan Google Drive dikonfigurasi Admin.');
    } finally { setIsUploading(false); }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="pb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Upload Harian</h1>
        <p className="text-muted-foreground mt-1">Unggah file bukti pekerjaan, foto, atau dokumen harian Anda ke Google Drive perusahaan.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Upload Form */}
        <Card className="lg:col-span-2 border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <CloudUpload className="w-5 h-5 text-primary" /> Upload Dokumen
            </CardTitle>
            <CardDescription>File disimpan terpusat di Google Drive perusahaan</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              {/* Drag & Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-muted/50 dark:bg-primary/10'
                    : selectedFile
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                />
                {selectedFile ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-muted-foreground hover:text-rose-500 transition-colors"
                    >
                      Ganti file
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                      <UploadCloud className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-foreground dark:text-muted-foreground">Drag & drop atau klik di sini</p>
                      <p className="text-sm text-muted-foreground mt-1">JPG, PNG, PDF, Excel · Maks. 10MB</p>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <><UploadCloud className="w-4 h-4" /> Upload ke Cloud</>
                )}
              </button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="lg:col-span-3 border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-card/50 border-b border-border p-6">
            <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" /> Riwayat Unggahan
            </CardTitle>
            <CardDescription>{uploads.length} file tersimpan di cloud</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {uploads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileImage className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">Belum ada file yang diunggah</p>
                <p className="text-sm text-muted-foreground mt-1">File yang di-upload akan tampil di sini</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors gap-4">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/10 flex items-center justify-center shrink-0">
                        <File className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-semibold text-foreground text-sm truncate" title={upload.fileName}>
                          {upload.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(upload.createdAt), "dd MMM yyyy 'pukul' HH:mm", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
                        ? Cloud
                      </span>
                      <a
                        href={upload.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 dark:border-indigo-800 bg-muted/50 dark:bg-primary/10 text-primary dark:text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Lihat
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
