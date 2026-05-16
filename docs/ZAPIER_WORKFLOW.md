# TG Contracting - Zapier Automation Pipeline

## 📊 Complete Workflow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEAD CAPTURE (Stage 1-2)                     │
├─────────────────────────────────────────────────────────────────┤
│ AI Receptionist (Dialogflow) + Google Form → Unified JSON       │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                 ESTIMATION (Stage 3)                            │
├─────────────────────────────────────────────────────────────────┤
│ Auto-Calculate Quote Based on:                                  │
│ • Project Type (roofing, deck, landscaping)                     │
│ • Square footage / complexity                                   │
│ • Location (zip code pricing matrix)                            │
│ • Urgency level                                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│            QUOTE GENERATION (Stage 4)                           │
├─────────────────────────────────────────────────────────────────┤
│ Generate PDF with:                                              │
│ • TG Contracting Logo Header (from Google Drive)                │
│ • Client Details                                                │
│ • Itemized Estimates                                            │
│ • Terms & Conditions                                            │
│ • Payment Options                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│          APPROVAL + SCHEDULING (Stage 5)                        │
├─────────────────────────────────────────────────────────────────┤
│ Client Reviews & Accepts Quote:                                 │
│ • Email with embedded PDF                                       │
│ • Accept/Reject buttons with Zapier webhook                     │
│ • If approved → Calendar availability check                     │
│ • Client selects preferred dates                                │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│              PAYMENT PROCESSING (Stage 6)                       │
├─────────────────────────────────────────────────────────────────┤
│ • Send payment link (Stripe/Square)                             │
│ • Deposit collection (% of estimate)                            │
│ • Payment confirmation webhook                                  │
│ • Generate invoice                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│          PIPELINE ROUTING (Stage 7)                             │
├─────────────────────────────────────────────────────────────────┤
│ • Create Airtable record (project database)                     │
│ • Assign to crew lead (based on availability)                   │
│ • Add to project management (Monday.com / Asana)                │
│ • Send crew notification                                        │
│ • Trigger SMS reminder to client                                │
│ • Update CRM (Pipedrive / HubSpot)                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow & JSON Schema

### **Universal Intake JSON** (All Stages Use This)

```json
{
  "lead_id": "unique-id-timestamp",
  "source": "ai_receptionist | google_form | manual",
  "capture_timestamp": "2026-05-16T14:30:00Z",
  "client": {
    "name": "John Smith",
    "phone": "555-123-4567",
    "email": "john@example.com",
    "address": "123 Oak Street",
    "city": "Austin",
    "state": "TX",
    "zip": "78701"
  },
  "project": {
    "type": "roofing | deck | landscaping | other",
    "details": "Complete roof replacement with new shingles",
    "square_footage": 2500,
    "urgency": "low | medium | high",
    "timeline_requested": "2 weeks",
    "budget_range": "$5,000-$10,000"
  },
  "intake": {
    "referral_source": "Google Maps | Yelp | Referral | Website | Other",
    "notes": "Customer called about storm damage",
    "follow_up_date": "2026-05-17"
  },
  "status": "intake_complete | pending_estimate | quote_sent | approved | payment_pending | active_project",
  "assigned_to": null
}
```

---

## 🎯 Stage-by-Stage Breakdown

### **Stage 1: AI Receptionist (Dialogflow)**
**Input:** Google Voice transcription or Dialogflow session
**Action:** Extract structured data using Zapier AI
**Output:** JSON payload to Zapier webhook

**Key Extraction Fields:**
- Customer name, phone, email
- Property address
- Project type & description
- Timeline expectations
- Budget mention (if any)
- How they found you

---

### **Stage 2: Google Form Backup**
**Input:** Customer fills form at `tg-roof-takeoff-pro.vercel.app/intake`
**Action:** Zapier triggers on form submission
**Output:** Same JSON schema as Stage 1

**Form Fields:**
- Name, Phone, Email
- Address (full)
- Project Type (dropdown)
- Project Description (textarea)
- Timeline (dropdown: ASAP, 1-2 weeks, 1 month, flexible)
- Budget (dropdown: under $5k, $5-10k, $10-20k, $20k+, not sure)
- How did you find us? (dropdown)

---

### **Stage 3: Estimator**
**Input:** Project details from Stage 1-2
**Action:** Zapier runs calculation logic
**Output:** `estimate` object with pricing

**Calculation Matrix:**
```
ROOFING:
- Base rate: $300-400 per roofing square (100 sq ft)
- Material multiplier: 1.0x-1.5x (based on shingle type)
- Complexity multiplier: 1.0x-2.0x (based on pitch, access)
- Rush fee: +20% if urgency = "high"

DECK:
- Base: $25-50 per sq ft
- Material upgrade: +10-30%
- Labor rush: +15-25%

LANDSCAPING:
- Base: $30-80 per sq ft
- Design complexity: +20-40%
```

