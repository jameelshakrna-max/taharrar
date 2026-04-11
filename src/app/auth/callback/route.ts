import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || supabaseUrl;
    
    // Use standard client for the code exchange
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Extract project ref for the cookie name (e.g., "ymeozdwvypfweabhebde")
      const projectRef = new URL(supabaseUrl).hostname.split('.')[0];
      
      const response = NextResponse.redirect(`${appUrl}/`);
      
      // Manually set cookies on the NextResponse (Bypasses Next.js 16 Route Handler limits)
      response.cookies.set(`sb-${projectRef}-auth-token`, data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      
      response.cookies.set(`sb-${projectRef}-refresh-token`, data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

      return response;
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return NextResponse.redirect(`${appUrl}/?error=auth`);
}