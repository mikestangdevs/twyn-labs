import { createClient } from '@/utils/supabase/client';

export class AuthService {
  public static async signOut(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  public static async getSession() {
    const supabase = createClient();
    return await supabase.auth.getSession();
  }

  public static async getUser() {
    const supabase = createClient();
    return await supabase.auth.getUser();
  }
} 