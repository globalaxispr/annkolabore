# Sistèm Jesyon Kontribisyon Chofè Legliz (Brezil)
### Church Drivers Contribution Management System — Fintech Banking Redesign

Platfòm jesyon ak transparans finansye pou yon gwoup chofè legliz nan Brezil, konstwi avèk yon konsepsyon dijital bankè kalite siperyè (style Nubank, senp, pwòp, ak konfyans total).

> **Enpòtan**: Tout entèfas itilizatè a ekri an **Kreyòl Ayisyen**, epi tout montan yo afiche nan monnen **Real Brezilyen (BRL)** sou fòma `R$ 10,00`.

---

## 1. Prensip ak Règ Finansye ki Mizajou

1. **Règ Kontribisyon an (Minimòm R$ 10,00)**: 
   - Chak chofè bay yon **minimòm R$ 10,00** pou chak jou li te travay reyèlman.
   - Chofè a lib pou kontribye plis pase R$ 10,00 (egzanp: R$ 15,00, R$ 20,00, R$ 50,00, R$ 100,00).
   - Nenpòt kontribisyon ki anba R$ 10,00 ap rejte otomatikman avèk mesaj: *"Kontribisyon an dwe omwen R$ 10,00."*
   - Si yon chofè pa travay yon jou, li pa dwe anyen. Pa gen dèt otomatik oswa penalite.

2. **Balans Disponib Dabò (Balance First)**:
   - Balans disponib kès la se eleman ki pi vizib e dominan sou paj akèy la.
   - Anba balans lan gen sèlman de (2) endikatè konpak: **"Total Kontribisyon"** ak **"Total Retrè"**.
   - Fòmil ofisyèl la:
     $$\text{Balans Disponib} = \text{Balans Inisyal (0)} + \text{Kontribisyon Apwouve} - \text{Retrè Egzekite}$$

3. **Sistèm Retrè Pwograme (Ranplase Jesyon Depans)**:
   - Tout fonksyonalite depans retire nèt nan entèfas la.
   - Yo ranplase pa yon sistèm **Retrè Pwograme** (`/admin/retre`).
   - Yon retrè pwograme **pa diminye balans lan touswit**. Li afiche kòm yon angajman transparan.
   - Sistèm nan kalkile yon pwojeksyon: 
     $$\text{Balans Apre Retrè (Pwojeksyon)} = \text{Balans Disponib} - \text{Retrè Pwograme}$$
   - Se sèlman lè trezorye a verifye epi klike **"Egzekite Retrè"** montan an retire yon sèl fwa sou balans lan.
   - Administratè ka anile yon retrè anvan li egzekite avèk yon rezon valab san sa pa touche balans lan.

4. **Kalkil Egzat (Zero Flotan)**:
   - Tout montan trete an santim (centavos) antye (1000 centavos = R$ 10,00) pou elimine nenpòt erè aritmetik.

---

## 2. Teknoloji Yo Itilize (Tech Stack)

- **Next.js 16** (App Router ak TypeScript)
- **Tailwind CSS v4** (Konsepsyon bankè modèn, mobil-dabò)
- **Supabase** (PostgreSQL, Row Level Security, Auth, Realtime)
- **Zod** (Validasyon fòmilè an Kreyòl Ayisyen)
- **Vitest & Testing Library** (20 senaryo tès akseptasyon otomatik)
- **Lucide React** (Ikonografi konsistan ak elegant)

---

## 3. Kondisyon Egzije (Prerequisites)

- **Node.js**: v20 oswa pi resan (teste avèk Node v24)
- **NPM**: v10 oswa pi resan
- **Git**

---

## 4. Kijan pou Enstale ak Kouri Pwojè a Lokalman

### A. Telechaje ak Enstale Depandans yo

```bash
cd kontribisyon
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
- Teste soumèt kontribisyon varyab (R$ 10, R$ 20, R$ 50), apwouve yo, pwograme retrè, egzekite yo, epi swiv pwojeksyon balans lan.

---

## 5. Kijan pou Kouri 20 Tès Akseptasyon yo

```bash
# Kouri tout 20 tès yo yon sèl fwa
npm run test

# Kouri tès yo an mòd veye (watch mode)
npm run test:watch
```

Tout 20 tès pase avèk siksè:
1. Balans disponib kalkile kòrèkteman (Kontribisyon - Retrè)
2. Jesyon depans retire epi ranplase pa retrè pwograme
3. Chofè ka soumèt R$ 10,00
4. Chofè ka soumèt plis pase R$ 10,00 (R$ 15, R$ 20, R$ 50, R$ 100)
5. Kontribisyon anba R$ 10,00 rejte avèk mesaj kreyòl
6. Soumisyon an atant pa chanje balans lan
7. Apwobasyon ogmante balans lan yon sèl fwa (idempotans)
8. Pwograme retrè pa diminye balans lan touswit (pwojeksyon separe)
9. Retrè pwograme parèt nan lis k ap vini yo
10. Egzekite retrè diminye balans lan yon sèl fwa egzakteman
11. Anile retrè pa chanje balans lan
12. Chofè pa ka egzekite oswa anile retrè
13. Chofè pa ka apwouve kontribisyon
14. Kalkil an santim antye san erè flotan
15. Tèks ak validasyon an Kreyòl Ayisyen
16. Fòma Real Brezilyen (BRL: R$ 10,00)
17. Idempotans evènman an tan reyèl
18. Istwa tranzaksyon inifye konpak (apwouve ak egzekite)
19. Konsèvasyon done istorik
20. Fòmil pwojeksyon kalkile kòrèkteman

---

## 6. Kijan pou Fè Konpilasyon Pwodiksyon (Build)

```bash
npm run build
npm run start
```

---

## 7. Entegrasyon Supabase (Faz 2)

### A. Fichye `.env.local`

Kopye varyab ki nan `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### B. Aplike Migrasyon SQL la

Louvri `supabase/migrations/20261012000000_church_drivers_schema.sql` nan Supabase SQL Editor:
- Kreye tablo `scheduled_withdrawals` ak prezèvasyon done istorik `expenses`.
- Pwosedi atomik `execute_scheduled_withdrawal` ak `approve_contribution`.
- Kontwòl RLS konplè ak piblikasyon Realtime.

---

## 8. Lis Wout Aplikasyon an

| Wout | Wòl | Deskripsyon |
|---|---|---|
| `/` | Piblik | Balans Disponib dabò, Total Kontribisyon, Total Retrè, Tranzaksyon |
| `/chofe` | Chofè | Salitasyon pèsonalize, kontribisyon pèsonèl, fil aktivite konpak |
| `/chofe/soumet` | Chofè | Fòmilè kontribisyon (minimòm R$ 10,00, sipò pou montan siperyè) |
| `/admin` | Admin | Tablo trezorye kalite bankè avèk bilan ak aksè rapid |
| `/admin/atant` | Admin | Revize ak apwouve/refize kontribisyon an atant |
| `/admin/retre` | Admin | Pwograme nouvo retrè, konfime egzekisyon, oswa anile retrè |
| `/admin/manm` | Admin | Lis tout chofè ak total kontribisyon yo |
| `/admin/rapo` | Admin | Bilan finansye ofisyèl ak opsyon pou enprime |
| `/admin/odit` | Admin | Tras enchanjab tout operasyon finansye |
| `/auth/login` | Tout | Koneksyon sekirize |
| `/auth/register` | Tout | Enskripsyon chofè |

---

*Devlope avèk onètete ak devouman pou kominote chofè legliz la nan Brezil.*
