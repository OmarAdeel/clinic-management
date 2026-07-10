import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Edit2, Trash2, ShieldCheck, UserMinus, ToggleLeft, ToggleRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import { Page, PageHeader } from '../components/ui/Page';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Field } from '../components/ui/Field';
import { useAuth } from '../context/AuthContext';

const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EGP', name: 'Egyptian Pound (ج.م)' },
  { code: 'SAR', name: 'Saudi Riyal (ر.س)' },
  { code: 'AED', name: 'UAE Dirham (د.إ)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const isRTL = i18n.dir() === 'rtl';

  // Currency state
  const [currency, setCurrency] = useState(localStorage.getItem('cms_currency') || 'USD');

  // Users state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'receptionist',
    is_active: true
  });
  
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load users
  const fetchUsers = async (searchTerm = '') => {
    try {
      setLoading(true);
      const res = await api.get(`/users?search=${encodeURIComponent(searchTerm)}`);
      setUsers(res.data.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(search);
  }, [search]);

  // Handle currency update
  const handleCurrencyChange = (e) => {
    const val = e.target.value;
    setCurrency(val);
    localStorage.setItem('cms_currency', val);
    // Reload dynamically to refresh all currency formatters instantly
    window.location.reload();
  };

  // Open Add/Edit Modal
  const openModal = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '', // blank by default on edit
        phone: user.phone || '',
        role: user.role,
        is_active: !!user.is_active
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'receptionist',
        is_active: true
      });
    }
    setFormError('');
    setShowModal(true);
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      if (selectedUser) {
        // Edit User
        await api.put(`/users/${selectedUser.id}`, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
          // Only send password if user filled it out to change it
          password: formData.password.trim() !== '' ? formData.password : undefined
        });
      } else {
        // Create User
        if (!formData.password) {
          throw new Error(t('Password is required for new users'));
        }
        await api.post('/users', formData);
      }
      
      setShowModal(false);
      fetchUsers(search);
    } catch (err) {
      setFormError(err.response?.data?.message || err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDelete = async (id) => {
    if (Number(id) === Number(currentUser.id)) {
      alert(t('settings.selfDeleteError'));
      return;
    }
    
    if (window.confirm(t('settings.deleteConfirm'))) {
      try {
        await api.delete(`/users/${id}`);
        fetchUsers(search);
      } catch (err) {
        alert(err.response?.data?.message || t('common.error'));
      }
    }
  };

  // Toggle user status direct
  const toggleUserStatus = async (user) => {
    if (Number(user.id) === Number(currentUser.id)) return;
    try {
      await api.put(`/users/${user.id}`, {
        is_active: !user.is_active
      });
      fetchUsers(search);
    } catch (err) {
      alert(err.response?.data?.message || t('common.error'));
    }
  };

  return (
    <Page>
      <PageHeader title={t('settings.title')} />

      <div className="space-y-6">
        {/* Currency setting card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('settings.currency')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.currencyDesc')}</p>
              </div>
              <div className="w-full shrink-0 md:w-64">
                <select
                  value={currency}
                  onChange={handleCurrencyChange}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* User Management card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-foreground">{t('settings.userManagement')}</h2>
                <p className="text-sm text-muted-foreground">{t('settings.userManagementDesc')}</p>
              </div>
              <Button onClick={() => openModal()} className="flex items-center gap-2 self-start sm:self-auto">
                <Plus className="h-4 w-4" />
                {t('settings.addUser')}
              </Button>
            </div>

            <div className="mt-6 flex items-center gap-3 rounded-lg border border-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </div>

            {/* Desktop Table View */}
            <div className="mt-4 hidden md:block overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-start text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                    <th className="px-4 py-3 text-start font-medium">{t('settings.fields.name')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('settings.fields.email')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('settings.fields.role')}</th>
                    <th className="px-4 py-3 text-start font-medium">{t('settings.fields.phone')}</th>
                    <th className="px-4 py-3 text-center font-medium">{t('settings.fields.isActive')}</th>
                    <th className="px-4 py-3 text-center font-medium">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted-foreground">
                        {t('common.loading')}
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-muted-foreground">
                        {t('common.noResults')}
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/10 transition-colors">
                        <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">
                          {u.name}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {u.email}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 capitalize text-muted-foreground">
                          {t(`roles.${u.role}`)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {u.phone || '—'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <button
                            disabled={Number(u.id) === Number(currentUser.id)}
                            onClick={() => toggleUserStatus(u)}
                            className="inline-flex rounded focus:outline-none disabled:opacity-50"
                          >
                            {u.is_active ? (
                              <ToggleRight className="h-6 w-6 text-primary" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                            )}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal(u)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title={t('common.edit')}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(u.id)}
                              disabled={Number(u.id) === Number(currentUser.id)}
                              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-red-500 disabled:opacity-40 disabled:hover:text-muted-foreground"
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mt-4 space-y-4 md:hidden">
              {loading ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('common.loading')}
                </div>
              ) : users.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  {t('common.noResults')}
                </div>
              ) : (
                users.map((u) => (
                  <div key={u.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{u.name}</h3>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold capitalize text-primary">
                        {t(`roles.${u.role}`)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-1 border-t border-muted/50">
                      <span>{t('settings.fields.phone')}: {u.phone || '—'}</span>
                      <div className="flex items-center gap-2">
                        <span>{t('settings.fields.isActive')}</span>
                        <button
                          disabled={Number(u.id) === Number(currentUser.id)}
                          onClick={() => toggleUserStatus(u)}
                          className="inline-flex rounded focus:outline-none disabled:opacity-50"
                        >
                          {u.is_active ? (
                            <ToggleRight className="h-6 w-6 text-primary" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-muted/30">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal(u)}
                        className="flex items-center gap-1 px-3 py-1.5"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={Number(u.id) === Number(currentUser.id)}
                        onClick={() => handleDelete(u.id)}
                        className="flex items-center gap-1 px-3 py-1.5 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Add / Edit User Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title={selectedUser ? t('settings.editUser') : t('settings.addUser')}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
                  {formError}
                </div>
              )}

              <Field label={t('settings.fields.name')} required>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>

              <Field label={t('settings.fields.email')} required>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>

              <Field
                label={t('settings.fields.password')}
                required={!selectedUser}
                hint={selectedUser ? t('Leave blank to keep current password') : undefined}
              >
                <input
                  type="password"
                  required={!selectedUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>

              <Field label={t('settings.fields.phone')}>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 555 0000"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </Field>

              <Field label={t('settings.fields.role')} required>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="admin">{t('roles.admin')}</option>
                  <option value="doctor">{t('roles.doctor')}</option>
                  <option value="receptionist">{t('roles.receptionist')}</option>
                  <option value="patient">{t('roles.patient')}</option>
                </select>
              </Field>

              {selectedUser && Number(selectedUser.id) !== Number(currentUser.id) && (
                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="isActiveCheck" className="text-sm font-medium text-foreground">
                    {t('settings.fields.isActive')}
                  </label>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('common.loading') : t('common.save')}
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </Page>
  );
}
