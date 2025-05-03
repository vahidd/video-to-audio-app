import {useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
  ImageSourcePropType,
} from 'react-native';
import {DocumentPickerAsset} from 'expo-document-picker';
import {ImagePickerAsset} from 'expo-image-picker';

// Components
import Button from '@shared/components/Button';
import ImageWithProgressBorder from '@shared/components/ImageWithProgressBorder';
import HorizontalOptionPicker from '@shared/components/HorizontalOptionPicker';
import Text from '@shared/components/Text';

// Hooks
import useTheme from '@shared/hooks/useTheme';

// Utils
import {getFileNameFromAsset} from '@utils/index';

// Types
import {Quality} from '@src/types';

import {qualityOptions, formatOptions} from './pickerOptions';

const ConvertSettings = ({
  asset,
  isConverting,
  progress,
  previewImage,
  handleConvert,
}: {
  asset: ImagePickerAsset | DocumentPickerAsset | null;
  previewImage: ImageSourcePropType | null;
  progress: number;
  isConverting: boolean;
  handleConvert: (params: {quality: Quality; format: string}) => void;
}) => {
  const {colors} = useTheme();
  const [format, setFormat] = useState<string>('mp3');
  const [quality, setQuality] = useState<Quality>('medium');

  return (
    <View>
      <View style={styles.preview}>
        {previewImage ? (
          <ImageWithProgressBorder
            source={previewImage}
            size={120}
            progress={progress}
            radius={4}
            spacing={3}
            borderColor={colors.primary}
            strokeWidth={4}
            imageStyle={styles.audioIcon}
          />
        ) : (
          <View style={styles.previewLoader}>
            <ActivityIndicator />
          </View>
        )}
        {asset && (
          <Text variant="bold" center>
            {getFileNameFromAsset(asset)}
          </Text>
        )}
      </View>
      {!isConverting && (
        <>
          <View style={styles.pickerField}>
            <Text variant="bold">Format</Text>
            <HorizontalOptionPicker
              options={formatOptions}
              onSelect={setFormat}
              itemWidth={100}
              initialSelected={format}
              style={styles.pickerInput}
            />
          </View>
          <View style={styles.pickerField}>
            <Text variant="bold">Quality</Text>
            <HorizontalOptionPicker
              options={qualityOptions}
              onSelect={setQuality}
              itemWidth={100}
              initialSelected={quality}
              style={styles.pickerInput}
            />
          </View>
          <View style={styles.footer}>
            <Button
              title="Convert"
              variant="primary"
              onPress={() => {
                handleConvert({quality, format});
              }}
            />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  preview: {
    marginTop: 0,
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
  },
  previewLoader: {
    width: 120,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioIcon: {
    borderWidth: 1,
    borderColor: '#e3e3e3',
  },
  pickerField: {
    marginBottom: 40,
  },
  pickerInput: {
    marginHorizontal: -16,
  },
  footer: {
    marginBottom: 12,
  },
});

export default ConvertSettings;
