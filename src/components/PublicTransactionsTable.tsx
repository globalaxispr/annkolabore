import React from 'react';
import { formatBRL, formatDateCreole } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { Clock, CheckCircle2 } from 'lucide-react';

interface PublicTransactionItem {
  id: string;
  driver_name: string;
  amount_centavos: number;
  work_date: string;
  payment_date: string;
  approval_date: string;
  status: string;
}

interface PublicTransactionsTableProps {
  transactions: PublicTransactionItem[];
}

export const PublicTransactionsTable: React.FC<PublicTransactionsTableProps> = ({ transactions }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Dènye Kontribisyon yo</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lis tout kontribisyon chofè yo ki valide epi apwouve pa trezorye a
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Transparans Total
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="py-12 text-center text-slate-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-sm font-medium text-slate-600">Pa gen tranzaksyon pou kounye a</p>
          <p className="text-xs text-slate-400 mt-1">Lè yon kontribisyon apwouve, l ap parèt la a.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-5">Chofè</th>
                  <th className="py-3 px-5">Montan</th>
                  <th className="py-3 px-5">Dat Travay la</th>
                  <th className="py-3 px-5">Dat Peman an</th>
                  <th className="py-3 px-5">Dat Apwobasyon</th>
                  <th className="py-3 px-5">Eta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-5 font-semibold text-slate-900">
                      {t.driver_name}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-emerald-700">
                      {formatBRL(t.amount_centavos)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {formatDateCreole(t.work_date)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">
                      {formatDateCreole(t.payment_date)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">
                      {formatDateCreole(t.approval_date)}
                    </td>
                    <td className="py-3.5 px-5">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-sm">{t.driver_name}</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {formatBRL(t.amount_centavos)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Dat travay: {formatDateCreole(t.work_date)}</span>
                  <span>Peman: {formatDateCreole(t.payment_date)}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Apwouve: {formatDateCreole(t.approval_date)}
                  </span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
