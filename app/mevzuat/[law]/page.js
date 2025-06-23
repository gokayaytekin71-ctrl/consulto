// Dosyanın en üstüne ekleyin (diğer importların yanına)
import prisma from '../../../lib/prisma'; // VEYA projenizdeki doğru yolu belirtin

// const prisma = new PrismaClient(); satırını SİLİN veya YORUM SATIRINA ALIN.
import { notFound } from 'next/navigation';
import MevzuatIstemciBileseni from '../MevzuatIstemciBileseni.jsx';



export default async function MevzuatDetailPage({ params }) {
  const { law: lawKey } = params;

  const mevzuatData = await prisma.mevzuat.findUnique({
    where: { key: decodeURIComponent(lawKey) },
  });

  if (!mevzuatData) {
    notFound();
  }

  let contentObject = {};
  try {
    contentObject = JSON.parse(mevzuatData.content);
  } catch (error) {
    console.error(`Mevzuat içeriği (JSON) parse edilirken hata oluştu: ${lawKey}`, error);
  }
  
  return (
    <MevzuatIstemciBileseni
      displayName={mevzuatData.name}
      content={contentObject}
      anaMevzuatKey={mevzuatData.key}
    />
  );
}