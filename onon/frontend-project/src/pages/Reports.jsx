import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, FileBarChart } from 'lucide-react';
import api from '../services/api';

const reportConfig = {
  senders: {
    title: 'Senders Report',
    endpoint: '/senders/report/summary',
    description: 'Summary of all registered senders',
  },
  receivers: {
    title: 'Receivers Report',
    endpoint: '/receivers/report/summary',
    description: 'Summary of all registered receivers',
  },
  parcels: {
    title: 'Parcels Report',
    endpoint: '/parcels/report/summary',
    description: 'Parcel shipment statistics and routes',
  },
  'parcel-records': {
    title: 'Parcel Records Report',
    endpoint: '/parcel-records/report/summary',
    description: 'Delivery and payment status overview',
  },
  payments: {
    title: 'Payments Report',
    endpoint: '/payments/report/summary',
    description: 'Payment collection summary',
  },
};

function ReportDetail({ module }) {
  const config = reportConfig[module];
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config) return;
    api.get(config.endpoint)
      .then(({ data: d }) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [config, module]);

  if (!config) {
    return <div className="text-center text-gray-500">Report not found</div>;
  }

  const handlePrint = () => window.print();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-4">
        <button onClick={() => navigate('/reports')} className="btn-secondary">
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </button>
        <button onClick={handlePrint} className="btn-primary">
          <Printer className="h-4 w-4" />
          Print Report
        </button>
      </div>

      <div className="card print:shadow-none">
        <div className="mb-6 border-b border-gray-200 pb-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">TransitPro Rwanda Ltd</h1>
          <h2 className="mt-1 text-lg font-semibold text-primary-600">{config.title}</h2>
          <p className="text-sm text-gray-500">{config.description}</p>
          <p className="mt-2 text-xs text-gray-400">
            Generated on {new Date().toLocaleString()}
          </p>
        </div>

        {module === 'senders' && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-600">Total Senders</p>
                <p className="text-3xl font-bold text-blue-900">{data.total}</p>
              </div>
            </div>
            <h3 className="mb-3 font-semibold">Recent Senders</h3>
            <ReportTable
              headers={['ID', 'Name', 'Phone', 'Registered']}
              rows={data.recent?.map((r) => [
                r.SenderID, r.Name, r.Phone, new Date(r.CreatedAt).toLocaleDateString(),
              ])}
            />
            {data.byMonth?.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 font-semibold">Registrations by Month</h3>
                <ReportTable
                  headers={['Month', 'Count']}
                  rows={data.byMonth.map((r) => [r.month, r.count])}
                />
              </>
            )}
          </>
        )}

        {module === 'receivers' && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-purple-50 p-4">
                <p className="text-sm text-purple-600">Total Receivers</p>
                <p className="text-3xl font-bold text-purple-900">{data.total}</p>
              </div>
            </div>
            <h3 className="mb-3 font-semibold">Recent Receivers</h3>
            <ReportTable
              headers={['ID', 'Name', 'Phone', 'Registered']}
              rows={data.recent?.map((r) => [
                r.ReceiverID, r.Name, r.Phone, new Date(r.CreatedAt).toLocaleDateString(),
              ])}
            />
            {data.byMonth?.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 font-semibold">Registrations by Month</h3>
                <ReportTable
                  headers={['Month', 'Count']}
                  rows={data.byMonth.map((r) => [r.month, r.count])}
                />
              </>
            )}
          </>
        )}

        {module === 'parcels' && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-amber-50 p-4">
                <p className="text-sm text-amber-600">Total Parcels</p>
                <p className="text-3xl font-bold text-amber-900">{data.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Total Weight</p>
                <p className="text-3xl font-bold text-green-900">{Number(data.totalWeight).toFixed(2)} kg</p>
              </div>
            </div>
            {data.byRoute?.length > 0 && (
              <>
                <h3 className="mb-3 font-semibold">Parcels by Route</h3>
                <ReportTable
                  headers={['Departure', 'Destination', 'Count', 'Total Weight (kg)']}
                  rows={data.byRoute.map((r) => [r.Departure, r.Destination, r.count, Number(r.totalWeight).toFixed(2)])}
                />
              </>
            )}
            <h3 className="mb-3 mt-6 font-semibold">Recent Parcels</h3>
            <ReportTable
              headers={['ID', 'Description', 'Weight', 'Route', 'Sender', 'Receiver']}
              rows={data.recent?.map((r) => [
                r.ParcelID, r.Description, `${r.Weight} kg`,
                `${r.Departure} → ${r.Destination}`, r.SenderName || '—', r.ReceiverName || '—',
              ])}
            />
          </>
        )}

        {module === 'parcel-records' && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-600">Total Records</p>
                <p className="text-3xl font-bold text-blue-900">{data.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-900">{Number(data.totalRevenue).toLocaleString()} RWF</p>
              </div>
            </div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 font-semibold">By Delivery Status</h3>
                <ReportTable
                  headers={['Status', 'Count']}
                  rows={data.byDelivery?.map((r) => [r.DeliveryStatus, r.count])}
                />
              </div>
              <div>
                <h3 className="mb-3 font-semibold">By Payment Status</h3>
                <ReportTable
                  headers={['Status', 'Count']}
                  rows={data.byPayment?.map((r) => [r.PaymentStatus, r.count])}
                />
              </div>
            </div>
            <h3 className="mb-3 font-semibold">Recent Records</h3>
            <ReportTable
              headers={['ID', 'Parcel', 'Route', 'Date', 'Fee', 'Delivery', 'Payment']}
              rows={data.recent?.map((r) => [
                r.RecordID, r.Description, `${r.Departure} → ${r.Destination}`,
                new Date(r.RecordDate).toLocaleDateString(),
                `${Number(r.TransportFee).toLocaleString()} RWF`,
                r.DeliveryStatus, r.PaymentStatus,
              ])}
            />
          </>
        )}

        {module === 'payments' && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-rose-50 p-4">
                <p className="text-sm text-rose-600">Total Payments</p>
                <p className="text-3xl font-bold text-rose-900">{data.total}</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-600">Total Collected</p>
                <p className="text-3xl font-bold text-green-900">{Number(data.totalAmount).toLocaleString()} RWF</p>
              </div>
            </div>
            {data.byReceiver?.length > 0 && (
              <>
                <h3 className="mb-3 font-semibold">Collections by Staff</h3>
                <ReportTable
                  headers={['Received By', 'Count', 'Total Amount (RWF)']}
                  rows={data.byReceiver.map((r) => [r.ReceivedBy, r.count, Number(r.totalAmount).toLocaleString()])}
                />
              </>
            )}
            {data.byMonth?.length > 0 && (
              <>
                <h3 className="mb-3 mt-6 font-semibold">Payments by Month</h3>
                <ReportTable
                  headers={['Month', 'Count', 'Amount (RWF)']}
                  rows={data.byMonth.map((r) => [r.month, r.count, Number(r.totalAmount).toLocaleString()])}
                />
              </>
            )}
            <h3 className="mb-3 mt-6 font-semibold">Recent Payments</h3>
            <ReportTable
              headers={['ID', 'Parcel', 'Date', 'Amount', 'Received By']}
              rows={data.recent?.map((r) => [
                r.PaymentID, r.Description,
                new Date(r.PaymentDate).toLocaleDateString(),
                `${Number(r.Amount).toLocaleString()} RWF`, r.ReceivedBy,
              ])}
            />
          </>
        )}
      </div>
    </div>
  );
}

function ReportTable({ headers, rows = [] }) {
  if (!rows?.length) return <p className="text-sm text-gray-500">No data available</p>;
  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {rows.map((row, i) => (
            <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const { module } = useParams();

  if (module) {
    return <ReportDetail module={module} />;
  }

  const modules = Object.entries(reportConfig);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          Generate and print reports for each module
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(([key, config]) => (
          <Link
            key={key}
            to={`/reports/${key}`}
            className="card flex items-start gap-4 transition hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
              <FileBarChart className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{config.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{config.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
