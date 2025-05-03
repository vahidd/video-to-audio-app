import {Alert, StyleSheet} from 'react-native';
import {useCallback, useEffect, useState} from 'react';
import RNShare from 'react-native-share';
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics';

// Components
import BottomSheet from '@shared/components/BottomSheet';
import FilePreview from './components/FilePreview';

// Hooks
import useBoolean from '@shared/hooks/useBoolean';

// Utils
import {deleteConvert} from '@utils/storage';
import {
  getExtensionFromUri,
  getFileNameFromAsset,
  getMimeType,
  logEvent,
} from '@utils/index';

// Types
import {ConvertedFile, EventType} from '@src/types';
import {askForReview} from '@shared/utils/askForReview';

const FilePreviewBottomSheet = ({
  file,
  onClose,
  onRefreshFiles,
}: {
  file: ConvertedFile | null;
  onClose: () => void;
  onRefreshFiles: () => void;
}) => {
  const {
    value: isVisible,
    setTrue: openSheet,
    setValue: setOpen,
  } = useBoolean(false);
  const [currentView, setCurrentView] = useState<
    'default' | 'trim' | 'edit-metadata' | 'ringtone-guide'
  >('default');

  const name = file ? getFileNameFromAsset(file, false) : '';
  const extension = getExtensionFromUri(file?.uri || '') || 'mp3';

  const closeSheet = useCallback(() => {
    setOpen(false);
    onClose();
    setCurrentView('default');
  }, [onClose, setOpen]);

  const handleFileShare = useCallback(() => {
    if (!file) {
      return;
    }

    logEvent(EventType.SHARE_FILE);

    RNShare.open({
      title: name,
      url: file.uri,
      type: getMimeType(extension),
      failOnCancel: false,
    })
      .then(res => {
        if (res.success) {
          impactAsync(ImpactFeedbackStyle.Light);
          askForReview('share', 1);
        }
      })
      .catch(err => console.log(err));
  }, [file, name, extension]);

  const handleFileDelete = useCallback(
    (showConfirmation = true) => {
      if (!file) {
        return;
      }

      logEvent(EventType.DELETE_FILE, {
        showConfirmation: showConfirmation ? 'yes' : 'no',
      });

      if (!showConfirmation) {
        deleteConvert(file.id).then(() => {
          closeSheet();
        });
        return;
      }

      impactAsync(ImpactFeedbackStyle.Heavy);
      Alert.alert('Delete File', 'Are you sure you want to delete this file?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteConvert(file.id);
            closeSheet();
          },
        },
      ]);
    },
    [closeSheet, file],
  );

  useEffect(() => {
    setOpen(Boolean(file));
  }, [file, setOpen]);

  return (
    <BottomSheet
      title=""
      isVisible={isVisible}
      onClose={closeSheet}
      enableContentPanningGesture={false}
      headerLeft={null}
      headerContainerStyle={styles.bottomSheetHeader}
      onOpen={openSheet}>
      {file ? (
        <FilePreview
          currentView={currentView}
          onCurrentViewChange={setCurrentView}
          onClose={closeSheet}
          file={file}
          onFileShare={handleFileShare}
          onDelete={handleFileDelete}
          onRefresh={onRefreshFiles}
        />
      ) : null}
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  bottomSheetHeader: {
    paddingTop: 0,
    paddingBottom: 0,
  },
});

export default FilePreviewBottomSheet;
