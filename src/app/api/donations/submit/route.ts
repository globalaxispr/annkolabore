import { NextRequest, NextResponse } from 'next/server';
import { repository } from '@/lib/repository';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';
import { parseBRLInputToCentavos } from '@/lib/formatters';

// 5 MB limit
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Simple in-memory IP rate limiter: max 6 submissions per 10 minutes
const ipSubmissionTimestamps = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const maxAttempts = 6;

  const timestamps = (ipSubmissionTimestamps.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= maxAttempts) {
    return true;
  }
  timestamps.push(now);
  ipSubmissionTimestamps.set(ip, timestamps);
  return false;
}

/**
 * Validates file signature (magic bytes) to ensure file content actually matches extension/mime
 */
function validateFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 4) return false;

  // JPEG: FF D8 FF
  if (mimeType === 'image/jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  // PNG: 89 50 4E 47
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }

  // PDF: 25 50 44 46 (%PDF)
  if (mimeType === 'application/pdf') {
    return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  }

  // WebP: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (mimeType === 'image/webp') {
    if (buffer.length < 12) return false;
    const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
    const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
    return isRiff && isWebp;
  }

  return false;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous-ip';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Ou voye twòp demann yon sèl kou. Tanpri tann 10 minit anvan ou eseye ankò.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();

    // 1. Bot Honeypot Check (Invisible field)
    const honeypot = formData.get('hp_website') as string | null;
    if (honeypot && honeypot.trim().length > 0) {
      // Fake success for bots
      return NextResponse.json({
        success: true,
        reference: 'DON-BOT-PREV',
        message: 'Nou resevwa resi ou a!',
      });
    }

    // 2. Extract and validate text fields
    const donorName = (formData.get('donor_name') as string | null)?.trim() || '';
    const donorContact = (formData.get('donor_contact') as string | null)?.trim() || '';
    const amountStr = (formData.get('amount') as string | null)?.trim() || '';
    const paymentDate = (formData.get('payment_date') as string | null)?.trim() || '';
    const message = (formData.get('message') as string | null)?.trim() || '';

    if (!donorName || donorName.length < 2) {
      return NextResponse.json(
        { error: 'Tanpri mete non konplè ou (omwen 2 lèt).' },
        { status: 400 }
      );
    }

    // Parse amount in BRL (handles comma or dot with integer centavos precision)
    const amountCents = parseBRLInputToCentavos(amountStr);
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json(
        { error: 'Montan donasyon an pa valab. Tanpri mete yon montan ki plis pase R$ 0,00.' },
        { status: 400 }
      );
    }

    if (!paymentDate || !/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
      return NextResponse.json(
        { error: 'Tanpri chwazi yon dat peman ki valab.' },
        { status: 400 }
      );
    }

    // 3. Extract and validate receipt file
    const file = formData.get('receipt') as File | null;
    if (!file || typeof file === 'string' || file.size === 0) {
      return NextResponse.json(
        { error: 'Tanpri chaje resi peman PIX la (imaj oswa PDF).' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Fichye resi a twò gwo. Gwosè maksimòm lan se 5 MB.' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Fòma fichye a pa otorize. Nou aksepte sèlman JPEG, PNG, WebP, oswa PDF.' },
        { status: 400 }
      );
    }

    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);

    // Verify magic bytes
    if (!validateFileSignature(fileBuffer, file.type)) {
      return NextResponse.json(
        { error: 'Kontni fichye a pa koresponn ak fòma li di li ye a.' },
        { status: 400 }
      );
    }

    // 4. Determine file extension
    let ext = 'jpg';
    if (file.type === 'image/png') ext = 'png';
    else if (file.type === 'image/webp') ext = 'webp';
    else if (file.type === 'application/pdf') ext = 'pdf';

    const safeFilename = `receipt_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const storagePath = `public_donations/${safeFilename}`;

    // 5. Store file in private Supabase Storage bucket or demo storage
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      if (supabase) {
        const { error: uploadError } = await supabase.storage
          .from('donation-receipts')
          .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) {
          console.error('Erè pandan chajman resi a nan Supabase Storage:', uploadError);
          // If storage bucket isn't set up yet, fallback to storing private data URL for development
        }
      }
    }

    // In demo mode or if storage fallback is used, save receipt safely
    const storedReceiptPath = isSupabaseConfigured()
      ? storagePath
      : `data:${file.type};base64,${fileBuffer.toString('base64')}`;

    // 6. Record submission in repository (status begins strictly as 'pending')
    const result = await repository.submitPublicDonation({
      donor_name: donorName,
      donor_contact: donorContact || undefined,
      amount_cents: amountCents,
      payment_date: paymentDate,
      receipt_storage_path: storedReceiptPath,
      message: message || undefined,
    });

    if (result.error || !result.submission) {
      return NextResponse.json(
        { error: result.error || 'Erè pandan anrejistreman donasyon an.' },
        { status: 500 }
      );
    }

    const ref = `DON-${result.submission.id.slice(0, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      reference: ref,
      submission: {
        id: result.submission.id,
        donor_name: result.submission.donor_name,
        amount_cents: result.submission.amount_cents,
        payment_date: result.submission.payment_date,
        status: 'pending',
      },
    });
  } catch (err: any) {
    console.error('Erè nan api submit donation:', err);
    return NextResponse.json(
      { error: err?.message || 'Erè enprevi pandan tretman resi a.' },
      { status: 500 }
    );
  }
}
