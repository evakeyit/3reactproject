import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

const initialForm = { Name: '', Phone: '' };
const formFields = [
  { name: 'Name', label: 'Full Name' },
  { name: 'Phone', label: 'Phone Number' },
];

export default function Senders() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const { data: rows } = await api.get('/senders');
      setData(rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load senders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form, editing) => {
    if (editing) {
      await api.put(`/senders/${editing.SenderID}`, form);
    } else {
      await api.post('/senders', form);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/senders/${id}`);
    await fetchData();
  };

  return (
    <CrudPage
      title="Senders"
      description="Manage parcel senders"
      columns={[
        { key: 'SenderID', label: 'ID' },
        { key: 'Name', label: 'Name' },
        { key: 'Phone', label: 'Phone' },
      ]}
      data={data}
      loading={loading}
      error={error}
      onErrorDismiss={() => setError('')}
      formFields={formFields}
      initialForm={initialForm}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      onReport={() => navigate('/reports/senders')}
      idField="SenderID"
      searchFields={['Name', 'Phone']}
    />
  );
}
