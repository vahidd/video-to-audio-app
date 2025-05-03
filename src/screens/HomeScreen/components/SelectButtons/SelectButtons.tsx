import {useCallback} from 'react';
import {Linking, StyleSheet, View} from 'react-native';
import {
  launchImageLibraryAsync,
  useCameraPermissions,
  requestMediaLibraryPermissionsAsync,
  ImagePickerAsset,
  UIImagePickerPreferredAssetRepresentationMode,
} from 'expo-image-picker';
import {PermissionStatus} from 'expo-modules-core';
import Toast from 'react-native-toast-message';
import {getDocumentAsync, DocumentPickerAsset} from 'expo-document-picker';
import {impactAsync} from 'expo-haptics';

import Text from '@shared/components/Text';
import Ripple from '@shared/components/Ripple';
import Icon, {IconProps} from '@shared/components/Icon';
import useTheme from '@shared/hooks/useTheme';

import {getDuration} from '@utils/audio';
import {logEvent} from '@src/utils';
import {SelectedAssetToConvert} from '@src/types.ts';

const SelectButtons = ({
  onFileSelected: onFileSelectedProp,
}: {
  onFileSelected: (selection: SelectedAssetToConvert) => void;
}) => {
  const [cameraPermission] = useCameraPermissions();
  const {colors} = useTheme();

  const onFileSelected = useCallback(
    (asset: ImagePickerAsset | DocumentPickerAsset) => {
      getDuration(asset.uri)
        .then(duration => {
          if (!duration) {
            throw new Error('Audio not found');
          }
          onFileSelectedProp({
            asset,
            duration,
          });
        })
        .catch(() => {
          Toast.show({
            type: 'error',
            text1: 'Audio not found',
            text2:
              'No audio found in the selected file. Please try again with a different file.',
          });
        });
    },
    [onFileSelectedProp],
  );

  const button = ({
    title,
    subtitle,
    icon,
    onPress,
  }: {
    title: string;
    subtitle: string;
    onPress: () => void | Promise<void>;
    icon: IconProps['name'];
  }) => {
    return (
      <Ripple
        onPress={() => {
          impactAsync();
          onPress();
        }}
        style={[styles.button, {borderColor: colors.borderDark}]}>
        <Icon name={icon} color={colors.darkerSubtitle} size={40} />
        <View style={styles.buttonTexts}>
          <Text variant="bold">{title}</Text>
          <Text color="subtitleText">{subtitle}</Text>
        </View>
      </Ripple>
    );
  };

  return (
    <View style={styles.root}>
      <View>
        {cameraPermission?.status === PermissionStatus.DENIED ? (
          <View style={styles.cameraPermissionDenied}>
            <Text color="darkerSubtitle" variant="small">
              Camera permission is required to take a photo. Please enable it in
              the app settings.
            </Text>
            <Ripple
              hitSlop={8}
              onPress={() => {
                Linking.openSettings();
                logEvent('open_camera_settings');
              }}>
              <Text color="primary" variant="small">
                Open Settings
              </Text>
            </Ripple>
          </View>
        ) : null}
      </View>
      {button({
        title: 'Gallery',
        subtitle: 'Select a video from gallery',
        icon: 'photo_library',
        onPress: async () => {
          logEvent('select_video_from_gallery');
          const permission = await requestMediaLibraryPermissionsAsync();

          if (permission.status !== PermissionStatus.GRANTED) {
            logEvent('select_video_from_gallery_permission_denied');
            Toast.show({
              type: 'error',
              text1: 'Permission Denied',
              text2: 'We need media library permissions to select a photo.',
            });
            return;
          }

          const result = await launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsMultipleSelection: false,
            preferredAssetRepresentationMode:
              UIImagePickerPreferredAssetRepresentationMode.Current,
          });

          if (result.canceled || !result.assets?.length) {
            return;
          }

          onFileSelected(result.assets[0]);
        },
      })}
      {button({
        title: 'Files',
        subtitle: 'Select a video or audio from files',
        icon: 'folder',
        onPress: async () => {
          logEvent('select_video_from_files');
          const result = await getDocumentAsync({
            multiple: false,
          });

          if (result.canceled || !result.assets?.length) {
            return;
          }

          onFileSelected(result.assets[0]);
        },
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonTexts: {
    gap: 4,
  },
  cameraPermissionDenied: {
    marginTop: 4,
  },
});

export default SelectButtons;
