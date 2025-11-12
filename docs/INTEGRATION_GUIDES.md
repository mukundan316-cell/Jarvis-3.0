# JARVIS IntelliAgent 3.0 - Integration Setup Guides

Complete setup and configuration guides for all external service integrations.

## Table of Contents
1. [GitHub OAuth](#github-oauth)
2. [SendGrid Email](#sendgrid-email)
3. [OpenAI](#openai)
4. [Google Analytics](#google-analytics)
5. [PostgreSQL Database](#postgresql-database)

---

## GitHub OAuth

### Overview
JARVIS uses GitHub OAuth 2.0 for user authentication with dynamic callback URL support.

### Prerequisites
- GitHub account
- Application domain (Replit URL or custom domain)

### Step 1: Create GitHub OAuth App

1. **Navigate to GitHub Developer Settings**
   - Go to https://github.com/settings/developers
   - Click "OAuth Apps" in left sidebar
   - Click "New OAuth App"

2. **Configure OAuth Application**
   ```
   Application name: JARVIS IntelliAgent 3.0
   Homepage URL: https://your-app-domain.com
   Application description: AI-powered insurance automation platform
   Authorization callback URL: https://your-app-domain.com/api/callback
   ```

3. **Save and Generate Credentials**
   - Click "Register application"
   - Note the **Client ID** (public)
   - Click "Generate a new client secret"
   - Copy the **Client Secret** (shown once)

### Step 2: Configure Replit Secrets

Add to Replit Secrets or `.env`:
```env
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
```

### Step 3: Update Callback URL for Different Environments

**Development (Replit)**:
```
https://<repl-name>.<username>.repl.co/api/callback
```

**Production (Custom Domain)**:
```
https://jarvis.yourdomain.com/api/callback
```

**Update in GitHub OAuth App**:
- Go back to your OAuth app settings
- Update "Authorization callback URL"
- Click "Update application"

### Step 4: Verify Configuration

**Test Authentication Flow**:
1. Start your application
2. Navigate to your app URL
3. Click "Login with GitHub"
4. Should redirect to GitHub authorization page
5. Click "Authorize"
6. Should redirect back to your app (logged in)

**Check Backend Logs**:
```bash
# Should see successful authentication logs
[AUTH] GitHub OAuth callback received
[AUTH] User authenticated: github_user_id
[AUTH] Session created: session_id
```

**Verify Session**:
```bash
# Check session in database
psql $DATABASE_URL -c "SELECT * FROM sessions WHERE sess->>'passport'->>'user' IS NOT NULL;"
```

### Troubleshooting

**Error: "redirect_uri_mismatch"**
- Callback URL in GitHub app doesn't match your application
- Check exact URL (no trailing slash)
- Update GitHub OAuth app settings

**Error: "Invalid client"**
- GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET incorrect
- Verify secrets in Replit Secrets
- Regenerate client secret if needed

**Error: "Unauthorized" after successful GitHub login**
- SESSION_SECRET not set or changed
- Database connection issue
- Check `sessions` table exists

### Dynamic Callback URL Implementation

JARVIS uses dynamic callback URLs that work across domains:

```typescript
// server/replitAuth.ts
passport.use(new GitHubStrategy({
  clientID: GITHUB_CLIENT_ID,
  clientSecret: GITHUB_CLIENT_SECRET,
  callbackURL: function(req) {
    // Dynamic callback based on request
    return `${req.protocol}://${req.get('host')}/api/callback`;
  }
}, async (accessToken, refreshToken, profile, done) => {
  // User authentication logic
}));
```

This allows the same OAuth app to work on:
- Replit dev domains
- Replit published apps
- Custom domains
- Local development

---

## SendGrid Email

### Overview
SendGrid provides transactional email delivery for notifications, submissions, and communications.

### Prerequisites
- SendGrid account (free tier available)
- Verified sender email address

### Step 1: Create SendGrid Account

1. **Sign Up**
   - Go to https://signup.sendgrid.com
   - Create account (free tier: 100 emails/day)

2. **Verify Sender Email**
   - Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Enter your email address
   - Check email and verify

### Step 2: Create API Key

1. **Generate API Key**
   - Settings → API Keys
   - Click "Create API Key"
   - Name: "JARVIS IntelliAgent"
   - Permissions: "Full Access" (or "Mail Send" only)
   - Click "Create & View"

2. **Copy API Key**
   ```
   SG.abcdefg123456789.1234567890abcdefghijklmnopqrstuvwxyz
   ```
   **Important**: Copy immediately, won't be shown again

### Step 3: Configure Application

Add to Replit Secrets or `.env`:
```env
SENDGRID_API_KEY=SG.abcdefg123456789.1234567890abcdefghijklmnopqrstuvwxyz
```

### Step 4: Test Email Sending

**Backend Implementation** (already in codebase):
```typescript
// server/services/emailService.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) {
  const msg = {
    to: options.to,
    from: options.from || 'noreply@jarvis-intelliagent.com',
    subject: options.subject,
    html: options.html
  };
  
  await sgMail.send(msg);
}
```

**Test Email**:
```bash
# Via Replit Shell
node -e "
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMail.send({
    to: 'your-email@example.com',
    from: 'noreply@jarvis-intelliagent.com',
    subject: 'JARVIS Test Email',
    html: '<p>Test email from JARVIS</p>'
  }).then(() => console.log('Email sent!')).catch(console.error);
