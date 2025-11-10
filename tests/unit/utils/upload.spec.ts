import fs from 'fs';
import path from 'path';
import {
  getFileExtension,
  isValidImageFile,
  deleteFile,
  deleteImageIfExists
} from '../../../src/utils/upload';

// Match deleteFile base path: src/utils + '../upload' => src/upload
const deleteBaseDir = path.join(__dirname, '../../../src/upload');

describe('utils/upload', () => {
  beforeAll(() => {
    if (!fs.existsSync(deleteBaseDir)) {
      fs.mkdirSync(deleteBaseDir, { recursive: true });
    }
  });

  test('getFileExtension returns lowercased extension', () => {
    expect(getFileExtension('photo.JPG')).toBe('.jpg');
    expect(getFileExtension('image.png')).toBe('.png');
  });

  test('isValidImageFile positive cases', () => {
    expect(isValidImageFile('a.jpg')).toBe(true);
    expect(isValidImageFile('b.jpeg')).toBe(true);
    expect(isValidImageFile('c.png')).toBe(true);
  });

  test('isValidImageFile negative cases', () => {
    expect(isValidImageFile('a.gif')).toBe(false);
    expect(isValidImageFile('b.txt')).toBe(false);
    expect(isValidImageFile('c')).toBe(false);
  });

  test('deleteFile removes existing file from src/upload', async () => {
    const fname = 'testfile.jpg';
    const fpath = path.join(deleteBaseDir, fname);
    fs.writeFileSync(fpath, 'data');
    expect(fs.existsSync(fpath)).toBe(true);
    const result = await deleteFile(fname);
    expect(result).toBe(true);
    expect(fs.existsSync(fpath)).toBe(false);
  });

  test('deleteImageIfExists no throw when file missing', async () => {
    await expect(deleteImageIfExists('nonexistent.jpg')).resolves.toBeUndefined();
  });
});
