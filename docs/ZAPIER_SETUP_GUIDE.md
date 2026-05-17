# Zapier Setup Guide - TG Contracting

## Complete Step-by-Step Integration

---

## Prerequisites

1. **Zapier Account** (Pro or higher for multi-step Zaps)
2. **Google Forms** (for lead capture)
3. **Google Voice/Dialogflow** (for AI receptionist)
4. **Payment Gateway** (Stripe or Square)
5. **Email Service** (Gmail, SendGrid, etc.)
6. **Slack** (optional but recommended for team notifications)
7. **Google Drive** (for logo storage and document generation)

---

## Step 1: AI Receptionist Setup (Dialogflow → Zapier)

### 1.1 Configure Dialogflow Integration

1. Go to **Zapier Dashboard** → **Create** → **Zap**
2. **Trigger**: Search for "Dialogflow" or "Google Voice"
3. Select trigger event (e.g., "New Conversation Transcript")
4. Connect your Google account
5. Select your Dialogflow agent/conversation

### 1.2 Add AI Action (Zapier Premium Feature)

1. Click **+** to add action
2. Search for **"Zapier AI Actions"**
3. Select **"Write Text"** action
4. In the prompt field, paste this:

```
You are TG Contracting's intake assistant. Extract the following fields from the call transcript and return ONLY clean JSON with no extra text.

Required fields:
- name
- phone
- email (if mentioned)
- address
- city
- project_type (roofing, deck, landscaping, other)
- project_details
- urgency (low, medium, high)
- timeline_requested
- budget (if mentioned)
- referral_source
- notes

If a field is missing, return an empty string.

Output JSON exactly like this:
{
  "name": "",
  "phone": "",
  "email": "",
  "address": "",
  "city": "",
  "project_type": "",
  "project_details": "",
  "urgency": "",
  "timeline_requested": "",
  "budget": "",
  "referral_source": "",
  "notes": ""
}

DO NOT include any other text. Return ONLY valid JSON.

Call Transcript: {{transcript_text}}
```

5. In the input field, map `{{transcript_text}}` to your Dialogflow transcript data
6. Click **Continue**

### 1.3 Parse JSON Output

1. Click **+** to add another action
2. Select **"Zapier" → "Code"** (Python or Node.js)
3. Add this script:

```javascript
const output = JSON.parse(inputData.ai_response);
return output;
```

4. Click **Continue** and **Test & Review**

---

## Step 2: Google Form → Zapier

### 2.1 Create Google Form

1. Go to **Google Forms**
2. Create new form with fields:
   - Full Name (Required)
   - Phone Number (Required)
   - Email (Optional)
   - Project Address (Required)
   - City/Region (Required)
   - Project Type (Dropdown: Roofing, Deck, Landscaping, Other)
   - Project Description (Paragraph)
   - Requested Timeline (Short answer)
   - Budget Range (Multiple choice or dropdown)
   - How did you hear about us? (Multiple choice)

3. **Share your form URL** publicly or with clients

### 2.2 Connect Google Forms to Zapier

1. Create new Zap
2. **Trigger**: Search "Google Forms"
3. Select **"New Form Response"**
4. Connect your Google account
5. Select the form you created
6. Map form fields to intake schema

---

## Step 3: Estimator Integration

### 3.1 Create Estimator Zap

1. Create new Zap
2. **Trigger**: Use webhook from Step 1 or Step 2 output
3. Add action: **"Zapier Code"** (Node.js)

```javascript
// Estimator Logic
const intakeData = inputData;

const estimates = {
  roofing: { low: 3000, high: 8000 },
  deck: { low: 2000, high: 6000 },
  landscaping: { low: 1000, high: 5000 },
  other: { low: 1500, high: 4000 }
};

const projectType = intakeData.project_type || 'other';
const baseEstimate = estimates[projectType] || estimates.other;

// Adjust for urgency
let estimate = { ...baseEstimate };
if (intakeData.urgency === 'high') {
  estimate.low = baseEstimate.low * 1.2;
  estimate.high = baseEstimate.high * 1.2;
}

return {
  lead_id: intakeData.lead_id,
  preliminary_estimate: estimate,
  timestamp: new Date().toISOString()
};
```

4. Test and continue

---

## Step 4: Quote Generator

### 4.1 Setup PDF Generation (Google Docs Template)

1. Create Google Doc template:
   - Add TG Contracting logo (from Google Drive)
   - Quote header with quote number, date, valid until
   - Client info section
   - Line items table
   - Total/tax breakdown
   - Terms & conditions

2. Get document ID from URL (after `/d/`)

### 4.2 Create Quote Generation Zap

1. Add action: **"Google Docs"** → **"From Template"**
2. Select your template
3. Map data:
   - `{{name}}` → client name
   - `{{quote_number}}` → quote number
   - `{{total}}` → total amount
   - etc.

4. Add action: **"Google Drive"** → **"Convert File"**
   - Select generated doc
   - Convert to PDF
   - Save to specific folder

5. Get shareable link and store URL

---

## Step 5: Send Quote to Client

### 5.1 Email Configuration

1. Add action: **"Gmail"** or **"SendGrid"**
2. Configure email:

**To**: `{{client_email}}`

