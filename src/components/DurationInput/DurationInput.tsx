import {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import MaskInput from 'react-native-mask-input';
import {impactAsync} from 'expo-haptics';

// Components
import Ripple from '@shared/components/Ripple';
import Icon from '@shared/components/Icon';

// Utils
import {formatTime, parseTime} from '@utils/index';
import {textStyles} from '@shared/components/Text';

// Hooks
import useStableCallback from '@shared/hooks/useStableCallback';

const DURATION_FORMAT = [/\d/, /\d/, ':', /\d/, /\d/];

export type DurationInputProps = {
  value: number;
  maxValue?: number;
  minValue?: number;
  onChange: (value: number) => void;
};

export type DurationInputRef = {
  setValue: (value: string) => void;
};

const DurationInput = forwardRef<DurationInputRef, DurationInputProps>(
  ({value, onChange, maxValue, minValue}, ref) => {
    const [internalValue, setInternalValue] = useState(formatTime(value));

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const clearTimers = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleSubmit = useStableCallback(() => {
      const newValue = parseTime(internalValue);
      if (
        isNaN(newValue) ||
        (maxValue && newValue > maxValue) ||
        (minValue && newValue < minValue)
      ) {
        setInternalValue(formatTime(value));
        return;
      }
      setInternalValue(formatTime(newValue));
      onChange(newValue);
    });

    const increase = useStableCallback(() => {
      const newValue = parseTime(internalValue) + 1;
      if (maxValue && newValue > maxValue) {
        return;
      }
      setInternalValue(formatTime(newValue));
      onChange(newValue);
    });

    const decrease = useStableCallback(() => {
      const newValue = parseTime(internalValue) - 1;
      if (minValue && newValue < minValue) {
        return;
      }
      if (newValue >= 0) {
        setInternalValue(formatTime(newValue));
        onChange(newValue);
      }
    });

    const startContinuousChange = (changeFn: () => void) => {
      impactAsync();
      changeFn();
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(changeFn, 30);
      }, 350);
    };

    useImperativeHandle(ref, () => ({
      setValue: setInternalValue,
    }));

    return (
      <View style={styles.root}>
        <Ripple
          style={[styles.actionButton, styles.leftAction]}
          hitSlop={16}
          onPressIn={() => startContinuousChange(decrease)}
          onPressOut={clearTimers}>
          <Icon name="remove" />
        </Ripple>
        <MaskInput
          value={internalValue}
          onChangeText={setInternalValue}
          mask={DURATION_FORMAT}
          onBlur={handleSubmit}
          keyboardType="number-pad"
          returnKeyType="done"
          submitBehavior="blurAndSubmit"
          style={styles.input}
        />
        <Ripple
          style={[styles.actionButton, styles.rightAction]}
          hitSlop={16}
          onPressIn={() => startContinuousChange(increase)}
          onPressOut={clearTimers}>
          <Icon name="add" />
        </Ripple>
      </View>
    );
  },
);

DurationInput.displayName = 'DurationInput';

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  input: {
    flex: 1,
    padding: 0,
    textAlign: 'center',
    ...textStyles.body,
    color: '#000',
  },
  actionButton: {
    borderColor: '#ccc',
    padding: 8,
  },
  leftAction: {
    borderRightWidth: 1,
  },
  rightAction: {
    borderLeftWidth: 1,
  },
});

export default DurationInput;
