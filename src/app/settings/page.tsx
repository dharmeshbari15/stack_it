'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Shield, Calendar, Settings as SettingsIcon, Lock, Globe, Bell } from 'lucide-react';

export default function SettingsPage() {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500 font-bold">Please sign in to view settings.</p>
            </div>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-4 py-12">
            <header className="mb-12">
                <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <SettingsIcon className="h-3.5 w-3.5" />
                    User Preferences
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                    Account Settings
                </h1>
                <p className="text-lg text-gray-500 font-medium">
                    Manage your account details and personalize your experience.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Navigation Sidebar */}
                <aside className="lg:col-span-1 space-y-2">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`flex w-full items-center gap-3 rounded-2xl p-4 text-sm font-bold transition-all ${activeTab === 'profile'
                                ? 'bg-white border border-blue-100 text-blue-600 shadow-sm shadow-blue-50'
                                : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                    >
                        <User className="h-5 w-5" />
                        Public Profile
                    </button>
                    <button
                        onClick={() => setActiveTab('security')}
                        className={`flex w-full items-center gap-3 rounded-2xl p-4 text-sm font-bold transition-all ${activeTab === 'security'
                                ? 'bg-white border border-blue-100 text-blue-600 shadow-sm shadow-blue-50'
                                : 'bg-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                            }`}
                    >
                        <Shield className="h-5 w-5" />
                        Account Security
                    </button>
                </aside>

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'profile' ? (
                        <section className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Basic Information</h2>
                                <p className="text-sm text-gray-500 font-medium">Your account details as they appear in the community.</p>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Username</label>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                            <User className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">{session.user?.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-bold text-gray-900">{session.user?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <Calendar className="h-5 w-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">More profile options coming soon</span>
                                    </div>
                                    <button disabled className="rounded-xl bg-gray-100 px-6 py-2.5 text-xs font-black text-gray-400 uppercase tracking-widest cursor-not-allowed">
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        </section>
                    ) : (
                        <section className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Security & Privacy</h2>
                                <p className="text-sm text-gray-500 font-medium">Manage your password and protect your account.</p>
                            </div>

                            <div className="p-8 space-y-10">
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-50 p-3 rounded-xl">
                                            <Lock className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Change Password</h3>
                                                <p className="text-xs text-gray-500 font-medium">It's a good idea to use a strong password that you're not using elsewhere.</p>
                                            </div>
                                            <button className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-900 uppercase tracking-widest hover:bg-gray-50 transition-colors">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 pt-6 border-t border-gray-50">
                                        <div className="bg-orange-50 p-3 rounded-xl">
                                            <Shield className="h-6 w-6 text-orange-600" />
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Two-Factor Authentication</h3>
                                                <p className="text-xs text-gray-500 font-medium">Add an extra layer of security to your account.</p>
                                            </div>
                                            <button className="rounded-xl bg-orange-50 px-4 py-2 text-xs font-black text-orange-600 uppercase tracking-widest hover:bg-orange-100 transition-colors">
                                                Enable 2FA
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex items-center gap-3 text-gray-400">
                                    <Shield className="h-5 w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Enhanced security features are in development</span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
