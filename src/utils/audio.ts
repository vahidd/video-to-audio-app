import {NativeEventEmitter, NativeModules, NativeModule} from 'react-native';
import {ImagePickerAsset} from 'expo-image-picker';
import {DocumentPickerAsset} from 'expo-document-picker';

import wait from '@shared/utils/wait';
import {EncoderType, Quality} from '@src/types';

export interface AudioModuleType extends NativeModule {
  getDuration: (uri: string) => Promise<number>;
  extractAudio: (
    uri: string,
    outputFormat: string,
    outputQuality: Quality,
  ) => Promise<{
    uri: string;
    duration: number;
  }>;
  cancelExtraction: () => void;
  getAudioMetadata: (uri: string) => Promise<{
    [key: string]: string;
  }>;
  editAudioMetadata: (
    uri: string,
    metadata: {
      [key: string]: string;
    },
  ) => Promise<{
    uri: string;
  }>;
  trimAudio: (
    uri: string,
    startTime: number,
    endTime: number,
  ) => Promise<{
    uri: string;
    duration: number;
  }>;
  getSupportedEncoders: () => Promise<string>;
  supportedAudioFormats: Array<{
    label: string;
    value: string;
  }>;
  supportedVideoFormats: EncoderType;
}

const {AudioModule: AudioModuleUntyped} = NativeModules;

export const AudioModule = AudioModuleUntyped as unknown as AudioModuleType;

const emitter = new NativeEventEmitter(AudioModule);

export const extractAudio = async ({
  asset,
  onProgress,
  outputQuality,
  outputFormat,
}: {
  asset: ImagePickerAsset | DocumentPickerAsset;
  onProgress: (progress: number) => void;
  outputFormat: string;
  outputQuality: Quality;
}): Promise<{
  uri: string;
  duration: number;
}> => {
  const subscription = emitter.addListener(
    'onAudioExtractionProgress',
    (event: {progress: number}) => {
      onProgress(event.progress);
    },
  );

  try {
    const result = await AudioModule.extractAudio(
      asset.uri,
      outputFormat,
      outputQuality,
    );
    return result;
  } finally {
    subscription.remove();
  }
};

export const cancelAudioExtraction = () => {
  return AudioModule.cancelExtraction();
};

export const trimAudio = async ({
  uri,
  startTime,
  endTime,
}: {
  uri: string;
  startTime: number;
  endTime: number;
}) => {
  await wait(2000);
  return AudioModule.trimAudio(uri, startTime, endTime);
};

export const getSupportedAudioFormats = () => {
  return AudioModule.supportedAudioFormats;
};

export const getSupportedVideoFormats = () => {
  return AudioModule.supportedAudioFormats;
};

export const getAudioMetadata = async (uri: string) => {
  return AudioModule.getAudioMetadata(uri);
};

export const editAudioMetadata = async (
  uri: string,
  metadata: {
    [key: string]: string;
  },
) => {
  return AudioModule.editAudioMetadata(uri, metadata);
};

export function getSupportedEncoders() {
  return AudioModule.getSupportedEncoders();
}

export function getDuration(uri: string) {
  return AudioModule.getDuration(uri);
}

export function editMetadataSupported(extension: string) {
  if (
    !getSupportedAudioFormats().find(
      format => format.value.toLowerCase() === extension.toLowerCase(),
    )
  ) {
    return false;
  }

  return !['aiff', 'aac'].includes(extension.toLowerCase());
}
