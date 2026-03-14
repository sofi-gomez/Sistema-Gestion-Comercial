/**
 * Utilidad para realizar peticiones fetch al backend incluyendo 
 * automáticamente el header de autenticación si existe.
 */
const BASE_URL = process.env.REACT_APP_API_URL || "";

export const apiFetch = (endpoint, options = {}) => {
    const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

    const token = sessionStorage.getItem("token");

    const headers = { ...options.headers };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // No agregamos "Content-Type" si es un FormData (para uploads)
    if (!(options.body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
    }

    return fetch(url, { ...options, headers });
};
