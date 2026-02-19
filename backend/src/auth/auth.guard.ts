import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

function getAuth0Domain(): string {
  const raw = process.env.AUTH0_DOMAIN ?? '';
  return raw.replace(/^https?:\/\//, '');
}

@Injectable()
export class GqlAuthGuard implements CanActivate {
  private client: jwksClient.JwksClient;

  constructor() {
    const domain = getAuth0Domain();
    this.client = jwksClient({
      jwksUri: `https://${domain}/.well-known/jwks.json`,
      cache: true,
      rateLimit: true,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || typeof decoded === 'string' || !decoded.header.kid) {
        return false;
      }

      const key = await this.client.getSigningKey(decoded.header.kid);
      const publicKey = key.getPublicKey();

      const domain = getAuth0Domain();
      const verified = jwt.verify(token, publicKey, {
        audience: process.env.AUTH0_AUDIENCE,
        issuer: `https://${domain}/`,
        algorithms: ['RS256'],
      }) as { sub: string; email?: string; name?: string; picture?: string };

      // Access tokens often omit email/name; fetch from UserInfo for DB
      let email = verified.email;
      let name = verified.name;
      let picture = verified.picture;
      try {
        const userinfoRes = await fetch(`https://${domain}/userinfo`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userinfoRes.ok) {
          const profile = (await userinfoRes.json()) as {
            email?: string;
            name?: string;
            picture?: string;
          };
          email = profile.email ?? email;
          name = profile.name ?? name;
          picture = profile.picture ?? picture;
        }
      } catch {
        // keep token claims only
      }

      req.user = {
        sub: verified.sub,
        email,
        name,
        picture,
      };
      return true;
    } catch {
      return false;
    }
  }
}
