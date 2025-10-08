// src/utils/api.js - PERBAIKAN
const API_URL = "https://koperasipkbatam.my.id/api/api.php";

const getToken = () => {
  return (
    localStorage.getItem("token") || sessionStorage.getItem("token") || null
  );
};

export async function api(action, method = "GET", body = null, params = null) {
  // Build URL dengan parameter
  let url = `${API_URL}?action=${encodeURIComponent(action)}`;

  if (params) {
    const queryParams = new URLSearchParams(params);
    url += "&" + queryParams.toString();
  }

  const opts = {
    method,
    headers: {
      Accept: "application/json",
    },
    credentials: "include", // Penting untuk CORS dengan credentials
  };

  // Add Authorization header
  const token = getToken();
  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }

  // Add body untuk POST/PUT/PATCH
  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(url, opts);

    // Handle unauthorized
    if (response.status === 401) {
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      window.location.hash = "#/login";
      throw new Error("Session expired");
    }

    // Parse response
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `HTTP error ${response.status}`
      );
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}
