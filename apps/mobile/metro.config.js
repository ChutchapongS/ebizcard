const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for additional file extensions
config.resolver.assetExts.push(
  // Fonts
  'ttf',
  'otf',
  'woff',
  'woff2',
  // Images
  'webp',
  'svg',
  // Audio
  'mp3',
  'wav',
  'aac',
  // Video
  'mp4',
  'mov',
  'avi',
  // Documents
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  // Archives
  'zip',
  'rar',
  '7z',
  // Other
  'db',
  'sqlite',
  'json'
);

// Add support for additional source extensions
config.resolver.sourceExts.push('jsx', 'tsx', 'ts', 'js', 'json');

module.exports = config;
