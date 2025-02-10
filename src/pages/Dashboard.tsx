import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, RefreshCw, Mail, Clock, QrCode, 
  AlertTriangle, X, Check, Info, Shield 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { EmailSearch } from '../components/EmailSearch';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { CopyButton } from '../components/CopyButton';
import { QRCodeSVG } from 'qrcode.react';

interface ReceivedEmail {
  subject: string;
  received_at: string;
}

interface TempEmail {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  lastEmail?: ReceivedEmail;
}

interface Domain {
  id: string;
  domain: string;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

interface CustomMessage {
  id: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_active: boolean;
  dismissed: boolean;
}

function QRModal({ isOpen, onClose, email }: QRModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4 break-all">
          QR Code for {email}
        </h3>
        <div className="flex justify-center mb-4">
          <QRCodeSVG
            value={email}
            size={Math.min(window.innerWidth - 80, 200)}
            className="w-full max-w-[200px]"
          />
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-[#4A90E2] text-white rounded-lg hover:bg-[#357ABD] transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tempEmails, setTempEmails] = useState<TempEmail[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; emailId: string; email: string }>({
    isOpen: false,
    emailId: '',
    email: ''
  });
  const [qrModal, setQRModal] = useState<{ isOpen: boolean; email: string }>({
    isOpen: false,
    email: ''
  });
  const [messages, setMessages] = useState<CustomMessage[]>([]);
  
  const { token } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    fetchEmails();
    fetchDomains();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/messages`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessages(response.data.filter((msg: CustomMessage) => !msg.dismissed));
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };

    fetchMessages();
  }, [token]);

  const handleDismissMessage = async (messageId: string) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/messages/${messageId}/dismiss`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Failed to dismiss message:', error);
    }
  };

  const fetchEmails = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/emails`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const emailsWithLastMessage = await Promise.all(
        response.data.map(async (email: TempEmail) => {
          try {
            const lastEmailResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/emails/${email.id}/received`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            return {
              ...email,
              lastEmail: lastEmailResponse.data[0] || null
            };
          } catch (error) {
            return email;
          }
        })
      );
      setTempEmails(emailsWithLastMessage);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/domains`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDomains(response.data);
      if (response.data.length > 0 && !selectedDomain) {
        setSelectedDomain(response.data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
    }
  };

  const createEmail = async () => {
    try {
      if (!selectedDomain) {
        setError('Please select a domain');
        return;
      }

      const selectedDomainObj = domains.find(d => d.id === selectedDomain);
      if (!selectedDomainObj) {
        setError('Invalid domain selected');
        return;
      }

      const emailPrefix = newEmail.trim() || Math.random().toString(36).substring(2, 8);
      const fullEmail = `${emailPrefix}@${selectedDomainObj.domain}`;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/emails/create`,
        { 
          email: fullEmail,
          domainId: selectedDomain 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTempEmails([response.data, ...tempEmails]);
      setNewEmail('');
      setError('');
    } catch (error) {
      console.error('Create email error:', error);
      setError('Failed to create email');
    }
  };

  const confirmDelete = (id: string, email: string) => {
    setDeleteConfirmation({ isOpen: true, emailId: id, email });
  };

  const deleteEmail = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/emails/delete/${deleteConfirmation.emailId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempEmails(tempEmails.filter(email => email.id !== deleteConfirmation.emailId));
      setDeleteConfirmation({ isOpen: false, emailId: '', email: '' });
    } catch (error) {
      console.error('Failed to delete email:', error);
    }
  };

  const filteredEmails = tempEmails.filter(email =>
    email.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchEmails();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="flex flex-col space-y-6 mb-6">
        <div className="flex justify-between items-center">
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Your Temporary Emails
          </h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-full transition-colors ${
              isDark 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex w-full sm:w-auto">
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter username (optional)"
              className={`w-48 rounded-l-lg border-r-0 border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : ''
              }`}
            />
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className={`rounded-r-lg border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : ''
              }`}
            >
              {domains.map(domain => (
                <option key={domain.id} value={domain.id}>
                  @{domain.domain}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={createEmail}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#4A90E2] hover:bg-[#357ABD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-5 w-5 mr-2 sm:mr-0 sm:hidden" />
            <span>Create</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <EmailSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {messages.length > 0 && (
        <div className="mb-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start p-4 rounded-lg ${
                message.type === 'info' ? 'bg-blue-50 text-blue-800' :
                message.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                message.type === 'success' ? 'bg-green-50 text-green-800' :
                'bg-red-50 text-red-800'
              }`}
            >
              <div className="flex-shrink-0 mr-3">
                {message.type === 'info' && <Info className="w-5 h-5" />}
                {message.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                {message.type === 'success' && <Check className="w-5 h-5" />}
                {message.type === 'error' && <Shield className="w-5 h-5" />}
              </div>
              <div className="flex-1 mr-2">
                <p>{message.content}</p>
              </div>
              <button
                onClick={() => handleDismissMessage(message.id)}
                className="flex-shrink-0 ml-4 hover:opacity-75 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {filteredEmails.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
          <Mail className={`mx-auto h-12 w-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="mt-2 text-sm font-medium">No temporary emails</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {searchTerm ? 'No emails match your search.' : 'Get started by creating a new temporary email.'}
          </p>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow overflow-hidden sm:rounded-lg`}>
          <ul className="divide-y divide-gray-200">
            {filteredEmails.map((email) => (
              <Link 
                key={email.id}
                to={`/dashboard/email/${email.id}`}
                className={`block hover:bg-gray-50 transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                        <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                          {email.email}
                        </p>
                        <CopyButton 
                          text={email.email} 
                          className="z-10"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          Expires {formatDate(email.expires_at)}
                        </span>
                        {email.lastEmail && (
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {email.lastEmail.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-0 flex justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setQRModal({ isOpen: true, email: email.email });
                        }}
                        className={`text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full ${
                          isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          confirmDelete(email.id, email.email);
                        }}
                        className={`text-gray-400 hover:text-red-500 transition-colors p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </ul>
        </div>
      )}

      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, emailId: '', email: '' })}
        onConfirm={deleteEmail}
        itemName={deleteConfirmation.email}
      />

      <QRModal
        isOpen={qrModal.isOpen}
        onClose={() => setQRModal({ isOpen: false, email: '' })}
        email={qrModal.email}
      />
    </div>
  );
}