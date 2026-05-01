import { Request, Response, NextFunction, RequestHandler } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * HTTP Basic Auth middleware. When both APP_BASIC_USER and APP_BASIC_PASS
 * env vars are set, every request that isn't a CORS preflight or the
 * dedicated /health endpoint is gated behind Basic credentials.
 *
 * If either env var is missing, auth is disabled and a warning is logged
 * once at boot — useful for local development where you may not want a
 * password prompt every time the server restarts.
 *
 * The credential comparison uses crypto.timingSafeEqual to make timing
 * attacks impractical. The realm is shown by some browsers in the auth
 * dialog so we name it after the app.
 */
export function basicAuthMiddleware(): RequestHandler {
  const user = (process.env.APP_BASIC_USER || '').trim();
  const pass = (process.env.APP_BASIC_PASS || '').trim();

  if (!user || !pass) {
    // eslint-disable-next-line no-console
    console.warn(
      '[basicAuth] APP_BASIC_USER / APP_BASIC_PASS not set — Basic Auth is DISABLED. ' +
        'Anyone with the URL can use the app. Set both env vars in Railway to enable.'
    );
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  // Pre-compute the encoded "user:pass" buffer once. Comparing equal-length
  // buffers is required by timingSafeEqual; on length mismatch we still run
  // a dummy compare to avoid leaking timing info.
  const expected = Buffer.from(`${user}:${pass}`, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`[basicAuth] enabled (user="${user}", realm="Neety")`);

  return (req: Request, res: Response, next: NextFunction) => {
    // Always let CORS preflights through — the auth header isn't sent on
    // OPTIONS, so blocking it would break browser CORS handshakes.
    if (req.method === 'OPTIONS') return next();

    // Health endpoint open so Railway / uptime checks aren't 401-ing.
    if (req.path === '/health' || req.path === '/api/health') return next();

    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');

    if (scheme !== 'Basic' || !encoded) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Neety", charset="UTF-8"');
      return res.status(401).send('Authentication required');
    }

    let provided: Buffer;
    try {
      provided = Buffer.from(encoded, 'base64');
    } catch {
      res.setHeader('WWW-Authenticate', 'Basic realm="Neety", charset="UTF-8"');
      return res.status(401).send('Authentication required');
    }

    // timingSafeEqual requires equal-length inputs. On mismatch we run a
    // dummy comparison against the expected buffer so timing is constant
    // regardless of which user/length the attacker tries.
    let ok = false;
    if (provided.length === expected.length) {
      ok = timingSafeEqual(provided, expected);
    } else {
      timingSafeEqual(expected, expected); // dummy
      ok = false;
    }

    if (!ok) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Neety", charset="UTF-8"');
      return res.status(401).send('Invalid credentials');
    }

    next();
  };
}
