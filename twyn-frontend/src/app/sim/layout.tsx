import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { UserProvider } from '@/contexts/user-context';

export default async function SimLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data?.user) {
    redirect('/login');
  }

  const user = data.user;

  return (
    <UserProvider user={user}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 64)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" user={user} />
        <SidebarInset>
          <SidebarTrigger className="absolute top-2 left-2 cursor-pointer" />
          <div className="mt-2">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UserProvider>
  );
}
