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
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'MIXED_STOCK');

-- CreateEnum
CREATE TYPE "VariantGeneration" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "PickStrategy" AS ENUM ('FIFO', 'LIFO');

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
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "merchantDetailsId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productCode" TEXT,
    "category" TEXT NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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
    "supplierId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "soldQuantity" INTEGER NOT NULL DEFAULT 0,
    "returnedQuantity" INTEGER NOT NULL DEFAULT 0,
    "damagedQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "products_productCode_key" ON "products"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

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
ALTER TABLE "products" ADD CONSTRAINT "products_merchantDetailsId_fkey" FOREIGN KEY ("merchantDetailsId") REFERENCES "MerchantDetails"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
