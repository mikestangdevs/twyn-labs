"use client"

import {
  IconLogout,
  IconHelp,
  IconFileText,
  IconSun,
  IconMoon,
} from "@tabler/icons-react"
import { ChevronsUpDown } from "lucide-react"
import { useTheme } from 'next-themes'

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { UserRound } from "lucide-react";

interface NavUserProps {
  user: {
    user_metadata?: {
      picture?: string;
      full_name?: string;
    };
    email?: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, open } = useSidebar()
  const router = useRouter();
  const { theme, setTheme } = useTheme()

  // Get initials from user's name (only first two letters)
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      const name = user.user_metadata.full_name.trim();
      const words = name.split(' ').filter((word: string) => word.length > 0);
      
      if (words.length === 1) {
        // Single name: take first letter only
        return words[0][0].toUpperCase();
      } else {
        // Multiple names: take first letter of first two words
        return words.slice(0, 2)
          .map((word: string) => word[0])
          .join('')
          .toUpperCase();
      }
    }
    return null;
  };

  const initials = getInitials();

  const handleLogout = async () => {
    try {
      await AuthService.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // TODO: Add user-facing error notification
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials ? <span className="font-bold text-xs">{initials}</span> : <UserRound className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user?.user_metadata?.full_name ?? user?.email}</span>
                <span className="truncate text-xs">
                  {user?.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : open ? "top" : "right"}
            align={open ? "center" : "end"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials ? <span className="font-bold text-xs">{initials}</span> : <UserRound className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.user_metadata?.full_name ?? user?.email}</span>
                  <span className="truncate text-xs">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconFileText />
                View all plans
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconHelp />
                Get help
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleThemeToggle} className="cursor-pointer">
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
