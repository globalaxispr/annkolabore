# Sistèm Jesyon Kontribisyon Chofè Legliz (Brezil)
### Church Drivers Contribution Management System

Platfòm jesyon ak transparans finansye pou yon gwoup chofè legliz nan Brezil. Chak chofè kontribye **R$ 10,00** pou chak jou li travay pou sipòte travay ak misyon legliz la.

> **Enpòtan**: Tout entèfas itilizatè a ekri an **Kreyòl Ayisyen**, epi tout montan yo afiche nan monnen **Real Brezilyen (BRL)** sou fòma `R$ 10,00`.

---

## 1. Prensip ak Règ Finansye

1. **Règ Kontribisyon an**: Yon chofè bay R$ 10,00 sèlman pou jou li te travay reyèlman. Si yon chofè pa travay yon jou, li pa dwe anyen. Pa gen dèt otomatik oswa penalite.
2. **Sekirite ak Transparans**: Lè yon chofè soumèt yon kontribisyon, li antre nan eta `An Atant`. Li pa chanje balans ofisyèl kès la jiskaske trezorye/administratè a verifye epi apwouve li.
3. **Kalkil Egzat (Zero Flotan)**: Tout kalkil fèt an santim (centavos) pou elimine erè awondisman (1000 centavos = R$ 10,00).
4. **Idempotans & Tras Odit**: Yon kontribisyon pa ka apwouve de fwa. Tout apwobasyon, refi, ak depans anrejistre nan yon rejis odit enchanjab.

---

## 2. Teknoloji Yo Itilize (Tech Stack)

- **Next.js 16** (App Router ak TypeScript)
- **Tailwind CSS v4** (Aparans pwòp, modèn, mobil-dabò)
- **Supabase** (PostgreSQL, Row Level Security, Auth, Realtime)
- **Zod** (Validasyon fòmilè ak mesaj Kreyòl)
- **Vitest & Testing Library** (17 senaryo tès otomatik)
- **Lucide React** (Ikon grafik modèn)

---

## 3. Kondisyon Egzije (Prerequisites)

- **Node.js**: v20 oswa pi resan (teste avèk Node v24)
- **NPM**: v10 oswa pi resan
- **Git**

---

## 4. Kijan pou Enstale ak Kouri Pwojè a Lokalman

### A. Telechaje ak Enstale Depandans yo

```bash
# Ale nan dosye pwojè a
cd kontribisyon

# Enstale pake yo
npm install
```

### B. Kouri Aplikasyon an nan Mod Devlopman (Local Dev)

Aplikasyon an gen yon **Mod Demo Devlopman** entegre. Ou ka kouri l imedyatman san ou pa bezwen kle Supabase:

```bash
npm run dev
```

Ouvri navigatè ou sou: **[http://localhost:3000](http://localhost:3000)**

Nan banyè jòn ki anwo a, ou ka:
- Chanje wòl ant **Chofè** (*Jean Baptiste Pierre*) ak **Trezorye / Admin** (*Frantz Augustin*).
- Teste soumèt kontribisyon, apwouve yo, anrejistre depans, ak konsilte rapò yo.
- Klike **Reyinisyalize** pou remete done tès yo a zewo nenpòt lè.

---

## 5. Kijan pou Kouri Tès Otomatik yo

Pwojè a gen 17 senaryo tès ki teste tout workflow la (kreyasyon kont, soumisyon R$ 10,00, apwobasyon idanpotan, izolasyon done, sekirite RLS, refi, ak fòma BRL):

```bash
# Kouri tout tès yo yon sèl fwa
npm run test

# Kouri tès yo an mòd veye (watch mode)
npm run test:watch
```

---

## 6. Kijan pou Fè Konpilasyon Pwodiksyon (Build)

Pou verifye si pa gen okenn erè TypeScript oswa wout Next.js:

```bash
npm run build
npm run start
```

---

## 7. Entegrasyon Supabase (Faz 2)

Lè ou pare pou konekte aplikasyon an ak yon bazdone Supabase reyèl:

### A. Kreye Fichye `.env.local`

Kopye varyab ki nan `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### B. Aplike Migrasyon SQL la

1. Ale nan Supabase Dashboard ou nan seksyon **SQL Editor**.
2. Louvri fichye a: `supabase/migrations/20261012000000_church_drivers_schema.sql`.
3. Kouri tout kòd SQL la. Sa pral kreye:
   - Tablo `profiles`, `contribution_submissions`, `expenses`, `financial_transactions`, `audit_logs`.
   - RLS (Row Level Security) pou pwoteje dosye prive ak resi.
   - Pwosedi atomik `approve_contribution` ak `reject_contribution`.
   - Vwa piblik `public_financial_records` ki kache imèl ak enfòmasyon sekrè.

### C. Kijan pou Kreye Premye Administratè a (Trezorye) San Danje

Pou sekirite, itilizatè yo pa ka mete tèt yo administratè nan fòmilè a. Pou aktive premye administratè a:

1. Kreye yon kont nòmal nan aplikasyon an nan paj `/auth/register` (egzanp: `pastè.frantz@legliz.com`).
2. Ale nan **Supabase Dashboard > SQL Editor** epi egzekite kòmand sa a:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'pastè.frantz@legliz.com';
```

Kounye a, kont sa a gen tout otorizasyon pou apwouve kontribisyon, anrejistre depans, epi jere manm yo.

---

## 8. Deplwaman sou Vercel

1. Pouse kòd la sou yon depo GitHub prive oswa piblik:
   ```bash
   git add .
   git commit -m "feat: sistèm jesyon kontribisyon chofè legliz"
   git remote add origin https://github.com/username/kontribisyon.git
   git push -u origin main
   ```
2. Ale sou [Vercel](https://vercel.com) epi klike **Add New Project**.
3. Enpòte depo GitHub `kontribisyon` an.
4. Nan seksyon **Environment Variables**, ajoute varyab sa yo:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (si ou itilize server actions espesyal)
5. Klike **Deploy**.

---

## 9. Lis Kòmand Prensipal yo

| Kòmand | Deskripsyon |
|---|---|
| `npm run dev` | Kouri dev server lokalman sou pò 3000 |
| `npm run test` | Kouri tout 17 senaryo tès yo avèk Vitest |
| `npm run build` | Bati aplikasyon an pou pwodiksyon |
| `npm run start` | Demare sèvè pwodiksyon an apre build |
| `npm run lint` | Verifye estanda kòd la avèk ESLint |

---

*Devlope avèk onètete ak devouman pou kominote chofè legliz la nan Brezil.*
