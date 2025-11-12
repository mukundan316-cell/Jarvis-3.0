import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, Search, Clock, CheckCircle, AlertCircle, Filter, FileText, Shield, Calculator, MessageCircle, Paperclip, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

// Enhanced email interface combining both Universal and Unified features
interface Email {
  id: number;
  messageId?: string;
  subject: string;
  sender?: string;
  recipient?: string;
  toEmail: string;
  fromEmail: string;
  timestamp?: Date;
  sentAt: string;
  deliveredAt?: string;
  openedAt?: string;
  repliedAt?: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  deliveryStatus: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  emailType: string;
  brokerName?: string;
  policyNumber?: string;
  content?: string;
  body: string;
  brokerInfo?: any;
  attachments?: any[];
  generatedBy?: any;
  persona: string;
}

interface UniversalEmailInboxProps {
  isVisible: boolean;
  onClose: () => void;
  persona: 'admin' | 'rachel' | 'john' | 'broker' | 'sarah';
}

const getPersonaTitle = (persona: string) => {
  switch (persona) {
    case 'rachel': return "Rachel's Email Inbox";
    case 'john': return "John's Email Inbox";
    case 'admin': return "Admin Email Inbox";
    case 'broker': return "Mike's Email Inbox";
    case 'sarah': return "Sarah's Email Inbox";
    default: return "Email Inbox";
  }
};

const getPersonaDescription = (persona: string) => {
  switch (persona) {
    case 'rachel': return "Assistant Underwriter communications with brokers";
    case 'john': return "IT Support notifications and system alerts";
    case 'admin': return "Administrative communications and system reports";
    case 'broker': return "Insurance broker client communications";
    case 'sarah': return "Claims adjustor investigation and settlement communications";
    default: return "Email communications";
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'delivered':
      return <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">Delivered</Badge>;
    case 'read':
      return <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">Read</Badge>;
    case 'sent':
      return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Sent</Badge>;
    case 'failed':
      return <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    default:
      return <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/30">Unknown</Badge>;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered': return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'read': return <CheckCircle className="w-4 h-4 text-blue-400" />;
    case 'sent': return <Clock className="w-4 h-4 text-yellow-400" />;
    case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
    default: return <Mail className="w-4 h-4 text-slate-400" />;
  }
};

