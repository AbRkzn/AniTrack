import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { generateId } from '../utils/helpers';

const PHOTOS_DIR_NAME = 'anitrack-photos';
const DEFAULT_MAX = 6;

function getPhotosDirectory(): Directory {
  const dir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
  return dir;
}

async function persistAsset(uri: string): Promise<string> {
  try {
    const source = new File(uri);
    if (!source.exists) return uri;
    const extension = (uri.split('.').pop()?.split('?')[0] || 'jpg').toLowerCase();
    const target = new File(getPhotosDirectory(), `${generateId('photo')}.${extension}`);
    if (target.exists) {
      target.delete();
    }
    await source.copy(target);
    return target.uri;
  } catch {
    return uri;
  }
}

export async function pickPhotos(current: string[], max: number = DEFAULT_MAX): Promise<string[]> {
  const remaining = Math.max(0, max - current.length);
  if (remaining <= 0) return current;

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Permission to access the photo library is required.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    quality: 0.7,
  });

  if (result.canceled || !result.assets?.length) return current;
  const persisted = await Promise.all(result.assets.map((asset) => persistAsset(asset.uri)));
  return [...current, ...persisted].slice(0, max);
}

export async function capturePhoto(current: string[], max: number = DEFAULT_MAX): Promise<string[]> {
  const remaining = Math.max(0, max - current.length);
  if (remaining <= 0) return current;

  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Camera permission is required.');
  }

  const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (result.canceled || !result.assets?.length) return current;

  const persisted = await persistAsset(result.assets[0].uri);
  return [...current, persisted].slice(0, max);
}

export async function deletePhotoFile(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // ignore cleanup failures
  }
}
