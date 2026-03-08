#!/usr/bin/env python3
"""
Automated Git Commit Message Rewriter for StackIt
Rewrites all commit messages according to professional standards
"""

import subprocess
import sys

# Commit message mappings (short hash -> new message)
COMMIT_MESSAGES = {
    "f25d84d": """docs: add initial project documentation

Add Product Requirements Document (PRD), Design Document, Tech Stack specifications, and TODO lists for project planning and development roadmap.""",

    "0c068b3": """chore: initialize Next.js project with Prisma ORM

Set up Next.js 15 with TypeScript, Tailwind CSS v4, ESLint, Prettier, and Prisma ORM configuration for development environment.""",

    "38f2006": """feat(db): define initial database schema

Introduce Prisma schema with core entities: User, Question, Answer, Tag, Vote, Comment, and Notification models with relationships.""",

    "20b9ebf": """feat(lib): add Prisma client singleton

Implement global Prisma Client singleton pattern to prevent multiple instances in Next.js development hot-reload environment.""",

    "2f5b6f5": """feat(lib): add standardized API error handler

Create utility function for consistent error handling across API routes with proper HTTP status codes and error messages.""",

    "e5a1687": """feat(lib): add Zod validation utility

Implement schema validation utility using Zod for runtime type-checking and data validation across the application.""",

    "8cba22d": """feat(ui): create root layout and navigation

Set up root application layout with global navigation bar component for consistent UI structure.""",

    "48aa4df": """feat(lib): integrate TanStack Query for data fetching

Add TanStack Query (React Query) for efficient client-side data fetching, caching, and synchronization with global metadata and navigation.""",

    "77a96d5": """feat(auth): integrate NextAuth.js authentication

Implement NextAuth.js for session management and add global UI components for error handling and loading states.""",

    "083ac46": """feat(auth): add user registration API endpoint

Create registration API with bcrypt password hashing, email/username uniqueness validation, and secure user creation.""",

    "f1e486e": """feat(auth): add login and registration pages

Implement user authentication flow with login/registration pages, session management, and dynamic navbar with user status.""",

    "daf7a0d": """feat(db): integrate Prisma ORM with PostgreSQL

Set up Prisma ORM connection with PostgreSQL database, configure NextAuth.js adapter, and create initial home page.""",

    "fc528da": """feat(api): add question creation and retrieval endpoints

Create API endpoints for creating and retrieving questions with input validation, HTML sanitization, and pagination support.""",

    "136124b": """feat(api): add question management endpoints

Implement API endpoints for question creation, retrieval, paginated listing, and admin-only soft deletion functionality.""",

    "055e6ab": """feat(questions): add question pages and rich text editor

Implement question listing, detail pages, and new question submission form with Tiptap rich text editor and syntax highlighting.""",

    "2f8906a": """feat(api): add answer management endpoints

Create API endpoints for answer creation, acceptance, and voting with reusable API handler utilities.""",

    "fa71411": """feat(answers): add voting and answer display UI

Implement answer voting API, enhance question detail API with answers and user votes, and add UI components for displaying and posting answers.""",

    "c4a7a8e": """feat(notifications): add toast system and notification API

Implement toast notification system, answer display, voting, acceptance, and posting functionality with notification API endpoints.""",

    "003568b": """feat(notifications): add frontend notification system

Implement notification system with custom React hook, notification bell icon, and dropdown menu integrated into navigation bar.""",

    "6511bc4": """feat(users): add user profile page and API endpoints

Create user profile page with dedicated API endpoints for user details and aggregated posts (questions and answers).""",

    "8ae8775": """feat(api): implement core API routes and rate limiting

Add API routes for questions, users, and notifications with TypeScript types and rate limiting middleware for security.""",

    "ad1349f": """feat(questions): add question detail and creation features

Implement question detail viewing and new question creation with API routes, TypeScript data types, and associated UI components.""",

    "3131312": """fix: resolve minor bugs and issues

Address various bug fixes and stability improvements across the application.""",

    "1c9e6a7": """fix: resolve UI rendering issues

Fix bugs related to UI component rendering and display inconsistencies.""",

    "8b18dae": """fix: resolve authentication and data issues

Address multiple bugs related to user authentication flow and data handling.""",

    "9532734": """feat(auth): add password reset functionality

Implement forgot password feature with email verification and secure password reset flow.""",

    "01dfb0d": """chore: remove obsolete files

Delete unnecessary and outdated files to clean up project structure.""",

    "8164f4d": """chore: optimize project for deployment

Clean up unnecessary files, remove debug scripts, and prepare codebase for production deployment.""",

    "b36bf9c": """docs: add comprehensive README documentation

Create detailed README with project overview, features, installation guide, usage instructions, and contribution guidelines.""",

    "fb81608": """test: add reputation system test scripts

Add testing scripts (JavaScript, PowerShell, Python) for validating reputation system functionality.""",

    "41f8a1b": """feat(notifications): enhance notification and comment features

Improve notification system with user session validation and add AI-powered tag suggestion functionality.""",

    "6f75a2c": """feat(ai): implement AI-powered chatbot

Add AI chatbot feature with Google Gemini integration for real-time user assistance and question guidance.""",

    "6fa6b09": """feat(security): integrate sanitize-html library

Add sanitize-html dependency for improved HTML sanitization and XSS attack prevention.""",

    "d83c935": """feat(ai): migrate AI features to Google Gemini

Migrate all AI features from OpenAI to Google Gemini API (100% free tier) including chatbot, embeddings, and analysis features.""",

    "b10fa64": """feat(bounty): add bounty system and edit history

Implement bounty rewards system for high-value questions and comprehensive edit history tracking with diff view.""",

    "d259708": """chore: prepare project for production release

Remove temporary documentation, test scripts, and internal files. Sanitize environment variables, create .env.example, and update README with professional documentation.""",

    "02b8a5f": """docs: add commit message guidelines

Add comprehensive commit message reference guide following conventional commits format and automation script for maintaining consistent Git history.""",

    "b79f9af": """fix(scripts): resolve PowerShell syntax error

Fix PowerShell script syntax error in retitle-commits.ps1 for proper if-else statement handling."""
}


