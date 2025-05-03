import {FC, PropsWithChildren, ReactElement, RefObject} from 'react';
import {ScrollView, ScrollViewProps, StyleSheet} from 'react-native';
import {ImageBackground} from 'expo-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import BackgroundImage from '@assets/images/blur-background.png';

const Page: FC<
  {
    headerTitle?: string;
    style?: ScrollViewProps['style'];
    scrollViewRef?: RefObject<ScrollView>;
    Footer?: ReactElement;
  } & PropsWithChildren &
    ScrollViewProps
> = ({children, style, scrollViewRef, Footer, ...rest}) => {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={BackgroundImage}
      contentFit="contain"
      contentPosition="top"
      imageStyle={styles.bgImage}
      style={styles.root}>
      <ScrollView
        {...rest}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingTop: insets.top + 12,
          },
          styles.content,
          style,
        ]}
        ref={scrollViewRef}>
        {children}
      </ScrollView>
      {Footer}
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  bgImage: {
    opacity: 0.4,
  },
});

export default Page;
