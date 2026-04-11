import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "تحرر - رحلة الحرية",
  description: "تطبيق لمساعدتك في رحلة التحرر من العادات السيئة. تتبع تقدمك يوميًا واحصل على الدعم والتشجيع.",
};

export default function TaharrurLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <div className="antialiased bg-gray-950 text-white min-h-screen">
        {children}
      </div>
      <Toaster />
    </>
  );
}
