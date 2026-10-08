// Lets code outside the navigation tree (the notification-tap handling in
// RootNavigator) trigger navigation once the NavigationContainer is ready.

import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();
