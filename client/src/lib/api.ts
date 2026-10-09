export const safeFetch = async (url: string, options?: RequestInit) => {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  const fullUrl = url.startsWith('/api') ? `${baseUrl}${url}` : url;
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
