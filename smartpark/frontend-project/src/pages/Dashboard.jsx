import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Wrench, 
  Car, 
  FileText, 
  CreditCard, 
  TrendingUp,
  ArrowUpRight,
  Clock
} from 'lucide-react';
import axios from 'axios';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/reports');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = [
    {
      name: 'Total Services',
      value: data?.totalServices || 0,
      icon: Wrench,
      color: 'bg-blue-500',
      link: '/services'
    },
    {
      name: 'Total Cars',
      value: data?.totalCars || 0,
      icon: Car,
      color: 'bg-green-500',
      link: '/cars'
    },
    {
      name: 'Service Records',
      value: data?.totalRecords || 0,
      icon: FileText,
      color: 'bg-purple-500',
      link: '/service-records'
    },
    {
      name: 'Total Payments',
      value: `$${(data?.totalPayments || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-orange-500',
      link: '/payments'
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.link}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
              View details
              <ArrowUpRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Service Records</h2>
          </div>
          <div className="p-6">
            {data?.recentRecords?.length > 0 ? (
              <div className="space-y-4">
                {data.recentRecords.map((record) => (
                  <div key={record.RecordNumber} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 p-2 rounded-lg">
                        <FileText className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{record.ServiceName || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{record.PlateNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(record.SeviceDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent service records</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Payments</h2>
          </div>
          <div className="p-6">
            {data?.recentPayments?.length > 0 ? (
              <div className="space-y-4">
                {data.recentPayments.map((payment) => (
                  <div key={payment.PaymentNumber} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CreditCard className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment {payment.PaymentNumber}</p>
                        <p className="text-sm text-gray-500">{payment.PlateNumber || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${payment.AmountPaid.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(payment.PaymentDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent payments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
