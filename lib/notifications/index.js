import { getNotificationText } from './templates.js'
import { sendWhatsAppMessage } from './whatsapp.js'
import { sendSmsMessage } from './sms.js'

export async function dispatchOrderNotification(order, event, extra = {}) {
  if (!order || !order.customer?.phone) {
    return { ok: false, reason: 'missing_recipient' }
  }

  const channel = (process.env.NOTIFICATION_CHANNEL || 'both').toLowerCase()
  const templates = getNotificationText(event, order, extra)

  const results = { event, orderId: order.orderId, whatsapp: null, sms: null }

  // 1. WhatsApp Dispatch
  if (channel === 'whatsapp' || channel === 'both') {
    try {
      results.whatsapp = await sendWhatsAppMessage({
        to: order.customer.phone,
        message: templates.whatsapp,
      })
    } catch (err) {
      console.error('[Notification Dispatch] WhatsApp failed:', err.message)
      results.whatsapp = { ok: false, error: err.message }
    }
  }

  // 2. SMS Dispatch
  if (channel === 'sms' || channel === 'both') {
    try {
      results.sms = await sendSmsMessage({
        to: order.customer.phone,
        message: templates.sms,
      })
    } catch (err) {
      console.error('[Notification Dispatch] SMS failed:', err.message)
      results.sms = { ok: false, error: err.message }
    }
  }

  // 3. Record in order audit history if order document supports it
  try {
    if (order.notificationsSent && typeof order.save === 'function') {
      order.notificationsSent.push({
        channel,
        event,
        sentAt: new Date(),
        recipient: order.customer.phone,
        status: results.whatsapp?.ok || results.sms?.ok ? 'sent' : 'failed',
      })
      await order.save()
    }
  } catch (err) {
    console.error('[Notification Dispatch] Audit record failed:', err.message)
  }

  return results
}
