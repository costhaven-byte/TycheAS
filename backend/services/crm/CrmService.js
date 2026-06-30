// services/crm/CrmService.js
// The booking/buying agent's hands. Turns a chatbot conversation outcome into a
// real row in the CLIENT's Google Sheet via the multi-tenant Platform
// (google/Platform.gs). Every call is routed to a specific client by `clientId`:
//
//   bookAppointment() → a row on the client's "Bookings" tab (action: addBooking).
//                       The dashboard Calendar renders the date as a booking the
//                       client sees.
//
//   recordSale()      → a row on the client's "Sales" tab (action: recordSale).
//
// The Platform is deployed ONCE and serves all clients; adding a client never
// requires a redeploy. The backend authenticates with the ADMIN token, so it can
// write to any client's sheet.

import * as sheet from './SheetClient.js';
import env from '../../config/index.js';
import ApiError from '../../utils/ApiError.js';
import logger from '../../utils/logger.js';

// Configured only when we can reach the Platform AND know which client to write
// to. Without a clientId the agent stays FAQ-only (it won't promise a booking).
export function isConfigured() {
  return sheet.isConfigured() && Boolean(env.crm.clientId);
}

function resolveClientId(input) {
  const id = input.clientId || env.crm.clientId;
  if (!id) throw ApiError.badRequest('No clientId configured for bookings/sales.', { code: 'CRM_NO_CLIENT' });
  return id;
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
 * Book an appointment for the visitor — lands on the client's Bookings tab and
 * the dashboard calendar.
 * @returns {Promise<{bookingId:string, date:string, customerName:string, service:string}>}
 */
export async function bookAppointment(input = {}) {
  const clientId = resolveClientId(input);
  const customerName = requireField(input.customerName, 'customerName');
  const contact = requireField(input.contact, 'contact');
  const date = normalizeDate(requireField(input.date, 'date'));
  const service = input.service ? String(input.service).trim() : 'Appointment';

  const res = await sheet.call('addBooking', {
    clientId,
    name: customerName,
    contact,
    service,
    date,
    time: input.time || '',
    status: 'Booked',
    notes: input.notes || '',
    source: env.chatbot.agentName,
  });

  const bookingId = res?.row?.['Booking ID'] || '';
  logger.info('Chatbot agent booked an appointment', { clientId, customerName, date, bookingId });
  return { bookingId, date, customerName, service };
}

/**
 * Record a completed sale — lands on the client's Sales tab.
 * @returns {Promise<{saleId:string, item:string, date:string, customerName:string}>}
 */
export async function recordSale(input = {}) {
  const clientId = resolveClientId(input);
  const customerName = requireField(input.customerName, 'customerName');
  const contact = requireField(input.contact, 'contact');
  const item = requireField(input.package || input.item, 'package');
  const date = normalizeDate(input.activationDate || input.date || new Date());

  const res = await sheet.call('recordSale', {
    clientId,
    name: customerName,
    contact,
    item,
    amount: input.amount || '',
    date,
    notes: input.notes || '',
  });

  const saleId = res?.row?.['Sale ID'] || '';
  logger.info('Chatbot agent recorded a sale', { clientId, customerName, item, date, saleId });
  return { saleId, item, date, customerName };
}

export default { isConfigured, bookAppointment, recordSale };
