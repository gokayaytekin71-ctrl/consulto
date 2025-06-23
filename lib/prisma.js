import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Geliştirme ortamında, Next.js'in hızlı yeniden yükleme (hot-reloading)
  // özelliği nedeniyle çok sayıda PrismaClient örneği oluşmasını engellemek için
  // global bir değişken kullanıyoruz.
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      // İsteğe bağlı: Geliştirme ortamında sorguları loglamak için
      // log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.prisma;
}

export default prisma;