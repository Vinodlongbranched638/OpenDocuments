import type { DB } from '../storage/db.js'

export interface AlertRule {
  name: string
  condition: { event: string; threshold: number; windowMinutes: number }
  action: 'notify' | 'block-ip' | 'throttle'
}

export interface Alert {
  rule: string
  message: string
  triggeredAt: string
  details: Record<string, unknown>
}

export class SecurityAlertManager {
  private rules: AlertRule[] = []
  private alerts: Alert[] = []

  constructor(private db: DB, rules?: AlertRule[]) {
    this.rules = rules || [
      { name: 'brute-force', condition: { event: 'auth:failed', threshold: 10, windowMinutes: 5 }, action: 'block-ip' },
      { name: 'unusual-export', condition: { event: 'document:exported', threshold: 50, windowMinutes: 60 }, action: 'notify' },
      { name: 'api-key-abuse', condition: { event: 'rate:exceeded', threshold: 5, windowMinutes: 10 }, action: 'throttle' },
    ]
  }

  checkEvent(eventType: string, details?: Record<string, unknown>): Alert | null {
    for (const rule of this.rules) {
      if (rule.condition.event !== eventType) continue

      // Count recent events of this type
      const since = new Date(Date.now() - rule.condition.windowMinutes * 60000).toISOString()
      const count = this.db.get<any>(
        'SELECT COUNT(*) as cnt FROM audit_logs WHERE event_type = ? AND created_at > ?',
        [eventType, since]
      )

      if ((count?.cnt || 0) >= rule.condition.threshold) {
        const alert: Alert = {
          rule: rule.name,
          message: `${rule.name}: ${eventType} threshold (${rule.condition.threshold}) exceeded in ${rule.condition.windowMinutes}m window`,
          triggeredAt: new Date().toISOString(),
          details: details || {},
        }
        this.alerts.push(alert)
        return alert
      }
    }
    return null
  }

  getRecentAlerts(limit = 50): Alert[] {
    return this.alerts.slice(-limit)
  }

  clearAlerts(): void {
    this.alerts = []
  }
}
