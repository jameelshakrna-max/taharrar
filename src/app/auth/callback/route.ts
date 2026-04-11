import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (!code) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  // 1. Create a dummy response to collect the cookies
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // 2. Initialize Supabase with the dummy response's cookie jar
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Manually attach Supabase's cookies to our dummy response
          // We hardcode the options to bypass Next.js 16 strict typing
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

  // 3. Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/?error=auth');
  }

  // 4. Redirect to home, passing the headers containing the saved cookies!
  return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL! + '/', {
    headers: supabaseResponse.headers,
  });
}