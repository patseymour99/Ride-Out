import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../../api/messages.api';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { SocketEvents } from '@ride-out/shared';
import { formatRelativeTime } from '@ride-out/shared';
import type { Message } from '@ride-out/shared';

export function MessagesPage() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: convsData } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagesApi.getConversations,
    refetchInterval: 10000,
  });

  const { data: messagesData } = useQuery({
    queryKey: ['messages', selectedConvId],
    queryFn: () => messagesApi.getMessages(selectedConvId!),
    enabled: !!selectedConvId,
  });

  useEffect(() => {
    if (messagesData) {
      setMessages(messagesData.data.data);
    }
  }, [messagesData]);

  // Socket: join/leave conversation room and receive live messages
  useEffect(() => {
    if (!socket || !selectedConvId) return;
    socket.emit('conversation:join', selectedConvId);
    const onMessage = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };
    socket.on(SocketEvents.MESSAGE_NEW, onMessage);
    return () => {
      socket.emit('conversation:leave', selectedConvId);
      socket.off(SocketEvents.MESSAGE_NEW, onMessage);
    };
  }, [socket, selectedConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.getOrCreate(user!.id), // fallback — socket preferred
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConvId || !socket) return;
    socket.emit(SocketEvents.MESSAGE_SEND, {
      conversationId: selectedConvId,
      content: messageText.trim(),
    });
    setMessageText('');
  };

  const conversations = convsData?.data.data ?? [];
  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherParticipant = selectedConv?.participants.find((p) => p.userId !== user?.id);

  return (
    <div className="flex h-[calc(100vh-140px)] card overflow-hidden">
      {/* Conversation list */}
      <div className="w-72 flex-shrink-0 border-r border-brand-border overflow-y-auto">
        <div className="p-3 border-b border-brand-border">
          <p className="font-display font-bold text-lg text-brand-text">Messages</p>
        </div>
        {conversations.length === 0 ? (
          <p className="text-brand-muted text-sm text-center py-8 px-4">No conversations yet. Follow a rider and message them from their profile.</p>
        ) : (
          conversations.map((conv) => {
            const other = conv.participants.find((p) => p.userId !== user?.id);
            return (
              <button
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`w-full flex items-center gap-3 p-3 hover:bg-brand-surface transition-colors text-left ${
                  selectedConvId === conv.id ? 'bg-brand-surface' : ''
                }`}
              >
                <Avatar src={other?.user.profile?.avatarUrl} name={other?.user.profile?.displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-text truncate">{other?.user.profile?.displayName}</p>
                  {conv.lastMessage && (
                    <p className="text-xs text-brand-muted truncate">{conv.lastMessage.content}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConvId && otherParticipant ? (
          <>
            <div className="flex items-center gap-3 p-3 border-b border-brand-border">
              <Avatar src={otherParticipant.user.profile?.avatarUrl} name={otherParticipant.user.profile?.displayName} size="sm" />
              <span className="font-medium text-brand-text">{otherParticipant.user.profile?.displayName}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs rounded-2xl px-3.5 py-2.5 text-sm ${
                        isMe
                          ? 'bg-brand-orange text-white rounded-br-sm'
                          : 'bg-brand-surface text-brand-text rounded-bl-sm'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/70' : 'text-brand-muted'}`}>
                        {formatRelativeTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 p-3 border-t border-brand-border">
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="input flex-1"
              />
              <Button type="submit" size="sm" disabled={!messageText.trim()}>
                Send
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-brand-muted">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