"
```

### Step 5: Configure Email Templates

**Using ConfigService** (recommended):
```typescript
// Store email templates in config_values
await configService.setSetting('demo.email-templates', {
  submission_received: {
    subject: 'Submission Received',
    template: '<h1>Thank you!</h1><p>We received your submission.</p>'
  },
  workflow_completed: {
    subject: 'Workflow Completed',
    template: '<h1>Success!</h1><p>Your workflow is complete.</p>'
  }
});
```

### Email Use Cases

**1. Submission Notifications**
```typescript
await sendEmail({
  to: broker.email,
  subject: 'Submission Received',
  html: `<p>Your submission ${submissionId} has been received.</p>`
});
```

**2. Workflow Updates**
```typescript
await sendEmail({
  to: user.email,
  subject: 'Commercial Property Quote Ready',
  html: renderQuoteEmail(quoteData)
});
```

**3. Agent Notifications**
```typescript
await sendEmail({
  to: 'rachel@insurance-company.com',
  subject: 'High-Risk Submission Requires Review',
  html: renderAlertEmail(submission)
});
```

### Troubleshooting

**Error: "Invalid API key"**
- Check SENDGRID_API_KEY is correct
- Verify not expired or revoked
- Regenerate if needed

**Error: "Sender email not verified"**
- Must verify sender email in SendGrid
- Go to Sender Authentication → Verify

**Error: "Rate limit exceeded"**
- Free tier: 100 emails/day
- Upgrade plan or wait 24 hours

**Emails not received**:
- Check spam folder
- Verify recipient email
- Check SendGrid activity log (Dashboard → Activity)

### Best Practices

1. **Use Templates**: Store templates in ConfigService for easy updates
2. **Async Sending**: Don't block request on email sending
3. **Error Handling**: Catch and log email errors, don't fail requests
4. **Rate Limiting**: Track email volume, respect limits
5. **Unsubscribe**: Include unsubscribe links for marketing emails

---

## OpenAI

### Overview
OpenAI integration provides AI-powered features like intelligent classification, content generation, and decision reasoning.

### Prerequisites
- OpenAI account
- API credits (pay-as-you-go)

### Step 1: Create OpenAI Account

1. **Sign Up**
   - Go to https://platform.openai.com/signup
   - Create account

2. **Add Payment Method**
   - Settings → Billing
   - Add credit card
   - Set usage limits (recommended: $10/month to start)

### Step 2: Generate API Key

1. **Create API Key**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name: "JARVIS IntelliAgent"
   - Permissions: All (or specific if needed)
   - Click "Create secret key"

2. **Copy API Key**
   ```
   sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
   ```
   **Important**: Copy immediately, shown once only

### Step 3: Configure Application

Add to Replit Secrets or `.env`:
```env
OPENAI_API_KEY=sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
```

### Step 4: Test Integration

**Backend Service** (already in codebase):
```typescript
// server/services/openAIService.ts
import OpenAI from "openai";

export class OpenAIService {
  private client: OpenAI;
  
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  
  async complete(prompt: string, model = "gpt-4"): Promise<string> {
    const response = await this.client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content || "";
  }
  
  async classifyDocument(text: string): Promise<string> {
    const prompt = `Classify this insurance document: ${text}`;
    return await this.complete(prompt);
  }
}

export const openAIService = new OpenAIService();
```

**Test API Call**:
```bash
# Via Replit Shell
node -e "
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  client.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Say hello!' }]
  }).then(r => console.log(r.choices[0].message.content));
