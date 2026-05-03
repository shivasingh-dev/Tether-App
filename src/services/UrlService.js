import axios from 'axios'
import useUserStore from '../Store/useUserStore';
import { getSocket } from './ChatServices';

// export const API_BASE_URL = `http://localhost:8000`;

export const API_BASE_URL = `https://tether-production-8bf7.up.railway.app`;


const apiUrl = `${API_BASE_URL}/`


const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  timeout: 30000, // 30 seconds
})

axiosInstance.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  const socket = getSocket();
  if (socket && socket.id) {
    config.headers['x-socket-id'] = socket.id;
  }
  
  return config;
});

export default axiosInstance
