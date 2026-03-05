'use client';

// components/Navbar.tsx
// Global navigation bar matching the UI design (UI/Image 1.png and Image 3.png).
// Session-aware: shows notification bell + user avatar for authenticated users,
// Log In button for guests. Uses NextAuth useSession() for reactive updates.

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { NotificationBell } from './NotificationBell';

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function StackItLogo() {
    return (
        <Link href="/" className="flex items-center gap-2 shrink-0">
            {/* Diamond logo mark */}
            <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
            >
                <rect
                    x="4"
                    y="4"
                    width="12"
                    height="12"
                    rx="2"
                    fill="#2563EB"
                    transform="rotate(45 14 4)"
                />
            </svg>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
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
    const isLoggedIn = status === 'authenticated';
    // First letter of the username for the avatar initials
    const userInitial = session?.user?.name?.[0]?.toUpperCase() ?? '?';

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
                </div>

                {/* Search bar — grows to fill available space */}
                <div className="relative mx-4 hidden flex-1 md:flex">
                    <label htmlFor="navbar-search" className="sr-only">
                        Search questions, tags, users
                    </label>
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                        <SearchIcon />
                    </span>
                    <input
                        id="navbar-search"
                        type="search"
                        placeholder="Search questions, tags, users..."
                        className="w-full rounded-full border border-gray-200 bg-gray-50 py-1.5 pl-9 pr-4 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                {/* Right-side actions */}
                <div className="ml-auto flex items-center gap-3">
                    {isLoggedIn ? (
                        <>
                            {/* Notification bell — reactive with unread count */}
                            <NotificationBell />

                            {/* User avatar — click to sign out (profile menu added in later task) */}
                            <button
                                id="navbar-user-menu"
                                aria-label="Sign out"
                                title={`Signed in as ${session?.user?.name ?? 'User'}`}
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="h-8 w-8 overflow-hidden rounded-full ring-2 ring-gray-200 transition hover:ring-blue-400"
                            >
                                <div className="flex h-full w-full items-center justify-center bg-blue-600 text-xs font-bold text-white">
                                    {userInitial}
                                </div>
                            </button>
                        </>
                    ) : (
                        <Link
                            id="navbar-login"
                            href="/login"
                            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                        >
                            Log in
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    );
}
