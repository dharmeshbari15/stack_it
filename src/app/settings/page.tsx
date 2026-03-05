'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Mail, Shield, Calendar, Settings as SettingsIcon, Lock, Globe, Bell, Loader2, Check, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/events';
import { UserStats } from '@/types/api';

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [twoFactor, setTwoFactor] = useState(false);

    const userId = session?.user?.id;

    const { data: userData, isLoading: userLoading } = useQuery({
        queryKey: ['user-settings', userId],
        queryFn: async () => {
            const res = await fetch(`/api/v1/users/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch user data');
            const result = await res.json();
            return result.data as UserStats;
        },
        enabled: !!userId,
    });

    useEffect(() => {
        if (userData) {
            setUsername(userData.username || '');
            setEmail(userData.email || '');
            setTwoFactor(userData.two_factor_enabled || false);
        }
    }, [userData]);

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await fetch(`/api/v1/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error?.message || 'Update failed');
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success('Settings updated successfully');
            queryClient.invalidateQueries({ queryKey: ['user-settings', userId] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });

            // If username or email changed, we might need to update the session
            if (data.data.username !== session?.user?.name || data.data.email !== session?.user?.email) {
                updateSession({
                    ...session,
                    user: {
                        ...session?.user,
                        name: data.data.username,
                        email: data.data.email,
                    }
                });
            }
        },
        onError: (error: any) => {
            toast.error(error.message);
        }
    });

    const handleUpdateProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const data: any = {};
        if (username !== userData?.username) data.username = username;
        if (email !== userData?.email) data.email = email;

        if (Object.keys(data).length === 0) {
            toast.info('No changes to save');
            return;
        }

        updateMutation.mutate(data);
    };

    const handleUpdatePassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error('Password cannot be empty');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        updateMutation.mutate({ password });
        setPassword('');
        setConfirmPassword('');
    };

    const handleToggle2FA = () => {
        const nextValue = !twoFactor;
        setTwoFactor(nextValue);
        updateMutation.mutate({ two_factor_enabled: nextValue });
    };

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

                            <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Username</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                placeholder="Username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                placeholder="Email address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <Calendar className="h-5 w-5" />
                                        <span className="text-xs font-bold uppercase tracking-widest">Member since {userData ? new Date(userData.created_at).getFullYear() : '...'}</span>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending || userLoading}
                                        className="rounded-xl bg-gray-900 px-8 py-3 text-xs font-black text-white uppercase tracking-widest hover:bg-black transition-all active:scale-95 disabled:bg-gray-200 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {updateMutation.isPending && activeTab === 'profile' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    ) : (
                        <section className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight">Security & Privacy</h2>
                                <p className="text-sm text-gray-500 font-medium">Manage your password and protect your account.</p>
                            </div>

                            <div className="p-8 space-y-10">
                                <div className="space-y-8">
                                    <div className="flex items-start gap-6">
                                        <div className="bg-blue-50 p-3 rounded-2xl shrink-0">
                                            <Lock className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Change Password</h3>
                                                <p className="text-xs text-gray-500 font-medium mt-1">Update your password to keep your account secure.</p>
                                            </div>

                                            <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                                                <div className="space-y-2">
                                                    <input
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="New Password"
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <input
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        placeholder="Confirm New Password"
                                                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all"
                                                    />
                                                </div>
                                                <button
                                                    type="submit"
                                                    disabled={updateMutation.isPending}
                                                    className="rounded-xl border-2 border-gray-900 px-6 py-2.5 text-xs font-black text-gray-900 uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all active:scale-95 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                                >
                                                    {updateMutation.isPending && activeTab === 'security' && password ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Update Password'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-orange-50/50 rounded-3xl border border-orange-100">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-orange-100 p-3 rounded-2xl">
                                                <Shield className="h-6 w-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Two-Factor Authentication</h3>
                                                <p className="text-xs text-gray-500 font-medium mt-1">Adds an extra layer of security to your account.</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleToggle2FA}
                                            disabled={updateMutation.isPending}
                                            className={`
                                                relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
                                                ${twoFactor ? 'bg-orange-600' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span className={`
                                                pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                                                ${twoFactor ? 'translate-x-5' : 'translate-x-0'}
                                            `} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-gray-50 flex items-center gap-3 text-gray-400">
                                    <Shield className="h-5 w-5" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Your account security is our priority</span>
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </main>
    );
}
