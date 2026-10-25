import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrderForDocument, getSettings } from '@/lib/data'
import { getUser, isAdmin } from '@/lib/auth'
import { inr, shortDate } from '@/lib/format'
import InvoicePrintControls from './InvoicePrintControls'

export async function generateMetadata({ params }) {
  const { orderId } = await params
  return {
    title: `Tax Invoice - #${orderId} | MJ Fashion World`,
    robots: { index: false, follow: false },
  }
}

export default async function InvoicePage({ params, searchParams }) {
  const { orderId } = await params
  const sParams = await searchParams
  const shouldAutoPrint = sParams?.print === '1'

  const user = await getUser()
  const admin = await isAdmin()

  if (!user && !admin) {
    redirect(`/login?next=${encodeURIComponent(`/order/${orderId}/invoice`)}`)
  }

  const order = await getOrderForDocument(orderId)
  if (!order) notFound()

  const isHost = admin || user?.role === 'host'
  const isOwner =
    user &&
    ((user.id && order.userId && String(order.userId) === String(user.id)) ||
      (user.email &&
        order.customerEmail &&
        order.customerEmail.toLowerCase() === user.email.toLowerCase()))

  if (!isHost && !isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center font-bold text-xl">
            ✕
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You are signed in as <b>{user?.email}</b>, which does not own this order. Please sign in with the account that placed Order #{orderId}.
          </p>
          <div className="pt-2">
            <Link
              href={`/order/${orderId}`}
              className="inline-block px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
            >
              Back to Tracking
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const settings = await getSettings()
  const storeName = settings?.storeName || 'MJ FASHION WORLD'
  const storeAddress = settings?.address?.trim() || ''
  const storePhone = settings?.phone?.trim() || ''
  const supportEmail = (process.env.HOST_EMAIL || 'sjohnpaul638@gmail.com').trim()
  const storeGstin = settings?.gstin || ''

  const subtotal = order.originalAmount || order.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || order.amount
  const discount = order.discountAmount || 0
  const deliveryFee = order.deliveryFee ?? 0
  const total = order.amount

  const paymentLabel = {
    upi: 'Direct UPI Transfer',
    cod: 'Cash on Delivery (COD)',
    razorpay: 'Online Payment (Razorpay)',
    stripe: 'Credit / Debit Card (Stripe)',
  }[order.paymentMethod] || order.paymentMethod

  const isPaid = order.paymentStatus === 'paid'

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 py-6 sm:py-10 print:py-0 print:bg-white print:text-black">
      {/* Top Floating Control Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href={isHost ? '/admin' : `/order/${order.orderId}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              ← {isHost ? 'Back to Console' : 'Back to Order'}
            </Link>
            <span className="text-xs text-slate-400 font-mono">Invoice #{order.orderId}</span>
          </div>
          <InvoicePrintControls autoPrint={shouldAutoPrint} />
        </div>
      </div>

      {/* Printable Invoice Sheet */}
      <div
        id="invoice-document"
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border border-neutral-200 print:border-none shadow-lg print:shadow-none print:p-0 print:max-w-none text-neutral-900 font-sans"
        style={{ minHeight: '297mm' }}
      >
        {/* Header: Store Identity & Invoice Title */}
        <div className="flex justify-between items-start border-b border-neutral-300 pb-6 mb-6 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#cc0000] text-white flex items-center justify-center font-black text-sm tracking-tighter">
                MJ
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-neutral-950 uppercase">
                {storeName}
              </h1>
            </div>
            {storeAddress ? (
              <p className="text-xs text-neutral-600 max-w-sm leading-relaxed">{storeAddress}</p>
            ) : (
              <p className="text-xs text-amber-800 dark:text-amber-400 print:text-neutral-500 italic max-w-sm">
                Address: [Not Configured — Update in Admin &gt; Settings]
              </p>
            )}
            {storePhone ? (
              <p className="text-xs text-neutral-600">
                <span className="font-semibold">Phone:</span> {storePhone}
              </p>
            ) : (
              <p className="text-xs text-amber-800 dark:text-amber-400 print:text-neutral-500 italic">
                <span className="font-semibold">Phone:</span> [Not Configured — Update in Admin &gt; Settings]
              </p>
            )}
            {supportEmail ? (
              <p className="text-xs text-neutral-600">
                <span className="font-semibold">Support Email:</span> {supportEmail}
              </p>
            ) : null}
            {storeGstin ? (
              <p className="text-xs text-neutral-800">
                <span className="font-semibold">GSTIN:</span> <span className="font-mono">{storeGstin}</span>
              </p>
            ) : null}
          </div>

          <div className="text-right space-y-1">
            <div className="inline-block bg-neutral-950 text-white text-[11px] font-black uppercase px-3 py-1 rounded-sm tracking-wider">
              Tax Invoice / Bill of Supply
            </div>
            <p className="text-sm font-black text-neutral-950 font-mono mt-2">
              INV-{order.orderId}
            </p>
            <p className="text-xs text-neutral-600">
              <span className="font-semibold">Invoice Date:</span> {shortDate(order.createdAt)}
            </p>
            <p className="text-xs text-neutral-600">
              <span className="font-semibold">Order ID:</span> <span className="font-mono font-bold">#{order.orderId}</span>
            </p>
          </div>
        </div>

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-2 gap-8 border-b border-neutral-200 pb-6 mb-6 text-xs">
          <div>
            <h3 className="font-bold uppercase tracking-wider text-neutral-400 text-[10px] mb-2">
              Billed &amp; Delivered To
            </h3>
            <p className="font-bold text-neutral-950 text-sm">{order.customer?.name}</p>
            <p className="text-neutral-700 mt-0.5 leading-relaxed">{order.customer?.address}</p>
            <p className="text-neutral-700">
              {[order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}
              {order.customer?.pincode ? ` - ${order.customer?.pincode}` : ''}
            </p>
            <p className="text-neutral-700 mt-1">
              <span className="font-semibold">Phone:</span> <span className="font-mono">{order.customer?.phone}</span>
            </p>
            {order.customerEmail ? (
              <p className="text-neutral-700">
                <span className="font-semibold">Email:</span> {order.customerEmail}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <h3 className="font-bold uppercase tracking-wider text-neutral-400 text-[10px] mb-2">
              Payment &amp; Fulfillment
            </h3>
            <p className="text-neutral-800 font-semibold">{paymentLabel}</p>
            <div className="mt-1">
              <span
                className={`inline-block text-[11px] font-black uppercase px-2.5 py-0.5 rounded-sm ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isPaid ? 'Payment Received' : order.paymentMethod === 'cod' ? 'Due on Delivery' : 'Payment Pending'}
              </span>
            </div>
            {order.utr ? (
              <p className="text-neutral-600 mt-1.5 font-mono text-[11px]">
                UTR: <b className="text-neutral-950">{order.utr}</b>
              </p>
            ) : null}
            {order.payment?.paymentId ? (
              <p className="text-neutral-600 font-mono text-[11px]">
                Ref: {order.payment.paymentId}
              </p>
            ) : null}
            <p className="text-neutral-600 mt-1">
              <span className="font-semibold">Order Status:</span>{' '}
              <span className="capitalize font-bold text-neutral-900">{order.status}</span>
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mb-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-950 bg-neutral-50 text-neutral-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                <th className="py-2.5 px-3">Item Description</th>
                <th className="py-2.5 px-3 w-24">Size</th>
                <th className="py-2.5 px-3 w-20 text-right">Unit Price</th>
                <th className="py-2.5 px-3 w-14 text-center">Qty</th>
                <th className="py-2.5 px-3 w-24 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="break-inside-avoid">
                  <td className="py-3 px-3 text-center text-neutral-400 font-mono">{idx + 1}</td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-neutral-950">{item.name}</p>
                    <p className="text-[10px] text-neutral-500 font-mono">Apparel &amp; Fashion</p>
                  </td>
                  <td className="py-3 px-3 font-medium text-neutral-700">{item.size || 'Free Size'}</td>
                  <td className="py-3 px-3 text-right font-mono">{inr(item.price)}</td>
                  <td className="py-3 px-3 text-center font-bold font-mono">{item.qty}</td>
                  <td className="py-3 px-3 text-right font-black font-mono">{inr(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Summary Row */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-xs border-t border-neutral-200 pt-3">
            <div className="flex justify-between text-neutral-600">
              <span>Item Subtotal:</span>
              <span className="font-mono text-neutral-900">{inr(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Coupon ({order.couponCode || 'PROMO'}):</span>
                <span className="font-mono">− {inr(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-neutral-600">
              <span>Delivery / Shipping:</span>
              <span className="font-mono text-neutral-900">
                {deliveryFee === 0 ? 'FREE' : inr(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-neutral-950 pt-2 text-sm font-black text-neutral-950">
              <span>Grand Total:</span>
              <span className="font-mono text-base">{inr(total)}</span>
            </div>
            <div className="text-right text-[10px] text-neutral-500">
              (All taxes included)
            </div>
          </div>
        </div>

        {/* Footer Disclaimers & Signatory */}
        <div className="border-t border-neutral-200 pt-6 mt-auto text-xs grid grid-cols-2 gap-6 items-end">
          <div className="space-y-1 text-neutral-500 text-[10px] leading-relaxed">
            <p className="font-bold text-neutral-700 uppercase tracking-wider">Terms &amp; Conditions</p>
            <p>1. Returns and exchanges are accepted within 7 days of delivery for eligible items in original condition.</p>
            <p>2. This is a computer-generated invoice and requires no physical signature.</p>
            <p>3. For questions regarding this order, contact support at {storePhone}.</p>
          </div>

          <div className="text-right space-y-1">
            <div className="h-10"></div>
            <p className="font-bold text-neutral-900 uppercase text-xs">For {storeName}</p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  )
}