"
```

### Step 5: Configure AI Features

**Prompt Management via ConfigService**:
```typescript
// Store prompts in config_values
await configService.setSetting('openai.prompts', {
  document_classification: {
    system: 'You are an insurance document classifier.',
    template: 'Classify this document: {document_text}'
  },
  risk_assessment: {
    system: 'You are a risk assessment expert.',
    template: 'Assess risk for: {submission_data}'
  },
  decision_reasoning: {
    system: 'You are an AI decision explainer.',
    template: 'Explain this decision: {decision}'
  }
});
```

### Use Cases in JARVIS

**1. Document Classification**
```typescript
const classification = await openAIService.classifyDocument(emailBody);
// Returns: "ACORD Form 125" or "Loss Run" or "Certificate of Insurance"
```

**2. Intent Extraction**
```typescript
const intent = await openAIService.complete(
  `Extract submission intent from: ${emailText}`
);
// Returns structured intent data
```

**3. Risk Assessment**
```typescript
const riskAnalysis = await openAIService.complete(
  `Analyze risk for commercial property: ${copeData}`
);
// Returns risk factors and recommendations
```

**4. Decision Reasoning (AI Governance)**
```typescript
const reasoning = await openAIService.complete(
  `Explain why this submission was approved: ${decisionData}`
);
// Stores in risk_assessments.decision_reasoning
```

### Cost Management

**Monitor Usage**:
- OpenAI Dashboard → Usage
- Set monthly limits
- Track costs per feature

**Optimize Costs**:
1. Use GPT-3.5-turbo for simple tasks ($0.002/1K tokens)
2. Use GPT-4 for complex reasoning ($0.03/1K tokens)
3. Cache responses when possible
4. Limit max_tokens
5. Use embeddings for similarity (cheaper)

**Example Cost Calculation**:
```
100 submissions/day
Average: 500 tokens input + 200 tokens output = 700 tokens
GPT-3.5-turbo: $0.002/1K tokens
Daily cost: (700 * 100 / 1000) * $0.002 = $0.14/day = $4.20/month
```

### Troubleshooting

**Error: "Invalid API key"**
- Check OPENAI_API_KEY is correct
- Verify not revoked
- Regenerate if needed

**Error: "Rate limit exceeded"**
- Free tier: 3 requests/minute
- Upgrade to paid tier
- Implement rate limiting/queueing

**Error: "Insufficient credits"**
- Add credits to OpenAI account
- Check billing dashboard

**Slow responses**:
- GPT-4 slower than GPT-3.5
- Reduce max_tokens
- Use streaming for long responses

### Best Practices

1. **Prompt Engineering**: Store prompts in ConfigService for easy tuning
2. **Error Handling**: Catch API errors, provide fallbacks
3. **Rate Limiting**: Don't exceed API limits
4. **Caching**: Cache similar requests
5. **Monitoring**: Track usage and costs
6. **Security**: Never send PII to OpenAI without consent

---

## Google Analytics

### Overview
Google Analytics tracks user behavior, page views, and feature usage for product analytics.

### Prerequisites
- Google Analytics account
- Google Tag Manager (optional, recommended)

### Step 1: Create Google Analytics Property

1. **Sign In**
   - Go to https://analytics.google.com
   - Sign in with Google account

2. **Create Property**
   - Admin → Create Property
   - Property name: "JARVIS IntelliAgent"
   - Timezone and currency
   - Click "Next"

3. **Configure Data Stream**
   - Select "Web"
   - Website URL: your app domain
   - Stream name: "JARVIS Web App"
   - Click "Create stream"

4. **Copy Measurement ID**
   ```
   G-XXXXXXXXXX
   ```

### Step 2: Configure Application

Add to Replit Secrets or `.env`:
```env
GA_TRACKING_ID=G-XXXXXXXXXX
```

### Step 3: Implement Tracking

**Frontend Implementation**:
```typescript
// client/src/lib/analytics.ts
export function initializeAnalytics() {
  const trackingId = import.meta.env.VITE_GA_TRACKING_ID;
  
  if (!trackingId) return;
  
  // Load Google Analytics script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
  document.head.appendChild(script);
  
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  
  gtag('js', new Date());
  gtag('config', trackingId);
}

export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number
) {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value
    });
  }
}

export function trackPageView(path: string, title?: string) {
  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title
    });
  }
}
```

**Initialize in App**:
```typescript
// client/src/App.tsx
import { useEffect } from 'react';
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

