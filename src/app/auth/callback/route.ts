import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  
  if (code) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

    // 1. Create a trap to catch the exact cookies Supabase wants to set
    const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll(); // Read incoming cookies
          },
          setAll(cookiesToSetFromSupabase) {
            // Don't set them immediately! Save them to our array.
            cookiesToSet.push(...cookiesToSetFromSupabase);
          },
        },
      }
    );

    // 2. Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 3. Create the redirect response
      const response = NextResponse.redirect(`${appUrl}/`);
      
      // 4. Loop through our trapped cookies and attach them to the response perfectly
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