import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    playerId?: string;
    tgUserId?: string;
    tgUserName?: string;
  }
}
