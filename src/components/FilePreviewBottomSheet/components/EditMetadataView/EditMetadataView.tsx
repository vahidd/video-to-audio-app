import {FC, useEffect, useState} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import Form, {useForm} from 'rc-field-form';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {BlurView} from 'expo-blur';
import Toast from 'react-native-toast-message';

// Components
import Text from '@shared/components/Text';
import TextField from '@shared/components/form/TextField';
import Button from '@shared/components/Button';
import Ripple from '@shared/components/Ripple';

// Hooks
import useStableCallback from '@shared/hooks/useStableCallback';

// Utils
import {renameConvert} from '@utils/storage';
import {
  getExtensionFromUri,
  getFileNameFromAsset,
  logEvent,
} from '@utils/index';
import {
  editAudioMetadata,
  editMetadataSupported,
  getAudioMetadata,
} from '@utils/audio';

// Types
import {ConvertedFile, EventType} from '@src/types';

const EditMetadataView: FC<{
  file: ConvertedFile;
  onCancel: () => void;
  onDone: () => void;
}> = ({file, onCancel, onDone}) => {
  const [form] = useForm();
  const [showMoreFields, setShowMoreFields] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const loadingOpacity = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));
  useEffect(() => {
    loadingOpacity.value = withTiming(isLoading ? 1 : 0, {duration: 300});
  }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!file.uri) {
      return;
    }

    getAudioMetadata(file.uri)
      .then(meta => {
        setIsLoading(false);
        form.setFieldsValue({
          name: getFileNameFromAsset(file, false),
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
        });
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [file, form]);

  const handleSubmit = useStableCallback(
    async (
      values: {name: string} & Partial<{
        artist: string;
        album: string;
        title: string;
      }>,
    ) => {
      const {name, ...metadata} = values;

      await renameConvert(file.id, name).catch(() => {});

      if (Object.keys(metadata).length === 0) {
        Toast.show({
          type: 'success',
          text1: 'File renamed',
          text2: 'File name has been updated successfully',
        });
        onDone();
        return;
      }

      await editAudioMetadata(file.uri, metadata).catch(() => {});

      Toast.show({
        type: 'success',
        text1: 'File metadata updated',
        text2: 'File metadata has been updated successfully',
      });
      onDone();
    },
  );

  const showMoreButton =
    editMetadataSupported(getExtensionFromUri(file.uri)) && !file.isRingtone ? (
      <Ripple
        onPress={() => {
          setShowMoreFields(true);
          logEvent(EventType.EDIT_METADATA_SHOW_MORE_BTN_PRESSED);
        }}
        hitSlop={24}
        style={styles.moreFieldsButton}>
        <Text color="primary">Show more fields</Text>
      </Ripple>
    ) : null;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Form form={form} component={false} onFinish={handleSubmit}>
          <View style={styles.field}>
            <Text variant="small" color="darkSubtitle">
              File name
            </Text>
            <TextField
              name="name"
              rules={[{required: false}]}
              textInputProps={{
                placeholder: 'File name',
              }}
            />
          </View>
          {showMoreFields ? (
            <>
              <View style={styles.field}>
                <Text variant="small" color="darkSubtitle">
                  Title
                </Text>
                <TextField
                  name="title"
                  rules={[{required: false}]}
                  textInputProps={{
                    placeholder: 'Title',
                  }}
                />
              </View>
              <View style={styles.field}>
                <Text variant="small" color="darkSubtitle">
                  Artist
                </Text>
                <TextField
                  name="artist"
                  rules={[{required: false}]}
                  textInputProps={{
                    placeholder: 'Artist',
                  }}
                />
              </View>
              <View style={styles.field}>
                <Text variant="small" color="darkSubtitle">
                  Album
                </Text>
                <TextField
                  name="album"
                  rules={[{required: false}]}
                  textInputProps={{
                    placeholder: 'Album',
                  }}
                />
              </View>
            </>
          ) : (
            showMoreButton
          )}
        </Form>
      </View>

      <View style={styles.buttons}>
        <Button
          variant="primary"
          title="Edit"
          onPress={form.submit}
          style={styles.button}
        />
        <Button title="Cancel" onPress={onCancel} style={styles.button} />
      </View>

      <Animated.View
        pointerEvents={isLoading ? 'auto' : 'none'}
        style={[styles.loading, animatedStyle]}>
        <BlurView style={StyleSheet.absoluteFill} intensity={20} tint="light" />
        <ActivityIndicator />
      </Animated.View>
    </View>
  );
};

export default EditMetadataView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    marginTop: 32,
    gap: 12,
  },
  field: {
    gap: 4,
  },
  moreFieldsButton: {
    marginTop: 12,
  },
  buttons: {
    marginTop: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    zIndex: 999,
    alignItems: 'center',
  },
});
