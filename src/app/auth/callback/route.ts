// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  const cookieStore = await cookies();
  const incomingCookies = cookieStore.getAll();

  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return incomingCookies;
        },
        setAll(cookiesToSet) {
          // THE FIX: Use `...options` to pass Supabase's exact settings (including httpOnly: false!)
          cookiesToSet.forEach(({ name, value, ...options }) => 
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/', {
    headers: supabaseResponse.headers,
  });
}