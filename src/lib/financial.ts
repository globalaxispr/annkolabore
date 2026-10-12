import {
  ContributionSubmission,
  FinancialSummary,
  ScheduledWithdrawal,
  ExpenseRecord,
} from './types';

/**
 * Minimum contribution amount per working day: R$ 10,00 (1000 centavos).
 * Drivers may contribute more than R$ 10,00 (e.g. R$ 15,00, R$ 20,00, R$ 50,00, R$ 100,00).
 */
export const MINIMUM_CONTRIBUTION_CENTAVOS = 1000;
export const DEFAULT_CONTRIBUTION_CENTAVOS = 1000;

/**
 * Validate that a contribution is at least R$ 10,00.
 */
export function validateContributionAmount(amountCentavos: number): {
  valid: boolean;
  error?: string;
} {
  if (isNaN(amountCentavos) || amountCentavos < MINIMUM_CONTRIBUTION_CENTAVOS) {
    return {
      valid: false,
      error: 'Kontribisyon an dwe omwen R$ 10,00.',
    };
  }
  return { valid: true };
}

/**
 * Calculate total approved contributions in centavos.
 * Only submissions with status === 'APPROVED' are counted.
 * Pending or Rejected submissions MUST NOT contribute to the total.
 */
export function calculateTotalApprovedContributions(
  submissions: ContributionSubmission[]
): number {
  return submissions
    .filter((s) => s.status === 'APPROVED')
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);
}

/**
 * Calculate total executed withdrawals in centavos.
 * Only withdrawals with status === 'Egzekite' are subtracted from the official balance.
 * Scheduled ('Pwograme') or Pending ('An Atant') or Cancelled ('Anile') withdrawals do not reduce official balance.
 */
export function calculateTotalExecutedWithdrawals(
  withdrawals: ScheduledWithdrawal[]
): number {
  return withdrawals
    .filter((w) => w.status === 'Egzekite')
    .reduce((sum, w) => sum + Math.round(w.amount_centavos), 0);
}

/**
 * Calculate total pending scheduled withdrawals in centavos.
 * Statuses: 'Pwograme' | 'An Atant'
 */
export function calculateTotalPendingScheduledWithdrawals(
  withdrawals: ScheduledWithdrawal[]
): number {
  return withdrawals
    .filter((w) => w.status === 'Pwograme' || w.status === 'An Atant')
    .reduce((sum, w) => sum + Math.round(w.amount_centavos), 0);
}

/**
 * Calculate official current available balance in centavos.
 * Formula: Opening Balance (0) + Approved Contributions - Approved/Executed Withdrawals.
 */
export function calculateCurrentBalance(
  approvedContributionsCentavos: number,
  executedWithdrawalsCentavos: number,
  openingBalanceCentavos = 0
): number {
  return Math.round(
    openingBalanceCentavos + approvedContributionsCentavos - executedWithdrawalsCentavos
  );
}

/**
 * Calculate projected balance after pending scheduled withdrawals.
 * Formula: Current Available Balance - Pending Scheduled Withdrawals.
 */
export function calculateProjectedBalance(
  currentBalanceCentavos: number,
  pendingScheduledCentavos: number
): number {
  return Math.round(currentBalanceCentavos - pendingScheduledCentavos);
}

/**
 * Backward compatibility helper for legacy expense datasets
 */
export function calculateTotalExpenses(expenses: ExpenseRecord[]): number {
  return expenses.reduce((sum, e) => sum + Math.round(e.amount_centavos), 0);
}

/**
 * Check if a driver has already submitted for a specific work date.
 */
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
      s.status !== 'REJECTED' // A rejected submission can be resubmitted with corrections
  );
}

/**
 * Calculate complete financial summary from datasets.
 */
export function calculateFinancialSummary(
  submissions: ContributionSubmission[],
  withdrawals: ScheduledWithdrawal[],
  totalMembersCount: number,
  todayDateStr?: string
): FinancialSummary {
  const today = todayDateStr || new Date().toISOString().split('T')[0];
  const currentMonthPrefix = today.slice(0, 7); // YYYY-MM

  const approvedSubmissions = submissions.filter((s) => s.status === 'APPROVED');

  const total_contributions_centavos = approvedSubmissions.reduce(
    (sum, s) => sum + Math.round(s.amount_centavos),
    0
  );

  const total_withdrawals_centavos = calculateTotalExecutedWithdrawals(withdrawals);
  const scheduled_withdrawals_centavos = calculateTotalPendingScheduledWithdrawals(withdrawals);

  const current_balance_centavos = calculateCurrentBalance(
    total_contributions_centavos,
    total_withdrawals_centavos
  );

  const projected_balance_centavos = calculateProjectedBalance(
    current_balance_centavos,
    scheduled_withdrawals_centavos
  );

  const today_contributions_centavos = approvedSubmissions
    .filter((s) => s.payment_date === today || s.work_date === today)
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);

  const month_contributions_centavos = approvedSubmissions
    .filter(
      (s) =>
        s.payment_date.startsWith(currentMonthPrefix) ||
        s.work_date.startsWith(currentMonthPrefix)
    )
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);

  return {
    total_contributions_centavos,
    total_withdrawals_centavos,
    current_balance_centavos,
    scheduled_withdrawals_centavos,
    projected_balance_centavos,
    members_count: totalMembersCount,
    today_contributions_centavos,
    month_contributions_centavos,
    last_updated: new Date().toISOString(),
  };
}
