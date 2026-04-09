import axios from 'axios'


const apiUrl = `http://localhost:8000/api/`


const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
})

axiosInstance.interceptors.request.use((config) => {
  const user = useUserStore.getState().user;
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

export default axiosInstance
