import {ImagePickerAsset} from 'expo-image-picker';
import {DocumentPickerAsset} from 'expo-document-picker';

export type EncoderType = {
  [extension: string]: string;
};

export type Quality = 'low' | 'medium' | 'high';

export type ConvertedFile = {
  id: string;
  uri: string;
  date: string;
  duration: number;
  convertFormat: string;
  thumbnailUri: string;
  fileSize: number;
  isRingtone?: boolean;
};

export type SelectedAssetToConvert = {
  asset: ImagePickerAsset | DocumentPickerAsset;
  duration: number;
};
