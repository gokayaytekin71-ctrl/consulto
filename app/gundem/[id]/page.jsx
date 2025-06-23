import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

async function getGundemDetay(id) {
  const gundem = await prisma.gundem.findUnique({ where: { id: id } });
  if (!gundem) notFound();
  return gundem;
}

export default async function GundemDetaySayfasi({ params }) {
  const gundem = await getGundemDetay(params.id);

  return (
    <main className="bg-[#0a101f] text-slate-300">
      <div className="relative h-[50vh] min-h-[400px]">
        {/* Arkaplan Görseli */}
        <Image
          src={gundem.imageUrl}
          alt={gundem.title}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a101f] via-[#0a101f]/80 to-transparent"></div>
        
        {/* Başlık ve Bilgiler */}
        <div className="absolute inset-0 flex flex-col justify-end max-w-5xl mx-auto p-8 text-white">
          <Link href="/" className="text-orange-400 hover:text-orange-300 mb-4 text-sm font-semibold">
            &larr; Gündem'e Geri Dön
          </Link>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight drop-shadow-md">
            {gundem.title}
          </h1>
          <p className="text-slate-300 mt-4">
            Yayınlanma Tarihi: {new Date(gundem.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Makale İçeriği */}
      <div className="max-w-3xl mx-auto py-16 px-4">
        {/* Tailwind Typography eklentisi ile içeriği otomatik stillendiriyoruz */}
        <article className="prose prose-invert prose-lg max-w-none 
                          prose-p:text-slate-300 prose-headings:text-slate-100 
                          prose-strong:text-white">
          {gundem.content.split('\n').filter(p => p.trim() !== '').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>
      </div>
    </main>
  );
}