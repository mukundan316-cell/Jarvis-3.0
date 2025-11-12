import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  Send, 
  FileText, 
  Shield, 
  Calculator, 
  MessageCircle, 
  Paperclip, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Edit,
  User,
  Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EmailTemplate {
  id: number;
  templateId: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  requiredFields: string[];
  personas: string[];
}

interface EmailAgentExecutionPopupProps {
  isVisible: boolean;
  onClose: () => void;
  currentPersona: string;
  workflowContext?: any;
  submissionData?: any;
  incidentData?: any;
}

export function EmailAgentExecutionPopup({
  isVisible,
  onClose,
  currentPersona,
  workflowContext,
  submissionData,
  incidentData
}: EmailAgentExecutionPopupProps) {
  const [step, setStep] = useState<'template' | 'compose' | 'review' | 'sending' | 'sent'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [emailData, setEmailData] = useState({
    toEmail: '',
    subject: '',
    body: '',
    emailType: 'custom',
    priority: 'normal',
    brokerInfo: {},
    attachments: []
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Predefined email templates for different personas and contexts
  const emailTemplates: EmailTemplate[] = [
    {
      id: 1,
      templateId: 'doc-request-001',
      name: 'Documentation Request',
      type: 'documentation',
      subject: 'Additional Documentation Required - Policy Application {{REFERENCE_NUMBER}}',
      content: `Dear {{BROKER_NAME}},

I hope this email finds you well. I am writing regarding the recent policy application submitted to our underwriting department for {{PROPERTY_ADDRESS}}.

After conducting our initial review, we require the following additional documentation to proceed with the underwriting assessment:

{{MISSING_DOCUMENTS_LIST}}

Please provide these documents at your earliest convenience to avoid any delays in processing. Our underwriting team is ready to expedite the review once we receive the complete documentation.

Timeline for submission: {{DEADLINE_DATE}}

If you have any questions or need clarification on any of the requested documents, please don't hesitate to contact me directly.

Thank you for your continued partnership.

Best regards,
{{UNDERWRITER_NAME}}
{{TITLE}}
{{COMPANY_NAME}}
Automated via JARVIS® META BRAIN`,
      requiredFields: ['BROKER_NAME', 'PROPERTY_ADDRESS', 'MISSING_DOCUMENTS_LIST', 'DEADLINE_DATE'],
      personas: ['rachel', 'admin']
    },
    {
      id: 2,
      templateId: 'quote-001',
      name: 'Quote Generation',
      type: 'quote',
      subject: 'Commercial Property Insurance Quote - {{QUOTE_REFERENCE}}',
      content: `Dear {{BROKER_NAME}},

Thank you for your commercial property insurance inquiry. I am pleased to provide you with a competitive quote for your client's property at {{PROPERTY_ADDRESS}}.

QUOTE DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Quote Reference: {{QUOTE_REFERENCE}}
Annual Premium: {{ANNUAL_PREMIUM}}
Coverage Period: {{COVERAGE_PERIOD}}
Property Value: {{PROPERTY_VALUE}}
Policy Type: {{POLICY_TYPE}}
Effective Date: {{EFFECTIVE_DATE}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COVERAGE HIGHLIGHTS:
{{COVERAGE_DETAILS}}

This quote includes comprehensive coverage with competitive terms based on our detailed risk assessment.

IMPORTANT NOTES:
• Quote validity: 30 days from issue date
• Premium payment terms: {{PAYMENT_TERMS}}
• Policy inception subject to final underwriting approval

We look forward to providing coverage for your client.

Best regards,
{{UNDERWRITER_NAME}}
{{TITLE}}
{{COMPANY_NAME}}

Powered by JARVIS® META BRAIN Intelligent Underwriting`,
      requiredFields: ['BROKER_NAME', 'PROPERTY_ADDRESS', 'QUOTE_REFERENCE', 'ANNUAL_PREMIUM'],
      personas: ['rachel', 'admin']
    },
    {
      id: 3,
      templateId: 'incident-001',
      name: 'System Incident Report',
      type: 'incident',
      subject: 'System Incident Report - {{INCIDENT_ID}}',
      content: `Dear {{RECIPIENT_NAME}},

This is an automated notification regarding a system incident that has been detected and is currently being addressed.

INCIDENT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Incident ID: {{INCIDENT_ID}}
Severity: {{SEVERITY}}
System Affected: {{AFFECTED_SYSTEM}}
Detected At: {{DETECTION_TIME}}
Current Status: {{CURRENT_STATUS}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DESCRIPTION:
{{INCIDENT_DESCRIPTION}}

IMPACT ASSESSMENT:
{{IMPACT_ASSESSMENT}}

NEXT STEPS:
{{NEXT_STEPS}}

Our IT team is actively working to resolve this issue. We will provide updates as the situation develops.

Best regards,
{{IT_SUPPORT_NAME}}
IT Support Team
{{COMPANY_NAME}}

Automated via JARVIS® META BRAIN System Monitoring`,
      requiredFields: ['INCIDENT_ID', 'SEVERITY', 'AFFECTED_SYSTEM', 'DETECTION_TIME'],
      personas: ['john', 'admin']
    },
    {
      id: 4,
      templateId: 'followup-001',
      name: 'Follow-up Communication',
      type: 'followup',
      subject: 'Follow-up: {{SUBJECT_REFERENCE}}',
      content: `Dear {{RECIPIENT_NAME}},

I hope this email finds you well. I am following up on {{FOLLOWUP_SUBJECT}} to ensure we are meeting your expectations and addressing any outstanding items.

{{FOLLOWUP_CONTENT}}

Please let me know if you have any questions or if there is anything else I can assist you with.

Thank you for your continued partnership.

Best regards,
{{SENDER_NAME}}
{{SENDER_TITLE}}
{{COMPANY_NAME}}

Automated via JARVIS® META BRAIN`,
      requiredFields: ['RECIPIENT_NAME', 'FOLLOWUP_SUBJECT', 'FOLLOWUP_CONTENT'],
      personas: ['admin', 'rachel', 'john']
    }
  ];

  const sendEmailMutation = useMutation({
    mutationFn: async (emailPayload: any) => {
      return apiRequest('/api/emails', 'POST', emailPayload);
    },
    onSuccess: () => {
      setStep('sent');
      queryClient.invalidateQueries({ queryKey: ['/api/emails'] });
      toast({
        title: "Email Sent Successfully",
        description: "Your email has been sent and saved to the inbox.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Send Email",
        description: "There was an error sending your email. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleTemplateSelect = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      body: template.content,
      emailType: template.type
    }));
    setStep('compose');
  };

  const populateTemplate = () => {
    setIsGenerating(true);
    
    // Simulate template population with context data
    setTimeout(() => {
      let populatedSubject = emailData.subject;
      let populatedBody = emailData.body;
      
      // Replace placeholders with actual data based on context
      const replacements: Record<string, string> = {
        '{{BROKER_NAME}}': submissionData?.brokerName || 'Valued Partner',
        '{{PROPERTY_ADDRESS}}': submissionData?.propertyAddress || 'Property Location',
        '{{REFERENCE_NUMBER}}': submissionData?.referenceNumber || `REF-${Date.now()}`,
        '{{QUOTE_REFERENCE}}': submissionData?.quoteReference || `QT-${Date.now()}`,
        '{{MISSING_DOCUMENTS_LIST}}': submissionData?.missingDocuments?.join('\n• ') || '• Prior policy documents\n• Valid identity cards',
        '{{DEADLINE_DATE}}': new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        '{{UNDERWRITER_NAME}}': currentPersona === 'rachel' ? 'Rachel Thompson' : 'JARVIS System',
        '{{TITLE}}': currentPersona === 'rachel' ? 'Senior Assistant Underwriter' : 'System Administrator',
        '{{COMPANY_NAME}}': 'Hexaware Insurance',
        '{{ANNUAL_PREMIUM}}': submissionData?.annualPremium || '£2,469',
        '{{PROPERTY_VALUE}}': submissionData?.propertyValue || '£378,000',
        '{{INCIDENT_ID}}': incidentData?.incidentId || `INC-${Date.now()}`,
        '{{SEVERITY}}': incidentData?.severity || 'Medium',
        '{{AFFECTED_SYSTEM}}': incidentData?.affectedSystem || 'Core Processing System',
        '{{DETECTION_TIME}}': new Date().toLocaleString(),
        '{{IT_SUPPORT_NAME}}': currentPersona === 'john' ? 'John Stevens' : 'IT Support Team'
      };

      Object.entries(replacements).forEach(([placeholder, value]) => {
        populatedSubject = populatedSubject.replace(new RegExp(placeholder, 'g'), value);
        populatedBody = populatedBody.replace(new RegExp(placeholder, 'g'), value);
      });

      setEmailData(prev => ({
        ...prev,
        subject: populatedSubject,
        body: populatedBody,
        brokerInfo: submissionData || incidentData || {}
      }));
      
      setIsGenerating(false);
      setStep('review');
    }, 2000);
  };

  const handleSendEmail = () => {
    setStep('sending');
    
    const emailPayload = {
      ...emailData,
      submissionId: submissionData?.id,
      incidentId: incidentData?.id,
      workflowContext: JSON.stringify(workflowContext || {})
    };

    sendEmailMutation.mutate(emailPayload);
  };

  const resetForm = () => {
    setStep('template');
    setSelectedTemplate(null);
    setEmailData({
      toEmail: '',
      subject: '',
      body: '',
      emailType: 'custom',
      priority: 'normal',
      brokerInfo: {},
      attachments: []
    });
  };

  const getPersonaTemplates = () => {
    return emailTemplates.filter(template => 
      template.personas.includes(currentPersona) || template.personas.includes('admin')
    );
  };

  if (!isVisible) return null;

  return (
    <Dialog open={isVisible} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Generator Agent - {currentPersona.charAt(0).toUpperCase() + currentPersona.slice(1)} Persona
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[75vh]">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {step === 'template' && (
                <motion.div
                  key="template"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Select Email Template</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Choose a template or create a custom email for your {currentPersona} workflow.
                    </p>
                  </div>
                  
                  <ScrollArea className="h-[60vh]">
                    <div className="grid gap-3">
                      {getPersonaTemplates().map((template) => (
                        <Card
                          key={template.id}
                          className="cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => handleTemplateSelect(template)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {template.type === 'documentation' && <FileText className="w-4 h-4" />}
                                  {template.type === 'quote' && <Calculator className="w-4 h-4" />}
                                  {template.type === 'incident' && <Shield className="w-4 h-4" />}
                                  {template.type === 'followup' && <MessageCircle className="w-4 h-4" />}
                                  <span className="font-medium">{template.name}</span>
                                  <Badge variant="outline">{template.type}</Badge>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  {template.subject}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Required: {template.requiredFields.slice(0, 3).join(', ')}
                                  {template.requiredFields.length > 3 && '...'}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      <Card
                        className="cursor-pointer hover:border-blue-500 transition-colors border-dashed"
                        onClick={() => {
                          setEmailData(prev => ({ ...prev, emailType: 'custom' }));
                          setStep('compose');
                        }}
                      >
                        <CardContent className="p-4 text-center">
                          <Edit className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                          <span className="font-medium">Create Custom Email</span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Start with a blank template
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>
                </motion.div>
              )}

              {step === 'compose' && (
                <motion.div
                  key="compose"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Compose Email</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTemplate ? 'Customize your selected template' : 'Create your custom email'}
                    </p>
                  </div>

                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-4 pr-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="toEmail">To Email *</Label>
                          <Input
                            id="toEmail"
                            value={emailData.toEmail}
                            onChange={(e) => setEmailData(prev => ({ ...prev, toEmail: e.target.value }))}
                            placeholder="recipient@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="priority">Priority</Label>
                          <Select value={emailData.priority} onValueChange={(value) => setEmailData(prev => ({ ...prev, priority: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="subject">Subject *</Label>
                        <Input
                          id="subject"
                          value={emailData.subject}
                          onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                          placeholder="Email subject line"
                        />
                      </div>

                      <div>
                        <Label htmlFor="body">Email Content *</Label>
                        <Textarea
                          id="body"
                          value={emailData.body}
                          onChange={(e) => setEmailData(prev => ({ ...prev, body: e.target.value }))}
                          placeholder="Email content..."
                          rows={12}
                          className="resize-none"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button onClick={() => setStep('template')} variant="outline">
                          Back to Templates
                        </Button>
                        {selectedTemplate && (
                          <Button onClick={populateTemplate} disabled={isGenerating}>
                            {isGenerating ? 'Generating...' : 'Populate with Data'}
                          </Button>
                        )}
                        <Button 
                          onClick={() => setStep('review')}
                          disabled={!emailData.toEmail || !emailData.subject || !emailData.body}
                        >
                          Preview Email
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </motion.div>
              )}

              {step === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">Review Email</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Review your email before sending
                    </p>
                  </div>

                  <ScrollArea className="h-[55vh]">
                    <div className="space-y-4 pr-4">
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">To: {emailData.toEmail}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">From: {currentPersona}@hexaware-insurance.com</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">Priority: {emailData.priority}</div>
                            </div>
                            <Badge>{emailData.emailType}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <strong>Subject:</strong> {emailData.subject}
                          </div>
                          <Separator className="my-4" />
                          <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-lg">
                            <pre className="whitespace-pre-wrap text-sm">{emailData.body}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Button onClick={() => setStep('compose')} variant="outline">
                      Edit Email
                    </Button>
                    <Button onClick={handleSendEmail} className="flex items-center gap-2">
                      <Send className="w-4 h-4" />
                      Send Email
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'sending' && (
                <motion.div
                  key="sending"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-[60vh]"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                  >
                    <Mail className="w-12 h-12 text-blue-500" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">Sending Email...</h3>
                  <p className="text-gray-600 dark:text-gray-400">Your email is being processed and sent</p>
                </motion.div>
              )}

              {step === 'sent' && (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center h-[60vh]"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Email Sent Successfully!</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                    Your email has been sent to {emailData.toEmail} and saved to your inbox.
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={resetForm} variant="outline">
                      Send Another Email
                    </Button>
                    <Button onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}