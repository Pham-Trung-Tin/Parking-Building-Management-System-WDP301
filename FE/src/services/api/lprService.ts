import axiosClient from './axiosClient';

export interface LPRResult {
    licensePlate: string;
    confidence: number;
    engine: 'tesseract' | 'plate_recognizer';
    processingTimeMs: number;
    candidates: { plate: string; confidence: number }[];
    raw?: string;
}

const lprService = {
    /**
     * POST /lpr/recognize
     * Send a camera-captured image (base64) to backend for AI license plate recognition
     */
    recognizeFromBase64: (imageBase64: string): Promise<any> => {
        return axiosClient.post('/lpr/recognize', { imageBase64 });
    },

    /**
     * POST /lpr/recognize
     * Send a camera-captured image (File/Blob) to backend for AI license plate recognition
     */
    recognizeFromFile: (imageFile: File | Blob): Promise<any> => {
        const formData = new FormData();
        formData.append('image', imageFile);
        return axiosClient.post('/lpr/recognize', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

export default lprService;
