import axios from 'axios';

const api = axios.create({
    baseURL: 'https://chat-production-7ac6.up.railway.app'
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;