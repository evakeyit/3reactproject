import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

const deliveryOptions = [
  { value: 'Pending', label: 'Pending' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const paymentOptions = [
  { value: 'Unpaid', label: 'Unpaid' },
  { value: 'Partial', label: 'Partial' },
  { value: 'Paid', label: 'Paid' },
];

export default function ParcelRecords() {
  const [data, setData] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const initialForm = {
    ParcelID: '', RecordDate: '', TransportFee: '', DeliveryStatus: 'Pending', PaymentStatus: 'Unpaid',
  };

  const formFields = [
    { name: 'ParcelID', label: 'Parcel', type: 'select', options: parcels.map((p) => ({ value: p.ParcelID, label: `#${p.ParcelID} - ${p.Description} (${p.Departure} → ${p.Destination})` })) },
    { name: 'RecordDate', label: 'Record Date', type: 'date' },
    { name: 'TransportFee', label: 'Transport Fee (RWF)', type: 'number', step: '0.01', min: '0' },
    { name: 'DeliveryStatus', label: 'Delivery Status', type: 'select', options: deliveryOptions },
    { name: 'PaymentStatus', label: 'Payment Status', type: 'select', options: paymentOptions },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [records, parcelList] = await Promise.all([
        api.get('/parcel-records'),
        api.get('/parcels'),
      ]);
      setData(records.data);
      setParcels(parcelList.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form, editing) => {
    const payload = {
      ...form,
      TransportFee: parseFloat(form.TransportFee) || 0,
    };
    if (editing) {
      await api.put(`/parcel-records/${editing.RecordID}`, payload);
    } else {
      await api.post('/parcel-records', payload);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/parcel-records/${id}`);
    await fetchData();
  };

  const renderCell = (key, item) => {
    if (key === 'RecordDate') return new Date(item.RecordDate).toLocaleDateString();
    if (key === 'TransportFee') return `${Number(item.TransportFee).toLocaleString()} RWF`;
    if (key === 'DeliveryStatus') {
      const cls = { Pending: 'badge-yellow', 'In Transit': 'badge-blue', Delivered: 'badge-green', Cancelled: 'badge-red' };
      return <span className={cls[item.DeliveryStatus] || 'badge-gray'}>{item.DeliveryStatus}</span>;
    }
    if (key === 'PaymentStatus') {
      const cls = { Unpaid: 'badge-red', Partial: 'badge-yellow', Paid: 'badge-green' };
      return <span className={cls[item.PaymentStatus] || 'badge-gray'}>{item.PaymentStatus}</span>;
    }
    if (key === 'Route') return `${item.Departure} → ${item.Destination}`;
    return item[key];
  };

  return (
    <CrudPage
      title="Parcel Records"
      description="Track delivery status and transport fees"
      columns={[
        { key: 'RecordID', label: 'ID' },
        { key: 'Description', label: 'Parcel' },
        { key: 'Route', label: 'Route' },
        { key: 'RecordDate', label: 'Date' },
        { key: 'TransportFee', label: 'Fee' },
        { key: 'DeliveryStatus', label: 'Delivery' },
        { key: 'PaymentStatus', label: 'Payment' },
      ]}
      data={data}
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
      formFields={formFields}
      initialForm={initialForm}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onReport={() => navigate('/reports/parcel-records')}
      idField="RecordID"
      renderCell={renderCell}
      searchFields={['Description', 'Departure', 'Destination', 'DeliveryStatus', 'PaymentStatus']}
    />
  );
}
