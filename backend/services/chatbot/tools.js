// services/chatbot/tools.js
// The booking/buying agent's toolbox. These are the OpenAI/OpenRouter-format
// tool schemas the model can call, plus the executor that runs them against the
// CRM (the Sheet behind the dashboard calendar).
//
// Keep the schemas tight: the model only collects what each row needs. The
// system prompt (systemPrompt.js) tells it WHEN to ask for fields and WHEN to
// call. This file is the contract for HOW.

import * as crm from '../crm/CrmService.js';
import logger from '../../utils/logger.js';

// Tools are only offered to the model when the CRM is actually connected —
// otherwise the agent stays in FAQ-only mode and can't promise a booking it
// can't keep.
export function getToolDefinitions() {
  if (!crm.isConfigured()) return [];
  return [
    {
      type: 'function',
      function: {
        name: 'book_appointment',
        description:
          "Book an appointment/audit for the visitor. Adds it to the calendar the client sees. " +
          'Only call this once you have the visitor\'s name, a contact (phone or email), the date they want, and what it\'s for. Ask for anything missing first.',
        parameters: {
          type: 'object',
          properties: {
            customerName: { type: 'string', description: "The visitor's full name." },
            contact: { type: 'string', description: 'A phone number or email to reach them.' },
            date: { type: 'string', description: 'The appointment date (and time if given), e.g. "2026-07-03" or "next Tuesday 2pm".' },
            service: { type: 'string', description: 'What the appointment is for, e.g. "Free audit", "Quote", or a specific service.' },
            industry: { type: 'string', description: "The visitor's business type, if mentioned." },
            notes: { type: 'string', description: 'Any extra detail worth passing to the team.' },
          },
          required: ['customerName', 'contact', 'date', 'service'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'record_sale',
        description:
          'Record a completed sale when the visitor confirms they want to buy a specific package/product. ' +
          'Adds a closed deal to the calendar/pipeline the client sees. Only call this after the visitor has clearly committed and you have their name, a contact, and which package they chose.',
        parameters: {
          type: 'object',
          properties: {
            customerName: { type: 'string', description: "The buyer's full name." },
            contact: { type: 'string', description: 'A phone number or email.' },
            package: { type: 'string', description: 'The package or product they bought.' },
            duration: { type: 'string', description: 'Term length if applicable, e.g. "6 months".' },
            industry: { type: 'string', description: "The buyer's business type, if mentioned." },
            activationDate: { type: 'string', description: 'Start date; defaults to today if omitted.' },
            notes: { type: 'string', description: 'Any extra detail worth passing to the team.' },
          },
          required: ['customerName', 'contact', 'package'],
        },
      },
    },
  ];
}

/**
 * Run a tool call. Always resolves (never throws) so one failed tool can't kill
 * the whole chat turn — the model gets a structured result and can respond.
 * @param {string} name   the tool name the model called
 * @param {object} args   arguments the MODEL supplied (customer name, date, …)
 * @param {object} [ctx]  server-supplied context. ctx.clientId decides which
 *   client's sheet the booking/sale lands in — injected here, never model-chosen.
 * @returns {Promise<{ forModel: object, action: object|null }>}
 *   forModel: the JSON the model sees as the tool result.
 *   action:   a record of what actually happened, surfaced to the client UI.
 */
export async function executeTool(name, args = {}, ctx = {}) {
  try {
    if (name === 'book_appointment') {
      const r = await crm.bookAppointment({
        clientId: ctx.clientId,
        customerName: args.customerName,
        contact: args.contact,
        date: args.date,
        service: args.service,
        industry: args.industry,
        notes: args.notes,
      });
      return {
        forModel: { ok: true, booked: true, ...r },
        action: { type: 'booking', customerName: r.customerName, date: r.date, service: r.service, bookingId: r.bookingId },
      };
    }

    if (name === 'record_sale') {
      const r = await crm.recordSale({
        clientId: ctx.clientId,
        customerName: args.customerName,
        contact: args.contact,
        package: args.package,
        duration: args.duration,
        industry: args.industry,
        activationDate: args.activationDate,
        endDate: args.endDate,
        notes: args.notes,
      });
      return {
        forModel: { ok: true, sold: true, ...r },
        action: { type: 'sale', customerName: r.customerName, package: r.item, date: r.date, saleId: r.saleId },
      };
    }

    return { forModel: { ok: false, error: `Unknown tool: ${name}` }, action: null };
  } catch (err) {
    logger.warn('Chatbot tool execution failed', { tool: name, message: err?.message });
    // Give the model a clean, non-leaky reason so it can apologize and offer a
    // human follow-up instead of pretending it worked.
    return {
      forModel: { ok: false, error: err?.publicMessage || err?.message || 'Could not complete that action.' },
      action: null,
    };
  }
}

export default { getToolDefinitions, executeTool };
