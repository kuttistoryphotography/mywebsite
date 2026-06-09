"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Camera,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import BookingForm from "@/components/booking/BookingForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Booking {
  id: string;
  bookingNumber: string;
  userId: number;
  client: string;
  email: string;
  phone: string;
  service: string;
  date: string;
  time: string;
  location: string;
  amount: number;
  paid: number;
  status: string;
  currentStage: string;
  guestCount: number;
  notes: string;
}

interface Event {
  id: string;
  bookingNumber: string;
  title: string;
  client: string;
  type: string;
  date: string;
  time: string;
  endDate?: string;
  location: string;
  city: string;
  guestCount: number;
  status: string;
  paymentStatus: string;
  color: string;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarSection() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings/admin');
      if (response.ok) {
        const data = await response.json();
        const mappedEvents = data.bookings
          .filter((booking: Booking) => booking.date) // Only bookings with event dates
          .map((booking: Booking) => ({
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            title: booking.service || "Event",
            client: booking.client,
            type: booking.service,
            date: formatBookingDate(booking.date),
            time: booking.time || "Time not specified",
            location: booking.location,
            city: "", // Can extract from location if needed
            guestCount: booking.guestCount,
            status: booking.status,
            paymentStatus: booking.paid >= booking.amount ? "paid" : booking.paid > 0 ? "partial" : "unpaid",
            color: getColorForEventType(booking.service),
          }));
        setEvents(mappedEvents);
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatBookingDate = (date: string): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getColorForEventType = (eventType: string): string => {
    const type = eventType?.toLowerCase() || "";
    if (type.includes("wedding") && !type.includes("pre")) return "amber";
    if (type.includes("pre-wedding") || type.includes("prewedding")) return "blue";
    if (type.includes("engagement")) return "purple";
    if (type.includes("portrait")) return "emerald";
    if (type.includes("birthday")) return "pink";
    if (type.includes("corporate")) return "cyan";
    return "emerald"; // default color
  };

  const handleBookingSuccess = () => {
    // Refresh the calendar data
    fetchBookings();
    // Close the dialog after a short delay to show success message
    setTimeout(() => {
      setShowBookingForm(false);
    }, 2000);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${month}-${dayStr}`;
  };

  const getEventsForDate = (dateString: string) => {
    return events.filter((event) => event.date === dateString);
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const days = getDaysInMonth(currentDate);
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const colorMap: Record<string, string> = {
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    pink: "bg-pink-500",
    cyan: "bg-cyan-500",
  };

  const colorBgMap: Record<string, string> = {
    amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
    cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your schedule and appointments
          </p>
        </div>
        <button 
          onClick={() => setShowBookingForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-black rounded-xl font-medium hover:bg-amber-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day Names */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateString = formatDateString(day);
              const dayEvents = getEventsForDate(dateString);
              const isSelected = selectedDate === dateString;
              const today = new Date();
              const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
              const isToday = dateString === todayString;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateString)}
                  className={cn(
                      "aspect-square p-1 rounded-xl transition-colors relative group",
                    isSelected
                      ? "bg-amber-500/20 border border-amber-500/30"
                      : "hover:bg-zinc-800/50",
                    isToday && !isSelected && "border border-zinc-700"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-amber-400" : "text-zinc-300"
                    )}
                  >
                    {day}
                  </span>
                      {dayEvents.length > 0 && (
                        <>
                          <div className="absolute top-2 right-2">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-200">{dayEvents.length}</span>
                          </div>

                          {/* small dots indicator */}
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayEvents.slice(0, 3).map((event, i) => (
                              <div
                                key={i}
                                className={cn("w-1.5 h-1.5 rounded-full", colorMap[event.color])}
                              />
                            ))}
                          </div>

                          {/* Hover popover with event preview */}
                          <div className="hidden group-hover:flex absolute z-50 top-0 left-full ml-3 w-64 max-w-[50vw] flex-col gap-2 p-3 rounded-lg bg-zinc-900 border border-zinc-800 shadow-lg text-sm">
                            {dayEvents.map((event) => (
                              <div key={event.id} className="flex items-start gap-3">
                                <div className={cn("w-2 h-8 rounded-full mt-0.5", colorMap[event.color])} />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="font-medium truncate">{event.title}</div>
                                    <div className="text-xs text-zinc-400">{event.time}</div>
                                  </div>
                                  <div className="text-xs text-zinc-500 truncate">{event.client}{event.guestCount > 0 ? ` • ${event.guestCount} guests` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-xs text-zinc-500">Wedding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-xs text-zinc-500">Pre-Wedding</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-zinc-500">Engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-zinc-500">Portrait/Other</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-xs text-zinc-500">Corporate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-xs text-zinc-500">Birthday</span>
            </div>
          </div>
        </div>

        {/* Selected Day Events */}
        <div className="bg-zinc-900/50 rounded-2xl border border-zinc-800 p-6">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDate
              ? new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Select a date"}
          </h3>

          {selectedEvents.length === 0 ? (
            <div className="text-center py-8">
              <Camera className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No events scheduled</p>
              <button
                onClick={() => setShowBookingForm(true)}
                className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              >
                + Add Event
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedEvents.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "p-4 rounded-xl border",
                    colorBgMap[event.color]
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{event.title}</h4>
                      <span className="text-xs opacity-70">#{event.bookingNumber}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs opacity-70">{event.type}</span>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        event.status === "confirmed" && "bg-green-500/20 text-green-400",
                        event.status === "pending" && "bg-yellow-500/20 text-yellow-400",
                        event.status === "completed" && "bg-blue-500/20 text-blue-400",
                        event.status === "cancelled" && "bg-red-500/20 text-red-400"
                      )}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm opacity-80">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.client}
                      {event.guestCount > 0 && ` • ${event.guestCount} guests`}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Events */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
              Upcoming This Month
            </h4>
            <div className="space-y-3">
              {events
                .filter((event) => {
                  const eventDate = new Date(event.date);
                  return (
                    eventDate.getMonth() === currentDate.getMonth() &&
                    eventDate.getFullYear() === currentDate.getFullYear() &&
                    eventDate >= new Date()
                  );
                })
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-xl cursor-pointer hover:bg-zinc-800/50 transition-colors"
                    onClick={() => setSelectedDate(event.date)}
                  >
                    <div className={cn("w-2 h-8 rounded-full", colorMap[event.color])} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.client}</p>
                      <p className="text-xs text-zinc-500">{event.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-zinc-400">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <span className={cn(
                        "text-xs px-1.5 py-0.5 rounded",
                        event.status === "confirmed" && "bg-green-500/20 text-green-400",
                        event.status === "pending" && "bg-yellow-500/20 text-yellow-400"
                      )}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                ))}
              {events.filter((event) => {
                const eventDate = new Date(event.date);
                return (
                  eventDate.getMonth() === currentDate.getMonth() &&
                  eventDate.getFullYear() === currentDate.getFullYear() &&
                  eventDate >= new Date()
                );
              }).length === 0 && (
                <p className="text-center text-sm text-zinc-500 py-4">
                  No upcoming events this month
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto bg-zinc-900 border-zinc-800 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800">
            <DialogTitle className="text-2xl text-amber-50 font-bold">Create New Booking</DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 100px)' }}>
            <BookingForm onSuccess={handleBookingSuccess} isDialog={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
