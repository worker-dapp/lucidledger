const API_BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to make HTTP requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    const contentType = response.headers.get('content-type') || '';
    let parsedBody = null;

    // Handle no-content responses explicitly
    if (response.status === 204 || response.status === 205) {
      parsedBody = null;
    } else if (contentType.includes('application/json')) {
      try {
        parsedBody = await response.json();
      } catch (_) {
        // Malformed or empty JSON body
        parsedBody = null;
      }
    } else {
      // Attempt to read as text for non-JSON responses
      try {
        const text = await response.text();
        parsedBody = text && text.length ? text : null;
      } catch (_) {
        parsedBody = null;
      }
    }

    if (!response.ok) {
      const message = (parsedBody && typeof parsedBody === 'object' && (parsedBody.error || parsedBody.message))
        || (typeof parsedBody === 'string' && parsedBody)
        || response.statusText
        || 'API request failed';
      throw new Error(message);
    }

    // Return a consistent shape expected by callers
    return { data: parsedBody };
  }

  // Note: profile updates are handled via /api/employers or /api/employees

  // Token helpers no longer used; Dynamic handles auth
}

export default new ApiClient(); 