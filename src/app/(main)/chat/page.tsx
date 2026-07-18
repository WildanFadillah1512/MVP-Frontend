"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatApi } from '@/features/chat/api/chat.api';
import { uploadApi } from '@/features/uploads/api/upload.api';
import { FileText, Paperclip, Send, Users, MessageSquare, X } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ChatPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchGroups = async () => {
    try {
      const res = await chatApi.getGroups();
      if (res.success) {
        setGroups(res.data);
        if (res.data.length > 0 && !activeGroup) {
          setActiveGroup(res.data[0]);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (groupId: string) => {
    try {
      const res = await chatApi.getMessages(groupId);
      if (res.success) {
        setMessages(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUserId(parsed.id);
    }
    fetchGroups();
  }, []);

  // Socket.io for messages
  useEffect(() => {
    if (!activeGroup) return;

    fetchMessages(activeGroup.id);

    const { io } = require('socket.io-client');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    const socket = io(baseUrl);

    socket.emit('join-room', activeGroup.id);

    socket.on('new-message', (newMessage: any) => {
      if (newMessage.groupId === activeGroup.id) {
        setMessages(prev => {
          // Prevent duplicates if we already added it optimistically
          if (prev.find(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    return () => {
      socket.emit('leave-room', activeGroup.id);
      socket.disconnect();
    };
  }, [activeGroup]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageInput.trim() && !selectedFile) || !activeGroup || sending) return;

    const tempContent = messageInput;
    const tempFile = selectedFile;
    setMessageInput(''); // Optimistic clear
    setSelectedFile(null);
    setSending(true);

    try {
      let attachment;

      if (tempFile) {
        if (tempFile.size > 10 * 1024 * 1024) {
          toast.error('Ukuran lampiran maksimal 10MB');
          setMessageInput(tempContent);
          setSelectedFile(tempFile);
          return;
        }

        const uploadRes = await uploadApi.uploadChatFile(tempFile);
        if (!uploadRes.success) {
          throw new Error(uploadRes.message || 'Upload lampiran gagal');
        }

        attachment = {
          fileUrl: uploadRes.data.fileUrl,
          fileName: uploadRes.data.fileName,
          fileType: uploadRes.data.fileType,
          fileSize: uploadRes.data.fileSize
        };
      }

      const res = await chatApi.sendMessage(activeGroup.id, tempContent, attachment);
      if (res.success) {
        // Just append optimistic message, polling will sync the rest
        setMessages([...messages, res.data]);
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan');
      setMessageInput(tempContent); // Restore if failed
      setSelectedFile(tempFile);
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) return <div>Memuat chat grup...</div>;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Chat Internal</h1>
        <p className="text-muted-foreground mt-1">Komunikasi antar karyawan divisi Anda.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar Groups */}
        <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 border-b border-border shrink-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Grup Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Anda belum tergabung di grup mana pun.</p>
            ) : (
              <div className="flex flex-col">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => setActiveGroup(group)}
                    className={`flex items-center gap-3 p-4 text-left border-b border-border transition-colors hover:bg-muted/50 ${
                      activeGroup?.id === group.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">{group.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{group._count.members} Anggota</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-3 flex flex-col h-[60vh] lg:h-full overflow-hidden">
          {activeGroup ? (
            <>
              <CardHeader className="pb-3 border-b border-border shrink-0">
                <CardTitle className="text-foreground">{activeGroup.name}</CardTitle>
                <CardDescription>{activeGroup.description || 'Grup diskusi resmi divisi'}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 bg-muted/20">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Belum ada pesan. Mulai sapa tim Anda!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === userId;
                    const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                          {showHeader && !isMe && (
                            <span className="text-xs font-semibold text-foreground mb-1 ml-1">
                              {msg.sender.name} <span className="text-[10px] text-muted-foreground font-normal">({msg.sender.role.name})</span>
                            </span>
                          )}
                          <div className={`px-4 py-2.5 rounded-2xl ${
                            isMe
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-card border border-border text-foreground rounded-tl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold underline-offset-2 hover:underline ${
                                  isMe
                                    ? 'border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground'
                                    : 'border-border bg-muted/50 text-foreground'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                <span className="truncate">{msg.fileName || 'Lampiran'}</span>
                              </a>
                            )}
                            <span className={`text-[10px] block mt-1 ${isMe ? 'text-right text-primary-foreground/60' : 'text-muted-foreground'}`}>
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t border-border bg-card shrink-0">
                {selectedFile && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate font-medium text-foreground">{selectedFile.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (file && file.size > 10 * 1024 * 1024) {
                        toast.error('Ukuran lampiran maksimal 10MB');
                        event.target.value = '';
                        return;
                      }
                      setSelectedFile(file);
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="rounded-full shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Tulis pesan..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 rounded-full bg-muted/50 border-border"
                    disabled={sending}
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-primary hover:bg-primary/90 shrink-0" disabled={sending || (!messageInput.trim() && !selectedFile)}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Pilih grup di sebelah kiri untuk mulai chat</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
