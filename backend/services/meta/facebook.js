// services/meta/facebook.js
//
// Facebook Page domain logic. Page write actions generally need a *Page* access
// token. If FACEBOOK_PAGE_ACCESS_TOKEN is configured we use it; otherwise we
// fall back to the default user token and let Meta's error surface clearly.

const PAGE_FIELDS = [
  'id',
  'name',
  'about',
  'category',
  'fan_count',
  'followers_count',
  'link',
  'username',
  'picture{url}',
].join(',');

export function createFacebook({ client, pageId, pageToken }) {
  function ensureId() {
    if (!pageId) {
      throw new Error('FACEBOOK_PAGE_ID is not configured.');
    }
  }

  // Page WRITE actions (publishing, replying) require a Page access token, not a
  // user/system-user token. If one isn't configured explicitly, we derive it
  // from the page itself using the default token and cache it for the process.
  // (A system-user/user token with pages_show_list can mint the Page token.)
  let cachedPageToken = pageToken || null;
  async function getPageToken() {
    if (cachedPageToken) return cachedPageToken;
    ensureId();
    const data = await client.get(`/${pageId}`, { fields: 'access_token' });
    if (!data.access_token) {
      throw new Error(
        'Could not obtain a Facebook Page access token. Ensure the token can manage the Page.'
      );
    }
    cachedPageToken = data.access_token;
    return cachedPageToken;
  }

  return {
    /** Basic Facebook Page profile + stats. */
    async getPage() {
      ensureId();
      const token = await getPageToken();
      const data = await client.get(`/${pageId}`, { fields: PAGE_FIELDS }, token);
      return {
        id: data.id,
        name: data.name,
        username: data.username ?? null,
        about: data.about ?? null,
        category: data.category ?? null,
        fanCount: data.fan_count ?? 0,
        followersCount: data.followers_count ?? 0,
        link: data.link ?? null,
        pictureUrl: data.picture?.data?.url ?? null,
      };
    },

    /**
     * Publish a post to the Page. Supports text-only and image posts.
     *   - text only:  POST /{page-id}/feed  { message }
     *   - with image: POST /{page-id}/photos { url, caption }
     * @param {{ message?: string, imageUrl?: string }} params
     */
    async publishPost({ message = '', imageUrl } = {}) {
      ensureId();
      const token = await getPageToken();

      if (imageUrl) {
        const data = await client.post(
          `/${pageId}/photos`,
          null,
          { url: imageUrl, caption: message },
          token
        );
        return {
          published: true,
          type: 'photo',
          postId: data.post_id ?? null,
          photoId: data.id ?? null,
        };
      }

      const data = await client.post(`/${pageId}/feed`, null, { message }, token);
      return { published: true, type: 'text', postId: data.id ?? null };
    },

    /**
     * Recent comments across recent Page posts.
     * @param {{ postLimit?: number }} [opts]
     */
    async getRecentComments({ postLimit = 10 } = {}) {
      ensureId();
      const token = await getPageToken();
      const data = await client.get(
        `/${pageId}/posts`,
        {
          fields: 'id,message,created_time,comments{id,message,from,created_time}',
          limit: postLimit,
        },
        token
      );

      const posts = data.data || [];
      const comments = [];
      for (const p of posts) {
        for (const c of p.comments?.data || []) {
          comments.push({
            commentId: c.id,
            message: c.message,
            from: c.from?.name ?? null,
            createdTime: c.created_time,
            postId: p.id,
          });
        }
      }
      comments.sort((a, b) => new Date(b.createdTime) - new Date(a.createdTime));
      return { count: comments.length, comments };
    },

    /**
     * Reply to a Page comment.
     * @param {{ commentId: string, message: string }} params
     */
    async replyToComment({ commentId, message }) {
      const token = await getPageToken();
      const data = await client.post(`/${commentId}/comments`, null, { message }, token);
      return { replied: true, replyId: data.id ?? null, commentId };
    },
  };
}

export default createFacebook;