---

### **Stage 4: Quote Generator**
**Input:** Estimate + client details
**Action:** Google Docs template → PDF with logo
**Output:** PDF file sent via email

**PDF Includes:**
- TG Contracting logo header (from Google Drive)
- Company contact info
- Quote ID & date
- Client details
- Itemized estimate breakdown
- Payment terms (50% deposit, balance on completion)
- Valid until date (+14 days)
- Signature/approval section (digital link)

---

### **Stage 5: Approval + Scheduling**
**Input:** Client receives PDF quote
**Action:** 
- Email contains "Approve" button (Zapier webhook)
- If approved → Check calendar availability
- Client selects 3 preferred dates

**Output:** 
- `approval_status`: approved | rejected
- `preferred_dates`: array of ISO dates
- `scheduled_date`: confirmed date (after crew availability check)

---

### **Stage 6: Payment Processing**
**Input:** Quote approved + date selected
**Action:** 
- Generate Stripe/Square payment link
- Email invoice to client
- Webhook captures payment confirmation

**Output:**
- `payment_status`: pending | received | failed
- `payment_amount`: deposit (50% of estimate)
- `payment_date`: timestamp
- `payment_method`: card details (last 4 digits)
- `invoice_id`: unique payment reference

---

### **Stage 7: Pipeline Routing**
**Input:** Payment received confirmation
**Action:** Multi-step activation:

1. **Create Airtable Record**
   - Table: "Active Projects"
   - Fields: All client/project data
   - Linked records to crew availability

2. **Assign to Crew Lead**
   - Query: Find crew with matching availability
   - Filter by project type expertise
   - Load balance (least busy crew)
   - Send Slack notification

3. **Add to Project Management**
   - Create task in Monday.com / Asana
   - Set due date = scheduled_date
   - Assign crew members
   - Attach quote PDF

4. **Send Notifications**
   - Email to crew lead
   - SMS reminder to client (48 hours before)
   - Add to team calendar

5. **Update CRM**
   - Pipedrive / HubSpot update
   - Move to "Active Projects" stage
   - Log all interactions

---

## 🔗 Zapier Zap Configurations

### **Zap 1: AI Receptionist → Lead Capture**
```
Trigger: Webhook (Dialogflow sends data)
Action 1: Zapier AI (Extract JSON)
Action 2: Format Data (Standardize to schema)
Action 3: Send to Webhook (Internal API)
```

### **Zap 2: Google Form → Lead Capture**
```
Trigger: Google Forms submission
Action 1: Format data to JSON schema
Action 2: Send to same webhook as Zap 1
```

### **Zap 3: Lead → Estimator**
```
Trigger: New lead (from Webhook)
Action 1: Lookup project pricing matrix
Action 2: Calculate estimate
Action 3: Update Airtable "Leads" table
Action 4: Continue to Zap 4
```

### **Zap 4: Estimator → Quote Generator**
```
Trigger: Estimate created
Action 1: Fetch TG logo from Google Drive
Action 2: Render Google Docs template
Action 3: Convert to PDF
Action 4: Send email with PDF + approval buttons
```

### **Zap 5: Client Approval**
```
Trigger: Webhook (Approval button clicked)
Action 1: Check team calendar availability
Action 2: Send scheduling link to client
Action 3: Store preferred dates
```

### **Zap 6: Date Confirmed → Payment Link**
```
Trigger: Scheduled date confirmed
Action 1: Generate Stripe payment link
Action 2: Email invoice + payment link
Action 3: Create calendar hold for crew
```

### **Zap 7: Payment Received → Project Activation**
```
Trigger: Stripe webhook (payment_intent.succeeded)
Action 1: Create Airtable project record
Action 2: Assign crew lead
Action 3: Create Monday.com task
Action 4: Send notifications (crew + client)
Action 5: Update CRM
```

---

## 🔐 Security & Data Flow

- **All PII encrypted** in transit
- **Webhook authentication** (Zapier standard)
- **Rate limiting** (max 100 requests/minute)
- **Audit trail** logged in Airtable
- **GDPR compliant** (data retention policy)

---

## 📊 Monitoring & Analytics

**Track in Zapier Dashboard:**
- Leads per day/week
- Conversion rate (intake → paid project)
- Average quote value
- Time from intake → payment
- Most common project types
- Referral source effectiveness

---

## 🚨 Error Handling

- **Failed extraction?** → Flag for manual review
- **Payment failed?** → Retry email + support contact
- **Crew unavailable?** → Queue project, email client with hold time
- **Invalid address?** → Google Maps API validation + manual entry option

