import imageService, {
  validateImageFile,
  MAX_FILE_SIZE_BYTES,
  MAX_IMAGES_PER_PROPERTY,
  UploadFile,
} from '../../services/imageService';
import { ValidationError } from '../../middleware/errorHandler';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockMakePublic = jest.fn().mockResolvedValue(undefined);
const mockSave = jest.fn().mockResolvedValue(undefined);
const mockDelete = jest.fn().mockResolvedValue(undefined);
const mockGetFiles = jest.fn();

const mockFile = jest.fn().mockImplementation((filePath: string) => ({
  save: mockSave,
  makePublic: mockMakePublic,
  delete: mockDelete,
  name: filePath,
}));

const mockBucket = {
  name: 'test-bucket',
  file: mockFile,
  getFiles: mockGetFiles,
};

jest.mock('../../config/firebase', () => ({
  getFirebaseStorage: jest.fn(() => ({
    bucket: jest.fn(() => mockBucket),
  })),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeFile(overrides: Partial<UploadFile> = {}): UploadFile {
  return {
    buffer: Buffer.from('fake-image-data'),
    mimetype: 'image/jpeg',
    originalname: 'photo.jpg',
    size: 1024,
    ...overrides,
  };
}

// ─── validateImageFile ────────────────────────────────────────────────────────

describe('validateImageFile', () => {
  it('accepts valid JPEG', () => {
    expect(() => validateImageFile(makeFile())).not.toThrow();
  });

  it('accepts valid PNG', () => {
    expect(() =>
      validateImageFile(makeFile({ mimetype: 'image/png', originalname: 'photo.png' }))
    ).not.toThrow();
  });

  it('accepts valid WebP', () => {
    expect(() =>
      validateImageFile(makeFile({ mimetype: 'image/webp', originalname: 'photo.webp' }))
    ).not.toThrow();
  });

  it('rejects invalid MIME type', () => {
    expect(() =>
      validateImageFile(makeFile({ mimetype: 'image/gif', originalname: 'photo.gif' }))
    ).toThrow(ValidationError);
  });

  it('rejects invalid extension', () => {
    expect(() =>
      validateImageFile(makeFile({ originalname: 'photo.bmp' }))
    ).toThrow(ValidationError);
  });

  it('rejects file exceeding 5MB', () => {
    expect(() =>
      validateImageFile(makeFile({ size: MAX_FILE_SIZE_BYTES + 1 }))
    ).toThrow(ValidationError);
  });

  it('accepts file exactly at 5MB limit', () => {
    expect(() =>
      validateImageFile(makeFile({ size: MAX_FILE_SIZE_BYTES }))
    ).not.toThrow();
  });
});

// ─── uploadImages ─────────────────────────────────────────────────────────────

describe('ImageService.uploadImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty array when no files provided', async () => {
    const result = await imageService.uploadImages('prop-1', []);
    expect(result).toEqual([]);
  });

  it('uploads a single image and returns public URL', async () => {
    const result = await imageService.uploadImages('prop-1', [makeFile()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(/^https:\/\/storage\.googleapis\.com\/test-bucket\/properties\/prop-1\//);
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockMakePublic).toHaveBeenCalledTimes(1);
  });

  it('uploads multiple images', async () => {
    const files = [makeFile(), makeFile({ originalname: 'photo2.png', mimetype: 'image/png' })];
    const result = await imageService.uploadImages('prop-1', files);
    expect(result).toHaveLength(2);
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it('throws ValidationError when exceeding max image count', async () => {
    const files = Array.from({ length: MAX_IMAGES_PER_PROPERTY + 1 }, () => makeFile());
    await expect(imageService.uploadImages('prop-1', files)).rejects.toThrow(ValidationError);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('throws ValidationError for invalid file type without uploading any', async () => {
    const files = [
      makeFile(),
      makeFile({ mimetype: 'application/pdf', originalname: 'doc.pdf' }),
    ];
    await expect(imageService.uploadImages('prop-1', files)).rejects.toThrow(ValidationError);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('throws ValidationError for oversized file without uploading any', async () => {
    const files = [makeFile({ size: MAX_FILE_SIZE_BYTES + 1 })];
    await expect(imageService.uploadImages('prop-1', files)).rejects.toThrow(ValidationError);
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('generates unique filenames for each upload', async () => {
    const files = [makeFile(), makeFile()];
    await imageService.uploadImages('prop-1', files);

    const calls = mockFile.mock.calls.map((c: string[]) => c[0]);
    expect(calls[0]).not.toEqual(calls[1]);
  });

  it('organizes files under propertyId folder', async () => {
    await imageService.uploadImages('prop-abc', [makeFile()]);
    const filePath: string = mockFile.mock.calls[0][0];
    expect(filePath).toMatch(/^properties\/prop-abc\//);
  });
});

// ─── deleteImage ──────────────────────────────────────────────────────────────

describe('ImageService.deleteImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes an image by its public URL', async () => {
    const url =
      'https://storage.googleapis.com/test-bucket/properties/prop-1/abc.jpg';
    await imageService.deleteImage('prop-1', url);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('does not throw for unrecognised URL format', async () => {
    await expect(
      imageService.deleteImage('prop-1', 'https://other-cdn.com/image.jpg')
    ).resolves.not.toThrow();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('throws ValidationError when image does not belong to property', async () => {
    const url =
      'https://storage.googleapis.com/test-bucket/properties/other-prop/abc.jpg';
    await expect(imageService.deleteImage('prop-1', url)).rejects.toThrow(ValidationError);
  });
});

// ─── deletePropertyImages ─────────────────────────────────────────────────────

describe('ImageService.deletePropertyImages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all files for a property', async () => {
    const fakeFiles = [{ delete: mockDelete }, { delete: mockDelete }];
    mockGetFiles.mockResolvedValue([fakeFiles]);

    await imageService.deletePropertyImages('prop-1');
    expect(mockDelete).toHaveBeenCalledTimes(2);
  });

  it('does nothing when no files exist', async () => {
    mockGetFiles.mockResolvedValue([[]]);
    await expect(imageService.deletePropertyImages('prop-1')).resolves.not.toThrow();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('does not throw when storage call fails', async () => {
    mockGetFiles.mockRejectedValue(new Error('Storage error'));
    await expect(imageService.deletePropertyImages('prop-1')).resolves.not.toThrow();
  });
});
