import os
import io
import json
import re
import time
import logging
import traceback
import threading
import tempfile
from urllib.parse import urlparse
from collections import OrderedDict


from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    HAS_PSYCOPG2 = True
except ImportError:
    psycopg2 = None
    RealDictCursor = None
    HAS_PSYCOPG2 = False

import torch
import weaviate
from google import genai
from google.genai import types
from dotenv import load_dotenv
from flask import Flask, request, Response
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from weaviate.classes.init import AdditionalConfig
from weaviate.classes.query import Filter

# --- VERTEX AI RANKING ---
try:
    from google.cloud import discoveryengine_v1alpha as discoveryengine
    HAS_DISCOVERY_ENGINE = True
except ImportError:
    HAS_DISCOVERY_ENGINE = False

# --- OCR / PDF METİN ÇIKARMA ---
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    fitz = None
    HAS_PYMUPDF = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    pytesseract = None
    HAS_TESSERACT = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    Image = None
    HAS_PIL = False

# --- 1. AYARLAR VE LOGLAMA ---
load_dotenv()

if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS") and os.path.exists("/root/vertex-key.json"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/root/vertex-key.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# --- 2. GLOBAL DEĞİŞKENLER VE SABİTLER ---
embedding_modeli = None
hukuk_koleksiyonu = None
gemini_modeli = None
fast_model = None
profile_model = None  # [YENİ] Dosya profili için ayrı, profil-odaklı hafif model
genai_client = None
answer_fast_model = None
class GenAIModelWrapper:
    """
    google-genai SDK için küçük uyumluluk katmanı.
    Eski Vertex AI SDK'daki GenerativeModel.generate_content(...) kullanımını
    kodun geri kalanını bozmadan taklit eder.
    """
    def __init__(self, client, model_name, system_instruction=None):
        self.client = client
        self.model_name = model_name
        self.system_instruction = system_instruction

    def _merge_config(self, generation_config=None):
        base = generation_config

        if base is None:
            return types.GenerateContentConfig(system_instruction=self.system_instruction)

        if isinstance(base, dict):
            data = dict(base)
        else:
            data = {}
            for key in ("temperature", "top_p", "top_k", "max_output_tokens"):
                value = getattr(base, key, None)
                if value is not None:
                    data[key] = value

        if self.system_instruction:
            data["system_instruction"] = self.system_instruction

        return types.GenerateContentConfig(**data)

    def generate_content(self, prompt, generation_config=None, stream=False):
        config = self._merge_config(generation_config)
        if stream:
            return self.client.models.generate_content_stream(
                model=self.model_name,
                contents=prompt,
                config=config,
            )
        return self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=config,
        )

HYBRID_LIMIT = int(os.getenv("HYBRID_LIMIT", "60"))
RETRIEVAL_TOP_PER_QUERY = int(os.getenv("RETRIEVAL_TOP_PER_QUERY", "20"))
RERANK_CANDIDATE_LIMIT = int(os.getenv("RERANK_CANDIDATE_LIMIT", "40"))
RERANK_TOP_N = int(os.getenv("RERANK_TOP_N", "40"))
MAX_CHUNKS_PER_DECISION = int(os.getenv("MAX_CHUNKS_PER_DECISION", "3"))
VERTEX_RANKING_MODEL = os.getenv("VERTEX_RANKING_MODEL", "semantic-ranker-default@latest")
MAKALE_LIMIT = int(os.getenv("MAKALE_LIMIT", "5"))
MAX_KARAR_CONTEXT = int(os.getenv("MAX_KARAR_CONTEXT", "40"))
MAX_FULL_DECISION_CONTEXT = int(os.getenv("MAX_FULL_DECISION_CONTEXT", "5"))
MAX_FULL_DECISION_CHARS = int(os.getenv("MAX_FULL_DECISION_CHARS", "12000"))
MAX_MAKALE_CONTEXT = int(os.getenv("MAX_MAKALE_CONTEXT", "5"))
MAX_CONTEXT_CHARS = int(os.getenv("MAX_CONTEXT_CHARS", "80000"))
WEAVIATE_CONNECT_TIMEOUT = int(os.getenv("WEAVIATE_CONNECT_TIMEOUT", "60"))
WEAVIATE_QUERY_TIMEOUT = int(os.getenv("WEAVIATE_QUERY_TIMEOUT", "90"))
WORKSPACE_API_PORT = int(os.getenv("WORKSPACE_API_PORT", "5005"))
MAX_CONCURRENCY = int(os.getenv("MAX_CONCURRENCY", "6"))
CONCURRENCY_ACQUIRE_TIMEOUT = float(os.getenv("CONCURRENCY_ACQUIRE_TIMEOUT", "300"))

# --- YENİ: Çoklu sorgu + hybrid ayarları ---
HYBRID_ALPHA = float(os.getenv("HYBRID_ALPHA", "0.7"))
RRF_K = int(os.getenv("RRF_K", "60"))
AI_OZET_FETCH_LIMIT = int(os.getenv("AI_OZET_FETCH_LIMIT", "500"))

GEMINI_FAST_TIMEOUT_MS = int(os.getenv("GEMINI_FAST_TIMEOUT_MS", "70000"))
USER_FACING_BUSY_MESSAGE = "Consülto'ya eşzamanlı çok fazla istek atıldı veya sistem geçici olarak kilitlendi. Lütfen 60 saniye bekleyip tekrar deneyiniz."

CONDENSE_CACHE_MAX = int(os.getenv("CONDENSE_CACHE_MAX", "512"))
FILE_PROFILE_MAX_CHARS = int(os.getenv("FILE_PROFILE_MAX_CHARS", "90000"))

OCR_MIN_TEXT_LENGTH = int(os.getenv("OCR_MIN_TEXT_LENGTH", "80"))
OCR_MAX_PAGES = int(os.getenv("OCR_MAX_PAGES", "60"))
OCR_DPI_SCALE = float(os.getenv("OCR_DPI_SCALE", "2.0"))
OCR_LANG = os.getenv("OCR_LANG", "tur+eng")

# =============================================
# [FIX-1] Token limiti yönetimi sabitleri
# =============================================
MAX_HISTORY_TOKENS = int(os.getenv("MAX_HISTORY_TOKENS", "4000"))
CHARS_PER_TOKEN_ESTIMATE = 3.5  # Türkçe için ortalama
MAX_HISTORY_CHARS = int(MAX_HISTORY_TOKENS * CHARS_PER_TOKEN_ESTIMATE)

# =============================================
# [FIX-2] Streaming retry sabitleri
# =============================================
STREAM_MAX_RETRIES = int(os.getenv("STREAM_MAX_RETRIES", "2"))
STREAM_RETRY_DELAY_S = float(os.getenv("STREAM_RETRY_DELAY_S", "1.5"))

# =============================================
# [FIX-4] Paralel arama thread pool
# =============================================
_search_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="search")

_gate = threading.Semaphore(MAX_CONCURRENCY)
_init_lock = threading.Lock()
_cache_lock = threading.Lock()
_CONDENSE_CACHE = OrderedDict()

# =============================================
# [YENİ] Belge sınıflandırma sabitleri
# =============================================
# "form/resmi belge" sınıfı: tapu, imar durumu, MEGSİS, ruhsat, SGK formu vb.
# Bu tür belgelerde etiket-değer yapısı vardır; heuristic risk/iddia/savunma
# çıkarımı YAPILMAZ, yalnızca ham özet üretilir.
DOCTYPE_DAVA = "dava"          # iddianame, dilekçe, bilirkişi raporu, mahkeme kararı vb.
DOCTYPE_FORM = "form"          # tapu, imar, megsis, ruhsat, resmi form
DOCTYPE_DIGER = "diğer"

# Form/resmi belge tespiti için anahtar imzalar (etiket-değer ağırlıklı belgeler)
_FORM_DOC_SIGNALS = [
    "imar plani", "imar planı", "plan onay tarihi", "kadastro parseli",
    "ada/parsel", "ada / parsel", "tapu kütüğü", "tapu kutugu", "megsis",
    "pafta", "parsel alanı", "parsel alani", "projeksiyon", "kartezyen koordinat",
    "coğrafi koordinat", "cografi koordinat", "imar durumu", "yapı ruhsatı",
    "yapi ruhsati", "iskan", "yapı kullanma izin", "çap belgesi", "cap belgesi",
    "belediye başkanlığı", "belediye baskanligi", "plan ve proje müdürlüğü",
    "kat adedi", "taks", "kaks", "emsal", "bina yüksekliği", "bina yuksekligi",
    "ön bahçe", "arka bahçe", "yan bahçe", "inşaat nizamı", "insaat nizami",
    "yalnizca bilgi amaclidir", "yalnızca bilgi amaçlıdır", "resmi işlem için kullanılamaz",
    "resmi islem icin kullanilamaz",
]

# Etiket-değer satırı kalıbı: "Etiket: değer" veya "Etiket  değer"
_LABEL_VALUE_RE = re.compile(r"^\s*([^:\n]{2,60}?)\s*[:：]\s*(.*)$")
# Boş/anlamsız değer kalıpları (etiket var, değer yok)
_EMPTY_VALUE_RE = re.compile(r"^\s*(-+|—+|n/?a|null|none|yok|mevcut\s+değil|belirtilmemi[şs]|\.+)?\s*$",
                             re.IGNORECASE)
# --- SİSTEM PROMPTLARI ---
CONDENSE_SYSTEM_PROMPT = (
    "Sen uzman bir Türk hukukçusu ve anlamsal arama (bge-m3 / Weaviate) mimarisi uzmanısın. "
    "Görevin: kullanıcının hukuki sorusunu, dosya profilini ve geçmişi inceleyerek uyuşmazlıkla ilgili "
    "Yargıtay kararlarını bulmak için EN UYGUN sorgu cümlelerini ve anahtar kelime dizilerini üretmek.\n\n"

    "KURALLAR:\n"
    "4. bm25_queries: Yargıtay metninde aynen geçebilecek kısa anahtar kelime ve kavram dizileri olmalı.\n"
    "5. semantic_queries: Somut hukuki problemi doğal, profesyonel ve tam cümlelerle anlatmalı.\n"
    "6. hybrid_queries: Hem anahtar kavramları hem de doğal hukuki cümleyi birlikte taşımalı.\n"
    "7. Tam olarak 3 bm25_queries, 2 semantic_queries ve 2 hybrid_queries üret.\n"
    "8. Sorgular anlamsal olarak BİRBİRİNDEN FARKLI olmalı; aynı cümlenin yeniden yazımı olmamalı.\n"
    "9. Soru hukuki uyuşmazlıkla ilgili değilse veya sorgu üretilemiyorsa listeleri boş döndür.\n"
    "10. Dil: sorgu metinleri Türkçe olmalı.\n\n"

    "ÇIKTI FORMATI: SADECE aşağıdaki şemaya birebir uyan tek bir JSON nesnesi döndür. "
    "Açıklama, ön söz, markdown veya kod bloğu işareti EKLEME:\n"
    '{\n'
    '  "bm25_queries": ["string", "string", "string"],\n'
    '  "semantic_queries": ["string", "string"],\n'
    '  "hybrid_queries": ["string", "string"]\n'
    '}\n\n'

    "ÖRNEKLER:\n"

    "Örnek 1 (özel alt-durum VAR):\n"
    "Soru: \"İhaleye fesat karıştırma olayında, ihale komisyonunda imzası olan ama sürece hiç katılmadığını "
    "söyleyen üyenin sorumluluğu ne olur?\"\n"
    '{\n'
    '  "bm25_queries": [\n'
    '    "ihaleye fesat karıştırma ihale komisyon üyesi imza sorumluluğu",\n'
    '    "ihale komisyonu üyesi fiilen katılmama imza kast sorumluluk",\n'
    '    "komisyon üyesinin kararda imzası bulunması ihaleye iştirak etmediği savunması"\n'
    '  ],\n'
    '  "semantic_queries": [\n'
    '    "İhaleye fesat karıştırılması iddiasında ihale komisyonu üyesinin karar belgesindeki imzasının cezai sorumluluğa etkisinin değerlendirilmesi.",\n'
    '    "İhale sürecine fiilen katılmadığını savunan komisyon üyesinin, kararda imzasının bulunması karşısında kişisel kastı ve iştirak iradesinin nasıl belirleneceğinin incelenmesi."\n'
    '  ],\n'
    '  "hybrid_queries": [\n'
    '    "İhale komisyonu üyesinin imza atmış olması fakat fiili katılımının bulunmadığını ileri sürmesi halinde sorumluluğun değerlendirilmesi.",\n'
    '    "Karar evrakında imzası bulunan ancak ihale sürecine katılmadığını savunan komisyon üyesinin kişisel cezai sorumluluğu."\n'
    '  ]\n'
    '}\n\n'

    "Örnek 2 (özel alt-durum YOK):\n"
    "Soru: \"Komşumun köpeği beni ısırdı, tazminat alabilir miyim?\"\n"
    '{\n'
    '  "bm25_queries": [\n'
    '    "hayvan sahibi sorumluluğu köpek ısırması maddi manevi tazminat",\n'
    '    "ev hayvanı üçüncü kişiyi yaralama gözetim yükümlülüğü",\n'
    '    "köpek saldırısı hayvan bulunduranın sorumluluğu tazminat"\n'
    '  ],\n'
    '  "semantic_queries": [\n'
    '    "Ev hayvanının üçüncü kişiyi ısırarak yaralaması nedeniyle hayvan sahibinin bakım ve gözetim yükümlülüğünden doğan sorumluluğunun değerlendirilmesi.",\n'
    '    "Köpek saldırısı sonucu yaralanan kişinin maddi ve manevi tazminat talep edip edemeyeceği ve hayvan bulunduranın sorumluluğunun kapsamı."\n'
    '  ],\n'
    '  "hybrid_queries": [\n'
    '    "Köpek ısırması nedeniyle hayvan sahibinin gözetim yükümlülüğü ve maddi manevi tazminat sorumluluğu.",\n'
    '    "Ev hayvanının saldırısı sonucu yaralanma halinde hayvan bulunduranın tazminat sorumluluğu."\n'
    '  ]\n'
    '}\n'
)

MAIN_SYSTEM_INSTRUCTION = (
    "Sen Türk hukuku alanında uzman, kıdemli bir hukuk bürosunda çalışan avukat yardımcısısın. Avukatlar senden gelen bilgilere güvenmek zorunda. "
    "Yanıtlarında objektif ve güvenilir ol. "
    "Yargıtay Kararlarına Doğrudan Atıf Yap. "
    "Kesinlikle uydurma Yargıtay kararı, dosya vakıası, tarih, belge üretme. "
    "Yalnızca sağlanan Yargıtay kararlarını kullan. "
    "Kullanıcıya bağlam verildiğini hissettirme."
    "Kendi güncel mevzuat bilgilerinle mevzuat atıflarında bulun ve gözet."
    "En birincil kaynağın Yargıtay Kararları, onlarla asla çelişme. Sonra diğer kaynaklar gelir. Kullanıcının son sorusunu doğru anla ve kullanıcı ne sormak istediyse ona cevap ver. Cevabın öz olsun."
)

# ============================================================
# 3. YARDIMCI FONKSİYONLAR
# ============================================================

def _clean_extracted_text(text):
    clean = str(text or "")
    clean = clean.replace("\r\n", "\n").replace("\r", "\n")
    clean = clean.replace("\x0c", "\n")
    clean = clean.replace("|", "I")
    clean = re.sub(r"[ \t]+", " ", clean)
    clean = re.sub(r"\n[ \t]+", "\n", clean)
    clean = re.sub(r"[•●▪■□]+", " ", clean)
    clean = re.sub(r"[~^`´¨]{2,}", " ", clean)
    clean = re.sub(r"[=\-_/\\]{5,}", " ", clean)

    cleaned_lines = []
    for raw_line in clean.split("\n"):
        line = raw_line.strip()
        if not line:
            cleaned_lines.append("")
            continue
        compact = re.sub(r"\s+", "", line)
        alpha_count = len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", line))
        noise_count = len(re.findall(r"[^A-Za-zÇĞİÖŞÜçğıöşü0-9\s.,;:!?()/%'\"\-–—]", line))
        if len(compact) <= 3 and alpha_count == 0:
            continue
        if len(line) <= 12 and noise_count >= 3:
            continue
        if alpha_count == 0 and noise_count >= 2 and len(compact) <= 20:
            continue
        line = re.sub(r"\s+", " ", line).strip()
        cleaned_lines.append(line)

    clean = "\n".join(cleaned_lines)
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip()


def _remove_ocr_noise_for_profile(text):
    clean = _clean_extracted_text(text)
    useful_lines = []
    for raw_line in clean.split("\n"):
        line = raw_line.strip()
        if not line:
            useful_lines.append("")
            continue
        lower = line.lower()
        compact = re.sub(r"\s+", "", line)
        alpha_count = len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", line))
        digit_count = len(re.findall(r"\d", line))
        noise_count = len(re.findall(r"[^A-Za-zÇĞİÖŞÜçğıöşü0-9\s.,;:!?()/%'\"\-–—]", line))
        if any(token in lower for token in [
            "evrak doğrulama", "uyap", "barkod", "qr", "güvenli elektronik imza",
            "e-imza", "elektronik imza", "imzalanmıştır", "teslim alanın ismi",
            "sayman mutemedi", "makbuzu alanın", "veznesi"
        ]):
            continue
        if len(compact) <= 4 and alpha_count == 0:
            continue
        if len(line) <= 16 and noise_count >= 3:
            continue
        if alpha_count < 3 and digit_count < 3 and noise_count >= 2:
            continue
        useful_lines.append(line)
    clean = "\n".join(useful_lines)
    clean = re.sub(r"\n{3,}", "\n\n", clean)
    return clean.strip()


