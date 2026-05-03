import { create } from 'zustand';
import Contacts from 'react-native-contacts';
import { PermissionsAndroid, Platform } from 'react-native';
import axiosInstance from '../Services/UrlService';

export const useContactStore = create((set, get) => ({
  contacts: [], // Local contacts from phone
  registeredContacts: [], // Users found on Tether
  contactMapping: {}, // { phoneNumber: localName }
  loading: false,

  syncContacts: async () => {
    set({ loading: true });
    try {
      const hasPermission = await get().requestPermission();
      if (!hasPermission) {
        set({ loading: false });
        return false;
      }

      // Fetch all local contacts
      const localContacts = await Contacts.getAll();
      
      const mapping = {};
      const phoneNumbers = [];

      localContacts.forEach(contact => {
        contact.phoneNumbers.forEach(phone => {
          // Clean number to 10 digits
          const cleaned = phone.number.replace(/\D/g, '').slice(-10);
          if (cleaned.length === 10) {
            mapping[cleaned] = contact.displayName || `${contact.givenName} ${contact.familyName}`.trim();
            phoneNumbers.push(cleaned);
          }
        });
      });

      set({ contactMapping: mapping, contacts: localContacts });

      // Call backend to find registered users
      if (phoneNumbers.length > 0) {
        const response = await axiosInstance.post('/update/get-mutual-users', { 
          phoneNumbers,
          contactMapping: mapping 
        });
        if (response.data.success) {
          set({ registeredContacts: response.data.data });
        }
      }

      set({ loading: false });
      return true;
    } catch (error) {
      console.error('Error syncing contacts:', error);
      set({ loading: false });
      return false;
    }
  },

  requestPermission: async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
        {
          title: 'Contacts Permission',
          message: 'Tether needs access to your contacts to show who is on the app.',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS permission handled by the library usually or through Info.plist
  },

  getLocalName: (phoneNumber) => {
    if (!phoneNumber) return null;
    const cleaned = phoneNumber.replace(/\D/g, '').slice(-10);
    return get().contactMapping[cleaned] || null;
  }
}));
