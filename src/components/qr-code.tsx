import { generateQrCodeSvg } from "@/lib/qrcode";

export async function QrCode({ value, size = 120 }: { value: string; size?: number }) {
  const svg = await generateQrCodeSvg(value);
  return (
    <div
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
