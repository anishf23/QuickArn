import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screen/Auth/LoginScreen';
import LanguageSelectionScreen from '../screen/Auth/LanguageSelectionScreen';
import LocationAccessScreen from '../screen/Auth/LocationAccessScreen';
import OTPScreen from '../screen/Auth/OTPScreen';
import ProfileSetupScreen from '../screen/Auth/ProfileSetupScreen';
import MainScreen from '../screen/Main/MainScreen';
import SplashScreen from '../screen/SplashScreen';

export type RootStackParamList = {
  Login: undefined;
  LocationAccess: undefined;
  LanguageSelection: { mode: 'onboarding' | 'profile' };
  Main: { address: string };
  OTP: { phoneNumber: string };
  ProfileSetup: undefined;
  Splash: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen name="LocationAccess" component={LocationAccessScreen} />
      <Stack.Screen name="Main" component={MainScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
