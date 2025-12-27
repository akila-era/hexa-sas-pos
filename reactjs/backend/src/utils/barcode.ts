import bwipjs from 'bwip-js';

export interface BarcodeOptions {
  text: string;
  type?: string;
  scale?: number;
  height?: number;
  includeText?: boolean;
}

export const generateBarcode = async (options: BarcodeOptions): Promise<Buffer> => {
  const {
    text,
    type = 'code128',
    scale = 3,
    height = 10,
    includeText = true,
  } = options;

  try {
    const png = await bwipjs.toBuffer({
      bcid: type, // Barcode type
      text: text, // Text to encode
      scale: scale, // 3x scaling factor
      height: height, // Bar height, in millimeters
      includetext: includeText, // Show human-readable text
      textxalign: 'center', // Always center the text
    });

    return png;
  } catch (error) {
    throw new Error(`Failed to generate barcode: ${(error as Error).message}`);
  }
};

// Supported barcode types
export const BARCODE_TYPES = {
  CODE128: 'code128',
  CODE39: 'code39',
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPC_A: 'upca',
  UPC_E: 'upce',
  ITF14: 'itf14',
  CODE93: 'code93',
  CODABAR: 'rationalizedCodabar',
} as const;

