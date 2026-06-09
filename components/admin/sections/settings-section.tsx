"use client";

import React, { useState, useEffect } from "react";
import { Clock, FileText, MessageCircle, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SettingsSection() {
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [requestedAction, setRequestedAction] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [search, setSearch] = useState<string>('');

  const handleAttemptModify = (action: string) => {
    setRequestedAction(action);
    setShowAdminModal(true);
  };

  useEffect(() => {
    fetchUsers();
    // get current user id to avoid self-modify
    (async function getMe(){
      try{
        const r = await fetch('/api/auth/me');
        if (!r.ok) return;
        const d = await r.json();
        setCurrentUserId(d.user?.id ?? null);
      }catch(e){
        console.error('me fetch failed', e);
      }
    })();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch('/api/user/admin');
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.clients || data.users || []);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch('/api/user/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }

      // optimistic UI update
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      console.error('Failed to update role', err);
      alert('Failed to update user role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const updateUserActive = async (userId: number, isActive: boolean) => {
    try {
      setUpdatingUserId(userId);
      const res = await fetch('/api/user/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, isActive }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Update failed');
      }

      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: isActive ? 'active' : 'inactive' } : u)));
    } catch (err) {
      console.error('Failed to update active status', err);
      alert('Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      setUpdatingUserId(userId);
      const res = await fetch('/api/user/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Delete failed');
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error('Failed to delete user', err);
      alert('Failed to delete user');
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-zinc-500 mt-1">User access management</p>
      </div>

      {/* User Management - search + limited list */}
      <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400">User Management</h3>
          <div className="flex items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email"
              className="px-3 py-2 bg-zinc-800 rounded-md text-sm placeholder:text-zinc-500 focus:outline-none"
            />
            <button onClick={fetchUsers} className="text-sm text-zinc-400 hover:text-zinc-200">Refresh</button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="py-6 text-center text-zinc-500">Loading users...</div>
        ) : (
          <div className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-zinc-500">No users found</p>
            ) : (
              (() => {
                const filtered = users.filter((u) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return (
                    (u.name || '').toLowerCase().includes(q) ||
                    (u.email || '').toLowerCase().includes(q)
                  );
                });
                const max = 10;
                const shown = filtered.slice(0, max);
                const remaining = Math.max(0, filtered.length - shown.length);

                return (
                  <>
                    <div className="grid gap-2">
                      {shown.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user.email} • {user.location}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-xs text-zinc-400">{user.role}</div>
                            <div className="text-xs text-zinc-400">{user.status}</div>
                            {/* Activate / Deactivate */}
                            <button
                              onClick={() => updateUserActive(user.id, user.status !== 'active')}
                              disabled={updatingUserId === user.id || currentUserId === user.id}
                              className="px-2 py-1 rounded-md bg-zinc-700 text-sm text-zinc-200"
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>

                            {user.role !== 'admin' ? (
                              <button
                                onClick={() => updateUserRole(user.id, 'admin')}
                                disabled={updatingUserId === user.id || currentUserId === user.id}
                                className="px-3 py-1 rounded-md bg-amber-500 text-black text-sm"
                              >
                                Make Admin
                              </button>
                            ) : (
                              <button
                                onClick={() => updateUserRole(user.id, 'client')}
                                disabled={updatingUserId === user.id || currentUserId === user.id}
                                className="px-3 py-1 rounded-md bg-zinc-700 text-sm text-zinc-200"
                              >
                                Revoke Admin
                              </button>
                            )}

                            <button
                              onClick={() => deleteUser(user.id)}
                              disabled={updatingUserId === user.id || currentUserId === user.id}
                              className="px-2 py-1 rounded-md bg-red-600 text-sm text-white"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {remaining > 0 && (
                      <div className="mt-3 text-xs text-zinc-400">
                        Showing {shown.length} of {filtered.length} users — {remaining} more
                      </div>
                    )}
                  </>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* Admin Required Modal */}
      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Modification Required</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-sm text-zinc-300">
            <p>
              The action <strong>{requestedAction}</strong> requires administrator approval.
            </p>
            <p className="mt-3 text-zinc-400">Please contact an administrator or request the change through the admin panel.</p>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowAdminModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
