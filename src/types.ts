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

export enum EventType {
  SELECT_VIDE_FROM_GALLERY_PERMISSION_DENIED = 'video_gallery_perm_denied',
  SELECT_VIDEO_FROM_GALLERY = 'select_video_from_gallery',
  OPEN_CAMERA_SETTINGS = 'open_camera_settings',
  SELECT_VIDE_FROM_FILES = 'select_video_from_files',
  FEEDBACK_BUTTON_PRESSED = 'feedback_button_clicked',
  ABOUT_BUTTON_PRESSED = 'about_button_clicked',
  CONVERT_AUDIO = 'convert_audio',
  CONVERT_AUDIO_FAILED = 'convert_audio_failed',
  SHARE_FILE = 'share_file',
  DELETE_FILE = 'delete_file',
  SET_AS_RINGTONE_BTN_PRESSED = 'set_as_ringtone_btn',
  TRIM_BTN_PRESSED = 'trim_button_pressed',
  EDIT_META_BTN_PRESSED = 'edit_meta_btn',
  EDIT_METADATA = 'edit_metadata',
  TRIM_AUDIO = 'trim_audio',
  OPEN_RECENT_FILE = 'open_recent_file',
  EDIT_METADATA_SHOW_MORE_BTN_PRESSED = 'edit_metadata_more_btn',
}
