import { NextResponse } from 'next/server'
import { getSettings, getProducts } from '@/lib/data'
import { inr } from '@/lib/format'

const SYSTEM_PREAMBLE = (settings) => `
You are the helpful AI shopping assistant of "${settings.storeName}", an online clothing store in India.
Be friendly, short and clear. Prices are in Indian Rupees (₹). Answer ONLY about the store below.
If you don't know, say "Please contact us at ${settings.phone || 'the store'}" .

STORE INFO:
- Payment: UPI only. Customer pays to UPI ID "${settings.upiId}" then enters the 12-digit Transaction ID (UTR) on checkout.
- Delivery: orders are dispatched after payment is verified, usually within 1-2 days.
- Delivery charge: ₹${settings.deliveryFee} (FREE above ₹${settings.freeDeliveryAbove}).
- COD: Cash on Delivery ${settings.codEnabled === false ? 'is NOT available' : 'is available'} — customer pays in cash when the order arrives.
- Store phone: ${settings.phone || 'not provided'}.
- Return/refund policy: contact the store within 7 days of delivery for exchange/return.
`

function cannedReply(q, settings) {
  const text = q.toLowerCase()
  if (/(deliver|shipping|dispatch|when.*(come|arrive)|how long)/.test(text)) {
    return `We usually dispatch your order within 24–48 hours after payment is verified, and delivery takes 2–5 days depending on your location.` +
      (settings.phone ? ` For urgent questions call ${settings.phone}.` : '')
  }
  if (/(pay|upi|utr|transaction id|qr|payment)/.test(text)) {
    return `It's easy! 1) Add items to cart and go to Checkout. 2) Choose UPI — scan our QR or pay to UPI ID "${settings.upiId}" from any UPI app (GPay/PhonePe/Paytm). 3) Copy the 12-digit Transaction ID (UTR) from your bank app and paste it on the checkout page. 4) We verify the payment and confirm your order.`
  }
  if (/(cod|cash on delivery|cash|pay.*delivery|pay.*later)/.test(text)) {
    return `Yes! We offer Cash on Delivery (COD). At checkout, pick "Cash on Delivery", and pay ${settings.deliveryFee ? `the amount in cash` : ''} when your order arrives. No UTR needed for COD.`
  }
  if (/(return|refund|exchange|replace)/.test(text)) {
    return `You can exchange or return items within 7 days of delivery. Just contact us and share your Order ID — we'll guide you.`
  }
  if (/(size|fit|sizing)/.test(text)) {
    return `We have sizes S, M, L, XL, XXL and Free Size for most items. If you're unsure, pick one size larger — and our products run true to size. You can also message us your product name for a size suggestion!`
  }
  if (/(track|status|order id|where.*order)/.test(text)) {
    return `Open the "Track Order" link in the top menu, enter the mobile number you used at checkout (plus your Order ID if you have it), and you'll see the live status.`
  }
  if (/(price|cost|offer|sale|discount)/.test(text)) {
    return `We have great deals right now! Check the "Sale 🔥" section in the menu for discounted products. Prices are shown on every product card. For any item just ask me its name and I'll tell you the price.`
  }
  if (/(best seller|popular|top rated|recommend|suggest)/.test(text)) {
    return `Check out the "✨ New Arrivals" and "🔥 On Sale" sections on the homepage for our most-loved items. Tell me which category (Boys, Girls, Children, Men, Women) you like and I'll suggest something from it!`
  }
  if (/(size chart|chest|length)/.test(text)) {
    return `For t-shirts: S (38"), M (40"), L (42"), XL (44"), XXL (46") chest. For kids' clothes, please contact us for the size chart of that specific product.`
  }
  return `Thanks for asking! For that, please check our Shop page or contact us at ${settings.phone || 'the store'}. You can also share the product name and I'll help you. 😊`
}

export async function POST(request) {
  try {
    const { messages } = await request.json()
    const history = (Array.isArray(messages) ? messages : []).slice(-10)
    const last = history[history.length - 1]
    if (!last?.content) {
      return NextResponse.json({ reply: 'Hi! How can I help you today?' })
    }
    const userText = String(last.content).slice(0, 800)

    const settings = await getSettings()
    const products = await getProducts({ limit: 80 })

    let catalog = ''
    if (products.length) {
      catalog =
        '\nPRODUCTS (name | category | price | MRP):\n' +
        products
          .slice(0, 80)
          .map((p) => `- ${p.name} | ${p.category} | ${inr(p.price)} | MRP ${inr(p.mrp)}` + (p.stock === 0 ? ' [OUT OF STOCK]' : ''))
          .join('\n')
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PREAMBLE(settings) + catalog }] },
            contents: history.map((m) => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(m.content).slice(0, 2000) }],
            })),
            generationConfig: { temperature: 0.6, maxOutputTokens: 400 },
          }),
        }
      )
      const data = await res.json()
      const reply = data?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join('')
        .trim()
      if (reply) return NextResponse.json({ reply })
    }

    return NextResponse.json({ reply: cannedReply(userText, settings) })
  } catch (err) {
    console.error('chat error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}