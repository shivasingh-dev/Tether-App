import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import React, { useRef, useState, useEffect } from 'react';
import Feather from 'react-native-vector-icons/Feather';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { fontFamilies } from '../constants/fonts';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import { avatars } from '../Utils/data';
import useUserStore from '../Store/useUserStore';
import useThemeStore from '../Store/useThemeStore';
import {
  stepOneSchema,
  stepTwoSchema,
  stepThreeSchema,
  stepFourSchema,
  loginSchema,
} from '../YupSchema/YupSchema';
import { useFormik } from 'formik';
import {
  sendPhoneNumOtp,
  verifyPhoneOtp,
  sendEmailOtpFun,
  verifyEmailOtp,
  loginWithEmail,
  updateUserProfile,
} from '../Services/UserService';
import { ActivityIndicator } from 'react-native';
import Toast from 'react-native-toast-message';
import {
  stepOneInitialValues,
  stepTwoInitialValues,
  stepThreeInitialValues,
  stepFourInitialValues,
  loginInitialValues,
} from '../YupSchema/YupSchema';

export default function SignUpScreen({ navigation }) {
  const setUser = useUserStore(state => state.setUser);
  const stepOneFormik = useFormik({
    initialValues: stepOneInitialValues,
    validationSchema: stepOneSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true);
        setPhoneNumber(values.phoneNumber);
        setFullName(values.fullName);
        await sendPhoneNumOtp(values.phoneNumber, values.fullName);
        setSendPhoneOtp(true);
      } catch (error) {
        // setError(error.message)
        // console.error("Error in step 1 formik", error)
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const stepTwoFormik = useFormik({
    initialValues: stepTwoInitialValues,
    validationSchema: stepTwoSchema,
    onSubmit: async values => {
      const phoneOtpString = values.phoneOtp;
      if (!phoneOtpString || phoneOtpString.length < 6) {
        setError('Please enter complete 6 digit OTP');
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await verifyPhoneOtp(phoneNumber, phoneOtpString);
        if (response?.success) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Number verified successfully',
          });
          setIsVerifyPhoneOtp(true);
        }
      } catch (error) {
        // setError(error.message || "Number Verification failed")
        // console.error("Error in step 2 fomik", error)
        Toast.show({
          type: 'error',
          text1: 'failed',
          text2: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const stepThreeFormik = useFormik({
    initialValues: stepThreeInitialValues,
    validationSchema: stepThreeSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true);
        setEmail(values.email);
        const response = await sendEmailOtpFun(
          values.email,
          values.password,
          phoneNumber,
        );
        if (response?.success) {
          setSendEmailOtp(true);
        }
      } catch (error) {
        // setError(error.message)
        // console.error("Error in Formik step 3", error)
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const stepFourFormik = useFormik({
    initialValues: stepFourInitialValues,
    validationSchema: stepFourSchema,
    onSubmit: async values => {
      const emailOtpString = values.emailOtp;
      if (!emailOtpString || emailOtpString.length < 6) {
        setError('Please enter complete 6 digit OTP');
        return;
      }
      try {
        setIsLoading(true);
        const response = await verifyEmailOtp(email, emailOtpString);
        if (response?.success) {
          const userToken = response.Token || response.token;
          // Set just the token first, the user data will be fetched by checkAuth in StackNavigator or following checkAuth call
          setUser(null, userToken);
          
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'Email Verified',
          });
          setIsVerifyEmailOtp(true);
          navigation?.navigate('Home_Screen');
        }
      } catch (error) {
        // setError(error.message, "Email Verification failed")
        // console.error("Error in Step 4 formik", error)
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const loginFormik = useFormik({
    initialValues: loginInitialValues,
    validationSchema: loginSchema,
    onSubmit: async values => {
      try {
        setIsLoading(true);
        const response = await loginWithEmail(values.email, values.password);
        if (response.success) {
          const userData = response.user;
          setUser(userData, userData.token);
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: `Welcome back, ${userData.fullName || 'User'}`,
          });
        }
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Login Failed',
          text2: error.message || 'Invalid credentials',
        });
      } finally {
        setIsLoading(false);
      }
    },
  });

  const handleFileChange = e => {
    const file = e.target.files(0);
    if (file) {
      setProfilePictureFile(file);
      setProfilePicture(URL.createObjectURL(file));
    }
  };

  const onProfileSubmiit = async data => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('fullName', data.fullName);
      formData.append('agreed', data.agreed);
      if (profilePictureFile) {
        formData.append('media', profilePictureFile);
      } else {
        formData.append('profilePicture', selectedAvatar);
      }

      await updateUserProfile(formData);
      navigation?.navigate('Chat_List_Screen');
    } catch (error) {
      console.error('Error in onProfileSubmit', error);
    } finally {
      setIsLoading(false);
    }
  };

  const phoneRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const otp1Ref = useRef(null);
  const otp2Ref = useRef(null);
  const otp3Ref = useRef(null);
  const otp4Ref = useRef(null);
  const otp5Ref = useRef(null);
  const otp6Ref = useRef(null);

  const emailOtp1Ref = useRef(null);
  const emailOtp2Ref = useRef(null);
  const emailOtp3Ref = useRef(null);
  const emailOtp4Ref = useRef(null);
  const emailOtp5Ref = useRef(null);
  const emailOtp6Ref = useRef(null);

  const [signUp, setSignUp] = useState(true);
  const [sendPhoneOtp, setSendPhoneOtp] = useState(false);
  const [isVerifyPhoneOtp, setIsVerifyPhoneOtp] = useState(false);
  const [sendEmailOtp, setSendEmailOtp] = useState(false);
  const [isVerifyEmailOtp, setIsVerifyEmailOtp] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
  const [profilePictureFile, setProfilePictureFile] = useState(null);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { theme, setTheme } = useThemeStore();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);

  const [isFocused, setIsFocused] = useState('');

  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const currentStep = !sendPhoneOtp
    ? 1
    : !isVerifyPhoneOtp
    ? 2
    : !sendEmailOtp
    ? 3
    : 4;

  const startResendTimer = () => {
    setCanResend(false);
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendPhoneOtp = async () => {
    if (!canResend) return;
    try {
      setIsLoading(true);
      await sendPhoneNumOtp(phoneNumber, fullName);
      setPhoneOtp(['', '', '', '', '', '']);
      stepTwoFormik.resetForm();
      startResendTimer();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (!canResend) return;
    try {
      setIsLoading(true);
      await sendEmailOtpFun(
        email,
        stepThreeFormik.values.password,
        phoneNumber,
      );
      setEmailOtp(['', '', '', '', '', '']);
      stepFourFormik.resetForm();
      startResendTimer();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (sendPhoneOtp && !isVerifyPhoneOtp) {
      startResendTimer();
    }
    if (sendEmailOtp && !isVerifyEmailOtp) {
      startResendTimer();
    }
    return () => clearInterval(timerRef.current); // cleanup
  }, [sendPhoneOtp, sendEmailOtp]);

  const handlePhoneOtpChange = (val, index) => {
    const refs = [otp1Ref, otp2Ref, otp3Ref, otp4Ref, otp5Ref, otp6Ref];

    if (val === '') {
      const newOtp = [...phoneOtp];
      newOtp[index] = '';
      setPhoneOtp(newOtp);
      stepTwoFormik.setFieldValue('phoneOtp', newOtp.join(''));
      if (index > 0) {
        refs[index - 1].current.focus();
      }
      return;
    }

    const newOtp = [...phoneOtp];
    newOtp[index] = val;
    setPhoneOtp(newOtp);
    stepTwoFormik.setFieldValue('phoneOtp', newOtp.join(''));
    if (index < 5) {
      refs[index + 1].current.focus();
    }
  };

  const handleEmailOtpChange = (val, index) => {
    const refs = [
      emailOtp1Ref,
      emailOtp2Ref,
      emailOtp3Ref,
      emailOtp4Ref,
      emailOtp5Ref,
      emailOtp6Ref,
    ];

    if (val === '') {
      const newOtp = [...emailOtp];
      newOtp[index] = '';
      setEmailOtp(newOtp);
      stepFourFormik.setFieldValue('emailOtp', newOtp.join(''));
      if (index > 0) {
        refs[index - 1].current.focus();
      }
      return;
    }

    const newOtp = [...emailOtp];
    newOtp[index] = val;
    setEmailOtp(newOtp);
    stepFourFormik.setFieldValue('emailOtp', newOtp.join(''));
    if (index < 5) {
      refs[index + 1].current.focus();
    }
  };

  const handleBackFormStepTwo = () => {
    setSendPhoneOtp(false);
    stepOneFormik.resetForm();
    setPhoneOtp(['', '', '', '', '', '']);
    stepTwoFormik.resetForm();
  };

  const handleBackFormStepThree = () => {
    setIsVerifyPhoneOtp(false);
    stepTwoFormik.resetForm();
    setPhoneOtp(['', '', '', '', '', '']);
    stepThreeFormik.resetForm();
  };

  const handleBackFormStepFour = () => {
    setSendEmailOtp(false);
    stepThreeFormik.resetForm();
    setEmailOtp(['', '', '', '', '', '']);
    stepFourFormik.resetForm();
  };
  return (
    <SafeAreaView style={styles.outermost}>
      {signUp && (
        <>
          {/* Progress Bar */}
          <View style={styles.progressRow}>
            {[1, 2, 3, 4].map(s => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  { backgroundColor: s <= currentStep ? '#2979ff' : '#2E3A59' },
                ]}
              />
            ))}
          </View>

          {/* Step - 1, Name + Phone */}
          {!sendPhoneOtp && (
            <View>
              <View style={styles.userIconCover}>
                <Feather name="user" size={40} color="#1E90FF" />
              </View>
              <Text style={styles.headerText}>Create Account</Text>
              <Text style={styles.detailsText}>
                Enter your details to get started
              </Text>

              <Text style={styles.formText}>Full Name</Text>
              <View
                style={[
                  styles.inputRow,
                  { borderColor: isFocused === 'name' ? '#2979ff' : '#2E3A59' },
                ]}
              >
                <Feather name="user" size={20} color="#888" />
                <TextInput
                  onFocus={() => setIsFocused('name')}
                  onBlur={() => {
                    setIsFocused('');
                    stepOneFormik.setFieldTouched('fullName');
                    console.log('touched:', stepOneFormik.touched);
                    console.log('errors:', stepOneFormik.errors);
                    console.log('values:', stepOneFormik.values);
                  }}
                  placeholder="Enter your full name"
                  placeholderTextColor="#556080"
                  value={stepOneFormik.values.fullName}
                  onChangeText={stepOneFormik.handleChange('fullName')}
                  returnKeyType="next"
                  onSubmitEditing={() => phoneRef.current.focus()}
                  style={styles.inputInner}
                />
              </View>
              {stepOneFormik.touched.fullName &&
                stepOneFormik.errors.fullName && (
                  <Text style={styles.errorText}>
                    {stepOneFormik.errors.fullName}
                  </Text>
                )}

              <Text style={styles.formText}>Phone Number</Text>
              <View
                style={[
                  styles.phoneRow,
                  {
                    borderColor: isFocused === 'phone' ? '#2979ff' : '#2E3A59',
                  },
                ]}
              >
                <Text style={styles.countryCode}>🇮🇳 +91</Text>
                <View style={styles.divider} />
                <TextInput
                  ref={phoneRef}
                  onFocus={() => {
                    setIsFocused('phone');
                    stepOneFormik.setFieldTouched('phoneNumber');
                  }}
                  onBlur={() => setIsFocused('')}
                  returnKeyType="done"
                  placeholder="99XXXXXX99"
                  placeholderTextColor="#556080"
                  keyboardType="numeric"
                  value={stepOneFormik.values.phoneNumber}
                  onChangeText={stepOneFormik.handleChange('phoneNumber')}
                  style={styles.phoneInput}
                />
              </View>
              {stepOneFormik.touched.phoneNumber &&
                stepOneFormik.errors.phoneNumber && (
                  <Text style={styles.errorText}>
                    {stepOneFormik.errors.phoneNumber}
                  </Text>
                )}

              <TouchableOpacity
                activeOpacity={0.4}
                disabled={isLoading || !stepOneFormik.isValid}
                onPress={stepOneFormik.handleSubmit}
              >
                <LinearGradient
                  style={[
                    styles.otpCover,
                    (isLoading || !stepOneFormik.isValid) && { opacity: 0.5 },
                  ]}
                  colors={['#2979ff', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.otpBtn}>Sending</Text>
                    </View>
                  ) : (
                    <Text style={styles.otpBtn}>Send OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text
                style={[
                  styles.formText,
                  { marginTop: 25, textAlign: 'center' },
                ]}
              >
                Already have an account?{' '}
                <Text style={styles.link} onPress={() => setSignUp(false)}>
                  Login here
                </Text>
              </Text>
            </View>
          )}

          {/* Step - 2, Phone Number OTP Verify */}
          {sendPhoneOtp && !isVerifyPhoneOtp && (
            <View>
              <TouchableOpacity
                onPress={handleBackFormStepTwo}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color="#2979ff" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.userIconCover}>
                <Feather name="smartphone" size={40} color="#1E90FF" />
              </View>
              <Text style={styles.headerText}>Verify Number</Text>
              <Text style={styles.detailsText}>
                OTP sent to +91 {phoneNumber}
              </Text>

              <View style={styles.otpBoxRow}>
                {[otp1Ref, otp2Ref, otp3Ref, otp4Ref, otp5Ref, otp6Ref].map(
                  (ref, i) => (
                    <TextInput
                      key={i}
                      ref={ref}
                      style={[
                        styles.otpBox,
                        { borderColor: phoneOtp[i] ? '#2979ff' : '#2E3A59' },
                      ]}
                      maxLength={1}
                      keyboardType="numeric"
                      value={phoneOtp[i]}
                      onChangeText={val => handlePhoneOtpChange(val, i)}
                    />
                  ),
                )}
              </View>
              {stepTwoFormik.errors.phoneOtp && (
                <Text style={styles.errorText}>
                  {stepTwoFormik.errors.phoneOtp}
                </Text>
              )}

              <TouchableOpacity
                disabled={isLoading}
                activeOpacity={0.4}
                onPress={stepTwoFormik.handleSubmit}
              >
                <LinearGradient
                  style={[styles.otpCover, isLoading && { opacity: 0.5 }]}
                  colors={['#2979ff', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.otpBtn}>Verifying</Text>
                    </View>
                  ) : (
                    <Text style={styles.otpBtn}>Verify OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!canResend}
                onPress={handleResendPhoneOtp}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={[styles.link, !canResend && { color: '#556080' }]}>
                  {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/*  Step - 3, Email & Password */}
          {isVerifyPhoneOtp && !sendEmailOtp && (
            <View>
              <TouchableOpacity
                onPress={handleBackFormStepThree}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color="#2979ff" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.userIconCover}>
                <Feather name="mail" size={40} color="#1E90FF" />
              </View>
              <Text style={styles.headerText}>Set up Email</Text>
              <Text style={styles.detailsText}>
                This email will be used to log in on web
              </Text>

              <Text style={styles.formText}>Email</Text>

              <View
                style={[
                  styles.inputRow,
                  {
                    borderColor: isFocused === 'email' ? '#2979ff' : '#2E3A59',
                  },
                ]}
              >
                <Fontisto name="email" size={20} color="#888" />
                <TextInput
                  ref={emailRef}
                  onFocus={() => setIsFocused('email')}
                  onBlur={() => {
                    setIsFocused('');
                    stepThreeFormik.setFieldTouched('email');
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor="#556080"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={stepThreeFormik.values.email}
                  onChangeText={stepThreeFormik.handleChange('email')}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current.focus()}
                  style={styles.inputInner}
                />
              </View>
              {stepThreeFormik.touched.email &&
                stepThreeFormik.errors.email && (
                  <Text style={styles.errorText}>
                    {stepThreeFormik.errors.email}
                  </Text>
                )}

              <Text style={styles.formText}>Password</Text>
              <View
                style={[
                  styles.passwordRow,
                  {
                    borderColor:
                      isFocused === 'password' ? '#2979ff' : '#2E3A59',
                  },
                ]}
              >
                <Feather name="lock" size={20} color="#888" />
                <TextInput
                  ref={passwordRef}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => {
                    setIsFocused('');
                    stepThreeFormik.setFieldTouched('password');
                  }}
                  placeholder="Create password"
                  placeholderTextColor="#556080"
                  secureTextEntry={!showPassword}
                  value={stepThreeFormik.values.password}
                  onChangeText={stepThreeFormik.handleChange('password')}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current.focus()}
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              {stepThreeFormik.touched.password &&
                stepThreeFormik.errors.password && (
                  <Text style={styles.errorText}>
                    {stepThreeFormik.errors.password}
                  </Text>
                )}

              <Text style={styles.formText}>Confirm Password</Text>
              <View
                style={[
                  styles.passwordRow,
                  {
                    borderColor:
                      isFocused === 'confirm' ? '#2979ff' : '#2E3A59',
                  },
                ]}
              >
                <Feather name="lock" size={20} color="#888" />
                <TextInput
                  ref={confirmPasswordRef}
                  onFocus={() => setIsFocused('confirm')}
                  onBlur={() => {
                    setIsFocused('');
                    stepThreeFormik.setFieldTouched('confirmPassword');
                  }}
                  placeholder="Confirm password"
                  placeholderTextColor="#556080"
                  secureTextEntry={!showConfirmPassword}
                  value={stepThreeFormik.values.confirmPassword}
                  onChangeText={stepThreeFormik.handleChange('confirmPassword')}
                  returnKeyType="done"
                  style={styles.passwordInput}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeBtn}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#888"
                  />
                </TouchableOpacity>
              </View>
              {stepThreeFormik.touched.confirmPassword &&
                stepThreeFormik.errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {stepThreeFormik.errors.confirmPassword}
                  </Text>
                )}

              <TouchableOpacity
                disabled={isLoading || !stepThreeFormik.isValid}
                activeOpacity={0.4}
                onPress={stepThreeFormik.handleSubmit}
              >
                <LinearGradient
                  style={[
                    styles.otpCover,
                    (isLoading || !stepThreeFormik.isValid) && { opacity: 0.5 },
                  ]}
                  colors={['#2979ff', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.otpBtn}>Sending</Text>
                    </View>
                  ) : (
                    <Text style={styles.otpBtn}>Send Email OTP</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* Step - 4, Email OTP Verify */}
          {sendEmailOtp && !isVerifyEmailOtp && (
            <View>
              <TouchableOpacity
                onPress={handleBackFormStepFour}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color="#2979ff" />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>

              <View style={styles.userIconCover}>
                <MaterialIcons
                  name="mark-email-read"
                  size={35}
                  color="#2979ff"
                />
              </View>
              <Text style={styles.headerText}>Verify Email</Text>
              <Text style={styles.detailsText}>OTP sent to {email}</Text>

              <View style={styles.otpBoxRow}>
                {[
                  emailOtp1Ref,
                  emailOtp2Ref,
                  emailOtp3Ref,
                  emailOtp4Ref,
                  emailOtp5Ref,
                  emailOtp6Ref,
                ].map((ref, i) => (
                  <TextInput
                    key={i}
                    ref={ref}
                    style={[
                      styles.otpBox,
                      { borderColor: emailOtp[i] ? '#2979ff' : '#2E3A59' },
                    ]}
                    maxLength={1}
                    keyboardType="numeric"
                    value={emailOtp[i]}
                    onChangeText={val => handleEmailOtpChange(val, i)}
                  />
                ))}
              </View>
              {stepFourFormik.errors.emailOtp &&
                stepFourFormik.touched.emailOtp && (
                  <Text style={styles.errorText}>
                    {stepFourFormik.errors.emailOtp}
                  </Text>
                )}

              <TouchableOpacity
                disabled={isLoading}
                activeOpacity={0.4}
                onPress={stepFourFormik.handleSubmit}
              >
                <LinearGradient
                  style={[styles.otpCover, isLoading && { opacity: 0.5 }]}
                  colors={['#2979ff', '#7c3aed']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isLoading ? (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 10 }}
                      />
                      <Text style={styles.otpBtn}>Verifying</Text>
                    </View>
                  ) : (
                    <Text style={styles.otpBtn}>Verify & Finish</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!canResend}
                onPress={handleResendEmailOtp}
                style={{ marginTop: 16, alignItems: 'center' }}
              >
                <Text style={[styles.link, !canResend && { color: '#556080' }]}>
                  {canResend ? 'Resend OTP' : `Resend in ${resendTimer}s`}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/*  Login Form */}
      {!signUp && (
        <View>
          <TouchableOpacity
            onPress={() => setSignUp(true)}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={20} color="#2979ff" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <View style={styles.userIconCover}>
            <Feather name="log-in" size={40} color="#1E90FF" />
          </View>
          <Text style={styles.headerText}>Welcome Back</Text>
          <Text style={styles.detailsText}>
            Use the email & password you created during sign up
          </Text>

          <Text style={styles.formText}>Email</Text>
          <View
            style={[
              styles.inputRow,
              {
                borderColor: isFocused === 'loginEmail' ? '#2979ff' : '#2E3A59',
              },
            ]}
          >
            <Fontisto name="email" size={20} color="#888" />
            <TextInput
              onFocus={() => setIsFocused('loginEmail')}
              onBlur={() => setIsFocused('')}
              placeholder="you@example.com"
              placeholderTextColor="#556080"
              keyboardType="email-address"
              autoCapitalize="none"
              value={loginFormik.values.email}
              onChangeText={loginFormik.handleChange('email')}
              style={styles.inputInner}
            />
          </View>
          {loginFormik.errors.email && loginFormik.touched.email && (
            <Text style={styles.errorText}>{loginFormik.errors.email}</Text>
          )}

          <Text style={styles.formText}>Password</Text>
          <View
            style={[
              styles.passwordRow,
              {
                borderColor:
                  isFocused === 'loginPassword' ? '#2979ff' : '#2A3550',
              },
            ]}
          >
            <Feather name="lock" size={20} color="#888" />
            <TextInput
              onFocus={() => setIsFocused('loginPassword')}
              onBlur={() => {
                setIsFocused('');
                loginFormik.setFieldTouched('password');
              }}
              placeholder="Enter your password"
              placeholderTextColor="#556080"
              secureTextEntry={!showPassword}
              value={loginFormik.values.password}
              onChangeText={loginFormik.handleChange('password')}
              style={styles.passwordInput}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          {loginFormik.errors.password && loginFormik.touched.password && (
            <Text style={styles.errorText}>{loginFormik.errors.password}</Text>
          )}

          <TouchableOpacity
            disabled={isLoading || !loginFormik.isValid}
            activeOpacity={0.4}
            onPress={loginFormik.handleSubmit}
          >
            <LinearGradient
              style={[
                styles.otpCover,
                { opacity: isLoading || !loginFormik.isValid ? 0.6 : 1 },
              ]}
              colors={['#2979ff', '#7c3aed']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color="#fff"
                    style={{ marginRight: 10 }}
                  />
                  <Text style={styles.otpBtn}>Authenticating</Text>
                </View>
              ) : (
                <Text style={styles.otpBtn}>Login</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 16, alignItems: 'center' }}
            onPress={() => setSignUp(true)}
          >
            <Text style={styles.link}>Create new account</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outermost: {
    backgroundColor: '#121212',
    flex: 1,
    paddingHorizontal: 6,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 17,
    marginTop: 16,
    marginBottom: 4,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  userIconCover: {
    marginHorizontal: 17,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#0A1A3A',
    alignSelf: 'flex-start',
    marginVertical: 28,
  },
  headerText: {
    fontFamily: fontFamilies.bold,
    color: 'white',
    marginHorizontal: 17,
    fontSize: 25,
    marginBottom: 10,
  },
  detailsText: {
    color: colors.iconSecondary,
    fontSize: 16,
    marginHorizontal: 17,
    fontFamily: fontFamilies.medium,
    marginBottom: 25,
  },
  formText: {
    color: colors.iconPrimary,
    fontSize: 19,
    marginHorizontal: 17,
    marginTop: 10,
    fontFamily: fontFamilies.medium,
  },
  input: {
    backgroundColor: '#1E2130',
    marginHorizontal: 17,
    marginVertical: 15,
    fontFamily: fontFamilies.medium,
    borderRadius: 6,
    fontSize: 18,
    paddingLeft: 20,
    color: '#E2E8F0',
    borderWidth: 1.5,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2130',
    marginHorizontal: 17,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    paddingLeft: 14,
  },
  countryCode: {
    color: '#aaa',
    fontSize: 16,
    fontFamily: fontFamilies.medium,
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: '#2E3A59',
    marginHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 18,
    color: colors.iconPrimary,
    fontFamily: fontFamilies.medium,
    paddingVertical: 14,
    paddingRight: 14,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2130',
    marginHorizontal: 17,
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    paddingLeft: 20,
    gap: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 18,
    color: colors.iconPrimary,
    fontFamily: fontFamilies.medium,
    paddingVertical: 14,
  },
  eyeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  otpCover: {
    marginHorizontal: 17,
    marginTop: 20,
    paddingVertical: 9,
    borderRadius: 8,
  },
  otpBtn: {
    color: 'white',
    fontFamily: fontFamilies.bold,
    fontSize: 22,
    textAlign: 'center',
  },
  otpBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 25,
    marginBottom: 8,
  },
  otpBox: {
    width: 40,
    height: 55,
    backgroundColor: '#1a1a2e',
    borderWidth: 1.5,
    borderRadius: 10,
    color: 'white',
    fontSize: 24,
    fontFamily: fontFamilies.bold,
    textAlign: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 17,
    marginTop: 16,
  },
  backText: {
    color: '#2979ff',
    fontSize: 16,
    fontFamily: fontFamilies.medium,
  },
  link: {
    color: '#4d9fff',
    textDecorationLine: 'underline',
    fontSize: 16,
    fontFamily: fontFamilies.medium,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E2130',
    marginHorizontal: 17,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 6,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },
  inputInner: {
    flex: 1,
    fontSize: 18,
    color: '#E2E8F0',
    fontFamily: fontFamilies.medium,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 16,
    color: '#ff5252',
    marginHorizontal: 17,
  },
});
