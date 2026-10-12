# Chofè Legliz — Sistèm Jesyon Kontribisyon Finansye

Platfòm jesyon, odit, ak transparans finansye pou yon kominote chofè legliz nan Brezil. Aplikasyon an pèmèt chofè yo kontribye pou chak jou yo travay, resevwa donasyon PIX piblik, epi pèmèt administratè ak trezorye valide tout tranzaksyon yo avèk yon nivo sekirite bankè modèn.

> **Lang & Monnen**: Tout entèfas itilizatè a ekri an **Kreyòl Ayisyen**, epi tout montan yo afiche nan monnen **Real Brezilyen (BRL)** sou fòma `R$ 10,00`.

---

## 1. Achitekti & Teknoloji (Tech Stack)

- **Framework Web**: Next.js 16 (App Router ak Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4 (Design bankè modèn, mobil-dabò)
- **Baz Done & Sekirite**: Supabase PostgreSQL avèk Row Level Security (RLS)
- **Otantifikasyon**: Supabase Auth (SSR Cookies, PKCE, sesyon sekirize)
- **Depo Fichye (Storage)**: Supabase Storage (`receipts` prive, `avatars` piblik)
- **Validasyon**: Zod (mesaj erè an Kreyòl Ayisyen)
- **Tès Otomatik**: Vitest ak Testing Library (22 tès akseptasyon otomatik)
- **Ikonografi**: Lucide React
- **Deplwaman**: Vercel Ready

---

## 2. Règ Finansye & Sekirite (Financial & Security Integrity)

1. **Règ Kontribisyon an (Minimòm R$ 10,00)**:
   - Chak chofè bay omwen R$ 10,00 pou chak jou li te travay reyèlman.
   - Chofè a lib pou kontribye plis (R$ 15, R$ 20, R$ 50, R$ 100, elatriye).
   - Nenpòt kontribisyon anba R$ 10,00 rejte otomatikman.
   - Si yon chofè pa travay yon jou, li pa dwe anyen. Pa gen dèt otomatik oswa penalite.

2. **Règ Donasyon Piblik PIX**:
   - Nenpòt vizitè ka fè yon donasyon PIX atravè paj `/kontribye`.
   - Kle PIX ofisyèl: `70310589290` (Frantzciou Dorleans — Pato Branco, PR).
   - Resi yo voye nan depo prive `receipts` epi verifye pa trezorye a anvan yo apwouve.

3. **Balans Global ak Entegrite Tranzaksyon**:
   - **Pa gen retrè ni depans**: Tout kontribisyon ak donasyon se pou sipòte kès legliz la.
   - **Enmutabilite**: Tranzaksyon finansye ki apwouve ak jounal odit (`audit_logs`) pa ka modifye ni efase nan kliyan an (trigè PostgreSQL bloke UPDATE ak DELETE).
   - **Kalkil San Flotan**: Tout kalkil fèt an santim antye (*integer centavos*, egzanp: 1000 santim = R$ 10,00) pou elimine erè awondisman.
   - **Idempotans**: Apwobasyon tranzaksyon yo fèt yon sèl fwa atravè fonksyon atomik PostgreSQL (`approve_contribution`, `approve_public_donation`).

4. **Pwoteksyon Kont Atak Web**:
   - **Content Security Policy (CSP)**: Pwoteje kont XSS ak enjeksyon kòd.
   - **HTTP Headers**: HSTS, X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), Referrer-Policy, ak Permissions-Policy.
   - **Anti-Enumeration**: Rekiperasyon modpas pa janm revele si yon imèl egziste nan sistèm nan.

---

## 3. Estrikti Pwojè a (Project Structure)

```
kontribisyon/
├── src/
│   ├── app/
│   │   ├── admin/                # Espas administratè & trezorye (odit, atant, manm, rapo)
│   │   │   ├── configuracoes/pix # Jesyon konfigirasyon kle PIX
│   │   │   └── donasyon/         # Apwobasyon donasyon piblik PIX
│   │   ├── api/donations/submit  # API endpoint sekirize pou resi donasyon
│   │   ├── auth/
│   │   │   ├── callback/         # Echanj kòd PKCE pou sesyon Auth Supabase
│   │   │   ├── esqueci-senha/    # Paj demann rekiperasyon modpas
│   │   │   ├── redefinir-senha/  # Paj kreyasyon nouvo modpas
│   │   │   ├── login/            # Koneksyon chofè ak administratè
│   │   │   └── register/         # Enskripsyon chofè
│   │   ├── chofe/                # Dashboard chofè ak soumèt kontribisyon
│   │   ├── kontribye/            # Paj piblik donasyon PIX
│   │   ├── perfil/               # Jesyon pwofil chofè
│   │   ├── not-found.tsx         # Paj erè 404 sekirize an Kreyòl
│   │   ├── error.tsx             # Baryè erè sekirize san flit kòd
│   │   └── layout.tsx            # Layout prensipal ak navigasyon bankè
│   ├── components/               # Konpozan UI (balans, fid tranzaksyon, shell)
│   ├── lib/
│   │   ├── supabase/             # Kliyan Supabase (browser, server, config, storage)
│   │   ├── repository.ts         # Kouch done (aksè Supabase + fallback demo)
│   │   ├── financial.ts          # Fòmil kalkil finansye santim antye
│   │   ├── pix.ts                # Dèlko payload PIX Copy & Paste ak QR Code
│   │   └── validations.ts        # Schémas Zod an Kreyòl
│   └── test/                     # Tès otomatik Vitest
└── supabase/
    └── migrations/               # Migrasyon SQL ofisyèl
        ├── 20261012000000_church_drivers_schema.sql
        ├── 20261012010000_public_pix_donations.sql
        └── 20261012020000_security_hardening.sql
```

