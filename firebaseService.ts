// Function to clean and normalize the URL
export const cleanUrl = (input: string): string => {
  let url = input.trim();
  url = url.replace(/\/+$/, '');
  url = url.replace(/\.json$/, '');

  const isProjectId = /^[a-z0-9-]+$/i.test(url);
  if (isProjectId) {
    return `https://${url}.firebaseio.com`;
  }

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  return url;
};

// Helper to safely encode paths
const buildEndpoint = (baseUrl: string, path: string): string => {
  const cleanBase = cleanUrl(baseUrl);
  if (!path) return `${cleanBase}/.json`;
  
  // Clean path: remove leading slashes to prevent double slashes
  const cleanPath = path.replace(/^\/+/, '');
  const encodedPath = cleanPath.split('/').map(segment => encodeURIComponent(segment)).join('/');
  return `${cleanBase}/${encodedPath}.json`;
};

// Check connection
export const checkConnection = async (url: string): Promise<boolean> => {
  const target = `${cleanUrl(url)}/.json?shallow=true`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(target, { 
      signal: controller.signal,
      cache: 'no-store' // Prevent caching
    });
    clearTimeout(timeoutId);

    if (res.ok) return true;

    if (res.status === 401) throw new Error("⛔ Permission Denied (401): Database rules prevent reading.");
    if (res.status === 404) throw new Error("❌ Database Not Found (404): Check your Project ID.");
    if (res.status === 400) throw new Error("⚠️ Bad Request (400): Invalid URL format.");

    throw new Error(`⚠️ Connection Error: ${res.status}`);
  } catch (error: any) {
    if (error.name === 'AbortError') throw new Error("⏱️ Timeout: Server took too long.");
    if (error.message.startsWith('⛔') || error.message.startsWith('❌') || error.message.startsWith('⚠️')) throw error;
    throw new Error(`🌐 Network Error: ${error.message}`);
  }
};

// Read data
export const readData = async (baseUrl: string, path: string = ''): Promise<any> => {
  const endpoint = buildEndpoint(baseUrl, path);
  
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Permission Denied (401)");
      throw new Error(`Failed to read data: ${res.statusText}`);
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch data");
  }
};

// Write (PUT)
export const writeData = async (baseUrl: string, path: string, data: any): Promise<void> => {
  const endpoint = buildEndpoint(baseUrl, path);

  try {
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store'
    });

    if (!res.ok) {
        if (res.status === 401) throw new Error("Permission Denied (401)");
        throw new Error(`Failed to write data: ${res.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to write data");
  }
};

// Update (PATCH)
export const updateData = async (baseUrl: string, path: string, data: any): Promise<void> => {
  const endpoint = buildEndpoint(baseUrl, path);

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      cache: 'no-store'
    });

    if (!res.ok) {
        if (res.status === 401) throw new Error("Permission Denied (401)");
        throw new Error(`Failed to update data: ${res.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to update data");
  }
};

// Delete (DELETE)
export const deleteData = async (baseUrl: string, path: string): Promise<void> => {
  const endpoint = buildEndpoint(baseUrl, path);

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      cache: 'no-store'
    });

    if (!res.ok) {
        if (res.status === 401) throw new Error("Permission Denied (401): Delete blocked.");
        throw new Error(`Failed to delete data: ${res.statusText}`);
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete data");
  }
};