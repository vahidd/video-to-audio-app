import {FC} from 'react';
import {StyleSheet, useWindowDimensions} from 'react-native';
import {impactAsync, ImpactFeedbackStyle} from 'expo-haptics';

import Ripple from '@shared/components/Ripple';
import Text from '@shared/components/Text';
import Icon, {IconProps} from '@shared/components/Icon';
import useTheme from '@shared/hooks/useTheme';

const ActionButton: FC<{
  title: string;
  icon: IconProps['name'];
  onPress: () => void;
  destructive?: boolean;
}> = ({title, icon, onPress, destructive}) => {
  const dim = useWindowDimensions();
  const {colors} = useTheme();

  return (
    <Ripple
      onPress={() => {
        impactAsync(
          destructive ? ImpactFeedbackStyle.Heavy : ImpactFeedbackStyle.Medium,
        );
        onPress();
      }}
      style={[styles.root, {width: (dim.width - 40) / 2}]}>
      <Icon
        name={icon}
        size={24}
        color={destructive ? colors.danger : colors.darkerSubtitle}
      />
      <Text color={destructive ? 'danger' : undefined}>{title}</Text>
    </Ripple>
  );
};

export default ActionButton;

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 12,
    paddingRight: 0,
    paddingVertical: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
});
