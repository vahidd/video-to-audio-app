import {MMKV} from 'react-native-mmkv';
import RNFS from 'react-native-fs';
import dayjs from 'dayjs';
import {DocumentPickerAsset} from 'expo-document-picker';
import {ImagePickerAsset} from 'expo-image-picker';
import {
  getExtensionFromUri,
  getFileNameFromAsset,
  getFileNameFromUri,
  getSafeUniqueFileNameFromAsset,
} from '@utils/index';
import {ConvertedFile} from '@src/types';

const STORAGE_KEY = 'video2audio_all_converts';
const storage = new MMKV();

const getConvertsFolder = async () => {
  const folder = RNFS.DocumentDirectoryPath + '/video2audio';

  const exists = await RNFS.exists(folder);
  if (!exists) {
    await RNFS.mkdir(folder);
  }

  return folder;
};

export const getConverts = () => {
  try {
    const data = storage.getString(STORAGE_KEY);
    if (!data) {
      return [];
    }

    return JSON.parse(data) as Array<ConvertedFile>;
  } catch {
    return [];
  }
};

export const getConvertById = (id: string) => {
  const files = getConverts();
  return files.find(file => file.id === id);
};

export const saveConvert = async ({
  asset,
  convertedUri,
  outputFormat,
  duration,
  fileThumbnail,
  isRingtone,
}: {
  asset: DocumentPickerAsset | ImagePickerAsset;
  convertedUri: string;
  outputFormat: string;
  duration: number;
  fileThumbnail: string;
  isRingtone?: boolean;
}) => {
  const files = getConverts();
  const convertsFolder = await getConvertsFolder();

  const newName = await getSafeUniqueFileNameFromAsset(
    asset,
    convertsFolder,
    outputFormat,
  );

  const permanentUri = `${convertsFolder}/${newName}`;
  await RNFS.moveFile(convertedUri, permanentUri);

  let thumbnailUri = '';
  if (fileThumbnail) {
    thumbnailUri = convertsFolder + `/${getFileNameFromUri(fileThumbnail)}`;
    await RNFS.moveFile(fileThumbnail, thumbnailUri);
  }

  const newConvert = {
    id: Math.random().toString(36).substring(2, 15),
    uri: permanentUri,
    date: dayjs().toISOString(),
    convertFormat: outputFormat,
    fileSize: (await RNFS.stat(permanentUri)).size,
    thumbnailUri,
    duration,
    isRingtone,
  } satisfies ConvertedFile;

  storage.set(STORAGE_KEY, JSON.stringify([newConvert, ...files]));

  return newConvert;
};

export const deleteConvert = async (id: string) => {
  const convert = getConvertById(id);

  if (!convert) {
    return;
  }

  const {uri, thumbnailUri} = convert;

  try {
    await RNFS.unlink(uri);
    if (thumbnailUri) {
      await RNFS.unlink(thumbnailUri);
    }
  } catch (e) {
    console.log(e);
  }

  const files = getConverts().filter(file => file.id !== id);
  storage.set(STORAGE_KEY, JSON.stringify(files));
};

export const updateConvert = (id: string, newFile: Partial<ConvertedFile>) => {
  const files = getConverts().map(file => {
    if (file.id === id) {
      return {
        ...file,
        ...newFile,
      };
    }
    return file;
  });

  storage.set(STORAGE_KEY, JSON.stringify(files));
};

export const renameConvert = async (id: string, newName: string) => {
  const file = getConvertById(id);

  if (!file) {
    return false;
  }

  // Check if the new name is the same as the current name
  if (getFileNameFromAsset(file, false) === newName) {
    return true;
  }

  const convertsFolder = await getConvertsFolder();
  const extension = getExtensionFromUri(file.uri);

  const preparedName = await getSafeUniqueFileNameFromAsset(
    newName,
    convertsFolder,
    extension,
  );

  const newUri = `${convertsFolder}/${preparedName}`;
  await RNFS.moveFile(file.uri, `${convertsFolder}/${preparedName}`);
  updateConvert(id, {
    uri: newUri,
  });
};

export default storage;
