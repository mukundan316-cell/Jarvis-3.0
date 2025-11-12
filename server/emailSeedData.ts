import { storage } from "./storage";

export async function seedPersonaEmails(userId: string) {
  console.log('Seeding contextual email data for all personas...');

  // Rachel (AUW) - Insurance underwriting emails  
  const rachelEmails = [
    // BROKER SUBMISSION EMAILS WITH ACTUAL SUBMISSION DOCKETS
    {
      messageId: `broker-submission-${Date.now() - 900000}-acord125`,
      userId,
      persona: 'rachel',
      toEmail: 'rachel.thompson@hexaware.com',
      fromEmail: 'mike.stevens@statelinebrokers.com',
      subject: 'New Submission - Riverside Manufacturing Complex - ACORD 125 Attached',
      body: `Dear Rachel,

Please find attached our new commercial property submission for Riverside Manufacturing Complex.

SUBMISSION DETAILS:
• Insured: Riverside Manufacturing LLC
• Property Address: 2847 Industrial Park Blvd, Riverside, CA 92503
• Building Type: Manufacturing facility with office space
• Total Insured Value: $12,500,000
• Line of Business: Commercial Property
• Effective Date: 01/01/2025
• Policy Term: 12 months

ATTACHMENTS:
• ACORD 125 Commercial Property Application (completed)
• Statement of Values (SOV) - Excel format
• Loss Runs - Last 5 years
• Property Photos and Site Plan
• Financial Statements (2023-2024)

Key Features:
- 150,000 sq ft manufacturing facility built in 2015
- Sprinkler system throughout
- 24/7 security monitoring
- Clean loss history
- Seeking $2M property limit + $1M business income

Please let me know if you need any additional information for the underwriting process.

Best regards,
Mike Stevens
Commercial Lines Broker
Stateline Insurance Brokers
Direct: (555) 123-4567
mike.stevens@statelinebrokers.com`,
      emailType: 'submission',
      priority: 'high',
      deliveryStatus: 'received',
      brokerInfo: { name: 'Stateline Insurance Brokers', contact: 'mike.stevens@statelinebrokers.com' },
      attachments: [
        { filename: 'ACORD_125_Riverside_Manufacturing.pdf', size: '2.3 MB', type: 'ACORD 125' },
        { filename: 'SOV_Riverside_Manufacturing.xlsx', size: '850 KB', type: 'Statement of Values' },
        { filename: 'Loss_Runs_2019_2024.pdf', size: '1.2 MB', type: 'Loss History' },
        { filename: 'Property_Photos.zip', size: '15.7 MB', type: 'Property Images' },
        { filename: 'Financial_Statements_2024.pdf', size: '3.4 MB', type: 'Financial' }
      ],
      receivedAt: new Date(Date.now() - 900000), // 15 mins ago
      hasSubmissionData: true,
      submissionCategory: 'commercial-property',
      lineOfBusiness: 'Commercial Property',
      insuredName: 'Riverside Manufacturing LLC',
      coverageRequested: ['Property', 'Business Income', 'Equipment Breakdown'],
      totalInsuredValue: 12500000,
      brokerAccount: 'premium-tier',
      workflowContext: 'New commercial property submission with ACORD 125 and complete submission docket'
    },
    {
      messageId: `broker-submission-${Date.now() - 2700000}-acord140`,
      userId,
      persona: 'rachel',
      toEmail: 'rachel.thompson@hexaware.com',
      fromEmail: 'sarah.martinez@coastalbrokers.com',
      subject: 'Urgent - Warehouse Complex Renewal with ACORD 140 - Expires 12/31',
      body: `Rachel,

Attached please find the renewal submission for Pacific Coast Warehouse Complex. This is time-sensitive as current policy expires 12/31/2024.

RENEWAL SUBMISSION:
• Insured: Pacific Coast Distribution Inc
• Location: 5590 Port Authority Drive, Long Beach, CA 90802  
• Property Type: Distribution warehouse with cold storage
• Current TIV: $18,750,000
• Renewal Date: 01/01/2025

CHANGES FROM EXPIRING:
- Added new 50,000 sq ft cold storage facility
- Upgraded fire suppression to ESFR sprinkler system
- Increased security with thermal detection cameras
- Updated SOV with new building values

DOCUMENTS ATTACHED:
• ACORD 140 Property Section Supplement (completed)
• Updated Statement of Values with new construction
• Engineering report on sprinkler upgrade
• Loss runs showing zero claims in past 5 years
• Updated appraisals for all buildings

This account has been with us for 8 years and maintains excellent loss experience. Current carrier is non-renewing due to portfolio changes.

Looking for competitive terms on this clean account. Please advise on appetite and pricing indication.

Thanks,
Sarah Martinez  
Senior Commercial Producer
Coastal Insurance Brokers
sarah.martinez@coastalbrokers.com
(562) 555-0199`,
      emailType: 'renewal',
      priority: 'urgent',
      deliveryStatus: 'received',
      brokerInfo: { name: 'Coastal Insurance Brokers', contact: 'sarah.martinez@coastalbrokers.com' },
      attachments: [
        { filename: 'ACORD_140_Pacific_Coast_Warehouse.pdf', size: '1.8 MB', type: 'ACORD 140' },
        { filename: 'SOV_Pacific_Coast_Updated_2024.csv', size: '125 KB', type: 'Statement of Values' },
        { filename: 'Engineering_Report_Sprinkler_Upgrade.pdf', size: '4.2 MB', type: 'Engineering' },
        { filename: 'Loss_Runs_Clean_5_Year.pdf', size: '980 KB', type: 'Loss History' },
        { filename: 'Property_Appraisals_2024.pdf', size: '6.1 MB', type: 'Appraisal' }
      ],
      receivedAt: new Date(Date.now() - 2700000), // 45 mins ago
      hasSubmissionData: true,
      submissionCategory: 'commercial-property',
      lineOfBusiness: 'Commercial Property',
      insuredName: 'Pacific Coast Distribution Inc',
      coverageRequested: ['Property', 'Business Income', 'Spoilage'],
      totalInsuredValue: 18750000,
      brokerAccount: 'premium-tier',
      workflowContext: 'Time-sensitive warehouse complex renewal with ACORD 140 and complete submission package'
    },
    {
      messageId: `email-${Date.now() - 7200000}-rachel-1`,
      userId,
      persona: 'rachel',
      toEmail: 'sarah@aombrokers.com',
      fromEmail: 'rachel.thompson@hexaware.com',
      subject: 'Policy Quote Approval - Commercial Property Insurance',
      body: `Dear Sarah,

I'm pleased to confirm that the commercial property insurance quote for your client Mr. Anderson has been approved with the following terms:

Policy Details:
• Property Value: £850,000
• Annual Premium: £3,247
• Coverage: Comprehensive commercial property
• Policy Period: 12 months from policy inception
• Deductible: £2,500

The quote is valid for 30 days. Please submit the signed application and first premium payment to bind coverage.

Best regards,
Rachel Thompson
Assistant Underwriter`,
      emailType: 'quote',
      priority: 'normal',
      deliveryStatus: 'delivered',
      brokerInfo: { name: 'AOM Brokers', contact: 'sarah@aombrokers.com' },
      workflowContext: 'Commercial property quote approval for Mr. Anderson',
      sentAt: new Date(Date.now() - 7200000), // 2 hours ago
      deliveredAt: new Date(Date.now() - 7140000)
    },
    {
      messageId: `email-${Date.now() - 14400000}-rachel-2`,
      userId,
      persona: 'rachel',
      toEmail: 'mark@wtkbrokers.com',
      fromEmail: 'rachel.thompson@hexaware.com',
      subject: 'Documentation Required - High Value Residence Policy',
      body: `Dear Mark,

Following our review of the high value residence application for Mrs. Peterson, we require additional documentation before proceeding:

Required Documents:
• Updated property appraisal (within last 12 months)
• Security system certification
• Prior claims history (last 5 years)
• Proof of residence occupancy

Please provide these documents within 10 business days to avoid policy processing delays.

Best regards,
Rachel Thompson`,
      emailType: 'documentation',
      priority: 'high',
      deliveryStatus: 'read',
      brokerInfo: { name: 'WTK Brokers', contact: 'mark@wtkbrokers.com' },
      workflowContext: 'High value residence documentation request',
      sentAt: new Date(Date.now() - 14400000), // 4 hours ago
      deliveredAt: new Date(Date.now() - 14340000),
      openedAt: new Date(Date.now() - 13800000)
    },
    {
      messageId: `email-${Date.now() - 21600000}-rachel-3`,
      userId,
      persona: 'rachel',
      toEmail: 'claims@processingcenter.com',
      fromEmail: 'rachel.thompson@hexaware.com',
      subject: 'Claims Analysis - Policy REF: HEX-2024-8847',
      body: `Claims Processing Team,

Please find attached the comprehensive claims analysis for policy REF: HEX-2024-8847:

Analysis Summary:
• Incident Type: Water damage - burst pipe
• Estimated Loss: £15,750
• Coverage Verification: Confirmed under standard perils
• Recommendation: Approve claim with standard deductible
• Settlement Authority: Up to policy limits

The analysis documents support immediate claim approval. Please proceed with settlement.

Rachel Thompson
Assistant Underwriter`,
      emailType: 'claims',
      priority: 'urgent',
      deliveryStatus: 'replied',
      workflowContext: 'Claims analysis approval for water damage incident',
      sentAt: new Date(Date.now() - 21600000), // 6 hours ago
      deliveredAt: new Date(Date.now() - 21540000),
      repliedAt: new Date(Date.now() - 20400000)
    }
  ];

  // John (IT Support) - Technical support and system emails
  const johnEmails = [
    {
      messageId: `email-${Date.now() - 10800000}-john-1`,
      userId,
      persona: 'john',
      toEmail: 'it-team@hexaware.com',
      fromEmail: 'john.stevens@hexaware.com',
      subject: 'Scheduled Maintenance Completion - Database Cluster',
      body: `IT Team,

The scheduled maintenance on our primary database cluster has been completed successfully:

Maintenance Summary:
• Start Time: 02:00 AM EST
• Completion: 05:30 AM EST
• Systems Affected: PostgreSQL cluster, backup systems
• Downtime: Zero (rolling maintenance)
• Performance Improvement: 15% query optimization achieved

All systems are now operational with enhanced performance. Monitor for 24 hours post-maintenance.

John Stevens
IT Support Specialist`,
      emailType: 'custom',
      priority: 'normal',
      deliveryStatus: 'delivered',
      incidentId: 'MAINT-2024-1205',
      workflowContext: 'Database maintenance completion notification',
      sentAt: new Date(Date.now() - 10800000), // 3 hours ago
      deliveredAt: new Date(Date.now() - 10740000)
    },
    {
      messageId: `email-${Date.now() - 18000000}-john-2`,
      userId,
      persona: 'john',
      toEmail: 'security-team@hexaware.com',
      fromEmail: 'john.stevens@hexaware.com',
      subject: 'URGENT: Security Patch Deployment Required',
      body: `Security Team,

Critical security patches require immediate deployment across all production systems:

Patch Details:
• CVE-2024-8932: Database authentication bypass
• Severity: Critical (CVSS 9.1)
• Affected Systems: All PostgreSQL instances
• Estimated Deployment Time: 2 hours
• Required Downtime: 15 minutes per cluster

Please coordinate maintenance window with operations team. Patches must be applied within 24 hours.

John Stevens
IT Support Specialist`,
      emailType: 'custom',
      priority: 'urgent',
      deliveryStatus: 'read',
      incidentId: 'SEC-2024-0089',
      workflowContext: 'Critical security patch deployment notification',
      sentAt: new Date(Date.now() - 18000000), // 5 hours ago
      deliveredAt: new Date(Date.now() - 17940000),
      openedAt: new Date(Date.now() - 17400000)
    },
    {
      messageId: `email-${Date.now() - 25200000}-john-3`,
      userId,
      persona: 'john',
      toEmail: 'helpdesk@hexaware.com',
      fromEmail: 'john.stevens@hexaware.com',
      subject: 'Incident Resolution - Network Connectivity Issues',
      body: `Help Desk Team,

The network connectivity issues reported this morning have been resolved:

Incident Summary:
• Issue: Intermittent VPN connection failures
• Root Cause: DNS server configuration conflict
• Resolution: Updated DNS priority settings
• Affected Users: 47 remote workers
• Downtime: 2 hours 15 minutes

All VPN connections are now stable. Please update incident ticket #INC-2024-5534 as resolved.

John Stevens`,
      emailType: 'custom',
      priority: 'normal',
      deliveryStatus: 'delivered',
      incidentId: 'INC-2024-5534',
      workflowContext: 'Network incident resolution notification',
      sentAt: new Date(Date.now() - 25200000), // 7 hours ago
      deliveredAt: new Date(Date.now() - 25140000)
    }
  ];

  // Admin - System administration and oversight emails
  const adminEmails = [
    {
      messageId: `email-${Date.now() - 12600000}-admin-1`,
      userId,
      persona: 'admin',
      toEmail: 'executive-team@hexaware.com',
      fromEmail: 'jarvis.admin@hexaware.com',
      subject: 'Monthly System Performance Report - November 2024',
      body: `Executive Team,

Please find the comprehensive system performance report for November 2024:

Key Performance Indicators:
• System Uptime: 99.97% (exceeds SLA)
• Processing Throughput: 15,847 transactions/hour
• Average Response Time: 185ms
• Agent Efficiency: 94.3% success rate
• Security Incidents: 0 critical, 3 resolved minor

Notable Achievements:
• Completed database optimization project
• Deployed 12 security patches without downtime
• Reduced processing time by 23% through AI optimization

Detailed metrics and analysis are attached.

JARVIS IntelliAgent System`,
      emailType: 'custom',
      priority: 'normal',
      deliveryStatus: 'read',
      workflowContext: 'Monthly system performance reporting',
      sentAt: new Date(Date.now() - 12600000), // 3.5 hours ago
      deliveredAt: new Date(Date.now() - 12540000),
      openedAt: new Date(Date.now() - 11400000)
    },
    {
      messageId: `email-${Date.now() - 19800000}-admin-2`,
      userId,
      persona: 'admin',
      toEmail: 'compliance@hexaware.com',
      fromEmail: 'jarvis.admin@hexaware.com',
      subject: 'Automated Compliance Audit Results - Q4 2024',
      body: `Compliance Department,

The automated quarterly compliance audit has completed with the following results:

Audit Summary:
• Total Policies Reviewed: 8,947
• Compliance Rate: 98.7%
• Non-compliance Issues: 23 (all minor)
• Regulatory Requirements: 100% met
• Data Protection Standards: Fully compliant

Recommended Actions:
• Review 23 flagged policies for minor documentation updates
• Implement enhanced broker communication templates
• Schedule follow-up audit in 30 days

Full audit report and remediation recommendations are attached.

JARVIS Compliance Monitor`,
      emailType: 'custom',
      priority: 'high',
      deliveryStatus: 'delivered',
      workflowContext: 'Quarterly compliance audit results',
      sentAt: new Date(Date.now() - 19800000), // 5.5 hours ago
      deliveredAt: new Date(Date.now() - 19740000)
    },
    {
      messageId: `email-${Date.now() - 28800000}-admin-3`,
      userId,
      persona: 'admin',
      toEmail: 'operations@hexaware.com',
      fromEmail: 'jarvis.admin@hexaware.com',
      subject: 'Agent Deployment Success - New AUW Processing Capabilities',
      body: `Operations Team,

The deployment of enhanced AUW processing capabilities has completed successfully:

Deployment Details:
• New Agent: Advanced Risk Assessment Agent v2.3
• Capabilities: Enhanced fraud detection, automated policy pricing
• Integration: Seamless with existing underwriting workflows
• Testing: Passed all 847 validation scenarios
• Performance: 35% improvement in processing speed

The new capabilities are now live for Rachel's AUW workflows. Monitor performance metrics for the next 48 hours.

JARVIS System Administrator`,
      emailType: 'custom',
      priority: 'normal',
      deliveryStatus: 'delivered',
      workflowContext: 'Agent deployment notification',
      sentAt: new Date(Date.now() - 28800000), // 8 hours ago
      deliveredAt: new Date(Date.now() - 28740000)
    }
  ];

  // Create all emails in the database
  try {
    for (const emailData of [...rachelEmails, ...johnEmails, ...adminEmails]) {
      await storage.createEmail(emailData);
    }
    console.log(`Successfully seeded ${rachelEmails.length + johnEmails.length + adminEmails.length} contextual emails for all personas`);
  } catch (error) {
    console.error('Error seeding email data:', error);
  }
}