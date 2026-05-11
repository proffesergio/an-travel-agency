type EnvKey =
  | 'MONGODB_URI'
  | 'NEXTAUTH_SECRET'
  | 'ADMIN_EMAIL'
  | 'ADMIN_PASSWORD'
  | 'CLOUDINARY_CLOUD_NAME'
  | 'CLOUDINARY_API_KEY'
  | 'CLOUDINARY_API_SECRET'
  | 'NEXT_PUBLIC_APP_URL'
  | 'NEXT_PUBLIC_WHATSAPP_NUMBER'
  | 'GMAIL_USER'
  | 'GMAIL_APP_PASSWORD'
  | 'SMTP_HOST'
  | 'SMTP_PORT'
  | 'SMTP_USER'
  | 'SMTP_PASSWORD'
  | 'SSLCOMMERZ_STORE_ID'
  | 'SSLCOMMERZ_STORE_PASSWORD'
  | 'SSLCOMMERZ_IS_LIVE';

export function getEnv(key: EnvKey): string | undefined {
  const value = process.env[key];
  return value && value.length > 0 ? value : undefined;
}

export function requireEnv(key: EnvKey): string {
  const value = getEnv(key);
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}. Set it in .env.local (development) or in the cPanel Node.js App env vars (production).`
    );
  }
  return value;
}

export function isCloudinaryConfigured(): boolean {
  return (
    !!getEnv('CLOUDINARY_CLOUD_NAME') &&
    !!getEnv('CLOUDINARY_API_KEY') &&
    !!getEnv('CLOUDINARY_API_SECRET')
  );
}

export function isSmtpConfigured(): boolean {
  return !!getEnv('GMAIL_USER') || !!getEnv('SMTP_HOST');
}
