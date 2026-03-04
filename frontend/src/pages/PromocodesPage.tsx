import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { promocodesApi } from '../lib/api';
import { Layout } from '../components/Layout';

const createSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  discountPercent: z.number().min(1).max(100),
  totalLimit: z.number().min(0),
  perUserLimit: z.number().min(0),
});

type CreateFormData = z.infer<typeof createSchema>;

export function PromocodesPage() {
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: promocodes, isLoading } = useQuery({
    queryKey: ['promocodes'],
    queryFn: promocodesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) =>
      promocodesApi.create({
        code: data.code,
        discountPercent: data.discountPercent,
        totalLimit: data.totalLimit,
        perUserLimit: data.perUserLimit,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promocodes'] });
      toast.success('Promocode created');
      setShowForm(false);
      reset();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: promocodesApi.deactivate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promocodes'] });
      toast.success('Promocode deactivated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { totalLimit: 0, perUserLimit: 0, discountPercent: 10 },
  });

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Manage Promocodes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : 'Create Promocode'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">New Promocode</h2>
          <form
            onSubmit={handleSubmit((d) => createMutation.mutate(d))}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
              <input
                {...register('code')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="SUMMER2024"
              />
              {errors.code && (
                <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Discount %</label>
              <input
                {...register('discountPercent', { valueAsNumber: true })}
                type="number"
                min={1}
                max={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
              {errors.discountPercent && (
                <p className="mt-1 text-sm text-red-600">{errors.discountPercent.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Limit</label>
              <input
                {...register('totalLimit', { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Per User Limit</label>
              <input
                {...register('perUserLimit', { valueAsNumber: true })}
                type="number"
                min={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Discount %</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Total Limit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Per User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(promocodes ?? []).map((p) => (
                <tr key={p._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.discountPercent}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.totalLimit}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{p.perUserLimit}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isActive && (
                      <button
                        onClick={() => deactivateMutation.mutate(p._id)}
                        disabled={deactivateMutation.isPending}
                        className="text-sm text-red-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    )}
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