def _clean_profile_text_value(value):
    text = _clean_extracted_text(value)
    text = re.sub(r"\b[Xx][¢©]\b", " ", text)
    text = re.sub(r"\b[Mm][gq]\b", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _profile_text_looks_ocr_noisy(value):
    text = str(value or "")
    if not text.strip():
        return False
    noise_chars = len(re.findall(r"[^A-Za-zÇĞİÖŞÜçğıöşü0-9\s.,;:!?()/%'\"\-–—]", text))
    total_chars = max(1, len(text))
    weird_fragments = len(re.findall(r"[~^`´¨¢©]|\bX¢\b|~~|\|", text))
    very_short_lines = len([line for line in text.splitlines() if 0 < len(line.strip()) <= 4])
    return (noise_chars / total_chars) > 0.025 or weird_fragments >= 2 or very_short_lines >= 4


# ============================================================
# [YENİ] Belge türü tespiti ve etiket-değer ayrıştırma
# ============================================================

def detect_document_class(text, file_name=""):
    """
    Belgenin üst sınıfını tespit eder: 'form', 'dava' veya 'diğer'.
    Form/resmi belgeler (tapu, imar durumu, MEGSİS, ruhsat vb.) etiket-değer
    ağırlıklıdır ve bu belgelerde heuristic risk/iddia/savunma çıkarımı YAPILMAZ.
    """
    name = str(file_name or "").lower()
    body = str(text or "")
    lower = body.lower()

    # 1) Form/resmi belge sinyalleri sayımı
    form_hits = sum(1 for sig in _FORM_DOC_SIGNALS if sig in lower)
    name_form_hits = sum(1 for sig in ["parsel", "ada", "imar", "tapu", "megsis", "ruhsat", "cap", "çap"] if sig in name)

    # 2) Dava belgesi sinyalleri
    dava_signals = [
        "iddianame", "dilekçe", "dilekce", "bilirkişi", "bilirkisi", "mahkemesi",
        "esas no", "karar no", "müşteki", "musteki", "sanık", "sanik", "şüpheli",
        "supheli", "davacı", "davaci", "davalı", "davali", "tanık", "tanik",
        "savunma", "iddia", "isnat", "tazminat talep", "dava dilekçesi",
    ]
    dava_hits = sum(1 for sig in dava_signals if sig in lower)

    # 3) Etiket-değer yoğunluğu (form belgeleri çok sayıda "Etiket: değer" satırı içerir)
    label_value_lines = 0
    total_nonblank = 0
    for raw in body.splitlines():
        line = raw.strip()
        if not line:
            continue
        total_nonblank += 1
        if _LABEL_VALUE_RE.match(line):
            label_value_lines += 1
    lv_ratio = (label_value_lines / total_nonblank) if total_nonblank else 0.0

    # Karar mantığı
    is_form_like = (
        (form_hits >= 3)
        or (form_hits >= 2 and lv_ratio >= 0.25)
        or (name_form_hits >= 2 and form_hits >= 1)
    )

    if is_form_like and dava_hits < 3:
        logger.info(
            "Belge sınıfı=FORM | form_hits=%s | name_hits=%s | lv_ratio=%.2f | dava_hits=%s",
            form_hits, name_form_hits, lv_ratio, dava_hits,
        )
        return DOCTYPE_FORM

    if dava_hits >= 1:
        logger.info("Belge sınıfı=DAVA | dava_hits=%s | form_hits=%s", dava_hits, form_hits)
        return DOCTYPE_DAVA

    logger.info("Belge sınıfı=DİĞER | form_hits=%s | dava_hits=%s", form_hits, dava_hits)
    return DOCTYPE_DIGER


def parse_label_value_pairs(text):
    """
    Form/etiket-değer belgelerinden 'Etiket: değer' çiftlerini ayrıştırır.
    BOŞ değerli etiketler (örn. 'Plan İptal Açıklama:' karşısı boş) ATILIR;
    asla bir vakıa/risk/iddia olarak yorumlanmaz.
    Döner: (dolu_ciftler, bos_etiketler)
    """
    clean = _clean_extracted_text(text)
    filled_pairs = []
    empty_labels = []
    seen_labels = set()

    for raw in clean.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = _LABEL_VALUE_RE.match(line)
        if not m:
            continue
        label = re.sub(r"\s+", " ", m.group(1)).strip(" :：.-–—")
        value = re.sub(r"\s+", " ", m.group(2)).strip(" :：.-–—")

        if not label or len(label) < 2:
            continue
        # Etiketin kendisi anlamlı bir kelime içermeli (saf sembol/sayı olmasın)
        if len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", label)) < 2:
            continue

        key = label.lower()
        if key in seen_labels:
            continue
        seen_labels.add(key)

        # BOŞ DEĞER → çıkarım yapma, sadece "etiket var ama boş" olarak işaretle
        if _EMPTY_VALUE_RE.match(value):
            empty_labels.append(label)
            continue

        # Değer içinde anlamlı içerik var mı?
        if len(value) < 1:
            empty_labels.append(label)
            continue

        filled_pairs.append((label, value))

    return filled_pairs, empty_labels


def _summarize_form_document(text, file_name="", file_type=""):
    """
    Form/resmi belge için ham özet üretir. Heuristic çıkarım (risk, iddia,
    savunma, delil) YAPILMAZ. Yalnızca dolu etiket-değer çiftleri özetlenir,
    boş alanlar göz ardı edilir.
    """
    filled_pairs, empty_labels = parse_label_value_pairs(text)

    # Belgenin başlık/kurum satırını yakala (ilk anlamlı satırlar)
    clean = _clean_extracted_text(text)
    header_lines = []
    for line in clean.splitlines():
        s = line.strip()
        if not s:
            continue
        if len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", s)) >= 4 and not _LABEL_VALUE_RE.match(s):
            header_lines.append(s)
        if len(header_lines) >= 3:
            break

    pair_lines = [f"{label}: {value}" for label, value in filled_pairs]

    short_parts = []
    if header_lines:
        short_parts.append(header_lines[0])
    if pair_lines:
        short_parts.append("Belgede yer alan başlıca bilgiler: " + "; ".join(pair_lines[:8]) + ".")
    short_summary = " ".join(short_parts).strip()
    if not short_summary:
        short_summary = (clean[:600].strip() or "Belgeden okunabilir bilgi çıkarılamadı.")
    if len(short_summary) > 900:
        short_summary = short_summary[:900].rsplit(" ", 1)[0].strip() + "..."

    detailed_parts = []
    if header_lines:
        detailed_parts.append("Belge başlığı / düzenleyen: " + " — ".join(header_lines[:3]))
    if pair_lines:
        detailed_parts.append("Belgedeki alanlar ve değerleri:")
        detailed_parts.extend([f"- {pl}" for pl in pair_lines[:40]])
    detailed_summary = "\n".join(detailed_parts).strip()
    if not detailed_summary:
        detailed_summary = clean[:2000].strip()
    if len(detailed_summary) > 3000:
        detailed_summary = detailed_summary[:3000].rsplit(" ", 1)[0].strip() + "..."

    # Açıklayıcı not: boş alanlar göz ardı edildi
    note = ""
    if empty_labels:
        note = (
            "Not: Bu belgede boş/doldurulmamış alanlar bulunmaktadır "
            f"({len(empty_labels)} adet) ve bunlar bir vakıa olarak değerlendirilmemiştir. "
            "Örn: " + ", ".join(empty_labels[:6]) + "."
        )

    return short_summary, detailed_summary, filled_pairs, empty_labels, note
# ============================================================
# [FIX-6] Tablo/form yapısını koruyan gelişmiş metin çıkarma
# ============================================================

def _extract_table_text_from_page(page):
    """PyMuPDF sayfasından tablo yapısını koruyarak metin çıkarır."""
    try:
        tables = page.find_tables()
        if not tables or not tables.tables:
            return ""
        table_texts = []
        for table in tables.tables:
            try:
                data = table.extract()
                if not data:
                    continue
                col_widths = []
                for col_idx in range(len(data[0]) if data else 0):
                    max_w = 0
                    for row in data:
                        if col_idx < len(row):
                            cell = str(row[col_idx] or "").strip()
                            max_w = max(max_w, len(cell))
                    col_widths.append(min(max_w, 50))

                formatted_rows = []
                for row_idx, row in enumerate(data):
                    cells = []
                    for col_idx, cell in enumerate(row):
                        cell_text = str(cell or "").strip().replace("\n", " ")
                        width = col_widths[col_idx] if col_idx < len(col_widths) else 20
                        cells.append(cell_text.ljust(width))
                    formatted_rows.append(" | ".join(cells))
                    if row_idx == 0:
                        separator = "-+-".join("-" * w for w in col_widths)
                        formatted_rows.append(separator)

                if formatted_rows:
                    table_texts.append("\n".join(formatted_rows))
            except Exception:
                continue
        return "\n\n".join(table_texts)
    except AttributeError:
        return ""
    except Exception as exc:
        logger.debug("Tablo çıkarma hatası: %s", exc)
        return ""


def extract_pdf_text_with_pymupdf(file_bytes):
    """[FIX-6] Geliştirilmiş: tablo yapısını da korur."""
    if not HAS_PYMUPDF:
        return ""
    chunks = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            page_count = min(len(doc), OCR_MAX_PAGES)
            for page_index in range(page_count):
                page = doc.load_page(page_index)

                table_text = _extract_table_text_from_page(page)

                try:
                    blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
                    page_lines = []
                    for block in blocks:
                        if block.get("type") != 0:
                            continue
                        for line in block.get("lines", []):
                            spans_text = " ".join(
                                span.get("text", "") for span in line.get("spans", [])
                            )
                            if spans_text.strip():
                                page_lines.append(spans_text.strip())
                    normal_text = "\n".join(page_lines)
                except Exception:
                    normal_text = page.get_text("text") or ""

                if table_text:
                    combined = normal_text.strip()
                    combined += "\n\n[TABLO]\n" + table_text + "\n[/TABLO]"
                    chunks.append(combined)
                elif normal_text.strip():
                    chunks.append(normal_text)

        return _clean_extracted_text("\n\n".join(chunks))
    except Exception as exc:
        logger.warning("PyMuPDF metin çıkarma başarısız: %s", exc)
        return ""


def extract_pdf_text_with_ocr(file_bytes):
    if not HAS_PYMUPDF or not HAS_TESSERACT or not HAS_PIL:
        missing = []
        if not HAS_PYMUPDF: missing.append("PyMuPDF")
        if not HAS_TESSERACT: missing.append("pytesseract")
        if not HAS_PIL: missing.append("Pillow")
        logger.warning("OCR için eksik bağımlılık: %s", ", ".join(missing))
        return ""
    chunks = []
    try:
        with fitz.open(stream=file_bytes, filetype="pdf") as doc:
            page_count = min(len(doc), OCR_MAX_PAGES)
            matrix = fitz.Matrix(OCR_DPI_SCALE, OCR_DPI_SCALE)
            for page_index in range(page_count):
                page = doc.load_page(page_index)
                pix = page.get_pixmap(matrix=matrix, alpha=False)
                image = Image.open(io.BytesIO(pix.tobytes("png")))
                text = pytesseract.image_to_string(image, lang=OCR_LANG, config="--psm 6") or ""
                text = text.strip()
                if text:
                    chunks.append(f"--- SAYFA {page_index + 1} ---\n{text}")
        return _clean_extracted_text("\n\n".join(chunks))
    except Exception as exc:
        logger.error("OCR metin çıkarma başarısız", exc_info=exc)
        return ""


def extract_file_text(file_bytes, file_name=""):
    name = str(file_name or "").lower()
    if name.endswith(".pdf"):
        normal_text = extract_pdf_text_with_pymupdf(file_bytes)
        if len(normal_text.strip()) >= OCR_MIN_TEXT_LENGTH:
            return normal_text, "pdf_text_layer"
        ocr_text = extract_pdf_text_with_ocr(file_bytes)
        if ocr_text.strip():
            return ocr_text, "ocr"
        return normal_text, "empty"
    if name.endswith(".txt"):
        return _clean_extracted_text(file_bytes.decode("utf-8", errors="ignore")), "txt"
    return "", "unsupported"


def json_response(payload, status=200):
    return Response(json.dumps(payload, ensure_ascii=False, indent=2), status=status,
                    mimetype="application/json; charset=utf-8")


def _to_bool(value):
    if isinstance(value, bool): return value
    if value is None: return False
    return str(value).strip().lower() in ["true", "1", "yes", "evet", "on"]


def sse_event(event, data):
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _to_list(resp):
    out = []
    for obj in getattr(resp, "objects", []) or []:
        row = {"properties": getattr(obj, "properties", {}) or {}}
        md = getattr(obj, "metadata", None)
        if md is not None:
            if hasattr(md, "distance"): row["distance"] = md.distance
            if hasattr(md, "score"): row["score"] = md.score
        out.append(row)
    return out


def _is_timeout_error(exc):
    msg = str(exc or "").lower()
    return any(x in msg for x in ["deadline exceeded", "timed out", "timeout", "read timeout"])


def _combined_score(row):
    if row.get("distance") is not None:
        try: return max(0.0, 1.0 - float(row.get("distance")))
        except Exception: pass
    if row.get("score") is not None:
        try: return float(row.get("score")) / 100.0
        except Exception: pass
    return 0.0


def _extract_first_json(text):
    if not text: return None
    s = str(text).strip()
    if s.startswith("```"):
        s = s.split("\n", 1)[1] if "\n" in s else s.replace("```", "", 1)
    if s.endswith("```"):
        s = s.rsplit("\n", 1)[0] if "\n" in s else s[:-3]
    s = s.strip()
    try: return json.loads(s)
    except Exception: pass
    i = s.find("{"); j = s.rfind("}")
    if i != -1 and j != -1 and j > i:
        candidate = s[i:j + 1]
        try: return json.loads(candidate)
        except Exception:
            candidate = re.sub(r",(\s*[}\]])", r"\1", candidate)
            try: return json.loads(candidate)
            except Exception: return None
    return None


_DECISION_CARDS_START = "[DECISION_CARDS_JSON]"
_DECISION_CARDS_END = "[/DECISION_CARDS_JSON]"


def _filter_decision_cards_stream_piece(piece, state):
    """
    Streaming sırasında karar kartı JSON bloğunu kullanıcıya sızdırmadan ayıklar.
    Marker parçalı chunk'lara bölünse bile küçük bir pending buffer ile çalışır.
    full_text ayrı tutulduğu için kart JSON'u daha sonra parse edilmeye devam eder.
    """
    text = state.get("pending", "") + str(piece or "")
    state["pending"] = ""
    visible_parts = []

    while text:
        if state.get("hidden", False):
            end_index = text.find(_DECISION_CARDS_END)
            if end_index == -1:
                keep_len = len(_DECISION_CARDS_END) - 1
                state["pending"] = text[-keep_len:] if len(text) > keep_len else text
                return "".join(visible_parts)

            text = text[end_index + len(_DECISION_CARDS_END):]
            state["hidden"] = False
            continue

        start_index = text.find(_DECISION_CARDS_START)
        if start_index != -1:
            visible_parts.append(text[:start_index])
            text = text[start_index + len(_DECISION_CARDS_START):]
            state["hidden"] = True
            continue

        keep_len = len(_DECISION_CARDS_START) - 1
        if len(text) > keep_len:
            visible_parts.append(text[:-keep_len])
            state["pending"] = text[-keep_len:]
        else:
            state["pending"] = text
        return "".join(visible_parts)

    return "".join(visible_parts)


def _flush_decision_cards_stream_filter(state):
    """Stream bittiğinde normal metinden elde tutulan son parçayı döndürür."""
    if state.get("hidden", False):
        state["pending"] = ""
        return ""

    pending = state.get("pending", "")
    state["pending"] = ""
    return pending

def _extract_stream_decision_cards(text):
    raw = str(text or "")
    m = re.search(r"\[DECISION_CARDS_JSON\](.*?)\[/DECISION_CARDS_JSON\]", raw, re.DOTALL | re.IGNORECASE)
    if not m:
        return []
    parsed = _extract_first_json(m.group(1).strip())
    if not isinstance(parsed, dict):
        return []
    rows = parsed.get("decisions") or parsed.get("ilgili_kararlar") or []
    if not isinstance(rows, list):
        return []
    out = []; seen = set()
    for item in rows:
        if not isinstance(item, dict): continue
        source_id = str(item.get("source_id") or item.get("id") or item.get("slug") or "").strip()
        court = str(item.get("court") or item.get("daire") or item.get("type") or "").strip()
        code = str(item.get("code") or "").strip()
        if not code:
            esas = str(item.get("esas") or "").strip()
            karar = str(item.get("karar") or "").strip()
            if esas and karar:
                code = f"{esas} E. {karar} K."
        key = source_id or f"{court}::{code}"
        if not key or key in seen: continue
        seen.add(key)
        used_part = str(item.get("used_part") or item.get("usedPart") or item.get("quote") or "").strip()
        relevance = str(item.get("relevance") or item.get("somut_olayla_baglanti") or "").strip()
        out.append({
            "id": key, "source_id": source_id or key,
            "slug": source_id or str(item.get("slug") or "").strip(),
            "kararId": str(item.get("kararId") or item.get("karar_id") or "").strip(),
            "court": court, "code": code,
            "used_part": used_part, "usedPart": used_part, "quote": used_part,
            "relevance": relevance, "source": "AI",
        })
    return out


def _bad_value(value):
    text = str(value or "").strip()
    return not text or re.match(r"^(belirtilmemi[şs]|n/?a|null|none)$", text, re.IGNORECASE)


def _looks_like_slug(value):
    base = str(value or "").replace(".txt", "")
    if not base: return False
    if re.search(r"(Hukuk|Ceza)_(Dairesi|Genel_Kurulu)", base, re.IGNORECASE):
        return bool(re.search(r"\bE[_-]", base, re.IGNORECASE) and re.search(r"\bK\b", base, re.IGNORECASE))
    if re.search(r"__(\d{4})-[^_]+E_\d{4}-[^_]+K$", base, re.IGNORECASE):
        return True
    return False


def _slug_from_props(props):
    for key in ("orijinal_karar_id", "dosya_adi", "dosya", "slug"):
        val = props.get(key)
        base = str(val or "").replace(".txt", "")
        if _looks_like_slug(base): return base
    return ""


def _deduce_code_from_props(props):
    code = str(props.get("code") or "").strip()
    if not _bad_value(code): return code
    esas = str(props.get("esas_no") or "").strip()
    karar = str(props.get("karar_no") or "").strip()
    if not _bad_value(esas) and not _bad_value(karar):
        return f"{esas} E. {karar} K."
    fname = str(props.get("orijinal_karar_id") or props.get("dosya_adi") or props.get("dosya") or props.get("slug") or "").strip()
    base = fname.replace(".txt", "")
    if not base: return ""
    m = re.match(r"^(\d+)_(Hukuk|Ceza)_Dairesi_(\d{4}-[0-9A-Za-z()/\\-]+)E_(\d{4}-[0-9A-Za-z()/\\-]+)K$", base, re.IGNORECASE)
    if m:
        e_part = re.sub(r"\s*-\s*", "/", m.group(3))
        k_part = re.sub(r"\s*-\s*", "/", m.group(4))
        return f"{e_part} E. {k_part} K."
    m = re.match(r"^(Hukuk|Ceza)_Genel_Kurulu_(\d{4}-[0-9A-Za-z()/\\-]+)E_(\d{4}-[0-9A-Za-z()/\\-]+)K$", base, re.IGNORECASE)
    if m:
        e_part = re.sub(r"\s*-\s*", "/", m.group(2))
        k_part = re.sub(r"\s*-\s*", "/", m.group(3))
        return f"{e_part} E. {k_part} K."
    return ""


def _deduce_court_from_props(props):
    fname = str(props.get("orijinal_karar_id") or props.get("dosya_adi") or props.get("dosya") or props.get("slug") or "").strip()
    base = fname.replace(".txt", "")
    m = re.match(r"^(\d+)_Hukuk_Dairesi_", base, re.IGNORECASE)
    if m: return f"Yargıtay {m.group(1)}. Hukuk Dairesi"
    m = re.match(r"^(\d+)_Ceza_Dairesi_", base, re.IGNORECASE)
    if m: return f"Yargıtay {m.group(1)}. Ceza Dairesi"
    m = re.match(r"^(Hukuk|Ceza)_Genel_Kurulu_", base, re.IGNORECASE)
    if m: return f"Yargıtay {m.group(1)} Genel Kurulu"
    court = str(props.get("mahkeme") or props.get("type") or "").strip()
    if court and not court.lower().startswith("yargıtay"):
        if "dairesi" in court.lower() or "genel kurulu" in court.lower():
            return f"Yargıtay {court}"
    return court


def _normalize_decision_card(item):
    props = item.get("properties", {}) if isinstance(item, dict) else {}
    slug = _slug_from_props(props)
    code = _deduce_code_from_props(props)
    court = _deduce_court_from_props(props)
    text = str(props.get("metin_parcasi") or "").strip()
    source_id = (item.get("_decision_group_key") if isinstance(item, dict) else "") or slug or str(
        props.get("orijinal_karar_id") or props.get("dosya_adi") or props.get("dosya") or props.get("slug") or ""
    ).replace(".txt", "")
    decision_id = source_id or code or court

    clean_lines = [line.strip() for line in text.splitlines() if line.strip()]
    first_meaningful_line = next(
        (
            line
            for line in clean_lines
            if not re.match(r"^(yargitay|yargıtay|t\.c\.|esas|karar|mahkemesi|daire)", line, re.IGNORECASE)
        ),
        clean_lines[0] if clean_lines else "",
    )

    used_part = str(
        item.get("used_part")
        or item.get("usedPart")
        or item.get("quote")
        or item.get("_used_part")
        or first_meaningful_line
        or text[:500]
        or ""
    ).strip() if isinstance(item, dict) else (first_meaningful_line or text[:500] or "")

    # Veritabanından gelen _ai_ozet alanını yakala.
    db_ozet = str(item.get("_ai_ozet") if isinstance(item, dict) else "").strip()
    summary = db_ozet if db_ozet else (used_part or text[:500])

    return {
        "id": decision_id,
        "source_id": source_id,
        "slug": slug or source_id,
        "kararId": "",
        "court": court,
        "code": code,
        "summary": summary,
        "aiSummary": summary,
        "used_part": used_part,
        "usedPart": used_part,
        "quote": used_part,
        "relevance": "",
        "source": "CONTEXT",
    }


def _parse_mevzuat_string(value):
    text = str(value or "").strip()
    if not text: return None
    m = re.match(r"^(?P<name>.+?)\s*m[.\s]*?(?P<article>[0-9A-Za-z/\-]+)\s*$", text, re.IGNORECASE)
    if m: return {"id": f"{m.group('name').strip()}::m. {m.group('article').strip()}", "name": m.group('name').strip(), "article": f"m. {m.group('article').strip()}", "note": text, "content": ""}
    return {"id": text, "name": text, "article": "", "note": text, "content": ""}


def _normalize_statutes(parsed_json):
    out = []
    raw = parsed_json.get("ilgili_mevzuat") or parsed_json.get("statutes") or [] if isinstance(parsed_json, dict) else []
    seen = set()
    for item in raw:
        if isinstance(item, str): row = _parse_mevzuat_string(item)
        elif isinstance(item, dict):
            name = str(item.get("name") or item.get("mevzuatAdi") or item.get("kanun") or "").strip()
            article = str(item.get("article") or item.get("madde") or "").strip()
            if article and not article.lower().startswith("m"): article = f"m. {article}"
            row = {"id": f"{name}::{article}", "name": name, "article": article, "note": str(item.get("note") or item.get("aciklama") or f"{name} {article}").strip(), "content": str(item.get("content") or item.get("metin") or "").strip()} if name else None
        else: row = None
        if not row: continue
        key = f"{row.get('name', '')}::{row.get('article', '')}"
        if key in seen: continue
        seen.add(key)
        out.append(row)
    return out
# ============================================================
# [FIX-1] Token limiti yönetimi — konuşma geçmişi kırpma
# ============================================================

def _estimate_token_count(text):
    return int(len(str(text or "")) / CHARS_PER_TOKEN_ESTIMATE)


def _trim_history(history, max_chars=None):
    if max_chars is None:
        max_chars = MAX_HISTORY_CHARS

    if not history or not isinstance(history, list):
        return []

    formatted = []
    for m in history:
        if not isinstance(m, dict):
            continue
        role = str(m.get("role") or "unknown").strip()
        content = str(m.get("content") or "").strip()
        if not content:
            continue
        formatted.append({"role": role, "content": content})

    if not formatted:
        return []

    protected_count = min(2, len(formatted))
    protected = formatted[-protected_count:]
    older = formatted[:-protected_count] if len(formatted) > protected_count else []

    protected_chars = sum(len(f"{m['role']}: {m['content']}") for m in protected)
    remaining_budget = max(0, max_chars - protected_chars)

    trimmed_older = []
    used_chars = 0
    for m in reversed(older):
        entry_text = f"{m['role']}: {m['content']}"
        entry_len = len(entry_text)

        if used_chars + entry_len <= remaining_budget:
            trimmed_older.insert(0, m)
            used_chars += entry_len
        else:
            leftover = remaining_budget - used_chars
            if leftover > 200:
                truncated_content = m["content"][:leftover - 50] + "... [kırpıldı]"
                trimmed_older.insert(0, {"role": m["role"], "content": truncated_content})
                used_chars += len(f"{m['role']}: {truncated_content}")
            if len(trimmed_older) < len(older):
                skipped = len(older) - len(trimmed_older)
                trimmed_older.insert(0, {
                    "role": "system",
                    "content": f"[{skipped} eski mesaj token limiti nedeniyle kırpıldı]"
                })
            break

    return trimmed_older + protected


def _format_history_text(history, max_chars=None):
    trimmed = _trim_history(history, max_chars)
    lines = []
    for m in trimmed:
        content = m.get("content", "")
        if len(content) > 2500:
            content = content[:2500] + "... [kırpıldı]"
        lines.append(f"{m.get('role', 'unknown')}: {content}")
    return "\n".join(lines)


# ============================================================
#  ARAMA ÇEKİRDEĞİ — Çoklu sorgu + RRF + ai_ozet zenginleştirme
# ============================================================

def _search_bm25_only(collection, text, filters, limit, properties):
    resp = collection.query.bm25(
        query=text,
        limit=limit,
        filters=filters,
        return_properties=properties,
        return_metadata=["score"],
    )
    return _to_list(resp)


def _search_real_hybrid(collection, text, vector, filters, limit, properties, alpha=None):
    resp = collection.query.hybrid(
        query=text, vector=vector,
        alpha=HYBRID_ALPHA if alpha is None else alpha,
        limit=limit, filters=filters,
        return_properties=properties, return_metadata=["score"],
    )
    return _to_list(resp)


def _search_semantic_only(collection, vector, filters, limit, properties):
    resp = collection.query.near_vector(
        near_vector=vector, limit=limit, filters=filters,
        return_properties=properties, return_metadata=["distance"],
    )
    return _to_list(resp)


def _search_with_fallback(collection, text, vector, filters, limit, properties, label):
    try:
        rows = _search_real_hybrid(collection, text, vector, filters, limit, properties)
        if rows:
            logger.info("%s: hybrid başarılı, %s kayıt", label, len(rows))
            return rows
        logger.warning("%s: hybrid 0 kayıt, semantic fallback deneniyor", label)
    except Exception as exc:
        logger.warning("%s: hybrid hata, semantic fallback deneniyor: %s", label, exc)
    try:
        rows = _search_semantic_only(collection, vector, filters, limit, properties)
        logger.info("%s: semantic fallback sonucu %s kayıt", label, len(rows))
        return rows
    except Exception as exc:
        logger.error("%s: semantic fallback başarısız", label, exc_info=exc)
        return []


def _search_by_strategy(collection, strategy, text, vector, filters, limit, properties, label):
    strategy = str(strategy or "hybrid").strip().lower()
    try:
        if strategy == "bm25":
            rows = _search_bm25_only(collection, text, filters, limit, properties)
            logger.info("%s: bm25 sonucu %s kayıt", label, len(rows))
            return rows

        if strategy == "semantic":
            rows = _search_semantic_only(collection, vector, filters, limit, properties)
            logger.info("%s: semantic sonucu %s kayıt", label, len(rows))
            return rows

        rows = _search_real_hybrid(collection, text, vector, filters, limit, properties)
        logger.info("%s: hybrid sonucu %s kayıt", label, len(rows))
        return rows

    except Exception as exc:
        logger.warning("%s: %s arama hata, fallback deneniyor: %s", label, strategy, exc)

        if strategy == "bm25" and vector is not None:
            try:
                rows = _search_real_hybrid(collection, text, vector, filters, limit, properties)
                logger.info("%s: bm25 -> hybrid fallback sonucu %s kayıt", label, len(rows))
                return rows
            except Exception as hybrid_exc:
                logger.warning("%s: bm25 -> hybrid fallback başarısız: %s", label, hybrid_exc)

        if vector is not None:
            try:
                rows = _search_semantic_only(collection, vector, filters, limit, properties)
                logger.info("%s: semantic fallback sonucu %s kayıt", label, len(rows))
                return rows
            except Exception as sem_exc:
                logger.error("%s: semantic fallback başarısız", label, exc_info=sem_exc)

        return []


def _looks_like_rate_limit_error(exc):
    msg = str(exc or "").lower()
    return any(x in msg for x in ["429", "resource exhausted", "too many requests", "quota", "rate limit", "rate_limit"])


def _clean_query_fragment(text, fallback=""):
    raw = str(text or "").strip()
    fallback_text = str(fallback or "").strip()
    if not raw:
        return fallback_text
    raw = re.sub(r"```(?:\w+)?", " ", raw).replace("```", " ")
    raw = raw.replace("**", " ").replace("__", " ")
    raw = re.sub(r"(?im)^\s*(broad_query|narrow_query|search_query|arama_metni|query)\s*[:：]", " ", raw)
    raw = re.sub(r"[#>*`\[\]{}]", " ", raw)
    raw = re.sub(r"\b(?:TCK|TBK|CMK|HMK|TTK|TMK|İİK|IİK)\b", " ", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\b(?:m\.?\s*)?\d{1,4}(?:/\d+)?\b", " ", raw)
    raw = re.sub(r"\s+", " ", raw).strip(" :-–—,.;\n\t")
    if not raw:
        return fallback_text
    if len(raw) > 900:
        raw = raw[:900].rsplit(" ", 1)[0].strip()
    return raw


def generate_content_with_fallback(prompt, primary_model, primary_config, fallback_model=None, fallback_config=None, label="Gemini"):
    if primary_model is None and fallback_model is None:
        raise RuntimeError(f"{label} modeli hazır değil.")
    try:
        if primary_model is None:
            raise RuntimeError(f"{label} ana modeli hazır değil.")
        return primary_model.generate_content(prompt, generation_config=primary_config)
    except Exception as exc:
        if fallback_model is None:
            raise
        if _looks_like_rate_limit_error(exc) or _is_timeout_error(exc):
            logger.warning("%s ana model başarısız, Flash fallback deneniyor: %s", label, exc)
            return fallback_model.generate_content(prompt, generation_config=fallback_config)
        raise


# --- KARAR ARAMA TETİKLEME ---
_CASE_INTENT_KEYWORDS = [
    "yargıtay", "emsal", "karar", "içtihat", "ictihat", "hgk", "daire",
    "benzer karar", "kararı bul", "karar bul", "içtihat bul", "emsal bul",
]
_LEGAL_QUESTION_SIGNALS = [
    "ceza alır", "ceza alı", "sorumlu", "suç", "dava", "tazminat", "beraat",
    "mahkum", "hak eder", "kazanır", "kaybeder", "geçerli mi", "haklı mı",
    "ne yapabilir", "mümkün mü", "olur mu", "olabilir mi", "gerekir mi",
    "zamanaşımı", "fesih", "tahliye", "alacak", "husumet", "itiraz", "temyiz",
]


def _query_wants_case_search(query):
    q = str(query or "").lower()
    if any(k in q for k in _CASE_INTENT_KEYWORDS):
        return True
    if "?" in q and any(s in q for s in _LEGAL_QUESTION_SIGNALS):
        return True
    if any(s in q for s in _LEGAL_QUESTION_SIGNALS) and len(q.split()) >= 5:
        return True
    return False


def _decision_group_key(row):
    props = row.get("properties", {}) if isinstance(row, dict) else {}
    return (_slug_from_props(props) or str(
        props.get("orijinal_karar_id") or props.get("dosya_adi") or props.get("dosya") or props.get("slug") or ""
    ).replace(".txt", ""))


def group_decision_rows(rows, max_chunks_per_decision=2):
    grouped = OrderedDict()
    unknown_count = 0
    for row in rows or []:
        key = _decision_group_key(row)
        if not key:
            unknown_count += 1
            key = f"unknown_{unknown_count}"
        grouped.setdefault(key, []).append(row)
    final_rows = []
    for key, group_rows in grouped.items():
        sorted_rows = sorted(
            group_rows,
            key=lambda r: (r.get("_rrf_score", 0.0), _combined_score(r)),
            reverse=True,
        )
        for row in sorted_rows[:max_chunks_per_decision]:
            row["_decision_group_key"] = key
            final_rows.append(row)
    return final_rows


def _rrf_merge(ranked_lists, k=None):
    k = RRF_K if k is None else k

    def row_uid(row):
        props = row.get("properties", {}) if isinstance(row, dict) else {}
        uid = str(props.get("benzersiz_id_str") or "").strip()
        if uid:
            return uid
        fname = str(props.get("dosya_adi") or props.get("orijinal_karar_id") or "").strip()
        parca = str(props.get("parca_no") or "").strip()
        if fname:
            return f"{fname}#{parca}"
        return "h:" + str(hash(str(props.get("metin_parcasi") or "")[:200]))

    scores = {}; holder = {}
    for ranked in ranked_lists:
        for rank, row in enumerate(ranked):
            uid = row_uid(row)
            scores[uid] = scores.get(uid, 0.0) + 1.0 / (k + rank + 1)
            if uid not in holder:
                holder[uid] = row
    merged = sorted(holder.values(), key=lambda r: scores[row_uid(r)], reverse=True)
    for r in merged:
        r["_rrf_score"] = scores[row_uid(r)]
    return merged


def _fetch_ai_summaries_for_groups(collection, group_keys, max_groups=40):
    summaries = {}
    keys = [k for k in (group_keys or []) if k][:max_groups]
    if not keys:
        return summaries
    keyset = set(keys)
    try:
        flt = Filter.by_property("kaynak_turu").equal("ai_ozet")
        resp = collection.query.fetch_objects(
            filters=flt, limit=AI_OZET_FETCH_LIMIT,
            return_properties=[
                "metin_parcasi", "kaynak_turu", "dosya_adi",
                "orijinal_karar_id", "ilgili_karar_dosyasi", "parca_no",
            ],
        )
        for row in _to_list(resp):
            props = row.get("properties", {})
            cand_keys = {
                str(props.get("orijinal_karar_id") or "").replace(".txt", "").strip(),
                str(props.get("ilgili_karar_dosyasi") or "").replace(".txt", "").strip(),
                str(props.get("dosya_adi") or "").replace(".txt", "").strip(),
            }
            text = str(props.get("metin_parcasi") or "").strip()
            if not text:
                continue
            for ck in cand_keys:
                if ck and ck in keyset:
                    summaries[ck] = (summaries.get(ck, "") + "\n" + text).strip()
    except Exception as exc:
        logger.warning("ai_ozet toplu çekme başarısız (atlanıyor): %s", exc)
    return summaries


def rerank_with_vertex_enriched(query, records, project_id, location="global", top_n=None):
    effective_top_n = RERANK_TOP_N if top_n is None else top_n
    if not HAS_DISCOVERY_ENGINE or not project_id or not records:
        return records[:effective_top_n]
    try:
        client = discoveryengine.RankServiceClient()
        ranking_config = client.ranking_config_path(
            project=project_id, location=location, ranking_config="default_ranking_config"
        )
        records_to_rank = []
        for idx, row in enumerate(records):
            props = row.get("properties", {})
            court = _deduce_court_from_props(props)
            code = _deduce_code_from_props(props)
            chunk_text = str(props.get("metin_parcasi") or "")[:1500]
            ozet = str(row.get("_ai_ozet") or "")[:800]
            ranking_text = (
                f"mahkeme: {court}\nkod: {code}\n"
                + (f"ozet: {ozet}\n" if ozet else "")
                + f"gerekce: {chunk_text}"
            )[:2400]
            records_to_rank.append(
                discoveryengine.RankingRecord(id=str(idx), title=f"{court} {code}"[:128], content=ranking_text)
            )
        request_obj = discoveryengine.RankRequest(
            ranking_config=ranking_config, model=VERTEX_RANKING_MODEL, query=query,
            records=records_to_rank, top_n=min(len(records_to_rank), max(effective_top_n * 2, effective_top_n)),
        )
        response = client.rank(request=request_obj)
        ranked_records = []; seen_groups = set()
        for rec in response.records:
            row = records[int(rec.id)]
            key = row.get("_decision_group_key") or _decision_group_key(row) or str(rec.id)
            if key in seen_groups:
                continue
            seen_groups.add(key)
            ranked_records.append(row)
            if len(ranked_records) >= effective_top_n:
                break
        logger.info("Vertex Ranking (enriched): %s -> %s farklı karar", len(records), len(ranked_records))
        return ranked_records
    except Exception as exc:
        logger.error("Vertex Ranking başarısız, RRF sırası dönülüyor: %s", exc)
        return records[:effective_top_n]


# ============================================================
# [FIX-4] Paralel arama: karar + makale eşzamanlı
# ============================================================

def search_decisions(collection, embedding_model, query_pack, project_id, location, rerank_top_n=None):
    bm25_queries = query_pack.get("bm25_queries") or []
    semantic_queries = query_pack.get("semantic_queries") or []
    hybrid_queries = query_pack.get("hybrid_queries") or []

    if not (bm25_queries or semantic_queries or hybrid_queries):
        fallback_queries = query_pack.get("queries") or [query_pack.get("narrow") or query_pack.get("broad") or ""]
        bm25_queries = fallback_queries[:3]
        semantic_queries = fallback_queries[:2]
        hybrid_queries = fallback_queries[:2]

    search_jobs = []
    for q in bm25_queries[:3]:
        if q:
            search_jobs.append(("bm25", q))
    for q in semantic_queries[:2]:
        if q:
            search_jobs.append(("semantic", q))
    for q in hybrid_queries[:2]:
        if q:
            search_jobs.append(("hybrid", q))

    queries = [q for _, q in search_jobs]

    logger.info(
        "Karar araması başlatılıyor | toplam_sorgu=%s | top_per_query=%s",
        len(search_jobs),
        RETRIEVAL_TOP_PER_QUERY,
    )

    for idx, (strategy, qtext) in enumerate(search_jobs, start=1):
        logger.info(
            "Karar arama sorgusu %s/%s | strategy=%s | query=%s",
            idx,
            len(search_jobs),
            strategy,
            qtext,
        )
    narrow_q = (
        hybrid_queries[0]
        if hybrid_queries else semantic_queries[0]
        if semantic_queries else bm25_queries[0]
        if bm25_queries else ""
    )

    karar_filter = Filter.by_property("kaynak_turu").equal("yargi_karari")
    karar_props = [
        "metin_parcasi", "kaynak_turu", "dosya_adi", "orijinal_karar_id",
        "ilgili_karar_dosyasi", "parca_no", "benzersiz_id_str",
        "karar_tarihi", "mahkeme", "esas_no", "karar_no",
    ]

    def _run_single_query(job):
        strategy, qtext = job
        if not qtext:
            return []
        vec = embedding_model.encode(qtext, normalize_embeddings=True).tolist()
        return _search_by_strategy(
            collection,
            strategy,
            qtext,
            vec,
            karar_filter,
            RETRIEVAL_TOP_PER_QUERY,
            karar_props,
            f"karar araması {strategy} | sorgu={qtext[:180]}",
        )

    ranked_lists = []
    futures = {_search_executor.submit(_run_single_query, job): job for job in search_jobs}
    for future in as_completed(futures):
        try:
            rows = future.result(timeout=WEAVIATE_QUERY_TIMEOUT)
            if rows:
                ranked_lists.append(rows)
        except Exception as exc:
            logger.warning("Paralel karar araması başarısız job=%s: %s", futures[future], exc)

    if not ranked_lists:
        return [], queries

    merged = _rrf_merge(ranked_lists)
    grouped = group_decision_rows(merged, max_chunks_per_decision=MAX_CHUNKS_PER_DECISION)
    candidate_rows = grouped[:RERANK_CANDIDATE_LIMIT]

    group_keys = []
    for row in candidate_rows:
        gk = row.get("_decision_group_key") or _decision_group_key(row)
        if gk:
            group_keys.append(gk)

    ai_summaries = _fetch_decision_ai_summaries_from_db(
        candidate_rows,
        limit=max(RERANK_CANDIDATE_LIMIT, MAX_KARAR_CONTEXT),
    )    
    if not ai_summaries:
         ai_summaries = _fetch_ai_summaries_for_groups(collection, list(dict.fromkeys(group_keys)))
    for row in candidate_rows:
         gk = row.get("_decision_group_key") or _decision_group_key(row)
         row["_ai_ozet"] = ai_summaries.get(gk, "")

    effective_top_n = rerank_top_n if rerank_top_n is not None else RERANK_CANDIDATE_LIMIT
    ranked = rerank_with_vertex_enriched(narrow_q, candidate_rows, project_id, location, top_n=effective_top_n)
    return ranked, queries


def search_makale(collection, embedding_model, query_text):
    vec = embedding_model.encode(query_text, normalize_embeddings=True).tolist()
    makale_filter = Filter.by_property("kaynak_turu").equal("makale")
    return _search_with_fallback(collection, query_text, vec, makale_filter, MAKALE_LIMIT,
                                 ["metin_parcasi", "dosya_adi"], "makale araması")


def _parallel_search_decisions_and_makale(collection, embedding_model, query_pack, project_id, location, rerank_top_n, broad_query):
    karar_future = _search_executor.submit(
        search_decisions, collection, embedding_model, query_pack, project_id, location, rerank_top_n
    )
    makale_future = _search_executor.submit(
        search_makale, collection, embedding_model, broad_query
    )

    karar_rows, queries_used = [], []
    try:
        karar_rows, queries_used = karar_future.result(timeout=WEAVIATE_QUERY_TIMEOUT + 30)
    except Exception as exc:
        logger.error("Paralel karar araması başarısız: %s", exc)

    makale_rows = []
    try:
        makale_rows = makale_future.result(timeout=WEAVIATE_QUERY_TIMEOUT + 10)
    except Exception as exc:
        logger.error("Paralel makale araması başarısız: %s", exc)

    return karar_rows, makale_rows, queries_used


# --- 4. CACHE + ÇOKLU SORGU CONDENSE ---
def _cache_get(key):
    with _cache_lock:
        value = _CONDENSE_CACHE.get(key)
        if value is not None:
            try: _CONDENSE_CACHE.move_to_end(key)
            except Exception: pass
        return value


def _cache_put(key, value):
    with _cache_lock:
        try:
            _CONDENSE_CACHE[key] = value
            _CONDENSE_CACHE.move_to_end(key)
            while len(_CONDENSE_CACHE) > CONDENSE_CACHE_MAX:
                _CONDENSE_CACHE.popitem(last=False)
        except Exception: pass


def condense_query_multi(query, history_text="", workspace_context_text=""):
    global fast_model
    q = str(query or "").strip()
    if not q:
        return {
            "broad": q,
            "narrow": q,
            "queries": [],
            "bm25_queries": [],
            "semantic_queries": [],
            "hybrid_queries": [],
        }

    fallback_pack = {
        "broad": q,
        "narrow": q,
        "queries": [q],
        "bm25_queries": [q, q, q],
        "semantic_queries": [q, q],
        "hybrid_queries": [q, q],
    }

    if fast_model is None:
        return fallback_pack

    cache_key = "MQ7::" + str(hash(q + str(history_text) + str(workspace_context_text)))
    cached = _cache_get(cache_key)
    if cached:
        return cached

    result = {"text": ""}
    error = {"err": None}

    def worker():
        try:
            dynamic_prompt = f"Kullanıcı Sorusu: {q}\n"
            if history_text:
                dynamic_prompt += f"Son Konuşma Geçmişi:\n{history_text[-1200:]}\n"
            if workspace_context_text:
                dynamic_prompt += f"Çalışma Alanı Dosya/Not Özeti:\n{workspace_context_text[:7000]}\n"

            dynamic_prompt += """

Aşağıdakileri dikkate alarak SADECE JSON döndür.
Açıklama, markdown, kod bloğu kullanma.
Tam olarak 3 bm25, 2 semantic, 2 hybrid sorgu üret.

Şema:
{
  "bm25_queries": ["string", "string", "string"],
  "semantic_queries": ["string", "string"],
  "hybrid_queries": ["string", "string"]
}

Kurallar:
- bm25_queries: Yargıtay metninde aynen geçebilecek kısa anahtar kelime ve kavram dizileri olsun.
- semantic_queries: Somut hukuki problemi tam ve doğal cümleyle anlatsın.
- hybrid_queries: Hem anahtar kavramları hem doğal hukuki cümleyi birlikte taşısın.
- Kanun madde numarası yazma.
- Boş sorgu üretme.
"""
            resp = fast_model.generate_content(
                dynamic_prompt,
                generation_config=getattr(app, "_fast_generation_config", None),
            )
            result["text"] = resp.text or ""
        except Exception as exc:
            error["err"] = exc

    th = threading.Thread(target=worker, daemon=True)
    th.start()
    th.join(GEMINI_FAST_TIMEOUT_MS / 1000.0)

    if error["err"]:
        logger.warning("Multi-condense başarısız, kullanıcı sorgusu kullanılacak: %s", error["err"])

    parsed = _extract_first_json(result["text"]) or {}

    def _clean_query_list(values, count, fallback_value):
        cleaned = []

        if isinstance(values, list):
            iterable = values
        elif values:
            iterable = [values]
        else:
            iterable = []

        for item in iterable:
            c = _clean_query_fragment(item, fallback="")
            if c and c not in cleaned:
                cleaned.append(c)

        fallback_clean = _clean_query_fragment(fallback_value, fallback=q)
        while len(cleaned) < count:
            cleaned.append(fallback_clean)

        return cleaned[:count]

    bm25_queries = _clean_query_list(parsed.get("bm25_queries"), 3, q)
    semantic_queries = _clean_query_list(parsed.get("semantic_queries"), 2, q)
    hybrid_queries = _clean_query_list(parsed.get("hybrid_queries"), 2, q)

    broad = semantic_queries[0] if semantic_queries else q
    narrow = hybrid_queries[0] if hybrid_queries else broad

    queries = []
    for cand in bm25_queries + semantic_queries + hybrid_queries:
        if cand and cand not in queries:
            queries.append(cand)

    out = {
        "broad": broad,
        "narrow": narrow,
        "queries": queries,
        "bm25_queries": bm25_queries,
        "semantic_queries": semantic_queries,
        "hybrid_queries": hybrid_queries,
    }

    _cache_put(cache_key, out)

    logger.info(
        "Multi-query-7 | bm25=%s | semantic=%s | hybrid=%s",
        len(bm25_queries),
        len(semantic_queries),
        len(hybrid_queries),
    )
    logger.info("BM25 sorguları: %s", bm25_queries)
    logger.info("Semantic sorguları: %s", semantic_queries)
    logger.info("Hybrid sorguları: %s", hybrid_queries)

    return out
# --- 5. İLK YÜKLEME (INIT) ---
def initialize_app():
    global embedding_modeli, hukuk_koleksiyonu, gemini_modeli, fast_model, answer_fast_model, profile_model, genai_client
    load_dotenv()
    weaviate_url = os.getenv("WEAVIATE_URL")
    embedding_model_name = os.getenv("EMBEDDING_MODEL_ADI")
    class_name = os.getenv("WEAVIATE_CLASS_NAME")
    project_id = os.getenv("GCP_PROJECT_ID")
    location = os.getenv("GCP_LOCATION", "global")

    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available() else "cpu"))
    torch.set_num_threads(int(os.getenv("TORCH_NUM_THREADS", "1")))
    embedding_modeli = SentenceTransformer(embedding_model_name, device=device)

    parsed = urlparse(weaviate_url)
    client = weaviate.connect_to_custom(
        http_host=parsed.hostname, http_port=parsed.port or (443 if parsed.scheme == "https" else 80),
        http_secure=parsed.scheme == "https", grpc_host=parsed.hostname,
        grpc_port=int(os.getenv("WEAVIATE_GRPC_PORT", "50051")), grpc_secure=parsed.scheme == "https",
        additional_config=AdditionalConfig(timeout=(WEAVIATE_CONNECT_TIMEOUT, WEAVIATE_QUERY_TIMEOUT)),
    )
    hukuk_koleksiyonu = client.collections.get(class_name)

    genai_client = genai.Client(
        vertexai=True,
        project=project_id,
        location=location,
    )

    app._main_generation_config = types.GenerateContentConfig(
        temperature=0.1,
        top_p=0.2,
        top_k=20,
        max_output_tokens=10544,
    )
    main_model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview")
    logger.info("Ana Gemini model: %s", main_model_name)
    gemini_modeli = GenAIModelWrapper(
        client=genai_client,
        model_name=main_model_name,
        system_instruction=MAIN_SYSTEM_INSTRUCTION,
    )

    app._fast_generation_config = types.GenerateContentConfig(
        temperature=0.2,
        top_p=0.8,
        top_k=32,
        max_output_tokens=4096,
    )
    fast_model_name = os.getenv("GEMINI_FAST_MODEL", "gemini-3.5-flash")
    logger.info("CONDENSE FAST Gemini model: %s", fast_model_name)
    try:
        fast_model = GenAIModelWrapper(
            client=genai_client,
            model_name=fast_model_name,
            system_instruction=CONDENSE_SYSTEM_PROMPT,
        )
    except Exception:
        fast_model = None

    answer_fast_system_instruction = (
        "Sen Türk hukuku alanında çalışan kıdemli bir avukat yardımcısısın. "
        "Görevin, kullanıcının sorusuna, dosya bağlamı ve sağlanan Yargıtay kararları üzerinden "
        "net, teknik ve uygulanabilir cevap vermektir. "
        "Arama sorgusu üretmezsin. JSON üretmen istenmedikçe JSON üretmezsin. "
        "Karar alıntılarını sakın dosya adıyla yapma. Esas ve Karar no ile yap mutlaka."
        "Cevabın kısa ama yüzeysel olmamalıdır. Gereksiz uzatma yapmadan somut sonuca, gerekçeye, "
        "risklere ve uygulanabilir öneriye odaklanırsın. "
        "Yargıtay kararı uydurmazsın; yalnızca sağlanan kararları kullanırsın."
    )

    app._answer_fast_generation_config = types.GenerateContentConfig(
        temperature=0.07,
        top_p=0.85,
        top_k=64,
        max_output_tokens=15544,
    )
    answer_fast_model_name = os.getenv("GEMINI_ANSWER_FAST_MODEL", fast_model_name)
    logger.info("ANSWER FAST Gemini model: %s", answer_fast_model_name)
    try:
        answer_fast_model = GenAIModelWrapper(
            client=genai_client,
            model_name=answer_fast_model_name,
            system_instruction=answer_fast_system_instruction,
        )
    except Exception:
        answer_fast_model = None

    # [YENİ] Dosya profili için AYRI model.
    # fast_model condense (arama sorgusu üretme) talimatıyla yapılandırıldığından
    # profil üretiminde kullanılamaz; boş/eksik JSON döndürüyordu. Bu model
    # profil-odaklı bir system instruction ile kurulur. Varsayılan olarak hafif
    # (flash) model kullanılır; istenirse GEMINI_PROFILE_MODEL ile değiştirilir.
    app._profile_generation_config = types.GenerateContentConfig(
        temperature=0.1,
        top_p=0.3,
        top_k=24,
        max_output_tokens=8192,
    )
    profile_model_name = os.getenv("GEMINI_PROFILE_MODEL", fast_model_name)
    logger.info("PROFİL Gemini model: %s", profile_model_name)
    try:
        profile_model = GenAIModelWrapper(
            client=genai_client,
            model_name=profile_model_name,
            system_instruction=(
                "Sen Türk hukuku alanında çalışan bir avukat yardımcısısın. "
                "Görevin, sana verilen belgeden yapılandırılmış bir dosya profili çıkarmaktır. "
                "Yanıtın YALNIZCA geçerli bir JSON nesnesi olmalıdır; açıklama, ön söz veya "
                "markdown kod bloğu eklemezsin. Belgede bulunmayan bilgi uydurmazsın."
            ),
        )
    except Exception:
        profile_model = None


