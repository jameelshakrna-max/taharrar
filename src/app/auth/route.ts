import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Successfully logged in! Send them to the home page.
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // If there's an error, send them back to home with an error flag
  return NextResponse.redirect(`${origin}/?error=auth`);
}