"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { IconSun, IconMoon } from "@tabler/icons-react"
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Footer() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <footer className="text-muted-foreground text-xs text-balance flex flex-col-reverse sm:flex-row justify-between items-center mt-auto gap-2 sm:gap-0">
      <span className="text-center sm:text-left mb-2 sm:mb-0">© 2025 Twyn Labs, Inc. All rights reserved.</span>

      <div className="flex items-center gap-2">
        <Link href="/terms">
          <Button variant="link" className="text-xs text-muted-foreground cursor-pointer">
            Terms of Service
          </Button>
        </Link>
        <Link href="/privacy">
          <Button variant="link" className="text-xs text-muted-foreground cursor-pointer">
            Privacy Policy
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 cursor-pointer"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {!mounted ? (
            // Show a placeholder icon until mounted to prevent hydration mismatch
            <IconSun className="size-4" />
          ) : theme === "dark" ? (
            <IconSun className="size-4" />
          ) : (
            <IconMoon className="size-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </footer>
  );
}

