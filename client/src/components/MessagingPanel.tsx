import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Send, X, Search, User, ChevronLeft } from 'lucide-react';

const API_URL = 'http://localhost:3333';

interface Conversation {
    id: string;
    name: string;
    email: string;
    role: string;
    currentLevel?: string;
    lastMessage?: {
        content: string;
        createdAt: string;
        isFromMe: boolean;
    };
    unreadCount: number;
}

interface Message {
    id: string;
    content: string;
    type: string;
    createdAt: string;
    isFromMe: boolean;
    read: boolean;
}

import { io, Socket } from 'socket.io-client';

export const MessagingPanel: React.FC<{ onClose?: () => void, initialPartnerId?: string }> = ({ onClose, initialPartnerId }) => {
    const { token } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!token) return;

        // Initialize socket
        socketRef.current = io(API_URL, {
            auth: { token: `Bearer ${token}` }
        });

        socketRef.current.on('new_message', (msg: Message) => {
            setMessages(prev => {
                // Check if message already exists to avoid duplicates
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            fetchConversations();
        });

        socketRef.current.on('user_typing', (data: { senderId: string, isTyping: boolean }) => {
            if (selectedConversation?.id === data.senderId) {
                setIsPartnerTyping(data.isTyping);
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [token, selectedConversation?.id]);

    useEffect(() => {
        fetchConversations();
    }, [token]);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
            setIsPartnerTyping(false);
        } else {
            setMessages([]);
        }
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/messaging/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const convs = await res.json();
                setConversations(convs);

                // Auto-select if initialPartnerId is provided and hasn't been set yet
                if (initialPartnerId && !selectedConversation) {
                    const target = convs.find((c: any) => c.id === initialPartnerId);
                    if (target) setSelectedConversation(target);
                }
            }
        } catch (e) {
            console.error('Error fetching conversations:', e);
        }
    };

    const fetchMessages = async (partnerId: string) => {
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/messaging/conversations/${partnerId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMessages(await res.json());
                // Mark as read
                await fetch(`${API_URL}/messaging/mark-read/${partnerId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchConversations(); // Refresh unread counts
            }
        } catch (e) {
            console.error('Error fetching messages:', e);
        }
        setLoading(false);
    };

    const sendMessage = async () => {
        if (!token || !selectedConversation || !newMessage.trim()) return;
        const content = newMessage.trim();
        setNewMessage(''); // Clear immediately for better UX

        try {
            const res = await fetch(`${API_URL}/messaging/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipientId: selectedConversation.id,
                    content
                })
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                fetchConversations();
            }
        } catch (e) {
            console.error('Error sending message:', e);
        }
    };

    const handleNewMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);
        if (socketRef.current && selectedConversation) {
            socketRef.current.emit('typing', {
                recipientId: selectedConversation.id,
                isTyping: e.target.value.length > 0
            });
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        if (diff < 60000) return 'À l\'instant';
        if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
        if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r border-slate-800 flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <MessageCircle size={20} className="text-indigo-400" />
                            Messages
                        </h3>
                        {onClose && (
                            <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg">
                                <X size={18} className="text-slate-400" />
                            </button>
                        )}
                    </div>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Rechercher..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                {/* Conversations */}
                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">
                            Aucune conversation
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedConversation(conv)}
                                className={`w-full p-4 flex items-start gap-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 ${selectedConversation?.id === conv.id ? 'bg-slate-800' : ''}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {conv.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-sm truncate">{conv.name}</span>
                                        {conv.lastMessage && (
                                            <span className="text-xs text-slate-500">
                                                {formatTime(conv.lastMessage.createdAt)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-slate-400 truncate">
                                            {conv.lastMessage
                                                ? (conv.lastMessage.isFromMe ? 'Vous: ' : '') + conv.lastMessage.content
                                                : conv.email}
                                        </span>
                                        {conv.unreadCount > 0 && (
                                            <span className="bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Messages Panel */}
            <div className={`flex-1 flex flex-col ${selectedConversation ? 'flex' : 'hidden md:flex'}`}>
                {selectedConversation ? (
                    <>
                        {/* Conversation Header */}
                        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                            <button
                                onClick={() => setSelectedConversation(null)}
                                className="md:hidden p-1 hover:bg-slate-800 rounded-lg"
                            >
                                <ChevronLeft size={20} className="text-slate-400" />
                            </button>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {selectedConversation.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-white">{selectedConversation.name}</p>
                                <p className="text-xs text-slate-400">
                                    {selectedConversation.role === 'CANDIDATE' && selectedConversation.currentLevel
                                        ? `Niveau ${selectedConversation.currentLevel}`
                                        : selectedConversation.email}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loading ? (
                                <div className="text-center text-slate-500">Chargement...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-slate-500 py-8">
                                    <MessageCircle size={40} className="mx-auto mb-2 opacity-50" />
                                    <p>Commencez la conversation</p>
                                </div>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${msg.isFromMe
                                                ? 'bg-indigo-600 text-white rounded-br-sm'
                                                : 'bg-slate-800 text-white rounded-bl-sm'
                                                }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${msg.isFromMe ? 'text-indigo-200' : 'text-slate-500'}`}>
                                                {formatTime(msg.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {isPartnerTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/50 text-slate-400 px-4 py-2 rounded-2xl text-[10px] font-bold italic animate-pulse">
                                        En train d'écrire...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-slate-800">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={handleNewMessageChange}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Écrivez votre message..."
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                        <div className="text-center">
                            <User size={40} className="mx-auto mb-2 opacity-50" />
                            <p>Sélectionnez une conversation</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagingPanel;