def run_command(cmd, capture=True):
    """Run a shell command"""
    if capture:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode, result.stdout.strip()
    else:
        return subprocess.run(cmd, shell=True).returncode, ""


def main():
    print("=== Automated Commit Message Rewriter ===\n")
    
    # Step 1: Create backup
    print("[1/4] Creating backup branch...")
    run_command("git branch backup-before-python-rewrite", capture=False)
    print("✓ Backup created: backup-before-python-rewrite\n")
    
    # Step 2: Create filter script
    print("[2/4] Creating message filter script...")
    
    filter_script = """#!/bin/sh
# Get the short hash of the current commit
commit_hash=$(git log --format=%h -n 1 $GIT_COMMIT)

case "$commit_hash" in
"""
    
    for short_hash, message in COMMIT_MESSAGES.items():
        # Escape the message for shell script
        escaped_msg = message.replace("'", "'\\''")
        filter_script += f"""
    {short_hash})
        cat << 'EOFMSG'
{escaped_msg}
EOFMSG
        ;;
"""
    
    filter_script += """
    *)
        # Keep original message for commits not in map
        cat
        ;;
esac
"""
    
    with open("git-filter-script.sh", "w", encoding="utf-8", newline="\n") as f:
        f.write(filter_script)
    
    print(f"✓ Filter script created with {len(COMMIT_MESSAGES)} commit mappings\n")
    
    # Step 3: Run filter-branch
    print("[3/4] Rewriting commit history...")
    print("⚠️  This may take a minute...\n")
    
    cmd = 'git filter-branch -f --msg-filter "sh ./git-filter-script.sh" -- --all'
    returncode, output = run_command(cmd, capture=False)
    
    if returncode == 0:
        print("\n✅ SUCCESS! All commits have been retitled!\n")
        print("📊 Preview of new commit history:")
        _, log_output = run_command("git log --oneline -10")
        print(log_output)
        print("\n🚀 NEXT STEP: Push to GitHub")
        print("Run: git push origin master --force-with-lease\n")
        print("📦 Backup available at: backup-before-python-rewrite\n")
    else:
        print("\n❌ Rewrite failed!")
        print("Restoring from backup...")
        run_command("git reset --hard backup-before-python-rewrite", capture=False)
    
    # Step 4: Cleanup
    print("[4/4] Cleaning up...")
    import os
    try:
        os.remove("git-filter-script.sh")
        print("✓ Cleaned up temporary files\n")
    except:
        pass


if __name__ == "__main__":
    main()
