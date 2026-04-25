import { useEffect } from 'react';
import { Keyboard } from 'react-native';

/**
 * useOutsideClick hook for React Native.
 * 
 * Note: In React Native, there is no global DOM to attach a "mousedown" listener to.
 * The standard and most reliable way to implement "click outside to close" for 
 * dropdowns and menus is to use a full-screen transparent <Modal> or wrap the 
 * screen in a <TouchableWithoutFeedback>.
 * 
 * In ChatScreen.jsx, we have used the <Modal transparent={true}> approach 
 * which natively handles outside clicks without needing this hook.
 * 
 * This hook is provided for consistency but is typically used to dismiss the keyboard.
 */
const useOutsideClick = (callback) => {
  useEffect(() => {
    // Optionally dismiss menu when keyboard hides
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      if (callback) callback();
    });

    return () => {
      hideSubscription.remove();
    };
  }, [callback]);
};

export default useOutsideClick;
