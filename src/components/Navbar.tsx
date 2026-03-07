'use client';

// components/Navbar.tsx
// Global navigation bar matching the UI design (UI/Image 1.png and Image 3.png).
// Session-aware: shows notification bell + user avatar for authenticated users,
// Log In button for guests. Uses NextAuth useSession() for reactive updates.

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { NotificationBell } from './NotificationBell';
import { User, LogOut, ChevronDown, Settings, Heart } from 'lucide-react';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function StackItLogo() {
    return (
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            {/* Multi-layered stack logo mark */}
            <div className="relative h-8 w-8 flex items-center justify-center">
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="transition-transform group-hover:scale-110 duration-300"
                >
                    {/* Bottom Layer */}
                    <path
                        d="M4 16L12 20L20 16"
                        stroke="#DBEAFE"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Middle Layer */}
                    <path
                        d="M4 12L12 16L20 12"
                        stroke="#60A5FA"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                    {/* Top Layer (Solid) */}
                    <path
                        d="M12 4L4 8L12 12L20 8L12 4Z"
                        fill="#2563EB"
                        stroke="#2563EB"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tighter group-hover:text-blue-600 transition-colors">
                StackIt
            </span>
        </Link>
    );
}

function BellIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
        </svg>
    );
}

// ─── Nav Link ─────────────────────────────────────────────────────────────────

function NavLink({ href, label }: { href: string; label: string }) {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(`${href}/`);

    return (
        <Link
            href={href}
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-600'
                }`}
        >
            {label}
        </Link>
    );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

export default function Navbar() {
    const { data: session, status } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const isLoggedIn = status === 'authenticated';
    const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? '?';

    // Initialize search query from URL
    useEffect(() => {
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
            setSearchQuery(urlSearch);
        }
    }, [searchParams]);

    // Handle search submission
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/questions?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push('/questions');
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white">
            <nav
                className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6"
                aria-label="Global navigation"
            >
                {/* Logo */}
                <StackItLogo />

                {/* Desktop nav links */}
                <div className="hidden items-center gap-6 md:flex">
                    <NavLink href="/questions" label="Questions" />
                    <NavLink href="/tags" label="Tags" />
                    <NavLink href="/users" label="Users" />
                    <NavLink href="/leaderboard" label="Rankings" />
                </div>

                {/* Search bar */}
                <form onSubmit={handleSearch} className="relative mx-4 hidden flex-1 md:flex">
                    <label htmlFor="navbar-search" className="sr-only">
                        Search questions, tags, users
                    </label>
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                        <SearchIcon />
                    </span>
                    <input
                        id="navbar-search"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions, tags, users..."
                        className="w-full rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </form>

                {/* Right-side actions */}
                <div className="ml-auto flex items-center gap-3">
                    {isLoggedIn ? (
                        <>
                            <NotificationBell />

                            <div className="relative" ref={menuRef}>
                                <button
                                    id="navbar-user-menu"
                                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    className="flex items-center gap-1 rounded-full p-0.5 pr-2 transition hover:bg-gray-50 ring-1 ring-transparent hover:ring-gray-200"
                                >
                                    <div className="h-8 w-8 overflow-hidden rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-white">
                                        {userInitial}
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-150">
                                        <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Signed in as</p>
                                            <p className="text-sm font-black text-gray-900 truncate">{session?.user?.name}</p>
                                        </div>

                                        <Link
                                            href="/users/me"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <User className="h-4 w-4" />
                                            View Profile
                                        </Link>

                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                        >
                                            <span className="text-base">📊</span>
                                            Reputation Dashboard
                                        </Link>

                                        <Link
                                            href="/saved-questions"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                        >
                                            <span className="text-base">★</span>
                                            Saved Questions
                                        </Link>

                                        <Link
                                            href="/settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Settings
                                        </Link>

                                        <Link
                                            href="/follows"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-gray-600 hover:bg-pink-50 hover:text-pink-600 transition-colors"
                                        >
                                            <Heart className="h-4 w-4" />
                                            Following
                                        </Link>

                                        <div className="my-1 border-t border-gray-50" />

                                        <button
                                            onClick={() => signOut({ callbackUrl: '/' })}
                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link
                            id="navbar-login"
                            href="/login"
                            className="rounded-full bg-blue-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-95"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
