import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
  withCredentials: true  // sends cookies with every request
});

// Auth
export const getMe = () => API.get('/auth/me');
export const logout = () => API.get('/auth/logout');

// Documents
export const getDocuments = () => API.get('/api/documents');
export const getDocument = (id) => API.get(`/api/documents/${id}`);
export const createDocument = (title) => API.post('/api/documents', { title });
export const updateDocument = (id, data) => API.put(`/api/documents/${id}`, data);
export const deleteDocument = (id) => API.delete(`/api/documents/${id}`);
export const getDocumentByShareId = (shareId) => API.get(`/api/documents/share/${shareId}`);

// Versions
export const getVersions = (docId) => API.get(`/api/documents/${docId}/versions`);

// Comments
export const getComments = (docId) => API.get(`/api/comments/${docId}`);
export const addComment = (docId, text) => API.post(`/api/comments/${docId}`, { text });
export const deleteComment = (commentId) => API.delete(`/api/comments/${commentId}`);