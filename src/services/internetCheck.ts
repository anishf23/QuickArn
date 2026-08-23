import NetInfo from '@react-native-community/netinfo';

export class InternetConnectionError extends Error {
  constructor() {
    super('No internet connection. Please check your network and try again.');
    this.name = 'InternetConnectionError';
  }
}

/** Checks the device network state before a Firebase network request. */
export async function ensureInternetConnection() {
  const networkState = await NetInfo.fetch();
  const hasInternet =
    networkState.isConnected === true &&
    networkState.isInternetReachable !== false;

  if (!hasInternet) {
    throw new InternetConnectionError();
  }
}
