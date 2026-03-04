import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ordersApi } from '../lib/api';
import { Layout } from '../components/Layout';

export function OrdersPage() {
  const [amount, setAmount] = useState('');
  const [applyOrderId, setApplyOrderId] = useState<string | null>(null);
  const [applyCode, setApplyCode] = useState('');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (amt: number) => ordersApi.create(amt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order created');
      setAmount('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const applyMutation = useMutation({
    mutationFn: ({ orderId, code }: { orderId: string; code: string }) =>
      ordersApi.applyPromocode(orderId, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Promocode applied');
      setApplyOrderId(null);
      setApplyCode('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    createMutation.mutate(num);
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>

      <div className="mb-6 p-6 bg-white rounded-lg shadow border border-slate-200">
        <h2 className="text-lg font-semibold mb-4">Create Order</h2>
        <form onSubmit={handleCreate} className="flex gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg w-32"
              placeholder="100.00"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Order'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Discount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Promocode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(orders ?? []).map((o) => (
                <tr key={o._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {format(new Date(o.createdAt), 'yyyy-MM-dd HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{o.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{o.discountAmount?.toFixed(2) ?? '0'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {o.promocodeId ? 'Applied' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {!o.promocodeId ? (
                      applyOrderId === o._id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={applyCode}
                            onChange={(e) => setApplyCode(e.target.value)}
                            placeholder="PROMOCODE"
                            className="px-2 py-1 border border-slate-300 rounded text-sm w-28"
                          />
                          <button
                            onClick={() => applyMutation.mutate({ orderId: o._id, code: applyCode })}
                            disabled={!applyCode.trim() || applyMutation.isPending}
                            className="text-sm text-indigo-600 hover:underline disabled:opacity-50"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => {
                              setApplyOrderId(null);
                              setApplyCode('');
                            }}
                            className="text-sm text-slate-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setApplyOrderId(o._id)}
                          className="text-sm text-indigo-600 hover:underline"
                        >
                          Apply promocode
                        </button>
                      )
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
