import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Search, Calendar, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface EmailOutboxProps {
  onClose: () => void;
  persona: string;
}

const EmailOutbox = ({ onClose, persona }: EmailOutboxProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any>(null);

  const { data: emails = [] } = useQuery({
    queryKey: ['/api/emails'],
    refetchInterval: 5000
  });

  // Filter emails for current persona
  const personaEmails = (emails as any[]).filter((email: any) => email.persona === persona);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: '2-digit', 
      day: '2-digit', 
      year: '2-digit' 
    }) + ' ' + date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-400';
      case 'read': return 'text-purple-400';
      case 'sent': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const getPersonaTitle = (persona: string) => {
    switch (persona) {
      case 'rachel': return "Rachel's Email Inbox";
      case 'john': return "John's Email Inbox";
      case 'admin': return "Admin Email Inbox";
      default: return "Email Inbox";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-6xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Mail className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-semibold text-white">{getPersonaTitle(persona)}</h2>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Email List Sidebar */}
          <div className="w-1/2 border-r border-slate-700 flex flex-col">
            {/* Email List Header */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-white">Sent Emails</h3>
                <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                  {personaEmails.length} emails
                </Badge>
              </div>
              <p className="text-sm text-slate-400">Outbound communications with brokers</p>
              
              {/* Search Bar */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Email List */}
            <div className="flex-1 overflow-y-auto">
              {personaEmails.length === 0 ? (
                <div className="p-6 text-center">
                  <Mail className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No emails found</p>
                </div>
              ) : (
                personaEmails.map((email: any) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 border-b border-slate-700 cursor-pointer transition-colors hover:bg-slate-800 ${
                      selectedEmail?.id === email.id ? 'bg-slate-800' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white truncate">
                            {email.toEmail?.includes('wtkbrokers') ? 'WTK Brokers' : 
                             email.toEmail?.includes('aombrokers') ? 'AOM Brokers' : 
                             'Premier Brokers'}
                          </span>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-0.5 ${getStatusColor(email.deliveryStatus)}`}
                          >
                            {email.deliveryStatus || 'Delivered'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 truncate mb-1">
                          {email.subject}
                        </p>
                        <p className="text-xs text-slate-500">
                          To: {email.toEmail}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{formatDate(email.createdAt)}</span>
                      <span className="font-mono">
                        {email.messageId?.includes('rachel') ? 'WTK-2024-001' : 
                         email.messageId?.includes('john') ? 'IT-2024-001' : 'ADM-2024-001'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email Details Panel */}
          <div className="w-1/2 flex flex-col">
            {selectedEmail ? (
              <>
                {/* Email Header */}
                <div className="p-6 border-b border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {selectedEmail.subject}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">From:</span>
                          <span className="text-white">{selectedEmail.fromEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">To:</span>
                          <span className="text-white">{selectedEmail.toEmail}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400">Sent:</span>
                          <span className="text-white">{formatDate(selectedEmail.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(selectedEmail.deliveryStatus)} border-current`}
                    >
                      {selectedEmail.deliveryStatus || 'Delivered'}
                    </Badge>
                  </div>
                </div>

                {/* Email Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Email Content</span>
                    </div>
                    <div className="prose prose-slate prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-slate-200 font-sans leading-relaxed">
                        {selectedEmail.body}
                      </pre>
                    </div>
                  </div>

                  {/* Workflow Context */}
                  {selectedEmail.workflowContext && (
                    <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-white">Workflow Context</span>
                      </div>
                      <p className="text-sm text-slate-300">{selectedEmail.workflowContext}</p>
                    </div>
                  )}

                  {/* Email Metadata */}
                  <div className="mt-4 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-white">Email Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Message ID:</span>
                        <p className="text-white font-mono text-xs">{selectedEmail.messageId}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Priority:</span>
                        <p className="text-white">{selectedEmail.priority || 'Normal'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Email Type:</span>
                        <p className="text-white">{selectedEmail.emailType || 'Business'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Delivery Status:</span>
                        <p className={getStatusColor(selectedEmail.deliveryStatus)}>
                          {selectedEmail.deliveryStatus || 'Delivered'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select an Email</h3>
                  <p className="text-slate-400">Choose an email from the list to view its details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailOutbox;