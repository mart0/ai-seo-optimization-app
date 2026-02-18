import { NextRequest } from 'next/server';
import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';

const auth0Handlers = handleAuth({
  login: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
    },
  }),
  signup: handleLogin({
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email',
      screen_hint: 'signup',
    },
  }),
});

const CALLBACK_TIMEOUT_MS = 10_000;

// Next.js 15: context.params is a Promise; Auth0 SDK expects a plain object.
// Wrapper ensures we never hang: callback must complete or fail within CALLBACK_TIMEOUT_MS.
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ auth0: string }> },
) {
  const params = await context.params;
  const route = params.auth0;

  // Log so we can see in terminal whether the request reaches this handler
  console.log(`[Auth0] ${route} handler started`);

  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(
      () => reject(new Error('Auth callback timed out')),
      CALLBACK_TIMEOUT_MS,
    );
  });

  try {
    const response = await Promise.race([
      auth0Handlers(request, { params }),
      timeoutPromise,
    ]);
    if (route === 'callback') {
      console.log('[Auth0] callback completed successfully');
    }
    return response;
  } catch (err) {
    console.error('[Auth0 callback error]', err);
    const message = err instanceof Error ? err.message : 'Auth failed';
    return new Response(
      `Authentication failed: ${message}. Try again or check Auth0 configuration.`,
      { status: 503, headers: { 'Content-Type': 'text/plain' } },
    );
  }
}
