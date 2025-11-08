import { NewSim } from '@/components/new-sim';
import { NotYet } from '@/components/not-yet';
import { DatabaseService } from '@/services/databaseService';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';


export default async function App() {
  const supabase = await createClient();
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  // If no user, redirect to login
  if (!user) {
    redirect('/login');
  }

  // Fetch user profile
  try {
    const profile = await DatabaseService.getUserProfile(user.id, supabase);
    
    // Show NotYet component for waiting list users
    if (profile?.plan !== 'free') {
      return (
        <main className="flex flex-col h-[calc(100vh-100px)] min-h-[calc(100vh-100px)]">
          <NotYet />
        </main>
      );
    }
  } catch (error) {
    // If profile fetch fails, default to NotYet
    console.error('Failed to fetch user profile:', error);
    return (
      <main className="flex flex-col h-[calc(100vh-100px)] min-h-[calc(100vh-100px)]">
        <NotYet />
      </main>
    );
  }

  // Show NewSim component for pro/plus users
  return (
    <main className="flex flex-col h-[calc(100vh-100px)] min-h-[calc(100vh-100px)]">
      <NewSim />
    </main>
  );
} 