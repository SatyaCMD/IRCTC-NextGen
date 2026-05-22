'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UploadCloud, X, Loader2, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SupportPage() {
  const { user, loading } = useAuth();
  const [issueType, setIssueType] = useState('Booking Issue');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (files.length + selectedFiles.length > 5) {
        toast.error('You can only attach up to 5 documents.');
        return;
      }
      
      const oversizedFiles = selectedFiles.filter(f => f.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        toast.error('Each file must be less than 5MB.');
        return;
      }

      setFiles([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to raise a support ticket.');
      return;
    }
    if (description.trim().length < 20) {
      toast.error('Please provide a detailed description (minimum 20 characters).');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Submitting your support ticket...');

    try {
      const formData = new FormData();
      formData.append('issueType', issueType);
      formData.append('description', description);
      files.forEach((file) => {
        formData.append('documents', file);
      });

      const token = localStorage.getItem('token') || document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/support`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Ticket raised successfully!', { id: toastId });
      setTicketRaised(res.data.ticketNumber);
      setIssueType('Booking Issue');
      setDescription('');
      setFiles([]);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to raise ticket.', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-24">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-24">
        <div className="bg-[#111] p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
          <UploadCloud className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
          <p className="text-white/60 mb-6">You must be logged in to access the Support Portal and raise tickets.</p>
          <a href="/login?redirect=/support" className="w-full inline-block py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (ticketRaised) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center pt-24 px-4">
        <div className="bg-[#111] p-10 rounded-3xl border border-white/10 text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-white mb-4">Ticket Submitted</h2>
          <p className="text-white/70 mb-8 text-lg">Your support request has been securely forwarded to our team. We've sent a confirmation email to your registered address.</p>
          
          <div className="bg-black/50 p-6 rounded-2xl border border-white/5 mb-8">
            <p className="text-white/50 text-sm uppercase tracking-widest font-semibold mb-2">Your Ticket Number</p>
            <p className="text-4xl font-mono text-blue-400 font-bold tracking-wider">{ticketRaised}</p>
          </div>

          <button 
            onClick={() => setTicketRaised(null)}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-semibold"
          >
            Raise Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-4">Support Center</h1>
          <p className="text-xl text-white/60">Having trouble? Tell us what's wrong and we'll help you fix it.</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-400"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-white/90 font-medium text-sm ml-1 uppercase tracking-wider">Issue Type</label>
              <select 
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
              >
                <option value="Booking Issue">Booking Issue</option>
                <option value="Payment Failure">Payment Failure</option>
                <option value="Account Management">Account Management</option>
                <option value="Technical Error">Technical Error</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-white/90 font-medium text-sm ml-1 uppercase tracking-wider">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Please describe your issue in detail..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
              ></textarea>
            </div>

            <div className="space-y-3">
              <label className="text-white/90 font-medium text-sm ml-1 uppercase tracking-wider">Attachments (Max 5)</label>
              
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-blue-500/50 transition-colors bg-black/20 group relative cursor-pointer">
                <input 
                  type="file" 
                  multiple 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <UploadCloud className="w-10 h-10 text-white/40 mx-auto mb-3 group-hover:text-blue-400 transition-colors" />
                <p className="text-white/70 font-medium">Click or drag files here to attach</p>
                <p className="text-white/40 text-sm mt-1">Images, PDFs, or Word docs (Max 5MB each)</p>
              </div>

              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center justify-between group">
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-white/90 text-sm truncate">{file.name}</span>
                        <span className="text-white/40 text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFile(idx)}
                        className="text-white/40 hover:text-red-400 p-2 bg-white/5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                  Submit Support Ticket
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
