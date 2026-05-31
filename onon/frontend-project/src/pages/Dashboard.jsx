import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, Package, ClipboardList, CreditCard,
  Clock, Truck, CheckCircle, ArrowRight,
} from 'lucide-react';
import api from '../services/api';

const statCards = [
  { key: 'senders', label: 'Senders', icon: Users, color: 'bg-blue-500', link: '/senders' },
  { key: 'receivers', label: 'Receivers', icon: UserCheck, color: 'bg-purple-500', link: '/receivers' },
  { key: 'parcels', label: 'Parcels', icon: Package, color: 'bg-amber-500', link: '/parcels' },
  { key: 'records', label: 'Records', icon: ClipboardList, color: 'bg-green-500', link: '/parcel-records' },
  { key: 'payments', label: 'Payments', icon: CreditCard, color: 'bg-rose-500', link: '/payments' },
  { key: 'totalRevenue', label: 'Revenue (RWF)', icon: CreditCard, color: 'bg-primary-600', format: (v) => Number(v).toLocaleString() },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/dashboard')
      .then(({ data: d }) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of TransitPro Rwanda parcel delivery operations
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(({ key, label, icon: Icon, color, link, format }) => (
          <div key={key} className="card flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {format ? format(stats[key]) : stats[key] ?? 0}
              </p>
            </div>
            {link && (
              <Link to={link} className="text-primary-600 hover:text-primary-700">
                <ArrowRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-3">
          <Clock className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-xl font-bold">{stats.pending ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <Truck className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="text-xl font-bold">{stats.inTransit ?? 0}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-xl font-bold">{stats.delivered ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Parcel Records</h2>
        {data?.recentRecords?.length === 0 ? (
          <p className="text-sm text-gray-500">No records yet</p>
        ) : (
          <div className="table-container border-0 shadow-none">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Route</th>
                  <th>Date</th>
                  <th>Fee</th>
                  <th>Delivery</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.recentRecords?.map((r) => (
                  <tr key={r.RecordID}>
                    <td>{r.Description}</td>
                    <td>{r.Departure} → {r.Destination}</td>
                    <td>{new Date(r.RecordDate).toLocaleDateString()}</td>
                    <td>{Number(r.TransportFee).toLocaleString()} RWF</td>
                    <td><span className="badge-blue">{r.DeliveryStatus}</span></td>
                    <td><span className="badge-green">{r.PaymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
