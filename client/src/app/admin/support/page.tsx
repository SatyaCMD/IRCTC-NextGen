'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Search, Loader2, FileText, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { format } from 'date-fns';

export default function AdminSupportPage() {
  const { user, loading } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/support/admin`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch support tickets');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    setResolvingId(ticketId);
    const toastId = toast.loading('Resolving ticket and sending email...');
    
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/support/admin/${ticketId}/resolve`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      toast.success('Ticket resolved successfully! Email sent to user.', { id: toastId });
      
      // Update local state
      setTickets(tickets.map(t => t._id === ticketId ? { ...t, status: 'Resolved' } : t));
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to resolve ticket', { id: toastId });
    } finally {
      setResolvingId(null);
    }
  };

  const filteredTickets = tickets.filter(ticket => 
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen bg-[#050505] flex justify-center pt-32"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (!user || user.role !== 'admin') return <div className="min-h-screen bg-[#050505] text-white text-center pt-32">Access Denied</div>;

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Support Dashboard</h1>
            <p className="text-white/60">Manage and resolve customer support tickets.</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              placeholder="Search by Ticket Number or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : filteredTickets.length === 0 ? (
          <div className="bg-[#111] border border-white/10 rounded-3xl p-20 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <p className="text-xl text-white/60">No support tickets found.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(ticket => (
              <div key={ticket._id} className="bg-[#111] border border-white/10 hover:border-white/20 transition-colors rounded-2xl p-6 flex flex-col lg:flex-row gap-6">
                
                {/* Status Indicator */}
                <div className="hidden lg:flex flex-col items-center justify-center border-r border-white/10 pr-6">
                  {ticket.status === 'Resolved' ? (
                    <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
                  ) : (
                    <Clock className="w-10 h-10 text-yellow-500 mb-2" />
                  )}
                  <span className={`text-sm font-bold uppercase tracking-wider ${ticket.status === 'Resolved' ? 'text-green-500' : 'text-yellow-500'}`}>
                    {ticket.status}
                  </span>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-blue-400 font-mono font-bold px-3 py-1 bg-blue-500/10 rounded-lg text-sm">{ticket.ticketNumber}</span>
                    <span className="text-white/40 text-sm">{format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                    <span className="text-white/80 text-sm bg-white/5 px-3 py-1 rounded-lg border border-white/10">{ticket.issueType}</span>
                  </div>
                  
                  <p className="text-white text-lg mb-4 leading-relaxed">{ticket.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-white/50">
                    <p><strong>User:</strong> {ticket.user?.name} ({ticket.user?.email})</p>
                    {ticket.user?.mobile && <p><strong>Phone:</strong> {ticket.user.mobile}</p>}
                  </div>

                  {/* Documents */}
                  {ticket.documents && ticket.documents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-white/60 text-sm mb-3 font-medium uppercase tracking-wider">Attached Documents</p>
                      <div className="flex flex-wrap gap-3">
                        {ticket.documents.map((doc: string, idx: number) => (
                          <a 
                            key={idx} 
                            href={`${process.env.NEXT_PUBLIC_API_URL}${doc}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors px-4 py-2 rounded-xl text-blue-400 text-sm"
                          >
                            <FileText className="w-4 h-4" />
                            Document {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="lg:w-48 flex items-center justify-end border-t lg:border-t-0 border-white/10 pt-4 lg:pt-0">
                  {ticket.status === 'Open' ? (
                    <button
                      onClick={() => resolveTicket(ticket._id)}
                      disabled={resolvingId === ticket._id}
                      className="w-full lg:w-auto px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {resolvingId === ticket._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      Resolve Issue
                    </button>
                  ) : (
                    <button disabled className="w-full lg:w-auto px-6 py-3 bg-white/5 text-white/40 rounded-xl font-bold cursor-not-allowed">
                      Resolved
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
