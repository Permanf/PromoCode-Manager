import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export type DatePreset = 'today' | '7days' | '30days' | 'custom';

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  switch (preset) {
    case 'today':
      return {
        dateFrom: format(startOfDay(now), 'yyyy-MM-dd'),
        dateTo: format(endOfDay(now), 'yyyy-MM-dd'),
      };
    case '7days':
      return {
        dateFrom: format(subDays(now, 7), 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
    case '30days':
      return {
        dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
    default:
      return {
        dateFrom: format(subDays(now, 30), 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
  }
}

interface DateFilterProps {
  preset: DatePreset;
  dateFrom: string;
  dateTo: string;
  onPresetChange: (preset: DatePreset) => void;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
}

export function DateFilter({
  preset,
  dateFrom,
  dateTo,
  onPresetChange,
  onDateFromChange,
  onDateToChange,
}: DateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-4">
      <span className="text-sm font-medium text-slate-700">Date range:</span>
      <div className="flex gap-2">
        {(['today', '7days', '30days', 'custom'] as const).map((p) => (
          <button
            key={p}
            onClick={() => {
              onPresetChange(p);
              if (p !== 'custom') {
                const r = getPresetRange(p);
                onDateFromChange(r.dateFrom);
                onDateToChange(r.dateTo);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              preset === p
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            {p === 'today' ? 'Today' : p === '7days' ? '7 days' : p === '30days' ? '30 days' : 'Custom'}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      )}
    </div>
  );
}