**Subject**: `Your Quote from TG Contracting - Quote #{{quote_number}}`

**Body**:
```
Hi {{client_name}},

Thank you for contacting TG Contracting! We've prepared a detailed quote for your {{project_type}} project.

Quote Details:
- Quote Number: {{quote_number}}
- Total: ${{total}}
- Valid Until: {{valid_until}}

Please review the attached quote and reply with your approval or any questions.

To approve this quote and schedule your project, please [CLICK HERE]({{approval_link}})

Best regards,
TG Contracting Team
```

3. Attach PDF from Step 4
4. Continue

---

## Step 6: Approval & Scheduling

### 6.1 Create Approval Form

1. Create Google Form with:
   - Quote confirmation (yes/no)
   - Preferred date picker
   - Preferred time (AM/PM)
   - Special instructions

2. Get form response webhook URL

### 6.2 Create Approval Zap

1. **Trigger**: Google Form response from approval form
2. Add conditional logic (Zapier Filter):
   - If "Approved" = Yes → Continue
   - If "Approved" = No → Route to follow-up

3. For approved quotes, continue to payment

---

## Step 7: Payment Processing

### 7.1 Stripe/Square Integration

1. Create new Zap
2. Add action: **"Stripe"** or **"Square"** → **"Create Payment Link"**
3. Configure:
   - Amount: `{{total}}`
   - Currency: USD
   - Description: `{{quote_number}} - {{project_type}}`
   - Success URL: `https://yoursite.com/success`
   - Cancel URL: `https://yoursite.com/cancel`

4. Send payment link to client via email

### 7.2 Payment Confirmation

1. Add trigger: **"Stripe"** or **"Square"** → **"Payment Completed"**
2. When triggered, send:
   - Invoice receipt to client
   - Notification to team
   - Route to pipeline

---

## Step 8: Pipeline Routing

### 8.1 Create Routing Zap

1. **Trigger**: Payment completed webhook
2. Add action: **"Slack"** (optional but recommended)
   - Send to #projects channel
   - Include: Client name, project type, scheduled date, assigned team

3. Add action: **"Google Sheets"** (if using for CRM)
   - Create new row with project data
   - Columns: Project ID, Client Name, Phone, Email, Address, Project Type, Amount, Status, Assigned To, Date, etc.

4. Add action: **"Email"** (Team notification)
   - To: your team email
   - Subject: `New Project: {{project_type}} in {{city}}`
   - Include: Client info, address, scheduled date, assigned team member

---

## Step 9: Multi-Step Zap - Complete Flow

### Combine all into one Zap:

1. **Trigger**: Dialogflow → (or Google Form)
2. **Action 1**: AI Receptionist extraction
3. **Action 2**: Parse JSON
4. **Action 3**: Estimator calculation
5. **Action 4**: Generate quote (Google Docs)
6. **Action 5**: Convert to PDF
7. **Action 6**: Send to client
8. **Action 7**: Wait for approval (Delay + Form response)
9. **Action 8**: Create payment link
10. **Action 9**: Slack notification
11. **Action 10**: Google Sheets entry

---

## Environment Variables (.env)

```env
# Google
GOOGLE_FORM_ID=your_google_form_id
DIALOGFLOW_AGENT_ID=your_dialogflow_agent_id
GOOGLE_DRIVE_LOGO_ID=your_logo_file_id
GOOGLE_DRIVE_TEMPLATE_ID=your_template_doc_id

# Zapier
ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/...
ZAPIER_AI_ACTION_ID=your_ai_action_id

# Payment
STRIPE_SECRET_KEY=sk_test_...
SQUARE_ACCESS_TOKEN=sq_...

# Email
SENDGRID_API_KEY=SG.xxx
GMAIL_ACCOUNT=your_email@gmail.com

# Slack (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Team
TEAM_EMAIL=team@tgcontracting.com
TEAM_SLACK_CHANNEL=#projects
```

---

## Testing Checklist

- [ ] AI Receptionist properly extracts transcript
- [ ] Google Form submission flows through
- [ ] Estimator calculates correctly
- [ ] Quote PDF generates with correct data
- [ ] Email sends to client with PDF attachment
- [ ] Logo displays correctly in quote
- [ ] Approval form captures responses
- [ ] Payment link generates and works
- [ ] Payment confirmation triggers
- [ ] Team notifications send
- [ ] Google Sheets updates with project
- [ ] End-to-end flow completes successfully

---

## Troubleshooting

### Quote PDF Not Generating
- Check Google Drive permissions
- Verify template document is shared
- Ensure all merge fields match data inputs

### Email Not Sending
- Verify Gmail is connected and has less secure app access enabled
- Check email address is valid
- Verify attachment permissions

### Payment Link Error
- Check Stripe/Square API keys
- Verify amount formatting (cents vs dollars)
- Check webhook URLs are accessible

### AI Extraction Errors
- Verify transcript text is being passed
- Check JSON format in AI action
- Review error logs in Zapier

---

## Support & Resources

- Zapier Help: https://zapier.com/help
- Stripe Documentation: https://stripe.com/docs
- Google Forms API: https://developers.google.com/forms
- Dialogflow Guide: https://cloud.google.com/dialogflow/es/docs

