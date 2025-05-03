import {StyleSheet, useWindowDimensions, View} from 'react-native';

// Components
import Text from '@shared/components/Text';
import Ripple from '@shared/components/Ripple';
import FileIcon from '@components/FileIcon';

// Hooks
import useTheme from '@shared/hooks/useTheme';

// Utils
import dayjs from '@shared/utils/dayjs';
import {
  formatTime,
  getExtensionFromUri,
  getFileNameFromAsset,
} from '@utils/index';

// Types
import {ConvertedFile} from '@src/types';

const RecentFile = ({
  file,
  onOpenPreview,
}: {
  file: ConvertedFile;
  onOpenPreview: () => void;
}) => {
  const {colors, pagePadding} = useTheme();
  const {width} = useWindowDimensions();

  return (
    <Ripple
      style={[
        styles.previewItem,
        {
          borderColor: colors.border,
          width: (width - pagePadding * 2) / 2 - 6,
        },
      ]}
      onPress={onOpenPreview}>
      <FileIcon extension={getExtensionFromUri(file.uri)} style={styles.icon} />
      <View style={styles.previewTexts}>
        <Text numberOfLines={1}>{getFileNameFromAsset(file, false)}</Text>
        <Text variant="small" color="subtitleText" numberOfLines={1}>
          {formatTime(file.duration)} • {dayjs(file.date).format('DD/MM/YYYY')}
        </Text>
      </View>
    </Ripple>
  );
};

const styles = StyleSheet.create({
  icon: {
    alignSelf: 'center',
  },
  previewItem: {
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  previewTexts: {
    marginTop: 8,
  },
});

export default RecentFile;
