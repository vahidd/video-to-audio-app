import {StyleSheet, View} from 'react-native';
import {impactAsync} from 'expo-haptics';

import useTheme from '@shared/hooks/useTheme';
import Text from '@shared/components/Text';
import {ConvertedFile, EventType} from '@src/types';
import RecentFile from './components/RecentFile';
import {logEvent} from '@src/utils';

const RecentFiles = ({
  files,
  onOpenPreview,
}: {
  files: ConvertedFile[];
  onOpenPreview: (file: ConvertedFile) => void;
}) => {
  const {colors} = useTheme();
  const content = () => {
    return files.map(file => (
      <RecentFile
        file={file}
        key={file.id}
        onOpenPreview={() => {
          impactAsync();
          onOpenPreview(file);
          logEvent(EventType.OPEN_RECENT_FILE);
        }}
      />
    ));
  };

  if (!files.length) {
    return null;
  }

  return (
    <View style={[styles.root, {borderColor: colors.border}]}>
      <View>
        <Text variant="bold">Recent Converts</Text>
      </View>
      <View style={styles.convertsList}>{content()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 8,
    flexGrow: 1,
  },
  convertsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

export default RecentFiles;
