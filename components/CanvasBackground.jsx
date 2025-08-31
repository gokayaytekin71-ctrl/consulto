"use client";
import { useEffect, useRef } from 'react';

export default function CanvasBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // YENİ EKLENDİ: Throttle fonksiyonu
    // Belirtilen limitte bir fonksiyonun en fazla bir kez çalışmasını sağlar.
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // YENİ EKLENDİ: Debounce fonksiyonu
    // Tetiklenme durduktan belirli bir süre sonra fonksiyonu bir kez çalıştırır.
    function debounce(func, delay) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    const dpr = window.devicePixelRatio || 1;
    let width = window.innerWidth;
    let height = document.documentElement.scrollHeight;

    const setupCanvas = () => {
        width = window.innerWidth;
        height = document.documentElement.scrollHeight;
        
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        
        ctx.scale(dpr, dpr);
    };

    const mouse = {
      x: null,
      y: null,
      radius: 150
    };
    
    const handleMouseMove = (event) => {
      mouse.x = event.x;
      mouse.y = event.y;
    };
    
    const handleMouseOut = () => {
        mouse.x = null;
        mouse.y = null;
    };

    // DEĞİŞİKLİK: Olay dinleyicileri optimize edilmiş versiyonlarla değiştiriliyor.
    const throttledMouseMove = throttle(handleMouseMove, 16); // ~60fps için
    const debouncedSetupCanvas = debounce(setupCanvas, 200);

    window.addEventListener('mousemove', throttledMouseMove);
    window.addEventListener('mouseout', handleMouseOut);
    window.addEventListener('resize', debouncedSetupCanvas);
    window.addEventListener('scroll', debouncedSetupCanvas); // scroll olayı da artık optimize edildi

    const nodes = [];
    const numNodes = 120; 
    for (let i = 0; i < numNodes; i++) {
        nodes.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            z: Math.random() * 0.8 + 0.2,
            h: Math.floor(Math.random() * 360)
        });
    }

    function drawNetwork() {
        ctx.clearRect(0, 0, width, height);
        
        const maxDistance = 140; 
        
        for (let i = 0; i < nodes.length; i++) {
            const nodeA = nodes[i];
            
            for (let j = i + 1; j < nodes.length; j++) {
                const nodeB = nodes[j];
                const dx = nodeA.x - nodeB.x;
                const dy = nodeA.y - nodeB.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < maxDistance) {
                    const alpha = 1 - dist / maxDistance;
                    ctx.strokeStyle = `hsla(${nodeA.h}, 80%, 70%, ${alpha * 0.2})`;
                    ctx.lineWidth = Math.max(0.2, nodeA.z * 1.2);
                    ctx.beginPath();
                    ctx.moveTo(nodeA.x, nodeA.y);
                    ctx.lineTo(nodeB.x, nodeB.y);
                    ctx.stroke();
                }
            }

            if (mouse.x !== null) {
                const dxMouse = nodeA.x - mouse.x;
                const dyMouse = nodeA.y - mouse.y;
                const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
                
                if(distMouse < mouse.radius + 50) {
                   if(distMouse < mouse.radius) {
                       const forceDirectionX = dxMouse / distMouse;
                       const forceDirectionY = dyMouse / distMouse;
                       const force = (mouse.radius - distMouse) / mouse.radius;
                       nodeA.vx += forceDirectionX * force * 0.1;
                       nodeA.vy += forceDirectionY * force * 0.1;
                   }
                   
                   const alpha = 1 - distMouse / (mouse.radius + 50);
                   ctx.strokeStyle = `hsla(${nodeA.h}, 80%, 70%, ${alpha * 0.2})`;
                   ctx.lineWidth = Math.max(0.1, nodeA.z * 0.8);
                   ctx.beginPath();
                   ctx.moveTo(nodeA.x, nodeA.y);
                   ctx.lineTo(mouse.x, mouse.y);
                   ctx.stroke();
                }
            }
            
            nodeA.vx *= 0.99;
            nodeA.vy *= 0.99;
            nodeA.x += nodeA.vx * nodeA.z;
            nodeA.y += nodeA.vy * nodeA.z;

            if (nodeA.x > width + 50 || nodeA.x < -50) nodeA.x = Math.random() * width;
            if (nodeA.y > height + 50 || nodeA.y < -50) nodeA.y = Math.random() * height;
            
            const radius = Math.max(0.5, nodeA.z * 3);
            
            ctx.shadowColor = `hsla(${nodeA.h}, 80%, 70%, 0.7)`;
            ctx.shadowBlur = 90; 
            
            ctx.fillStyle = `hsla(${nodeA.h}, 80%, 70%, 0.6)`;
            ctx.beginPath();
            ctx.arc(nodeA.x, nodeA.y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        }
    }

    function animate() {
        drawNetwork();
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // DEĞİŞİKLİK: İlk kurulumu doğrudan çağırıyoruz.
    setupCanvas();
    animate();

    // DEĞİŞİKLİK: Temizleme fonksiyonu da optimize edilmiş dinleyicileri kaldırıyor.
    return () => {
        window.removeEventListener('mousemove', throttledMouseMove);
        window.removeEventListener('mouseout', handleMouseOut);
        window.removeEventListener('resize', debouncedSetupCanvas);
        window.removeEventListener('scroll', debouncedSetupCanvas);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full pointer-events-none z-0"
    />
  );
}