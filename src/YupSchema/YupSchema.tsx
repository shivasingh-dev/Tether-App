import * as Yup from 'yup'

// User Sign Up Schema 


// Step - 1, Name + Phone Number
export const stepOneSchema = Yup.object({
  fullName: Yup.string().min(2, "Name too short").max(25, "Name too long").required("Please enter your full name"),
  phoneNumber: Yup.string().length(10, "Phone number must be 10 digits").required("Please enter your phone number")
})

// Step - 2, Phone number otp verify
export const stepTwoSchema = Yup.object({
  phoneOtp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .matches(/^[0-9]+$/, "Only numbers allowed")
    .required("Please enter OTP"),
})

// Step - 3, Email + password + confirm password
export const stepThreeSchema = Yup.object({
  email: Yup.string().email("Invalid Email address").required("Please enter your email"),

  password: Yup.string().min(6, "Password must be atleast 6 characters").matches(/[A-Z]/, "Must contain one uppercase letter").matches(/[0-9]/, "Must contain one number").required("Please enter a password").trim(),

  confirmPassword: Yup.string().oneOf([Yup.ref('password')], "Passwords do not match").required('Please enter confirm password')
})

// Step - 4 Email OTP Verify
export const stepFourSchema = Yup.object({
  emailOtp: Yup.string()
    .length(6, "OTP must be 6 digits")
    .matches(/^[0-9]+$/, "Only numbers allowed")
    .required("Please enter OTP"),
})

// Login Schema here 
export const loginSchema = Yup.object({
  email: Yup.string().email("Invalid Email address").required("Please enter your email"),
  password: Yup.string().required("Please enter a password").min(6, "Password must be atleast 6 characters"),
})

// profile validation schema 
export const userNameSchema = Yup.object({
  userName: Yup.string().required('user name is required'),
  agreed: Yup.bool().oneOf([true], "You must agree to the terms & conditions")
})


// Formik initial values are here

// Sign UP Process
// Step 1
export const stepOneInitialValues = {
  fullName: "",
  phoneNumber: "",
}

// Step 2
export const stepTwoInitialValues = {
  phoneOtp: "",
}

// Step 3
export const stepThreeInitialValues = {
  email: "",
  password: "",
  confirmPassword: "",
}

// Step 4
export const stepFourInitialValues = {
  emailOtp: "",
}

// Login
export const loginInitialValues = {
  email: "",
  password: "",
}