export const safeFetch = async (url: string, options?: RequestInit) => {
  // In dev mode, prefer relative URL to utilize Vite proxy (-> http://localhost:5005)
  // unless an explicit localhost URL is specified in VITE_API_URL.
  const isDev = import.meta.env.DEV;
  const configuredApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  let baseUrl = '';
  if (!isDev) {
    baseUrl = configuredApiUrl || 'https://fixonroad-backend.onrender.com';
  } else if (configuredApiUrl && (configuredApiUrl.includes('localhost') || configuredApiUrl.includes('127.0.0.1'))) {
    baseUrl = configuredApiUrl;
  }

  const fullUrl = (url.startsWith('/api') && baseUrl) ? `${baseUrl}${url}` : url;
  const finalOptions = { ...options, credentials: 'include' as RequestCredentials };
  const res = await fetch(fullUrl, finalOptions);
  
  const contentType = res.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server returned unexpected format (Status: ${res.status}). Response: ${text.substring(0, 50)}...`);
  }

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error?.message || data.message || 'Request failed');
  }

  return data;
};
