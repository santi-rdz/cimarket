-- CheckConstraint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_buyer_seller_different" CHECK ("buyer_id" <> "seller_id");

-- CheckConstraint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
