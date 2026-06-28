import KararAramaKutusu from '@/components/KararAramaKutusu';
import ClientSearchResults from '@/components/ClientSearchResults.client';
import CanvasBackground from '@/components/CanvasBackground'; // Animasyon bileşenimiz

export default function AkilliAramaPage({ searchParams }) {
  const defaultQuery = searchParams.q || '';
  const smartSearchIconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  return (
    // DEĞİŞİKLİK: Ana kapsayıcının kendi arka plan rengini kaldırıyoruz.
    // Arka plan artık tamamen CanvasBackground'dan gelecek.
    <div className="clean-numerals min-h-screen relative overflow-hidden">
      
      <CanvasBackground />

      <div className="relative z-10">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          
          <div className="text-center mb-12 animate-fadeIn">
            <div className="flex items-center justify-center gap-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                // DEĞİŞİKLİK: İkon rengi koyu temada görünecek şekilde güncellendi.
                className="w-10 h-10 text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.4}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={smartSearchIconPath} />
              </svg>
              {/* DEĞİŞİKLİK: Başlık rengi açık renge çevrildi. */}
              <h1 className="text-4xl md:text-4xl font-serif font-medium text-slate-100">
                Akıllı Arama
              </h1>
            </div>
            
            {/* DEĞİŞİKLİK: Alt başlık rengi açık renge çevrildi. */}
            <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
              Yapay zeka desteği ile "akıllı" aramalar yapın!
            </p>

          </div>

          <div className="max-w-3xl mx-auto">
            <KararAramaKutusu
              defaultQuery={defaultQuery}
              basePath="/akilli-arama"
            />
          </div>
          
          <div className="mt-16">
            <ClientSearchResults
              defaultQuery={defaultQuery}
              semanticSearch={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
