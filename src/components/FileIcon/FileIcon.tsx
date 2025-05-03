import {StyleSheet, View} from 'react-native';
import FileIconBase, {FileIconProps} from '@shared/components/FileIcon';

import Icon from '@shared/components/Icon';

const FileIcon = ({
  extension,
  size = 70,
  style,
}: {
  extension: string;
  size?: number;
  style?: FileIconProps['style'];
}) => {
  const isRingtone = extension.toLowerCase() === 'm4r';

  return (
    <View style={styles.root}>
      <FileIconBase
        extension={isRingtone ? '' : extension}
        size={size}
        style={style}
      />
      {isRingtone ? (
        <Icon
          name="notifications_active"
          style={styles.bellIcon}
          size={size / 2.6}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellIcon: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 12,
    color: '#8a8a8a',
  },
});

export default FileIcon;
