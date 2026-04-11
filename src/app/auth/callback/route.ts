// @ts-nocheck
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  // 1. Read incoming cookies the Next.js 16 way
  const cookieStore = await cookies();
  const incomingCookies = cookieStore.getAll();

  // 2. Create a dummy response to collect the cookies
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // 3. Initialize Supabase with the dummy response's cookie jar
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return incomingCookies;
        },
        setAll(cookiesToSet) {
          // Manually attach Supabase's cookies to our dummy response
          cookiesToSet.forEach(({ name, value }) => 
            supabaseResponse.cookies.set(name, value, { 
              path: '/', 
              httpOnly: true, 
              secure: true, 
              sameSite: 'lax' 
            })
          );
        },
      },
    }
  );

  // 4. Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  // 5. Redirect to home, passing the headers containing the saved cookies!
  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/', {
    headers: supabaseResponse.headers,
  });
}