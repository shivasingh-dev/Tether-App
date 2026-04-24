import axios from 'axios'
import useUserStore from '../Store/useUserStore';
import { getSocket } from './ChatServices';

export const API_BASE_URL = `http://localhost:8000`;
const apiUrl = `${API_BASE_URL}/api/`


const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
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
