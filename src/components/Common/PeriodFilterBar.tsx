import React from 'react';
import { Calendar, BarChart3, Filter } from 'lucide-react';
import { TimePeriod, getPeriodLabel } from '../../utils/datePeriods';

interface PeriodFilterBarProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  title?: string;
  summaryText?: string;
  className?: string;
}

export const PeriodFilterBar: React.FC<PeriodFilterBarProps> = ({
  selectedPeriod,
  onPeriodChange,
  title = 'Pilih Periode Rekapitulasi:',
  summaryText,
  className = '',
}) => {
  const options: { id: TimePeriod; label: string }[] = [
    { id: 'week', label: 'Per Minggu' },
    { id: 'month', label: 'Per Bulan' },
    { id: 'year', label: 'Per Tahun' },
    { id: 'all', label: 'Semua Data' },
  ];

  return (
    <div
      className={`bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <BarChart3 className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            {title}
          </span>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{getPeriodLabel(selectedPeriod)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
        {options.map((opt) => {
          const isActive = selectedPeriod === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onPeriodChange(opt.id)}
              className={`px-3 py-1.5 text-xs rounded-xl font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 scale-105'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          );
        })}

        {summaryText && (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-xl ml-1">
            {summaryText}
          </span>
        )}
      </div>
    </div>
  );
};
