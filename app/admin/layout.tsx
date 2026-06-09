import React from "react";
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated and has admin role
  const session = await getCurrentUser();
  
  if (!session) {
    // Not logged in - redirect to login page
    redirect('/login?redirect=/admin');
  }
  
  if (session.role !== 'admin') {
    // Logged in but not admin - redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {children}
    </div>
  );
}

export const metadata = {
  title: 'Admin Panel',
  description: 'Admin Dashboard',
};
