import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as Blob | null;

        if (!file) {
            return NextResponse.json({ error: 'لم يتم استلام أي ملف صوتي من المتصفح.' }, { status: 400 });
        }

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            return NextResponse.json(
                { error: 'مفتاح GROQ_API_KEY غير موجود في .env.local أو لم يتم إعادة تشغيل السيرفر بعد إضافته.' },
                { status: 500 }
            );
        }

        // تحويل الملف الصوتي إلى Buffer لضمان توافقه مع Groq
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const mimeType = file.type || 'audio/webm';
        const ext = mimeType.includes('mp4') || mimeType.includes('m4a') ? 'm4a' : 'webm';

        const apiFormData = new FormData();
        const blob = new Blob([buffer], { type: mimeType });
        apiFormData.append('file', blob, `recitation.${ext}`);
        apiFormData.append('model', 'whisper-large-v3-turbo');
        apiFormData.append('language', 'ar');

        const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${groqApiKey.trim()}`,
            },
            body: apiFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq API Error:', errorText);
            return NextResponse.json(
                { error: `خطأ من Groq (${response.status}): ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text || '' });
    } catch (error: any) {
        console.error('Transcription error:', error);
        return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع في الخادم' }, { status: 500 });
    }
}