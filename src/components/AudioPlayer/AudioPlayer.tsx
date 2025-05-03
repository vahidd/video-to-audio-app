import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {View, StyleSheet, ViewStyle, LayoutChangeEvent} from 'react-native';
import Slider from '@react-native-community/slider';
import TrackPlayer, {
  useProgress,
  usePlaybackState,
  State,
} from 'react-native-track-player';
import {
  IWaveformRef,
  Waveform,
} from '@simform_solutions/react-native-audio-waveform';

// Components
import Text from '@shared/components/Text';
import useTheme from '@shared/hooks/useTheme';
import Ripple from '@shared/components/Ripple';
import Icon from '@shared/components/Icon';
import TrimView, {TrimViewRef} from '@shared/components/TrimView';

// Hooks
import useStableCallback from '@shared/hooks/useStableCallback';

// Utils
import {formatTime} from '@utils/index';
import wait from '@shared/utils/wait';

import {initializePlayer} from './utils';

export type AudioPlayerProps = {
  uri: string;
  duration: number;
  title: string;
  showProgressBar?: boolean;
  showWaveform?: boolean;
  showTrimmer?: boolean;
  fixedDuration?: number;
  style?: ViewStyle;
  trimSelection?: {startSecond: number; endSecond: number};
  onWaveformLoaded?: () => void;
  onTrimSelectionChange?: (selection: {
    startSecond: number;
    endSecond: number;
  }) => void;
};

