import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const Paypal = ({ amount, currency, onSuccess, onError }) => {
  return (
    <PayPalButtons
      style={{ 
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "subscribe",
        height: 40
      }}
      createOrder={(data, actions) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: {
                value: amount || "0.99",
                currency_code: currency || "USD",
                breakdown: {
                  item_total: {
                    currency_code: currency || "USD",
                    value: amount || "0.99"
                  }
                }
              },
              items: [
                {
                  name: "Monthly Newsletter Subscription",
                  description: "Access to premium energy saving tips and deals",
                  quantity: "1",
                  unit_amount: {
                    currency_code: currency || "USD",
                    value: amount || "0.99"
                  },
                  category: "DIGITAL_GOODS"
                }
              ]
            }
          ],
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
            brand_name: "SPYDER Energy"
          }
        });
      }}
      onApprove={(data, actions) => {
        return actions.order.capture().then((details) => {
          onSuccess(details);
        });
      }}
      onError={(err) => {
        console.error("PayPal error:", err);
        onError(err);
      }}
    />
  );
};

export default Paypal;