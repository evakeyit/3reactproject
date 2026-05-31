import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

const RWANDA_CITIES = [
  'Kigali', 'Musanze', 'Rubavu', 'Huye', 'Rusizi', 'Nyagatare',
  'Muhanga', 'Karongi', 'Rwamagana', 'Kayonza',
];

export default function Parcels() {
  const [data, setData] = useState([]);
  const [senders, setSenders] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const initialForm = {
    Description: '', Weight: '', Departure: '', Destination: '', SenderID: '', ReceiverID: '',
  };

  const formFields = [
    { name: 'Description', label: 'Description', type: 'textarea' },
    { name: 'Weight', label: 'Weight (kg)', type: 'number', step: '0.01', min: '0.01' },
    { name: 'Departure', label: 'Departure City', type: 'select', options: RWANDA_CITIES.map((c) => ({ value: c, label: c })) },
    { name: 'Destination', label: 'Destination City', type: 'select', options: RWANDA_CITIES.map((c) => ({ value: c, label: c })) },
    { name: 'SenderID', label: 'Sender', type: 'select', required: false, options: senders.map((s) => ({ value: s.SenderID, label: `${s.Name} (${s.Phone})` })) },
    { name: 'ReceiverID', label: 'Receiver', type: 'select', required: false, options: receivers.map((r) => ({ value: r.ReceiverID, label: `${r.Name} (${r.Phone})` })) },
  ];

  const fetchData = useCallback(async () => {
    try {
      const [parcels, snd, rcv] = await Promise.all([
        api.get('/parcels'),
        api.get('/senders'),
        api.get('/receivers'),
      ]);
      setData(parcels.data);
      setSenders(snd.data);
      setReceivers(rcv.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load parcels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form, editing) => {
    const payload = {
      ...form,
      Weight: parseFloat(form.Weight),
      SenderID: form.SenderID || null,
      ReceiverID: form.ReceiverID || null,
    };
    if (editing) {
      await api.put(`/parcels/${editing.ParcelID}`, payload);
    } else {
      await api.post('/parcels', payload);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/parcels/${id}`);
    await fetchData();
  };

  const renderCell = (key, item) => {
    if (key === 'Weight') return `${item.Weight} kg`;
    if (key === 'Route') return `${item.Departure} → ${item.Destination}`;
    if (key === 'SenderName') return item.SenderName || '—';
    if (key === 'ReceiverName') return item.ReceiverName || '—';
    return item[key];
  };

  return (
    <CrudPage
      title="Parcels"
      description="Manage inter-city parcel shipments"
      columns={[
        { key: 'ParcelID', label: 'ID' },
        { key: 'Description', label: 'Description' },
        { key: 'Weight', label: 'Weight' },
        { key: 'Route', label: 'Route' },
        { key: 'SenderName', label: 'Sender' },
        { key: 'ReceiverName', label: 'Receiver' },
      ]}
      data={data}
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
      formFields={formFields}
      initialForm={initialForm}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onReport={() => navigate('/reports/parcels')}
      idField="ParcelID"
      renderCell={renderCell}
      searchFields={['Description', 'Departure', 'Destination', 'SenderName', 'ReceiverName']}
    />
  );
}
