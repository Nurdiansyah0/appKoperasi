import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Interceptor to add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor to handle unauthorized responses
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        // Sanitize error (as per previous requirement)
        const message = error.response?.data?.error || error.message;
        const sanitized = message.replace(/(token|password|SECRET|KEY|id_rsa)=[^&|\s]*/gi, '$1=***');

        return Promise.reject({ ...error, sanitizedMessage: sanitized });
    }
);

export default api;
