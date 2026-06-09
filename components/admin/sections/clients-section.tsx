"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string | null;
  status: "active" | "inactive";
  joinedDate: string;
}

export default function ClientsSection() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientBookings, setClientBookings] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
  });

  // Fetch clients from API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/user/admin');
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients || []);
        } else {
          console.error('Failed to fetch clients');
          setClients([]);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setClients([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getJoinedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0);
  const avgSpend = clients.length > 0 ? totalRevenue / clients.length : 0;

  const handleAddClient = async () => {
    if (!formData.firstName || !formData.email) {
      alert('First name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setGeneratedPassword(data.defaultPassword);
        setNewClientEmail(data.client.email);
        setShowAddModal(false);
        setShowPasswordModal(true);
        
        // Refresh clients list
        const clientsRes = await fetch('/api/user/admin');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          city: "",
          state: "",
        });
      } else {
        alert(data.error || 'Failed to create client');
      }
    } catch (err) {
      console.error('Error creating client:', err);
      alert('Error creating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchClientBookings = async (clientId: string) => {
    try {
      const res = await fetch('/api/bookings/admin');
      if (res.ok) {
        const data = await res.json();
        const filtered = data.bookings.filter((b: any) => b.userId === clientId);
        setClientBookings(filtered);
      }
    } catch (err) {
      console.error('Error fetching client bookings:', err);
    }
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    fetchClientBookings(client.id);
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
  
    const nameParts = (client.name || '').split(' ');
  
    const locationParts = (client.location || '').split(', ');
  
    setFormData({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: client.email || '',
      phone: client.phone || '',
      city: locationParts[0] || '',
      state: locationParts[1] || '',
    });
  
    setShowEditModal(true);
    setOpenDropdownId(null);
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !formData.firstName || !formData.email) {
      alert('First name and email are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/user/admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClient.id,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Refresh clients list
        const clientsRes = await fetch('/api/user/admin');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }

        setShowEditModal(false);
        setEditingClient(null);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          city: '',
          state: '',
        });
        alert('Client updated successfully!');
      } else {
        alert(data.error || 'Failed to update client');
      }
    } catch (err) {
      console.error('Error updating client:', err);
      alert('Error updating client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch('/api/user/admin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: clientId }),
      });

      if (res.ok) {
        setClients(clients.filter(c => c.id !== clientId));
        setOpenDropdownId(null);
        alert('Client deleted successfully!');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete client');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      alert('Error deleting client');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-500">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Client Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage and view all your clients
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Total Clients</p>
          <p className="text-2xl font-bold mt-1">{clients.length}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Active Clients</p>
          <p className="text-2xl font-bold mt-1 text-emerald-400">
            {clients.filter((c) => c.status === "active").length}
          </p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Total Revenue</p>
          <p className="text-2xl font-bold mt-1 text-amber-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 p-4">
          <p className="text-sm text-zinc-500">Avg. Spend</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(avgSpend)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search clients by name, email, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-5 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-zinc-700">
                  <AvatarFallback className="bg-amber-500/10 text-amber-500 font-medium">
                  {(client.name || "")
  .split(" ")
  .filter(Boolean)
  .map((n) => n[0])
  .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <span
                    className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      client.status === "active"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-zinc-500/10 text-zinc-400"
                    )}
                  >
                    {client.status}
                  </span>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDropdownId(openDropdownId === client.id ? null : client.id);
                  }}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {openDropdownId === client.id && (
                  <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 w-40 z-10">
                    <button
                      onClick={() => handleViewClient(client)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleEditClient(client)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Client
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-700 flex items-center gap-2 text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{client.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Phone className="w-4 h-4" />
                {client.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <MapPin className="w-4 h-4" />
                {client.location}
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-800">
              <div>
                <p className="text-xs text-zinc-500">Total Bookings</p>
                <p className="text-lg font-semibold">{client.totalBookings}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Total Spent</p>
                <p className="text-lg font-semibold text-amber-400">
                  {formatCurrency(client.totalSpent)}
                </p>
              </div>
            </div> */}

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
              <button
                onClick={() => handleViewClient(client)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-zinc-800/50 rounded-lg text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                View
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-500/10 rounded-lg text-sm text-amber-500 hover:bg-amber-500/20 transition-colors">
                <Mail className="w-4 h-4" />
                Contact
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Client Details</h2>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-amber-500/50">
                  <AvatarFallback className="bg-amber-500/10 text-amber-500 text-xl font-medium">
                    {selectedClient.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xl font-bold">{selectedClient.name}</p>
                  <p className="text-sm text-zinc-500">
                    Client since {getJoinedDate(selectedClient.joinedDate)}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm">{selectedClient.location}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <Calendar className="w-5 h-5 mx-auto text-blue-400 mb-2" />
                  <p className="text-2xl font-bold">
                    {selectedClient.totalBookings}
                  </p>
                  <p className="text-xs text-zinc-500">Total Bookings</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <CreditCard className="w-5 h-5 mx-auto text-amber-400 mb-2" />
                  <p className="text-2xl font-bold">{formatCurrency(selectedClient.totalSpent)}</p>
                  <p className="text-xs text-zinc-500">Total Spent</p>
                </div>
              </div>

              {/* Last Booking */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <p className="text-sm text-zinc-500 mb-1">Last Booking</p>
                <p className="font-medium">{formatDate(selectedClient.lastBooking)}</p>
              </div>

              {/* Client Orders/Bookings */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Order History ({clientBookings.length})
                </h3>
                {clientBookings.length === 0 ? (
                  <div className="bg-zinc-800/50 rounded-xl p-6 text-center">
                    <p className="text-zinc-500">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {clientBookings.map((booking) => (
                      <div key={booking.id} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">#{booking.bookingNumber}</p>
                            <p className="text-xs text-zinc-500">{booking.service}</p>
                          </div>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded-full",
                            booking.status === "confirmed" && "bg-green-500/20 text-green-400",
                            booking.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                            booking.status === "completed" && "bg-blue-500/20 text-blue-400",
                            booking.status === "cancelled" && "bg-red-500/20 text-red-400"
                          )}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-400">{formatDate(booking.date)}</span>
                          <span className="text-amber-400 font-medium">{formatCurrency(booking.amount)}</span>
                        </div>
                        {booking.location && (
                          <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {booking.location}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setSelectedClient(null);
                    handleEditClient(selectedClient);
                  }}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  New Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add New Client</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-400 block mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-400 block mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  <strong>Note:</strong> A default password will be generated for the new client. You can share it with them after creation.
                </p>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      city: "",
                      state: "",
                    });
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddClient}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating..." : "Add Client"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Edit Client</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingClient(null);
                  setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    city: "",
                    state: "",
                  });
                }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-400 block mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-400 block mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-400 block mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="Enter state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingClient(null);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      city: "",
                      state: "",
                    });
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-zinc-800 rounded-xl font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateClient}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Updating..." : "Update Client"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Display Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 max-w-md w-full">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-emerald-400">Client Created Successfully!</h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Client Email</p>
                  <p className="text-lg font-medium text-white">{newClientEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400 mb-1">Default Password</p>
                  <div className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3">
                    <p className="text-lg font-mono font-bold text-amber-400">{generatedPassword}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        alert('Password copied to clipboard!');
                      }}
                      className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded text-xs hover:bg-amber-500/30 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-blue-400">
                  Please share these credentials with the client. They can change their password after logging in.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setGeneratedPassword("");
                  setNewClientEmail("");
                }}
                className="w-full py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
