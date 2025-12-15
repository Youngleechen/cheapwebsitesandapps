// app/admin/leads/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Lead = {
  id: string;
  email: string;
  business_name: string;
  category: string;
  website_goal: string;
  description: string | null;
  inspiration_template: string | null;
  created_at: string;
};

type Message = {
  id: string;
  sender: 'admin' | 'client';
  content: string;
  created_at: string;
};

export default function LeadDetail() {
  const params = useParams();
  const leadId = params.id as string;
  const router = useRouter();

  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchLeadAndMessages = async () => {
      // Fetch lead
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        router.push('/admin/leads');
        return;
      }

      // Fetch messages
      const { data: messageData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (msgError) {
        console.error('Error fetching messages:', msgError);
      }

      setLead(leadData);
      setMessages(messageData || []);
      setLoading(false);
    };

    if (leadId) fetchLeadAndMessages();
  }, [leadId, router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !lead) return;

    setSending(true);
    const messageContent = newMessage.trim();

    // Insert message
    const { error } = await supabase.from('messages').insert({
      lead_id: lead.id,
      sender: 'admin',
      content: messageContent,
    });

    if (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } else {
      // Optimistically add to UI
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'admin',
          content: messageContent,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage('');

      // 🔜 TODO: Trigger email notification here later
      // e.g., call an Edge Function: notifyClientOfMessage(lead.email, lead.id);
    }

    setSending(false);
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!lead) return <div className="p-8">Lead not found.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
      >
        ← Back to Leads
      </button>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{lead.business_name}</h1>
        <p className="text-gray-600">{lead.email}</p>
        <p className="mt-2 text-sm text-gray-500">
          Goal: {lead.website_goal}
          {lead.inspiration_template && (
            <> • Inspired by: <span className="font-medium">{lead.inspiration_template}</span></>
          )}
        </p>
      </div>

      {/* Messages */}
      <div className="bg-gray-50 rounded-lg shadow mb-6 h-96 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-4 p-3 rounded-lg max-w-[80%] ${
                msg.sender === 'admin'
                  ? 'ml-auto bg-indigo-100 text-gray-800'
                  : 'mr-auto bg-gray-200 text-gray-800'
              }`}
            >
              <div className="font-medium text-xs mb-1">
                {msg.sender === 'admin' ? 'You' : 'Client'}
              </div>
              <div>{msg.content}</div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          rows={2}
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}