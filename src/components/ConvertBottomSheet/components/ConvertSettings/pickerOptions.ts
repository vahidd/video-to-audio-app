import {Quality} from '@src/types';
import {getSupportedAudioFormats} from '@utils/audio';

const priorityOrder = ['m4r', 'mp3', 'm4a', 'aac', 'wav'];
export const formatOptions = getSupportedAudioFormats()
  .sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.value);
    const bPriority = priorityOrder.indexOf(b.value);

    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;

    return aPriority - bPriority;
  })
  .map(item => {
    if (item.value === 'm4r') {
      return {
        ...item,
        label: 'Ringtone',
      };
    }
    return item;
  });

export const qualityOptions: Array<{
  label: string;
  value: Quality;
}> = [
  {
    label: 'High',
    value: 'high',
  },
  {
    label: 'Medium',
    value: 'medium',
  },
  {
    label: 'Low',
    value: 'low',
  },
];
