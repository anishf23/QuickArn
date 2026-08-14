import { Dimensions } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

/** Returns a value relative to the current window width. */
export const wp = (percentage: number) =>
  (Dimensions.get('window').width * percentage) / 100;

/** Returns a value relative to the current window height. */
export const hp = (percentage: number) =>
  (Dimensions.get('window').height * percentage) / 100;

/** Scales typography from the 680px design-height baseline. */
export const rf = (fontSize: number) => RFValue(fontSize, 680);

export { RFValue };
