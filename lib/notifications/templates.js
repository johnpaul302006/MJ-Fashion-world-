import { inr } from '../format.js'
import { SITE_URL } from '../site.js'

export function getNotificationText(event, order, extra = {}) {
  const storeName = extra.storeName || 'MJ Fashion World'
  const siteUrl = SITE_URL
  const trackingLink = `${siteUrl}/order/${order.orderId}`
  const customerName = order.customer?.name || 'Valued Customer'
  const isCod = order.paymentMethod === 'cod'
  const amountFormatted = inr(order.amount)

  switch (event) {
    case 'order_placed':
      return {
        title: `Order Placed: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} for ${amountFormatted} has been placed. ${isCod ? 'Pay on delivery.' : 'UPI verification in progress.'} Track here: ${trackingLink}`,
        whatsapp: `🛍️ *Order Placed Successfully!*\n\nHi *${customerName}*,\nThank you for ordering with *${storeName}*!\n\n📋 *Order ID:* #${order.orderId}\n💰 *Total Amount:* ${amountFormatted} (${order.paymentMethod.toUpperCase()})\n📦 *Items:* ${order.items?.length || 1} item(s)\n\n📍 *Delivery To:* ${order.customer?.city || 'India'}\n\n👉 *Track your order live:*\n${trackingLink}\n\nWe will notify you once your order is packed and dispatched!`,
      }

    case 'order_confirmed':
      return {
        title: `Order Confirmed: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} has been confirmed. We are packing your items now. Track: ${trackingLink}`,
        whatsapp: `✅ *Order Confirmed!*\n\nHi *${customerName}*,\nYour payment for order *#${order.orderId}* is verified and confirmed. Our team is packing your style items for dispatch.\n\n👉 *View status:* ${trackingLink}`,
      }

    case 'order_packed':
      return {
        title: `Order Packed: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} is packed and ready for courier pickup. Track: ${trackingLink}`,
        whatsapp: `📦 *Order Packed & Quality Checked!*\n\nHi *${customerName}*,\nOrder *#${order.orderId}* has passed quality inspection and is packed for dispatch.\n\n👉 *Track:* ${trackingLink}`,
      }

    case 'order_shipped': {
      const courier = order.tracking?.courier || order.shipment?.courier || 'our delivery partner'
      const awb = order.tracking?.number || order.shipment?.awb || ''
      const awbText = awb ? ` (AWB: ${awb})` : ''
      const liveTracking = order.tracking?.url || trackingLink
      return {
        title: `Order Shipped: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} has shipped via ${courier}${awbText}! Track live: ${liveTracking}`,
        whatsapp: `🚚 *Your Order Has Shipped!*\n\nHi *${customerName}*,\nGreat news! Order *#${order.orderId}* is on its way to you.\n\n🚛 *Courier:* ${courier}\n${awb ? `🔖 *Tracking / AWB:* ${awb}\n` : ''}${order.tracking?.eta ? `📅 *Expected Delivery:* ${order.tracking.eta}\n` : ''}\n👉 *Track Live Shipment:*\n${liveTracking}`,
      }
    }

    case 'out_for_delivery':
      return {
        title: `Out for Delivery: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} is out for delivery today. ${isCod ? `Please keep ${amountFormatted} cash ready.` : ''} Track: ${trackingLink}`,
        whatsapp: `🛵 *Out For Delivery Today!*\n\nHi *${customerName}*,\nYour order *#${order.orderId}* is out for delivery with the local courier.\n\n${isCod ? `💵 *COD Reminder:* Please keep *${amountFormatted}* cash ready.\n\n` : ''}👉 *Live Tracking:* ${trackingLink}`,
      }

    case 'order_delivered':
      return {
        title: `Order Delivered: #${order.orderId}`,
        sms: `Hi ${customerName}, order #${order.orderId} has been delivered. Thank you for shopping with ${storeName}! 7-day returns/exchange: ${trackingLink}`,
        whatsapp: `🎉 *Order Delivered!*\n\nHi *${customerName}*,\nYour ${storeName} order *#${order.orderId}* has been delivered.\n\nWe hope you love your new outfit! You have a 7-day window for easy returns or exchanges.\n\n📄 *Download Invoice:* ${siteUrl}/order/${order.orderId}/invoice\n\nThank you for choosing ${storeName}! ✨`,
      }

    case 'order_cancelled':
      return {
        title: `Order Cancelled: #${order.orderId}`,
        sms: `Hi ${customerName}, your ${storeName} order #${order.orderId} has been cancelled. Contact support for any queries: ${siteUrl}/track-order`,
        whatsapp: `ℹ️ *Order Cancelled*\n\nHi *${customerName}*,\nYour order *#${order.orderId}* has been cancelled.\n\nIf you have any questions or require an immediate refund inquiry, please visit:\n${siteUrl}/track-order`,
      }

    default:
      return {
        title: `Order Update: #${order.orderId}`,
        sms: `Update on your ${storeName} order #${order.orderId}: status is ${order.status}. Track: ${trackingLink}`,
        whatsapp: `ℹ️ *Order Update*\n\nOrder *#${order.orderId}* status is now *${order.status}*.\n\n👉 *Track:* ${trackingLink}`,
      }
  }
}
