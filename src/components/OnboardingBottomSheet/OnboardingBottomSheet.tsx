import {useCallback, useRef, useState} from 'react';
import {StyleSheet, View} from 'react-native';

import BottomSheet from '@shared/components/BottomSheet';
import storage from '@shared/utils/storage';
import Carousel, {
  CarouselHandle,
  type CarouselItemType,
} from '@shared/components/Carousel';
import Button from '@shared/components/Button';
import useTheme from '@shared/hooks/useTheme';

import OnboardingImage1 from '@assets/onboarding/1.png';
import OnboardingImage2 from '@assets/onboarding/2.png';
import OnboardingImage3 from '@assets/onboarding/3.png';
import OnboardingImage4 from '@assets/onboarding/4.png';

const items: CarouselItemType[] = [
  {
    image: OnboardingImage1,
    imageSize: 170,
    imageStyle: {
      borderRadius: 100,
    },
    title: 'Welcome to MP3 & Ringtone Converter! 🎉🚀',
    subtitle:
      'Transform any video or audio file into your favorite format in just a few taps!',
  },
  {
    image: OnboardingImage2,
    imageStyle: {
      borderRadius: 100,
    },
    title: 'Choose Your Video or Audio 📹🎵',
    subtitle: 'Pick a file from your gallery or files to get started!',
  },
  {
    image: OnboardingImage3,
    imageStyle: {
      borderRadius: 100,
    },
    title: 'Pick Your Audio Format 🎧',
    subtitle: 'Select MP3, M4A, or even a Ringtone format—your choice!',
  },
  {
    image: OnboardingImage4,
    imageStyle: {
      borderRadius: 100,
    },
    title: 'Trim, Tag & Share ✏️',
    subtitle:
      'Fine-tune your audio, update the name or artist, then share it with a tap.',
  },
];

const OnboardingBottomSheet = () => {
  const [visible, setVisible] = useState(!storage.getBoolean('onboarded_v1'));
  const [currentPage, setCurrentPage] = useState(0);
  const carouselRef = useRef<CarouselHandle>(null);
  const isLastPage = currentPage === items.length - 1;
  const {pagePadding} = useTheme();

  const close = useCallback(() => {
    setVisible(false);
    storage.set('onboarded_v1', true);
  }, []);

  const open = useCallback(() => {
    setVisible(true);
  }, []);

  const ctaText = () => {
    if (currentPage === 0) {
      return 'Get Started';
    }

    if (isLastPage) {
      return 'Start Using App';
    }

    return 'Next';
  };

  return (
    <BottomSheet
      isVisible={visible}
      onClose={close}
      onOpen={open}
      closeable={false}>
      <View style={styles.content}>
        <Carousel
          carouselItemProps={{
            style: {
              paddingHorizontal: pagePadding,
            },
          }}
          onSlide={setCurrentPage}
          ref={carouselRef}
          items={items}
        />
        <View style={[styles.buttons, {paddingHorizontal: pagePadding}]}>
          <Button
            title={currentPage === 0 ? 'Not Now' : 'Back'}
            onPress={() => {
              if (currentPage === 0) {
                close();
                return;
              }

              if (carouselRef.current) {
                carouselRef.current.goToPrev();
              }
            }}
            variant="outline"
            size="small"
            style={styles.btn}
          />
          <Button
            title={ctaText()}
            onPress={() => {
              if (!carouselRef.current) {
                return;
              }

              if (isLastPage) {
                storage.set('onboarded', true);
                close();
                return;
              }

              carouselRef.current.goToNext();
            }}
            variant="primary"
            size="small"
            style={styles.btn}
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    marginHorizontal: -16,
  },
  buttons: {
    marginTop: 32,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
  },
});

export default OnboardingBottomSheet;