export type AudioPlayerRef = {
  setTrimSelection: (change: {startSecond: number; endSecond: number}) => void;
};

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  (
    {
      uri,
      title,
      duration,
      showProgressBar = true,
      showWaveform = false,
      fixedDuration,
      style,
      showTrimmer = false,
      trimSelection,
      onTrimSelectionChange = () => {},
      onWaveformLoaded = () => {},
    },
    ref,
  ) => {
    const playbackState = usePlaybackState();
    const {position, duration: playbackDuration} = useProgress();
    const [seekPosition, setSeekPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const {colors} = useTheme();
    const [isReady, setIsReady] = useState(false);
    const waveformRef = useRef<IWaveformRef>(null);
    const [isLoadingWaveform, setIsLoadingWaveform] = useState(true);
    const currentPos = isDragging ? seekPosition : position;
    const [containerWidth, setContainerWidth] = useState(0);
    const trimViewRef = useRef<TrimViewRef>(null);

    useEffect(() => {
      initializePlayer().then(() => {
        setIsReady(true);
      });
    }, []);

    useEffect(() => {
      if (!isLoadingWaveform) {
        onWaveformLoaded();
      }
    }, [isLoadingWaveform, onWaveformLoaded]);

    useEffect(() => {
      return () => {
        TrackPlayer.reset();
      };
    }, []);

    useEffect(() => {
      if (!isReady) {
        return;
      }

      TrackPlayer.add({
        id: 'trackId',
        url: `file://${uri}`,
        title,
      });
    }, [isReady, uri, title]);

    const onSliderValueChange = useStableCallback(async (value: number) => {
      setSeekPosition(value);
      await TrackPlayer.seekTo(value);
    });

    const togglePlayback = useStableCallback(async () => {
      const currentState = await TrackPlayer.getState();
      if (currentState === State.Playing) {
        await TrackPlayer.pause();
      } else {
        if (trimSelection) {
          await TrackPlayer.seekTo(trimSelection.startSecond);
        } else if (Math.round(position) === Math.round(playbackDuration)) {
          await TrackPlayer.seekTo(0);
        }
        await TrackPlayer.play();
      }
    });

    // Reset the position to selection start if the playback is reached the end of the selection
    useEffect(() => {
      if (!showTrimmer || !trimSelection) {
        return;
      }
      if (position >= trimSelection.endSecond) {
        // we need to seek to the start of the selection
        TrackPlayer.seekTo(trimSelection.startSecond);
      }
    }, [position, showTrimmer, trimSelection]);

    const handleContainerLayout = useStableCallback(
      (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
      },
    );

    const handleTrimmerSelectionChange = useStableCallback(
      (selection: {start: number; end: number}) => {
        if (!trimSelection) {
          return;
        }

        const newSelection = {
          startSecond: selection.start * duration,
          endSecond: selection.end * duration,
        };
        if (newSelection.startSecond !== trimSelection.startSecond) {
          TrackPlayer.seekTo(newSelection.startSecond);
        }
        onTrimSelectionChange(newSelection);
      },
    );

    const setTrimSelection = useStableCallback(
      ({startSecond, endSecond}: {startSecond: number; endSecond: number}) => {
        if (!trimViewRef.current) {
          return;
        }
        const clampedStart = Math.max(0, Math.min(startSecond, duration));
        const clampedEnd = Math.max(
          clampedStart + 1,
          Math.min(endSecond, duration),
        );
        trimViewRef.current.setSelection(
          (clampedStart / duration) * containerWidth,
          (clampedEnd / duration) * containerWidth,
        );

        if (trimSelection && startSecond !== trimSelection.startSecond) {
          TrackPlayer.seekTo(startSecond);
        }
      },
    );

    // Set the initial trim selection if fixedDuration is provided
    useEffect(() => {
      if (!isLoadingWaveform && fixedDuration) {
        wait(0).then(() => {
          setTrimSelection({
            startSecond: 0,
            endSecond: fixedDuration,
          });
        });
      }
    }, [fixedDuration, isLoadingWaveform, setTrimSelection]);

    useImperativeHandle(ref, () => ({
      setTrimSelection,
    }));

    return (
      <View style={style} onLayout={handleContainerLayout}>
        <View style={styles.playButton}>
          <Ripple onPress={togglePlayback} hitSlop={12}>
            <Icon
              name={playbackState === State.Playing ? 'pause' : 'play_circle'}
              color="#6e6e6e"
              size={70}
            />
          </Ripple>
        </View>

        {showProgressBar ? (
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position}
            onValueChange={onSliderValueChange}
            minimumTrackTintColor={colors.subtitleText}
            thumbTintColor="#fff"
            onSlidingStart={() => setIsDragging(true)}
            onSlidingComplete={() => setIsDragging(false)}
            tapToSeek
          />
        ) : null}

        {showWaveform ? (
          <View style={styles.waveFormContainer}>
            <Waveform
              ref={waveformRef}
              mode="static"
              path={uri}
              candleSpace={2}
              candleWidth={2}
              candleHeightScale={10}
              waveColor="#6e6e6e"
              scrubColor="#6e6e6e"
              onChangeWaveformLoadState={setIsLoadingWaveform}
            />
            {showTrimmer && !isLoadingWaveform ? (
              <TrimView
                containerWidth={containerWidth}
                containerHeight={60}
                initialStartPosition={0}
                initialEndPosition={containerWidth}
                backgroundColor="transparent"
                style={styles.trimmerContainer}
                onSelectionChange={handleTrimmerSelectionChange}
                ref={trimViewRef}
                disableHandles={!!fixedDuration}
              />
            ) : null}
            {isLoadingWaveform ? (
              <View style={styles.loadingWaveformContainer}>
                <Text variant="small" color="darkSubtitle">
                  Loading...
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.timeRow}>
          <Text variant="small" color="darkSubtitle">
            {formatTime(currentPos)}
          </Text>
          <Text variant="small" color="darkSubtitle">
            {formatTime(duration)}
          </Text>
        </View>
      </View>
    );
  },
);

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;

const styles = StyleSheet.create({
  playButton: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  waveFormContainer: {
    position: 'relative',
    minHeight: 60,
  },
  loadingWaveformContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
  trimmerContainer: {
    top: 0,
    position: 'absolute',
  },
});
