// services/meta/messaging.js
//
// Messaging domain: Instagram DMs (via the Messenger Platform / Instagram API
// with Facebook Login), and future Messenger + WhatsApp.
//
// Reading and replying use the Page access token (derived from the configured
// token) plus the `instagram_manage_messages` permission. To RECEIVE inbound
// DMs in real time you also need a webhook (see controllers/webhookController).
//
// Conversation history is only exposed by Meta once the integration is live and
// the Instagram account has granted message access. If a call comes back empty
// or with a capability error, getConversations surfaces a clear explanation
// instead of a raw error.

const SETUP_STEPS = [
  'Grant the system-user/token the instagram_manage_messages permission.',
  'In the Instagram app: Settings → Messages → allow access to messages (connected tools).',
  'Deploy the backend to a public HTTPS URL.',
  'Register the webhook (callback /api/meta/webhook) and subscribe the Page.',
];

export function createMessaging({ client, pageId, igAccountId }) {
  // Page write/read for messaging needs a Page token; derive + cache it.
  let cachedPageToken = null;
  async function getPageToken() {
    if (cachedPageToken) return cachedPageToken;
    if (!pageId) throw new Error('FACEBOOK_PAGE_ID is not configured.');
    const data = await client.get(`/${pageId}`, { fields: 'access_token' });
    cachedPageToken = data.access_token;
    return cachedPageToken;
  }

  return {
    /**
     * List recent Instagram conversations for the connected Page.
     * Returns a structured requires_setup descriptor (no throw) if Meta reports
     * the integration isn't fully live yet.
     */
    async getConversations({ limit = 20 } = {}) {
      const token = await getPageToken();
      try {
        const data = await client.get(
          `/${pageId}/conversations`,
          {
            platform: 'instagram',
            fields:
              'id,updated_time,participants,messages.limit(5){id,from,message,created_time}',
            limit,
          },
          token
        );
        return {
          status: 'ok',
          count: (data.data || []).length,
          conversations: data.data || [],
          paging: data.paging ?? null,
        };
      } catch (err) {
        // Capability / not-live errors -> explain rather than fail hard.
        if (err?.code === 'MISSING_PERMISSION' || err?.details?.metaCode === 3) {
          return {
            status: 'requires_setup',
            reason:
              'Instagram messaging is not fully live yet (webhook + message access required).',
            setupSteps: SETUP_STEPS,
          };
        }
        throw err;
      }
    },

    /**
     * Send a message to an Instagram user. `recipientId` is the user's
     * Instagram-scoped ID (IGSID), obtained from a conversation or webhook event.
     * Must be within Meta's allowed messaging window (typically 24h).
     * @param {{ recipientId: string, message: string }} params
     */
    async sendReply({ recipientId, message }) {
      const token = await getPageToken();
      const data = await client.post(
        `/${pageId}/messages`,
        {
          recipient: { id: recipientId },
          message: { text: message },
          messaging_type: 'RESPONSE',
        },
        undefined,
        token
      );
      return { status: 'ok', recipientId, messageId: data.message_id ?? null };
    },
  };
}

export default createMessaging;
