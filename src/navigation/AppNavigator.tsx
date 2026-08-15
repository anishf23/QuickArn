import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screen/Auth/LoginScreen';
import LocationAccessScreen from '../screen/Auth/LocationAccessScreen';
import OTPScreen from '../screen/Auth/OTPScreen';
import ProfileSetupScreen from '../screen/Auth/ProfileSetupScreen';
import SplashScreen from '../screen/SplashScreen';

export type RootStackParamList = {
  Login: undefined;
  LocationAccess: undefined;
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
      <Stack.Screen name="LocationAccess" component={LocationAccessScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;
