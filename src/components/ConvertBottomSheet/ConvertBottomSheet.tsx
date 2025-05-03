import {useEffect, useState} from 'react';
import {ImageSourcePropType} from 'react-native';
import Toast from 'react-native-toast-message';
import {impactAsync} from 'expo-haptics';

// Components
import BottomSheet from '@shared/components/BottomSheet';
import ConvertSettings from './components/ConvertSettings';

// Hooks
import useBoolean from '@shared/hooks/useBoolean';

// Utils
import getThumbnailAsync from '@utils/getThumbnailAsync';
import {extractAudio} from '@utils/audio';
import {saveConvert} from '@utils/storage';
import wait from '@shared/utils/wait';
import {logEvent} from '@src/utils';

// Types
import {
  ConvertedFile,
  EventType,
  Quality,
  SelectedAssetToConvert,
} from '@src/types';

// Assets
import MusicFileIcon from '@assets/images/music-icon.png';

const ConvertBottomSheet = ({
  selection,
  onComplete,
}: {
  selection: SelectedAssetToConvert | null;
  onComplete: (file: ConvertedFile) => void;
}) => {
  const asset = selection?.asset || null;
  const duration = selection?.duration || 0;
  const {
    value: isVisible,
    setTrue: openSheet,
    setFalse: closeSheet,
    setValue: setOpen,
  } = useBoolean(false);
  const [previewImage, setPreviewImage] = useState<null | ImageSourcePropType>(
    null,
  );
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    setOpen(Boolean(asset));
  }, [asset, setOpen]);

  useEffect(() => {
    if (asset) {
      getThumbnailAsync(asset.uri)
        .then(result => {
          if (!result) {
            throw new Error('No thumbnail found');
          }
          setPreviewImage({uri: result});
        })
        .catch(() => {
          setPreviewImage(MusicFileIcon);
        });
    }
  }, [asset]);

  const handleConvert = ({
    format,
    quality,
  }: {
    format: string;
    quality: Quality;
  }) => {
    if (!asset) {
      return;
    }

    if (format === 'm4r' && duration < 30) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          'Ringtone must be at least 30 seconds long. Please select a longer file.',
      });
      return;
    }

    setProgress(0);
    setIsConverting(true);
    logEvent(EventType.CONVERT_AUDIO, {
      format,
      quality,
      assetType: asset.mimeType,
    });
    extractAudio({
      asset,
      outputFormat: format,
      outputQuality: quality,
      onProgress: setProgress,
    })
      .then(async result => {
        const file = await saveConvert({
          asset,
          convertedUri: result.uri,
          duration: result.duration,
          fileThumbnail:
            previewImage &&
            typeof previewImage === 'object' &&
            'uri' in previewImage &&
            previewImage.uri
              ? previewImage.uri
              : '',
          outputFormat: format,
          isRingtone: format === 'm4r',
        });
        await wait(1000);
        impactAsync();
        onComplete(file);
        await wait(1000);
        setIsConverting(false);
        setProgress(0);
      })
      .catch(() => {
        logEvent(EventType.CONVERT_AUDIO_FAILED, {
          assetType: asset.mimeType,
          format,
          quality,
        });
        setIsConverting(false);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Converting the file failed, please try again.',
        });
      });
  };

  return (
    <BottomSheet
      title=""
      isVisible={isVisible}
      onClose={closeSheet}
      enableContentPanningGesture={false}
      closeable={!isConverting}
      onOpen={openSheet}>
      <ConvertSettings
        asset={asset}
        previewImage={previewImage}
        progress={progress}
        isConverting={isConverting}
        handleConvert={handleConvert}
      />
    </BottomSheet>
  );
};

export default ConvertBottomSheet;
