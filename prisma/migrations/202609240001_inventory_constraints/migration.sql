ALTER TABLE "Variant" ADD CONSTRAINT "Variant_valid_inventory" CHECK (stock >= 0 AND reserved >= 0 AND reserved <= stock);
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_valid_price" CHECK ("priceOverride" IS NULL OR "priceOverride" >= 0);
ALTER TABLE "Product" ADD CONSTRAINT "Product_valid_price" CHECK ("basePrice" >= 0 AND ("salePrice" IS NULL OR "salePrice" >= 0));
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_valid_amount" CHECK (quantity > 0 AND "unitPrice" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_valid_amount" CHECK ("totalAmount" >= 0 AND "shippingAmount" >= 0 AND "refundedAmount" >= 0 AND "refundedAmount" <= "totalAmount");
