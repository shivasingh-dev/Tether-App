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
    const response = await axiosInstance.post('/update-profile', { updateData })
    return response.data
  } catch (error) {
    throw error?.response?.data || { message: error.message }
  }
}

export const checkAuth = async () => {
  try {
    const token = useUserStore.getState().token;
    console.log('=== CHECK AUTH TOKEN ===', token); // ← add karo
    const { data } = await axiosInstance.get('/auth/check-auth');
    console.log('=== CHECK AUTH RESPONSE ===', data); // ← add karo
    return { isAuthenticated: data.success, user: data.data || null };
  } catch (error) {
    console.log('=== CHECK AUTH ERROR ===', error); // ← add karo
    throw error?.response?.data || { message: error.message }
  }
}

export const logOutUser = async () => {
  try {
    const response = await axiosInstance.get('/auth/log-out')
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

