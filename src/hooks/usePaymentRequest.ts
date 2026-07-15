/**
 * D.8: Payment Request API — Hook para procesamiento de pagos premium
 * Referencia: https://developer.mozilla.org/en-US/docs/Web/API/Payment_Request_API
 */
import { useState, useCallback } from 'react';

export interface PaymentItem {
  label: string;
  amount: { value: string; currency: string };
}

export interface PaymentOptions {
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
}

export function usePaymentRequest(
  items: PaymentItem[],
  methods?: PaymentMethodData[],
  options?: PaymentOptions
) {
  const [isSupported, setIsSupported] = useState(
    typeof window !== 'undefined' && 'PaymentRequest' in window
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState<PaymentResponse | null>(null);

  const requestPayment = useCallback(async (): Promise<PaymentResponse | null> => {
    if (!isSupported || typeof window === 'undefined') {
      console.warn('[PaymentRequest] API no soportada en este navegador');
      return null;
    }

    setIsProcessing(true);
    try {
      const defaultMethods: PaymentMethodData[] = methods || [
        {
          supportedMethods: 'https://google.com/pay',
          data: { environment: 'TEST' },
        },
      ];

      const paymentRequest = new PaymentRequest(
        defaultMethods,
        {
          total: {
            label: items[0]?.label || 'Total',
            amount: items[0]?.amount || { value: '0.00', currency: 'MXN' },
          },
          displayItems: items,
        },
        {
          requestPayerName: options?.requestPayerName ?? true,
          requestPayerEmail: options?.requestPayerEmail ?? true,
          requestPayerPhone: options?.requestPayerPhone ?? false,
        }
      );

      const canPay = await paymentRequest.canMakePayment();
      if (!canPay) {
        console.warn('[PaymentRequest] No hay metodos de pago disponibles');
        setIsProcessing(false);
        return null;
      }

      const response = await paymentRequest.show();
      setLastResult(response);
      setIsProcessing(false);
      return response;
    } catch (err) {
      console.error('[PaymentRequest] Error:', err);
      setIsProcessing(false);
      return null;
    }
  }, [isSupported, items, methods, options]);

  return { isSupported, isProcessing, requestPayment, lastResult };
}