---

## 4. Enstalasyon & Konfigirasyon Lokal

### Pre-rekizit
- **Node.js**: v20 oswa v22+
- **NPM**: v10+
- **Pwojè Supabase** (oswa sèvi ak mod Demo a pandan w ap devlope)

### A. Klonen ak Enstale Depandans yo
```bash
git clone https://github.com/your-username/kontribisyon.git
cd kontribisyon
npm install
```

### B. Konfigirasyon Fichye Anviwònman (.env.local)
Kreye yon fichye `.env.local` nan rasin pwojè a baze sou `.env.example`:

```bash
cp .env.example .env.local
```

Mete kle Supabase ou yo:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Remak Sekirite**: Fichye `.env.local` la nan `.gitignore` epi li PA JANM dwe voye nan GitHub.

---

## 5. Aplike Migrasyon Baz Done Supabase

Ouvri **SQL Editor** nan kont Supabase ou epi egzekite fichye migrasyon yo nan lòd sa a:

1. `supabase/migrations/20261012000000_church_drivers_schema.sql`  
   *(Kreye tab `profiles`, `contribution_submissions`, `financial_transactions`, `audit_logs`, ak RLS debaz).*
2. `supabase/migrations/20261012010000_public_pix_donations.sql`  
   *(Kreye tab `public_donation_submissions`, `pix_settings`, ak depo `receipts`).*
3. `supabase/migrations/20261012020000_security_hardening.sql`  
   *(Sekirize tout fonksyon `SECURITY DEFINER` ak `SET search_path = public, pg_temp`, aplike trigè imitabilite sou liv finansye a, epi revoke privilèj egzekisyon anonim ki pa nesesè).*

### Pwomosyon yon Administratè (Admin Setup)
Lè administratè a fin kreye kont li nan aplikasyon an, egzekite kòmand SQL sa a nan Supabase SQL Editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'adrès-imèl-admin-an@legliz.com';
```

---

## 6. Konfigirasyon Supabase Auth pou Rekiperasyon Modpas

Pou lyen rekiperasyon modpas (`/auth/esqueci-senha` ak `/auth/redefinir-senha`) travay san pwoblèm:

Nan Supabase Dashboard > **Authentication** > **URL Configuration**:
- **Site URL**:
  - Devlopman lokal: `http://localhost:3000`
  - Pwodiksyon Vercel: `https://your-domain.vercel.app`
- **Redirect URLs (Allowed)**:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/redefinir-senha`
  - `https://your-domain.vercel.app/auth/callback`
  - `https://your-domain.vercel.app/auth/redefinir-senha`

---

## 7. Kouri Tès ak Bati Pwojè a

### Kouri Tès Otomatik yo (22 Senaryo Akseptasyon)
```bash
npm test
```

### Verifye Konpilasyon Pwodiksyon (Next.js Production Build)
```bash
npm run build
```

---

## 8. Deplwaman sou Vercel (Production Deployment Checklist)

1. Konekte repo GitHub la ak kont **Vercel** ou.
2. Nan paramèt pwojè a (**Environment Variables**), ajoute:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Opsyonèl pou script administratif sèvè)
   - `NEXT_PUBLIC_SITE_URL` (Mete domèn Vercel pwodiksyon an, egzanp: `https://chofe-legliz.vercel.app`)
3. Klike **Deploy**.
4. Ajoute domèn pwodiksyon Vercel la nan lis **Redirect URLs** nan Supabase Dashboard (gade Seksyon 6).

---

## 9. Kredi ak Lisans

- **Kominote**: Chofè Legliz (Brezil)
- **Trezorye / Moun ki Resevwa PIX Ofisyèl**: Frantzciou Dorleans (Pato Branco – PR)
- **Devlope pa**: Johnny Frantz T Rene
- **Lisans**: Prive / Rezève pou kominote Chofè Legliz la.
