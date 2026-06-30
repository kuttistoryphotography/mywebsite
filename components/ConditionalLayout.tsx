"use client";

import { usePathname } from "next/navigation";
import Header from "./header/Header";
import PhotographyFooter from "./footer/Footer";
import AIChatbot from "./chatbot/AIChatbot";
import SocialSidebar from "./SocialSidebar";

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");

  // Pages that intentionally start behind the transparent header
  const transparentHeaderPages = ["/"];

  const addHeaderSpacing =
    !transparentHeaderPages.includes(pathname || "") &&
    !isAdminRoute &&
    !isDashboardRoute;

  return (
    <>
      {!isAdminRoute && <Header />}

      <main className={addHeaderSpacing ? "pt-20 lg:pt-[80px]" : ""}>
        {children}
      </main>

      {!isAdminRoute && <PhotographyFooter />}
      {!isAdminRoute && <SocialSidebar />}
      {!isAdminRoute && <AIChatbot />}
    </>
  );
}