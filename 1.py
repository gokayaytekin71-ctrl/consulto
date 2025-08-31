import weaviate
import os
import sys
from dotenv import load_dotenv
from weaviate.connect.base import ConnectionParams

load_dotenv('.env')

# --- AYARLAR ---
# Bu sefer SUNUCUDAKİ Weaviate adresini kullanıyoruz.
REMOTE_WEAVIATE_URL = os.getenv('WEAVIATE_URL') 

# Yedek alırken kullandığımız kimlikle aynı olmalı
BACKUP_ID = "yargikararlari-tam-yedek"
# --- AYARLAR SONU ---

if not REMOTE_WEAVIATE_URL:
    print("HATA: .env dosyanızda WEAVIATE_URL değişkeni bulunamadı.")
    sys.exit(1)

try:
    # Sunucudaki Weaviate'e bağlan
    print(f"Sunucuya bağlanılıyor: '{REMOTE_WEAVIATE_URL}'")
    conn_params = ConnectionParams.from_url(url=REMOTE_WEAVIATE_URL, grpc_port=50051)
    client = weaviate.WeaviateClient(connection_params=conn_params)
    client.connect()
    print("Bağlantı başarılı.")

    print(f"\n'{BACKUP_ID}' yedeğinden geri yükleme işlemi başlatılıyor...")
    print("Bu işlem, yedek boyutuna bağlı olarak birkaç dakika sürebilir.")

    # Geri yükleme işlemini başlat ve bitmesini bekle
    result = client.backup.restore(
        backup_id=BACKUP_ID,
        backend="filesystem",
        wait_for_completion=True,
    )

    print("\n--- Geri Yükleme Durumu ---")
    print(result)

    if result.status == 'SUCCESS':
        print("\nİŞLEM TAMAMLANDI! Veritabanınız sunucuya başarıyla kuruldu.")
        # Geri yüklenen koleksiyonun adını teyit edelim
        collections = client.collections.list_all()
        print("\nSunucudaki mevcut koleksiyonlar:")
        for name, col in collections.items():
             print(f"- {name}")
    else:
        print("\nHATA! Geri yükleme başarısız oldu. Lütfen hata mesajını kontrol edin.")

    client.close()

except Exception as e:
    print(f"\nKritik bir hata oluştu: {e}")
    print("Lütfen sunucudaki Weaviate Docker konteynerinizin çalıştığından emin olun.")
    sys.exit(1)