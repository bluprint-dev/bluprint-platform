import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const blob = new Blob([buffer], { type: file.type });
    
    const pinataForm = new FormData();
    pinataForm.append('file', blob, file.name || 'token-image');

    const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Pinata error:', err);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const data = await res.json();
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;

    return NextResponse.json({ success: true, imageUrl, id: data.IpfsHash });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}