# embed_api.py
from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import torch
import os
from dotenv import load_dotenv
from flask_cors import CORS

print("Embedding API'si başlatılıyor...")
load_dotenv('.env')

EMBED_MODEL = os.getenv('EMBEDDING_MODEL_ADI', 'BAAI/bge-m3')
device = 'cuda' if torch.cuda.is_available() else 'cpu'

print(f"Embedding modeli '{EMBED_MODEL}' yükleniyor. Cihaz: {device}")
model = SentenceTransformer(EMBED_MODEL, device=device)
print("Model başarıyla yüklendi.")

app = Flask(__name__)
CORS(app) # Next.js'ten gelen isteklere izin ver

@app.route('/embed', methods=['POST'])
def embed_text():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'text alanı zorunludur'}), 400

    text_to_embed = data['text']
    vector = model.encode(text_to_embed, normalize_embeddings=True)
    return jsonify({'vector': vector.tolist()})

if __name__ == '__main__':
    print("Embedding API'si http://localhost:5002 adresinde çalışıyor.")
    app.run(host='0.0.0.0', port=5002)