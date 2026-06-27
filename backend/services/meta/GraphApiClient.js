// services/meta/GraphApiClient.js
//
// The ONLY place in the entire backend that performs HTTP calls to Meta.
// Everything else (domain modules, MetaService, controllers) goes through here.
//
// Responsibilities:
//   - Build the base URL from configured host + version.
//   - Attach the right access token to every request (without leaking it).
//   - Normalize all failures through parseMetaError -> ApiError.
//
// It is deliberately "dumb": it knows how to talk to Graph, not what any
// particular endpoint means. Domain meaning lives in instagram.js / facebook.js.

import axios from 'axios';
import env from '../../config/env.js';
import logger from '../../utils/logger.js';
import { redact } from '../../utils/sanitize.js';
import { parseMetaError } from '../../utils/metaErrorParser.js';

export default class GraphApiClient {
  constructor({ baseUrl, version, defaultToken } = {}) {
    this.baseUrl = baseUrl || env.meta.graphBaseUrl;
    this.version = version || env.meta.graphVersion;
    this.defaultToken = defaultToken || env.meta.userAccessToken;

    this.http = axios.create({
      baseURL: `${this.baseUrl}/${this.version}`,
      timeout: 30000,
    });
  }

  /**
   * Core request. Token is injected into params here so callers never handle it.
   * @param {object} opts
   * @param {'get'|'post'|'delete'} opts.method
   * @param {string} opts.path     e.g. `/${igId}/media`
   * @param {object} [opts.params] query params (token added automatically)
   * @param {object} [opts.data]   request body (for POST)
   * @param {string} [opts.token]  override the default access token
   */
  async request({ method = 'get', path, params = {}, data = undefined, token }) {
    const accessToken = token || this.defaultToken;

    try {
      const response = await this.http.request({
        method,
        url: path,
        params: { ...params, access_token: accessToken },
        data,
      });
      return response.data;
    } catch (error) {
      // Log a redacted summary; surface a normalized ApiError to the caller.
      logger.error(`Meta ${method.toUpperCase()} ${path} failed`, {
        status: error?.response?.status,
        meta: redact(error?.response?.data),
      });
      throw parseMetaError(error);
    }
  }

  get(path, params, token) {
    return this.request({ method: 'get', path, params, token });
  }

  post(path, data, params, token) {
    return this.request({ method: 'post', path, params, data, token });
  }

  delete(path, params, token) {
    return this.request({ method: 'delete', path, params, token });
  }
}
