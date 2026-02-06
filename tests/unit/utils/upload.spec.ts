
// Mock config BEFORE import
jest.mock('../../../src/utils/config', () => ({ // Note: no .js extension needed here usually if ts-jest handles it, but let's be safe. standard mock path resolution works.
  getEnvironmentConfig: jest.fn(() => ({
    GCS_BUCKET_NAME: 'test-bucket',
    GCS_PROJECT_ID: 'test-project',
    MAX_FILE_SIZE: '5MB'
  }))
}));

// Mock Google Cloud Storage
const mockFileDelete = jest.fn().mockResolvedValue([{}]);
const mockBucketFile = jest.fn(() => ({
  delete: mockFileDelete,
  createWriteStream: jest.fn()
}));
const mockBucket = jest.fn(() => ({
  file: mockBucketFile
}));
const mockStorage = jest.fn(() => ({
  bucket: mockBucket
}));

jest.mock('@google-cloud/storage', () => ({
  Storage: mockStorage
}));

import {
  getFileExtension,
  isValidImageFile,
  deleteFile,
  deleteImageIfExists
} from '../../../src/utils/upload';

describe('utils/upload', () => {

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('deleteFile calls GCS bucket delete', async () => {
    const fname = 'testfile.jpg';
    const result = await deleteFile(fname);

    expect(result).toBe(true);
    // Verify GCS was called
    // We can't easily access the mock instances created inside the module unless we export the mocks from the setup or spy on them.
    // However, since we defined the mocks in the scope of this test file and passed them to jest.mock factory,
    // we *can* verify them if we reused the variables. 
    // Wait, jest.mock factory functions utilize the scope differently. variables must be prefixed with 'mock'.

    // Actually, to reference variables inside jest.mock, they must be prefixed with 'mock'. 
    // I did name them mockStorage, mockBucket, etc.
    expect(mockBucketFile).toHaveBeenCalledWith(fname);
    expect(mockFileDelete).toHaveBeenCalled();
  });

  test('deleteImageIfExists calls deleteFile', async () => {
    const fname = 'test.jpg';
    await deleteImageIfExists(fname);
    expect(mockBucketFile).toHaveBeenCalledWith(fname);
    expect(mockFileDelete).toHaveBeenCalled();
  });

  test('deleteImageIfExists does nothing if null', async () => {
    await deleteImageIfExists(null);
    expect(mockBucketFile).not.toHaveBeenCalled();
  });
});