def ensure_initialized():
    with _init_lock:
        if getattr(app, "_inited", False): return
        initialize_app()
        app._inited = True


# ============================================================
# [FIX-8] Geliştirilmiş Mod Sistemi — özelleştirme desteği
# ============================================================

_DEFAULT_MODE_BEHAVIORS = {
    "general_analysis": {
        "instruction": "ÇALIŞMA MODU: GENEL HUKUKİ ANALİZ. Soruyu dosya, not ve kararlarla birlikte değerlendir; "
                        "somut olaya en yakın emsalleri öne çıkar. Doğrudan alıntı yapmaya çalış.",
        "force_search": False, "want_decision_cards": True, "rerank_top_n": RERANK_TOP_N,
        "description": "Genel hukuki analiz modu",
        "customizable": True,
    },
    "file_strategy": {
        "instruction": "ÇALIŞMA MODU: DOSYA STRATEJİSİ. Önce dosyadaki vakıaları, güçlü/zayıf yönleri, eksik delilleri "
                        "tespit et; sonra bu noktaları DESTEKLEYEN veya ÇÜRÜTEN emsalleri seç. Her karar için somut "
                        "olaya bağını net yaz.",
        "force_search": True, "want_decision_cards": True, "rerank_top_n": max(RERANK_TOP_N, 20),
        "description": "Dosya stratejisi ve güçlü/zayıf yön analizi",
        "customizable": True,
    },
    "contract_protocol_drafting": {
        "instruction": "ÇALIŞMA MODU: SÖZLEŞME / PROTOKOL TASLAĞI. Kullanıcının istemleri, yüklenen belgeler, "
                        "taraf bilgileri ve çalışma alanı notları doğrultusunda profesyonel bir sözleşme veya protokol taslağı hazırla. "
                        "Önce taraflar, konu, amaç, kapsam, edimler, ödeme/teslim/tahliye/ifa şartları, süreler, temerrüt, cezai şart, "
                        "fesih, gizlilik, uyuşmazlık çözümü ve imza hükümleri bakımından taslak kurgusunu oluştur. "
                        "Belgede açıkça bulunmayan isim, tarih, tutar, adres veya özel şartları uydurma; bu alanları [köşeli parantez] içinde bırak. "
                        "Kullanıcı özellikle istemedikçe Yargıtay kararı arama; bu modun önceliği karar analizi değil, uygulanabilir taslak metin üretimidir.",
        "force_search": False, "want_decision_cards": False, "rerank_top_n": 0,
        "description": "Sözleşme ve protokol taslağı hazırlama",
        "customizable": True,
    },
    "evidence_analysis": {
        "instruction": "ÇALIŞMA MODU: DELİL ANALİZİ. Her delili ispat gücü, hukuka uygunluğu ve eksiklik yönünden "
                        "incele. Özellikle hukuka aykırı delil, delil zinciri ve ispat yükü konularına odaklan.",
        "force_search": True, "want_decision_cards": True, "rerank_top_n": RERANK_TOP_N,
        "description": "Delil analizi ve ispat gücü değerlendirmesi",
        "customizable": True,
    },
    "document_summary": {
        "instruction": "ÇALIŞMA MODU: ÖZETLE. Dosya içeriğini kronolojik, sade ve hukuki olay örgüsüne göre özetle. "
                        "Emsal karar araması, kullanıcı açıkça istemedikçe yapma; uydurma atıf ekleme.",
        "force_search": False, "want_decision_cards": False, "rerank_top_n": 0,
        "description": "Dosya özeti ve kronoloji",
        "customizable": True,
    },
    "petition_draft": {
        "instruction": (
            "ÇALIŞMA MODU: DİLEKÇE TASLAĞI.\n\n"
            "Sen Türkiye'nin en iyi hukuk bürolarından birinde çalışan deneyimli bir avukat yardımcısısın. "
            "Görevin mahkemeye doğrudan sunulabilecek kalitede, profesyonel, detaylı ve ikna edici bir dilekçe taslağı hazırlamaktır.\n\n"
            "DİLEKÇE YAPISI (bu sırayla yaz):\n"
            "1. MAHKEMESİ — Görevli mahkemeyi belirle. BÜYÜK HARFLE, ### başlığı olarak yaz. Bilinmiyorsa [Görevli Mahkeme] bırak.\n"
            "2. TARAFLAR — **DAVACI:**, **VEKİLİ:**, **DAVALILAR:** satırları. Bilinmeyen bilgiler [köşeli parantez].\n"
            "3. KONU — **KONU:** tek cümle.\n"
            "4. DAVA DEĞERİ — **DAVA DEĞERİ:** bilinmiyorsa [belirtilecektir].\n"
            "5. --- (yatay çizgi ile bölüm ayır)\n"
            "6. ### **AÇIKLAMALAR** — En az 8, mümkünse 12 numaralı madde. "
            "Her madde kalın alt başlıklı olsun. Kronolojiyi koru. "
            "Yargıtay kararlarına 'Yargıtay X. Hukuk Dairesi, YYYY/NNN E. YYYY/NNN K.' formatında bol atıf yap. "
            "Kararların nihai gerekçesini ve sonucunu somut olayla bağlantılı kullan.\n"
            "7. ### **HUKUKİ SEBEPLER** — Kanun adı ve madde numarası (örn: Türk Borçlar Kanunu m. 350), Yargıtay içtihadı.\n"
            "8. ### **DELİLLER** — Madde madde listele.\n"
            "9. ### **SONUÇ VE İSTEM** — 'Davamızın KABULÜNE...' ile biten net istem.\n\n"
            "YAZIM KURALLARI:\n"
            "- Başlıklar: ### **BAŞLIK** formatında.\n"
            "- Etiketler: **DAVACI:** değer formatında.\n"
            "- Bölüm ayraçları için --- kullan.\n"
            "- Bilinmeyenler: [köşeli parantez].\n"
            "- Dilekçe anlatımı sürükleyici, iddialı ve hukuki terminoloji açısından zengin olsun.\n"
            "- Olabildiğince uzun ve detaylı yaz.\n\n"
            "MARKER KURALI — ÇOK ÖNEMLİ:\n"
            "Dilekçe metninin başına §§DILEKCE§§ yaz, sonuna §§/DILEKCE§§ yaz. "
            "Bu markerların dışında dilekçeden önce kısa bir strateji notu, sonra hukuki dayanak özeti yazabilirsin."
        ),
        "force_search": True, "want_decision_cards": True, "rerank_top_n": max(RERANK_TOP_N, 20),
        "description": "Dilekçe taslağı hazırlama",
        "customizable": True,
    },
}

