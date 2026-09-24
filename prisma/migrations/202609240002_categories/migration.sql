CREATE TABLE "Category" (
 "id" TEXT NOT NULL,
 "name" TEXT NOT NULL,
 "description" TEXT NOT NULL DEFAULT '',
 "image" TEXT NOT NULL DEFAULT '',
 "position" INTEGER NOT NULL DEFAULT 0,
 CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
INSERT INTO "Category" ("id", "name")
SELECT 'category-' || md5("category"), "category" FROM "Product" GROUP BY "category";
ALTER TABLE "Product" ADD CONSTRAINT "Product_category_fkey"
FOREIGN KEY ("category") REFERENCES "Category"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
