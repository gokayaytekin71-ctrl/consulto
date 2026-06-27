import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WORKSPACE_AI_API_BASE =
  process.env.WORKSPACE_AI_API_BASE ||
  process.env.NEXT_PUBLIC_WORKSPACE_AI_API_BASE ||
  'https://api.consultohukuk.com';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { selected_text, instruction, full_petition } = await req.json();

    if (!selected_text?.trim()) {
      return NextResponse.json({ error: 'Revize edilecek metin gereklidir.' }, { status: 400 });
    }

    const revisionNote = (instruction || '').trim() || 'Metni hukuki dil açısından iyileştir ve daha akıcı yap';

    const fullContext = full_petition?.trim()
      ? `\n\nDilekçenin Tamamı (bağlam için):\n${full_petition.trim()}`
      : '';

    const query = `Bir dilekçenin seçili bölümünü revize edeceksin.

Revizyon talimatı: ${revisionNote}

Kullanıcının değiştirilmesini istediği seçili kısım:
${selected_text.trim()}${fullContext}

KESİN TALİMAT: Yalnızca seçili kısmın revize edilmiş halini döndür. Tam dilekçeyi, başlık/açıklama veya "İşte revize:" gibi hiçbir ön ek döndürme. Dilekçe formatını, paragraf yapısını ve Türkçeyi koru. Sadece seçili metni döndür, başka hiçbir şey ekleme.`;

    const aiRes = await fetch(`${WORKSPACE_AI_API_BASE}/workspace-analyze-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        workspace_mode: 'contract_protocol_drafting',
        force_case_search: false,
        force_no_case_search: true,
        deep_thinking: false,
        fast: true,
        history: [{ role: 'assistant', content: 'Metin düzenleme modundayım.' }],
        workspace_context: [],
        notes: [],
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!aiRes.ok || !aiRes.body) {
      const errText = await aiRes.text().catch(() => '');
      return NextResponse.json(
        { error: 'AI servisi yanıt üretemedi.', detail: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    // Buffer the SSE stream and collect the answer
    const reader = aiRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let sseBuffer = '';
    let fullAnswer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });
      const parts = sseBuffer.split('\n\n');
      sseBuffer = parts.pop() || '';

      for (const part of parts) {
        const lines = part.split('\n');
        let dataLine = '';
        for (const line of lines) {
          if (line.startsWith('data:')) dataLine = line.slice(5).trim();
        }
        if (!dataLine || dataLine === '[DONE]') continue;
        try {
          const parsed = JSON.parse(dataLine);
          if (typeof parsed.delta === 'string') fullAnswer += parsed.delta;
          else if (typeof parsed.answer === 'string') fullAnswer = parsed.answer;
          else if (typeof parsed.final_answer === 'string') fullAnswer = parsed.final_answer;
        } catch {
          // non-JSON delta
          fullAnswer += dataLine;
        }
      }
    }

    const revised = fullAnswer.trim();
    if (!revised) {
      return NextResponse.json({ error: 'AI boş yanıt döndürdü.' }, { status: 502 });
    }

    return NextResponse.json({ revised_text: revised });
  } catch (error) {
    console.error('Dilekçe revize hatası:', error);
    return NextResponse.json(
      { error: 'Revizyon sırasında bir hata oluştu.', detail: String(error?.message || '').slice(0, 200) },
      { status: 500 }
    );
  }
}
