import { useState } from 'react'
import useSWR from 'swr'
import { useTranslation } from 'react-i18next'
import { Loader2, Printer, Ban, HeartPulse } from 'lucide-react'
import api, { fetcher } from '../../lib/api'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import { Field, Input, Select } from '../ui/Field'
import { TableSkeleton } from '../ui/Skeleton'
import { formatDate, formatMoney } from '../../lib/format'

export default function InvoiceDetail({ invoiceId, onClose, onChanged }) {
  const { t } = useTranslation()
  const { data, mutate } = useSWR(`/invoices/${invoiceId}`, fetcher)
  const [payAmount, setPayAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')

  const invoice = data?.invoice
  const paid = (data?.payments || []).reduce((s, p) => s + Number(p.amount), 0)
  const balance = invoice ? Number(invoice.total) - paid : 0
  const canPay = invoice && !['paid', 'cancelled'].includes(invoice.status)

  const recordPayment = async (e) => {
    e.preventDefault()
    setError('')
    setPaying(true)
    try {
      await api.post(`/invoices/${invoiceId}/payments`, {
        amount: Number(payAmount),
        method,
      })
      setPayAmount('')
      mutate()
      onChanged()
    } catch (err) {
      setError(err.response?.data?.message || t('common.error'))
    } finally {
      setPaying(false)
    }
  }

  const cancel = async () => {
    if (!window.confirm(t('billing.cancelConfirm'))) return
    await api.patch(`/invoices/${invoiceId}/cancel`)
    mutate()
    onChanged()
  }

  return (
    <Modal open onClose={onClose} title={t('billing.invoices')} wide>
      {!data ? (
        <TableSkeleton rows={5} />
      ) : (
        <div className="space-y-5">
          {/* Printable invoice */}
          <div className="print-area rounded-xl border border-border p-5">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground print:bg-transparent print:text-foreground">
                  <HeartPulse className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t('app.name')}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">
                    {invoice.invoice_number}
                  </p>
                </div>
              </div>
              <div className="text-end">
                <Badge status={invoice.status}>{t(`billing.statuses.${invoice.status}`)}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(invoice.created_at)}</p>
              </div>
            </div>

            <div className="mb-4 text-sm">
              <p className="text-xs text-muted-foreground">{t('billing.billedTo')}</p>
              <p className="font-medium text-foreground">{invoice.patient_name}</p>
              {invoice.patient_phone && (
                <p className="text-muted-foreground" dir="ltr">
                  {invoice.patient_phone}
                </p>
              )}
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2 text-start font-medium">{t('billing.description')}</th>
                  <th className="py-2 text-end font-medium">{t('billing.qty')}</th>
                  <th className="py-2 text-end font-medium">{t('billing.unitPrice')}</th>
                  <th className="py-2 text-end font-medium">{t('billing.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((it) => (
                  <tr key={it.id} className="border-b border-border last:border-0">
                    <td className="py-2 text-foreground">{it.description}</td>
                    <td className="py-2 text-end text-foreground">{it.qty}</td>
                    <td className="py-2 text-end text-foreground">{formatMoney(it.unit_price)}</td>
                    <td className="py-2 text-end font-medium text-foreground">{formatMoney(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ms-auto w-full max-w-56 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('billing.subtotal')}</span>
                <span>{formatMoney(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discount) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('billing.discount')}</span>
                  <span>-{formatMoney(invoice.discount)}</span>
                </div>
              )}
              {Number(invoice.tax) > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{t('billing.tax')}</span>
                  <span>{formatMoney(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground">
                <span>{t('common.total')}</span>
                <span>{formatMoney(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-success">
                <span>{t('billing.paid')}</span>
                <span>{formatMoney(paid)}</span>
              </div>
              <div className="flex justify-between font-medium text-foreground">
                <span>{t('billing.balance')}</span>
                <span>{formatMoney(balance)}</span>
              </div>
            </div>
          </div>

          {/* Payments history */}
          {data.payments.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t('billing.payments')}</p>
              <ul className="space-y-2">
                {data.payments.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {formatDate(p.paid_at)} · {t(`billing.methods.${p.method}`)}
                      {p.received_by_name ? ` · ${p.received_by_name}` : ''}
                    </span>
                    <span className="font-medium text-foreground">{formatMoney(p.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Record payment */}
          {canPay && (
            <form onSubmit={recordPayment} className="flex flex-wrap items-end gap-3 rounded-lg bg-muted/50 p-4">
              <div className="w-36">
                <Field label={t('billing.paymentAmount')} htmlFor="pay-amount">
                  <Input
                    id="pay-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={balance}
                    dir="ltr"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                  />
                </Field>
              </div>
              <div className="w-40">
                <Field label={t('billing.method')} htmlFor="pay-method">
                  <Select id="pay-method" value={method} onChange={(e) => setMethod(e.target.value)}>
                    {['cash', 'card', 'transfer', 'insurance'].map((m) => (
                      <option key={m} value={m}>
                        {t(`billing.methods.${m}`)}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Button type="submit" disabled={paying}>
                {paying && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {t('billing.recordPayment')}
              </Button>
            </form>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-between">
            {canPay ? (
              <Button variant="danger" onClick={cancel}>
                <Ban className="h-4 w-4" aria-hidden="true" />
                {t('billing.cancelInvoice')}
              </Button>
            ) : (
              <span />
            )}
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t('billing.printInvoice')}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
