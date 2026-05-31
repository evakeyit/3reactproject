import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CrudPage from '../components/CrudPage';
import api from '../services/api';

const initialForm = { Name: '', Phone: '' };
const formFields = [
  { name: 'Name', label: 'Full Name' },
  { name: 'Phone', label: 'Phone Number' },
];

export default function Receivers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const { data: rows } = await api.get('/receivers');
      setData(rows);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load receivers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (form, editing) => {
    if (editing) {
      await api.put(`/receivers/${editing.ReceiverID}`, form);
    } else {
      await api.post('/receivers', form);
    }
    await fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/receivers/${id}`);
    await fetchData();
  };

  return (
    <CrudPage
      title="Receivers"
      description="Manage parcel receivers"
      columns={[
        { key: 'ReceiverID', label: 'ID' },
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
      onReport={() => navigate('/reports/receivers')}
      idField="ReceiverID"
      searchFields={['Name', 'Phone']}
    />
  );
}
