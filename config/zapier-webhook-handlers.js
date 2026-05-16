/**
 * Zapier Webhook Handlers for TG Contracting
 * Processes leads through 7-stage automation pipeline
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const airtable = require('airtable');

// Initialize Airtable
const base = new airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

// ============================================
// STAGE 1: Intake Processing
// ============================================
router.post('/api/zapier/intake', async (req, res) => {
  try {
    const intake = req.body;
    
    // Validate required fields
    if (!intake.name || !intake.phone || !intake.address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique lead ID
    const leadId = `LEAD-${Date.now()}`;
    
    // Create Airtable record
    const record = await base('Leads').create([
      {
        fields: {
          'Lead ID': leadId,
          'Name': intake.name,
          'Phone': intake.phone,
          'Email': intake.email || '',
          'Address': intake.address,
          'City': intake.city,
          'State': intake.state || '',
          'Zip': intake.zip || '',
          'Project Type': intake.project_type,
          'Project Details': intake.project_details,
          'Urgency': intake.urgency,
          'Timeline': intake.timeline_requested,
          'Budget': intake.budget || '',
          'Referral Source': intake.referral_source,
          'Notes': intake.notes,
          'Status': 'Intake Complete',
          'Date Received': new Date().toISOString()
        }
      }
    ]);

    // Trigger Zapier webhook for estimator
    await axios.post(process.env.ZAPIER_ESTIMATOR_WEBHOOK, {
      ...intake,
      lead_id: leadId,
      record_id: record[0].id
    });

    res.json({ success: true, lead_id: leadId, record_id: record[0].id });
  } catch (error) {
    console.error('Intake error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 2: Estimate Calculation
// ============================================
router.post('/api/zapier/estimate', async (req, res) => {
  try {
    const { lead_id, project_type, urgency, square_footage = 2000 } = req.body;

    // Pricing matrix
    const rates = {
      roofing: { base: 350, sqftRate: 1.2 },
      deck: { base: 500, sqftRate: 0.8 },
      landscaping: { base: 300, sqftRate: 0.6 },
      other: { base: 400, sqftRate: 1.0 }
    };

    const urgencyMultiplier = {
      low: 1.0,
      medium: 1.1,
      high: 1.2
    };

    const rate = rates[project_type] || rates.other;
    const materialCost = square_footage * rate.sqftRate;
    const baseTotal = rate.base + materialCost;
    const finalTotal = Math.round(baseTotal * (urgencyMultiplier[urgency] || 1.0));
    const deposit = Math.round(finalTotal * 0.5);
    const tax = Math.round(finalTotal * 0.0825);

    const estimate = {
      base_price: rate.base,
      material_cost: Math.round(materialCost),
      labor_cost: Math.round((finalTotal - materialCost) * 0.6),
      subtotal: finalTotal,
      tax: tax,
      total_estimate: finalTotal + tax,
      deposit_50_percent: deposit
    };

    // Update Airtable
    const records = await base('Leads')
      .select({
        filterByFormula: `{Lead ID} = "${lead_id}"`
      })
      .all();

    if (records.length > 0) {
      await base('Leads').update([
        {
          id: records[0].id,
          fields: {
            'Estimated Price': estimate.total_estimate,
            'Status': 'Estimate Complete',
            'Base Price': estimate.base_price,
            'Material Cost': estimate.material_cost,
            'Labor Cost': estimate.labor_cost
          }
        }
      ]);
    }

    // Trigger quote generator
    await axios.post(process.env.ZAPIER_QUOTE_WEBHOOK, {
      ...req.body,
      ...estimate,
      quote_number: `QT-${lead_id.split('-')[1]}`,
      valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });

    res.json({ success: true, estimate });
  } catch (error) {
    console.error('Estimate error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 3: Quote Approval
// ============================================
router.post('/api/zapier/quote-approved', async (req, res) => {
  try {
    const { lead_id } = req.body;

    // Update Airtable
    const records = await base('Leads')
      .select({
        filterByFormula: `{Lead ID} = "${lead_id}"`
      })
      .all();

    if (records.length > 0) {
      await base('Leads').update([
        {
          id: records[0].id,
          fields: {
            'Status': 'Quote Approved',
            'Approval Date': new Date().toISOString()
          }
        }
      ]);
    }

    // Trigger scheduling
    await axios.post(process.env.ZAPIER_SCHEDULING_WEBHOOK, req.body);

    res.json({ success: true });
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 4: Date Selection
// ============================================
router.post('/api/zapier/date-confirmed', async (req, res) => {
  try {
    const { lead_id, selected_date } = req.body;

    // Update Airtable
    const records = await base('Leads')
      .select({
        filterByFormula: `{Lead ID} = "${lead_id}"`
      })
      .all();

    if (records.length > 0) {
      await base('Leads').update([
        {
          id: records[0].id,
          fields: {
            'Status': 'Ready for Payment',
            'Scheduled Date': selected_date
          }
        }
      ]);
    }

    // Trigger payment
    await axios.post(process.env.ZAPIER_PAYMENT_WEBHOOK, req.body);

    res.json({ success: true });
  } catch (error) {
    console.error('Date confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 5: Payment Received
// ============================================
router.post('/api/zapier/payment-received', async (req, res) => {
  try {
    const { lead_id, payment_id, amount } = req.body;

    // Update Airtable
    const records = await base('Leads')
      .select({
        filterByFormula: `{Lead ID} = "${lead_id}"`
      })
      .all();

    if (records.length > 0) {
      const leadData = records[0].fields;
      
      // Update lead status
      await base('Leads').update([
        {
          id: records[0].id,
          fields: {
            'Status': 'Active Project',
            'Payment Date': new Date().toISOString(),
            'Payment ID': payment_id
          }
        }
      ]);

      // Create active project
      await base('Active Projects').create([
        {
          fields: {
            'Project ID': `PROJ-${lead_id.split('-')[1]}`,
            'Lead ID': lead_id,
            'Client Name': leadData['Name'],
            'Phone': leadData['Phone'],
            'Email': leadData['Email'],
            'Address': leadData['Address'],
            'City': leadData['City'],
            'State': leadData['State'],
            'Project Type': leadData['Project Type'],
            'Project Details': leadData['Project Details'],
            'Scheduled Date': leadData['Scheduled Date'],
            'Total Amount': amount,
            'Status': 'Scheduled',
            'Created Date': new Date().toISOString()
          }
        }
      ]);
    }

    // Trigger pipeline routing
    await axios.post(process.env.ZAPIER_ROUTING_WEBHOOK, req.body);

    res.json({ success: true });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 6: Crew Assignment
// ============================================
router.post('/api/zapier/crew-assignment', async (req, res) => {
  try {
    const { project_id, project_type, scheduled_date } = req.body;

    // Find available crew
    const crew = await base('Crew')
      .select({
        filterByFormula: `AND(
          {Project Types} = "${project_type}",
          {Available} = TRUE()
        )`
      })
      .all();

    if (crew.length === 0) {
      return res.status(400).json({ error: 'No crew available for this project type' });
    }

    // Assign first available crew
    const assigned_crew = crew[0];

    // Update active project
    const projects = await base('Active Projects')
      .select({
        filterByFormula: `{Project ID} = "${project_id}"`
      })
      .all();

    if (projects.length > 0) {
      await base('Active Projects').update([
        {
          id: projects[0].id,
          fields: {
            'Assigned Crew': [assigned_crew.id],
            'Status': 'Crew Assigned'
          }
        }
      ]);
    }

    res.json({ 
      success: true, 
      assigned_crew: assigned_crew.fields.Name,
      crew_id: assigned_crew.id
    });
  } catch (error) {
    console.error('Crew assignment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// STAGE 7: Project Completion
// ============================================
router.post('/api/zapier/project-completed', async (req, res) => {
  try {
    const { project_id, completion_notes, photos } = req.body;

    // Update project status
    const projects = await base('Active Projects')
      .select({
        filterByFormula: `{Project ID} = "${project_id}"`
      })
      .all();

    if (projects.length > 0) {
      await base('Active Projects').update([
        {
          id: projects[0].id,
          fields: {
            'Status': 'Completed',
            'Completion Date': new Date().toISOString(),
            'Completion Notes': completion_notes,
            'Photos': photos || []
          }
        }
      ]);
    }

    // Send completion email to client
    // Trigger review request
    // etc...

    res.json({ success: true });
  } catch (error) {
    console.error('Completion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
router.get('/api/zapier/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