_custom_mode_behaviors = {}
_custom_modes_lock = threading.Lock()

WORKSPACE_MODE_BEHAVIOR = dict(_DEFAULT_MODE_BEHAVIORS)


def register_custom_mode(mode_name, instruction, force_search=False, want_decision_cards=True,
                         rerank_top_n=None, description=""):
    with _custom_modes_lock:
        behavior = {
            "instruction": str(instruction or "").strip(),
            "force_search": bool(force_search),
            "want_decision_cards": bool(want_decision_cards),
            "rerank_top_n": rerank_top_n if rerank_top_n is not None else RERANK_TOP_N,
            "description": str(description or "").strip(),
            "customizable": True,
            "custom": True,
        }
        _custom_mode_behaviors[mode_name] = behavior
        WORKSPACE_MODE_BEHAVIOR[mode_name] = behavior
        logger.info("Özel mod kaydedildi: %s", mode_name)
        return behavior


def get_mode_behavior(workspace_mode, mode_overrides=None):
    mode = str(workspace_mode or "general_analysis").strip()
    base = WORKSPACE_MODE_BEHAVIOR.get(mode, WORKSPACE_MODE_BEHAVIOR["general_analysis"]).copy()

    if mode_overrides and isinstance(mode_overrides, dict):
        if "force_search" in mode_overrides:
            base["force_search"] = bool(mode_overrides["force_search"])
        if "want_decision_cards" in mode_overrides:
            base["want_decision_cards"] = bool(mode_overrides["want_decision_cards"])
        if "rerank_top_n" in mode_overrides:
            base["rerank_top_n"] = int(mode_overrides["rerank_top_n"])
        if "extra_instruction" in mode_overrides:
            extra = str(mode_overrides["extra_instruction"]).strip()
            if extra:
                base["instruction"] = base["instruction"] + "\n\nEK TALİMAT: " + extra

    return base


def get_workspace_mode_instruction(workspace_mode, mode_overrides=None):
    return get_mode_behavior(workspace_mode, mode_overrides)["instruction"]


def _should_search_for_mode(workspace_mode, force_case_search, history, query, mode_overrides=None, force_no_case_search=False):
    if force_no_case_search:
        return False
    behavior = get_mode_behavior(workspace_mode, mode_overrides)
    return bool(force_case_search or behavior["force_search"] or len(history or []) == 0 or _query_wants_case_search(query))


# ============================================================
# [FIX-3] Atıf doğrulama — hallucination kontrolü
# ============================================================

def _build_context_source_id_set(karar_rows):
    source_ids = set()
    for row in (karar_rows or []):
        key = row.get("_decision_group_key") or _decision_group_key(row)
        if key:
            source_ids.add(key)
        props = row.get("properties", {}) if isinstance(row, dict) else {}
        for field in ("orijinal_karar_id", "dosya_adi", "dosya", "slug"):
            val = str(props.get(field) or "").replace(".txt", "").strip()
            if val:
                source_ids.add(val)
    return source_ids


def _validate_decision_citations(decisions, context_source_ids, answer_text=""):
    if not decisions or not context_source_ids:
        return decisions, []

    validated = []
    hallucinated = []

    for dec in decisions:
        if not isinstance(dec, dict):
            continue

        source_id = str(dec.get("source_id") or "").strip()
        slug = str(dec.get("slug") or "").strip()
        court = str(dec.get("court") or "").strip()
        code = str(dec.get("code") or "").strip()

        found = False
        for candidate in (source_id, slug):
            if candidate and candidate in context_source_ids:
                found = True
                break
            if candidate:
                for ctx_id in context_source_ids:
                    if candidate in ctx_id or ctx_id in candidate:
                        found = True
                        break
            if found:
                break

        if found:
            validated.append(dec)
        else:
            hallucinated.append({
                "source_id": source_id,
                "court": court,
                "code": code,
                "reason": "Bu karar sağlanan bağlamda bulunamadı."
            })
            logger.warning(
                "ATIF DOĞRULAMA: Hallucination tespit edildi! source_id='%s', court='%s', code='%s'",
                source_id, court, code
            )

    return validated, hallucinated


def _add_hallucination_warning_to_answer(answer, hallucinated_citations):
    if not hallucinated_citations:
        return answer

    warning = "\n\n---\n⚠️ **Atıf Doğrulama Notu**: "
    removed_refs = []
    for h in hallucinated_citations:
        ref = f"{h.get('court', '')} {h.get('code', '')}".strip()
        if ref:
            removed_refs.append(ref)

    if removed_refs:
        warning += f"Aşağıdaki {len(removed_refs)} atıf bağlamda doğrulanamadığı için kaldırılmıştır: "
        warning += ", ".join(removed_refs) + "."
    else:
        warning += "Bazı atıflar bağlamda doğrulanamadığı için kaldırılmıştır."

    return answer + warning


# --- PROMPT BUILDERLAR ---
def build_prompt(user_query, context_text, history_text="", workspace_context_text="", workspace_mode="general_analysis", mode_overrides=None, deep_thinking=False):
    mode_instruction = get_workspace_mode_instruction(workspace_mode, mode_overrides)
    answer_length_instruction = (
        "Bu yanıt DERİN ANALİZ modunda üretilecek. Dosya vakıalarını, riskleri, karşı argümanları ve karar bağlantılarını daha ayrıntılı açıkla."
        if deep_thinking
        else "Bu yanıt HIZLI MODDA üretilecek. Cevabı kısa, yoğun ve uygulanabilir tut. En fazla 4 ana başlık kullan; her başlık altında 1-3 kısa paragraf yaz. Ancak somut olay değerlendirmesi, sonuç ve varsa Yargıtay karar bağlantısını eksik bırakma."
    )
    return f"""
Gönderilen çalışma modu ve kurallar çerçevesinde kullanıcının sorusuna teknik ve uygulanabilir bir hukuki analiz üret.

<calisma_modu>
{mode_instruction}
</calisma_modu>

<kurallar>
0. {answer_length_instruction}
1. Yargıtay kararı uydurma. Sadece <kararlar_ve_makaleler> bölümünde sağlanan kararlardan yararlan.
2. Çalışma alanındaki <dosya_baglami> parçaları somut olaya ilişkin birincil vakıa kaynağıdır. Önce dosyadan tespit edilenleri değerlendir.
3. KARAR SEÇİM ÖNCELİKLERİ şu sırayla uygulanır:
   a. Somut olayın maddi vakıasına en çok benzeyen kararlar.
   b. Aynı dava/suç türüne ilişkin kararlar.
   c. Aynı ispat, delil, kast, kusur, illiyet veya usul problemine temas eden kararlar.
   d. Hukuki ilkeyi açıkça ortaya koyan HGK veya ilgili daire kararları.
   e. Sadece genel ilke içeren ama vakıa benzerliği zayıf kararları ikincil destek olarak kullan.
4. Kararları sadece <kararlar_ve_makaleler> bölümünde verilen source_id değerlerinden seç. JSON'daki `source_id` alanını aynen döndür. Bağlamda bulunmayan source_id, daire, esas veya karar numarası üretme.
5. Her karar için `used_part` alanında kararın gerçekten yararlanılan ilgili kısmını yaz. Kararın ilk satırlarını otomatik alma; somut soruyla bağlantılı gerekçe/değerlendirme bölümünü seç.
6. Her karar için `relevance` alanında somut olayla bağını açıkla. Somut olayla hiç bağ kuramıyorsan o kararı decisions listesine alma.
7. Karar atıflarında dosya adıyla değil, daire ve E./K. bilgisiyle yaz. Alıntı yapacaksan her satır > ile başlasın.
8. İlk derece veya BAM anlatımını Yargıtay'ın nihai gerekçesi gibi sunma, karşı oyları baz alma zira önemli değil. Keza davalı vekili dilekçesinde gibi alıntılar da yapma o da önemli değil. Yargıtay'ın nihai değerlendirmesi önemli. Kararın bozma/onama/direnme sonucunu ve nihai hukuki kabulünü gözet.
9. Dosyada açıkça bulunmayan tarih, beyan, delil veya vakıa uydurma.
10. Eğer MAKALE kaynakları varsa uygun yerde öğretide ...'nın ... makalesinde belirtildiği üzere gibi kullan. Makale dosya adını kullanıcıya kaynak adı gibi gösterme; yazar/makale adıyla ifade et tespit edilemiyorsa öğretide şeklinde ifade et. Örnek kullanım: Öğretide, Fikret Eren, ''Borçlar Hukukunda Sorunlar'' adlı makalesinde, eksik borç kavramını şu şekilde açıklamıştır:...  gibi.
11. Çıktı SADECE JSON olmalıdır. Markdown kod bloğu KULLANMA. JSON içindeki `answer` alanında Markdown biçimlendirme kullan: ana başlıklar `### **Başlık**`, alt başlıklar `#### **Alt Başlık**`, önemli kavramlar `**kalın**` olsun.
</kurallar>

JSON ŞEMASI:
{{
  "answer": "Uzun hukuki analiz metni. Dosya kullanıldıysa dosyadan tespit edilen vakıalar ve stratejiyi ayrı başlıklarla yaz.",
  "statutes": [
    {{"name":"Kanun", "article":"m...", "note":"Not", "content":""}}
  ],
  "decisions": [
    {{"source_id":"Kararın source_id değeri", "court":"Yargıtay...", "code":"... E. ... K.", "used_part":"Karardan kullanılan kısım", "relevance":"Bu kararın sorulan dosya/vakıa ile bağı nedir? (AÇIKLAMA ZORUNLUDUR)"}}
  ]
}}

<gecmis>
{history_text or "Konuşma geçmişi yok."}
</gecmis>

<dosya_baglami>
{workspace_context_text or "Kayıtlı dosya veya not yok."}
</dosya_baglami>

<kararlar_ve_makaleler>
{context_text or "Karar veya makale bulunamadı."}
</kararlar_ve_makaleler>

<kullanici_sorusu>
{user_query}
</kullanici_sorusu>
""".strip()


def build_stream_answer_prompt(user_query, context_text, history_text="", workspace_context_text="", workspace_mode="general_analysis", mode_overrides=None, deep_thinking=False):
    mode_instruction = get_workspace_mode_instruction(workspace_mode, mode_overrides)
    behavior = get_mode_behavior(workspace_mode, mode_overrides)
    answer_length_instruction = (
        "Bu yanıt DERİN ANALİZ modunda üretilecek. Gerektiğinde daha ayrıntılı değerlendir; dosya vakıalarını, riskleri, karşı argümanları ve karar bağlantılarını açıkla."
        if deep_thinking
        else "Bu yanıt HIZLI MODDA üretilecek. Cevabı kısa, yoğun ve uygulanabilir tut. En fazla 4 ana başlık kullan; her başlık altında 1-3 kısa paragraf yaz. Ancak hukuki gerekçeyi, sonucu ve varsa Yargıtay karar bağlantısını eksik bırakma."
    )
    decision_block_rule = (
        "11. Ana analiz bittikten sonra kullanıcıya gösterilmeyecek şekilde, en sonda MUTLAKA aşağıdaki özel blokla karar kartı JSON'u üret:\n\n"
        "[DECISION_CARDS_JSON]\n"
        '{"decisions":[{"source_id":"<kararlar_ve_makaleler bölümündeki KARAR source_id değeri aynen>","court":"Yargıtay ...","code":"... E. ... K.","used_part":"Karardan yararlanılan ilgili gerekçe/değerlendirme bölümü","relevance":"Bu kararın somut olayla bağlantısı"}]}\n'
        "[/DECISION_CARDS_JSON]\n\n"
        "12. Karar kartı JSON'unda sadece <kararlar_ve_makaleler> bölümünde bulunan kararları kullan. source_id değerini uydurma; aynen kopyala. Somut olayla ilgisi zayıf olan kararı JSON'a alma.\n"
        "13. JSON karar kartlarında `used_part` alanı boş kalmasın."
        if behavior["want_decision_cards"] else
        "14. Bu çalışma modunda karar kartı JSON'u ÜRETME. Yalnızca görünür analiz metni yaz."
    )
    return f"""
Sen Türk hukuku alanında uzman, kıdemli bir avukat yardımcısısın.
Aşağıdaki çalışma modu ve kaynaklara göre kullanıcıya doğrudan, teknik ve uygulanabilir bir hukuki analiz yaz.

<calisma_modu>
{mode_instruction}
</calisma_modu>

<kurallar>
0. {answer_length_instruction}
1. Yargıtay kararı uydurma. Sadece <kararlar_ve_makaleler> bölümünde sağlanan kararlardan yararlan.
2. Çalışma alanındaki <dosya_baglami> parçaları dosya kapsamında yer alan bilgi ve belgelerdir. Bunlardan yararlan.
3. Dosyada açıkça bulunmayan tarih, beyan, delil veya vakıa uydurma.
4. Karar atıflarında dosya adıyla değil, daire ve E./K. bilgisiyle yaz.
5. Kullanıcıya gösterilecek ana analiz metninde JSON üretme. Markdown kod bloğu kullanma. Ancak görünür analiz metninde Markdown biçimlendirme kullan: ana başlıklar için `###`, alt başlıklar için `####`, önemli kavram ve sonuçlar için `**kalın**` kullan.
6. Başlıkları kısa tut. Her ana bölüm başlığını `### **Başlık**` formatında yaz. Gereksiz boş satır kullanma.
7. Uygun Yargıtay kararları varsa analiz içinde mutlaka kullan. Birincil kaynağın Yargıtay Kararlarıdır. Genel "Yargıtay kararlarında" deme; daire ve E./K. bilgisiyle somut atıf yap.
8. Karar seçerken şu önceliği uygula: önce kullanıcının sorusuna uygunluğu, somut olayla benzerliği, sonra dava/suç türü, sonra ispat-delil-kast-kusur-illiyet benzerliği, en son genel hukuki ilke.
9. Karardan doğrudan yararlanılan kısmı kısa ve anlamlı alıntı/parafrazla göster. Kararın ilk derece veya BAM anlatımını Yargıtay'ın nihai gerekçesi gibi sunma.
10. Kararlardan doğrudan, amaca uygun alıntı yapmaya çalış; "...'ya dikkat çekmiştir" gibi değil, "husumet itirazının reddine karar vermiştir" gibi net cümleler kur. MAKALE kaynakları varsa "Doktrinde ...'nın ... adlı makalesinde" gibi atıf yap; dosya adını kaynak gibi gösterme.
{decision_block_rule}
</kurallar>

<gecmis>
{history_text or "Konuşma geçmişi yok."}
</gecmis>

<dosya_baglami>
{workspace_context_text or "Kayıtlı dosya veya not yok."}
</dosya_baglami>

<kararlar_ve_makaleler>
{context_text or "Karar veya makale bulunamadı."}
</kararlar_ve_makaleler>

<kullanici_sorusu>
{user_query}
</kullanici_sorusu>
""".strip()


