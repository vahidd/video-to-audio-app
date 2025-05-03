import {NativeModule, NativeModules} from 'react-native';

export interface VideoThumbnailModuleType extends NativeModule {
  generateThumbnail: (uri: string, time: number) => Promise<string>;
}

const {VideoThumbnailModule: VideoThumbnailModuleUntyped} = NativeModules;

const VideoThumbnailModule =
  VideoThumbnailModuleUntyped as unknown as VideoThumbnailModuleType;

export default async function getThumbnailAsync(
  videoUri: string,
  time = 1,
): Promise<string> {
  return VideoThumbnailModule.generateThumbnail(videoUri, time);
}
