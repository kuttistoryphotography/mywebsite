"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  CreditCard,
  Camera,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
  Tooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DashboardStats {
  totalRevenue: number;
  totalBookings: number;
  activeClients: number;
  pendingPayments: number;
  revenueChange: number;
  bookingsChange: number;
  clientsChange: number;
  paymentsChange: number;
}

interface RecentBooking {
  id: string;
  client: string;
  service: string;
  date: string;
  amount: number;
  status: string;
  avatar?: string;
}

interface PaymentData {
  month: string;
  verified: number;
  pending: number;
  verifiedCount: number;
  pendingCount: number;
}

interface ServiceData {
  name: string;
  value: number;
  color: string;
  bookings: number;
}

interface BookingStatusData {
  status: string;
  count: number;
  fill: string;
}

interface RevenueChartData {
  date: string;
  amount: number;
}

export default function OverviewSection() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalBookings: 0,
    activeClients: 0,
    pendingPayments: 0,
    revenueChange: 0,
    bookingsChange: 0,
    clientsChange: 0,
    paymentsChange: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [paymentData, setPaymentData] = useState<PaymentData[]>([]);
  const [serviceData, setServiceData] = useState<ServiceData[]>([]);
  const [bookingStatusData, setBookingStatusData] = useState<BookingStatusData[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch bookings
      const bookingsRes = await fetch('/api/bookings/admin');
      const paymentsRes = await fetch('/api/payments/admin');
      
      if (bookingsRes.ok && paymentsRes.ok) {
        const bookingsData = await bookingsRes.json();
        const paymentsData = await paymentsRes.json();
        
        const bookings = bookingsData.bookings || [];
        const payments = paymentsData.payments || [];
        
        // Filter by date range
        const daysAgo = parseInt(dateFilter);
        const filterDate = new Date();
        filterDate.setDate(filterDate.getDate() - daysAgo);
        
        const filteredPayments = payments.filter((p: any) => {
          const paymentDate = new Date(p.created_at);
          return paymentDate >= filterDate;
        });
        
        // Calculate stats
        const totalRevenue = payments
          .filter((p: any) => p.payment_status === 'verified')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        
        const pendingPayments = payments
          .filter((p: any) => p.payment_status === 'pending' || p.payment_status === 'verifying')
          .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);
        
        // Get unique clients
        const uniqueClients = new Set(bookings.map((b: any) => b.userId).filter(Boolean));
        
        setStats({
          totalRevenue,
          totalBookings: bookings.length,
          activeClients: uniqueClients.size,
          pendingPayments,
          revenueChange: 0,
          bookingsChange: 0,
          clientsChange: 0,
          paymentsChange: 0,
        });
        
        // Get recent 5 bookings
        const recent = bookings.slice(0, 5).map((b: any, idx: number) => ({
          id: b.id,
          client: b.client || 'Unknown',
          service: b.service || 'N/A',
          date: new Date(b.date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          amount: b.amount || 0,
          status: b.status || 'pending',
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${b.client || 'U'}&backgroundColor=f59e0b&textColor=000000`,
        }));
        
        setRecentBookings(recent);
        
        // Process payment data by month
        const monthlyPayments: Record<string, { verified: number; pending: number; verifiedCount: number; pendingCount: number }> = {};
        
        filteredPayments.forEach((p: any) => {
          const date = new Date(p.created_at);
          const monthKey = date.toLocaleDateString('en-IN', { month: 'short' });
          
          if (!monthlyPayments[monthKey]) {
            monthlyPayments[monthKey] = { verified: 0, pending: 0, verifiedCount: 0, pendingCount: 0 };
          }
          
          if (p.payment_status === 'verified') {
            monthlyPayments[monthKey].verified += parseFloat(p.amount);
            monthlyPayments[monthKey].verifiedCount += 1;
          } else if (p.payment_status === 'pending' || p.payment_status === 'verifying') {
            monthlyPayments[monthKey].pending += parseFloat(p.amount);
            monthlyPayments[monthKey].pendingCount += 1;
          }
        });
        
        const chartData = Object.entries(monthlyPayments).map(([month, data]) => ({
          month,
          verified: data.verified,
          pending: data.pending,
          verifiedCount: data.verifiedCount,
          pendingCount: data.pendingCount,
        }));
        
        setPaymentData(chartData);
        
        // Process service distribution
        const serviceCounts: Record<string, number> = {};
        bookings.forEach((b: any) => {
          const service = b.service || 'Other';
          serviceCounts[service] = (serviceCounts[service] || 0) + 1;
        });
        
        const total = bookings.length || 1;
        const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
        
        const serviceChartData = Object.entries(serviceCounts)
          .map(([name, count], index) => ({
            name,
            value: Math.round((count / total) * 100),
            color: colors[index % colors.length],
            bookings: count,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 5);
        
        setServiceData(serviceChartData);
        
        // Process booking status distribution
        const statusCounts: Record<string, number> = {};
        const statusColors: Record<string, string> = {
          pending: '#f59e0b',
          confirmed: '#10b981',
          in_progress: '#3b82f6',
          completed: '#8b5cf6',
          cancelled: '#ef4444',
        };
        
        bookings.forEach((b: any) => {
          const status = b.status || 'pending';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          status: status.replace('_', ' '),
          count,
          fill: statusColors[status as keyof typeof statusColors] || '#71717a',
        }));
        
        setBookingStatusData(statusData);
        
        // Process revenue trend
        const dailyRevenue: Record<string, number> = {};
        
        filteredPayments
          .filter((p: any) => p.payment_status === 'verified')
          .forEach((p: any) => {
            const date = new Date(p.created_at);
            const dateKey = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + parseFloat(p.amount);
          });
        
        const revenueTrendData = Object.entries(dailyRevenue)
          .map(([date, amount]) => ({ date, amount }))
          .slice(-10);
        
        setRevenueChartData(revenueTrendData);

        if (!Array.isArray(bookings) || bookings.length === 0) {
          setRecentBookings([]);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setStats({
        totalRevenue: 0,
        totalBookings: 0,
        activeClients: 0,
        pendingPayments: 0,
        revenueChange: 0,
        bookingsChange: 0,
        clientsChange: 0,
        paymentsChange: 0,
      });
      setPaymentData([]);
      setServiceData([]);
      setBookingStatusData([]);
      setRevenueChartData([]);
      setRecentBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      gradient: "from-amber-500/20 to-orange-500/20",
      iconBg: "bg-amber-500",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings.toString(),
      change: stats.bookingsChange,
      icon: Calendar,
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconBg: "bg-blue-500",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Active Clients",
      value: stats.activeClients.toString(),
      change: stats.clientsChange,
      icon: Users,
      gradient: "from-emerald-500/20 to-teal-500/20",
      iconBg: "bg-emerald-500",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Pending Payments",
      value: formatCurrency(stats.pendingPayments),
      change: stats.paymentsChange,
      icon: CreditCard,
      gradient: "from-rose-500/20 to-pink-500/20",
      iconBg: "bg-rose-500",
      borderColor: "border-rose-500/20",
    },
  ];

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'completed':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'cancelled':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-linear-to-br from-amber-500 to-orange-600">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-balance">Dashboard Overview</h1>
                <p className="text-sm text-zinc-400 mt-0.5">
                  Welcome back! Here&apos;s your business at a glance.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 text-zinc-300"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-zinc-800/80 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all cursor-pointer hover:bg-zinc-700/80 [&>option]:bg-zinc-800 [&>option]:text-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">This Year</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-5 animate-pulse"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 bg-zinc-800 rounded-xl" />
                  <div className="h-6 w-16 bg-zinc-800 rounded-full" />
                </div>
                <div className="h-8 bg-zinc-800 rounded mb-2 w-2/3" />
                <div className="h-4 bg-zinc-800 rounded w-1/2" />
              </div>
            ))
          ) : (
            statsCards.map((stat) => (
              <div
                key={stat.title}
                className={`relative overflow-hidden bg-linear-to-br ${stat.gradient} backdrop-blur-sm rounded-2xl border ${stat.borderColor} p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/5`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-linear-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2.5 rounded-xl ${stat.iconBg} shadow-lg`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      stat.change >= 0 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {stat.change >= 0 ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(stat.change)}%
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</p>
                  <p className="text-sm text-zinc-400 mt-1">{stat.title}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Trend - Takes 2 columns */}
          <div className="lg:col-span-2 bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Revenue Trend</h3>
                <p className="text-sm text-zinc-500">Daily verified payments overview</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <span className="text-zinc-400">Revenue</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="h-75 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-zinc-500 text-sm">Loading chart...</span>
                </div>
              </div>
            ) : (
              <ChartContainer
                config={{
                  amount: {
                    label: "Revenue",
                    color: "#f59e0b",
                  },
                }}
                className="h-75"
              >
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: '#f59e0b', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </div>

          {/* Service Distribution */}
          <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Bookings by Service</h3>
              <p className="text-sm text-zinc-500">Distribution overview</p>
            </div>
            {loading ? (
              <div className="h-75 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="h-45 flex items-center justify-center">
                  <PieChart width={180} height={180}>
                    <Pie
                      data={serviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {serviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                      }}
                      formatter={(value: number, name: string) => [`${value}%`, name]}
                    />
                  </PieChart>
                </div>
                <div className="space-y-2 mt-4">
                  {serviceData.slice(0, 4).map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-2.5 bg-zinc-800/30 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-zinc-300">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-500">{item.bookings} bookings</span>
                        <span className="text-sm font-semibold">{item.value}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Secondary Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Amount Chart */}
          <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Payment Overview</h3>
                <p className="text-sm text-zinc-500">Monthly payment amounts by status</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-zinc-400">Verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                  <span className="text-zinc-400">Pending</span>
                </div>
              </div>
            </div>
            {loading ? (
              <div className="h-70 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <ChartContainer
                config={{
                  verified: { label: "Verified", color: "#10b981" },
                  pending: { label: "Pending", color: "#f59e0b" },
                }}
                className="h-70"
              >
                <BarChart data={paymentData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#71717a"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value / 1000}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="verified" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="pending" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Booking Status</h3>
                <p className="text-sm text-zinc-500">Current order distribution</p>
              </div>
            </div>
            {loading ? (
              <div className="h-70 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : bookingStatusData.length === 0 ? (
              <div className="h-70 flex flex-col items-center justify-center text-zinc-500">
                <Calendar className="w-12 h-12 mb-2 opacity-20" />
                <p>No booking data available</p>
              </div>
            ) : (
              <ChartContainer
                config={{ count: { label: "Bookings" } }}
                className="h-70"
              >
                <RadialBarChart 
                  cx="50%" 
                  cy="50%" 
                  innerRadius="25%" 
                  outerRadius="85%" 
                  data={bookingStatusData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 600 }}
                    background={{ fill: '#27272a' }}
                    dataKey="count"
                    cornerRadius={8}
                  />
                  <Legend 
                    iconSize={10}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    formatter={(value) => <span style={{ color: '#d4d4d8', fontSize: '12px', textTransform: 'capitalize' }}>{value}</span>}
                    wrapperStyle={{ paddingLeft: '20px' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      fontSize: '12px'
                    }}
                    cursor={false}
                  />
                </RadialBarChart>
              </ChartContainer>
            )}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Recent Bookings</h3>
              <p className="text-sm text-zinc-500">Latest booking activity</p>
            </div>
            <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10">
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          {/* Table Header - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider border-b border-zinc-800 mb-2">
            <div className="col-span-4">Client</div>
            <div className="col-span-3">Service</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-1">Status</div>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800 animate-pulse"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-700 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-zinc-700 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-zinc-700 rounded w-1/4" />
                    </div>
                  </div>
                </div>
              ))
            ) : recentBookings.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <Camera className="w-16 h-16 mx-auto mb-3 opacity-20" />
                <p className="font-medium">No bookings yet</p>
                <p className="text-sm mt-1">Your recent bookings will appear here</p>
              </div>
            ) : (
              recentBookings.map((booking, idx) => (
                <div
                  key={booking.id}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center p-4 bg-zinc-800/20 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/40 hover:border-zinc-700 transition-all duration-200"
                >
                  {/* Client */}
                  <div className="md:col-span-4 flex items-center gap-3">
                    <div className="relative">
                      <img 
                        src={booking.avatar || "/placeholder.svg"} 
                        alt={booking.client}
                        className="w-10 h-10 rounded-full object-cover"
                        crossOrigin="anonymous"
                      />
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-zinc-900 ${
                        booking.status === 'confirmed' || booking.status === 'completed' ? 'bg-emerald-500' : 
                        booking.status === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-white">{booking.client}</p>
                      <p className="text-sm text-zinc-500 md:hidden">{booking.service}</p>
                    </div>
                  </div>

                  {/* Service - Hidden on mobile, shown in client section */}
                  <div className="hidden md:block md:col-span-3">
                    <p className="text-sm text-zinc-300">{booking.service}</p>
                  </div>

                  {/* Amount & Date - Mobile layout */}
                  <div className="md:hidden flex items-center justify-between">
                    <p className="font-semibold text-white">{formatCurrency(booking.amount)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">{booking.date}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getStatusStyles(booking.status)}`}>
                        {booking.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Amount - Desktop */}
                  <div className="hidden md:block md:col-span-2">
                    <p className="font-semibold text-white">{formatCurrency(booking.amount)}</p>
                  </div>

                  {/* Date - Desktop */}
                  <div className="hidden md:flex md:col-span-2 items-center gap-1.5 text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-sm">{booking.date}</span>
                  </div>

                  {/* Status - Desktop */}
                  <div className="hidden md:block md:col-span-1">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${getStatusStyles(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