function App() {
  useEffect(() => {
    initializeAnalytics();
  }, []);
  
  // Track page views on route change
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, [location]);
  
  return (/* ... */);
}
```

### Step 4: Track Key Events

**User Authentication**:
```typescript
trackEvent('User', 'Login', 'GitHub OAuth');
trackEvent('User', 'Logout');
```

**Persona Switching**:
```typescript
trackEvent('Persona', 'Switch', newPersona);
```

**Agent Execution**:
```typescript
trackEvent('Agent', 'Execution Started', command);
trackEvent('Agent', 'Execution Completed', executionId);
```

**Workflow Completion**:
```typescript
trackEvent('Workflow', 'Completed', workflowType, duration);
```

**Form Submissions**:
```typescript
trackEvent('Form', 'Submit', formName);
```

### Step 5: Set Up Custom Dimensions

**In Google Analytics**:
- Admin → Data display → Custom definitions
- Click "Create custom dimension"

**Recommended Dimensions**:
```
1. user_persona (scope: User)
2. agent_layer (scope: Event)
3. workflow_type (scope: Event)
4. execution_status (scope: Event)
```

**Track with Dimensions**:
```typescript
window.gtag('event', 'agent_execution', {
  agent_layer: 'System',
  workflow_type: 'Commercial Property',
  execution_status: 'completed'
});
```

### Verification

**Real-Time Reporting**:
- Google Analytics → Reports → Realtime
- Should see active users
- Test by navigating app

**Event Tracking**:
- Reports → Events
- Should see custom events
- Check event parameters

### Troubleshooting

**No data appearing**:
- Wait 24-48 hours for initial data
- Check Realtime report (immediate)
- Verify GA_TRACKING_ID correct
- Check browser console for errors

**Events not tracking**:
- Verify window.gtag exists
- Check event name and parameters
- Test in browser console: `gtag('event', 'test')`

**Ad blockers blocking**:
- Analytics blocked by ad blockers
- Consider server-side tracking alternative

### Privacy Considerations

1. **Cookie Consent**: Implement cookie banner if required (GDPR)
2. **IP Anonymization**: Enable in GA settings
3. **Data Retention**: Configure in GA Admin
4. **Privacy Policy**: Disclose GA usage

---

## PostgreSQL Database

### Overview
JARVIS uses PostgreSQL (Neon Serverless) for all data persistence.

### Replit Auto-Provisioned Database

**Automatic Setup**:
- Replit auto-creates PostgreSQL database
- DATABASE_URL automatically set in Secrets
- No manual setup needed

**Verify Database**:
```bash
echo $DATABASE_URL
# postgresql://user:pass@host:5432/database
```

### External PostgreSQL (Optional)

If using external database (Neon, Supabase, Railway):

**Step 1: Create Database**
- Sign up for database provider
- Create new PostgreSQL instance
- Copy connection string

**Step 2: Configure**
```env
DATABASE_URL=postgresql://user:pass@host:5432/database
```

**Step 3: Push Schema**
```bash
npm run db:push
```

### Database Schema Management

**View Schema**:
```bash
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\d agents"  # Describe table
```

**Push Schema Changes**:
```bash
npm run db:push
# Force push (data loss warning):
npm run db:push -- --force
```

**Backup Database**:
```bash
pg_dump $DATABASE_URL > backup.sql
```

**Restore Database**:
```bash
psql $DATABASE_URL < backup.sql
```

### Verification

**Test Connection**:
```bash
psql $DATABASE_URL -c "SELECT 1;"
# Should return: 1
```

**Check Tables**:
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM agents;"
# Should return count > 0 after seeding
```

**Verify Relationships**:
```bash
psql $DATABASE_URL -c "
  SELECT 
    a.name as agent,
    ae.command,
    ae.status
  FROM agents a
  LEFT JOIN agent_executions ae ON ae.persona = a.persona
  LIMIT 5;
"
```

---

## Integration Testing Checklist

After setting up all integrations, verify:

### GitHub OAuth ✅
- [ ] Can click "Login with GitHub"
- [ ] Redirects to GitHub authorization
- [ ] Successfully logs in and creates session
- [ ] User data stored in database
- [ ] Can logout and re-login

### SendGrid ✅
- [ ] API key configured
- [ ] Test email sends successfully
- [ ] Email received (check spam)
- [ ] Templates can be configured
- [ ] Error handling works

### OpenAI ✅
- [ ] API key configured
- [ ] Test completion works
- [ ] Classification returns results
- [ ] Costs tracking in OpenAI dashboard
- [ ] Error handling for rate limits

### Google Analytics ✅
- [ ] Tracking ID configured
- [ ] Real-time users showing
- [ ] Page views tracked
- [ ] Custom events tracked
- [ ] No console errors

### PostgreSQL ✅
- [ ] Connection successful
- [ ] All 50+ tables exist
- [ ] Relationships enforced
- [ ] Queries execute properly
- [ ] Backups working

---

**Last Updated**: 2025-11-12  
**Version**: 3.0