# --- WORKSPACE CONTEXT FORMATLAMA ---
def _normalize_body_list(value):
    return value if isinstance(value, list) else []


def _format_workspace_file_context(workspace_context):
    rows = []
    for idx, item in enumerate(_normalize_body_list(workspace_context), start=1):
        if not isinstance(item, dict):
            continue
        content_type = str(item.get("contentType") or item.get("content_type") or "file_chunk").strip()
        file_name = str(item.get("fileName") or item.get("file_name") or item.get("name") or "Dosya").strip()
        file_type = str(item.get("fileType") or item.get("file_type") or "Dosya").strip()
        if content_type == "file_profile":
            document_type = str(item.get("documentType") or item.get("document_type") or "").strip()
            document_class = str(item.get("documentClass") or item.get("document_class") or "").strip()
            ai_summary = str(item.get("aiSummary") or item.get("shortSummary") or "").strip()
            detailed_summary = str(item.get("detailedSummary") or "").strip()
            search_summary = str(item.get("searchSummary") or "").strip()
            legal_keywords = item.get("legalKeywords") if isinstance(item.get("legalKeywords"), list) else []
            detected_statutes = item.get("detectedStatutes") if isinstance(item.get("detectedStatutes"), list) else []
            key_facts = item.get("keyFacts") if isinstance(item.get("keyFacts"), list) else []
            key_dates = item.get("keyDates") if isinstance(item.get("keyDates"), list) else []
            parties = item.get("parties") if isinstance(item.get("parties"), list) else []
            evidence_list = item.get("evidenceList") if isinstance(item.get("evidenceList"), list) else []
            risks = item.get("risks") if isinstance(item.get("risks"), list) else []
            defense_issues = item.get("defenseIssues") if isinstance(item.get("defenseIssues"), list) else []
            fields = item.get("fields") if isinstance(item.get("fields"), list) else []
            user_perspective = item.get("userPerspective") if isinstance(item.get("userPerspective"), dict) else item.get("user_perspective") if isinstance(item.get("user_perspective"), dict) else {}
            profile_parts = [f"{idx}. DOSYA PROFİLİ", f"Kaynak: {file_name} ({file_type})"]
            if document_type:
                profile_parts.append(f"Belge türü: {document_type}")
            if document_class == DOCTYPE_FORM:
                profile_parts.append(
                    "Belge sınıfı: RESMİ FORM/İDARİ BELGE. Bu belge etiket-değer yapısındadır; "
                    "boş alanlar bir vakıa veya hukuki sonuç olarak yorumlanmamalıdır."
                )
            if user_perspective.get("isPartyRepresentative") or user_perspective.get("is_party_representative"):
                represented_party = str(user_perspective.get("representedParty") or user_perspective.get("represented_party") or "").strip()
                strategy_focus = str(user_perspective.get("strategyFocus") or user_perspective.get("strategy_focus") or "").strip()
                profile_parts.append(
                    "Kullanıcı perspektifi: Kullanıcı bu dosyada taraf vekilidir."
                    + (f" Temsil edilen taraf: {represented_party}." if represented_party else " Temsil edilen taraf açıkça belirtilmemiştir.")
                    + (f" Strateji odağı: {strategy_focus[:1000]}" if strategy_focus else "")
                )
            if ai_summary: profile_parts.append(f"Kısa özet: {ai_summary[:1200]}")
            if detailed_summary: profile_parts.append(f"Detaylı özet: {detailed_summary[:2500]}")
            if search_summary: profile_parts.append(f"Arama özeti: {search_summary[:2500]}")
            if fields: profile_parts.append("Belge alanları (etiket: değer):\n- " + "\n- ".join([str(x) for x in fields[:40]]))
            if legal_keywords: profile_parts.append("Hukuki anahtar kelimeler: " + ", ".join([str(x) for x in legal_keywords[:30]]))
            if detected_statutes: profile_parts.append("Tespit edilen mevzuat: " + ", ".join([str(x) for x in detected_statutes[:30]]))
            if parties: profile_parts.append("Taraflar/kişiler: " + ", ".join([str(x) for x in parties[:20]]))
            if key_facts: profile_parts.append("Temel vakıalar:\n- " + "\n- ".join([str(x) for x in key_facts[:12]]))
            if key_dates: profile_parts.append("Önemli tarihler:\n- " + "\n- ".join([str(x) for x in key_dates[:12]]))
            if evidence_list: profile_parts.append("Deliller:\n- " + "\n- ".join([str(x) for x in evidence_list[:15]]))
            if risks: profile_parts.append("Riskler:\n- " + "\n- ".join([str(x) for x in risks[:12]]))
            if defense_issues: profile_parts.append("Savunma/strateji notları:\n- " + "\n- ".join([str(x) for x in defense_issues[:12]]))
            rows.append("\n".join(profile_parts))
            continue
        content = str(item.get("content") or item.get("text") or "").strip()
        if not content:
            continue
        chunk_index = item.get("chunkIndex") if item.get("chunkIndex") is not None else item.get("chunk_index")
        score = item.get("score")
        meta = f"{idx}. DOSYA PARÇASI\nKaynak: {file_name} ({file_type})"
        if chunk_index is not None: meta += f", parça: {chunk_index}"
        if score is not None: meta += f", skor: {score}"
        rows.append(f"{meta}\n{content[:2500]}")
    return "\n\n".join(rows)


def _format_notes(notes):
    rows = []
    for idx, item in enumerate(_normalize_body_list(notes), start=1):
        if isinstance(item, dict):
            title = str(item.get("title") or item.get("type") or "Not").strip()
            content = str(item.get("content") or item.get("text") or item.get("note") or "").strip()
        else:
            title = "Not"; content = str(item or "").strip()
        if content:
            rows.append(f"{idx}. {title}: {content[:1500]}")
    return "\n".join(rows)


def build_workspace_context(existing_decisions=None, existing_statutes=None, notes=None, workspace_context=None):
    parts = []
    file_text = _format_workspace_file_context(workspace_context)
    if file_text:
        parts.append("YÜKLENEN DOSYALARDAN:\n" + file_text)
    notes_text = _format_notes(notes)
    if notes_text:
        parts.append("NOTLAR:\n" + notes_text)
    return "\n\n---\n\n".join(parts)


def _get_db_connection():
    if not HAS_PSYCOPG2:
        return None

    db_name = os.getenv("DB_NAME")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST", "127.0.0.1")
    db_port = os.getenv("DB_PORT", "5432")

    if not db_name or not db_user or not db_password:
        return None

    return psycopg2.connect(
        dbname=db_name,
        user=db_user,
        password=db_password,
        host=db_host,
        port=db_port,
        connect_timeout=5,
    )


def _candidate_decision_file_names_from_row(row):
    props = row.get("properties", {}) if isinstance(row, dict) else {}
    candidates = []

    for field in ("orijinal_karar_id", "dosya_adi", "ilgili_karar_dosyasi", "dosya", "slug"):
        value = str(props.get(field) or "").strip()
        if not value:
            continue
        base = value.replace(".txt", "")
        candidates.append(base)
        candidates.append(base + ".txt")

    group_key = str(row.get("_decision_group_key") or _decision_group_key(row) or "").strip()
    if group_key:
        base = group_key.replace(".txt", "")
        candidates.append(base)
        candidates.append(base + ".txt")

    out = []
    seen = set()
    for item in candidates:
        clean = str(item or "").strip()
        if not clean or clean in seen:
            continue
        seen.add(clean)
        out.append(clean)
    return out


def _fetch_decision_metadata_for_rows(karar_rows, limit=None):
    """
    Karar künyelerini (code = esas/karar no, type = daire/mahkeme) PostgreSQL
    Karar tablosundan çeker. Weaviate parçalarındaki dosya adı timestamp gibi
    künyesiz olsa bile, doğru künye DB'den gelir.

    Dönüş: { group_key: {"code": "...", "type": "..."} }
    """
    limit = MAX_KARAR_CONTEXT if limit is None else int(limit)
    if not karar_rows or limit <= 0:
        return {}

    selected_rows = []
    selected_group_keys = []
    seen_groups = set()

    for row in karar_rows:
        group_key = row.get("_decision_group_key") or _decision_group_key(row)
        if not group_key or group_key in seen_groups:
            continue
        seen_groups.add(group_key)
        selected_rows.append(row)
        selected_group_keys.append(group_key)
        if len(selected_rows) >= limit:
            break

    if not selected_rows:
        return {}

    all_file_names = []
    group_to_candidates = {}
    for group_key, row in zip(selected_group_keys, selected_rows):
        candidates = _candidate_decision_file_names_from_row(row)
        group_to_candidates[group_key] = candidates
        all_file_names.extend(candidates)

    all_file_names = list(dict.fromkeys([x for x in all_file_names if x]))
    if not all_file_names:
        return {}

    conn = None
    try:
        conn = _get_db_connection()
        if conn is None:
            logger.warning("Karar künyesi çekilemedi: psycopg2 veya DB env eksik.")
            return {}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "fileName", "code", "type" FROM "Karar" WHERE "fileName" = ANY(%s)',
                (all_file_names,),
            )
            rows = cur.fetchall() or []

        by_file_name = {
            str(r.get("fileName") or "").strip(): {
                "code": str(r.get("code") or "").strip(),
                "type": str(r.get("type") or "").strip(),
            }
            for r in rows
        }

        metadata = {}
        for group_key, candidates in group_to_candidates.items():
            for candidate in candidates:
                meta = by_file_name.get(candidate)
                if meta and (meta.get("code") or meta.get("type")):
                    metadata[group_key] = meta
                    break

        logger.info(
            "Karar künyesi eklendi | istenen=%s | bulunan=%s",
            len(group_to_candidates),
            len(metadata),
        )
        return metadata

    except Exception as exc:
        logger.warning("Karar künyesi çekme başarısız, dosya adı tahminine düşülüyor: %s", exc)
        return {}
    finally:
        if conn is not None:
            try:
                conn.close()
            except Exception:
                pass


def _fetch_full_decision_texts_for_rows(karar_rows, limit=None):

    """
    Daha Uzun Düşün açıkken ilk birkaç kararın tam metnini PostgreSQL Karar tablosundan çeker.
    Tam metin bulunamazsa sessizce chunk bağlamıyla devam eder.
    """
    limit = MAX_FULL_DECISION_CONTEXT if limit is None else int(limit)
    if not karar_rows or limit <= 0:
        return {}

    selected_rows = []
    selected_group_keys = []
    seen_groups = set()

    for row in karar_rows:
        group_key = row.get("_decision_group_key") or _decision_group_key(row)
        if not group_key or group_key in seen_groups:
            continue
        seen_groups.add(group_key)
        selected_rows.append(row)
        selected_group_keys.append(group_key)
        if len(selected_rows) >= limit:
            break

    if not selected_rows:
        return {}

    all_file_names = []
    group_to_candidates = {}
    for group_key, row in zip(selected_group_keys, selected_rows):
        candidates = _candidate_decision_file_names_from_row(row)
        group_to_candidates[group_key] = candidates
        all_file_names.extend(candidates)

    all_file_names = list(dict.fromkeys([x for x in all_file_names if x]))
    if not all_file_names:
        return {}

    conn = None
    try:
        conn = _get_db_connection()
        if conn is None:
            logger.warning("Tam karar metni çekilemedi: psycopg2 veya DB env eksik.")
            return {}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "fileName", "content" FROM "Karar" WHERE "fileName" = ANY(%s)',
                (all_file_names,),
            )
            rows = cur.fetchall() or []

        by_file_name = {
            str(r.get("fileName") or "").strip(): str(r.get("content") or "")
            for r in rows
        }
        full_texts = {}

        for group_key, candidates in group_to_candidates.items():
            for candidate in candidates:
                content = by_file_name.get(candidate)
                if content:
                    full_texts[group_key] = content[:MAX_FULL_DECISION_CHARS]
                    break

        logger.info(
            "Tam karar metni eklendi | istenen=%s | bulunan=%s | max_chars=%s",
            len(group_to_candidates),
            len(full_texts),
            MAX_FULL_DECISION_CHARS,
        )
        return full_texts

    except Exception as exc:
        logger.warning("Tam karar metni çekme başarısız, chunk bağlamıyla devam ediliyor: %s", exc)
        return {}
    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass
def _fetch_decision_ai_summaries_from_db(karar_rows, limit=40):
    """
    Arama sonucundaki kararların AI özetlerini PostgreSQL Karar.aiSummary kolonundan çeker.
    Weaviate içindeki ai_ozet parçalarına güvenmez; fileName eşleşmesini kullanır.
    """
    if not karar_rows or limit <= 0:
        return {}

    selected_rows = []
    selected_group_keys = []
    seen_groups = set()

    for row in karar_rows:
        group_key = row.get("_decision_group_key") or _decision_group_key(row)
        if not group_key or group_key in seen_groups:
            continue

        seen_groups.add(group_key)
        selected_rows.append(row)
        selected_group_keys.append(group_key)

        if len(selected_rows) >= limit:
            break

    if not selected_rows:
        return {}

    all_file_names = []
    group_to_candidates = {}

    for group_key, row in zip(selected_group_keys, selected_rows):
        candidates = _candidate_decision_file_names_from_row(row)
        group_to_candidates[group_key] = candidates
        all_file_names.extend(candidates)

    all_file_names = list(dict.fromkeys([x for x in all_file_names if x]))

    if not all_file_names:
        return {}

    conn = None

    try:
        conn = _get_db_connection()

        if conn is None:
            logger.warning("AI karar özetleri çekilemedi: psycopg2 veya DB env eksik.")
            return {}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                'SELECT "fileName", "aiSummary", "keywords" FROM "Karar" WHERE "fileName" = ANY(%s)',
                (all_file_names,),
            )
            rows = cur.fetchall() or []

        by_file_name = {
            str(row.get("fileName") or "").strip(): {
                "aiSummary": str(row.get("aiSummary") or "").strip(),
                "keywords": str(row.get("keywords") or "").strip(),
            }
            for row in rows
        }

        summaries = {}

        for group_key, candidates in group_to_candidates.items():
            for candidate in candidates:
                found = by_file_name.get(candidate)
                if not found:
                    continue

                ai_summary = found.get("aiSummary") or ""
                keywords = found.get("keywords") or ""

                parts = []
                if ai_summary:
                    parts.append(ai_summary)
                if keywords:
                    parts.append("Anahtar Kelimeler: " + keywords)

                if parts:
                    summaries[group_key] = "\n".join(parts).strip()
                    break

        logger.info(
            "PostgreSQL AI karar özeti eşleşmesi | istenen=%s | bulunan=%s",
            len(group_to_candidates),
            len(summaries),
        )

        return summaries

    except Exception as exc:
        logger.warning("PostgreSQL AI karar özeti çekme başarısız: %s", exc)
        return {}

    finally:
        try:
            if conn is not None:
                conn.close()
        except Exception:
            pass

def build_decision_context(karar_rows, makale_rows, include_full_text=False):
    context_parts = []
    full_decision_texts = _fetch_full_decision_texts_for_rows(karar_rows) if include_full_text else {}
    decision_metadata = _fetch_decision_metadata_for_rows(karar_rows)

    for row in karar_rows[:MAX_KARAR_CONTEXT]:
        props = row.get("properties", {})
        source_id = row.get("_decision_group_key") or _decision_group_key(row) or str(props.get("dosya_adi") or "")
        court = _deduce_court_from_props(props)
        code = _deduce_code_from_props(props)

        # PostgreSQL'den gelen künye (code/type) varsa, dosya adı tahminini ezer.
        db_meta = decision_metadata.get(source_id) or {}
        if db_meta.get("code"):
            code = db_meta["code"]
        if db_meta.get("type"):
            court = db_meta["type"]

        # UI tarafında özet/tag göstermiyoruz; bağlamda da "Karar Özeti" satırını dahil etmiyoruz.
        block = (
            f"KARAR source_id: {source_id}\n"
            f"Daire/Mahkeme: {court}\n"
            f"Esas/Karar: {code}\n"
            f"Gerekçe Parçası:\n{props.get('metin_parcasi', '')}"
        )

        full_text = full_decision_texts.get(source_id)
        if full_text:
            block += (
                "\n\n[TAM KARAR METNİ - Daha Uzun Düşün modu nedeniyle eklenmiştir]\n"
                f"{full_text}\n"
                "[/TAM KARAR METNİ]"
            )

        context_parts.append(block)

    for row in makale_rows[:MAX_MAKALE_CONTEXT]:
        props = row.get("properties", {})
        context_parts.append(f"MAKALE (Dosya: {props.get('dosya_adi')}):\n{props.get('metin_parcasi', '')}")
    return "\n\n---\n\n".join(context_parts)[:MAX_CONTEXT_CHARS]


# ============================================================
# 7. ANA ANALİZ MOTORU (NON-STREAM)
# ============================================================

def analyze_workspace_query(user_query, force_case_search=False, history=None, existing_decisions=None,
                            existing_statutes=None, notes=None, workspace_context=None,
                            workspace_mode="general_analysis", mode_overrides=None, deep_thinking=False):
    if not hukuk_koleksiyonu or not embedding_modeli:
        raise RuntimeError("Servis hazır değil.")

    history = history if isinstance(history, list) else []
    behavior = get_mode_behavior(workspace_mode, mode_overrides)
    should_search_cases = _should_search_for_mode(workspace_mode, force_case_search, history, user_query, mode_overrides)

    history_text_for_condense = _format_history_text(history, max_chars=MAX_HISTORY_CHARS)
    workspace_context_text = build_workspace_context(existing_decisions, existing_statutes, notes, workspace_context)

    karar_rows, makale_rows = [], []
    effective_query = user_query
    queries_used = []

    if should_search_cases:
        query_pack = condense_query_multi(user_query, history_text_for_condense, workspace_context_text)
        effective_query = query_pack.get("narrow") or query_pack.get("broad") or user_query
        project_id = os.getenv("GCP_PROJECT_ID")
        location = os.getenv("GCP_LOCATION", "global")

        karar_rows, makale_rows, queries_used = _parallel_search_decisions_and_makale(
            hukuk_koleksiyonu, embedding_modeli, query_pack, project_id, location,
            rerank_top_n=behavior["rerank_top_n"] or None,
            broad_query=query_pack.get("broad") or effective_query,
        )

    context_text = build_decision_context(karar_rows, makale_rows, include_full_text=deep_thinking)

    context_source_ids = _build_context_source_id_set(karar_rows)

    prompt = build_prompt(user_query, context_text, history_text_for_condense, workspace_context_text, workspace_mode, mode_overrides, deep_thinking=deep_thinking)

    parsed = {}; raw_answer_text = ""
    if gemini_modeli or answer_fast_model or fast_model:
        if deep_thinking:
            primary_model = gemini_modeli or answer_fast_model or fast_model
            if primary_model is gemini_modeli:
                primary_config = getattr(app, "_main_generation_config", None)
            elif primary_model is answer_fast_model:
                primary_config = getattr(app, "_answer_fast_generation_config", None)
            else:
                primary_config = getattr(app, "_fast_generation_config", None)

            fallback_model = (answer_fast_model or fast_model) if primary_model is gemini_modeli else None
            if fallback_model is answer_fast_model:
                fallback_config = getattr(app, "_answer_fast_generation_config", None)
            elif fallback_model is fast_model:
                fallback_config = getattr(app, "_fast_generation_config", None)
            else:
                fallback_config = None
            model_label = "Derin analiz"
        else:
            primary_model = answer_fast_model or gemini_modeli or fast_model
            if primary_model is answer_fast_model:
                primary_config = getattr(app, "_answer_fast_generation_config", None)
            elif primary_model is gemini_modeli:
                primary_config = getattr(app, "_main_generation_config", None)
            else:
                primary_config = getattr(app, "_fast_generation_config", None)

            fallback_model = gemini_modeli if primary_model is answer_fast_model else None
            fallback_config = getattr(app, "_main_generation_config", None) if fallback_model is gemini_modeli else None
            model_label = "Hızlı analiz"

        logger.info(
            "Workspace non-stream model seçimi | deep_thinking=%s | model=%s",
            deep_thinking,
            getattr(primary_model, "model_name", "unknown"),
        )

        resp = generate_content_with_fallback(
            prompt,
            primary_model=primary_model,
            primary_config=primary_config,
            fallback_model=fallback_model,
            fallback_config=fallback_config,
            label=model_label,
        )
        raw_answer_text = (resp.text or "").strip()
        parsed = _extract_first_json(raw_answer_text) or {}

    answer = str(parsed.get("answer") or parsed.get("sonuc_ve_degerlendirme") or raw_answer_text or "Analiz üretilemedi.").strip()

    ai_decisions, seen_decisions = [], set()
    if behavior["want_decision_cards"]:
        for item in (parsed.get("decisions") or []):
            if not isinstance(item, dict): continue
            court, code = str(item.get("court") or "").strip(), str(item.get("code") or "").strip()
            key = f"{court}::{code}"
            if key in seen_decisions: continue
            seen_decisions.add(key)
            ai_decisions.append({
                "id": str(item.get("source_id") or key).strip(),
                "source_id": str(item.get("source_id") or "").strip(),
                "slug": str(item.get("source_id") or item.get("slug") or "").strip(),
                "kararId": "", "court": court, "code": code,
                "used_part": str(item.get("used_part") or "").strip(),
                "relevance": str(item.get("relevance") or "").strip(), "source": "AI",
            })

    validated_decisions, hallucinated = _validate_decision_citations(ai_decisions, context_source_ids, answer)
    if hallucinated:
        answer = _add_hallucination_warning_to_answer(answer, hallucinated)

    return {
        "answer": answer, "decisions": validated_decisions, "statutes": _normalize_statutes(parsed),
        "effective_query": effective_query, "did_case_search": should_search_cases,
        "raw": {
            "workspace_mode": str(workspace_mode or "general_analysis"),
            "deep_thinking": deep_thinking,
            "model_used": getattr(primary_model, "model_name", "unknown") if "primary_model" in locals() else "unknown",
            "queries_used": queries_used,
            "used_decision_count": len(validated_decisions),
            "searched_decision_count": len(karar_rows),
            "context_decision_count": min(len(karar_rows), MAX_KARAR_CONTEXT),
            "hallucinated_citations_removed": len(hallucinated),
        },
    }


