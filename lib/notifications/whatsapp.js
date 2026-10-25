export async function sendWhatsAppMessage({ to, message, mediaUrl = '' }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER // e.g. whatsapp:+14155238886
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL

  // Clean phone number (e.g., ensure country code)
  const cleanPhone = to.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`

  // 1. Twilio WhatsApp API
  if (accountSid && authToken && fromWhatsApp) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      const params = new URLSearchParams()
      params.append('From', fromWhatsApp.startsWith('whatsapp:') ? fromWhatsApp : `whatsapp:${fromWhatsApp}`)
      params.append('To', `whatsapp:${formattedPhone}`)
      params.append('Body', message)
      if (mediaUrl) params.append('MediaUrl', mediaUrl)

      const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.message || 'Twilio WhatsApp dispatch failed')
      }

      return { ok: true, provider: 'twilio-whatsapp', messageId: data.sid }
    } catch (err) {
      console.error('[WhatsApp Twilio error]:', err.message)
      return { ok: false, error: err.message, provider: 'twilio-whatsapp' }
    }
  }

  // 2. Generic Webhook (e.g. AiSensy, Wati, Interakt, Zapier)
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'whatsapp',
          recipient: formattedPhone,
          message,
          mediaUrl,
          timestamp: new Date().toISOString(),
        }),
      })
      return { ok: res.ok, provider: 'webhook' }
    } catch (err) {
      console.error('[WhatsApp Webhook error]:', err.message)
      return { ok: false, error: err.message, provider: 'webhook' }
    }
  }

  // 3. Fallback: Log to Server Console (Safe sandbox & staging mode)
  console.log(`[WHATSAPP NOTIFICATION to ${formattedPhone}]:\n${message}\n---`)
  return { ok: true, provider: 'console-mock' }
}
