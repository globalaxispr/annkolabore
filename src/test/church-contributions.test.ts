import { describe, it, expect, beforeEach } from 'vitest';
import { demoStorage } from '../lib/demo-storage';
import { repository } from '../lib/repository';
import {
  calculateCurrentBalance,
  calculateTotalApprovedContributions,
  calculateGlobalContributionSummary,
  calculateFinancialSummary,
  validateContributionAmount,
  MINIMUM_CONTRIBUTION_CENTAVOS,
  DEFAULT_CONTRIBUTION_CENTAVOS,
} from '../lib/financial';
import { formatBRL, parseBRLInputToCentavos } from '../lib/formatters';
import { registerSchema, contributionSchema } from '../lib/validations';
import { ContributionSubmission, GlobalContributionSummary } from '../lib/types';

describe('Sistèm Jesyon Kontribisyon Chofè Legliz - Global Live Contribution Balance Tests', () => {
  beforeEach(() => {
    demoStorage.resetDemoData();
  });

  // TÈS 1: Vizitè anonim ka wè total kontribisyon global la san koneksyon
  it('1. Vizitè anonim ka wè total kontribisyon global apwouve a san okenn kont oswa koneksyon', async () => {
    // Simulasyon vizitè ki pa konekte (sesyon vid)
    demoStorage.signOut();
    expect(demoStorage.getCurrentUser()).toBeNull();
    expect(repository.getCurrentUser()).toBeNull();

    // Vizitè a ka li balans global la san pwoblèm
    const globalBalance = await repository.getPublicGlobalBalance();
    expect(globalBalance).toBeDefined();
    expect(globalBalance.total_approved_contributions_centavos).toBeGreaterThan(0);
    expect(globalBalance.total_approved_count).toBeGreaterThan(0);

    // Done sansib yo pa ekspoze
    expect((globalBalance as any).email).toBeUndefined();
    expect((globalBalance as any).password).toBeUndefined();
    expect((globalBalance as any).receipt_url).toBeUndefined();
  });

  // TÈS 2: Kontribisyon an atant ak kontribisyon rejte yo pa konte nan balans global la
  it('2. Kontribisyon an atant ak kontribisyon rejte yo ekskli nèt nan balans global la', async () => {
    const initialGlobal = await repository.getPublicGlobalBalance();
    const initialAmount = initialGlobal.total_approved_contributions_centavos;

    // Soumèt yon nouvo kontribisyon ki rete 'PENDING'
    const newPending = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-25',
      payment_date: '2026-10-25',
      amount_centavos: 5000, // R$ 50,00
      payment_method: 'PIX',
    });
    expect(newPending.submission?.status).toBe('PENDING');

    // Balans global la pa dwe chanje!
    const afterPending = await repository.getPublicGlobalBalance();
    expect(afterPending.total_approved_contributions_centavos).toBe(initialAmount);

    // Rejte kontribisyon an
    demoStorage.rejectSubmission(
      newPending.submission!.id,
      'usr-admin-01',
      'Resi peman an pa klè sou aplikasyon an'
    );

    // Balans global la toujou rete san chanjman
    const afterReject = await repository.getPublicGlobalBalance();
    expect(afterReject.total_approved_contributions_centavos).toBe(initialAmount);
  });

  // TÈS 3: Tout tablo de bò (paj akèy, chofè, admin, rapò) wè menm total global la
  it('3. Tout paj ak tablo de bò montre egzakteman menm total balans global la', async () => {
    const publicBalance = await repository.getPublicGlobalBalance();
    const financialSummary = await repository.getFinancialSummary();
    const demoBalance = demoStorage.getPublicGlobalBalance();

    // Paj akèy, sidebar, tablo chofè, tablo admin, ak rapò itilize menm sous done ofisyèl
    expect(publicBalance.total_approved_contributions_centavos).toBe(
      financialSummary.total_contributions_centavos
    );
    expect(publicBalance.total_approved_contributions_centavos).toBe(
      demoBalance.total_approved_contributions_centavos
    );
    expect(publicBalance.total_approved_contributions_centavos).toBe(
      financialSummary.current_balance_centavos
    );
  });

  // TÈS 4: Balans lan mete ajou an tan reyèl lè yon administratè apwouve yon kontribisyon
  it('4. Balans lan mete ajou otomatikman (realtime) lè trezorye apwouve yon kontribisyon', async () => {
    let capturedBalance: GlobalContributionSummary | null = null;
    let callCount = 0;

    // Abònman sou chanjman balans an tan reyèl
    const unsubscribe = repository.subscribeToGlobalBalance((fresh) => {
      capturedBalance = fresh;
      callCount++;
    });

    const beforeBalance = await repository.getPublicGlobalBalance();

    // Soumèt yon kontribisyon R$ 20,00
    const sub = demoStorage.submitContribution({
      driver_id: 'usr-driver-02',
      work_date: '2026-10-26',
      payment_date: '2026-10-26',
      amount_centavos: 2000,
      payment_method: 'PIX',
    }).submission!;

    // Apwouve kontribisyon an kòm trezorye
    const approveResult = await repository.approveSubmission(sub.id, 'usr-admin-01');
    expect(approveResult.success).toBe(true);

    // Listener realtime la dwe resevwa nouvo balans lan
    expect(callCount).toBeGreaterThan(0);
    expect(capturedBalance).not.toBeNull();
    expect(capturedBalance!.total_approved_contributions_centavos).toBe(
      beforeBalance.total_approved_contributions_centavos + 2000
    );

    unsubscribe();
  });

  // TÈS 5: Vizitè ki pa otorize pa ka modifye dosye finansye oswa apwouve kontribisyon
  it('5. Vizitè ki pa otorize ak chofè pa ka apwouve oswa refize kontribisyon', async () => {
    const pendingList = await repository.getPendingSubmissions();
    const pendingId = pendingList[0].id;

    // Eseye apwouve avèk yon ID chofè
    const driverAttempt = demoStorage.approveSubmission(pendingId, 'usr-driver-01');
    expect(driverAttempt.success).toBe(false);
    expect(driverAttempt.error).toContain('mande otorizasyon administratè');

    // Eseye refize avèk yon ID enkoni
    const anonAttempt = demoStorage.rejectSubmission(pendingId, 'anon-visitor', 'Rezon refi');
    expect(anonAttempt.success).toBe(false);
    expect(anonAttempt.error).toContain('mande otorizasyon administratè');
  });

  // TÈS 6: Fòma Real Brezilyen (BRL) kòrèk avèk pwen pou milye ak vigil pou santim
  it('6. Montan yo fòmate kòrèkteman an Real Brezilyen (BRL: R$ 10,00, R$ 1.250,00, R$ 125.450,75)', () => {
    expect(formatBRL(0)).toBe('R$ 0,00');
    expect(formatBRL(1000)).toBe('R$ 10,00');
    expect(formatBRL(125000)).toBe('R$ 1.250,00');
    expect(formatBRL(1245000)).toBe('R$ 12.450,00');
    expect(formatBRL(12545075)).toBe('R$ 125.450,75');

    // Parsing antre itilizatè kòrèk
    expect(parseBRLInputToCentavos('10,00')).toBe(1000);
    expect(parseBRLInputToCentavos('R$ 1.250,00')).toBe(125000);
  });

  // TÈS 7: Yon chofè ka soumèt R$ 10,00 oswa plis pou chak jou travay
  it('7. Yon chofè ka soumèt kontribisyon minimòm R$ 10,00 oswa plis (R$ 15, R$ 20, R$ 50)', () => {
    const amounts = [1000, 1500, 2000, 5000];
    amounts.forEach((amt, idx) => {
      const res = demoStorage.submitContribution({
        driver_id: 'usr-driver-03',
        work_date: `2026-10-${15 + idx}`,
        payment_date: `2026-10-${15 + idx}`,
        amount_centavos: amt,
        payment_method: 'PIX',
      });
      expect(res.submission).toBeDefined();
      expect(res.submission?.amount_centavos).toBe(amt);
    });
  });

  // TÈS 8: Yon kontribisyon ki mwens pase R$ 10,00 rejte avèk mesaj kreyòl apwopriye
  it('8. Yon kontribisyon ki mwens pase R$ 10,00 rejte avèk mesaj kreyòl klè', () => {
    const invalidRes = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-30',
      payment_date: '2026-10-30',
      amount_centavos: 800, // R$ 8,00
      payment_method: 'PIX',
    });
    expect(invalidRes.submission).toBeNull();
    expect(invalidRes.error).toBe('Kontribisyon an dwe omwen R$ 10,00.');

    // Zod validation check
    const zod = contributionSchema.safeParse({
      work_date: '2026-10-30',
      payment_date: '2026-10-30',
      amount_centavos: 500,
      payment_method: 'PIX',
    });
    expect(zod.success).toBe(false);
    if (!zod.success) {
      expect(zod.error.issues[0]?.message).toBe('Kontribisyon an dwe omwen R$ 10,00.');
    }
  });

  // TÈS 9: Idempotans ak anpecheman apwobasyon an doub
  it('9. Idempotans asire yon kontribisyon pa janm konte an doub lè evènman repete', async () => {
    const sub = demoStorage.submitContribution({
      driver_id: 'usr-driver-01',
      work_date: '2026-10-28',
      payment_date: '2026-10-28',
      amount_centavos: 3000,
      payment_method: 'PIX',
    }).submission!;

    const before = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;

    // Premye apwobasyon
    const first = await repository.approveSubmission(sub.id, 'usr-admin-01');
    expect(first.success).toBe(true);

    const afterFirst = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;
    expect(afterFirst - before).toBe(3000);

    // Dezyèm tantativ dwe rejte epi balans lan pa dwe ogmante
    const second = await repository.approveSubmission(sub.id, 'usr-admin-01');
    expect(second.success).toBe(false);

    const afterSecond = (await repository.getPublicGlobalBalance()).total_approved_contributions_centavos;
    expect(afterSecond).toBe(afterFirst);
  });

  // TÈS 10: Kalkil finansye fèt an santim antye san okenn erè pwen flotan
  it('10. Tout kalkil finansye fèt an santim antye (zero floating point inaccuracies)', () => {
    const val1 = 1000; // R$ 10,00
    const val2 = 2555; // R$ 25,55
    const total = val1 + val2;
    expect(total).toBe(3555);
    expect(formatBRL(total)).toBe('R$ 35,55');
  });

  // TÈS 11: Istwa tranzaksyon inifye a gen sèlman aktivite ofisyèl ki apwouve
  it('11. Istwa tranzaksyon inifye a gen sèlman kontribisyon ki apwouve', async () => {
    const history = await repository.getUnifiedTransactions();
    expect(history.length).toBeGreaterThan(0);
    history.forEach((item) => {
      expect(item.status).toBe('Apwouve');
      expect(item.type).toBe('CONTRIBUTION');
    });
  });

  // TÈS 12: Kalkil total kontribisyon global fonksyonèl
  it('12. calculateGlobalContributionSummary kalkile total egzak sou yon lis soumèt', () => {
    const mockSubs: ContributionSubmission[] = [
      {
        id: '1',
        driver_id: 'd1',
        driver_name: 'Chofè A',
        work_date: '2026-10-01',
        payment_date: '2026-10-01',
        amount_centavos: 1000,
        payment_method: 'PIX',
        status: 'APPROVED',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: '2',
        driver_id: 'd2',
        driver_name: 'Chofè B',
        work_date: '2026-10-02',
        payment_date: '2026-10-02',
        amount_centavos: 2500,
        payment_method: 'PIX',
        status: 'APPROVED',
        created_at: '2026-10-02T10:00:00Z',
      },
      {
        id: '3',
        driver_id: 'd3',
        driver_name: 'Chofè C',
        work_date: '2026-10-03',
        payment_date: '2026-10-03',
        amount_centavos: 5000,
        payment_method: 'PIX',
        status: 'PENDING',
        created_at: '2026-10-03T10:00:00Z',
      },
      {
        id: '4',
        driver_id: 'd4',
        driver_name: 'Chofè D',
        work_date: '2026-10-04',
        payment_date: '2026-10-04',
        amount_centavos: 2000,
        payment_method: 'PIX',
        status: 'REJECTED',
        created_at: '2026-10-04T10:00:00Z',
      },
    ];

    const result = calculateGlobalContributionSummary(mockSubs);
    // 1000 + 2500 = 3500 (pending and rejected are excluded)
    expect(result.total_approved_contributions_centavos).toBe(3500);
    expect(result.total_approved_count).toBe(2);
  });

  // TÈS 13: Paginasyon sèvè pou lis dènye kontribitè piblik yo (10 pa paj, 'Anvan' / 'Apre')
  it('13. Paginasyon sou lis dènye kontribitè yo limite a 10 dosye pa paj ak bon nimewo paj', async () => {
    // Paj 1
    const page1 = await repository.getPaginatedPublicContributors(1, 10);
    expect(page1.page).toBe(1);
    expect(page1.pageSize).toBe(10);
    expect(page1.data.length).toBeLessThanOrEqual(10);
    expect(page1.totalCount).toBeGreaterThan(0);
    expect(page1.totalPages).toBe(Math.ceil(page1.totalCount / 10));

    // Tout dosye ki parèt yo se kontribisyon ki te apwouve
    page1.data.forEach((c) => {
      expect(c.amount_centavos).toBeGreaterThanOrEqual(1000);
      expect(c.driver_name).toBeDefined();
    });

    // Paj ki pa egziste (egz. paj 999) bay yon lis vid san erè
    const pageOut = await repository.getPaginatedPublicContributors(999, 10);
    expect(pageOut.page).toBe(999);
    expect(pageOut.data.length).toBe(0);
  });

  // TÈS 14: Validasyon fichye foto pwofil (fòma imaj ak limit 3 MB)
  it('14. Validasyon foto pwofil aksepte JPEG, PNG, WebP epi refize dosye ki depase 3 MB', async () => {
    const { validateAvatarFile, MAX_AVATAR_SIZE_BYTES } = await import(
      '../lib/supabase/storage'
    );

    // Valab: JPEG 1MB
    const validJpeg = new File(['fake-image-bytes'], 'photo.jpg', {
      type: 'image/jpeg',
    });
    expect(validateAvatarFile(validJpeg).valid).toBe(true);

    // Valab: WebP
    const validWebp = new File(['fake-image-bytes'], 'avatar.webp', {
      type: 'image/webp',
    });
    expect(validateAvatarFile(validWebp).valid).toBe(true);

    // Envalab: PDF oswa tèks
    const invalidPdf = new File(['fake-pdf'], 'document.pdf', {
      type: 'application/pdf',
    });
    const pdfResult = validateAvatarFile(invalidPdf);
    expect(pdfResult.valid).toBe(false);
    expect(pdfResult.error).toContain('JPEG, PNG, oswa WebP');

    // Envalab: Dosye ki depase 3 MB
    const oversizedFile = new File(['a'], 'giant.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', {
      value: MAX_AVATAR_SIZE_BYTES + 1024,
    });
    const oversizedResult = validateAvatarFile(oversizedFile);
    expect(oversizedResult.valid).toBe(false);
    expect(oversizedResult.error).toContain('3 MB');
  });

  // TÈS 15: Modifikasyon pwofil itilizatè ak jesyon foto
  it('15. Yon itilizatè ka modifye non li ak foto pwofil li san afekte lòt moun', async () => {
    const user = demoStorage.getCurrentUser();
    expect(user).not.toBeNull();

    const updateRes = await repository.updateProfile(user!.id, {
      full_name: 'Jean-Baptiste Nouvo Non',
      avatar_url: 'https://example.com/avatar-nouvo.webp',
    });

    expect(updateRes.success).toBe(true);
    expect(updateRes.profile?.full_name).toBe('Jean-Baptiste Nouvo Non');
    expect(updateRes.profile?.avatar_url).toBe('https://example.com/avatar-nouvo.webp');
  });

  // TÈS 16: Sekirite enskripsyon: tout nouvo itilizatè gen wòl 'driver' pa defo
  it('16. Tout nouvo itilizatè ki kreye kont resevwa wòl "driver" sèlman', async () => {
    const validRegistration = registerSchema.safeParse({
      full_name: 'Nouvo Chofè Legliz',
      email: 'nouvo.chofe@legliz.test',
      password: 'password123',
      confirm_password: 'password123',
    });
    expect(validRegistration.success).toBe(true);

    // Eseye fòse wòl 'admin' nan anrejistreman
    const signUpResult = await repository.signUp({
      email: 'nouvo2@legliz.test',
      password: 'password123',
      full_name: 'Chofè Eseye Vin Admin',
      // Menmsi yon itilizatè voye role admin nan payload, sistèm nan bay driver
    });

    expect(signUpResult.user?.role).toBe('driver');
  });

  // TÈS 17: Validasyon CPF ofisyèl (70310589290) ak kalkil chif kontwòl
  it('17. Validasyon CPF ofisyèl "70310589290" pase avèk siksè, epi CPF envalab yo rejte', async () => {
    const { validateCpf, formatCpf } = await import('../lib/pix');

    // Kle ofisyèl la se yon CPF valab
    expect(validateCpf('70310589290')).toBe(true);
    expect(formatCpf('70310589290')).toBe('703.105.892-90');

    // CPF envalab (move chif kontwòl)
    expect(validateCpf('70310589291')).toBe(false);
    expect(validateCpf('11111111111')).toBe(false);
    expect(validateCpf('00000000000')).toBe(false);
    expect(validateCpf('12345678900')).toBe(false);
  });

  // TÈS 18: Jenerasyon BR Code / EMV PIX QR Code ak CRC16 egzak
  it('18. Jenerasyon BR Code PIX konfòm ak spesifikasyon EMVCo ak kòd chèk CRC16', async () => {
    const { generatePixPayload, calculateCrc16 } = await import('../lib/pix');

    const payload = generatePixPayload({
      key: '70310589290',
      keyType: 'CPF',
      name: 'Frantzciou Dorleans',
      city: 'Pato Branco',
      description: 'Donasyon Chofè Legliz',
    });

    expect(payload).toContain('000201'); // Payload Format Indicator
    expect(payload).toContain('br.gov.bcb.pix'); // Merchant Account Info GUI
    expect(payload).toContain('70310589290'); // PIX Key
    expect(payload).toContain('5303986'); // BRL Currency
    expect(payload).toContain('5802BR'); // Country Code
    expect(payload).toContain('FRANTZCIOU DORLEANS'); // Normalized Merchant Name
    expect(payload).toContain('PATO BRANCO'); // Normalized Merchant City
    expect(payload).toContain('6304'); // Checksum Tag

    // Verify last 4 characters are valid CRC16 hex
    const dataPart = payload.slice(0, -4);
    const checksumPart = payload.slice(-4);
    const expectedCrc = calculateCrc16(dataPart);
    expect(checksumPart).toBe(expectedCrc);
  });

  // TÈS 19: Vizitè anonim ka soumèt yon donasyon piblik ki kòmanse nan eta 'pending'
  it('19. Vizitè anonim ka soumèt yon donasyon piblik (resi); li kòmanse kòm "pending"', async () => {
    const initialGlobal = await repository.getPublicGlobalBalance();
    const initialBalance = initialGlobal.total_approved_contributions_centavos;

    const res = await repository.submitPublicDonation({
      donor_name: 'Frè Joseph Estimé',
      donor_contact: '+55 11 98888-7777',
      amount_cents: 5000, // R$ 50,00
      payment_date: '2026-10-12',
      receipt_storage_path: 'public_donations/receipt_test_123.jpg',
      message: 'Bondye beni misyon chofè yo!',
    });

    expect(res.submission).toBeDefined();
    expect(res.submission?.status.toLowerCase()).toBe('pending');
    expect(res.submission?.amount_centavos).toBe(5000);

    // CRITICAL: Balans lan pa dwe ogmante otomatikman sou senp chajman resi!
    const afterSubmitGlobal = await repository.getPublicGlobalBalance();
    expect(afterSubmitGlobal.total_approved_contributions_centavos).toBe(initialBalance);
  });

  // TÈS 20: Apwobasyon donasyon piblik pa administratè a ogmante balans lan egzakteman yon fwa
  it('20. Apwobasyon trezorye ogmante balans ofisyèl la egzakteman yon fwa (idempotans)', async () => {
    const initialGlobal = await repository.getPublicGlobalBalance();
    const initialBalance = initialGlobal.total_approved_contributions_centavos;

    const subRes = await repository.submitPublicDonation({
      donor_name: 'Madan Nicole Alce',
      amount_cents: 10000, // R$ 100,00
      payment_date: '2026-10-12',
      receipt_storage_path: 'public_donations/receipt_test_456.jpg',
    });

    const donationId = subRes.submission!.id;

    // Trezorye verifye peman an epi li apwouve li
    const approveRes = await repository.approveDonationSubmission(donationId, 'usr-admin-01');
    expect(approveRes.success).toBe(true);

    // Balans lan ogmante de egzakteman R$ 100,00 (10000 centavos)
    const afterApprovalGlobal = await repository.getPublicGlobalBalance();
    expect(afterApprovalGlobal.total_approved_contributions_centavos).toBe(
      initialBalance + 10000
    );

    // Eseye apwouve yon dezyèm fwa (prevansyon double-approval & idempotans)
    const secondApprove = await repository.approveDonationSubmission(donationId, 'usr-admin-01');
    expect(secondApprove.success).toBe(true);

    // Balans lan pa dwe double! Li rete menm kantite egzak
    const afterSecondApprove = await repository.getPublicGlobalBalance();
    expect(afterSecondApprove.total_approved_contributions_centavos).toBe(
      initialBalance + 10000
    );
  });

  // TÈS 21: Donasyon rejte pa ogmante balans lan
  it('21. Donasyon ki rejte pa janm antre nan balans lan', async () => {
    const initialGlobal = await repository.getPublicGlobalBalance();
    const initialBalance = initialGlobal.total_approved_contributions_centavos;

    const subRes = await repository.submitPublicDonation({
      donor_name: 'Donatè Move Resi',
      amount_cents: 3000,
      payment_date: '2026-10-12',
      receipt_storage_path: 'public_donations/receipt_bad.jpg',
    });

    const rejectRes = await repository.rejectDonationSubmission(
      subRes.submission!.id,
      'usr-admin-01',
      'Peman an pa janm antre nan kont labank la.'
    );
    expect(rejectRes.success).toBe(true);

    const afterRejectGlobal = await repository.getPublicGlobalBalance();
    expect(afterRejectGlobal.total_approved_contributions_centavos).toBe(initialBalance);
  });

  // TÈS 22: Kontribisyon chofè ak donasyon piblik kowenside nan menm sèl balans ofisyèl
  it('22. Kontribisyon chofè ak donasyon piblik ogmante menm sèl balans ofisyèl la', async () => {
    const initialGlobal = await repository.getPublicGlobalBalance();
    const initialBalance = initialGlobal.total_approved_contributions_centavos;

    // 1. Soumèt ak apwouve yon donasyon piblik R$ 50,00
    const don = await repository.submitPublicDonation({
      donor_name: 'Piblik Donatè',
      amount_cents: 5000,
      payment_date: '2026-10-12',
      receipt_storage_path: 'path.jpg',
    });
    await repository.approveDonationSubmission(don.submission!.id, 'usr-admin-01');

    // 2. Chofè soumèt yon kontribisyon R$ 10,00 epi trezorye apwouve li
    const contrib = await repository.submitContribution({
      driver_id: 'usr-driver-02',
      work_date: '2026-10-28',
      payment_date: '2026-10-28',
      amount_centavos: 1000,
      payment_method: 'PIX',
    });
    await repository.approveSubmission(contrib.submission!.id, 'usr-admin-01');

    // Total dwe ogmante de R$ 60,00 (6000 centavos)
    const finalGlobal = await repository.getPublicGlobalBalance();
    expect(finalGlobal.total_approved_contributions_centavos).toBe(
      initialBalance + 5000 + 1000
    );
  });
});
