import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // 1. Get incoming cookies the Next.js 16 way
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();

    // 2. Create a trap to catch the exact cookies Supabase wants to set
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return allCookies; // Pass the incoming cookies to Supabase
          },
          setAll(cookiesToSetFromSupabase) {
            // Save them to our array instead of setting them immediately
            cookiesToSet.push(...cookiesToSetFromSupabase);
          },
        },
      }
    );

    // 3. Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 4. Create the redirect response
      const response = NextResponse.redirect(`${appUrl}/`);
      
      // 5. Manually attach Supabase's exact cookies to the response
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });

      return response;
    }
  }
  
  // If error, send back to login
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return NextResponse.redirect(`${appUrl}/?error=auth`);
}