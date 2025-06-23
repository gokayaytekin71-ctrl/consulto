"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GundemForm() {
  // 1. "content" (yazı içeriği) için state tanımlaması
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image || !title || !content) {
      setError('Tüm alanlar (Başlık, Yazı İçeriği ve Görsel) zorunludur.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('image', image);
    // 2. "content" verisini form verisine ekleme
    formData.append('content', content);
    formData.append('linkUrl', '/'); // Bu alan şema gereği gönderiliyor

    try {
      const response = await fetch('/api/gundem', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Dosya yüklenirken bir hata oluştu.');
      }
      
      setTitle('');
      setContent('');
      setImage(null);
      e.target.reset();
      router.refresh();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Yeni Gündem Ekle</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Başlık</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            required
          />
        </div>
        
        {/* 3. "content" verisini girmek için metin alanı (textarea) */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Yazı İçeriği</label>
          <textarea
            id="content"
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            required
          ></textarea>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">Görsel</label>
          <input
            type="file"
            id="image"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            accept="image/png, image/jpeg, image/webp"
            required
          />
        </div>
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Ekleniyor...' : 'Gündem Ekle'}
        </button>
      </form>
    </div>
  );
}