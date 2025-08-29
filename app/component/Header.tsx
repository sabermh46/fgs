"use client";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react"; // Import the icons

const ThemeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative w-16 h-8 flex items-center bg-gray-200 dark:bg-slate-700 rounded-full p-1 cursor-pointer transition-colors duration-300"
    >
      <div
        className={`absolute w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
          theme === "dark" ? "translate-x-8 bg-yellow-500" : "translate-x-0 bg-accent"
        }`}
      >
        {/* The icon inside the sliding knob */}
        {theme === "dark" ? (
          <Moon size={16} className="text-black" />
        ) : (
          <Sun size={16} className="text-white" />
        )}
      </div>
    </div>
  );
};

export default function Header() {
  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-[1200px] flex justify-between items-center p-4 mx-auto">
        <h1 className="text-lg font-semibold text-text text-xl">pepti.wiki</h1>
        <nav className="flex gap-4 items-center text-subtext">
          <SignedOut>
            <SignInButton>
              <button className="px-4 py-1 rounded-full border-2 border-accent text-text hover:bg-accent hover:text-white cursor-pointer">Sign In</button>
            </SignInButton>
            <SignUpButton>
              <button className="px-4 py-1 rounded-full bg-accent text-white border-2 border-accent hover:bg-accent-hover cursor-pointer">Sign Up</button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
          <ThemeToggleButton />
        </nav>
      </div>
    </header>
  );
}