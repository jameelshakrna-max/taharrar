"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export const dynamic = 'force-dynamic';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const code = new URL(window.location.href).searchParams.get("code");

    if (code) {
      const supabase = createClient();
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        router.push(error ? "/?error=auth" : "/");
      });
    } else {
      router.push("/?error=auth");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <p className="text-white text-lg">جاري تسجيل الدخول...</p>
    </div>
  );
}