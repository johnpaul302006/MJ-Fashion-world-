# 🛍️ YOUR CLOTHING STORE — TEACHER GUIDE (2 Days)

You have ONE website with TWO parts:

| URL | Who | What |
|---|---|---|
| `http://localhost:3000` (your domain later) | **Customers** | Browse, add to cart, pay via UPI, track orders, AI chat |
| `http://localhost:3000/admin` | **You (Seller/Host)** | Add products, change prices, verify payments, manage orders |

---

## 📋 DAY 1 — Setup (accounts + running the site) — ~1–2 hours

### Step 1. Open the project in VS Code
```
code C:\Users\sgire\Downloads\john
```
(If you don't have VS Code, install it free from code.visualstudio.com)

### Step 2. Fill your secret keys — ` .env.local ` file
Open the file `.env.local` (in the project folder, hidden — VS Code shows it) and fill:

1. **MONGODB_URI** — your database link:
   - Create free account at https://www.mongodb.com/cloud/atlas/register
   - Build a free cluster (button: **Build a Database → FREE M0**)
   - **Database Access** tab → Add New User → make username + password, copy password
   - **Network Access** tab → Add IP Address → **Allow access from anywhere** → Confirm
   - Back on **Database** → click **Connect → Drivers** → copy link like
     `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/`
   - **IMPORTANT:** add `/the-store` before the `?` at the end (see the example inside the file)
2. **ADMIN_PASSWORD** — your secret admin password (8+ characters). Type it at `/admin` to login.
3. **GEMINI_API_KEY** (optional but recommended for AI chat):
   - Go to https://aistudio.google.com/apikey → **Create API key** → paste it.

### Step 3. Start your website
Open the terminal in VS Code (**Terminal → New Terminal**) and type:
```bash
npm run dev
```
Then open your browser → http://localhost:3000 — 🎉 your store is live on your PC!

### Step 4. Try the store as a customer would
- Click categories **Boys / Girls / Children / Men / Women** — each has demo products
- Open a product → choose size → **Add to Cart** → **Buy Now**
- On checkout: pay nothing (demo) → just enter any Transaction ID → **Place Order**
- Then visit **/admin** → login with your ADMIN_PASSWORD → **Orders** tab → **✓ Verify Payment**
- **Track Order** page: enter your phone number → see status change as you update it in admin!

### Step 5. Add YOUR real products (not the demo ones)
Only works after Step 2.1 (database connected — no yellow warning in admin).
- Admin → **Products** → **+ Add Product**
- Fill: name, category, price, MRP (old price — makes the OFF % badge), stock, sizes, colors
- **Image URL**: In Google Images, right-click a photo → *Copy image address* → paste
  (or put your own photos in the `public` folder, then enter `/myphoto.jpg`)
- Tick "Show in New Arrivals" to feature it on the homepage.

### Step 6. Put YOUR bank UPI in
Admin → **Settings**:
- **UPI ID**: your GPay/PhonePe UPI ID (e.g. `you@okaxis`) — customers can pay to this directly
- **QR image**: GPay/PhonePe → *my QR* → save the QR picture → put it in `public` folder → enter `/myqr.png` — customers will scan this.

---

## 📋 DAY 2 — Go Live on the Internet (free hosting) — ~1 hour

### Step 1. Push your code to GitHub
- Create free account at github.com → **New repository** (name: `my-store`, keep Private)
- In VS Code terminal:
```bash
git init
git add .
git commit -m "my clothing store"
git branch -M main
git remote add origin https://github.com/YOURNAME/my-store.git
git push -u origin main
```
(It will ask your GitHub username + a Personal Access Token — create at
github.com → Settings → Developer settings → Personal access tokens → Generate new token,
tick `repo`, copy it, paste as password)

### Step 2. Deploy free on Vercel (like Flipkart's hosting)
- Go to https://vercel.com → **Sign up with GitHub**
- **Add New Project** → Import your `my-store` repo → Deploy
- It builds automatically. After deploy, go to **Settings → Environment Variables** and add the SAME 3 keys from `.env.local` (**MONGODB_URI, ADMIN_PASSWORD, GEMINI_API_KEY**)
- Click **Deployments → Redeploy** (so it uses the keys)
- Done! Your site is live at `https://my-store.vercel.app` — share this link with customers!

### Step 3. Make it beautiful (optional, 10 minutes)
Admin → **Settings**:
- Store name (e.g. "John's Fashion") — appears in the top bar
- Announcement: "🔥 Free delivery above ₹499!" — yellow strip on top
- Delivery charge ₹49 / free above ₹499
- Hero banner image URL (photo of your shop)

---

## 💰 How YOUR payment + verification flow works (important!)

1. Customer checks out → sees **your QR + your UPI ID** + amount
2. Customer pays in GPay/PhonePe → copies the **12-digit Transaction ID (UTR)** → pastes → order created = **"Pending Verification"**
3. You log in `/admin` → **Orders** → you open GPay/PhonePe, see the **money arrived**, match the **UTR number**
4. If matched → click **✓ Verify Payment & Confirm** → customer sees "Confirmed" in Track Order
5. You dispatch → **🚚 Mark Shipped** → delivered → **✅ Mark Delivered**

> ⚠️ A quick cheat for automatic UTR checking: some banks send an SMS with the UTR.
> For now, matching by eye is standard for small stores. Later you can connect a
> payment gateway (Razorpay) to make it 100% automatic.

## 🤖 The AI chatbot
The 💬 button bottom-right answers customers using AI (Gemini) + your live product
list. Without a GEMINI_API_KEY it still answers with smart pre-written replies
(delivery, UPI, returns, sizes, tracking).

## 🔧 Daily routine as a seller
1. Open orders → verify payments (2 min)
2. Update status to Shipped/Delivered + add tracking notes
3. Products tab → adjust prices: **+10% / −10% / ±₹20 buttons** or type directly
4. Dashboard tab → today's revenue, pending orders

## ❓ Common problems
| Problem | Fix |
|---|---|
| "Database not connected" warning | MONGODB_URI missing or wrong in `.env.local` → fix → restart `npm run dev` |
| Admin login says wrong password | ADMIN_PASSWORD empty → set it → restart |
| Products don't save | You must have MONGODB_URI set first (demo mode is view-only) |
| Images broken | Image URL wrong → use right-click → Copy image address, or put file in `public` folder |
| Site works on PC but not Vercel | Add the 3 env vars in Vercel → Settings → Environment Variables → Redeploy |
| Chat says "contact the store" | No GEMINI_API_KEY set, or ask about something outside the store |

Good luck! 🎉 You now own a real online store.