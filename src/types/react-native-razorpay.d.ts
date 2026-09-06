declare module 'react-native-razorpay' {
  type CheckoutResponse = {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  };

  type CheckoutOptions = {
    amount: number;
    currency: string;
    description: string;
    key: string;
    name: string;
    order_id: string;
    prefill?: { contact?: string; email?: string; name?: string };
    theme?: { color?: string };
  };

  const RazorpayCheckout: {
    open(options: CheckoutOptions): Promise<CheckoutResponse>;
  };
  export default RazorpayCheckout;
}
