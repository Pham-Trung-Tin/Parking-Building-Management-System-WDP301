import axiosClient from './axiosClient';

export interface PaymentInitiateBankTransferResponse {
    payment: any;
    qrUrl: string;
    transferContent: string;
    amount: number;
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountName: string;
    };
}

export interface PaymentBankTransferStatusResponse {
    status: string;
    isPaid: boolean;
    transferContent: string;
    amount: number;
    invoiceCode: string;
    paidAt: string;
}

const paymentService = {
    /** POST /payments/bank-transfer/initiate — Initiate bank transfer payment */
    initiateBankTransfer: (sessionId: string): Promise<PaymentInitiateBankTransferResponse> => {
        return axiosClient.post('/payments/bank-transfer/initiate', { sessionId });
    },

    /** POST /payments/bank-transfer/booking/initiate — Initiate bank transfer payment for Booking */
    initiateBookingBankTransfer: (bookingId: string): Promise<PaymentInitiateBankTransferResponse> => {
        return axiosClient.post('/payments/bank-transfer/booking/initiate', { bookingId });
    },

    /** POST /payments/bank-transfer/monthly-pass/initiate — Initiate bank transfer payment for Monthly Pass */
    initiateMonthlyPassBankTransfer: (monthlyPassId: string): Promise<PaymentInitiateBankTransferResponse> => {
        return axiosClient.post('/payments/bank-transfer/monthly-pass/initiate', { monthlyPassId });
    },

    /** GET /payments/bank-transfer/:id/status — Check bank transfer status */
    checkBankTransferStatus: (paymentId: string): Promise<PaymentBankTransferStatusResponse> => {
        return axiosClient.get(`/payments/bank-transfer/${paymentId}/status`);
    },
    
    /** POST /payments/cash/process — Process cash payment (mostly for staff) */
    processCash: (data: { sessionId: string, cashReceived: number }): Promise<any> => {
        return axiosClient.post('/payments/cash', data);
    },
    
    /** POST /payments/momo/initiate — Initiate MoMo payment */
    initiateMomo: (data: { sessionId: string, returnUrl: string }): Promise<any> => {
        return axiosClient.post('/payments/momo/initiate', data);
    }
};

export default paymentService;