# ============================================================
# [FIX-7] Çoklu dosya karşılaştırması yardımcıları
# ============================================================

def _extract_file_summaries_from_context(workspace_context):
    summaries = []
    for item in _normalize_body_list(workspace_context):
        if not isinstance(item, dict):
            continue
        content_type = str(item.get("contentType") or item.get("content_type") or "").strip()
        file_name = str(item.get("fileName") or item.get("file_name") or item.get("name") or "Dosya").strip()

        if content_type == "file_profile":
            profile = {
                "fileName": file_name,
                "documentType": str(item.get("documentType") or item.get("document_type") or "").strip(),
                "shortSummary": str(item.get("aiSummary") or item.get("shortSummary") or "").strip(),
                "detailedSummary": str(item.get("detailedSummary") or "").strip(),
                "keyFacts": item.get("keyFacts") if isinstance(item.get("keyFacts"), list) else [],
                "keyDates": item.get("keyDates") if isinstance(item.get("keyDates"), list) else [],
                "parties": item.get("parties") if isinstance(item.get("parties"), list) else [],
                "evidenceList": item.get("evidenceList") if isinstance(item.get("evidenceList"), list) else [],
                "risks": item.get("risks") if isinstance(item.get("risks"), list) else [],
                "claimsOrAccusations": item.get("claimsOrAccusations") if isinstance(item.get("claimsOrAccusations"), list) else [],
            }
            summaries.append(profile)
    return summaries


def _build_cross_file_comparison_prompt(file_summaries, user_query=""):
    if len(file_summaries) < 2:
        return None

    files_text = []
    for idx, profile in enumerate(file_summaries, 1):
        parts = [f"### DOSYA {idx}: {profile['fileName']}"]
        if profile.get("documentType"):
            parts.append(f"Tür: {profile['documentType']}")
        if profile.get("shortSummary"):
            parts.append(f"Özet: {profile['shortSummary'][:800]}")
        if profile.get("detailedSummary"):
            parts.append(f"Detay: {profile['detailedSummary'][:1500]}")
        if profile.get("keyFacts"):
            parts.append("Temel vakıalar:\n- " + "\n- ".join([str(x) for x in profile["keyFacts"][:10]]))
        if profile.get("keyDates"):
            parts.append("Tarihler:\n- " + "\n- ".join([str(x) for x in profile["keyDates"][:10]]))
        if profile.get("parties"):
            parts.append("Taraflar: " + ", ".join([str(x) for x in profile["parties"][:10]]))
        if profile.get("evidenceList"):
            parts.append("Deliller:\n- " + "\n- ".join([str(x) for x in profile["evidenceList"][:10]]))
        if profile.get("claimsOrAccusations"):
            parts.append("İddialar:\n- " + "\n- ".join([str(x) for x in profile["claimsOrAccusations"][:10]]))
        files_text.append("\n".join(parts))

    all_files = "\n\n---\n\n".join(files_text)

    user_instruction = ""
    if user_query:
        user_instruction = f"\n\nKullanıcının ek sorusu: {user_query}"

    return f"""
Sen Türk hukuku alanında uzman, kıdemli bir hukuk bürosunda çalışan avukat yardımcısısın.
Görevin: Aşağıdaki {len(file_summaries)} dosyayı karşılaştırarak çelişki ve tutarsızlıkları tespit etmek.

KURALLAR:
1. Her çelişki için hangi dosyanın ne dediğini açıkça belirt.
2. Çelişki bulamadığın alanlarda "çelişki tespit edilmedi" de.
3. Çıktı SADECE JSON olmalı.
4. Dosyalarda bulunmayan bilgi uydurma.

ANALİZ BAŞLIKLARI:
1. TARİH ÇELİŞKİLERİ
2. MİKTAR/RAKAM ÇELİŞKİLERİ
3. BEYAN ÇELİŞKİLERİ
4. DELİL TUTARSIZLIKLARI
5. VAKIA FARKLILIKLARI vs.vs olaya göre sen yap.

JSON ŞEMASI:
{{
  "contradictions": [
    {{
      "type": "tarih|miktar|beyan|delil|vakıa",
      "severity": "yüksek|orta|düşük",
      "file_a": "Dosya adı",
      "file_a_says": "Bu dosya ne diyor",
      "file_b": "Dosya adı",
      "file_b_says": "Bu dosya ne diyor",
      "legal_significance": "Bu çelişkinin hukuki önemi"
    }}
  ],
  "summary": "Genel karşılaştırma özeti",
  "recommendations": ["Öneri 1", "Öneri 2"]
}}

DOSYALAR:
{all_files}
{user_instruction}
""".strip()
# ============================================================
# 8. DOSYA PROFİLİ ÜRETİMİ
# ============================================================

def _compact_file_text_for_profile(text, max_chars=FILE_PROFILE_MAX_CHARS):
    clean = _remove_ocr_noise_for_profile(text)
    if len(clean) <= max_chars:
        return clean
    head_size = int(max_chars * 0.45); middle_size = int(max_chars * 0.25)
    tail_size = max_chars - head_size - middle_size
    middle_start = max(0, (len(clean) // 2) - (middle_size // 2))
    return (clean[:head_size] + "\n\n--- METİN ORTASINDAN SEÇİLMİŞ BÖLÜM ---\n\n"
            + clean[middle_start:middle_start + middle_size] + "\n\n--- METİN SONUNDAN SEÇİLMİŞ BÖLÜM ---\n\n"
            + clean[-tail_size:])


def _looks_like_raw_form_or_fragment(value):
    """
    [DÜZELTİLDİ] Daha az agresif. Önceki sürüm geçerli içeriği de eliyordu
    (eksik çıkarım sorununun ana nedeniydi). Artık yalnızca açıkça anlamsız,
    çok kısa veya saf sembol/etiket parçalarını eler.
    """
    text = str(value or "").strip()
    if not text:
        return True
    lower = text.lower()
    alpha_count = len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]", text))
    word_count = len(re.findall(r"[A-Za-zÇĞİÖŞÜçğıöşü]{2,}", text))

    # Çok az harf/kelime → parça
    if alpha_count < 8 or word_count < 3:
        return True
    # Doldurulmamış form alanı
    if re.search(r"_{3,}", text):
        return True
    # Saf madde imi / sembol / sayı satırı
    if re.match(r"^[•\-–—*\d.)\s/]+$", text):
        return True
    # OCR/teknik gürültü satırları
    noise_tokens = ["e - imzalıdır", "uyap", "barkod", "qr kod", "evrak doğrulama"]
    if any(token in lower for token in noise_tokens):
        return True
    # Çok kısa ve cümle gibi durmayan parçacık (eşik düşürüldü: 85 -> 45,
    # ve yalnızca gerçekten çok kısaysa ele)
    if len(text) < 30 and not re.search(r"[.!?:;]$", text) and word_count < 4:
        return True
    return False


def _unique_clean_items(items, limit=20):
    out = []
    seen = set()
    for item in items or []:
        text = _clean_profile_text_value(item)
        if not text:
            continue
        if _profile_text_looks_ocr_noisy(text) or _looks_like_raw_form_or_fragment(text):
            continue
        key = text.lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(text)
        if len(out) >= limit:
            break
    return out


def _sentences_matching(text, keywords, limit=10, min_len=70):
    clean = _clean_extracted_text(text)
    sentences = re.split(r"(?<=[.!?])\s+|\n+", clean)
    rows = []
    lowered_keywords = [str(k).lower() for k in keywords or []]
    for sentence in sentences:
        s = re.sub(r"\s+", " ", str(sentence or "")).strip()
        if len(s) < min_len:
            continue
        if _looks_like_raw_form_or_fragment(s):
            continue
        low = s.lower()
        if any(k in low for k in lowered_keywords):
            rows.append(s)
    return _unique_clean_items(rows, limit=limit)


def _derive_key_facts_from_text(text, fallback_sentences=None):
    keywords = [
        "ihale", "yaklaşık maliyet", "pazarlık usul", "açık ihale", "eksik", "sözleşme",
        "kamu zararı", "grafolojik", "el yaz", "kusur", "teklif", "muayene", "kabul",
    ]
    facts = _sentences_matching(text, keywords, limit=12)
    if facts:
        return facts
    return _unique_clean_items(fallback_sentences or [], limit=8)


def _derive_key_dates_from_text(text):
    clean = _clean_extracted_text(text)
    rows = []
    date_pattern = r"\b\d{1,2}[./]\d{1,2}[./]\d{2,4}\b|\b\d{1,2}\s+[A-Za-zÇĞİÖŞÜçğıöşü]+\s+\d{4}\b"
    for line in clean.splitlines():
        if re.search(date_pattern, line):
            rows.append(line.strip())
    return _unique_clean_items(rows, limit=12)


def _derive_parties_from_text(text):
    clean = _clean_extracted_text(text)
    rows = []
    label_patterns = [
        r"Müşteki/?Mağdur[_\s:.-]+([^\n]+)",
        r"Müşteki[_\s:.-]+([^\n]+)",
        r"Mağdur[_\s:.-]+([^\n]+)",
        r"Şüpheliler[_\s:.-]+([^\n]+(?:\n\s+[^\n]+){0,3})",
        r"Sanık(?:lar)?[_\s:.-]+([^\n]+)",
        r"Davacı[_\s:.-]+([^\n]+)",
        r"Davalı[_\s:.-]+([^\n]+)",
    ]
    for pattern in label_patterns:
        for m in re.finditer(pattern, clean, flags=re.IGNORECASE):
            value = re.sub(r"\s+", " ", m.group(1)).strip(" :_-–—")
            if value:
                rows.append(value)
    return _unique_clean_items(rows, limit=20)


def _derive_statutes_from_text(text):
    clean = _clean_extracted_text(text)
    rows = []
    law_patterns = [
        r"\b\d{3,5}\s+sayılı\s+[A-Za-zÇĞİÖŞÜçğıöşü\s]+Kanun(?:u)?(?:\s*md\.?\s*\d+[A-Za-z/]*)?",
        r"\b(?:TCK|CMK|HMK|TBK|TTK|TMK|İİK|IİK)\s*(?:m\.?|md\.?|madde)?\s*\d+[A-Za-z/\-]*",
        r"\b(?:Kamu İhale Kanunu|Mal Alımları Uygulama Yönetmeliği|Kamu Mali Yönetimi ve Kontrol Kanunu)\b(?:\s*md\.?\s*\d+[A-Za-z/]*)?",
    ]
    for pattern in law_patterns:
        for m in re.finditer(pattern, clean, flags=re.IGNORECASE):
            rows.append(m.group(0))
    return _unique_clean_items(rows, limit=20)


def _derive_claims_from_text(text):
    keywords = [
        "soruşturma konusu", "iddia", "isnat", "suçlama", "usulsüzlük", "hile", "ihaleye fesat",
        "edimin ifasına fesat", "kamu zararı", "rekabet", "fiyat üzerinde anlaşma", "benzer el yaz",
    ]
    return _sentences_matching(text, keywords, limit=12)


def _derive_evidence_from_text(text):
    clean = _clean_extracted_text(text)
    evidence_keywords = [
        "teklif mekt", "birim fiyat", "cetvel", "geçici teminat", "imza", "tutanak", "fatura",
        "ödeme emri", "banka dekont", "hakediş", "sözleşme", "ihale onay", "idari şartname",
        "teknik şartname", "bilirkişi", "grafolojik", "tanık", "ifade", "muayene", "kabul",
    ]
    rows = _sentences_matching(clean, evidence_keywords, limit=15)
    if rows:
        return rows
    list_rows = []
    for line in clean.splitlines():
        low = line.lower()
        if any(k in low for k in evidence_keywords) and len(line.strip()) > 20:
            list_rows.append(line.strip())
    return _unique_clean_items(list_rows, limit=15)


def _derive_risks_from_text(text, document_type=""):
    clean = _clean_extracted_text(text)
    lower = clean.lower()
    risks = []
    if "21/f" in lower or "pazarlık" in lower:
        risks.append("İhalenin 21/f pazarlık usulüyle yapılması ve bu usulün koşullarının bulunup bulunmadığı temel risk alanıdır.")
    if "açık ihale" in lower and ("aykırı" in lower or "temel usul" in lower):
        risks.append("Açık ihale usulünün temel usul olduğu, buna rağmen istisnai usule gidildiği yönündeki tespit idare ve komisyon bakımından risk doğurur.")
    if "eksik" in lower and ("ihale dosy" in lower or "belge" in lower or "sözleşme" in lower):
        risks.append("İhale dosyasında zorunlu belge, idari şartname, ihale bilgi formu veya sözleşme belgelerinin eksikliği usuli sorumluluk riski doğurur.")
    if "benzer el yaz" in lower or "aynı el" in lower or "grafolojik" in lower:
        risks.append("Teklif belgelerinde benzer el yazısı/grafolojik emare tespiti, katılımcılar arasında koordinasyon veya danışıklı hareket iddiası bakımından risklidir.")
    if "kamu zararı" in lower:
        risks.append("Kamu zararı iddiası dosyanın merkezindedir; zarar hesabının hangi belgelerle kesinleştirildiği ayrıca denetlenmelidir.")
    if "kusur oran" in lower:
        risks.append("Bilirkişi raporunda kusur oranı verilmiş olması, kişisel sorumluluk tartışmasında aleyhe kullanılabilir; ancak kusurun kast ve iştirakle ilişkisi ayrıca sorgulanmalıdır.")
    risks.extend(_sentences_matching(clean, ["risk", "aykırı", "ihlal", "zarar", "kusur", "hile", "rekabet"], limit=8))
    return _unique_clean_items(risks, limit=12)


def _derive_defense_issues_from_text(text, document_type="", is_party_representative=False, represented_party=""):
    clean = _clean_extracted_text(text)
    lower = clean.lower()
    issues = []
    if "kesin kamu zararı" in lower or "belgeye bağlı" in lower or "sözleşme/ödeme/fatura" in lower:
        issues.append("Kamu zararının kesinleşmediği, sözleşme, ödeme, fatura ve ödeme emri gibi belgelerle doğrulanması gerektiği vurgulanmalıdır.")
    if "alt sınır" in lower and "kesin kamu zararı" in lower:
        issues.append("Rapordaki parasal farkın kesin kamu zararı değil, alt sınır/risk göstergesi olarak nitelendirildiği savunmada kullanılabilir.")
    if "grafolojik" in lower and "imza aidiyeti" in lower:
        issues.append("Grafolojik değerlendirmenin imza aidiyeti tespiti olmadığı, yalnızca yazı ve rakam benzerliğine ilişkin teknik emare sunduğu belirtilmelidir.")
    if "aynı el ihtimali" in lower or "teknik emare" in lower:
        issues.append("El yazısı benzerliğinin tek başına kast, iştirak veya hileli anlaşmayı kesin olarak ispatlamadığı tartışılmalıdır.")
    if "kusur oran" in lower:
        issues.append("Kusur oranlarının her şüpheli bakımından somut görev, yetki, kast ve fiili katkı ile ayrı ayrı gerekçelendirilip gerekçelendirilmediği denetlenmelidir.")
    if "ödeme" in lower and "kesinleştirilir" in lower:
        issues.append("Fiili ödeme ve ödeme belgeleri bulunmadan kamu kaynağında azalma unsurunun kesinleşmediği ileri sürülebilir.")
    if "talimat" in lower:
        issues.append("İşlemlerin üst amir talimatıyla yürütüldüğü iddiası varsa, alt görevlilerin karar alma yetkisi ve kastı ayrıca ayrıştırılmalıdır.")
    issues.extend(_sentences_matching(clean, ["kesin", "belgeye bağlı", "imza", "kast", "iştirak", "kusur", "ödeme", "grafolojik"], limit=8))
    return _unique_clean_items(issues, limit=12)


def _build_strategy_focus(defense_issues, risks, represented_party=""):
    parts = []
    represented = str(represented_party or "").strip()
    if represented:
        parts.append(f"Temsil edilen taraf bakımından öncelik: {represented} aleyhine kurulan somut kast, iştirak, kusur ve zarar bağlantısını ayrıştırmak.")
    for item in (defense_issues or [])[:4]:
        parts.append(item)
    for item in (risks or [])[:2]:
        parts.append("Risk: " + item)
    text = " ".join(parts).strip()
    return text[:1200]


def _fallback_file_profile(file_name, file_type, text, is_party_representative=False, represented_party=""):
    """
    [DÜZELTİLDİ] Belge sınıfına göre davranış değişir:
    - FORM (tapu/imar/megsis vb.): heuristic risk/iddia/savunma çıkarımı YAPILMAZ.
      Sadece etiket-değer ham özeti üretilir, boş alanlar göz ardı edilir.
    - DAVA/DİĞER: önceki davranış (heuristic çıkarım) korunur.
    """
    clean = str(text or "")
    clean = clean.replace("\r\n", "\n")
    clean = re.sub(r"[ \t]+", " ", clean)
    clean = re.sub(r"\n{3,}", "\n\n", clean).strip()

    if not clean:
        return {
            "documentType": "diğer", "documentClass": DOCTYPE_DIGER,
            "shortSummary": "Dosyadan okunabilir metin çıkarılamadı.",
            "detailedSummary": "Bu dosya sisteme yüklenmiş olsa da içeriğinden analiz edilebilir metin çıkarılamadı. Dosya taranmış/görsel PDF olabilir veya metin katmanı bulunmayabilir.",
            "parties": [], "legalKeywords": [], "detectedStatutes": [], "keyFacts": [], "keyDates": [],
            "claimsOrAccusations": [], "evidenceList": [], "fields": [],
            "risks": ["Dosyadan okunabilir metin çıkarılamadığı için AI dosya analizi sınırlıdır."],
            "defenseIssues": [], "searchSummary": "Dosyadan okunabilir metin çıkarılamadı.",
            "userPerspective": {"isPartyRepresentative": bool(is_party_representative), "representedParty": str(represented_party or "").strip()},
        }

    # --- Belge sınıfı tespiti ---
    document_class = detect_document_class(clean, file_name)

    # ============================================================
    # FORM / RESMİ BELGE: heuristic çıkarım YOK, sadece ham özet
    # ============================================================
    if document_class == DOCTYPE_FORM:
        short_summary, detailed_summary, filled_pairs, empty_labels, note = _summarize_form_document(
            clean, file_name, file_type
        )
        # Form türünü daha spesifik adlandır
        lower_name = str(file_name or "").lower()
        lower_text = clean[:5000].lower()
        if "imar" in lower_text or "imar" in lower_name:
            document_type = "imar durumu belgesi"
        elif "tapu" in lower_text or "parsel" in lower_text or "parsel" in lower_name or "ada" in lower_name:
            document_type = "tapu/parsel bilgi belgesi"
        elif "megsis" in lower_text:
            document_type = "MEGSİS belgesi"
        elif "ruhsat" in lower_text:
            document_type = "ruhsat belgesi"
        else:
            document_type = "resmi form/idari belge"

        fields = [f"{label}: {value}" for label, value in filled_pairs]
        detected_statutes = _derive_statutes_from_text(clean)  # mevzuat atfı varsa tespit zararsız
        # detailedSummary'ye boş-alan notunu ekle
        if note:
            detailed_summary = (detailed_summary + "\n\n" + note).strip()

        return {
            "documentType": document_type,
            "documentClass": DOCTYPE_FORM,
            "shortSummary": short_summary,
            "detailedSummary": detailed_summary,
            "parties": [],
            "legalKeywords": [],
            "detectedStatutes": detected_statutes[:15],
            "keyFacts": [],          # FORM belgesinde vakıa çıkarımı yapılmaz
            "keyDates": _derive_key_dates_from_text(clean)[:12],
            "claimsOrAccusations": [],   # iddia çıkarımı yapılmaz
            "evidenceList": [],          # delil çıkarımı yapılmaz
            "fields": fields[:40],       # etiket-değer çiftleri
            "risks": [],                 # risk çıkarımı YAPILMAZ
            "defenseIssues": [],         # savunma çıkarımı YAPILMAZ
            "searchSummary": short_summary,
            "userPerspective": {
                "isPartyRepresentative": bool(is_party_representative),
                "representedParty": str(represented_party or "").strip(),
                "strategyFocus": "",
            },
        }

    # ============================================================
    # DAVA / DİĞER: önceki heuristic davranış
    # ============================================================
    lower_name = str(file_name or "").lower(); lower_text = clean[:7000].lower()
    if "iddianame" in lower_name or "iddianame" in lower_text: document_type = "iddianame"
    elif "dilekçe" in lower_name or "dilekce" in lower_name or "dilekçe" in lower_text or "dilekce" in lower_text: document_type = "dilekçe"
    elif "bilirkişi" in lower_text or "bilirkisi" in lower_text: document_type = "bilirkişi raporu"
    elif "sözleşme" in lower_text or "sozlesme" in lower_text: document_type = "sözleşme"
    elif "mahkemesi" in lower_text and "karar" in lower_text: document_type = "mahkeme kararı"
    elif "tutanak" in lower_text: document_type = "tutanak"
    elif "ihtar" in lower_text: document_type = "ihtarname"
    else: document_type = "diğer"
    sentences = re.split(r"(?<=[.!?])\s+|\n+", clean)
    sentences = [s.strip() for s in sentences if len(s.strip()) > 40]
    first_sentences = sentences[:10]
    short_summary = " ".join(first_sentences[:3]).strip() or clean[:700].strip()
    if len(short_summary) > 900: short_summary = short_summary[:900].rsplit(" ", 1)[0].strip() + "..."
    detailed_summary = "\n".join(first_sentences[:10]).strip() or clean[:2500].strip()
    if len(detailed_summary) > 3000: detailed_summary = detailed_summary[:3000].rsplit(" ", 1)[0].strip() + "..."
    legal_terms = [
        "ihaleye fesat", "edimin ifasına fesat", "kamu zararı", "ihale komisyonu", "muayene ve kabul",
        "hakediş", "bilirkişi", "tanık", "müşteki", "mağdur", "sanık", "şüpheli", "iddianame", "savunma", "kast",
        "iştirak", "illiyet", "kusur", "kusur oranı", "delil", "rapor", "tutanak", "belediye", "ihale",
        "yaklaşık maliyet", "pazarlık usulü", "açık ihale", "sözleşme", "kabul tutanağı", "grafolojik inceleme",
        "el yazısı", "fiyat teklifi", "birim fiyat cetveli", "ödeme emri", "fatura", "arama",
        "el koyma", "hts", "kamera", "ifade", "hukuka aykırı delil", "dilekçe", "alacak", "tazminat",
        "tahliye", "muris muvazaası", "ziynet", "boşanma",
    ]
    legal_keywords = [term for term in legal_terms if term in lower_text]
    key_facts = _derive_key_facts_from_text(clean, fallback_sentences=first_sentences)
    key_dates = _derive_key_dates_from_text(clean)
    parties = _derive_parties_from_text(clean)
    detected_statutes = _derive_statutes_from_text(clean)
    claims_or_accusations = _derive_claims_from_text(clean)
    evidence_list = _derive_evidence_from_text(clean)
    risks = _derive_risks_from_text(clean, document_type=document_type)
    defense_issues = _derive_defense_issues_from_text(
        clean, document_type=document_type,
        is_party_representative=is_party_representative,
        represented_party=represented_party,
    )
    strategy_focus = _build_strategy_focus(defense_issues, risks, represented_party)
    search_summary_parts = []
    search_summary_parts.extend(legal_keywords[:14])
    search_summary_parts.extend(detected_statutes[:10])
    search_summary_parts.extend(claims_or_accusations[:6])
    search_summary_parts.extend(defense_issues[:8])
    search_summary_parts.append(short_summary)
    search_summary = " ".join([p for p in search_summary_parts if p]).strip()
    if len(search_summary) > 3000: search_summary = search_summary[:3000].rsplit(" ", 1)[0].strip()
    return {
        "documentType": document_type, "documentClass": document_class,
        "shortSummary": short_summary, "detailedSummary": detailed_summary,
        "parties": parties, "legalKeywords": legal_keywords[:25], "detectedStatutes": detected_statutes[:20], "keyFacts": key_facts[:12],
        "keyDates": key_dates[:12], "claimsOrAccusations": claims_or_accusations[:12], "evidenceList": evidence_list[:15],
        "fields": [],
        "risks": risks[:12], "defenseIssues": defense_issues[:12],
        "searchSummary": search_summary or short_summary,
        "userPerspective": {
            "isPartyRepresentative": bool(is_party_representative),
            "representedParty": str(represented_party or "").strip(),
            "strategyFocus": strategy_focus,
        },
    }


def build_file_profile_prompt(file_name, file_type, text, is_party_representative=False, represented_party="", document_class=DOCTYPE_DIGER):
    """
    [DÜZELTİLDİ] document_class'a göre iki ayrı talimat seti:
    - FORM: sadece düz özet + alanlar; risk/iddia/savunma ÜRETME.
    - DAVA/DİĞER: tam hukuki profil.
    """
    compact_text = _compact_file_text_for_profile(text)
    represented_party_text = str(represented_party or "").strip()
    if is_party_representative and represented_party_text:
        perspective_text = f"Kullanıcı bu dosyada taraf vekilidir. Temsil edilen taraf: {represented_party_text}. Analizi özellikle bu tarafın menfaatleri, iddiaları, riskleri ve stratejisi bakımından üret."
    elif is_party_representative:
        perspective_text = "Kullanıcı bu dosyada taraf vekilidir; ancak temsil edilen taraf açıkça belirtilmemiştir. Taraf stratejisi üretirken tarafın belirsiz olduğunu belirt ve kesin varsayım yapma."
    else:
        perspective_text = "Kullanıcının bu dosyada taraf vekili olup olmadığı belirtilmemiştir. Analizi tarafsız dosya özeti olarak üret; belirli bir taraf lehine strateji varsayma."

    # ============================================================
    # FORM / RESMİ BELGE talimatı
    # ============================================================
    if document_class == DOCTYPE_FORM:
        return f"""
Sen Türk hukuku alanında çalışan bir avukat yardımcısısın.
Sana verilen belge bir DAVA dosyası DEĞİL; bir RESMİ FORM / İDARİ BİLGİ BELGESİDİR
(örneğin tapu kaydı, imar durumu belgesi, MEGSİS çıktısı, parsel sorgu belgesi, ruhsat vb.).
Bu tür belgelerde bilgiler "Etiket: Değer" biçiminde alanlar halindedir.

ÇOK ÖNEMLİ KURALLAR:
1. Bu belge için hukuki RİSK, İDDİA, SAVUNMA, DELİL veya VAKIA ÇIKARIMI YAPMA. Bu alanları BOŞ liste bırak.
2. Boş/doldurulmamış alanları (değeri olmayan etiketleri) ASLA bir bilgi, vakıa veya sonuç gibi yorumlama.
   Örnek: "Plan İptal Açıklama:" alanının karşısı boşsa, planın iptal edildiği SONUCUNU ÇIKARMA. Bu alanı tamamen GÖRMEZDEN GEL.
3. Sadece DOLU olan alanları özetle. Belgeyi olduğu gibi, yorum katmadan, sade biçimde aktar.
4. Belgede yazmayan hiçbir bilgiyi uydurma. Tahmin yürütme.
5. Çıktı yalnızca geçerli JSON olsun. Markdown kullanma.
6. `fields` alanına yalnızca DEĞERİ DOLU olan "Etiket: Değer" çiftlerini yaz.

JSON şeması:
{{
  "documentType": "imar durumu belgesi | tapu/parsel bilgi belgesi | MEGSİS belgesi | ruhsat belgesi | resmi form/idari belge",
  "shortSummary": "Belgenin 2-4 cümlelik tarafsız, yorumsuz özeti (ne belgesi, hangi kurum, hangi taşınmaz/konu hakkında).",
  "detailedSummary": "Belgedeki dolu alanların düzenli, yorumsuz dökümü.",
  "fields": ["Etiket: Değer", "Etiket: Değer"],
  "parties": [],
  "legalKeywords": [],
  "detectedStatutes": ["Belgede AÇIKÇA atıf yapılan kanun/yönetmelik varsa"],
  "keyFacts": [],
  "keyDates": ["Tarih - belgedeki açıklama (yalnızca belgede açıkça yazan tarihler)"],
  "claimsOrAccusations": [],
  "evidenceList": [],
  "risks": [],
  "defenseIssues": [],
  "searchSummary": "Belgenin kısa, tarafsız özeti."
}}

DOSYA ADI: {file_name}
DOSYA TÜRÜ: {file_type}

DOSYA METNİ:
{compact_text}
""".strip()

    # ============================================================
    # DAVA / DİĞER talimatı (orijinal, tam profil)
    # ============================================================
    return f"""
Sen Türk hukuku alanında çalışan kıdemli bir büroda bir avukat yardımcısısın. Avukatın çok yoğun ve senden gelen bilgilere güvenmek zorunda.
Görevin, yüklenen bir dosyanın hukuki dosya profilini çıkarmaktır.
Bu dosya iddianame, bilirkişi raporu, dilekçe, SGK'dan gelen cevap gibi pek çok belge olabilir. Mahiyetine uygun düştüğü ölçüde değerlendir.

Kurallar:
1. Dosyada bulunmayan olay, tarih, taraf, delil, kanun maddesi veya iddia uydurma.
2. Emin olmadığın bilgileri kesin gibi yazma; gerekiyorsa "belirsiz" veya "dosyadan açıkça anlaşılamıyor" de.
3. Çıktı sadece geçerli JSON olsun. Markdown kod bloğu kullanma. JSON string değerlerinin içinde çift tırnak kullanman gerekiyorsa mutlaka kaçır veya onun yerine tek tırnak kullan.
4. OCR ile okunmuş belgelerde bozuk karakter, mühür, imza, kaşe, sayfa numarası, QR/UYAP doğrulama satırı ve anlamsız kısa satırları dikkate alma.
5. `detailedSummary` alanında DOSYA METNİ'ni aynen kopyalama. Belgeyi temiz, kronolojik ve hukuki olay örgüsüne göre yeniden yaz.
6. `legalKeywords` alanına sadece hukuki kavramları yaz. Taraf adı, mahkeme adı, dosya adı, rastgele OCR parçası veya bozuk karakter yazma.
7. `keyFacts`, `claimsOrAccusations`, `evidenceList`, `risks` ve `defenseIssues` alanlarında ham OCR satırı değil, temizlenmiş anlamlı hukuki tespitler yaz.
8. Kullanıcı taraf vekiliyse `risks`, `defenseIssues`, `claimsOrAccusations` ve `searchSummary` alanlarını temsil edilen tarafın bakış açısından önceliklendir. Ancak dosyada bulunmayan vakıa veya savunma uydurma.
9. Belge metninde yeterli veri varsa `keyFacts`, `claimsOrAccusations`, `evidenceList`, `risks` ve `defenseIssues` alanlarını BOŞ BIRAKMA. Her birine en az 4, mümkünse 6-10 somut madde yaz.
10. Belge bilirkişi raporu ise özellikle şu başlıkları çıkar: rapordaki aleyhe tespitler, rapordaki savunmaya elverişli açıklar, kesinleşmemiş zarar hesabı, eksik belgeler, kusur oranlarının dayanağı, grafolojik/teknik incelemenin sınırları. vb...
11. `defenseIssues` alanı sadece genel tavsiye değil, doğrudan savunmada kullanılabilecek itiraz/strateji notları içermelidir.
12. `risks` alanı dosyanın müvekkil aleyhine kullanılabilecek noktalarını açık yazmalıdır.

JSON şeması:
{{
  "documentType": "iddianame | dilekçe | sözleşme | bilirkişi raporu | mahkeme kararı | tutanak | ihtarname | cevap dilekçesi vb.",
  "shortSummary": "Dosyanın 3-5 cümlelik kısa hukuki özeti",
  "detailedSummary": "Dosyanın daha ayrıntılı, ancak yine kısa; düzenli ve hukuki değerlendirmeye uygun özeti",
  "parties": ["Taraf/kişi/kurum adı ve dosyadaki rolü (sanık, davalı vb.)"],
  "legalKeywords": ["Olayın özüne ilişkin hukuki anahtar kelimeler"],
  "detectedStatutes": ["Tespit edilen kanun maddesi veya kanun adı"],
  "keyFacts": ["Dosyadan tespit edilen temel vakıa"],
  "keyDates": ["Tarih - olay açıklaması"],
  "claimsOrAccusations": ["Talep, iddia, isnat veya suçlama"],
  "evidenceList": ["Dosyanın delil durumu. Örneğin dosya bilirkişi raporu ise, taşınmaz üzerinde fiili el atma var. Keşif ile sabittir gibi."],
  "risks": ["Dosyadan görülen müvekkil açısından hukuki/usuli risk"],
  "defenseIssues": ["Savunma/itiraz/strateji bakımından dikkat çeken nokta"],
  "searchSummary": "Müvekkilin durumuyla ilgili Yargıtay kararı araması yapmak için yoğun kısa-öz arama metni.",
  "userPerspective": {{"isPartyRepresentative": true, "representedParty": "Temsil edilen taraf", "strategyFocus": "Bu taraf bakımından öne çıkan risk ve strateji odağı"}}
}}

DOSYA ADI: {file_name}
DOSYA TÜRÜ: {file_type}
KULLANICI/TARAF PERSPEKTİFİ: {perspective_text}

DOSYA METNİ:
{compact_text}
""".strip()


def _ensure_list(value):
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item or "").strip()]
    if isinstance(value, str) and value.strip():
        return [value.strip()]
    return []


