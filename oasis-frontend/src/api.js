const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

async function fetchJSON(path, options = {}){
  const headers = options.headers || {};
  const token = localStorage.getItem('oasis_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await resp.text();
  try { return JSON.parse(text); } catch(e){ return text; }
}

export { API_BASE, fetchJSON };
