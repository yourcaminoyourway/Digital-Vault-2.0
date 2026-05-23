import { type LucideIcon } from 'lucide-react'
import clsx from 'clsx'

type StatsCardProps = {
  icon: LucideIcon
  title: string
  value: number | string
  trend?: {
    value: string
    positive?: boolean
  }
  color?: 'indigo' | 'green' | 'amber' | 'rose'
}

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    icon: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    iconBg: 'bg-green-100',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    iconBg: 'bg-amber-100',
  },
  rose: {
    bg: 'bg-rose-50',
    icon: 'text-rose-600',
    iconBg: 'bg-rose-100',
  },
}

export default function StatsCard({
  icon: Icon,
  title,
  value,
  trend,
  color = 'indigo',
}: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div className={clsx('rounded-xl p-6 border border-gray-100', colors.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p
              className={clsx(
                'text-xs mt-1 font-medium',
                trend.positive ? 'text-green-600' : 'text-gray-500'
              )}
            >
              {trend.value}
            </p>
          )}
        </div>
        <div className={clsx('p-3 rounded-xl', colors.iconBg)}>
          <Icon className={clsx('w-6 h-6', colors.icon)} />
        </div>
      </div>
    </div>
  )
}
