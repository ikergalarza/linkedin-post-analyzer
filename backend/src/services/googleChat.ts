export async function sendToGoogleChat(webhookUrl: string, text: string): Promise<void> {
  if (!webhookUrl) throw new Error('GOOGLE_CHAT_WEBHOOK_URL not configured');
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Google Chat responded ${res.status}: ${body.slice(0, 200)}`);
  }
}
