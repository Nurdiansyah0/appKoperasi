// utils/api.js - PERBAIKAN FINAL
const API_BASE = import.meta.env.DEV 
  ? '/api'  // ✅ Gunakan proxy path
  : 'https://koperasipkbatam.my.id/api';

const API_URL = import.meta.env.DEV 
  ? `${API_BASE}/api.php`  // ✅ Akan menjadi: /api/api.php → proxy → localhost:8000/api.php
  : 'https://koperasipkbatam.my.id/api/api.php';

console.log('🔧 API Configuration:', {
  environment: import.meta.env.DEV ? 'development' : 'production',
  apiUrl: API_URL
});

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

export async function api(action, method = "GET", body = null, params = null) {
  // Build URL dengan action sebagai parameter utama
  let url = `${API_URL}?action=${encodeURIComponent(action)}`;

  // Tambahkan parameter tambahan jika ada
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

  console.log('🎯 API Request:', url, method);
  if (params) console.log('📋 Request Params:', params);

  const opts = {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include' // ✅ Important untuk CORS
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
    
    console.log('📡 Response Status:', response.status, response.statusText);
    console.log('📡 Response URL:', response.url);

    // Handle unauthorized
    if (response.status === 401) {
      removeToken();
      window.location.hash = "#/login";
      throw new Error("Session expired - please login again");
    }

    const text = await response.text();
    console.log('📡 Raw Response:', text.substring(0, 500)); // Log first 500 chars
    
    let data;
    try {
      data = text ? JSON.parse(text) : { success: false, error: "Empty response" };
    } catch (parseError) {
      console.error('❌ JSON Parse Error:', parseError);
      console.error('❌ Raw text that failed to parse:', text);
      throw new Error(`Invalid JSON response from server: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.error || data.message || `HTTP error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("❌ API Error:", error);
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error - please check your connection');
    }
    
    throw error;
  }
}

export { getToken, setToken, removeToken };