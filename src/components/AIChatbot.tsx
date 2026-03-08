'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Minimize2 } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: 'Hi! 👋 I\'m your AI programming assistant. Ask me anything about coding, or I can help you improve your questions!',
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [isOpen, isMinimized]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage: Message = {
            role: 'user',
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/v1/chatbot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: inputMessage,
                    conversationHistory: messages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error('API Error Response:', data);
                throw new Error(data.error?.message || 'Failed to get response');
            }

            const assistantMessage: Message = {
                role: 'assistant',
                content: data.data.message,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chatbot error:', error);
            
            const errorMessage: Message = {
                role: 'assistant',
                content: error instanceof Error 
                    ? `❌ Error: ${error.message}. Please check the console for details.`
                    : '❌ Sorry, I encountered an error. Please try again or check if the AI service is configured.',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: 'Chat cleared! How can I help you?',
                timestamp: new Date()
            }
        ]);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all z-50 group"
                aria-label="Open AI Chatbot"
            >
                <MessageCircle className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Ask AI Assistant 💬
                </div>
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 z-50 transition-all ${isMinimized ? 'w-80' : 'w-96'}`}>
            {/* Chat Window */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Sparkles className="w-6 h-6" />
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-sm">AI Programming Assistant</h3>
                            <p className="text-xs text-purple-100">Powered by Google Gemini</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Minimize"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96 min-h-[300px] bg-gradient-to-b from-gray-50 to-white">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                                            msg.role === 'user'
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                                : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                                        }`}
                                    >
                                        <div className="text-sm whitespace-pre-wrap break-words">
                                            {msg.content}
                                        </div>
                                        <div
                                            className={`text-[10px] mt-1 ${
                                                msg.role === 'user' ? 'text-purple-100' : 'text-gray-400'
                                            }`}
                                        >
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm">Thinking...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-gray-200 p-4 bg-white">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask me anything..."
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-50 disabled:text-gray-400"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={!inputMessage.trim() || isLoading}
                                    className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
                                    aria-label="Send message"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                                <button
                                    onClick={clearChat}
                                    className="text-xs text-gray-500 hover:text-purple-600 transition-colors"
                                >
                                    Clear chat
                                </button>
                                <div className="text-xs text-gray-400">
                                    Press Enter to send
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
