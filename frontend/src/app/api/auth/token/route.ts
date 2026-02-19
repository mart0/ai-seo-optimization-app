import { getAccessToken } from '@auth0/nextjs-auth0/edge';
import { NextResponse } from 'next/server';

// Edge runtime avoids Next.js 15 async cookies() errors in the Auth0 SDK.
export const runtime = 'edge';

export async function GET() {
  try {
    const { accessToken } = await getAccessToken();
    return NextResponse.json({ accessToken });
  } catch {
    // No Auth0 session (not logged in, expired, or cookie missing)
    return NextResponse.json({ accessToken: null }, { status: 401 });
  }
}
