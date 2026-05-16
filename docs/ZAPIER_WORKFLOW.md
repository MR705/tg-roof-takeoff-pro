# Zapier Workflow Architecture - TG Contracting

## 7-Stage Automated Lead-to-Project Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TG CONTRACTING AUTOMATION PIPELINE               │
└─────────────────────────────────────────────────────────────────────┘

   STAGE 1           STAGE 2          STAGE 3         STAGE 4
   ┌────────┐      ┌────────┐      ┌────────┐      ┌────────┐
   │ INTAKE │      │ESTIMATE│      │ QUOTE  │      │APPROVAL│
   └────┬───┘      └────┬───┘      └────┬───┘      └────┬───┘
        │               │               │               │
   Dialogflow       Pricing Matrix   Google Docs    Date Select
   Google Form      Airtable         PDF Gen        Form Approval
        │               │               │               │
        └───────────────┼───────────────┼───────────────┘
                        │
                    LEAD DATA
                   JSON SCHEMA
                        │
        ┌───────────────┴───────────────┐
        │                               │
   STAGE 5              STAGE 6       STAGE 7
  ┌────────┐          ┌────────┐    ┌────────┐
  │PAYMENT │          │ROUTING │    │PROJECT │
  └────┬───┘          └────┬───┘    └────┬───┘
       │                   │             │
   Stripe/Square      Airtable       Project Mgmt
   Payment Link       Slack Notify    Crew Assign
       │                   │             │
       └───────────────────┴─────────────┘
                   │
            ACTIVE PROJECT
            IN PIPELINE
```

---

## Lead Data Schema

### Intake JSON Format
```json
{
  "name": "string (required)",
  "phone": "string (required, XXX-XXX-XXXX)",
  "email": "string (optional)",
  "address": "string (required)",
  "city": "string (required)",
  "state": "string (optional)",
  "zip": "string (optional)",
  "project_type": "enum [roofing, deck, landscaping, other]",
  "project_details": "string (required)",
  "urgency": "enum [low, medium, high]",
  "timeline_requested": "string (required)",
  "budget": "string (optional)",
  "referral_source": "string (required)",
  "notes": "string (optional)",
  "lead_id": "string (auto-generated: LEAD-{timestamp})",
  "status": "string (auto-updated through pipeline)",
  "date_received": "ISO8601 timestamp"
}
```

---

## Stage Details

### STAGE 1: Intake Processing
**Input Sources:**
- Dialogflow webhook (AI Receptionist)
- Google Forms submission

**Processing:**
1. AI Action extracts clean JSON from transcript
2. JSON parsed and validated
3. Record created in Airtable 'Leads' table
4. Triggers Stage 2 webhook

**Output:**
- Airtable record with status "Intake Complete"
- Lead ID generated

---

### STAGE 2: Estimate Calculation
**Pricing Matrix:**
```javascript
roofing: {
  base_price: $350,
  sqft_rate: $1.20/sqft,
  urgency_multiplier: { low: 1.0x, medium: 1.1x, high: 1.2x }
},
deck: {
  base_price: $500,
  sqft_rate: $0.80/sqft,
  urgency_multiplier: { low: 1.0x, medium: 1.1x, high: 1.2x }
},
landscaping: {
  base_price: $300,
  sqft_rate: $0.60/sqft,
  urgency_multiplier: { low: 1.0x, medium: 1.1x, high: 1.2x }
},
other: {
  base_price: $400,
  sqft_rate: $1.00/sqft,
  urgency_multiplier: { low: 1.0x, medium: 1.1x, high: 1.2x }
}
```

**Calculations:**
- Material Cost = Square Footage × Rate
- Base Total = Base Price + Material Cost
- Final Total = Base Total × Urgency Multiplier
- Tax = Final Total × 8.25% (Austin rate)
- Deposit (50%) = Final Total × 0.5

**Output:**
- Estimate stored in Airtable
- Status updated to "Estimate Complete"
- Triggers Stage 3

---

### STAGE 3: Quote Generation
**Template Includes:**
- TG Contracting logo header (from Google Drive)
- Quote ID and expiration date
- Client contact information
- Project details
- Itemized pricing breakdown
- Payment terms
- Legal disclaimers
- Warranty information

**Process:**
1. Google Docs template populated with data
2. Document exported to PDF
3. Saved to Google Drive
4. Email sent to client with attachment
5. Approval button included in email

**Output:**
- PDF quote file
- Email sent with PDF
- Status: "Quote Sent"

---

### STAGE 4: Approval & Scheduling
**Approval Form Fields:**
- Approve Quote? (Yes/No)
- Preferred Start Date (Date Picker)
- Preferred Time (Dropdown: AM/PM/Flexible)
- Special Instructions (Text)

**Process:**
1. Customer clicks "Approve" button or form link
2. Form captures preferences
3. Available dates fetched from crew calendar
4. Date options presented to customer
5. Selection triggers payment stage

**Output:**
- Status: "Quote Approved"
- Scheduled Date recorded
- Transitions to payment

---

### STAGE 5: Payment Processing
**Payment Gateway:** Stripe or Square

**Process:**
1. Payment link created for 50% deposit
2. Email sent with secure payment link
3. Customer completes payment
4. Webhook confirms payment received
5. Triggers Stage 6

**Output:**
- Payment ID stored
- Status: "Active Project"
- Invoice generated
- Project created in Active Projects table

---

### STAGE 6: Pipeline Routing
**Routing Logic:**
1. Payment verified
2. Active project created
3. Crew availability checked
4. Best match assigned (by type + availability)
5. Team notifications sent
6. Client confirmation sent

**Notifications:**
- Slack message to #projects channel
- Email to crew lead with details
- SMS to client with crew arrival time
- Google Calendar event created

**Output:**
- Status: "Crew Assigned"
- Project ready for execution

---

### STAGE 7: Project Management
**Tracking:**
- Real-time updates from crew app
- Photo uploads
- Time tracking
- Quality checklist
- Completion sign-off

**Post-Completion:**
- Final invoice generated
- Completion email sent
- Google review request
- Warranty documentation
- Follow-up survey

---

## Webhook URLs

```
Stage 1 Trigger: Dialogflow/Google Voice
  → /api/zapier/intake (POST)
  ↓
