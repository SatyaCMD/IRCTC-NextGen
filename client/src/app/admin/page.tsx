'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import axios from 'axios';
import { 
  Users, Activity, Server, Ticket, Settings, Search, 
  Plus, Edit2, Trash2, MoreVertical, ShieldAlert,
  TrendingUp, Train, Plane, Hotel, CheckCircle2, XCircle,
  Utensils, LogOut, Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is authenticated via sessionStorage (clears on tab/browser close)
    const adminToken = sessionStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/admin/login');
    }
  }, [router]);

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingSearch, setBookingSearch] = useState('');
  const [dashboardStats, setDashboardStats] = useState<any>({ totalUsers: 0, activeServices: 0, totalBookings: 0, revenue: 0 });
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Settings State
  const [systemSettings, setSystemSettings] = useState({ maintenanceMode: false, aiAssistant: true, bookingCommission: 5 });
  
  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', role: 'User', status: 'Active' });

  const fetchData = async () => {
    try {
      const [usersRes, servicesRes, statsRes, bookingsRes, settingsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/users'),
        axios.get('http://localhost:5000/api/admin/services'),
        axios.get('http://localhost:5000/api/admin/stats'),
        axios.get('http://localhost:5000/api/admin/bookings'),
        axios.get('http://localhost:5000/api/admin/settings')
      ]);
      setUsers(usersRes.data);
      setServices(servicesRes.data);
      setDashboardStats(statsRes.data);
      setBookings(bookingsRes.data);
      if (settingsRes.data) {
        setSystemSettings({
          maintenanceMode: settingsRes.data.maintenanceMode,
          aiAssistant: settingsRes.data.aiAssistant,
          bookingCommission: settingsRes.data.bookingCommission
        });
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to load data from database: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Quick stats
  const stats = [
    { title: 'Total Users', value: dashboardStats.totalUsers.toLocaleString(), change: 'Live', icon: <Users className="text-blue-400" /> },
    { title: 'Active Services', value: dashboardStats.activeServices.toLocaleString(), change: 'Live', icon: <Server className="text-purple-400" /> },
    { title: 'Total Bookings', value: dashboardStats.totalBookings.toLocaleString(), change: 'Live', icon: <Ticket className="text-emerald-400" /> },
    { title: 'Revenue (MTD)', value: `₹${(dashboardStats.revenue || 0).toLocaleString()}`, change: 'Live', icon: <TrendingUp className="text-orange-400" /> },
  ];

  // Handlers
  const handleDeleteUser = async (id: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success('User deleted successfully from DB');
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await axios.put(`http://localhost:5000/api/admin/users/${editingUser._id}`, formData);
        setUsers(users.map(u => u._id === editingUser._id ? res.data : u));
        toast.success('User updated successfully in DB');
        setEditingUser(null);
      } else {
        toast.error('User creation requires full signup currently.');
        setIsAddUserModalOpen(false);
      }
      setFormData({ name: '', email: '', role: 'User', status: 'Active' });
      fetchData(); // Refresh stats
    } catch (err) {
      toast.error('Failed to save user');
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
  };

  const toggleServiceStatus = async (id: string) => {
    try {
      const serviceToToggle = services.find(s => s._id === id);
      const newStatus = serviceToToggle.status === 'Active' ? 'Maintenance' : 'Active';
      const res = await axios.put(`http://localhost:5000/api/admin/services/${id}`, { status: newStatus });
      setServices(services.map(s => s._id === id ? res.data : s));
      toast.success(`${serviceToToggle.name} marked as ${newStatus} in DB`);
      fetchData(); // Refresh active services stat
    } catch (err) {
      toast.error('Failed to update service status');
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white pt-20 selection:bg-blue-500/30">
      <Navbar />

      <div className="flex h-[calc(100vh-80px)] overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col hidden md:flex">
          <div className="flex items-center gap-3 mb-10 px-2">
            <ShieldAlert className="w-8 h-8 text-blue-500" />
            <h1 className="text-xl font-bold tracking-tight">Admin<span className="text-blue-500">Panel</span></h1>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'overview', label: 'Overview', icon: <Activity className="w-5 h-5" /> },
              { id: 'users', label: 'Manage Users', icon: <Users className="w-5 h-5" /> },
              { id: 'services', label: 'Services', icon: <Server className="w-5 h-5" /> },
              { id: 'bookings', label: 'Bookings', icon: <Ticket className="w-5 h-5" /> },
              { id: 'settings', label: 'System Settings', icon: <Settings className="w-5 h-5" /> },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
          
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 mt-auto">
            <p className="text-xs text-gray-400">Logged in as</p>
            <p className="font-bold text-white mb-3">Super Admin</p>
            <button 
              onClick={() => { 
                sessionStorage.removeItem('admin_token'); 
                router.push('/admin/login'); 
                toast.success('Admin logged out.'); 
              }} 
              className="w-full flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto bg-[#050505] relative p-8">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Dashboard Overview</h2>
                {isDataLoading && <div className="flex items-center gap-2 text-blue-400"><Loader2 className="w-4 h-4 animate-spin"/> Syncing Live Data...</div>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl hover:bg-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-black/40 rounded-xl border border-white/5">{stat.icon}</div>
                      <span className="text-emerald-400 text-sm font-bold bg-emerald-400/10 px-2 py-1 rounded-md">{stat.change}</span>
                    </div>
                    <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                    <p className="text-3xl font-black">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Activity */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-lg font-bold mb-6">Recent Bookings</h3>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking, i) => (
                      <div key={booking._id || i} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-400">
                            {booking.serviceDetails?.type === 'Flight' ? <Plane className="w-5 h-5"/> : <Train className="w-5 h-5"/>}
                          </div>
                          <div>
                            <p className="font-bold">{booking.serviceDetails?.name || 'Booking'}</p>
                            <p className="text-xs text-gray-400">PNR: {booking.pnr || 'N/A'}</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold font-mono">₹{booking.totalPrice?.toLocaleString() || 0}</span>
                      </div>
                    ))}
                    {bookings.length === 0 && (
                      <div className="text-center p-4 text-gray-500">No recent bookings found.</div>
                    )}
                  </div>
                </div>

                {/* Real System Metrics */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                  <h3 className="text-lg font-bold mb-6">Platform Activity</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Confirmed Bookings</span>
                        <span className="text-emerald-400">
                          {bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'Confirmed').length / bookings.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${bookings.length > 0 ? Math.round((bookings.filter(b => b.status === 'Confirmed').length / bookings.length) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Active Users</span>
                        <span className="text-blue-400">
                          {users.length > 0 ? Math.round((users.filter(u => u.status === 'Active').length / users.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${users.length > 0 ? Math.round((users.filter(u => u.status === 'Active').length / users.length) * 100) : 0}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-400">Operational Services</span>
                        <span className="text-orange-400">
                          {services.length > 0 ? Math.round((services.filter(s => s.status === 'Active').length / services.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full rounded-full" style={{ width: `${services.length > 0 ? Math.round((services.filter(s => s.status === 'Active').length / services.length) * 100) : 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
                <h2 className="text-3xl font-bold">User Management</h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="Search users..." className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-64" />
                  </div>
                  <button onClick={() => { setIsAddUserModalOpen(true); setEditingUser(null); setFormData({name: '', email: '', role: 'User', status: 'Active'}) }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                    <Plus className="w-4 h-4" /> Add User
                  </button>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left">
                  <thead className="bg-black/40 border-b border-white/10">
                    <tr>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Name</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Email</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Role</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Status</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users
                      .filter(user => user.status === 'Active' && !user.name.toLowerCase().includes('demo') && !user.email.toLowerCase().includes('demo'))
                      .map(user => (
                      <tr key={user._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium">{user.name}</td>
                        <td className="p-4 text-gray-400">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.role === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold flex items-center w-fit gap-1 ${user.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                            {user.status === 'Active' ? <CheckCircle2 className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openEditModal(user)} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"><Edit2 className="w-4 h-4"/></button>
                            <button onClick={() => handleDeleteUser(user._id)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SERVICES TAB */}
          {activeTab === 'services' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Service Operations</h2>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map(service => (
                  <div key={service._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-all group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                        {service.type === 'Train' && <Train className="w-6 h-6"/>}
                        {service.type === 'Flight' && <Plane className="w-6 h-6"/>}
                        {service.type === 'Hotel' && <Hotel className="w-6 h-6"/>}
                        {service.type === 'Food' && <Utensils className="w-6 h-6"/>}
                        {service.type === 'Package' && <Ticket className="w-6 h-6"/>}
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${service.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {service.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1">{service.name}</h3>
                    <p className="text-sm text-gray-400 mb-6 border-b border-white/10 pb-4 flex-grow">Type: {service.type}</p>
                    
                    <div className="flex justify-between items-center mt-auto">
                      <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Revenue</p>
                        <p className="text-lg font-mono font-bold text-white">₹{(service.revenue || 0).toLocaleString()}</p>
                      </div>
                      <button 
                        onClick={() => toggleServiceStatus(service._id)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-colors ${service.status === 'Active' ? 'border-orange-500/50 text-orange-400 hover:bg-orange-500/10' : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}`}
                      >
                        {service.status === 'Active' ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Booking Records</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search by PNR or ID..." 
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none w-72" 
                  />
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
                <table className="w-full text-left">
                  <thead className="bg-black/40 border-b border-white/10">
                    <tr>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Booking ID / PNR</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Journey Details</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Passengers</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Amount</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold">Status</th>
                      <th className="p-4 text-xs uppercase tracking-wider text-gray-400 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {bookings
                      .filter(b => b._id.toLowerCase().includes(bookingSearch.toLowerCase()) || (b.pnr && b.pnr.toLowerCase().includes(bookingSearch.toLowerCase())))
                      .map(booking => (
                      <tr key={booking._id} className="hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="font-mono text-sm text-gray-300">ID: {booking._id.substring(0, 8).toUpperCase()}</div>
                          {booking.pnr && <div className="text-xs font-bold text-blue-400 mt-1">PNR: {booking.pnr}</div>}
                        </td>
                        <td className="p-4">
                          <div className="font-bold">{booking.serviceDetails?.name || 'Train Ticket'}</div>
                          <div className="text-xs text-gray-400">{booking.journeyDate ? new Date(booking.journeyDate).toLocaleDateString() : 'N/A'}</div>
                        </td>
                        <td className="p-4 text-sm font-medium">{booking.passengers?.length || 1} Person(s)</td>
                        <td className="p-4 text-emerald-400 font-bold font-mono">₹{booking.totalPrice}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${booking.status === 'Confirmed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-blue-400 hover:text-blue-300 text-sm font-bold">View</button>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">No bookings found in the system.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
              <h2 className="text-3xl font-bold mb-8">System Settings</h2>
              
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">Maintenance Mode</h3>
                    <p className="text-sm text-gray-400">Suspend all new bookings and user signups.</p>
                  </div>
                  <button 
                    onClick={async () => { 
                      const newVal = !systemSettings.maintenanceMode;
                      setSystemSettings({...systemSettings, maintenanceMode: newVal}); 
                      try { await axios.put('http://localhost:5000/api/admin/settings', { maintenanceMode: newVal }); toast.success('Maintenance mode saved to DB!'); } catch(e) { toast.error('Failed to save'); }
                    }}
                    className={`w-14 h-7 rounded-full transition-colors relative ${systemSettings.maintenanceMode ? 'bg-red-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${systemSettings.maintenanceMode ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold">YatraMind AI Assistant</h3>
                    <p className="text-sm text-gray-400">Enable or disable the AI chatbot globally.</p>
                  </div>
                  <button 
                    onClick={async () => { 
                      const newVal = !systemSettings.aiAssistant;
                      setSystemSettings({...systemSettings, aiAssistant: newVal}); 
                      try { await axios.put('http://localhost:5000/api/admin/settings', { aiAssistant: newVal }); toast.success('AI settings saved to DB!'); } catch(e) { toast.error('Failed to save'); }
                    }}
                    className={`w-14 h-7 rounded-full transition-colors relative ${systemSettings.aiAssistant ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${systemSettings.aiAssistant ? 'translate-x-8' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl">
                  <h3 className="text-lg font-bold mb-2">Platform Commission (%)</h3>
                  <p className="text-sm text-gray-400 mb-4">Set the percentage cut taken from each booking.</p>
                  <div className="flex gap-4">
                    <input 
                      type="number" 
                      value={systemSettings.bookingCommission} 
                      onChange={(e) => setSystemSettings({...systemSettings, bookingCommission: Number(e.target.value)})}
                      className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <button 
                      onClick={async () => {
                        try {
                          await axios.put('http://localhost:5000/api/admin/settings', { bookingCommission: systemSettings.bookingCommission });
                          toast.success('Commission rate saved to Database!');
                        } catch(e) {
                          toast.error('Failed to save commission rate.');
                        }
                      }} 
                      className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* USER MODAL */}
      {(isAddUserModalOpen || editingUser) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl relative">
            <h2 className="text-2xl font-bold mb-6">{editingUser ? 'Edit User' : 'Add New User'}</h2>
            
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Role</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option>User</option>
                    <option>Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none">
                    <option>Active</option>
                    <option>Suspended</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-white/10 mt-6">
                <button type="button" onClick={() => {setIsAddUserModalOpen(false); setEditingUser(null);}} className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-blue-500/20">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </main>
  );
}
