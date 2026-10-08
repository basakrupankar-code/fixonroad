export const safeFetch = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  
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
