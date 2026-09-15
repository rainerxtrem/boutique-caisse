import "server-only";
import QRCode from "qrcode";

/** Renders a QR code as an inline SVG markup string (safe to drop into JSX via dangerouslySetInnerHTML). */
export async function generateQrCodeSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    color: { dark: "#14181f", light: "#ffffff" },
  });
}
