-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'MERCHANT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "MerchantStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('E_COMMERCE', 'RETAILER', 'DISTRIBUTOR', 'IMPORTER', 'EXPORTER', 'MANUFACTURER');

-- CreateEnum
CREATE TYPE "SubscriptionType" AS ENUM ('STARTER', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PROCESSING', 'APPROVED', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'MIXED_STOCK', 'REJECTED');

-- CreateEnum
CREATE TYPE "VariantGeneration" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "PickStrategy" AS ENUM ('FIFO', 'LIFO');

-- CreateEnum
CREATE TYPE "InventoryType" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'DAMAGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('FACEBOOK', 'WHATSAPP', 'TIKTOK', 'INSTAGRAM', 'MANUAL', 'WORDPRESS');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'PACKED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED');

-- CreateTable
CREATE TABLE "external_order_logs" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "externalOrderId" TEXT,
    "rawPayload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_order_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalDetails" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "secondaryContactNumber" TEXT,
    "profilePhoto" TEXT,
    "isProfilePhotoVerified" BOOLEAN NOT NULL DEFAULT false,
    "location" TEXT,
    "isVerifiedPhaseOne" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessDetails" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessLogo" TEXT,
    "businessType" TEXT NOT NULL,
    "facebookPageLink" TEXT,
    "websiteLink" TEXT,
    "dailyOrderEstimate" INTEGER,
    "storageSpace" TEXT,
    "courierPartner" TEXT,
    "paymentMethods" TEXT,
    "pickupHub" TEXT,
    "bio" TEXT,
    "businessLocation" TEXT NOT NULL,
    "isBusinessLogoVerified" BOOLEAN NOT NULL DEFAULT false,
    "isVerifiedPhaseTwo" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documents" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "nidFront" TEXT NOT NULL,
    "nidBack" TEXT NOT NULL,
    "passport" TEXT,
    "drivingLicense" TEXT,
    "tradeLicense" TEXT,
    "tinCertificate" TEXT,
    "binCertificate" TEXT,
    "bankDocuments" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "reviewReason" TEXT,
    "isVerifiedPhaseThree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "status" "PaymentStatus" DEFAULT 'PENDING',
    "usedMethod" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "bankDetails" TEXT NOT NULL,
    "isVerifiedPhaseFour" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderSource" "OrderSource" NOT NULL DEFAULT 'MANUAL',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerEmail" TEXT,
    "deliveryAddress" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'COD',
    "preferredCourier" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 60,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPayable" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "merchantNote" TEXT,
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPreBooking" BOOLEAN NOT NULL DEFAULT false,
    "preBookingDate" TIMESTAMP(3),
    "zipCode" TEXT,
    "trackingNumber" TEXT,
    "alternativePhone" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCode" TEXT,
    "category" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'PROCESSING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "variantImage" TEXT,
    "sku" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "gen" "VariantGeneration" NOT NULL DEFAULT 'AUTO',
    "pickStrategy" "PickStrategy" NOT NULL DEFAULT 'FIFO',
    "warehouseId" TEXT NOT NULL,
    "supplier" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT,
    "color" TEXT,
    "size" TEXT,
    "merchantDetailsId" TEXT NOT NULL,
    "merchantWebProductId" TEXT,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantPricing" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "salePrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VariantPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantLocation" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "zone" TEXT,
    "rack" TEXT,
    "shelf" TEXT,
    "bin" TEXT,
    "side" TEXT,

    CONSTRAINT "VariantLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockControl" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "minStock" INTEGER,
    "reorderPoint" INTEGER,
    "maxStock" INTEGER,

    CONSTRAINT "StockControl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "receivedDate" TIMESTAMP(3),

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "type" "InventoryType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarehouseLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarehouseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "contactNumber" TEXT NOT NULL,
    "position" TEXT,
    "otp" TEXT,
    "otpExpires" TIMESTAMP(3),
    "otpAttempts" INTEGER,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantDetails_userId_key" ON "MerchantDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalDetails_merchantDetailsId_key" ON "PersonalDetails"("merchantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessDetails_merchantDetailsId_key" ON "BusinessDetails"("merchantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "Documents_merchantDetailsId_key" ON "Documents"("merchantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "Payments_merchantDetailsId_key" ON "Payments"("merchantDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_trackingNumber_key" ON "orders"("trackingNumber");

-- CreateIndex
CREATE INDEX "orders_merchantDetailsId_idx" ON "orders"("merchantDetailsId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE INDEX "products_merchantDetailsId_idx" ON "products"("merchantDetailsId");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_merchantWebProductId_key" ON "product_variants"("merchantWebProductId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantPricing_variantId_key" ON "VariantPricing"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantLocation_variantId_key" ON "VariantLocation"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "StockControl_variantId_key" ON "StockControl"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_variantId_key" ON "Batch"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "external_order_logs" ADD CONSTRAINT "external_order_logs_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantDetails" ADD CONSTRAINT "MerchantDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalDetails" ADD CONSTRAINT "PersonalDetails_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessDetails" ADD CONSTRAINT "BusinessDetails_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documents" ADD CONSTRAINT "Documents_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments" ADD CONSTRAINT "Payments_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantPricing" ADD CONSTRAINT "VariantPricing_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantLocation" ADD CONSTRAINT "VariantLocation_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockControl" ADD CONSTRAINT "StockControl_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseLog" ADD CONSTRAINT "WarehouseLog_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
