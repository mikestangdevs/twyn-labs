"use client"

import * as React from "react"
import Image from "next/image"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { useSimulationHistory } from '@/hooks'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    user_metadata?: {
      picture?: string;
      full_name?: string;
    };
    email?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { simulations, loading, error } = useSimulationHistory();

  return (
    <Sidebar collapsible="icon" {...props} >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1 hover:bg-transparent active:bg-transparent"
            >
              <a href="#" className="flex items-center gap-2">
                <Image 
                  src="/logo.svg" 
                  alt="Twyn Logo" 
                  width={18} 
                  height={18}
                  className="!size-6 dark:invert"
                />
                <Image 
                  src="/logo_text.svg" 
                  alt="Twyn" 
                  width={80} 
                  height={20}
                  className="h-5 w-auto mt-1 group-data-[collapsible=icon]:hidden dark:invert"
                />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain simulations={simulations} loading={loading} error={error} />
      </SidebarContent>
      <SidebarFooter>
        {user && <NavUser user={user} />}
      </SidebarFooter>
    </Sidebar>
  )
}
