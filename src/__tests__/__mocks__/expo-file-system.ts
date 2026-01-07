export const documentDirectory = 'file:///mock-document-directory/';

export const getInfoAsync = jest.fn().mockResolvedValue({
  exists: true,
  isDirectory: false,
  size: 1000
});

export const makeDirectoryAsync = jest.fn().mockResolvedValue(undefined);
export const copyAsync = jest.fn().mockResolvedValue(undefined);
export const deleteAsync = jest.fn().mockResolvedValue(undefined);
export const readAsStringAsync = jest.fn().mockResolvedValue('mock-content');
export const writeAsStringAsync = jest.fn().mockResolvedValue(undefined);
export const readDirectoryAsync = jest.fn().mockResolvedValue([]);

export const EncodingType = {
  Base64: 'base64',
  UTF8: 'utf8',
};
