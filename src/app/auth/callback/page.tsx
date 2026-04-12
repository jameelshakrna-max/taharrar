"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Use standard JavaScript to read the URL, bypassing Next.js Suspense requirements
    const code = new URL(window.location.href).searchParams.get("code");

    if (code) {
      const supabase = createClient();
      
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.push("/");
        } else {
          router.push("/?error=auth");
        }
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
}"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Use standard JavaScript to read the URL, bypassing Next.js Suspense requirements
    const code = new URL(window.location.href).searchParams.get("code");

    if (code) {
      const supabase = createClient();
      
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          router.push("/");
        } else {
          router.push("/?error=auth");
        }
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