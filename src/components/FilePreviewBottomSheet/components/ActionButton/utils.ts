import TrackPlayer, {Capability} from 'react-native-track-player';

let isInitialized = false;

export const initializePlayer = async () => {
  if (isInitialized) {
    return Promise.resolve();
  }

  await TrackPlayer.setupPlayer();
  isInitialized = true;
  await TrackPlayer.updateOptions({
    capabilities: [Capability.Play, Capability.Pause, Capability.SeekTo],
  });
};
