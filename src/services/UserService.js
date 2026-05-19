import axiosInstance, { API_BASE_URL } from './UrlService'
import useUserStore from '../Store/useUserStore'

export const sendPhoneNumOtp = async (phoneNumber, fullName) => {
  try {
    const response = await axiosInstance.post('/auth/get-phone-otp', { phoneNumber, fullName })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const verifyPhoneOtp = async (phoneNumber, phoneOtp) => {
  try {
    const response = await axiosInstance.post('/auth/verify-phone-otp', { phoneNumber, phoneOtp })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const sendEmailOtpFun = async (email, password, phoneNumber) => {
  try {
    const response = await axiosInstance.post('/auth/register-email', { email, password, phoneNumber })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const verifyEmailOtp = async (email, otp) => {
  try {
    const response = await axiosInstance.post('/auth/verify-email', { email, otp })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const loginWithEmail = async (email, password) => {
  try {
    const response = await axiosInstance.post('/auth/email-login', {email, password})
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

export const updateUserProfile = async (updateData) => {
  try {
    const token = useUserStore.getState().token;
    const responsePromise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", `${API_BASE_URL}/update/profile`);
      
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const resData = JSON.parse(xhr.responseText);
            resolve(resData);
          } catch (err) {
            reject(new Error("Failed to parse response JSON"));
          }
        } else {
          reject(new Error(`Profile update failed with status: ${xhr.status}`));
        }
      };
      
      xhr.onerror = () => {
        reject(new Error("Network request failed (XHR)"));
      };
      
      xhr.ontimeout = () => {
        reject(new Error("Request timed out"));
      };

      xhr.send(updateData);
    });

    return await responsePromise;
  } catch (error) {
    throw { message: error.message };
  }
}

export const checkAuth = async () => {
  try {
    const token = useUserStore.getState().token;

    if (!token) {
      return { isAuthenticated: false, user: null };
    }

    const { data } = await axiosInstance.get('/update/check-auth');
    return { isAuthenticated: data.success, user: data.data || null };
    
  } catch (error) {
    const token = useUserStore.getState().token;
    
    if (!error?.response && token) {
      const user = useUserStore.getState().user;
      return { isAuthenticated: true, user };
    }
    
    throw error?.response?.data || { message: error.message };
  }
}

export const logOutUser = async () => {
  try {
    const response = await axiosInstance.get('/update/log-out')
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

export const getAllUser = async () => {
  try {
    const response = await axiosInstance.get('/users')
    return response.data
  } catch (error) {
    throw error?.response?.data || {message: error.message}
  }
}

