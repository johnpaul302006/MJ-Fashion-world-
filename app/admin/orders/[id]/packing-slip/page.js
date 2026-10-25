import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getOrderForDocument, getSettings } from '@/lib/data'
import { getUser, isAdmin } from '@/lib/auth'
import { shortDate, inr } from '@/lib/format'
import PackingSlipControls from './PackingSlipControls'

export async function generateMetadata({ params }) {
  const { id } = await params
  return {
    title: `Packing Slip - ${id} | MJ Fashion World Host Console`,
    robots: { index: false, follow: false },
  }
}

export default async function PackingSlipPage({ params, searchParams }) {
  const { id } = await params
  const sParams = await searchParams
  const shouldAutoPrint = sParams?.print === '1'

  const user = await getUser()
  const admin = await isAdmin()

  const isHost = admin || user?.role === 'host'
  if (!isHost) {
    redirect(`/admin`)
  }

  const order = await getOrderForDocument(id)
  if (!order) notFound()

  const settings = await getSettings()
  const storeName = settings?.storeName || 'MJ FASHION WORLD'
  const storeAddress = settings?.address || '12, Fashion Street, Commercial Hub, India'
  const storePhone = settings?.phone || '+91 98765 43210'

  const isCod = order.paymentMethod === 'cod'
  const totalItems = order.items?.reduce((acc, item) => acc + (Number(item.qty) || 1), 0) || 0

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 py-6 sm:py-10 print:py-0 print:bg-white text-neutral-900 font-sans">
      {/* Floating Action Header (Hidden on Print) */}
      <div className="max-w-4xl mx-auto px-4 mb-6 print:hidden">
        <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            >
              ← Back to Admin Console
            </Link>
            <span className="text-xs text-slate-400 font-mono">Packing Slip #{order.orderId}</span>
          </div>
          <PackingSlipControls autoPrint={shouldAutoPrint} />
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="packing-slip-document"
        className="max-w-4xl mx-auto bg-white p-8 sm:p-12 border border-neutral-200 print:border-none shadow-lg print:shadow-none print:p-0 print:max-w-none text-neutral-900"
        style={{ minHeight: '297mm' }}
      >
        {/* Document Header */}
        <div className="border-b-2 border-neutral-950 pb-5 mb-6 flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-md bg-[#cc0000] text-white flex items-center justify-center font-black text-xs">
                MJ
              </div>
              <h1 className="text-lg font-black uppercase tracking-tight text-neutral-950">
                {storeName}
              </h1>
            </div>
            <p className="text-[11px] text-neutral-600 leading-tight">{storeAddress}</p>
            <p className="text-[11px] text-neutral-600">Support: {storePhone}</p>
          </div>

          <div className="text-right">
            <span className="inline-block bg-neutral-950 text-white text-[11px] font-black uppercase px-3 py-1 tracking-wider">
              Warehouse Packing Slip
            </span>
            <div className="mt-2 text-xl font-black font-mono tracking-tight text-neutral-950">
              #{order.orderId}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Order Date: <b>{shortDate(order.createdAt)}</b>
            </p>
          </div>
        </div>

        {/* Courier & Payment Mode Banner */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
          {/* Shipping Logistics Box */}
          <div className="p-4 rounded-lg border border-neutral-300 bg-neutral-50/70 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
              Shipping &amp; Logistics
            </span>
            <p className="font-bold text-neutral-950 text-sm">
              Courier: {order.tracking?.courier || order.shipment?.courier || 'Standard Surface Courier'}
            </p>
            <p className="font-mono text-neutral-700">
              AWB: <b>{order.tracking?.number || order.shipment?.awb || 'Pending Manifest'}</b>
            </p>
            {order.tracking?.eta ? (
              <p className="text-neutral-600 text-[11px]">Estimated Delivery: <b>{order.tracking.eta}</b></p>
            ) : null}
          </div>

          {/* Payment Collection Instruction */}
          <div
            className={`p-4 rounded-lg border space-y-1 ${
              isCod
                ? 'border-amber-400 bg-amber-50 text-amber-950'
                : 'border-emerald-300 bg-emerald-50 text-emerald-950'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
              Payment Collection Instruction
            </span>
            {isCod ? (
              <>
                <p className="font-black text-sm text-amber-950">
                  ⚠️ CASH ON DELIVERY (COD)
                </p>
                <p className="text-xs font-bold text-neutral-900">
                  Collect Cash: <span className="font-mono text-base font-black text-red-700">{inr(order.amount)}</span>
                </p>
                <p className="text-[10px] text-amber-900">
                  Ensure exact cash is collected before handing the package to the customer.
                </p>
              </>
            ) : (
              <>
                <p className="font-black text-sm text-emerald-900">
                  ✅ PREPAID ORDER
                </p>
                <p className="text-xs font-semibold text-emerald-800">
                  Total Paid: <span className="font-mono font-bold text-neutral-950">{inr(order.amount)}</span> ({order.paymentMethod.toUpperCase()})
                </p>
                <p className="text-[10px] text-emerald-800">
                  DO NOT collect any payment from customer on delivery.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Deliver To Destination Box */}
        <div className="border border-neutral-300 p-4 rounded-lg mb-6 text-xs bg-white">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
            Deliver To / Destination Address
          </span>
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-base font-black text-neutral-950">{order.customer?.name}</p>
              <p className="text-neutral-800 mt-1 text-sm leading-relaxed max-w-lg">
                {order.customer?.address}
              </p>
              <p className="text-sm font-bold text-neutral-900 mt-0.5">
                {[order.customer?.city, order.customer?.state].filter(Boolean).join(', ')}
                {order.customer?.pincode ? ` — ${order.customer?.pincode}` : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-neutral-500 uppercase font-semibold">Primary Contact</span>
              <p className="text-base font-black font-mono text-neutral-950 mt-0.5">
                {order.customer?.phone}
              </p>
              {order.customerEmail ? (
                <p className="text-xs text-neutral-600 mt-0.5">{order.customerEmail}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Warehouse Pick & Pack Checklist Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-neutral-950">
              Pick &amp; Pack Verification Checklist ({totalItems} total pieces)
            </h3>
            <span className="text-[10px] text-neutral-500 font-semibold">
              Mark checkbox [✓] upon physical inspection
            </span>
          </div>

          <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
            <thead>
              <tr className="bg-neutral-100 text-neutral-800 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-300">
                <th className="py-2.5 px-3 w-12 text-center border-r border-neutral-300">Check</th>
                <th className="py-2.5 px-3 border-r border-neutral-300">Item Description</th>
                <th className="py-2.5 px-3 w-28 text-center border-r border-neutral-300">Size / Variant</th>
                <th className="py-2.5 px-3 w-20 text-center border-r border-neutral-300">Qty</th>
                <th className="py-2.5 px-3 w-28 text-center">SKU / Item Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {order.items?.map((item, idx) => (
                <tr key={idx} className="break-inside-avoid">
                  <td className="py-3 px-3 text-center border-r border-neutral-300">
                    <div className="w-5 h-5 mx-auto border-2 border-neutral-400 rounded-sm flex items-center justify-center font-bold text-neutral-400">
                      
                    </div>
                  </td>
                  <td className="py-3 px-3 border-r border-neutral-300">
                    <p className="font-bold text-neutral-950 text-sm">{item.name}</p>
                    <p className="text-[10px] text-neutral-500">Quality check: tags intact, zero defects</p>
                  </td>
                  <td className="py-3 px-3 text-center border-r border-neutral-300">
                    <span className="inline-block bg-neutral-100 font-black text-sm px-2 py-0.5 rounded-sm border border-neutral-300 font-mono">
                      {item.size || 'Free Size'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center border-r border-neutral-300 font-black font-mono text-base">
                    {item.qty}
                  </td>
                  <td className="py-3 px-3 text-center text-neutral-500 font-mono text-[10px]">
                    {String(item.productId || order.orderId).slice(-6).toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Special Instructions or Notes */}
        {order.note ? (
          <div className="mb-6 p-3 rounded-lg border border-neutral-300 bg-neutral-50 text-xs">
            <span className="font-bold text-neutral-900 uppercase text-[10px] tracking-wider block mb-0.5">
              Customer Note / Special Request:
            </span>
            <p className="text-neutral-700">{order.note}</p>
          </div>
        ) : null}

        {/* Sign-off & Packing Verification Block */}
        <div className="border border-neutral-300 rounded-lg p-4 grid grid-cols-4 gap-4 text-xs mt-auto">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-2">Picked By</span>
            <div className="border-b border-neutral-400 h-6"></div>
            <span className="text-[9px] text-neutral-400 block mt-1">Staff Signature / ID</span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-2">Quality Checked By</span>
            <div className="border-b border-neutral-400 h-6"></div>
            <span className="text-[9px] text-neutral-400 block mt-1">QC Inspector</span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-2">Parcel Weight</span>
            <div className="border-b border-neutral-400 h-6 font-mono text-xs flex items-end">
              _______ kg
            </div>
            <span className="text-[9px] text-neutral-400 block mt-1">Scale Weight</span>
          </div>

          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block mb-2">Dispatch Date</span>
            <div className="border-b border-neutral-400 h-6 font-mono text-xs flex items-end">
              {new Date().toLocaleDateString('en-IN')}
            </div>
            <span className="text-[9px] text-neutral-400 block mt-1">Handover to Courier</span>
          </div>
        </div>
      </div>
    </div>
  )
}
