import QRCode from 'qrcode';

export interface QRCodeOptions {
  text: string;
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export const generateQRCode = async (options: QRCodeOptions): Promise<Buffer> => {
  const {
    text,
    width = 200,
    margin = 2,
    color = { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel = 'M',
  } = options;

  try {
    const buffer = await QRCode.toBuffer(text, {
      width,
      margin,
      color,
      errorCorrectionLevel,
      type: 'png',
    });

    return buffer;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
  }
};

export const generateQRCodeDataURL = async (options: QRCodeOptions): Promise<string> => {
  const {
    text,
    width = 200,
    margin = 2,
    color = { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel = 'M',
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width,
      margin,
      color,
      errorCorrectionLevel,
    });

    return dataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${(error as Error).message}`);
  }
};

