// utils/api.js - FINAL SECURE VERSION
const API_BASE = import.meta.env.DEV
  ? '/api'
  : 'https://koperasipkbatam.my.id/api';

const API_URL = import.meta.env.DEV
  ? `${API_BASE}/api.php`
  : 'https://koperasipkbatam.my.id/api/api.php';

const getToken = () => {
  const storageKey = import.meta.env.DEV ? 'dev_token' : 'token';
  return localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey) || null;
};

const setToken = (token, remember = false) => {
  const storageKey = import.meta.env.DEV ? 'dev_token' : 'token';
  if (remember) {
    localStorage.setItem(storageKey, token);
  } else {
    sessionStorage.setItem(storageKey, token);
  }
};

const removeToken = () => {
  const storageKey = import.meta.env.DEV ? 'dev_token' : 'token';
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);
};

// Helper untuk sanitize error messages
const sanitizeError = (error) => {
  if (typeof error !== 'string') return 'Operation failed';

  // Remove sensitive data patterns
  return error
    .replace(/token=['"][^'"]*['"]/gi, 'token=***')
    .replace(/password[^ ]*/gi, 'password=***')
    .replace(/JWT_SECRET[^ ]*/gi, 'SECRET=***')
    .replace(/id_rsa[^ ]*/gi, 'KEY=***')
    .replace(/['"{}[\]](.*token.*|.*password.*|.*secret.*|.*key.*)['"{}[\]]/gi, '***')
    .substring(0, 150); // Limit length
};

export async function api(action, method = "GET", body = null, params = null) {
  let url = `${API_URL}?action=${encodeURIComponent(action)}`;

  if (params && typeof params === 'object') {
    const queryParams = new URLSearchParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });
    const paramString = queryParams.toString();
    if (paramString) {
      url += "&" + paramString;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  const opts = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    signal: controller.signal
  };

  const token = getToken();
  if (token) {
    opts.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, opts);
    clearTimeout(timeoutId);

    if (response.status === 401) {
      removeToken();
      window.location.hash = "#/login";
      throw new Error("Session expired");
    }

    const text = await response.text();

    let data;
    try {
      data = text ? JSON.parse(text) : { success: false, error: "Empty response" };
    } catch (parseError) {
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      const safeError = sanitizeError(data.error || `Server error ${response.status}`);
      throw new Error(safeError);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error');
    }

    if (error.message.includes('Session expired')) {
      throw error;
    }

    throw new Error(sanitizeError(error.message));
  }
}

export { getToken, setToken, removeToken };