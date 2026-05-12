/**
 * Phusion Passenger / cPanel Node.js App entry point.
 *
 * After `npm run build:cpanel`, this file boots the standalone Next.js server
 * that lives in `build/standalone/server.js` (Next 16 outputs to `build/`,
 * not `.next/`, when Turbopack is the default builder). cPanel's Node.js App
 * tool sets PORT/HOSTNAME for us; we just hand them off.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

require('./build/standalone/server.js');
