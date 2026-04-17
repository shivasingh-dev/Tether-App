import axios from 'axios'
import useUserStore from '../Store/useUserStore';


const apiUrl = `http://10.122.167.250:8000/api/`


const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const token = useUserStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance
