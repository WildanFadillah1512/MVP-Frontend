"use client";

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { chatApi } from '@/features/chat/api/chat.api';
import { Send, Users, MessageSquare } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ChatPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [activeGroup, setActiveGroup] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (!messageInput.trim() || !activeGroup) return;

    const tempContent = messageInput;
    setMessageInput(''); // Optimistic clear

    try {
      const res = await chatApi.sendMessage(activeGroup.id, tempContent);
      if (res.success) {
        // Just append optimistic message, polling will sync the rest
        setMessages([...messages, res.data]);
      }
    } catch (error) {
      toast.error('Gagal mengirim pesan');
      setMessageInput(tempContent); // Restore if failed
    }
  };

  if (loading) return <div>Memuat chat grup...</div>;

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-100px)]">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-brand-charcoal">Chat Internal</h1>
        <p className="text-muted-foreground mt-2">Komunikasi antar karyawan divisi Anda.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Sidebar Groups */}
        <Card className="lg:col-span-1 flex flex-col h-full overflow-hidden">
          <CardHeader className="pb-3 border-b border-border bg-brand-oat-milk/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-brand-sage" />
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
                    className={`flex items-start gap-3 p-4 text-left border-b border-border transition-colors hover:bg-brand-oat-milk/50 ${
                      activeGroup?.id === group.id ? 'bg-brand-sage/10 border-l-4 border-l-brand-sage' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-sage flex items-center justify-center text-white shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-charcoal line-clamp-1">{group.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{group._count.members} Anggota</p>
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
              <CardHeader className="pb-3 border-b border-border bg-brand-oat-milk/50">
                <CardTitle>{activeGroup.name}</CardTitle>
                <CardDescription>{activeGroup.description || 'Grup diskusi resmi divisi'}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[#f8f9fa]">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Belum ada pesan. Mulai sapa tim Anda!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.senderId === userId;
                    const showHeader = index === 0 || messages[index - 1].senderId !== msg.senderId;

                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                        {showHeader && !isMe && (
                          <span className="text-xs font-medium text-brand-charcoal mb-1 ml-1">
                            {msg.sender.name} <span className="text-[10px] text-muted-foreground font-normal">({msg.sender.role.name})</span>
                          </span>
                        )}
                        <div className={`px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-brand-sage text-white rounded-tr-sm'
                            : 'bg-white border border-border text-brand-charcoal rounded-tl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <span className={`text-[10px] block mt-1 text-right ${isMe ? 'text-brand-sage-foreground/70 text-gray-100' : 'text-muted-foreground'}`}>
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>

              <div className="p-4 border-t border-border bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <Input
                    placeholder="Tulis pesan..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    className="flex-1 rounded-full bg-brand-oat-milk/50 border-border"
                  />
                  <Button type="submit" size="icon" className="rounded-full bg-brand-sage hover:bg-brand-sage/90 shrink-0" disabled={!messageInput.trim()}>
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
