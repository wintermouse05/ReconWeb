import { API_BASE_URL } from '../config';

const buildHeaders = (token, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text ? { message: text } : {};
};

export const apiRequest = async (path, { method = 'GET', body, token, headers = {}, responseType } = {}) => {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const requestInit = {
    method,
    headers: buildHeaders(token, headers),
    credentials: 'include',
  };

  if (body !== undefined) {
    requestInit.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const response = await fetch(url, requestInit);

  if (!response.ok) {
    const errorPayload = await parseResponse(response);
    const error = new Error(errorPayload.message || 'Request failed');
    error.status = response.status;
    error.payload = errorPayload;
    throw error;
  }

  if (responseType === 'blob') {
    return response.blob();
  }

  if (responseType === 'text') {
    return response.text();
  }

  return parseResponse(response);
};
