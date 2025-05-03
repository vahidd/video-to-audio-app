import {FC, useEffect, useRef, useState} from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import Toast from 'react-native-toast-message';
import {BlurView} from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

// Components
import Text from '@shared/components/Text';
import Button from '@shared/components/Button';
import AudioPlayer, {AudioPlayerRef} from '@components/AudioPlayer';
import DurationInput, {DurationInputRef} from '@components/DurationInput';

// Hooks
import useStableCallback from '@shared/hooks/useStableCallback';

// Utils
import {updateConvert} from '@utils/storage';
import {formatTime, getFileNameFromAsset} from '@utils/index';
import {trimAudio} from '@utils/audio';

// Types
import {ConvertedFile} from '@src/types';

const TrimView: FC<{
  file: ConvertedFile;
  hint?: string;
  showCancelButton?: boolean;
  fixedDuration?: number;
  onCancel: () => void;
  onDone: () => void;
}> = ({file, onCancel, onDone, hint, showCancelButton, fixedDuration}) => {
  const [trimSelection, setTrimSelection] = useState({
    startSecond: 0,
    endSecond: fixedDuration ? fixedDuration : file.duration,
  });
  const startInputRef = useRef<DurationInputRef>(null);
  const endInputRef = useRef<DurationInputRef>(null);
  const audioPlayerRef = useRef<AudioPlayerRef>(null);
  const [isLoading, setIsLoading] = useState(true);
  const loadingOpacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  useEffect(() => {
    loadingOpacity.value = withTiming(isLoading ? 1 : 0, {duration: 300});
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTrimSelectionChange = useStableCallback(
    (input: {startSecond: number; endSecond: number}) => {
      const selection = {
        startSecond: Math.round(input.startSecond),
        endSecond: Math.round(input.endSecond),
      };
      setTrimSelection(selection);
      if (startInputRef.current) {
        startInputRef.current.setValue(formatTime(selection.startSecond));
      }
      if (endInputRef.current) {
        endInputRef.current.setValue(formatTime(selection.endSecond));
      }
    },
  );

  const handleWaveformLoaded = useStableCallback(() => {
    setIsLoading(false);
  });

  const handleManualTrimSelectionChange = useStableCallback(
    (key: 'endSecond' | 'startSecond', val: number) => {
      const newSelection = {
        ...trimSelection,
        [key]: val,
      };
      if (fixedDuration) {
        if (key === 'startSecond') {
          const diff = val - trimSelection.startSecond;
          newSelection.endSecond = Math.min(
            trimSelection.endSecond + diff,
            file.duration,
          );
          endInputRef.current?.setValue(formatTime(newSelection.endSecond));
        }
        if (key === 'endSecond') {
          const diff = val - trimSelection.endSecond;
          newSelection.startSecond = Math.max(
            trimSelection.startSecond + diff,
            0,
          );
          startInputRef.current?.setValue(formatTime(newSelection.startSecond));
        }
      }
      setTrimSelection(newSelection);

      if (audioPlayerRef.current) {
        audioPlayerRef.current.setTrimSelection(newSelection);
      }
    },
  );

  const handleTrim = () => {
    if (
      trimSelection.startSecond === 0 &&
      file.duration === trimSelection.endSecond
    ) {
      onCancel();
      return;
    }

    setIsLoading(true);
    trimAudio({
      uri: file.uri,
      startTime: trimSelection.startSecond,
      endTime: trimSelection.endSecond,
    })
      .then(result => {
        updateConvert(file.id, {
          duration: result.duration,
        });
        onDone();
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Audio trimmed successfully.',
        });
      })
      .catch(() => {
        Toast.show({
          type: 'error',
          text1: 'Error trimming audio',
          text2: 'An error occurred while trimming the audio file.',
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <AudioPlayer
          ref={audioPlayerRef}
          uri={file.uri}
          duration={file.duration}
          title={getFileNameFromAsset(file, false)}
          showProgressBar={false}
          onTrimSelectionChange={handleTrimSelectionChange}
          onWaveformLoaded={handleWaveformLoaded}
          trimSelection={trimSelection}
          showWaveform
          showTrimmer
          fixedDuration={fixedDuration}
        />
      </View>

      {hint && (
        <View style={styles.hintContainer}>
          <Text variant="small" color="secondary" center>
            {hint}
          </Text>
        </View>
      )}

      <View style={styles.trimBoxes}>
        <View style={styles.trimBox}>
          <Text variant="small" center>
            Start time
          </Text>
          <DurationInput
            value={trimSelection.startSecond}
            onChange={val => {
              handleManualTrimSelectionChange('startSecond', val);
            }}
            maxValue={
              fixedDuration
                ? file.duration - fixedDuration
                : trimSelection.endSecond - 1
            }
            ref={startInputRef}
          />
        </View>
        <View style={styles.trimBox}>
          <Text variant="small" center>
            End time
          </Text>
          <DurationInput
            value={trimSelection.endSecond}
            onChange={val => {
              handleManualTrimSelectionChange('endSecond', val);
            }}
            minValue={
              fixedDuration ? fixedDuration : trimSelection.startSecond + 1
            }
            maxValue={file.duration}
            ref={endInputRef}
          />
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          variant="primary"
          title="Trim"
          onPress={handleTrim}
          style={styles.button}
        />
        {showCancelButton ? (
          <Button title="Cancel" onPress={onCancel} style={styles.button} />
        ) : null}
      </View>

      <Animated.View
        pointerEvents={isLoading ? 'auto' : 'none'}
        style={[styles.loading, animatedStyle]}>
        <BlurView style={StyleSheet.absoluteFill} intensity={20} tint="light" />
        <ActivityIndicator />
      </Animated.View>
    </View>
  );
};

export default TrimView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
  },
  buttons: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  hintContainer: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  trimBoxes: {
    backgroundColor: '#f6f6f6',
    padding: 16,
    borderRadius: 4,
    marginTop: 8,
    flexDirection: 'row',
    gap: 16,
  },
  trimBox: {
    flex: 1,
    gap: 4,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    zIndex: 999,
    alignItems: 'center',
  },
});
