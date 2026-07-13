import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Receipt,
  BarChart3,
  HeartPulse,
  LogOut,
  X,
  Settings,
  Briefcase,
  FlaskConical,
  ShieldCheck,
  History,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, key: 'nav.dashboard', roles: ['admin', 'doctor', 'receptionist'] },
  { to: '/patients', icon: Users, key: 'nav.patients', roles: ['admin', 'doctor', 'receptionist'] },
  { to: '/appointments', icon: CalendarDays, key: 'nav.appointments', roles: ['admin', 'doctor', 'receptionist'] },
  { to: '/doctors', icon: Stethoscope, key: 'nav.doctors', roles: ['admin', 'receptionist'] },
  { to: '/visits', icon: ClipboardList, key: 'nav.visits', roles: ['admin', 'doctor'] },
  { to: '/lab-tests', icon: FlaskConical, key: 'nav.labTests', roles: ['admin', 'doctor'] },
  { to: '/billing', icon: Receipt, key: 'nav.billing', roles: ['admin', 'receptionist'] },
  { to: '/services', icon: Briefcase, key: 'nav.services', roles: ['admin', 'receptionist'] },
  { to: '/insurance', icon: ShieldCheck, key: 'nav.insurance', roles: ['admin', 'receptionist'] },
  { to: '/reports', icon: BarChart3, key: 'nav.reports', roles: ['admin'] },
  { to: '/audit-log', icon: History, key: 'nav.auditLog', roles: ['admin'] },
  { to: '/settings', icon: Settings, key: 'nav.settings', roles: ['admin'] },
  { to: '/portal', icon: HeartPulse, key: 'nav.portal', roles: ['patient'] },
]

function NavContent({ onNavigate }) {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const items = NAV_ITEMS.filter((item) => item.roles.includes(user?.role))

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HeartPulse className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold leading-tight text-sidebar-foreground">{t('app.name')}</p>
          <p className="text-xs text-sidebar-muted">{t('app.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label={t('nav.main')}>
        {items.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <NavLink
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground'
                }`
              }
            >
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(item.key)}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 px-3 py-2">
          <p className="text-sm font-medium text-sidebar-foreground">{user?.full_name}</p>
          <p className="text-xs capitalize text-sidebar-muted">{t(`roles.${user?.role}`)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            logout()
            navigate('/login')
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <LogOut className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
          {t('common.logout')}
        </button>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { t } = useTranslation()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-e border-sidebar-border bg-sidebar lg:block">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 start-0 z-50 w-72 bg-sidebar shadow-xl lg:hidden"
              initial={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute end-3 top-3 rounded-lg p-2 text-sidebar-muted hover:bg-sidebar-hover"
                aria-label={t('common.close')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <NavContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
