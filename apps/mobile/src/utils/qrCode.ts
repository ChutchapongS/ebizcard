import QRCode from 'react-native-qrcode-svg';

export const generateQRCode = (url: string, size: number = 200) => {
  return (
    <QRCode
      value={url}
      size={size}
      color="black"
      backgroundColor="white"
      logoSize={30}
      logoMargin={2}
      logoBorderRadius={15}
      quietZone={10}
    />
  );
};

export const generateQRCodeDataURL = async (url: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-qr', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cardId: url.split('/').pop() }),
    });

    const data = await response.json();
    return data.qrCode;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
};
