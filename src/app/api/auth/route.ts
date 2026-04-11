import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Send the Magic Link email
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني' });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم' },
      { status: 500 }
    );
  }
}