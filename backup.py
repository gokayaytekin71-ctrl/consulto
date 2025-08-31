import weaviate
import os
import sys
from dotenv import load_dotenv
from weaviate.connect.base import ConnectionParams  # EKLENDİ: Gerekli import

# .env dosyasını bulabilmesi için bu betiğin ana proje klasöründe olduğunu varsayıyoruz.
load_dotenv('.env')

# --- AYARLAR ---
# Lütfen yerel Weaviate adresinizin bu olduğundan emin olun.
LOCAL_WEAVIATE_URL = "http://localhost:8080" 

CLASS_NAME = "HukukBelgesiV11_BGEM3_Context_Norm"
BACKUP_ID = "yargikararlari-tam-yedek"
# --- AYARLAR SONU ---


try:
    # --- DÜZELTİLEN BAĞLANTI BLOKU ---
    print(f"'{LOCAL_WEAVIATE_URL}' adresine bağlanılıyor...")
    
    # 1. URL'den bir ConnectionParams objesi oluşturuyoruz
    conn_params = ConnectionParams.from_url(
        url=LOCAL_WEAVIATE_URL,
        grpc_port=50051 # gRPC portu genellikle bu kullanılır
    )
    
    # 2. İstemciye string yerine bu objeyi veriyoruz
    client = weaviate.WeaviateClient(connection_params=conn_params)
    client.connect()
    
    print(f"Başarılı: '{LOCAL_WEAVIATE_URL}' adresine bağlanıldı.")
    # --- DÜZELTME SONU ---


    print(f"\n'{CLASS_NAME}' koleksiyonu için yedekleme işlemi başlatılıyor...")
    print("Bu işlem veritabanınızın boyutuna göre birkaç dakika sürebilir...")

    # Yedekleme işlemini başlat ve bitmesini bekle
    result = client.backup.create(
        backup_id=BACKUP_ID,
        backend="filesystem",
        include_collections=CLASS_NAME,
        wait_for_completion=True, 
    )

    print("\n--- Yedekleme Durumu ---")
    print(result)

    if result.status == 'SUCCESS':
        print(f"\nİşlem Başarılı! Yedek dosyaları '{os.getcwd()}/backups/{BACKUP_ID}' klasörünün içinde oluşturuldu.")
    else:
        print("\nHATA! Yedekleme başarısız oldu. Lütfen hata mesajını kontrol edin.")

    client.close()

except Exception as e:
    print(f"\nKritik bir hata oluştu: {e}")
    print("Lütfen yerel Weaviate Docker konteynerinizin ('proje_son' klasöründeki) çalıştığından ve 8080 portunun başka bir uygulama tarafından kullanılmadığından emin olun.")
    sys.exit(1)