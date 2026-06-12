"use client";

import Link from "next/link";
import { Show, UserButton, SignInButton } from "@clerk/nextjs";
import { Wallet } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/60 backdrop-blur-md">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <Wallet className="h-5 w-5 text-brand-violet" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            BalanceOS
          </span>
        </Link>

        {/* Central Navigation Links */}
        <nav className="hidden md:flex items-center space-x-6">
          <Show when="signed-in">
            <Link 
              href="/dashboard" 
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-white"
            >
              Dashboard
            </Link>
          </Show>
        </nav>

        {/* Auth Buttons / Profile Menu */}
        <div className="flex items-center space-x-4">
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9 border border-border"
                }
              }}
            />
          </Show>
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-muted-foreground transition-colors hover:text-white cursor-pointer">
                Sign In
              </button>
            </SignInButton>
            <Link
              href="/sign-up"
              className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200"
            >
              Get Started
            </Link>
          </Show>
        </div>
      </div>
    </header>
  );
}
