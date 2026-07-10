import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import api, { fetcher } from '../../lib/api'
import Button from '../ui/Button'
import { Field, Input, Select } from '../ui/Field'
import { formatMoney } from '../../lib/format'

const EMPTY_ITEM = { description: '', qty: 1, unit_price: '' }

export default function InvoiceForm({ onDone, onCancel }) {
  const { t } = useTranslation()
  const [patientId, setPatientId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const [discount, setDiscount] = useState('')
  const [tax, setTax] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: patients } = useSWR('/patients?limit=100', fetcher)

  const setItem = (i, k) => (e) =>
    setItems((its) => its.map((it, idx) => (idx === i ? { ...it, [k]: e.target.value } : it)))

  const subtotal = items.reduce((sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0)
  const total = Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await api.post('/invoices', {
        patient_id: Number(patientId),
        items: items
          .filter((it) => it.description.trim())
          .map((it) => ({
            description: it.description,
            qty: Number(it.qty) || 1,
            unit_price: Number(it.unit_price) || 0,
          })),
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
      })
      onDone()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('appointments.patient')} htmlFor="inv-patient">
        <Select id="inv-patient" required value={patientId} onChange={(e) => setPatientId(e.target.value)}>
          <option value="">{t('appointments.selectPatient')}</option>
          {(patients?.data || []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.full_name}
            </option>
          ))}
        </Select>
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">{t('billing.lineItems')}</legend>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-40 flex-1">
                <Field label={t('billing.description')} htmlFor={`it-desc-${i}`}>
                  <Input id={`it-desc-${i}`} required value={it.description} onChange={setItem(i, 'description')} />
                </Field>
              </div>
              <div className="w-20">
                <Field label={t('billing.qty')} htmlFor={`it-qty-${i}`}>
                  <Input id={`it-qty-${i}`} type="number" min="1" dir="ltr" value={it.qty} onChange={setItem(i, 'qty')} />
                </Field>
              </div>
              <div className="w-28">
                <Field label={t('billing.unitPrice')} htmlFor={`it-price-${i}`}>
                  <Input
                    id={`it-price-${i}`}
                    type="number"
                    min="0"
                    step="0.01"
                    dir="ltr"
                    required
                    value={it.unit_price}
                    onChange={setItem(i, 'unit_price')}
                  />
                </Field>
              </div>
              <div className="w-24 pb-2 text-end text-sm font-medium text-foreground">
                {formatMoney((Number(it.qty) || 0) * (Number(it.unit_price) || 0))}
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setItems((its) => its.filter((_, idx) => idx !== i))}
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={() => setItems((its) => [...its, { ...EMPTY_ITEM }])}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('billing.addItem')}
        </Button>
      </fieldset>

      <div className="grid grid-cols-2 gap-4">
        <Field label={t('billing.discount')} htmlFor="inv-discount">
          <Input id="inv-discount" type="number" min="0" step="0.01" dir="ltr" value={discount} onChange={(e) => setDiscount(e.target.value)} />
        </Field>
        <Field label={t('billing.tax')} htmlFor="inv-tax">
          <Input id="inv-tax" type="number" min="0" step="0.01" dir="ltr" value={tax} onChange={(e) => setTax(e.target.value)} />
        </Field>
      </div>

      <div className="space-y-1 rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>{t('billing.subtotal')}</span>
          <span>{formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between font-semibold text-foreground">
          <span>{t('common.total')}</span>
          <span>{formatMoney(total)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={saving || !patientId}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