Stage 2 Estimator: Calculate pricing
  → /api/zapier/estimate (POST)
  ↓
Stage 3 Quote Generator: Create PDF
  → /api/zapier/quote (POST)
  ↓
Stage 4 Approval: Wait for customer response
  → /api/zapier/quote-approved (POST)
  ↓
Stage 5 Payment: Process Stripe/Square
  → /api/zapier/payment-received (POST)
  ↓
Stage 6 Routing: Assign crew & notify
  → /api/zapier/crew-assignment (POST)
  ↓
Stage 7 Project: Create active project
  → Complete
```

---

## Error Handling

### Retry Logic
- Zapier auto-retries failed steps 3 times
- Exponential backoff: 1s, 5s, 30s
- Failed Zaps logged with error details

### Fallback Actions
- If email fails: Retry via SendGrid
- If Stripe fails: Queue for manual processing
- If crew unavailable: Escalate to manager

### Logging
- All transitions logged in Airtable
- Slack alerts for failures
- Daily summary email to manager

---

## Performance Metrics

### Typical Timeline
- Lead received → Estimate: **2-3 minutes**
- Estimate → Quote sent: **1 minute**
- Quote sent → Approval: **1-2 hours** (customer decision)
- Approval → Payment: **5-10 minutes**
- Payment → Project active: **2-3 minutes**
- **Total lead-to-project: 2-4 hours** (with customer decision time)

### Conversion Tracking
- Leads captured: All sources
- Quotes sent: ~85% of leads
- Quotes approved: ~60% of quotes (~50% of leads)
- Payments completed: ~95% of approvals (~47% of leads)
- **Overall conversion: ~47% from lead to active project**

---

## Security

### Authentication
- Zapier webhook signing secret
- API authentication tokens
- Airtable API key (environment variable)
- Stripe API key (environment variable)

### Data Privacy
- Customer data encrypted in transit
- PII not logged to console
- Airtable records access controlled
- Automatic purge of old leads (90 days)

---

## Integration Points

### Airtable CRM
- Leads table: All incoming leads
- Active Projects table: Approved projects
- Crew table: Team members & availability
- Pricing Matrix table: Dynamic rates

### Google Suite
- Google Forms: Lead capture form
- Google Docs: Quote template
- Google Drive: Logo storage, PDF storage
- Google Calendar: Crew availability
- Gmail: Email notifications

### Payment Processing
- Stripe: Secure payments
- Payment confirmations
- Invoice generation

### Communication
- Slack: Team notifications
- Gmail: Client emails
- SMS: Text alerts (optional)

---

## Maintenance

### Daily
- Monitor Zap run history
- Check for failed runs
- Verify lead capture

### Weekly
- Review conversion metrics
- Check pricing accuracy
- Update crew availability

### Monthly
- Audit all leads
- Review completed projects
- Optimize pricing
- Training for team

---

## Future Enhancements

1. **AI Follow-ups**
   - Auto-followup if quote not approved
   - Re-engagement emails

2. **Multi-Location Support**
   - Route by service area
   - Location-based pricing

3. **Crew Mobile App**
   - Real-time project updates
   - Photo documentation
   - Customer communication

4. **Customer Portal**
   - Project tracking
   - Photo gallery
   - Final invoice
   - Warranty info

5. **Advanced Analytics**
   - Revenue forecasting
   - Customer lifetime value
   - Churn prediction
   - Seasonal trends
