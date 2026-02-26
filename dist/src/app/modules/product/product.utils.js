"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSKU = void 0;
const prisma_1 = require("../../shared/prisma");
const generateUniqueSKU = (client) => __awaiter(void 0, void 0, void 0, function* () {
    const prismaInstance = client || prisma_1.prisma;
    const count = yield prismaInstance.productVariant.count();
    const nextNumber = count + 1;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const sku = `NEXA-${nextNumber}${randomSuffix}`;
    const existing = yield prismaInstance.productVariant.findUnique({
        where: { sku },
    });
    if (existing) {
        return (0, exports.generateUniqueSKU)(prismaInstance);
    }
    return sku;
});
exports.generateUniqueSKU = generateUniqueSKU;
