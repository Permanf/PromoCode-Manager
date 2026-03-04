import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsParams } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { DateFilter, getPresetRange, type DatePreset } from '../../components/DateFilter';

export function UsersAnalyticsPage() {
  const [preset, setPreset] = useState<DatePreset>('30days');
  const range = useMemo(() => getPresetRange(preset), [preset]);
  const [dateFrom, setDateFrom] = useState(range.dateFrom);
  const [dateTo, setDateTo] = useState(range.dateTo);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const params: AnalyticsParams = {
    page,
    pageSize,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'users', params],
    queryFn: () => analyticsApi.users(params),
  });

  const toggleSort = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const Th = ({ col, label }: { col: string; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase cursor-pointer hover:bg-slate-100"
      onClick={() => toggleSort(col)}
    >
      {label} {sortBy === col && (sortOrder === 'asc' ? '↑' : '↓')}
    </th>
  );

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Users Analytics</h1>
      <DateFilter
        preset={preset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPresetChange={setPreset}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />
      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <Th col="email" label="Email" />
                    <Th col="name" label="Name" />
                    <Th col="totalOrders" label="Orders" />
                    <Th col="totalSpent" label="Total Spent" />
                    <Th col="promoCodesUsed" label="Promos Used" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(data?.data ?? []).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">{row.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{row.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.totalOrders}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.totalSpent?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.promoCodesUsed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 flex items-center justify-between border-t border-slate-200">
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-600">
                  Total: {data?.total ?? 0} | Page {data?.page ?? 1} of{' '}
                  {Math.ceil((data?.total ?? 0) / pageSize) || 1}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="text-sm border border-slate-300 rounded px-2 py-1"
                >
                  {[10, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} per page
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil((data?.total ?? 0) / pageSize)}
                  className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
