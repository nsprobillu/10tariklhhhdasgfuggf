import React, { useState, useEffect } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import { Mail, Shield, Clock, Globe, CheckCircle, Zap, RefreshCw, Copy, Loader, Inbox, Trash2, Archive, Star } from 'lucide-react';
import axios from 'axios';

interface Domain {
  id: string;
  domain: string;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  received_at: string;
  is_starred?: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-white/20 rounded-full transition-colors"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
    </button>
  );
}

export function TempMailAdvanced() {
  // State management
  const [domains, setDomains] = useState<Domain[]>([]);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailPrefix, setEmailPrefix] = useState('');
  const [receivedEmails, setReceivedEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch domains from database
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await axios.get('/api/domains');
        const domainsData = response.data || [];
        
        // Add random integer domain option
        const randomDomain = { id: 'random', domain: 'randomint.net' };
        setDomains([...domainsData, randomDomain]);
        
        if (domainsData.length > 0) {
          setSelectedDomain(domainsData[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch domains:', error);
      }
    };

    fetchDomains();
  }, []);

  // Auto-refresh emails
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && generatedEmail) {
      interval = setInterval(() => fetchEmails(generatedEmail), 10000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, generatedEmail]);

  const fetchEmails = async (email: string) => {
    try {
      const response = await axios.get(`/api/emails/${email}`);
      setReceivedEmails(response.data || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  const generateEmail = async () => {
    if (!selectedDomain) return;

    setIsLoading(true);
    try {
      const selectedDomainObj = domains.find(d => d.id === selectedDomain);
      if (!selectedDomainObj) throw new Error('Invalid domain selected');

      const prefix = emailPrefix || Math.random().toString(36).substring(2, 10);
      const domain = selectedDomainObj.id === 'random' 
        ? `${Math.floor(Math.random() * 1000000)}.randomint.net`
        : selectedDomainObj.domain;

      const newEmail = `${prefix}@${domain}`;

      // Create temporary email
      await axios.post('/api/emails/create', {
        email: newEmail,
        domainId: selectedDomain
      });

      setGeneratedEmail(newEmail);
      await fetchEmails(newEmail);
    } catch (error) {
      console.error('Error generating email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAction = async (emailId: string, action: 'star' | 'archive' | 'delete') => {
    try {
      await axios.patch(`/api/emails/${emailId}/${action}`);
      setReceivedEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) setSelectedEmail(null);
    } catch (error) {
      console.error(`Failed to ${action} email:`, error);
    }
  };

  return (
    <PublicLayout>
      <div className="bg-gradient-to-r from-[#2F4858] to-[#33658A] text-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Email Generation Panel */}
            <div className="lg:col-span-1 bg-white/10 backdrop-blur-lg rounded-xl p-6 h-fit">
              <div className="space-y-6">
                {/* Domain Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">Select Domain</label>
                  <select
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="w-full bg-white/20 rounded-lg border border-white/30 p-3 focus:ring-2 focus:ring-blue-400"
                  >
                    {domains.map((domain) => (
                      <option key={domain.id} value={domain.id}>
                        @{domain.domain}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Generation */}
                <button
                  onClick={generateEmail}
                  disabled={isLoading}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white p-4 rounded-lg font-medium"
                >
                  {isLoading ? <Loader className="w-6 h-6 animate-spin mx-auto" /> : 'Generate Email'}
                </button>

                {/* Generated Email Display */}
                {generatedEmail && (
                  <div className="bg-white/10 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono break-all">{generatedEmail}</span>
                      <CopyButton text={generatedEmail} />
                    </div>
                    <div className="flex items-center space-x-4 text-sm">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        48h Session
                      </span>
                      <span className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        AES-256
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inbox Panel */}
            <div className="lg:col-span-2 bg-white/5 backdrop-blur-lg rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <Inbox className="w-5 h-5 mr-2" />
                  Inbox
                </h2>
                <button 
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`p-2 rounded-lg ${autoRefresh ? 'bg-green-500' : 'bg-white/10'} hover:bg-white/20`}
                >
                  <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Email List */}
              <div className="space-y-3">
                {receivedEmails.map((email) => (
                  <div 
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${selectedEmail?.id === email.id ? 'bg-blue-500/20' : 'hover:bg-white/10'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium truncate">{email.subject || 'No Subject'}</h3>
                        <p className="text-sm text-white/80 truncate">{email.from}</p>
                      </div>
                      <div className="flex space-x-2">
                        <span className="text-xs text-white/60">
                          {new Date(email.received_at).toLocaleTimeString()}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEmailAction(email.id, 'star'); }}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <Star className="w-4 h-4" fill={email.is_starred ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}