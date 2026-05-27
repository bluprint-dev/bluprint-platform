import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Internal API'leri koru (sadece backend'den çağrılabilir)
const INTERNAL_API_PATHS = ['/api/create-token', '/api/verify-payment'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  if (INTERNAL_API_PATHS.some(p => path.startsWith(p))) {
    // Internal API'ler sadece aynı origin'den çağrılabilir
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    
    if (origin && !origin.includes(host || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};