// services/meta/instagram.js
//
// Instagram domain logic. Each function receives the shared GraphApiClient and
// the configured Instagram Business account id. No HTTP here — only Graph paths
// and field selection. Returned objects are shaped for the frontend.

const PROFILE_FIELDS = [
  'id',
  'username',
  'name',
  'biography',
  'followers_count',
  'follows_count',
  'media_count',
  'profile_picture_url',
  'website',
].join(',');

/**
 * Poll an IG media container's status_code until it is FINISHED (ready to
 * publish). Throws if it ERRORs or doesn't finish within the timeout.
 * Image containers usually finish in 1-3s; we poll a handful of times.
 */
async function waitForContainerReady(client, containerId, { attempts = 10, delayMs = 1500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const status = await client.get(`/${containerId}`, { fields: 'status_code,status' });
    if (status.status_code === 'FINISHED') return;
    if (status.status_code === 'ERROR') {
      const err = new Error(`Instagram could not process the image (${status.status || 'ERROR'}).`);
      err.statusCode = 400;
      throw err;
    }
    // IN_PROGRESS / EXPIRED-not-yet — wait and retry.
    await new Promise((r) => setTimeout(r, delayMs));
  }
  const err = new Error('Instagram media container did not finish processing in time.');
  err.statusCode = 504;
  throw err;
}

export function createInstagram({ client, igAccountId }) {
  function ensureId() {
    if (!igAccountId) {
      throw new Error('INSTAGRAM_ACCOUNT_ID is not configured.');
    }
  }

  return {
    /** Basic Instagram Business profile + stats. */
    async getProfile() {
      ensureId();
      const data = await client.get(`/${igAccountId}`, { fields: PROFILE_FIELDS });
      return {
        id: data.id,
        username: data.username,
        name: data.name ?? null,
        biography: data.biography ?? null,
        followersCount: data.followers_count ?? 0,
        followsCount: data.follows_count ?? 0,
        mediaCount: data.media_count ?? 0,
        profilePictureUrl: data.profile_picture_url ?? null,
        website: data.website ?? null,
      };
    },

    /**
     * Publish a single image post. Three-step Graph flow:
     *   1) create a media container (image_url + caption)
     *   2) poll the container until Instagram finishes fetching the image
     *      (publishing too early fails with "Media ID is not available")
     *   3) publish the container
     * @param {{ imageUrl: string, caption?: string }} params
     */
    async publishImage({ imageUrl, caption = '' }) {
      ensureId();

      // Step 1 — create container.
      const container = await client.post(`/${igAccountId}/media`, null, {
        image_url: imageUrl,
        caption,
      });

      // Step 2 — wait for the container to become FINISHED before publishing.
      await waitForContainerReady(client, container.id);

      // Step 3 — publish container.
      const published = await client.post(`/${igAccountId}/media_publish`, null, {
        creation_id: container.id,
      });

      return {
        published: true,
        mediaId: published.id,
        containerId: container.id,
      };
    },

    /**
     * Recent comments across recent media. Graph has no "all comments" endpoint,
     * so we pull recent media and expand their comments in one call.
     * @param {{ mediaLimit?: number }} [opts]
     */
    async getRecentComments({ mediaLimit = 10 } = {}) {
      ensureId();
      const data = await client.get(`/${igAccountId}/media`, {
        fields:
          'id,caption,permalink,timestamp,comments{id,text,username,timestamp,like_count}',
        limit: mediaLimit,
      });

      const media = data.data || [];
      const comments = [];
      for (const m of media) {
        for (const c of m.comments?.data || []) {
          comments.push({
            commentId: c.id,
            text: c.text,
            username: c.username,
            timestamp: c.timestamp,
            likeCount: c.like_count ?? 0,
            mediaId: m.id,
            mediaPermalink: m.permalink ?? null,
          });
        }
      }
      // Newest first.
      comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { count: comments.length, comments };
    },

    /**
     * Reply to a specific Instagram comment.
     * @param {{ commentId: string, message: string }} params
     */
    async replyToComment({ commentId, message }) {
      const data = await client.post(`/${commentId}/replies`, null, { message });
      return { replied: true, replyId: data.id ?? null, commentId };
    },
  };
}

export default createInstagram;
