import {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {filesize} from 'filesize';
import {exists} from 'react-native-fs';

// Components
import Text from '@shared/components/Text';
import FileIcon from '@components/FileIcon';
import AudioPlayer from '@components/AudioPlayer/AudioPlayer';
import ActionButton from '../ActionButton';
import Icon from '@shared/components/Icon';
import Ripple from '@shared/components/Ripple';
import TrimView from '../TrimView';
import EditMetadataView from '../EditMetadataView';
import RingtoneGuideView from '../RingtoneGuideView';

// Hooks
import useTheme from '@shared/hooks/useTheme';

// Utils
import dayjs from '@shared/utils/dayjs';
import {
  getExtensionFromUri,
  getFileNameFromAsset,
  logEvent,
} from '@utils/index';

// Types
import {ConvertedFile, EventType} from '@src/types';
import {askForReview} from '@shared/utils/askForReview';
import {editMetadataSupported} from '@utils/audio';

export type CurrentView =
  | 'default'
  | 'trim'
  | 'edit-metadata'
  | 'ringtone-guide';

const FilePreview = ({
  file,
  onFileShare,
  onDelete,
  currentView,
  onCurrentViewChange,
  onClose,
  onRefresh,
}: {
  file: ConvertedFile;
  onFileShare: () => void;
  onDelete: (showConformation?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  currentView: CurrentView;
  onCurrentViewChange: (view: CurrentView) => void;
  onClose: () => void;
  onRefresh: () => void;
}) => {
  const {colors} = useTheme();

  const name = file ? getFileNameFromAsset(file, false) : '';
  const extension = getExtensionFromUri(file.uri || '') || 'mp3';
  const [fileExists, setFileExists] = useState(true);

  useEffect(() => {
    exists(file.uri)
      .then(exist => {
        setFileExists(exist);
      })
      .catch(() => {
        setFileExists(false);
      });
  }, [file.uri]);

  const renderView = () => {
    const ringtoneNeedsTrimming = file.isRingtone && file.duration !== 30;

    if (currentView === 'trim' || ringtoneNeedsTrimming) {
      return (
        <TrimView
          file={file}
          onCancel={() => {
            onCurrentViewChange('default');
          }}
          onDone={() => {
            onCurrentViewChange('default');
            onRefresh();
            askForReview('trimmed', 1);
            logEvent(EventType.TRIM_AUDIO);
          }}
          hint={
            ringtoneNeedsTrimming
              ? 'Ringtone duration should be 30 seconds, Please trim the ringtone to 30 seconds.'
              : undefined
          }
          fixedDuration={ringtoneNeedsTrimming ? 30 : undefined}
          showCancelButton={!ringtoneNeedsTrimming}
        />
      );
    }

    if (currentView === 'edit-metadata') {
      return (
        <EditMetadataView
          file={file}
          onCancel={() => {
            onCurrentViewChange('default');
          }}
          onDone={() => {
            onCurrentViewChange('default');
            onRefresh();
            askForReview('edited-metadata', 1);
            logEvent(EventType.EDIT_METADATA);
          }}
        />
      );
    }

    if (currentView === 'ringtone-guide') {
      return (
        <RingtoneGuideView
          onDone={() => {
            onCurrentViewChange('default');
          }}
        />
      );
    }

    return (
      <View style={styles.content}>
        <AudioPlayer uri={file.uri} duration={file.duration} title={name} />
        <View style={styles.actions}>
          <ActionButton title="Share" icon="upload" onPress={onFileShare} />
          <ActionButton
            title={
              file.isRingtone || !editMetadataSupported(extension)
                ? 'Rename'
                : 'Edit Metadata'
            }
            icon="edit_square"
            onPress={() => {
              logEvent(EventType.EDIT_META_BTN_PRESSED);
              onCurrentViewChange('edit-metadata');
            }}
          />
          {!file.isRingtone && (
            <ActionButton
              title="Trim"
              icon="content_cut"
              onPress={() => {
                logEvent(EventType.TRIM_BTN_PRESSED);
                onCurrentViewChange('trim');
              }}
            />
          )}
          <ActionButton
            title="Delete"
            icon="delete"
            destructive
            onPress={onDelete}
          />
          {file.isRingtone && (
            <ActionButton
              title="Set as ringtone"
              icon="info"
              onPress={() => {
                logEvent(EventType.SET_AS_RINGTONE_BTN_PRESSED);
                onCurrentViewChange('ringtone-guide');
              }}
            />
          )}
        </View>
      </View>
    );
  };

  if (!fileExists) {
    return (
      <View style={styles.fileNotFound}>
        <View>
          <Text variant="subtitle" center>
            File not found
          </Text>
          <Text variant="small" color="darkerSubtitle" center>
            The file may have been moved or deleted.
          </Text>
        </View>
        <ActionButton
          title="Delete from list"
          icon="delete"
          destructive
          onPress={() => {
            onDelete(false);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.infoRoot}>
        <FileIcon extension={extension.toUpperCase()} size={65} />
        <View style={styles.convertDetails}>
          <View>
            <Text variant="body2">{name}</Text>
          </View>
          <View>
            <Text variant="small" color="darkerSubtitle">
              {getExtensionFromUri(file.uri)} | {filesize(file.fileSize)} |{' '}
              {dayjs(file.date).format('DD/MM/YYYY')}
            </Text>
          </View>
        </View>
        <Ripple style={styles.closeIcon} onPress={onClose} hitSlop={25}>
          <Icon name="close" size={28} color={colors.text} />
        </Ripple>
      </View>

      {renderView()}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingBottom: 8,
  },
  closeIcon: {
    marginTop: -20,
    marginLeft: 'auto',
  },
  infoRoot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  convertDetails: {
    gap: 4,
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  fileNotFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    gap: 24,
  },
});

export default FilePreview;
