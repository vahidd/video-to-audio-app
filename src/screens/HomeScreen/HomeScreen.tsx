import {useCallback, useMemo, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Image} from 'expo-image';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// Components
import Page from '@components/Page';
import Text from '@shared/components/Text';
import ConvertBottomSheet from '@components/ConvertBottomSheet';
import FilePreviewBottomSheet from '@components/FilePreviewBottomSheet';
import SelectButtons from './components/SelectButtons';
import RecentFiles from './components/RecentFiles';
import Settings from './components/Settings';
import OnboardingBottomSheet from '@components/OnboardingBottomSheet';

// Utils
import {getConverts} from '@utils/storage';
import wait from '@shared/utils/wait';
import {askForReview} from '@shared/utils/askForReview';

// Types
import {ConvertedFile, SelectedAssetToConvert} from '@src/types';

// Assets
import Logo from '@assets/images/logo.png';

const HomeScreen = () => {
  const [files, setFiles] = useState<ConvertedFile[]>(getConverts());
  const insets = useSafeAreaInsets();
  const [selectAssetToConvert, setSelectAssetToConvert] =
    useState<SelectedAssetToConvert | null>(null);
  const [selectConvertIdToPreview, setSelectConvertIdToPreview] = useState<
    null | string
  >(null);

  const handleClosePreview = useCallback(() => {
    setSelectConvertIdToPreview(null);
    setFiles(getConverts());
  }, []);

  const handleRefreshFiles = useCallback(() => {
    setFiles(getConverts());
  }, []);

  const selectConvertToPreview = useMemo(() => {
    if (!selectConvertIdToPreview) {
      return null;
    }
    const file = files.find(f => f.id === selectConvertIdToPreview);
    if (!file) {
      return null;
    }
    return file;
  }, [files, selectConvertIdToPreview]);

  return (
    <Page style={[styles.root, {paddingBottom: insets.bottom + 12}]}>
      <View style={[styles.header, files.length ? {} : styles.headerFill]}>
        <Settings />
        <View style={styles.headerTexts}>
          <Image source={Logo} style={styles.logo} />
          <Text variant="heading1" center>
            Select a video or audio
          </Text>
        </View>
        <SelectButtons onFileSelected={setSelectAssetToConvert} />
      </View>
      <RecentFiles
        files={files}
        onOpenPreview={file => {
          setSelectConvertIdToPreview(file.id);
          wait(2000).then(() => {
            askForReview('recent_convert_open', 5);
          });
        }}
      />
      <ConvertBottomSheet
        selection={selectAssetToConvert}
        onComplete={async convert => {
          setSelectAssetToConvert(null);
          handleRefreshFiles();
          await wait(500);
          setSelectConvertIdToPreview(convert.id);
          if (!convert.isRingtone) {
            wait(2000).then(() => {
              askForReview('convert', 1);
            });
          }
        }}
      />
      <FilePreviewBottomSheet
        file={selectConvertToPreview}
        onClose={handleClosePreview}
        onRefreshFiles={handleRefreshFiles}
      />
      <OnboardingBottomSheet />
    </Page>
  );
};

const styles = StyleSheet.create({
  root: {
    gap: 24,
  },
  header: {
    gap: 24,
    paddingTop: 12,
    justifyContent: 'center',
  },
  headerFill: {
    flexGrow: 1,
  },
  headerTexts: {
    gap: 8,
    alignItems: 'center',
  },
  logo: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
});

export default HomeScreen;
