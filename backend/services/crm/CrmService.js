// services/crm/CrmService.js
// The booking/buying agent's hands. Turns a chatbot conversation outcome into a
// real row in the Sheet that backs the admin dashboard + calendar:
//
//   bookAppointment() → a "Potential deals" row whose Receive/Due Date is the
//                       booked date. The dashboard Calendar renders that date as
//                       an event the client sees.  (Apps Script action: addLead)
//
//   recordSale()      → a "Closed deals" row whose Activation Date is the sale
//                       date. The Calendar renders that as a green activation
//                       dot, and it shows on the Closed tab.  (action: moveToClosed)
//
// Both actions are ALREADY deployed in google/Code.gs — no Sheet redeploy needed.

import * as sheet from './SheetClient.js';
import env from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

export function isConfigured() {
  return sheet.isConfigured();
}

// Accept a few human date formats, normalize to yyyy-MM-dd (what the Sheet/calendar expect).
function normalizeDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value); // let the Sheet store it raw
  return d.toISOString().slice(0, 10);
}

function requireField(value, name) {
  if (!value || !String(value).trim()) {
    throw ApiError.badRequest(`Missing required field: ${name}`, { code: 'CRM_MISSING_FIELD' });
  }
  return String(value).trim();
}

/**
 * Book an appointment for the visitor — lands on the calendar the client sees.
 * @returns {Promise<{clientId:string, date:string, customerName:string}>}
 */
export async function bookAppointment(input = {}) {
  const customerName = requireField(input.customerName, 'customerName');
  const contact = requireField(input.contact, 'contact');
  const date = normalizeDate(requireField(input.date, 'date'));
  const service = input.service ? String(input.service).trim() : 'Appointment';

  // Pack the visitor's contact + reason into the "Need (prototype)" note so the
  // team has everything to follow up, and mark the source so it's clearly a
  // chatbot booking rather than a manually-added prospect.
  const note = [
    `📅 Booking via ${env.chatbot.agentName}`,
    `Contact: ${contact}`,
    input.notes ? `Notes: ${String(input.notes).trim()}` : '',
  ]
    .filter(Boolean)
    .join(' — ');

  const res = await sheet.call('addLead', {
    clientName: customerName,
    industry: input.industry || '',
    interestPackage: service,
    need: note,
    dueDate: date,
    status: 'Open',
  });

  const clientId = res?.row?.['Client ID'] || '';
  logger.info('Chatbot agent booked an appointment', { customerName, date, clientId });
  return { clientId, date, customerName, service };
}

/**
 * Record a completed sale — lands as a closed deal / activation on the calendar.
 * @returns {Promise<{clientId:string, package:string, activationDate:string}>}
 */
export async function recordSale(input = {}) {
  const customerName = requireField(input.customerName, 'customerName');
  const contact = requireField(input.contact, 'contact');
  const pkg = requireField(input.package, 'package');
  const activationDate = normalizeDate(input.activationDate || new Date());

  const res = await sheet.call('moveToClosed', {
    // No clientId → moveToClosed simply appends to "Closed deals" (the prospect
    // removal step finds nothing and no-ops), which is exactly what we want for a
    // brand-new sale the bot closed directly.
    clientName: customerName,
    industry: input.industry || '',
    packageBought: pkg,
    duration: input.duration || '',
    closer: env.chatbot.agentName,
    activationDate,
    endDate: input.endDate || '',
  });

  const clientId = res?.row?.['Client ID'] || '';
  logger.info('Chatbot agent recorded a sale', { customerName, pkg, activationDate, clientId, contact });
  return { clientId, package: pkg, activationDate, customerName };
}

export default { isConfigured, bookAppointment, recordSale };
