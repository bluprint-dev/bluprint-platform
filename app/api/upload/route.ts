import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

// Magic bytes for file type verification
const MAGIC_BYTES: Record<string, string[]> = {
  'png': ['89', '50', '4e', '47', '0d', '0a', '1a', '0a'],
  'jpg': ['ff', 'd8', 'ff'],
  'gif': ['47', '49', '46', '38'],
  'webp': ['52', '49', '46', '46'],
};

async function validateImageMagicBytes(buffer: Buffer, expectedType: string): Promise<boolean> {
  const hex = buffer.subarray(0, 8).toString('hex').match(/.{1,2}/g) || [];
  
  switch (expectedType) {
    case 'png':
      return hex.slice(0, 8).join('') === '89504e470d0a1a0a';
    case 'jpg':
      return hex[0] === 'ff' && hex[1] === 'd8' && hex[2] === 'ff';
    case 'gif':
      return hex[0] === '47' && hex[1] === '49' && hex[2] === '46' && hex[3] === '38';
    case 'webp':
      return hex[0] === '52' && hex[1] === '49' && hex[2] === '46' && hex[3] === '46';
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const rateKey = `rate:upload:${ip}`;
    const rateCount = await redis.incr(rateKey);
    if (rateCount === 1) await redis.expire(rateKey, 60);
    if (rateCount > 10) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    // Read file buffer for magic bytes validation
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type.split('/')[1];
    
    // Validate magic bytes
    const isValidMagic = await validateImageMagicBytes(buffer, fileType);
    if (!isValidMagic) {
      return NextResponse.json({ error: 'Invalid file content' }, { status: 400 });
    }

    // Upload to Pinata
    const secretKeyArray = JSON.parse(process.env.PLATFORM_SECRET_KEY!);
    
    const Pinata = require('@pinata/sdk');
    const pinata = new Pinata(process.env.PINATA_JWT);
    
    const stream = require('stream');
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    
    const options = {
      pinataMetadata: {
        name: `token-image-${Date.now()}`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    };
    
    const result = await pinata.pinFileToIPFS(bufferStream, options);
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    return NextResponse.json({
      success: true,
      imageUrl,
      id: result.IpfsHash,
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}