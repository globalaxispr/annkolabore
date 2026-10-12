import { ContributionSubmission, ExpenseRecord, FinancialSummary, FinancialTransaction } from './types';

/**
 * Standard contribution amount per working day: R$ 10,00 (1000 centavos)
 */
export const DEFAULT_CONTRIBUTION_CENTAVOS = 1000;

/**
 * Calculate total approved contributions in centavos.
 * Only submissions with status === 'APPROVED' are counted.
 * Pending or Rejected submissions MUST NOT contribute to the total.
 */
export function calculateTotalApprovedContributions(submissions: ContributionSubmission[]): number {
  return submissions
    .filter((s) => s.status === 'APPROVED')
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);
}

/**
 * Calculate total expenses in centavos.
 */
export function calculateTotalExpenses(expenses: ExpenseRecord[]): number {
  return expenses.reduce((sum, e) => sum + Math.round(e.amount_centavos), 0);
}

/**
 * Calculate official current balance in centavos.
 * Formula: Opening Balance (0) + Approved Contributions - Recorded Expenses.
 */
export function calculateCurrentBalance(
  approvedContributionsCentavos: number,
  expensesCentavos: number,
  openingBalanceCentavos = 0
): number {
  return Math.round(openingBalanceCentavos + approvedContributionsCentavos - expensesCentavos);
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
  expenses: ExpenseRecord[],
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

  const total_expenses_centavos = expenses.reduce(
    (sum, e) => sum + Math.round(e.amount_centavos),
    0
  );

  const current_balance_centavos = calculateCurrentBalance(
    total_contributions_centavos,
    total_expenses_centavos
  );

  const today_contributions_centavos = approvedSubmissions
    .filter((s) => s.payment_date === today || s.work_date === today)
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);

  const month_contributions_centavos = approvedSubmissions
    .filter((s) => s.payment_date.startsWith(currentMonthPrefix) || s.work_date.startsWith(currentMonthPrefix))
    .reduce((sum, s) => sum + Math.round(s.amount_centavos), 0);

  return {
    total_contributions_centavos,
    total_expenses_centavos,
    current_balance_centavos,
    members_count: totalMembersCount,
    today_contributions_centavos,
    month_contributions_centavos,
  };
}