def _clean_profile_list(items, limit=25):
    cleaned = []
    for item in items or []:
        text = _clean_profile_text_value(item)
        if not text:
            continue
        if _profile_text_looks_ocr_noisy(text):
            continue
        if _looks_like_raw_form_or_fragment(text):
            continue
        cleaned.append(text)
    return _unique_clean_items(cleaned, limit=limit)


def normalize_file_profile(parsed, document_class=DOCTYPE_DIGER):
    data = parsed if isinstance(parsed, dict) else {}
    profile = {
        "documentType": str(data.get("documentType") or data.get("document_type") or "diğer").strip() or "diğer",
        "documentClass": str(data.get("documentClass") or data.get("document_class") or document_class).strip() or document_class,
        "shortSummary": _clean_profile_text_value(data.get("shortSummary") or data.get("short_summary") or data.get("aiSummary") or ""),
        "detailedSummary": _clean_profile_text_value(data.get("detailedSummary") or data.get("detailed_summary") or ""),
        "parties": _clean_profile_list(_ensure_list(data.get("parties")), limit=25),
        "legalKeywords": _clean_profile_list(_ensure_list(data.get("legalKeywords") or data.get("legal_keywords")), limit=25),
        "detectedStatutes": _clean_profile_list(_ensure_list(data.get("detectedStatutes") or data.get("detected_statutes")), limit=25),
        "keyFacts": _clean_profile_list(_ensure_list(data.get("keyFacts") or data.get("key_facts")), limit=25),
        "keyDates": _clean_profile_list(_ensure_list(data.get("keyDates") or data.get("key_dates")), limit=25),
        "claimsOrAccusations": _clean_profile_list(_ensure_list(data.get("claimsOrAccusations") or data.get("claims_or_accusations")), limit=25),
        "evidenceList": _clean_profile_list(_ensure_list(data.get("evidenceList") or data.get("evidence_list")), limit=25),
        "fields": _clean_profile_list(_ensure_list(data.get("fields")), limit=40),
        "risks": _clean_profile_list(_ensure_list(data.get("risks")), limit=25),
        "defenseIssues": _clean_profile_list(_ensure_list(data.get("defenseIssues") or data.get("defense_issues")), limit=25),
        "searchSummary": _clean_profile_text_value(data.get("searchSummary") or data.get("search_summary") or ""),
        "userPerspective": data.get("userPerspective") if isinstance(data.get("userPerspective"), dict) else data.get("user_perspective") if isinstance(data.get("user_perspective"), dict) else {},
    }

    # FORM belgesinde model yine de risk/iddia üretmişse temizle
    if profile["documentClass"] == DOCTYPE_FORM:
        profile["risks"] = []
        profile["defenseIssues"] = []
        profile["claimsOrAccusations"] = []
        profile["keyFacts"] = []
        profile["evidenceList"] = []
        profile["legalKeywords"] = []
        profile["parties"] = []

    if profile["detailedSummary"] and (
        _profile_text_looks_ocr_noisy(profile["detailedSummary"])
        or _looks_like_raw_form_or_fragment(profile["detailedSummary"])
    ):
        profile["detailedSummary"] = ""

    if not profile["shortSummary"] and profile["detailedSummary"]:
        profile["shortSummary"] = profile["detailedSummary"][:800]

    if not isinstance(profile.get("userPerspective"), dict):
        profile["userPerspective"] = {}
    else:
        profile["userPerspective"] = {
            "isPartyRepresentative": bool(profile["userPerspective"].get("isPartyRepresentative") or profile["userPerspective"].get("is_party_representative")),
            "representedParty": _clean_profile_text_value(profile["userPerspective"].get("representedParty") or profile["userPerspective"].get("represented_party") or ""),
            "strategyFocus": _clean_profile_text_value(profile["userPerspective"].get("strategyFocus") or profile["userPerspective"].get("strategy_focus") or ""),
        }

    if not profile["searchSummary"]:
        search_terms = []
        search_terms.extend(profile["legalKeywords"])
        search_terms.extend(profile["detectedStatutes"])
        search_terms.extend(profile["evidenceList"])
        search_terms.extend(profile["defenseIssues"])
        if not search_terms and profile["shortSummary"]:
            search_terms.append(profile["shortSummary"])
        profile["searchSummary"] = " ".join(search_terms)[:3000]

    return profile


def _extract_profile_fields_from_raw_text(raw_text):
    raw = str(raw_text or "").strip()
    if not raw:
        return {}
    raw = re.sub(r"^```(?:json)?", "", raw, flags=re.IGNORECASE).strip()
    raw = re.sub(r"```$", "", raw).strip()

    def pick_string(*keys):
        for key in keys:
            pattern = rf'"{re.escape(key)}"\s*:\s*"((?:\\.|[^"\\])*)"'
            m = re.search(pattern, raw, re.DOTALL)
            if m:
                value = m.group(1)
                try:
                    value = json.loads(f'"{value}"')
                except Exception:
                    value = value.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                value = re.sub(r"\s+", " ", str(value)).strip()
                if value and not _profile_text_looks_ocr_noisy(value) and not _looks_like_raw_form_or_fragment(value):
                    return value
        return ""

    def pick_list(*keys):
        for key in keys:
            pattern = rf'"{re.escape(key)}"\s*:\s*\[(.*?)\]'
            m = re.search(pattern, raw, re.DOTALL)
            if not m:
                continue
            body = m.group(1)
            values = re.findall(r'"((?:\\.|[^"\\])*)"', body, re.DOTALL)
            cleaned = []
            for value in values:
                try:
                    value = json.loads(f'"{value}"')
                except Exception:
                    value = value.replace('\\n', ' ').replace('\\"', '"').replace('\\\\', '\\')
                value = re.sub(r"\s+", " ", str(value)).strip()
                if not value:
                    continue
                if _profile_text_looks_ocr_noisy(value) or _looks_like_raw_form_or_fragment(value):
                    continue
                cleaned.append(value)
            cleaned = _unique_clean_items(cleaned, limit=40)
            if cleaned:
                return cleaned
        return []

    extracted = {
        "documentType": pick_string("documentType", "document_type") or "diğer",
        "shortSummary": pick_string("shortSummary", "short_summary", "aiSummary"),
        "detailedSummary": pick_string("detailedSummary", "detailed_summary"),
        "parties": pick_list("parties"),
        "legalKeywords": pick_list("legalKeywords", "legal_keywords"),
        "detectedStatutes": pick_list("detectedStatutes", "detected_statutes"),
        "keyFacts": pick_list("keyFacts", "key_facts"),
        "keyDates": pick_list("keyDates", "key_dates"),
        "claimsOrAccusations": pick_list("claimsOrAccusations", "claims_or_accusations"),
        "evidenceList": pick_list("evidenceList", "evidence_list"),
        "fields": pick_list("fields"),
        "risks": pick_list("risks"),
        "defenseIssues": pick_list("defenseIssues", "defense_issues"),
        "searchSummary": pick_string("searchSummary", "search_summary"),
    }

    if not extracted["shortSummary"] and extracted["detailedSummary"]:
        extracted["shortSummary"] = extracted["detailedSummary"][:800]

    if not extracted["searchSummary"]:
        search_parts = []
        search_parts.extend(extracted.get("legalKeywords") or [])
        search_parts.extend(extracted.get("detectedStatutes") or [])
        search_parts.extend(extracted.get("evidenceList") or [])
        search_parts.extend(extracted.get("defenseIssues") or [])
        search_parts.append(extracted.get("shortSummary") or "")
        extracted["searchSummary"] = " ".join([p for p in search_parts if p]).strip()[:3000]

    has_any = any([
        extracted.get("shortSummary"),
        extracted.get("detailedSummary"),
        extracted.get("searchSummary"),
        extracted.get("legalKeywords"),
        extracted.get("keyFacts"),
        extracted.get("evidenceList"),
        extracted.get("fields"),
        extracted.get("risks"),
        extracted.get("defenseIssues"),
    ])
    return extracted if has_any else {}


# ============================================================
# [FIX-5] Daha sağlam profil üretimi fallback zinciri
# ============================================================

