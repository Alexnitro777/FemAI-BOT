import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Переменная окружения ${name} не задана`);
  return value;
}

export const config = {
  token: required('DISCORD_TOKEN'),
  googleKey: required('GOOGLE_API_KEY'),
  modelName: process.env.MODEL_NAME || 'gemini-3.6-flash',
  baseUrl: process.env.BASE_URL || undefined,
};
