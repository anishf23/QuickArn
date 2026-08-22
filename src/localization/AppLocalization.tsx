import AsyncStorage from '@react-native-async-storage/async-storage';
import { Children, createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Text as NativeText, type TextProps } from 'react-native';

export type AppLanguage = 'en' | 'gu';

type LocalizationContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (value: string) => string;
};

const LANGUAGE_STORAGE_KEY = '@quickarn/language';

const gujaratiStrings: Record<string, string> = {
  'Home': 'હોમ', 'Post': 'પોસ્ટ', 'Chat': 'ચેટ', 'Profile': 'પ્રોફાઇલ',
  'Select Location': 'સ્થાન પસંદ કરો', 'Select Language': 'ભાષા પસંદ કરો',
  'Choose your language': 'તમારી ભાષા પસંદ કરો', 'You can change this anytime from Profile settings.': 'તમે પ્રોફાઇલ સેટિંગ્સમાંથી આ કોઈપણ સમયે બદલી શકો છો.',
  'English': 'અંગ્રેજી', 'Gujarati': 'ગુજરાતી', 'Continue': 'આગળ વધો', 'Save Language': 'ભાષા સાચવો',
  'Fetching location...': 'સ્થાન શોધી રહ્યા છીએ...', 'Please wait while we find your current location.': 'અમે તમારું વર્તમાન સ્થાન શોધીએ ત્યાં સુધી રાહ જુઓ.',
  'Location unavailable': 'સ્થાન ઉપલબ્ધ નથી', 'Current location': 'વર્તમાન સ્થાન',
  'You are Online': 'તમે ઓનલાઈન છો', 'You are Offline': 'તમે ઑફલાઈન છો', 'Ready to receive jobs': 'કામ મેળવવા માટે તૈયાર', 'Turn on to receive jobs': 'કામ મેળવવા માટે ચાલુ કરો',
  'Total Earning': 'કુલ કમાણી', 'Jobs\nCompleted': 'પૂર્ણ થયેલા\nકામ', 'Rating': 'રેટિંગ', 'Nearby Jobs': 'નજીકના કામ', 'View All': 'બધા જુઓ',
  'My Skills': 'મારી કુશળતાઓ', 'My Portfolio': 'મારું પોર્ટફોલિયો', 'My Earnings': 'મારી કમાણી', 'My Bids': 'મારી બિડ', 'Wallet': 'વોલેટ', 'Language': 'ભાષા', 'Settings': 'સેટિંગ્સ', 'Help & Support': 'મદદ અને સપોર્ટ',
  'VERIFICATION': 'ચકાસણી', 'Verify': 'ચકાસો', 'Verify Aadhaar': 'આધાર ચકાસો', 'Take a Selfie': 'સેલ્ફી લો', 'Add Bank Account': 'બેંક એકાઉન્ટ ઉમેરો',
  'Verify your identity securely with Aadhaar': 'આધાર સાથે તમારી ઓળખ સુરક્ષિત રીતે ચકાસો', 'Required to confirm your identity': 'ઓળખની પુષ્ટિ માટે જરૂરી', 'Add your bank details for secure payments': 'સુરક્ષિત ચુકવણી માટે બેંક વિગતો ઉમેરો',
  'Edit Profile': 'પ્રોફાઇલ સંપાદિત કરો', 'Full Name': 'પૂરું નામ', 'Phone Number': 'ફોન નંબર', 'Email Address': 'ઈમેઇલ સરનામું', 'Gender': 'લિંગ', 'Male': 'પુરુષ', 'Female': 'સ્ત્રી', 'Other': 'અન્ય', 'About You': 'તમારા વિશે', 'Save Changes': 'ફેરફારો સાચવો',
  'Job Details': 'કામની વિગતો', 'Select Category': 'શ્રેણી પસંદ કરો', 'Title': 'શીર્ષક', 'Description': 'વર્ણન', 'Date & Time': 'તારીખ અને સમય', 'Job close Date & Time': 'કામ બંધ થવાની તારીખ અને સમય', 'Job Priority': 'કામની પ્રાથમિકતા', 'High': 'ઉચ્ચ', 'Medium': 'મધ્યમ', 'Low': 'નીચું', 'Next': 'આગળ', 'Review Your Job': 'તમારું કામ તપાસો', 'Publish Job': 'કામ પ્રકાશિત કરો', 'Location & Budget': 'સ્થાન અને બજેટ', 'Pickup Location': 'પિકઅપ સ્થાન', 'Drop Location': 'ડ્રોપ સ્થાન', 'Budget (₹)': 'બજેટ (₹)',
  'Browse Jobs': 'કામ જુઓ', 'Search jobs, skills or category': 'કામ, કુશળતા અથવા શ્રેણી શોધો', 'Place Bid': 'બિડ મૂકો', 'Place Your Bid': 'તમારી બિડ મૂકો', 'Submit Bid': 'બિડ સબમિટ કરો',
  'Notifications': 'સૂચનાઓ', 'Personal Profile': 'વ્યક્તિગત પ્રોફાઇલ', 'Skills': 'કુશળતાઓ', 'About': 'વિશે', 'Rate and Review': 'રેટિંગ અને સમીક્ષા', 'Submit Review': 'સમીક્ષા સબમિટ કરો', 'Verified': 'ચકાસાયેલ',
  'Profile Verification': 'પ્રોફાઇલ ચકાસણી', 'Select Your Skills': 'તમારી કુશળતાઓ પસંદ કરો', 'Verify Your Identity': 'તમારી ઓળખ ચકાસો', 'Review & Submit': 'તપાસો અને સબમિટ કરો', 'Back': 'પાછળ',
  'My Wallet': 'મારું વોલેટ', 'Available Balance': 'ઉપલબ્ધ બેલેન્સ', 'Add Money': 'પૈસા ઉમેરો', 'Transaction History': 'લેવડદેવડ ઇતિહાસ',
  'Delivery': 'ડિલિવરી', 'Driver': 'ડ્રાઇવર', 'Driving': 'ડ્રાઇવિંગ', 'Cooking': 'રસોઈ', 'Cleaning': 'સફાઈ', 'Plumber': 'પ્લમ્બર', 'Plumbing': 'પ્લમ્બિંગ', 'Electrical': 'ઇલેક્ટ્રિકલ', 'Repairs': 'મરામત', 'Home Services': 'ઘર સેવાઓ', 'Home\nServices': 'ઘર\nસેવાઓ', 'Moving': 'સ્થળાંતર', 'More': 'વધુ',
  'Need Delivery Boy': 'ડિલિવરી બોય જોઈએ', 'Need Delivery Boy for Documents': 'દસ્તાવેજો માટે ડિલિવરી બોય જોઈએ', 'Driver for 4 Hours': '4 કલાક માટે ડ્રાઇવર', 'Need Plumber': 'પ્લમ્બર જોઈએ', 'New job nearby': 'નજીક નવું કામ', 'Bid accepted': 'બિડ સ્વીકારવામાં આવી', 'Payment received': 'ચુકવણી મળી', 'Rate your experience': 'તમારો અનુભવ રેટ કરો', 'Today': 'આજે',
  'Job Posted': 'કામ પ્રકાશિત થયું', 'Your job has been posted successfully!': 'તમારું કામ સફળતાપૂર્વક પ્રકાશિત થયું છે!', 'View Job': 'કામ જુઓ', 'Go to Home': 'હોમ પર જાઓ', 'Open': 'ચાલુ', 'Posted by': 'દ્વારા પોસ્ટ કરેલ', 'Skills Required': 'જરૂરી કુશળતાઓ',
  'Search locality, sector, area': 'વિસ્તાર, સેક્ટર અથવા લોકાલિટી શોધો', 'Add address': 'સરનામું ઉમેરો', 'Use current location': 'વર્તમાન સ્થાન વાપરો', 'SAVED ADDRESSES': 'સાચવેલા સરનામા', 'RECENT SEARCHES': 'તાજેતરની શોધ', 'Search Results': 'શોધ પરિણામો', 'No saved addresses yet.': 'હજુ કોઈ સરનામું સાચવેલ નથી.', 'No matching addresses found.': 'મેળ ખાતું સરનામું મળ્યું નથી.',
  'Save address as': 'સરનામું આ રીતે સાચવો', 'Cancel': 'રદ કરો', 'Work': 'કામ', 'Tap to change profile photo': 'પ્રોફાઇલ ફોટો બદલવા માટે ટૅપ કરો',
  'Your Bid Amount (₹)': 'તમારી બિડ રકમ (₹)', 'Add Message (Optional)': 'સંદેશ ઉમેરો (વૈકલ્પિક)', 'Congratulations!': 'અભિનંદન!', 'Job Accepted': 'કામ સ્વીકારવામાં આવ્યું', 'Back To Home': 'હોમ પર પાછા જાઓ', 'Go to Chat': 'ચેટ પર જાઓ', 'View Job Details': 'કામની વિગતો જુઓ',
  'Account Holder Name': 'એકાઉન્ટ ધારકનું નામ', 'Account Number': 'એકાઉન્ટ નંબર', 'IFSC Code': 'IFSC કોડ', 'UPI ID': 'UPI ID', 'Popular Skills': 'લોકપ્રિય કુશળતાઓ', 'Add More Skills': 'વધુ કુશળતાઓ ઉમેરો', 'Save & Continue': 'સાચવો અને આગળ વધો', 'Submit Verification': 'ચકાસણી સબમિટ કરો',
  'Rank #12': 'ક્રમ #12', 'How was your experience with Ravi?': 'રવિ સાથે તમારો અનુભવ કેવો રહ્યો?', 'Write a short review (optional)': 'ટૂંકી સમીક્ષા લખો (વૈકલ્પિક)', 'Thank you for your review!': 'તમારી સમીક્ષા માટે આભાર!',
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then(storedLanguage => {
      if (storedLanguage === 'en' || storedLanguage === 'gu') {
        setLanguageState(storedLanguage);
      }
    }).catch(() => {});
  }, []);

  const value = useMemo<LocalizationContextValue>(() => ({
    language,
    setLanguage: nextLanguage => {
      setLanguageState(nextLanguage);
      AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage).catch(() => {});
    },
    t: text => language === 'gu' ? gujaratiStrings[text] ?? text : text,
  }), [language]);

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used inside LocalizationProvider.');
  }
  return context;
}

export function LocalizedText({ children, ...props }: TextProps) {
  const { t } = useLocalization();
  const localizedChildren = Children.map(children, child => typeof child === 'string' ? t(child) : child);

  return <NativeText {...props}>{localizedChildren}</NativeText>;
}
