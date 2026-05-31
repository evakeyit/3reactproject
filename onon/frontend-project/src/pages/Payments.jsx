import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

export default function Payments() {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const initialForm = {
    RecordID: '', PaymentDate: '', Amount: '', ReceivedBy: '',
  };

  const formFields = [
    { name: 'RecordID', label: 'Parcel Record', type: 'select', options: records.map((r) => ({ value: r.RecordID, label: `#${r.RecordID} - ${r.Description} (${Number(r.TransportFee).toLocaleString()} RWF)` })) },
    { name: 'PaymentDate', label: 'Payment Date', type: 'date' },
    { name: 'Amount', label: 'Amount (RWF)', type: 'number', step: '0.01', min: '0' },
    { name: 'ReceivedBy', label: 'Received By' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [payments, recordList] = await Promise.all([
        api.get('/payments'),
        api.get('/parcel-records'),
      ]);
      setData(payments.data);
      setRecords(recordList.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form, editing) => {
    const payload = {
      ...form,
      Amount: parseFloat(form.Amount) || 0,
    };
    if (editing) {
      await api.put(`/payments/${editing.PaymentID}`, payload);
    } else {
      await api.post('/payments', payload);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/payments/${id}`);
    await fetchData();
  };

  const renderCell = (key, item) => {
    if (key === 'PaymentDate') return new Date(item.PaymentDate).toLocaleDateString();
    if (key === 'Amount') return `${Number(item.Amount).toLocaleString()} RWF`;
    if (key === 'Route') return `${item.Departure} → ${item.Destination}`;
    return item[key];
  };

  return (
    <CrudPage
      title="Payments"
      description="Record and manage parcel transport payments"
      columns={[
        { key: 'PaymentID', label: 'ID' },
        { key: 'Description', label: 'Parcel' },
        { key: 'Route', label: 'Route' },
        { key: 'PaymentDate', label: 'Date' },
        { key: 'Amount', label: 'Amount' },
        { key: 'ReceivedBy', label: 'Received By' },
      ]}
      data={data}
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
      formFields={formFields}
      initialForm={initialForm}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onReport={() => navigate('/reports/payments')}
      idField="PaymentID"
      renderCell={renderCell}
      searchFields={['Description', 'ReceivedBy', 'Departure', 'Destination']}
    />
  );
}