def generate_file_profile(file_name, file_type, text, is_party_representative=False, represented_party=""):
    """
    [DÜZELTİLDİ + FIX-5] Belge sınıfını ÖNCE tespit eder, prompt'u ona göre kurar.
    FORM belgelerinde heuristic çıkarım kapalıdır.
    Üç katmanlı fallback: fast_model -> gemini_modeli -> heuristic.
    """
    # Belge sınıfını önceden tespit et (prompt ve fallback bunu kullanır)
    document_class = detect_document_class(text, file_name)

    fallback_profile = _fallback_file_profile(file_name, file_type, text, is_party_representative, represented_party)
    # fallback_profile zaten kendi içinde sınıfı tespit ediyor; tutarlılık için hizala
    fallback_profile["documentClass"] = fallback_profile.get("documentClass") or document_class

    def finalize_profile(profile):
        if not isinstance(profile, dict):
            profile = {}

        # Belge sınıfını koru
        profile["documentClass"] = profile.get("documentClass") or fallback_profile.get("documentClass") or document_class
        is_form = profile["documentClass"] == DOCTYPE_FORM

        for key, fallback_key in [
            ("shortSummary", "shortSummary"),
            ("detailedSummary", "detailedSummary"),
            ("searchSummary", "searchSummary"),
        ]:
            if not profile.get(key):
                profile[key] = fallback_profile.get(fallback_key, "")

        # Liste alanlarını birleştir — FORM belgesinde risk/iddia/savunma/vakıa MERGE EDİLMEZ
        list_keys = [
            "legalKeywords", "detectedStatutes", "parties", "keyFacts", "keyDates",
            "claimsOrAccusations", "evidenceList", "fields", "risks", "defenseIssues",
        ]
        form_suppressed = {"risks", "defenseIssues", "claimsOrAccusations", "keyFacts", "evidenceList", "legalKeywords", "parties"}
        for list_key in list_keys:
            if is_form and list_key in form_suppressed:
                profile[list_key] = []   # FORM belgesinde bu alanlar boş kalır
                continue
            current_items = profile.get(list_key) if isinstance(profile.get(list_key), list) else []
            fallback_items = fallback_profile.get(list_key) if isinstance(fallback_profile.get(list_key), list) else []
            merged_items = []
            merged_items.extend(current_items)
            merged_items.extend(fallback_items)
            profile[list_key] = _clean_profile_list(merged_items, limit=40 if list_key == "fields" else 25)

        if profile.get("detailedSummary") and (
            _profile_text_looks_ocr_noisy(profile.get("detailedSummary"))
            or _looks_like_raw_form_or_fragment(profile.get("detailedSummary"))
        ):
            profile["detailedSummary"] = fallback_profile.get("detailedSummary", "")

        if not profile.get("shortSummary") and profile.get("detailedSummary"):
            profile["shortSummary"] = str(profile.get("detailedSummary") or "")[:800]

        if not profile.get("documentType"):
            profile["documentType"] = fallback_profile.get("documentType", "diğer")

        current_perspective = profile.get("userPerspective") if isinstance(profile.get("userPerspective"), dict) else {}
        current_strategy_focus = _clean_profile_text_value(current_perspective.get("strategyFocus") or "")
        if not current_strategy_focus and not is_form:
            current_strategy_focus = _build_strategy_focus(
                profile.get("defenseIssues") or [],
                profile.get("risks") or [],
                represented_party,
            )

        profile["userPerspective"] = {
            "isPartyRepresentative": bool(is_party_representative),
            "representedParty": str(represented_party or "").strip(),
            "strategyFocus": current_strategy_focus,
        }

        if not profile.get("searchSummary"):
            search_parts = []
            search_parts.extend(profile.get("legalKeywords") or [])
            search_parts.extend(profile.get("detectedStatutes") or [])
            search_parts.extend(profile.get("claimsOrAccusations") or [])
            search_parts.extend(profile.get("defenseIssues") or [])
            if not search_parts and profile.get("shortSummary"):
                search_parts.append(profile.get("shortSummary"))
            profile["searchSummary"] = " ".join([p for p in search_parts if p]).strip()[:3000]

        logger.info(
            "Dosya profili hazırlandı | file=%s | class=%s | type=%s | facts=%s | evidence=%s | risks=%s | defense=%s | fields=%s",
            file_name,
            profile.get("documentClass"),
            profile.get("documentType"),
            len(profile.get("keyFacts") or []),
            len(profile.get("evidenceList") or []),
            len(profile.get("risks") or []),
            len(profile.get("defenseIssues") or []),
            len(profile.get("fields") or []),
        )
        return profile

    def _has_meaningful_profile(profile):
        return any([
            profile.get("shortSummary"),
            profile.get("detailedSummary"),
            profile.get("searchSummary"),
            profile.get("legalKeywords"),
            profile.get("keyFacts"),
            profile.get("evidenceList"),
            profile.get("fields"),
            profile.get("risks"),
            profile.get("defenseIssues"),
        ])

    def _is_rich_profile(profile):
        """
        Daha sıkı kalite ölçütü. Bir profilin gerçekten dolu sayılması için:
        - FORM belgesinde: özet + en az birkaç dolu alan (fields/keyDates) yeterli.
        - DAVA/DİĞER belgesinde: özet + (vakıa/delil/iddia/risk/savunma) içerikli
          en az iki kategori dolu olmalı. Aksi halde zayıf kabul edilir ve bir
          sonraki (daha güçlü) modele düşülür.
        """
        if not profile.get("shortSummary") and not profile.get("detailedSummary"):
            return False
        if document_class == DOCTYPE_FORM:
            return bool(profile.get("fields") or profile.get("keyDates") or profile.get("detailedSummary"))
        substantive = [
            profile.get("keyFacts"), profile.get("evidenceList"),
            profile.get("claimsOrAccusations"), profile.get("risks"),
            profile.get("defenseIssues"), profile.get("legalKeywords"),
        ]
        filled = sum(1 for x in substantive if x)
        return filled >= 2

    def _try_model(model, config, label, accept_weak=False):
        if model is None:
            return None
        try:
            prompt = build_file_profile_prompt(
                file_name, file_type, text, is_party_representative, represented_party,
                document_class=document_class,
            )
            resp = model.generate_content(prompt, generation_config=config)
            raw_text = (resp.text or "").strip()

            parsed = _extract_first_json(raw_text)
            if parsed:
                profile = normalize_file_profile(parsed, document_class=document_class)
                # Temiz JSON parse + zengin içerik → en güvenilir sonuç
                if _is_rich_profile(profile):
                    logger.info("%s: JSON parse başarılı, zengin profil (class=%s)", label, document_class)
                    return profile
                # JSON geldi ama içerik zayıf: son modelde kabul, aksi halde güçlü modele bırak
                if accept_weak and _has_meaningful_profile(profile):
                    logger.info("%s: JSON parse başarılı, zayıf profil kabul edildi (class=%s)", label, document_class)
                    return profile
                logger.info("%s: JSON parse oldu ama profil zayıf, sonraki katmana geçiliyor (class=%s)", label, document_class)

            extracted = _extract_profile_fields_from_raw_text(raw_text)
            if extracted:
                profile = normalize_file_profile(extracted, document_class=document_class)
                if _is_rich_profile(profile):
                    logger.info("%s: Regex kurtarma başarılı, zengin profil (class=%s)", label, document_class)
                    return profile
                if accept_weak and _has_meaningful_profile(profile):
                    logger.info("%s: Regex kurtarma, zayıf profil kabul edildi (class=%s)", label, document_class)
                    return profile
                logger.info("%s: Regex kurtarma zayıf kaldı, sonraki katmana geçiliyor (class=%s)", label, document_class)

            logger.warning("%s: Parse/kurtarma başarısız, raw=%s", label, raw_text[:300])
            return None

        except Exception as exc:
            logger.warning("%s profil üretimi başarısız: %s", label, exc)
            return None

    # [DÜZELTİLDİ] Profil için artık condense'e ayarlı fast_model KULLANILMAZ.
    # fast_model "arama sorgusu üret" talimatıyla yapılandırıldığından profil
    # promptunda boş/eksik JSON döndürüyordu. Bunun yerine profil-odaklı
    # profile_model birincil, ana gemini_modeli ikincil katmandır.
    profile = _try_model(
        profile_model,
        getattr(app, "_profile_generation_config", None),
        "profile_model"
    )
    if profile:
        return finalize_profile(profile)

    if gemini_modeli and gemini_modeli is not profile_model:
        profile = _try_model(
            gemini_modeli,
            getattr(app, "_main_generation_config", None),
            "gemini_modeli",
            accept_weak=True,
        )
        if profile:
            return finalize_profile(profile)

    logger.warning("Tüm model denemeleri başarısız, heuristic fallback kullanılıyor | file=%s | class=%s", file_name, document_class)
    return finalize_profile(fallback_profile)

# ============================================================
# 9. FLASK ROTALARI
# ============================================================

@app.route("/health", methods=["GET"])
def health():
    return json_response({
        "status": "ok",
        "initialized": bool(getattr(app, "_inited", False)),
        "has_pymupdf": HAS_PYMUPDF,
        "has_tesseract": HAS_TESSERACT,
        "has_discovery_engine": HAS_DISCOVERY_ENGINE,
    })


def _read_upload_file():
    """İstekten dosya baytlarını ve adını okur (multipart veya base64 JSON)."""
    file_name = ""
    file_type = ""
    file_bytes = b""

    if request.files:
        f = request.files.get("file") or next(iter(request.files.values()), None)
        if f is not None:
            file_name = f.filename or "dosya"
            file_bytes = f.read()
            file_type = f.mimetype or ""
            return file_bytes, file_name, file_type

    body = request.get_json(silent=True) or {}
    file_name = str(body.get("fileName") or body.get("file_name") or body.get("name") or "dosya").strip()
    file_type = str(body.get("fileType") or body.get("file_type") or "").strip()
    b64 = body.get("fileBase64") or body.get("file_base64") or body.get("content")
    if b64:
        import base64
        raw = str(b64)
        if "," in raw and raw.strip().startswith("data:"):
            raw = raw.split(",", 1)[1]
        try:
            file_bytes = base64.b64decode(raw)
        except Exception as exc:
            logger.warning("Base64 çözme hatası: %s", exc)
            file_bytes = b""
    return file_bytes, file_name, file_type


@app.route("/workspace-extract-text", methods=["POST"])
def workspace_extract_text():
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Init hatası: %s", exc)

    acquired = _gate.acquire(timeout=CONCURRENCY_ACQUIRE_TIMEOUT)
    if not acquired:
        return json_response({"error": USER_FACING_BUSY_MESSAGE}, status=503)
    try:
        file_bytes, file_name, file_type = _read_upload_file()
        if not file_bytes:
            return json_response({"error": "Dosya alınamadı veya boş."}, status=400)

        text, method = extract_file_text(file_bytes, file_name)
        document_class = detect_document_class(text, file_name)
        return json_response({
            "fileName": file_name,
            "fileType": file_type,
            "extractionMethod": method,
            "documentClass": document_class,
            "textLength": len(text or ""),
            "text": text or "",
        })
    except Exception as exc:
        logger.error("workspace-extract-text hatası", exc_info=exc)
        return json_response({"error": str(exc)}, status=500)
    finally:
        _gate.release()


@app.route("/workspace-file-profile", methods=["POST"])
def workspace_file_profile():
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Init hatası: %s", exc)

    acquired = _gate.acquire(timeout=CONCURRENCY_ACQUIRE_TIMEOUT)
    if not acquired:
        return json_response({"error": USER_FACING_BUSY_MESSAGE}, status=503)
    try:
        body = request.get_json(silent=True) or {}
        text = str(body.get("text") or "").strip()
        file_name = str(body.get("fileName") or body.get("file_name") or "dosya").strip()
        file_type = str(body.get("fileType") or body.get("file_type") or "").strip()
        is_party_representative = _to_bool(body.get("isPartyRepresentative") or body.get("is_party_representative"))
        represented_party = str(body.get("representedParty") or body.get("represented_party") or "").strip()

        # Metin gelmediyse ve dosya yüklenmişse, dosyadan çıkar
        if not text:
            file_bytes, fn2, ft2 = _read_upload_file()
            if file_bytes:
                text, _ = extract_file_text(file_bytes, fn2 or file_name)
                file_name = fn2 or file_name
                file_type = ft2 or file_type

        if not text:
            return json_response({"error": "Profil için metin bulunamadı."}, status=400)

        profile = generate_file_profile(
            file_name, file_type, text,
            is_party_representative=is_party_representative,
            represented_party=represented_party,
        )
        profile["fileName"] = file_name
        profile["fileType"] = file_type
        return json_response(profile)
    except Exception as exc:
        logger.error("workspace-file-profile hatası", exc_info=exc)
        return json_response({"error": str(exc)}, status=500)
    finally:
        _gate.release()


def _parse_analyze_body():
    body = request.get_json(silent=True) or {}
    return {
        "query": str(body.get("query") or body.get("question") or body.get("message") or "").strip(),
        "force_case_search": _to_bool(body.get("forceCaseSearch") or body.get("force_case_search")),
        "force_no_case_search": _to_bool(body.get("forceNoCaseSearch") or body.get("force_no_case_search")),
        "history": body.get("history") if isinstance(body.get("history"), list) else [],
        "existing_decisions": body.get("existingDecisions") or body.get("existing_decisions") or [],
        "existing_statutes": body.get("existingStatutes") or body.get("existing_statutes") or [],
        "notes": body.get("notes") or [],
        "workspace_context": body.get("workspaceContext") or body.get("workspace_context") or [],
        "workspace_mode": str(body.get("workspaceMode") or body.get("workspace_mode") or "general_analysis").strip(),
        "mode_overrides": body.get("modeOverrides") if isinstance(body.get("modeOverrides"), dict) else body.get("mode_overrides") if isinstance(body.get("mode_overrides"), dict) else None,
        "deep_thinking": _to_bool(body.get("deepThinking") or body.get("deep_thinking")),
    }


@app.route("/workspace-analyze", methods=["POST"])
def workspace_analyze():
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Init hatası: %s", exc)
        return json_response({"error": "Servis başlatılamadı: " + str(exc)}, status=500)

    acquired = _gate.acquire(timeout=CONCURRENCY_ACQUIRE_TIMEOUT)
    if not acquired:
        return json_response({"error": USER_FACING_BUSY_MESSAGE}, status=503)
    try:
        params = _parse_analyze_body()
        if not params["query"]:
            return json_response({"error": "Soru boş olamaz."}, status=400)

        result = analyze_workspace_query(
            user_query=params["query"],
            force_case_search=params["force_case_search"],
            history=params["history"],
            existing_decisions=params["existing_decisions"],
            existing_statutes=params["existing_statutes"],
            notes=params["notes"],
            workspace_context=params["workspace_context"],
            workspace_mode=params["workspace_mode"],
            mode_overrides=params["mode_overrides"],
            deep_thinking=params["deep_thinking"],
        )
        return json_response(result)
    except Exception as exc:
        logger.error("workspace-analyze hatası", exc_info=exc)
        return json_response({"error": str(exc)}, status=500)
    finally:
        _gate.release()


@app.route("/workspace-analyze-stream", methods=["POST"])
def workspace_analyze_stream():
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Init hatası: %s", exc)
        return json_response({"error": "Servis başlatılamadı: " + str(exc)}, status=500)

    params = _parse_analyze_body()
    if not params["query"]:
        return json_response({"error": "Soru boş olamaz."}, status=400)

    def generate():
        acquired = _gate.acquire(timeout=CONCURRENCY_ACQUIRE_TIMEOUT)
        if not acquired:
            yield sse_event("error", {"message": USER_FACING_BUSY_MESSAGE})
            return
        try:
            history = params["history"]
            workspace_mode = params["workspace_mode"]
            mode_overrides = params["mode_overrides"]
            deep_thinking = bool(params.get("deep_thinking"))
            behavior = get_mode_behavior(workspace_mode, mode_overrides)

            yield sse_event("status", {"stage": "baslatildi", "mode": workspace_mode})

            should_search = _should_search_for_mode(
                workspace_mode, params["force_case_search"], history, params["query"], mode_overrides,
                force_no_case_search=bool(params.get("force_no_case_search"))
            )

            history_text = _format_history_text(history, max_chars=MAX_HISTORY_CHARS)
            workspace_context_text = build_workspace_context(
                params["existing_decisions"], params["existing_statutes"],
                params["notes"], params["workspace_context"],
            )

            karar_rows, makale_rows, queries_used = [], [], []
            context_decision_cards = []
            if should_search:
                yield sse_event("status", {"stage": "sorgu_uretiliyor"})
                query_pack = condense_query_multi(params["query"], history_text, workspace_context_text)
                project_id = os.getenv("GCP_PROJECT_ID")
                location = os.getenv("GCP_LOCATION", "global")
                yield sse_event("status", {"stage": "arama_yapiliyor"})
                karar_rows, makale_rows, queries_used = _parallel_search_decisions_and_makale(
                    hukuk_koleksiyonu, embedding_modeli, query_pack, project_id, location,
                    rerank_top_n=behavior["rerank_top_n"] or None,
                    broad_query=query_pack.get("broad") or params["query"],
                )
                yield sse_event("status", {
                    "stage": "arama_tamamlandi",
                    "decision_count": len(karar_rows),
                    "makale_count": len(makale_rows),
                })
                decision_metadata = _fetch_decision_metadata_for_rows(karar_rows)
                for row in karar_rows[:MAX_KARAR_CONTEXT]:
                    card = _normalize_decision_card(row)
                    # PostgreSQL künyesi (code/type) varsa dosya adı tahminini ezer.
                    card_key = card.get("source_id") or card.get("id")
                    db_meta = decision_metadata.get(card_key) or {}
                    if db_meta.get("code"):
                        card["code"] = db_meta["code"]
                    if db_meta.get("type"):
                        card["court"] = db_meta["type"]
                    if not (card.get("court") or card.get("code") or card.get("source_id")):
                        continue
                    card["rank"] = len(context_decision_cards)
                    context_decision_cards.append(card)

                if context_decision_cards:
                    yield sse_event("context_decisions", {"decisions": context_decision_cards})

            context_text = build_decision_context(karar_rows, makale_rows, include_full_text=deep_thinking)
            context_source_ids = _build_context_source_id_set(karar_rows)
            prompt = build_stream_answer_prompt(
                params["query"], context_text, history_text,
                workspace_context_text, workspace_mode, mode_overrides,
                deep_thinking=deep_thinking,
            )

            yield sse_event("status", {"stage": "yanit_uretiliyor"})

            full_text = ""
            last_error = None
            for attempt in range(STREAM_MAX_RETRIES + 1):
                full_text = ""
                try:
                    if deep_thinking:
                        model = gemini_modeli or answer_fast_model or fast_model
                    else:
                        model = answer_fast_model or gemini_modeli or fast_model

                    if model is None:
                        raise RuntimeError("Model hazır değil.")

                    if model is gemini_modeli:
                        config = getattr(app, "_main_generation_config", None)
                    elif model is answer_fast_model:
                        config = getattr(app, "_answer_fast_generation_config", None)
                    else:
                        config = getattr(app, "_fast_generation_config", None)

                    logger.info(
                        "Workspace stream model seçimi | deep_thinking=%s | model=%s",
                        deep_thinking,
                        getattr(model, "model_name", "unknown"),
                    )
                    stream_filter_state = {"hidden": False, "pending": ""}
                    stream = model.generate_content(prompt, generation_config=config, stream=True)

                    for chunk in stream:
                        piece = getattr(chunk, "text", "") or ""
                        if not piece:
                            continue

                        full_text += piece
                        visible_piece = _filter_decision_cards_stream_piece(piece, stream_filter_state)
                        if visible_piece:
                            yield sse_event("token", {"text": visible_piece})

                    tail_piece = _flush_decision_cards_stream_filter(stream_filter_state)
                    if tail_piece:
                        yield sse_event("token", {"text": tail_piece})

                    last_error = None
                    break
                except Exception as exc:
                    last_error = exc
                    logger.warning("Stream denemesi %s başarısız: %s", attempt + 1, exc)
                    if attempt < STREAM_MAX_RETRIES:
                        time.sleep(STREAM_RETRY_DELAY_S)
                        yield sse_event("status", {"stage": "yeniden_deneniyor", "attempt": attempt + 1})
                        continue

            if last_error is not None and not full_text:
                yield sse_event("error", {"message": "Yanıt üretilemedi: " + str(last_error)})
                return

            # Görünür metni karar kartı bloğundan ayıkla
            visible_answer = full_text
            if "[DECISION_CARDS_JSON]" in visible_answer:
                visible_answer = visible_answer.split("[DECISION_CARDS_JSON]", 1)[0].strip()

            decisions = []
            if behavior["want_decision_cards"]:
                ai_cards = _extract_stream_decision_cards(full_text)
                validated, hallucinated = _validate_decision_citations(
                    ai_cards, context_source_ids, visible_answer
                )
                decisions = validated

                if hallucinated:
                    yield sse_event(
                        "warning",
                        {
                            "message": f"{len(hallucinated)} atıf bağlamda doğrulanamadığı için kaldırıldı.",
                            "removed": hallucinated,
                        },
                    )

            statutes = []
            raw = {
                "workspace_mode": workspace_mode,
                "deep_thinking": deep_thinking,
                "model_used": getattr(model, "model_name", "unknown") if "model" in locals() else "unknown",
                "queries_used": queries_used,
                "used_decision_count": len(decisions),
                "searched_decision_count": len(karar_rows),
                "context_decision_count": min(len(karar_rows), MAX_KARAR_CONTEXT),
            }

            yield sse_event("decisions", {"decisions": decisions})
            yield sse_event("statutes", {"statutes": statutes})
            yield sse_event(
                "done",
                {
                    "answer": visible_answer,
                    "decisions": decisions,
                    "context_decisions": context_decision_cards,
                    "statutes": statutes,
                    "did_case_search": should_search,
                    "effective_query": queries_used[0] if queries_used else params["query"],
                    "queries_used": queries_used,
                    "used_decision_count": len(decisions),
                    "searched_decision_count": len(karar_rows),
                    "raw": raw,
                },
            )
        except Exception as exc:
            logger.error("workspace-analyze-stream hatası", exc_info=exc)
            yield sse_event("error", {"message": str(exc)})
        finally:
            _gate.release()

    return Response(generate(), mimetype="text/event-stream",
                    headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"})


@app.route("/workspace-compare-files", methods=["POST"])
def workspace_compare_files():
    """Bu endpoint (çelişki/karşılaştırma modu) projeden kaldırıldı."""
    return json_response(
        {
            "error": "DISABLED",
            "message": "Bu özellik kaldırıldı (dosyalar arası çelişki/karşılaştırma modu devre dışı).",
        },
        status=410,
    )


@app.route("/workspace-modes", methods=["GET", "POST"])
def workspace_modes():
    if request.method == "GET":
        modes = {}
        for name, behavior in WORKSPACE_MODE_BEHAVIOR.items():
            modes[name] = {
                "description": behavior.get("description", ""),
                "force_search": behavior.get("force_search", False),
                "want_decision_cards": behavior.get("want_decision_cards", True),
                "rerank_top_n": behavior.get("rerank_top_n", RERANK_TOP_N),
                "customizable": behavior.get("customizable", False),
                "custom": behavior.get("custom", False),
            }
        return json_response({"modes": modes})

    # POST → özel mod kaydı
    try:
        body = request.get_json(silent=True) or {}
        mode_name = str(body.get("name") or body.get("mode") or "").strip()
        instruction = str(body.get("instruction") or "").strip()
        if not mode_name or not instruction:
            return json_response({"error": "Mod adı ve talimat zorunludur."}, status=400)

        behavior = register_custom_mode(
            mode_name=mode_name,
            instruction=instruction,
            force_search=_to_bool(body.get("forceSearch") or body.get("force_search")),
            want_decision_cards=_to_bool(body.get("wantDecisionCards") if body.get("wantDecisionCards") is not None else body.get("want_decision_cards") if body.get("want_decision_cards") is not None else True),
            rerank_top_n=body.get("rerankTopN") or body.get("rerank_top_n"),
            description=str(body.get("description") or "").strip(),
        )
        return json_response({"status": "ok", "mode": mode_name, "behavior": {
            "description": behavior.get("description", ""),
            "force_search": behavior.get("force_search", False),
            "want_decision_cards": behavior.get("want_decision_cards", True),
            "rerank_top_n": behavior.get("rerank_top_n", RERANK_TOP_N),
        }})
    except Exception as exc:
        logger.error("workspace-modes POST hatası", exc_info=exc)
        return json_response({"error": str(exc)}, status=500)


# ============================================================
# 10. UYGULAMA GİRİŞ NOKTASI
# ============================================================
if os.getenv("PRELOAD_ON_IMPORT", "true").lower() == "true":
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Import-time init başarısız: %s", exc)
if __name__ == "__main__":
    try:
        ensure_initialized()
    except Exception as exc:
        logger.error("Başlangıç init başarısız (rotalar yine de açılıyor): %s", exc)
    app.run(host="0.0.0.0", port=WORKSPACE_API_PORT, threaded=True)

