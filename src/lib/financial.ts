import { ContributionSubmission, FinancialSummary, GlobalContributionSummary, PublicDonationSubmission } from './types';

/**
 * No mandatory minimum contribution (R$ 10 minimum requirement removed).
 * Minimum valid amount is 1 centavo (R$ 0,01).
 * Zero and negative amounts remain strictly prohibited.
 */
export const MINIMUM_CONTRIBUTION_CENTAVOS = 1;
export const DEFAULT_CONTRIBUTION_CENTAVOS = 1000;

/**
 * Opening balance of the group fund, in centavos.
 * The authoritative value lives in the database (see get_financial_summary);
 * this constant mirrors it for demo mode.
 */
export const OPENING_BALANCE_CENTAVOS = 0;

export function validateContributionAmount(amountCentavos: number): {
  valid: boolean;
  error?: string;
} {
  if (
    !Number.isInteger(amountCentavos) ||
    amountCentavos < MINIMUM_CONTRIBUTION_CENTAVOS
  ) {
    return { valid: false, error: 'Montan kontribisyon an dwe siperyè a zewo.' };
  }
  return { valid: true };
}

/** Sum of APPROVED submissions only. Pending/rejected never count. */
export function calculateTotalApprovedContributions(
  submissions: ContributionSubmission[]
): number {
  return submissions
    .filter((s) => s.status === 'APPROVED')
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);
}

/** Available Balance = Opening Balance + Total Approved Contributions. */
export function calculateCurrentBalance(
  approvedContributionsCentavos: number,
  openingBalanceCentavos = OPENING_BALANCE_CENTAVOS
): number {
  return Math.round(openingBalanceCentavos + approvedContributionsCentavos);
}

export function findDuplicateWorkDateSubmission(
  submissions: ContributionSubmission[],
  driverId: string,
  workDate: string,
  excludeSubmissionId?: string
): ContributionSubmission | undefined {
  return submissions.find(
    (s) =>
      s.driver_id === driverId &&
      s.work_date === workDate &&
      s.id !== excludeSubmissionId &&
      s.status !== 'REJECTED' // rejected submissions may be corrected and resubmitted
  );
}

export function calculateGlobalContributionSummary(
  submissions: ContributionSubmission[],
  openingBalanceCentavos = OPENING_BALANCE_CENTAVOS,
  donations: PublicDonationSubmission[] = []
): GlobalContributionSummary {
  const approvedSubs = submissions.filter((s) => s.status === 'APPROVED');
  const approvedDons = donations.filter(
    (d) => d.status === 'APPROVED' || d.status === 'approved'
  );
  const totalApprovedSubsCentavos = calculateTotalApprovedContributions(submissions);
  const totalApprovedDonsCentavos = approvedDons.reduce(
    (sum, d) => sum + Math.round(d.amount_centavos || d.amount_cents || 0),
    0
  );

  const total_approved_contributions_centavos =
    totalApprovedSubsCentavos + totalApprovedDonsCentavos + openingBalanceCentavos;

  return {
    total_approved_contributions_centavos,
    total_approved_count: approvedSubs.length + approvedDons.length,
    last_updated: new Date().toISOString(),
  };
}

export function calculateFinancialSummary(
  submissions: ContributionSubmission[],
  totalMembersCount: number,
  todayDateStr?: string,
  openingBalanceCentavos = OPENING_BALANCE_CENTAVOS,
  donations: PublicDonationSubmission[] = []
): FinancialSummary {
  const today = todayDateStr || new Date().toISOString().split('T')[0];
  const monthPrefix = today.slice(0, 7);

  const approvedSubs = submissions.filter((s) => s.status === 'APPROVED');
  const pendingSubs = submissions.filter((s) => s.status === 'PENDING');

  const approvedDons = donations.filter(
    (d) => d.status === 'APPROVED' || d.status === 'approved'
  );
  const pendingDons = donations.filter(
    (d) => d.status === 'PENDING' || d.status === 'pending'
  );

  const sumSubs = (list: ContributionSubmission[]) =>
    list.reduce((acc, s) => acc + Math.round(s.amount_centavos), 0);
  const sumDons = (list: PublicDonationSubmission[]) =>
    list.reduce((acc, d) => acc + Math.round(d.amount_centavos || d.amount_cents || 0), 0);

  const total_contributions_centavos =
    sumSubs(approvedSubs) + sumDons(approvedDons);

  const monthContributions =
    sumSubs(approvedSubs.filter((s) => s.payment_date.startsWith(monthPrefix))) +
    sumDons(approvedDons.filter((d) => d.payment_date.startsWith(monthPrefix)));

  const todayContributions =
    sumSubs(approvedSubs.filter((s) => s.payment_date === today)) +
    sumDons(approvedDons.filter((d) => d.payment_date === today));

  const totalPendingCount = pendingSubs.length + pendingDons.length;
  const totalPendingCentavos = sumSubs(pendingSubs) + sumDons(pendingDons);

  return {
    opening_balance_centavos: openingBalanceCentavos,
    total_contributions_centavos,
    current_balance_centavos: calculateCurrentBalance(
      total_contributions_centavos,
      openingBalanceCentavos
    ),
    month_contributions_centavos: monthContributions,
    today_contributions_centavos: todayContributions,
    pending_count: totalPendingCount,
    pending_centavos: totalPendingCentavos,
    members_count: totalMembersCount,
    last_updated: new Date().toISOString(),
  };
}

