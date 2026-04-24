import axiosInstance from './UrlService'
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
    const response = await axiosInstance.put('/update/profile', updateData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
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

