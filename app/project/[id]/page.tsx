// app/project/[id]/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
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

  const isPollingRef = useRef(false);
  const lastMessageCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const pollMessages = async () => {
    if (!leadId) return;

    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (!error && messagesData) {
        if (messagesData.length !== lastMessageCountRef.current) {
          setMessages(messagesData);
          lastMessageCountRef.current = messagesData.length;
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  useEffect(() => {
    if (!leadId || !token) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    const validateLead = async () => {
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('id, business_name')
        .eq('id', leadId)
        .eq('client_access_token', token)
        .single();

      if (leadError || !leadData) {
        setError('Access denied. The link may be expired or incorrect.');
        setLoading(false);
        return null;
      }

      setLead(leadData);
      setLoading(false);
      return leadData;
    };

    const init = async () => {
      const leadData = await validateLead();
      if (!leadData) return;

      await pollMessages();

      isPollingRef.current = true;
      const interval = setInterval(() => {
        if (!document.hidden && isPollingRef.current) {
          pollMessages();
        }
      }, 5000);

      return () => {
        isPollingRef.current = false;
        clearInterval(interval);
      };
    };

    init();
  }, [leadId, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      lastMessageCountRef.current += 1;
    }
    setSending(false);
  };

  if (loading)
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center">
        Loading your dashboard...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  if (!lead)
    return (
      <div className="p-8 text-center min-h-screen flex items-center justify-center">
        Lead not found.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="max-w-2xl mx-auto w-full px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Your Project Dashboard</h1>
          <p className="text-gray-600">For: {lead.business_name}</p>
        </div>

        {/* Message Card */}
        <div className="flex-1 bg-white rounded-xl shadow flex flex-col">
          <div className="p-4 pb-2 border-b border-gray-200">
            <p className="text-sm text-gray-500">
              {messages.length === 0
                ? 'No messages yet. We’ll be in touch soon!'
                : 'Conversation history'}
            </p>
          </div>

          {/* Scrollable Messages – only this part scrolls */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh] md:max-h-[50vh] lg:max-h-[60vh]">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.sender === 'admin'
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'bg-gray-100'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {msg.sender === 'admin' ? 'Your Developer' : 'You'}
                  </div>
                  <div className="mt-1 text-gray-700">{msg.content}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No messages yet. We’ll be in touch soon!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Input Area – does NOT scroll */}
          <div className="border-t border-gray-200 pt-4 px-4">
            <form onSubmit={handleSendMessage}>
              <label
                htmlFor="clientMessage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Send a message to your developer
              </label>
              <textarea
                id="clientMessage"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a question, share an idea, or give feedback..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-400 resize-none"
                rows={2}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className={`mt-2 w-full py-2 rounded-lg font-medium text-white ${
                  sending || !newMessage.trim()
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        {/* Privacy note – fixed at bottom, outside scroll */}
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>This link is private and secure. Don’t share it with anyone.</p>
        </div>
      </div>
    </div>
  );
}