export function UniversalEmailInbox({ isVisible, onClose, persona }: UniversalEmailInboxProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    persona: persona
  });
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'priority'>('date');

  const queryClient = useQueryClient();

  // Standardized Universal query pattern - prevents cache fragmentation
  const { data: emails = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/emails', persona], // Simplified Universal pattern
    enabled: isVisible,
    refetchInterval: 3000, // Keep auto-refresh from Universal
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Update email status mutation from Unified version
  const updateStatusMutation = useMutation({
    mutationFn: async ({ emailId, status }: { emailId: number; status: string }) => {
      return apiRequest(`/api/emails/${emailId}/status`, 'PATCH', { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
    }
  });

  // Auto-refresh functionality from Universal version
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible, refetch]);

  const emailList = Array.isArray(emails) ? emails as Email[] : [];

  // Enhanced filtering and sorting from Unified version
  const filteredAndSortedEmails = emailList
    .filter((email: Email) => {
      if (filters.type !== 'all' && email.emailType !== filters.type) return false;
      if (filters.status !== 'all' && email.deliveryStatus !== filters.status) return false;
      if (searchQuery && !email.subject.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !email.toEmail.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(email.sender && email.sender.toLowerCase().includes(searchQuery.toLowerCase())) &&
          !(email.brokerName && email.brokerName.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      return true;
    })
    .sort((a: Email, b: Email) => {
      switch (sortBy) {
        case 'date':
          const aDate = a.sentAt ? new Date(a.sentAt) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
          const bDate = b.sentAt ? new Date(b.sentAt) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
          return bDate.getTime() - aDate.getTime();
        case 'type':
          return a.emailType.localeCompare(b.emailType);
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        default:
          return 0;
      }
    });

  // Email counts using Universal format with backward compatibility
  const emailCounts = {
    total: emailList.length,
    sent: emailList.filter((e: Email) => (e.status === 'sent' || e.deliveryStatus === 'sent')).length,
    delivered: emailList.filter((e: Email) => (e.status === 'delivered' || e.deliveryStatus === 'delivered')).length,
    read: emailList.filter((e: Email) => (e.status === 'read' || e.deliveryStatus === 'read')).length,
    recent: emailList.filter((e: Email) => {
      const emailDate = e.sentAt ? new Date(e.sentAt) : (e.timestamp ? new Date(e.timestamp) : new Date(0));
      const oneHourAgo = new Date(Date.now() - 3600000);
      return emailDate > oneHourAgo;
    }).length
  };

  // New email notifications from Universal version
  const [previousCount, setPreviousCount] = useState(emailList.length);
  const [newEmailsCount, setNewEmailsCount] = useState(0);

  useEffect(() => {
    if (emailList.length > previousCount) {
      const newEmails = emailList.length - previousCount;
      setNewEmailsCount(newEmails);
      setTimeout(() => setNewEmailsCount(0), 4000);
    }
    setPreviousCount(emailList.length);
  }, [emailList.length, previousCount]);

  // Helper functions from Unified version
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'quote': return <Calculator className="w-4 h-4" />;
      case 'claims': return <Shield className="w-4 h-4" />;
      case 'followup': return <MessageCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'read': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'replied': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'bounced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusColor = getStatusColor(status || 'unknown');
    return (
      <Badge variant="secondary" className={statusColor}>
        {status || 'Unknown'}
      </Badge>
    );
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'read': return <CheckCircle className="w-4 h-4 text-blue-400" />;
      case 'sent': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Mail className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    const status = email.status || email.deliveryStatus;
    if (status === 'sent') {
      updateStatusMutation.mutate({ emailId: email.id, status: 'read' });
    }
  };

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <span>{getPersonaTitle(persona)}</span>
            {newEmailsCount > 0 && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 animate-pulse">
                +{newEmailsCount} New
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[80vh] gap-4">
          {/* Left Panel - Email List with Controls */}
          <div className="flex-1 flex flex-col">
            {/* Enhanced Controls from Unified version */}
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                  data-testid="input-search-emails"
                />
              </div>
              
              <Select value={filters.type} onValueChange={(value) => setFilters({...filters, type: value})}>
                <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="documentation">Documentation</SelectItem>
                  <SelectItem value="quote">Quotes</SelectItem>
                  <SelectItem value="claims">Claims</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="replied">Replied</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'date' | 'type' | 'priority') => setSortBy(value)}>
                <SelectTrigger className="w-32 bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Count Summary */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="text-sm text-slate-400">Sent Emails</div>
                  <div className="text-xl font-bold text-white">{emailCounts.sent} emails</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="text-sm text-slate-400">Total Communications</div>
                  <div className="text-xl font-bold text-white">{emailCounts.total} emails</div>
                </CardContent>
              </Card>
            </div>

            {emailCounts.recent > 0 && (
              <div className="text-sm text-cyan-400 bg-cyan-900/20 px-3 py-1 rounded-md border border-cyan-500/30 mb-4">
                {emailCounts.recent} email{emailCounts.recent > 1 ? 's' : ''} received in last hour
              </div>
            )}

            {/* Email List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading emails...</div>
                ) : filteredAndSortedEmails.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Mail className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>No emails found</p>
                  </div>
                ) : (
                  filteredAndSortedEmails.map((email: Email) => (
                    <Card
                      key={email.id}
                      className={`cursor-pointer transition-all duration-200 border-slate-700 hover:border-blue-500/50 ${
                        selectedEmail?.id === email.id ? 'bg-blue-500/10 border-blue-500/50' : 'bg-slate-800/30'
                      }`}
                      onClick={() => handleEmailClick(email)}
                      data-testid={`email-card-${email.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(email.emailType)}
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                              {email.emailType}
                            </span>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(email.priority)}`} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(email.deliveryStatus || email.status || 'unknown')}>
                              {email.deliveryStatus || email.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {email.sentAt ? formatDistanceToNow(new Date(email.sentAt), { addSuffix: true }) : 
                               email.timestamp ? formatDistanceToNow(new Date(email.timestamp), { addSuffix: true }) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            To: {email.toEmail || email.recipient}
                          </div>
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {email.subject}
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {(email.body || email.content || '').substring(0, 120)}...
                        </div>
                        
                        {email.attachments && email.attachments.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Paperclip className="w-3 h-3" />
                            <span>{email.attachments.length} attachment(s)</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

        {/* Email Detail Panel */}
        <div className="w-1/2 flex flex-col">
          {selectedEmail ? (
            <>
              <div className="border-b border-slate-700 p-6 bg-slate-800/50">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{selectedEmail.subject}</h3>
                    <div className="space-y-1 text-sm text-slate-300">
                      <div>From: <span className="text-white">{selectedEmail.sender}</span></div>
                      <div>To: <span className="text-white">{selectedEmail.recipient}</span></div>
                      <div>Sent: <span className="text-white">{selectedEmail.timestamp ? new Date(selectedEmail.timestamp).toLocaleString() : new Date(selectedEmail.sentAt).toLocaleString()}</span></div>
                      {selectedEmail.brokerName && (
                        <div>Broker: <span className="text-white">{selectedEmail.brokerName}</span></div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(selectedEmail.status)}
                    {selectedEmail.policyNumber && (
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        {selectedEmail.policyNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                  <h4 className="font-medium text-white mb-3">Email Content</h4>
                  <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedEmail.content || "Email content will be displayed here..."}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Mail className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Select an Email</h3>
                <p className="text-sm">Choose an email from the list to view its details</p>
              </div>
            </div>
          )}
        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

