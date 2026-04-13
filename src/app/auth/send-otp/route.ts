import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── In-memory rate limiter (per email, resets on server restart) ───
// For production with multiple servers, use Redis or DB table instead
const otpAttempts = new Map<string, { count: number; firstAttemptAt: number }>();

// Rate limit: max 4 OTP emails per email per hour
const MAX_OTP_PER_HOUR = 4;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Clean up old entries every 10 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [email, data] of otpAttempts.entries()) {
      if (now - data.firstAttemptAt > WINDOW_MS) {
        otpAttempts.delete(email);
      }
    }
  }, 10 * 60 * 1000);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني غير صالح', errorEn: 'Invalid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ─── Check our own per-email rate limit ───
    const now = Date.now();
    const existing = otpAttempts.get(normalizedEmail);

    if (existing) {
      // If window expired, reset
      if (now - existing.firstAttemptAt > WINDOW_MS) {
        otpAttempts.set(normalizedEmail, { count: 1, firstAttemptAt: now });
      } else if (existing.count >= MAX_OTP_PER_HOUR) {
        const remainingMs = WINDOW_MS - (now - existing.firstAttemptAt);
        const remainingMin = Math.ceil(remainingMs / 60000);
        return NextResponse.json(
          {
            error: `تم تجاوز حد الإرسال. حاول مرة أخرى بعد ${remainingMin} دقيقة`,
            errorEn: `Rate limit exceeded. Try again in ${remainingMin} minute${remainingMin > 1 ? 's' : ''}`,
            retryAfter: remainingMs,
          },
          { status: 429 }
        );
      } else {
        existing.count += 1;
      }
    } else {
      otpAttempts.set(normalizedEmail, { count: 1, firstAttemptAt: now });
    }

    // ─── Send OTP via Supabase (server-side) ───
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error('Supabase OTP error:', error.message);

      // If Supabase also rate-limits, return friendly message
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        return NextResponse.json(
          {
            error: 'تم تجاوز حد الإرسال. يرجى الانتظار ساعة ثم المحاولة',
            errorEn: 'Rate limit exceeded. Please wait an hour and try again',
            retryAfter: 3600000,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: error.message, errorEn: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: 'OTP sent' });
  } catch (error: any) {
    console.error('Send OTP error:', error?.message);
    return NextResponse.json(
      { error: 'حدث خطأ في الخادم', errorEn: 'Server error' },
      { status: 500 }
    );
  }
}
