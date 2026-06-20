/**
 * qrToken.ts
 * -------------------------------------------------
 * Tạo và verify QR token bằng HMAC-SHA256 (Web Crypto API).
 * Không cần thư viện ngoài — chạy hoàn toàn trên browser.
 *
 * Format token (base64url): <payload_b64>.<signature_b64>
 *
 * Lý do KHÔNG nhét thẳng ID vào QR:
 *  - QR có thể bị chụp màn hình/sao chép → giả mạo
 *  - Thêm `exp` (expiry) → token hết hạn sau N phút
 *  - Chữ ký HMAC đảm bảo chỉ server/FE biết secret mới tạo được token hợp lệ
 */

const SECRET = import.meta.env.VITE_QR_SECRET ?? 'parking-qr-hmac-secret-dev-2024';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64urlEncode(buf: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function base64urlDecode(str: string): ArrayBuffer {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

async function importKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    return crypto.subtle.importKey(
        'raw',
        enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

// ─── Payload type ──────────────────────────────────────────────────────────────

export interface QRPayload {
    /** Phân biệt giữa check-in (từ booking) và check-out (từ session) */
    type?: 'checkin' | 'checkout';
    /** MongoDB _id của Booking (dùng cho checkin) */
    bookingId?: string;
    /** MongoDB _id của ParkingSession (dùng cho checkout) */
    sessionId?: string;
    /** Receipt ID hoặc Session Code (dùng để hiện UI) */
    receiptId?: string;
    /** Biển số xe */
    licensePlate?: string;
    /** Slot code — staff dẫn xe vào đúng chỗ */
    slotCode?: string;
    /** Unix timestamp (ms) — token hết hạn */
    exp: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * Tạo QR token có chữ ký HMAC-SHA256.
 * @param payload  Dữ liệu muốn encode
 * @param ttlMs    Thời gian sống (mặc định 24 giờ)
 * @returns        Chuỗi token dạng <payload_b64>.<sig_b64>
 */
export async function createQRToken(
    payload: Omit<QRPayload, 'exp'>,
    ttlMs = 24 * 60 * 60 * 1000
): Promise<string> {
    const fullPayload: QRPayload = {
        ...payload,
        exp: Date.now() + ttlMs,
    };

    const enc = new TextEncoder();
    const payloadStr = JSON.stringify(fullPayload);
    const payloadB64 = base64urlEncode(enc.encode(payloadStr).buffer);

    const key = await importKey(SECRET);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
    const sigB64 = base64urlEncode(sigBuf);

    return `${payloadB64}.${sigB64}`;
}

/**
 * Verify và parse QR token.
 * Trả về payload nếu hợp lệ, throw nếu sai chữ ký hoặc hết hạn.
 */
export async function verifyQRToken(token: string): Promise<QRPayload> {
    const parts = token.split('.');
    if (parts.length !== 2) throw new Error('Invalid token format');

    const [payloadB64, sigB64] = parts;

    // 1. Verify chữ ký
    const enc = new TextEncoder();
    const key = await importKey(SECRET);
    const sigBuf = base64urlDecode(sigB64);
    const isValid = await crypto.subtle.verify(
        'HMAC',
        key,
        sigBuf,
        enc.encode(payloadB64)
    );
    if (!isValid) throw new Error('Invalid signature — token bị giả mạo');

    // 2. Parse payload
    const payloadBuf = base64urlDecode(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBuf);
    const payload: QRPayload = JSON.parse(payloadStr);

    // 3. Check expiry
    if (Date.now() > payload.exp) {
        const expiredAgo = Math.round((Date.now() - payload.exp) / 60000);
        throw new Error(`Token hết hạn ${expiredAgo} phút trước`);
    }

    return payload;
}

/**
 * Parse token KHÔNG verify (dùng để hiện UI preview, không dùng để xác thực).
 */
export function parseQRTokenUnsafe(token: string): QRPayload | null {
    try {
        const [payloadB64] = token.split('.');
        const payloadBuf = base64urlDecode(payloadB64);
        return JSON.parse(new TextDecoder().decode(payloadBuf));
    } catch {
        return null;
    }
}
