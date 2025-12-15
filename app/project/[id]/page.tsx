// app/project/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Lead = {
  id: string;
  business_name: string;
};

type Message = {
  id: string;
  sender: 'admin' | 'client';
  content: string;
  created_at: string;
};

export default function ClientLeadDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();

  const leadId = params.id as string;
  const token = searchParams.get('token');

  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const validateAndLoad = async () => {
      if (!leadId || !token) {
        setError('Invalid link');
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('id, business_name')
        .eq('id', leadId)
        .eq('client_access_token', token)
        .single();

      if (fetchError || !data) {
        setError('Access denied. Check your link.');
        setLoading(false);
        return;
      }

      const { data: messagesData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      setLead(data);
      setMessages(messagesData || []);
      setLoading(false);
    };

    validateAndLoad();
  }, [leadId, token]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !leadId) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      lead_id: leadId,
      sender: 'client',
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert('Failed to send your message. Please try again.');
      console.error('Send error:', error);
    } else {
      // Optimistic UI update
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'client',
          content: newMessage.trim(),
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');
    }
    setSending(false);
  };

  if (loading) return <div className="p-8 text-center min-h-screen">Loading your dashboard...</div>;
  if (error) return <div className="p-8 text-center min-h-screen text-red-600">{error}</div>;
  if (!lead) return <div className="p-8 text-center min-h-screen">Lead not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Project Dashboard</h1>
          <p className="text-gray-600">For: {lead.business_name}</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-6">No messages yet. We’ll be in touch soon!</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.sender === 'admin'
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {msg.sender === 'admin' ? 'Your Developer' : 'You'}
                  </div>
                  <div className="mt-1 text-gray-700">{msg.content}</div>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="mt-8 border-t pt-6">
            <label htmlFor="clientMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Send a message to your developer
            </label>
            <textarea
              id="clientMessage"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a question, share an idea, or give feedback..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={3}
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`mt-3 px-4 py-2 rounded-lg font-medium text-white ${
                sending || !newMessage.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>This link is private and secure. Don’t share it with anyone.</p>
        </div>
      </div>
    </div>
  );
}