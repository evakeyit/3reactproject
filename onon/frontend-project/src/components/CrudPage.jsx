import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, FileBarChart } from 'lucide-react';
import Modal from './Modal';
import Alert from './Alert';

export default function CrudPage({
  title,
  description,
  columns,
  data,
  loading,
  error,
  onErrorDismiss,
  formFields,
  initialForm,
  onSubmit,
  onDelete,
  onReport,
  reportPath,
  idField,
  renderCell,
  searchFields = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [formError, setFormError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm(initialForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm(formFields.reduce((acc, f) => ({ ...acc, [f.name]: item[f.name] ?? '' }), {}));
    setFormError('');
    setModalOpen(true);
  };

  const openDelete = (item) => {
    setDeleting(item);
    setDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit(form, editing);
      setModalOpen(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await onDelete(deleting[idField]);
      setDeleteModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Delete failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = data.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return searchFields.some((field) =>
      String(item[field] ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {onReport && (
            <button onClick={onReport} className="btn-secondary">
              <FileBarChart className="h-4 w-4" />
              Report
            </button>
          )}
          {reportPath && (
            <a href={reportPath} className="btn-secondary">
              <FileBarChart className="h-4 w-4" />
              Report
            </a>
          )}
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={onErrorDismiss} />}

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-500">No records found</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((item) => (
                <tr key={item[idField]}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {renderCell ? renderCell(col.key, item) : item[col.key]}
                    </td>
                  ))}
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="rounded-lg p-2 text-primary-600 hover:bg-primary-50"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDelete(item)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${title.slice(0, -1) || title}` : `Add ${title.slice(0, -1) || title}`}
      >
        {formError && <Alert type="error" message={formError} />}
        <form onSubmit={handleSubmit} className="space-y-4">
          {formFields.map((field) => (
            <div key={field.name}>
              <label className="label-field">{field.label}</label>
              {field.type === 'select' ? (
                <select
                  className="input-field"
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required !== false}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  className="input-field"
                  rows={3}
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required !== false}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  className="input-field"
                  value={form[field.name]}
                  onChange={(e) => setForm({ ...form, [field.name]: e.target.value })}
                  required={field.required !== false}
                  step={field.step}
                  min={field.min}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Delete" size="sm">
        <p className="mb-4 text-sm text-gray-600">
          Are you sure you want to delete this record? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteModal(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleDelete} disabled={submitting} className="btn-danger">
            {submitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
