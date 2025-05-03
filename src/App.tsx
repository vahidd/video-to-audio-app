import {useEffect} from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import SharedLibProvider from '@shared/provider';
import BootSplash from 'react-native-bootsplash';
import * as Sentry from '@sentry/react-native';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';

import {Theme} from '@shared/theme';
import HomeScreen from '@screens/HomeScreen';
import useOnAppOpen from '@shared/apps/video2audio/useOnAppOpen';

Sentry.init({
  dsn: (process.env.SENTRY_DSN ?? '') as string,
  sendDefaultPii: false,
  enabled: !__DEV__,
});

const appTheme: Theme = {
  colors: {
    secondary: '#e1972a',
    subtitleText: '#bcbcbc',
    darkerSubtitle: '#aaaaaa',
  },
};

function App() {
  useOnAppOpen();
  useEffect(() => {
    BootSplash.hide({fade: true});
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.container}>
        <SharedLibProvider theme={appTheme}>
          <ActionSheetProvider>
            <HomeScreen />
          </ActionSheetProvider>
        </SharedLibProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default Sentry.wrap(App);
