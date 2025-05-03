import {StyleSheet} from 'react-native';
import Toast from 'react-native-toast-message';
import {composeAsync} from 'expo-mail-composer';
import {useActionSheet} from '@expo/react-native-action-sheet';
import {impactAsync} from 'expo-haptics';

import Icon from '@shared/components/Icon';
import Ripple from '@shared/components/Ripple';
import useBoolean from '@shared/hooks/useBoolean';
import BottomSheet from '@shared/components/BottomSheet';
import Text from '@shared/components/Text';
import {logEvent} from '@src/utils';
import {EventType} from '@src/types';

const HomeScreen = () => {
  const {showActionSheetWithOptions} = useActionSheet();
  const aboutSheet = useBoolean(false);

  const onPress = () => {
    const options = ['About', 'Feedback', 'Cancel'];
    const aboutIndex = 0;
    const feedbackIndex = 1;
    const cancelButtonIndex = 2;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        userInterfaceStyle: 'light',
      },
      (selectedIndex?: number) => {
        switch (selectedIndex) {
          case aboutIndex:
            impactAsync();
            aboutSheet.setTrue();
            logEvent(EventType.ABOUT_BUTTON_PRESSED);
            break;
          case feedbackIndex:
            impactAsync();
            composeAsync({
              recipients: ['info@codewiz.dev'],
              subject: 'Feedback',
              body: 'Please provide your feedback here.',
            }).catch(() => {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2:
                  'Unable to open mail composer. You can share your feedback via email at "info@codewiz.dev"',
              });
            });
            logEvent(EventType.FEEDBACK_BUTTON_PRESSED);
            break;
        }
      },
    );
  };

  return (
    <>
      <Ripple
        hitSlop={25}
        style={styles.settingsButton}
        onPress={() => {
          impactAsync();
          onPress();
        }}>
        <Icon name="settings" size={24} style={styles.settingsIcon} />
      </Ripple>
      <BottomSheet
        isVisible={aboutSheet.value}
        onOpen={aboutSheet.setTrue}
        onClose={aboutSheet.setFalse}
        title="About">
        <Text style={styles.paragraph}>
          This app uses FFmpeg through the ffmpeg-kit-ios-full library. FFmpeg
          is licensed under the GNU General Public License v3.0 (GPLv3).
        </Text>

        <Text style={styles.sectionTitle} variant="bold">
          Source Code
        </Text>
        <Text style={styles.paragraph}>
          This app is fully open source and its source code is available at:
        </Text>
        <Text style={styles.projectLink}>
          https://github.com/vahidd/video-to-audio-app
        </Text>
      </BottomSheet>
    </>
  );
};

const styles = StyleSheet.create({
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  settingsIcon: {
    color: '#535353',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    marginBottom: 10,
  },
  projectLink: {
    marginBottom: 24,
  },
});

export default HomeScreen;
