// controllers/adminController.js
// Internal admin endpoints (protected by the backend API key). Right now: one-call
// client provisioning, so onboarding a client is a single authenticated request
// instead of a raw Apps Script curl.

import asyncHandler from '../utils/asyncHandler.js';
import * as sheet from '../services/crm/SheetClient.js';
import ApiError from '../utils/ApiError.js';

/**
 * POST /api/admin/provision  { clientName, industry? }
 * Creates a new client's Google Sheet (Leads/Bookings/Sales/Config) via the
 * Platform and returns the identifiers the dashboard + widget need.
 */
export const provision = asyncHandler(async (req, res) => {
  const { clientName, industry } = req.body;
  if (!clientName || !String(clientName).trim()) {
    throw ApiError.badRequest('clientName is required.', { code: 'NO_CLIENT_NAME' });
  }
  if (!sheet.isConfigured()) {
    throw new ApiError(503, 'The platform is not connected (set APPS_SCRIPT_URL + CRM_API_TOKEN).', {
      code: 'CRM_NOT_CONFIGURED',
      isOperational: true,
    });
  }

  const data = await sheet.call('provision', {
    clientName: String(clientName).trim(),
    industry: industry ? String(industry).trim() : '',
  });

  // data.client = { clientId, name, spreadsheetId, url, token }
  res.status(201).json({ success: true, data: data.client });
});

export default { provision };
