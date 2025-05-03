import {Linking, StyleSheet, View} from 'react-native';
import Toast from 'react-native-toast-message';

import Text from '@shared/components/Text';
import Button from '@shared/components/Button';
import Ripple from '@shared/components/Ripple';

const RingtoneGuideBottomSheet = ({onDone}: {onDone: () => void}) => {
  const step = (number: number, text: string) => (
    <View style={styles.stepRow} key={number}>
      <Text style={styles.stepNumber}>{number}.</Text>
      {number === 1 ? (
        <View style={styles.linkRow}>
          <Text>{text}</Text>
          <Ripple
            hitSlop={10}
            onPress={() => {
              const url =
                'https://apps.apple.com/us/app/garageband/id408709785';
              Linking.openURL(url).catch(() => {
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2:
                    'Unable to open the App Store. Please check your internet connection.',
                });
              });
            }}>
            <Text style={styles.link}>Download</Text>
          </Ripple>
        </View>
      ) : (
        <Text style={styles.stepText}>{text}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>
        You can set your converted ringtone using the GarageBand app on your
        iPhone. Here&#39;s how:
      </Text>

      <View style={styles.linkRow}>
        <Ripple
          hitSlop={10}
          onPress={() => {
            const url = 'https://www.youtube.com/watch?v=W2ceDaBdwZg';
            Linking.openURL(url).catch(() => {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2:
                  'Unable to open the App Store. Please check your internet connection.',
              });
            });
          }}>
          <Text style={styles.link}>Watch Video</Text>
        </Ripple>
      </View>

      <Text variant="bold" style={styles.paragraph}>
        Or follow these steps:
      </Text>

      {steps.map((text, index) => step(index + 1, text))}

      <Button title="Got it" variant="primary" onPress={onDone} />
    </View>
  );
};

const steps = [
  'Open the GarageBand app.',
  'Tap any instrument (e.g., Keyboard) to enter the editor screen.',
  'Tap the Tracks view icon in the top-left corner.',
  'Tap the Loops icon in the top-right corner.',
  "Choose 'Browse items from the Files app'.",
  'Find and long press the .m4r file you exported.',
  'Drag it into the timeline to add it.',
  'Adjust the length if needed (must be under 40 seconds).',
  "Tap the down arrow in the top-left and select 'My Songs' to save.",
  "Long press your new song > tap 'Share' > choose 'Ringtone'.",
  "Name it and export. Then tap 'Use sound as…' to set as ringtone.",
];

const styles = StyleSheet.create({
  container: {
    paddingTop: 24,
  },
  paragraph: {
    marginBottom: 16,
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    marginRight: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 4,
  },
  stepText: {
    flex: 1,
  },
});

export default RingtoneGuideBottomSheet;
