export async function sendSmsMessage({ to, message }) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER
  const msg91AuthKey = process.env.MSG91_AUTH_KEY
  const msg91SenderId = process.env.MSG91_SENDER_ID || 'MJFSHN'
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL

  const cleanPhone = to.replace(/[^0-9]/g, '')
  const formattedPhone = cleanPhone.length === 10 ? `+91${cleanPhone}` : `+${cleanPhone}`

  // 1. Twilio SMS
  if (accountSid && authToken && fromPhone) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
      const params = new URLSearchParams()
      params.append('From', fromPhone)
      params.append('To', formattedPhone)
      params.append('Body', message)

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
        throw new Error(data.message || 'Twilio SMS dispatch failed')
      }

      return { ok: true, provider: 'twilio-sms', messageId: data.sid }
    } catch (err) {
      console.error('[SMS Twilio error]:', err.message)
      return { ok: false, error: err.message, provider: 'twilio-sms' }
    }
  }

  // 2. MSG91 (India)
  if (msg91AuthKey) {
    try {
      const endpoint = 'https://control.msg91.com/api/v5/flow/'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authkey: msg91AuthKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: msg91SenderId,
          recipients: [{ mobiles: cleanPhone.slice(-10), message }],
        }),
      })
      const data = await res.json()
      return { ok: res.ok, provider: 'msg91', data }
    } catch (err) {
      console.error('[SMS MSG91 error]:', err.message)
      return { ok: false, error: err.message, provider: 'msg91' }
    }
  }

  // 3. Generic Webhook
  if (webhookUrl) {
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'sms',
          recipient: formattedPhone,
          message,
          timestamp: new Date().toISOString(),
        }),
      })
      return { ok: res.ok, provider: 'webhook' }
    } catch (err) {
      console.error('[SMS Webhook error]:', err.message)
      return { ok: false, error: err.message, provider: 'webhook' }
    }
  }

  // 4. Fallback: Log to Server Console
  console.log(`[SMS NOTIFICATION to ${formattedPhone}]:\n${message}\n---`)
  return { ok: true, provider: 'console-mock' }
}
