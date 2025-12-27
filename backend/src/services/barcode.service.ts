import { prisma } from '../database/client';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { z } from 'zod';

// Validation schemas
export const barcodeGenerateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
  quantity: z.number().int().min(1).max(100).default(1),
  showStoreName: z.boolean().optional().default(true),
  showProductName: z.boolean().optional().default(true),
  showPrice: z.boolean().optional().default(true),
  paperSize: z.enum(['A4', 'A5', 'LABEL']).optional().default('A4'),
});

export const qrcodeGenerateSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'At least one product ID is required'),
  quantity: z.number().int().min(1).max(100).default(1),
  showReferenceNumber: z.boolean().optional().default(true),
  paperSize: z.enum(['A4', 'A5', 'LABEL']).optional().default('A4'),
});

export const singleBarcodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  format: z.enum(['CODE128', 'CODE39', 'EAN13', 'EAN8', 'UPC']).optional().default('CODE128'),
});

export class BarcodeService {
  // Generate barcode data for products
  async generateBarcodes(tenantId: string, data: z.infer<typeof barcodeGenerateSchema>) {
    const validated = barcodeGenerateSchema.parse(data);

    // Get products with their details
    const products = await (prisma as any).product.findMany({
      where: {
        id: { in: validated.productIds },
        tenantId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
      },
    });

    if (products.length === 0) {
      throw new AppErrorClass('No products found', 404, 'PRODUCTS_NOT_FOUND');
    }

    // Get tenant info for store name
    const tenant = await (prisma as any).tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // Generate barcode data for each product
    const barcodeData = products.map((product: any) => {
      const barcodes = [];
      for (let i = 0; i < validated.quantity; i++) {
        barcodes.push({
          productId: product.id,
          productName: validated.showProductName ? product.name : null,
          storeName: validated.showStoreName ? tenant?.name : null,
          price: validated.showPrice ? product.price : null,
          code: product.barcode || product.sku,
          sku: product.sku,
        });
      }
      return {
        product: product.name,
        barcodes,
      };
    });

    return {
      paperSize: validated.paperSize,
      products: barcodeData,
      totalBarcodes: products.length * validated.quantity,
    };
  }

  // Generate QR code data for products
  async generateQRCodes(tenantId: string, data: z.infer<typeof qrcodeGenerateSchema>) {
    const validated = qrcodeGenerateSchema.parse(data);

    // Get products with their details
    const products = await (prisma as any).product.findMany({
      where: {
        id: { in: validated.productIds },
        tenantId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
      },
    });

    if (products.length === 0) {
      throw new AppErrorClass('No products found', 404, 'PRODUCTS_NOT_FOUND');
    }

    // Generate QR code data for each product
    const qrcodeData = products.map((product: any) => {
      const qrcodes = [];
      for (let i = 0; i < validated.quantity; i++) {
        // Generate a reference number
        const refNumber = `${product.sku}-${Date.now()}-${i}`;
        qrcodes.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          code: product.barcode || product.sku,
          referenceNumber: validated.showReferenceNumber ? refNumber : null,
          // QR code content - can be URL or product data
          qrContent: JSON.stringify({
            id: product.id,
            sku: product.sku,
            name: product.name,
            ref: refNumber,
          }),
        });
      }
      return {
        product: product.name,
        qrcodes,
      };
    });

    return {
      paperSize: validated.paperSize,
      products: qrcodeData,
      totalQRCodes: products.length * validated.quantity,
    };
  }

  // Generate a single barcode
  async generateSingleBarcode(data: z.infer<typeof singleBarcodeSchema>) {
    const validated = singleBarcodeSchema.parse(data);

    return {
      code: validated.code,
      format: validated.format,
      // The actual barcode generation would be done on the frontend
      // using a library like JsBarcode
      barcodeData: {
        value: validated.code,
        format: validated.format,
      },
    };
  }

  // Generate barcode for a specific product
  async generateProductBarcode(tenantId: string, productId: string) {
    const product = await (prisma as any).product.findFirst({
      where: {
        id: productId,
        tenantId,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        barcode: true,
        price: true,
      },
    });

    if (!product) {
      throw new AppErrorClass('Product not found', 404, 'PRODUCT_NOT_FOUND');
    }

    // If product doesn't have a barcode, generate one
    let barcodeValue = product.barcode;
    if (!barcodeValue) {
      // Generate a barcode based on SKU
      barcodeValue = product.sku;
      
      // Update product with generated barcode
      await (prisma as any).product.update({
        where: { id: productId },
        data: { barcode: barcodeValue },
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      barcode: barcodeValue,
      price: product.price,
    };
  }

  // Generate auto barcode/SKU
  async generateAutoCode(tenantId: string, prefix: string = 'PRD') {
    // Get the last product SKU to generate the next one
    const lastProduct = await (prisma as any).product.findFirst({
      where: {
        tenantId,
        sku: { startsWith: prefix },
      },
      orderBy: { createdAt: 'desc' },
      select: { sku: true },
    });

    let nextNumber = 1;
    if (lastProduct?.sku) {
      const match = lastProduct.sku.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    const newCode = `${prefix}${String(nextNumber).padStart(6, '0')}`;

    return {
      code: newCode,
      prefix,
      number: nextNumber,
    };
  }
}

export default new BarcodeService();

