import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {

  const deposits = await prisma.depositRequest.findMany({ where: { status: 'APPROVED' } });
  const depositTotal = deposits.reduce((s, d) => s + (d.amount || 0), 0);
  console.log(`\n[Deposits APPROVED] count=${deposits.length} total=${depositTotal}`);


  const invoices = await prisma.invoice.findMany({ where: { status: 'APPROVED' } });
  const invoiceTotal = invoices.reduce((s, i) => s + ((i as any).totalAmount || 0), 0);
  console.log(`\n[Invoices APPROVED] count=${invoices.length} total=${invoiceTotal}`);

  invoices.forEach(i => {
    console.log(`  ${(i as any).invoiceNumber} | cat=${(i as any).category} | ${(i as any).totalAmount}`);
  });

  console.log(`\nTotal Credit should be: ${depositTotal + invoiceTotal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
