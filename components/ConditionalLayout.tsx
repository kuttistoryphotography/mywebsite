"use client";

import { usePathname } from "next/navigation";
import Header from "./header/Header";
import PhotographyFooter from "./footer/Footer";
import AIChatbot from "./chatbot/AIChatbot";
import SocialSidebar from "./SocialSidebar";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  return (
    <>
      {!isAdminRoute && <Header />}
      {children}
      {!isAdminRoute && <PhotographyFooter />}
      {/* Social media floating sidebar — visible on all non-admin pages */}
      {!isAdminRoute && <SocialSidebar />}
      {/* Show chatbot on all non-admin pages */}
      {!isAdminRoute && <AIChatbot />}
    </>
  );
}
