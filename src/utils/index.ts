import {DocumentPickerAsset} from 'expo-document-picker';
import {ImagePickerAsset} from 'expo-image-picker';
import RNFS from 'react-native-fs';

import {ConvertedFile, EventType} from '@src/types';
import {getAnalytics} from '@react-native-firebase/analytics';

export const getFileNameFromAsset = (
  asset: DocumentPickerAsset | ImagePickerAsset | ConvertedFile,
  withExtension = true,
): string => {
  let fileName = asset.uri.split('/').pop() ?? 'Unknown';

  if ('fileName' in asset && asset.fileName) {
    fileName = asset.fileName;
  }
  if ('name' in asset && asset.name) {
    fileName = asset.name;
  }

  if (withExtension) {
    return fileName;
  }

  return fileName.replace(/\.[^/.]+$/, '');
};

export const getSafeUniqueFileNameFromAsset = async (
  input: string | DocumentPickerAsset | ImagePickerAsset,
  directoryPath: string,
  format: string,
): Promise<string> => {
  const fileName =
    typeof input === 'string' ? input : getFileNameFromAsset(input, false);

  const safeBaseName = fileName
    .replace(/[/*?:"<>|\\]/g, '') // Remove illegal characters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();

  let uniqueName = safeBaseName;
  let suffix = 1;

  while (await RNFS.exists(`${directoryPath}/${uniqueName}.${format}`)) {
    uniqueName = `${safeBaseName}-${suffix}`;
    suffix += 1;
  }

  return `${uniqueName}.${format}`;
};

export const getFileNameFromUri = (uri: string) => {
  return uri.split('/').pop();
};

export const getExtensionFromUri = (uri: string) => {
  const fileName = getFileNameFromUri(uri);
  if (!fileName) {
    return '';
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop() || '' : '';
};

export const getNameWithoutExtension = (uri: string): string => {
  const fileName = getFileNameFromUri(uri);
  if (!fileName) {
    return '';
  }

  const parts = fileName.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : fileName;
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const parseTime = (timeString: string): number => {
  const [minutes, seconds] = timeString.split(':').map(Number);

  if (isNaN(minutes) || isNaN(seconds)) {
    return NaN;
  }

  const totalSeconds = minutes * 60 + seconds;

  return totalSeconds >= 0 ? totalSeconds : NaN;
};

export const getMimeType = (extension: string): string | undefined => {
  const audioMimeTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    flac: 'audio/flac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    aiff: 'audio/aiff',
    opus: 'audio/opus',
  };

  const videoMimeTypes: Record<string, string> = {
    a64: 'video/x-a64',
    a64_5: 'video/x-a64',
    mxf: 'video/mxf',
    yuv: 'video/x-raw',
    flv: 'video/x-flv',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    avi: 'video/x-msvideo',
    roq: 'video/roq',
    ogv: 'video/ogg',
    ogg: 'video/ogg',
    webm: 'video/webm',
    mkv_vp9: 'video/webm',
    webp: 'image/webp',
    webp_anim: 'image/webp',
  };

  const ext = extension.toLowerCase();

  if (audioMimeTypes[ext]) {
    return audioMimeTypes[ext];
  } else if (videoMimeTypes[ext]) {
    return videoMimeTypes[ext];
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const logEvent = (name: EventType, params?: {[key: string]: any}) => {
  getAnalytics().logEvent(name, params);
};
