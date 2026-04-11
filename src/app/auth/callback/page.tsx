import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!code) {
    redirect(`${appUrl}/?error=auth`);
  }

  const cookieStore = await cookies();

  // @ts-expect-error - Next.js 16 and Supabase SSR types mismatch on cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        // @ts-expect-error - Next.js 16 and Supabase SSR types mismatch on cookies
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // @ts-expect-error - Next.js 16 and Supabase SSR types mismatch on cookies
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore if called from Server Component
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`${appUrl}/?error=auth`);
  }

  // Success! Redirect to home. The cookie is now perfectly set.
  redirect('/');
}