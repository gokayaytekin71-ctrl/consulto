"use client"; // Bu bir Client Component
import { useEffect, useRef } from 'react';
import DecisionCard from '@/components/DecisionCard';
import KararAramaKutusu from '@/components/KararAramaKutusu';
import SayfalamaKontrol from '@/components/SayfalamaKontrol';

// Props'lar dışarıdan gelen işlenmiş veriler olacak
export default function KararListesiIstemciBileseni({
  kararlar,
  toplamSayfa,
  mevcutSayfa, // Bu prop artık kullanılacak
  mevcutAramaSorgusu, // Bu prop artık kullanılacak
  toplamKarar,
}) {
  // Canvas reference for starfield effect
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Create nodes for the network
    const numNodes = 60;
    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      // Randomly choose one of four edges: 0=left,1=right,2=top,3=bottom
      const side = Math.floor(Math.random() * 4);
      let x, y;
      if (side === 0) {
        x = Math.random() * (width * 0.2); // left 20% area
        y = Math.random() * height;
      } else if (side === 1) {
        x = width - Math.random() * (width * 0.2); // right 20% area
        y = Math.random() * height;
      } else if (side === 2) {
        x = Math.random() * width;
        y = Math.random() * (height * 0.3); // top 20% area
      } else {
        x = Math.random() * width;
        y = height - Math.random() * (height * 0.2); // bottom 20% area
      }
      nodes.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1 + 0.5,
      });
    }

    function drawNetwork() {
      ctx.clearRect(0, 0, width, height);

      // Draw lines between close nodes
      const maxDistance = 100;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDistance) {
            const alpha = 1 - dist / maxDistance;
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Update node positions and draw nodes
      for (let node of nodes) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Prevent node from staying in center: if in central box, push to nearest edge
        const leftLimit = width * 0.2;
        const rightLimit = width * 0.8;
        const topLimit = height * 0.2;
        const bottomLimit = height * 0.8;
        if (
          node.x > leftLimit && node.x < rightLimit &&
          node.y > topLimit && node.y < bottomLimit
        ) {
          // Determine nearest edge and reposition
          const distLeft = Math.abs(node.x - leftLimit);
          const distRight = Math.abs(node.x - rightLimit);
          const distTop = Math.abs(node.y - topLimit);
          const distBottom = Math.abs(node.y - bottomLimit);
          const minDist = Math.min(distLeft, distRight, distTop, distBottom);
          if (minDist === distLeft) {
            node.x = leftLimit;
          } else if (minDist === distRight) {
            node.x = rightLimit;
          } else if (minDist === distTop) {
            node.y = topLimit;
          } else {
            node.y = bottomLimit;
          }
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    }

    function animate() {
      drawNetwork();
      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });
  }, []);

  const aiSummaryIconPath = "M12 18.75a6 6 0 006-6v-1.5a.75.75 0 011.5 0v1.5a7.5 7.5 0 11-15 0v-1.5a.75.75 0 011.5 0v1.5a6 6 0 006 6zM12 9a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75V11.25a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75V9z";

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-gradient-to-br from-[#001f3f] to-[#004365] text-gray-100">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      ></canvas>

      <header className="relative z-10 bg-blue-900/30 border border-blue-700/60 shadow-xl py-10 rounded-b-lg transform skew-y-[-2deg] origin-top-left -mt-8 mb-2">
        <div className="container mx-auto px-8 flex items-center justify-center relative transform skew-y-[2deg] origin-top-left">
          <div className="flex flex-col items-center text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-300 mb-4 drop-shadow-lg animate-spin-slow-reverse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={aiSummaryIconPath} /></svg>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-blue-300 tracking-wider drop-shadow-2xl animate-text-glow animate-slide-in-down">Nitelikli Kararlar</h1>
            <p className="text-lg lg:text-xl text-blue-200 mt-1 drop-shadow-lg animate-slide-in-up delay-300">Açıklamalı, Bilgilendirici, Öğretici Kararların Derlemesi</p>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 pt-2 pb-8 relative z-10">
        <KararAramaKutusu mevcutAramaSorgusu={mevcutAramaSorgusu} />

        {kararlar && kararlar.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {kararlar.map((karar) => (
                <div key={karar.id} className="relative group rounded-lg overflow-hidden">
                  <DecisionCard
                    id={karar.linkId}
                    type={karar.type}
                    code={karar.code}
                    aiSummary={karar.aiSummary}
                    keywords={karar.keywords}
                    contentLength={karar.contentLength}
                  />
                </div>
              ))}
            </div>
            <SayfalamaKontrol toplamSayfa={toplamSayfa} mevcutSayfa={mevcutSayfa} />
          </>
        ) : (
          <div className="bg-blue-900/30 border border-blue-700/50 p-16 rounded-xl shadow-2xl text-center backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-32 w-32 text-blue-400 opacity-60 mb-6 animate-pulse-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="mt-4 text-4xl font-bold text-white mb-4 animate-fade-in-up delay-200">Henüz Hiçbir Karar Bulunamadı</h3>
            <p className="text-lg text-gray-300 leading-relaxed animate-fade-in-up delay-400">
              {mevcutAramaSorgusu ? "Arama kriterlerinize uygun sonuç bulunamadı." : "Veritabanımızda görüntülenecek bir yargı kararı bulunmuyor."}
            </p>
          </div>
        )}
      </main>

      <footer className="relative z-10 bg-gradient-to-t from-gray-950 to-gray-900/80 text-gray-400 text-sm py-8 mt-auto border-t border-blue-900 shadow-inner">
        <div className="container mx-auto text-center"><p>&copy; {new Date().getFullYear()} **Consulto**. Tüm Hakları Saklıdır.</p></div>
      </footer>
    </div>
  );
}