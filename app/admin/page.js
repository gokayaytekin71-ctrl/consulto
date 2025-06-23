// app/admin/page.jsx

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "../api/auth/[...nextauth]/route"; // NextAuth ayarlarımızı import ediyoruz
import prisma from "@/lib/prisma";
import GundemForm from "@/components/GundemForm"; // Hazırladığımız formu import ediyoruz

// Sunucu tarafında veritabanından mevcut gündemleri çeken fonksiyon
async function getGundemler() {
    try {
        const gundemler = await prisma.gundem.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return gundemler;
    } catch (error) {
        console.error("Gündemler çekilirken hata oluştu:", error);
        return []; // Hata durumunda boş dizi döndür
    }
}

export default async function AdminPage() {
    // Sayfaya erişim için oturum kontrolü yap
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect('/'); // Giriş yapmamışsa anasayfaya yönlendir
    }

    // Mevcut gündemleri veritabanından çek
    const gundemler = await getGundemler();

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">
                    Gündem Yönetimi
                </h1>

                {/* YENİ GÜNDEM EKLEME FORMU */}
                <div className="mb-10">
                    {/* BİR ÖNCEKİ ADIMDA HAZIRLADIĞIMIZ FORM BİLEŞENİNİ BURADA KULLANIYORUZ */}
                    <GundemForm />
                </div>

                {/* MEVCUT GÜNDEMLERİ LİSTELEYEN TABLO */}
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Mevcut Gündemler</h2>
                <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                    <table className="min-w-full">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Görsel</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Başlık</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Oluşturulma</th>
                                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600 uppercase">Eylemler</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-700">
                            {gundemler.map(item => (
                                <tr key={item.id} className="border-t border-gray-200 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={item.imageUrl} alt={item.title} className="h-16 w-32 object-cover rounded-md"/>
                                    </td>
                                    <td className="py-3 px-4 font-medium">{item.title}</td>
                                    <td className="py-3 px-4 text-sm text-gray-500">
                                        {new Date(item.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </td>
                                    <td className="py-3 px-4">
                                        {/* Silme işlemi için gelecekte bir API rotası ve fonksiyon eklenebilir */}
                                        <button className="text-red-500 hover:text-red-700 font-medium text-sm">Sil</button>
                                    </td>
                                </tr>
                            ))}
                            {gundemler.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="text-center py-10 text-gray-500">Henüz hiç gündem eklenmemiş.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}