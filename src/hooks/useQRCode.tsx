import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';

/**
 * Hook to generate a QR code as a data URL
 */
export const useQRCodeDataUrl = (value: string, size: number = 100): string | null => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setDataUrl(null);
      return;
    }

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Create the QR code element
    const root = createRoot(container);
    root.render(
      <QRCodeCanvas
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#1e3a5f"
      />
    );

    // Wait for render and extract data URL
    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        setDataUrl(canvas.toDataURL('image/png'));
      }
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  }, [value, size]);

  return dataUrl;
};

/**
 * Synchronous QR code generation for print templates
 * Returns a simple SVG-based QR code placeholder
 */
export const generateQRDataUrl = async (value: string, size: number = 100): Promise<string> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
      <QRCodeCanvas
        value={value}
        size={size}
        level="M"
        bgColor="#ffffff"
        fgColor="#1e3a5f"
      />
    );

    setTimeout(() => {
      const canvas = container.querySelector('canvas');
      if (canvas) {
        resolve(canvas.toDataURL('image/png'));
      } else {
        // Fallback placeholder
        resolve(createPlaceholderQR(size));
      }
      root.unmount();
      document.body.removeChild(container);
    }, 150);
  });
};

/**
 * Creates a simple placeholder QR code SVG
 */
const createPlaceholderQR = (size: number): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" fill="#ffffff"/>
      <rect x="10" y="10" width="30" height="30" fill="#1e3a5f"/>
      <rect x="${size-40}" y="10" width="30" height="30" fill="#1e3a5f"/>
      <rect x="10" y="${size-40}" width="30" height="30" fill="#1e3a5f"/>
      <rect x="45" y="45" width="${size-90}" height="${size-90}" fill="#e2e8f0"/>
      <text x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="middle" fill="#1e3a5f" font-size="10" font-family="monospace">QR</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};
