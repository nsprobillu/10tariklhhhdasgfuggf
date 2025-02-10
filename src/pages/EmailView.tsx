import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RefreshCw, Star, Trash2, Archive, Flag, Mail as MailIcon, 
  Clock, GripVertical, AlertTriangle, Copy, Check, ExternalLink, Download, Pause, Play, QrCode 
} from 'lucide-react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/authStore';
import { CopyButton } from '../components/CopyButton';
import { DeleteConfirmation } from '../components/DeleteConfirmation';
import { useThemeStore } from '../store/themeStore';

interface Email {
  id: string;
  from_email: string;
  subject: string;
  body_html: string;
  body_text: string;
  received_at: string;
  temp_email: string;
  is_starred?: boolean;
}

interface TempEmail {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
}

interface Attachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url: string;
}

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: Email;
}

function QRModal({ isOpen, onClose, email }: QRModalProps) {
  if (!isOpen) return null;

  const qrData = JSON.stringify({
    from: email.from_email,
    subject: email.subject,
    received: new Date(email.received_at).toLocaleString(),
    body: email.body_text || email.body_html?.replace(/<[^>]*>/g, '')
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-auto">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Email QR Code</h3>
        <div className="flex justify-center mb-4">
          <QRCodeSVG
            value={qrData}
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

export function EmailView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { isDark } = useThemeStore();
  const [tempEmail, setTempEmail] = useState<TempEmail | null>(null);
  const [receivedEmails, setReceivedEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [showActionFeedback, setShowActionFeedback] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [qrModal, setQRModal] = useState<{ isOpen: boolean; email: Email | null }>({
    isOpen: false,
    email: null
  });

  useEffect(() => {
    fetchTempEmail();
    fetchEmails();
  }, [id]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    if (autoRefreshEnabled) {
      refreshInterval = setInterval(fetchEmails, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [autoRefreshEnabled]);

  const fetchTempEmail = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/emails/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTempEmail(response.data);
    } catch (error) {
      console.error('Failed to fetch temp email details:', error);
      setError('Failed to fetch email details');
    }
  };

  const fetchEmails = async () => {
    if (!id) return;

    try {
      setIsRefreshing(true);
      console.log('Fetching emails for ID:', id);
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Raw response:', response.data);

      // Validate and transform the data
      const validEmails = (response.data || []).map(email => ({
        ...email,
        // Ensure required fields exist with fallbacks
        id: email.id || '',
        from_email: email.from_email || 'Unknown Sender',
        subject: email.subject || 'No Subject',
        body_html: email.body_html || '',
        body_text: email.body_text || '',
        received_at: email.received_at || new Date().toISOString(),
        is_starred: Boolean(email.is_starred),
        temp_email: email.temp_email || ''
      })).filter(email => email.id); // Only keep emails with valid IDs

      console.log('Processed emails:', validEmails);
      
      // Keep the currently selected email if it exists in the new data
      if (selectedEmail) {
        const updatedSelectedEmail = validEmails.find(email => email.id === selectedEmail.id);
        if (updatedSelectedEmail) {
          setSelectedEmail(updatedSelectedEmail);
        }
      }

      setReceivedEmails(validEmails);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
      setError('Failed to fetch emails. Please try again.');
      setLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchEmails();
  };

  const handleStar = async (email: Email) => {
    try {
      const updatedEmail = { ...email, is_starred: !email.is_starred };
      setReceivedEmails(emails =>
        emails.map(e => e.id === email.id ? updatedEmail : e)
      );
      setShowActionFeedback(updatedEmail.is_starred ? 'Email starred' : 'Star removed');
      setTimeout(() => setShowActionFeedback(''), 2000);
      
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received/${email.id}/star`,
        { starred: updatedEmail.is_starred },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Failed to update star status:', error);
      setReceivedEmails(emails =>
        emails.map(e => e.id === email.id ? email : e)
      );
    }
  };

  const handleArchive = async (email: Email) => {
    try {
      setReceivedEmails(emails =>
        emails.filter(e => e.id !== email.id)
      );
      setShowActionFeedback('Email archived');
      setTimeout(() => setShowActionFeedback(''), 2000);
      
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received/${email.id}/archive`,
        { archived: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to archive email:', error);
      fetchEmails();
    }
  };

  const handleSpam = async (email: Email) => {
    try {
      setReceivedEmails(emails =>
        emails.filter(e => e.id !== email.id)
      );
      setShowActionFeedback('Marked as spam');
      setTimeout(() => setShowActionFeedback(''), 2000);
      
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received/${email.id}/spam`,
        { spam: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to mark as spam:', error);
      fetchEmails();
    }
  };

  const handleDelete = async () => {
    if (!selectedEmail) return;
    
    try {
      setReceivedEmails(emails =>
        emails.filter(e => e.id !== selectedEmail.id)
      );
      setShowActionFeedback('Email deleted');
      setTimeout(() => setShowActionFeedback(''), 2000);
      
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received/${selectedEmail.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedEmail(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Failed to delete email:', error);
      fetchEmails();
    }
  };

  const toggleEmailSelection = (emailId: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(emailId)) {
      newSelection.delete(emailId);
    } else {
      newSelection.add(emailId);
    }
    setSelectedEmails(newSelection);
  };

  const handleBulkAction = async (action: 'delete' | 'archive' | 'spam') => {
    if (selectedEmails.size === 0) return;

    try {
      const emailIds = Array.from(selectedEmails);
      setReceivedEmails(emails =>
        emails.filter(e => !selectedEmails.has(e.id))
      );
      
      setShowActionFeedback(`${emailIds.length} emails ${
        action === 'delete' ? 'deleted' :
        action === 'archive' ? 'archived' : 'marked as spam'
      }`);
      setTimeout(() => setShowActionFeedback(''), 2000);
      
      await axios.post(
        `${import.meta.env.VITE_API_URL}/emails/${id}/received/bulk/${action}`,
        { emailIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedEmails(new Set());
      if (selectedEmail && selectedEmails.has(selectedEmail.id)) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} emails:`, error);
      fetchEmails();
    }
  };

  const copyToClipboard = async () => {
    if (!tempEmail?.email) return;
    try {
      await navigator.clipboard.writeText(tempEmail.email);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  if (error || !tempEmail) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Emails</h3>
        <p className="text-gray-500 mb-4">{error || 'Email not found'}</p>
        <Link
          to="/dashboard"
          className="text-[#4A90E2] hover:text-[#357ABD] inline-flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to inbox
        </Link>
      </div>
    );
  }

  return (
    <div className={`email-dashboard h-[calc(100vh-4rem)] flex flex-col ${isDark ? 'dark' : ''}`}>
      <div className={`p-4 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col space-y-2">
            <Link
              to="/dashboard"
              className={`inline-flex items-center ${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center space-x-2">
              <h1 className={`text-lg sm:text-xl font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {tempEmail?.email}
              </h1>
              <CopyButton text={tempEmail?.email || ''} />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`p-2 rounded-full transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title={autoRefreshEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh'}
            >
              {autoRefreshEnabled ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            {selectedEmails.size > 0 ? (
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selectedEmails.size} selected
                </span>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                      : 'text-gray-600 hover:text-red-500 hover:bg-gray-100'
                  }`}
                  title="Delete selected"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleBulkAction('archive')}
                  className={`p-2 rounded-full transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title="Archive selected"
                >
                  <Archive className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-full transition-colors ${
                  isDark
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div
          className={`${
            selectedEmail ? 'hidden md:block' : 'block'
          } w-full md:w-[380px] border-r overflow-y-auto ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}
        >
          <div className="divide-y">
            {receivedEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmail(email)}
                className={`flex items-start p-4 cursor-pointer transition-colors duration-150 ${
                  isDark
                    ? `${selectedEmail?.id === email.id ? 'bg-gray-700' : ''} hover:bg-gray-700`
                    : `${selectedEmail?.id === email.id ? 'bg-blue-50' : ''} hover:bg-gray-50`
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedEmails.has(email.id)}
                  onChange={() => toggleEmailSelection(email.id)}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-1 mr-4 rounded ${
                    isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                      {email.from_email}
                    </span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(email.received_at)}
                    </span>
                  </div>
                  <h3 className={`text-sm font-medium truncate ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                    {email.subject}
                  </h3>
                  <p className={`text-sm truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {email.body_text || email.body_html?.replace(/<[^>]*>/g, '') || 'No content'}
                  </p>
                </div>
              </div>
            ))}
            {receivedEmails.length === 0 && (
              <div className={`p-4 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                No emails received yet
              </div>
            )}
          </div>
        </div>

        {selectedEmail ? (
          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="p-4 sm:p-6 max-w-4xl mx-auto">
              <div className={`bg-white rounded-lg shadow-lg overflow-hidden ${isDark ? 'bg-gray-800' : ''}`}>
                <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedEmail.subject}
                      </h2>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        From: {selectedEmail.from_email}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Received: {formatDate(selectedEmail.received_at)}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStar(selectedEmail)}
                        className={`p-2 rounded-full transition-colors ${
                          selectedEmail.is_starred
                            ? 'text-yellow-500 hover:bg-yellow-50'
                            : `${isDark ? 'text-gray-400 hover:text-yellow-400' : 'text-gray-400 hover:text-yellow-500'} hover:bg-gray-100`
                        }`}
                        title={selectedEmail.is_starred ? 'Unstar' : 'Star'}
                      >
                        <Star className="h-5 w-5" fill={selectedEmail.is_starred ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => window.open(`mailto:${selectedEmail.from_email}`)}
                        className={`p-2 rounded-full transition-colors ${
                          isDark
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Reply"
                      >
                        <ExternalLink className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleArchive(selectedEmail)}
                        className={`p-2 rounded-full transition-colors ${
                          isDark
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Archive"
                      >
                        <Archive className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSpam(selectedEmail)}
                        className={`p-2 rounded-full transition-colors ${
                          isDark
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                        }`}
                        title="Mark as spam"
                      >
                        <Flag className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className={`p-2 rounded-full transition-colors ${
                          isDark
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-700'
                            : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                        }`}
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setQRModal({ isOpen: true, email: selectedEmail })}
                        className={`p-2 rounded-full transition-colors ${
                          isDark
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                        title="Show QR Code"
                      >
                        <QrCode className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {selectedEmail.body_html ? (
                    <div 
                      className={`prose max-w-none ${isDark ? 'prose-invert' : ''}`}
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <div className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedEmail.body_text || 'No content'}
                    </div>
                  )}
                </div>

                {attachments.length > 0 && (
                  <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Attachments ({attachments.length})
                    </h3>
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isDark ? 'bg-gray-700' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center min-w-0">
                            <Download className={`w-5 h-5 mr-2 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <div className="min-w-0">
                              <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                                {attachment.filename}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={attachment.url}
                            download
                            className={`ml-4 px-3 py-1 rounded-md text-sm flex-shrink-0 ${
                              isDark
                                ? 'bg-gray-600 text-white hover:bg-gray-500'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            } transition-colors`}
                          >
                            Download
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`hidden md:flex flex-1 items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-center">
              <MailIcon className={`h-12 w-12 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
              <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Select an email
              </h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose an email from the list to view its contents
              </p>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmation
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        itemName="this email"
      />

      {qrModal.email && (
        <QRModal
          isOpen={qrModal.isOpen}
          onClose={() => setQRModal({ isOpen: false, email: null })}
          email={qrModal.email}
        />
      )}

      {showActionFeedback && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
          {showActionFeedback}
        </div>
      )}
    </div>
  );
}