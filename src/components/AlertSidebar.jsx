'use client';

import { useState } from 'react';

const ALERT_RULES = [
  {
    id: 'intrinsic',
    title: '跌破内在价值预警',
    description: '股价低于内在价值时触发提醒',
    icon: '🔔',
    active: true,
    color: '#e53935',
  },
  {
    id: 'position',
    title: '仓位约束预警',
    description: '单只股票 > 10%，板块 > 20%',
    icon: '⚖️',
    active: true,
    color: '#f5a623',
  },
  {
    id: 'newlow',
    title: '新低跟踪',
    description: '股价创近期新低时标记',
    icon: '📉',
    active: true,
    color: '#86868b',
  },
  {
    id: 'buy_signal',
    title: '买入信号',
    description: '技术指标触发买入时通知',
    icon: '📈',
    active: true,
    color: '#e53935',
  },
  {
    id: 'sell_signal',
    title: '卖出信号',
    description: '技术指标触发卖出时通知',
    icon: '📊',
    active: true,
    color: '#43a047',
  },
];

const INITIAL_ALERTS = [
  {
    id: 1,
    type: 'intrinsic',
    stock: '中国移动',
    message: '股价97.33 < 内在价值118.14，低于内在价值',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 2,
    type: 'intrinsic',
    stock: '中国电信',
    message: '股价6.17 < 内在价值7.81，低于内在价值',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 3,
    type: 'position',
    stock: '招商银行',
    message: '仓位55.1% > 10%上限',
    time: '2026-06-05 15:30',
    severity: 'critical',
  },
  {
    id: 4,
    type: 'position',
    stock: '银行板块',
    message: '银行板块55.1% > 20%上限（招行55.1%+兴业0.0%）',
    time: '2026-06-05 15:30',
    severity: 'critical',
  },
  {
    id: 5,
    type: 'newlow',
    stock: '泸州老窖',
    message: '股价创近期新低87.11，可能见底',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
  {
    id: 6,
    type: 'newlow',
    stock: '贵州茅台',
    message: '股价创近期新低1274.05，可能见底',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
  {
    id: 7,
    type: 'newlow',
    stock: '中国石化',
    message: '股价创近期新低4.95，可能见底',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
  {
    id: 8,
    type: 'newlow',
    stock: '中国电信',
    message: '股价创近期新低6.17，可能见底',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
];

export default function AlertSidebar({ onSelectStock, selectedStock }) {
  const [activeTab, setActiveTab] = useState('rules'); // rules | history
  const [alerts] = useState(INITIAL_ALERTS);

  const severityStyles = {
    critical: { bg: '#fff1f0', dot: '#e53935', label: '严重' },
    warning: { bg: '#fffbe6', dot: '#f5a623', label: '警告' },
    info: { bg: '#f0f5ff', dot: '#007aff', label: '观察' },
  };

  return (
    <div className="glass-panel h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[#e5e5e7]">
        <h2 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">预警中心</h2>
        <p className="text-xs text-[#86868b] mt-0.5">实时监测 & 历史记录</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e5e5e7]">
        <button
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeTab === 'rules'
              ? 'text-[#007aff] border-b-2 border-[#007aff]'
              : 'text-[#86868b] hover:text-[#1d1d1f]'
          }`}
          onClick={() => setActiveTab('rules')}
        >
          预警规则
        </button>
        <button
          className={`flex-1 py-2.5 text-xs font-medium text-center transition-colors ${
            activeTab === 'history'
              ? 'text-[#007aff] border-b-2 border-[#007aff]'
              : 'text-[#86868b] hover:text-[#1d1d1f]'
          }`}
          onClick={() => setActiveTab('history')}
        >
          历史预警
          <span className="ml-1 bg-[#e53935] text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'rules' ? (
          <div className="p-3 space-y-2">
            {ALERT_RULES.map(rule => (
              <div
                key={rule.id}
                className="p-3 rounded-xl bg-white border border-[#e5e5e7] hover:border-[#c7c7cc] transition-all cursor-default"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{rule.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#1d1d1f]">{rule.title}</span>
                      <span className={`w-2 h-2 rounded-full ${rule.active ? 'bg-[#43a047]' : 'bg-[#c7c7cc]'}`} />
                    </div>
                    <p className="text-[11px] text-[#86868b] mt-0.5 truncate">{rule.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e7]">
            {alerts.map(alert => {
              const style = severityStyles[alert.severity] || severityStyles.info;
              return (
                <div
                  key={alert.id}
                  className="alert-item"
                  style={{ background: style.bg }}
                  onClick={() => onSelectStock?.(alert.stock)}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: style.dot }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-[#1d1d1f]">{alert.stock}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ background: style.dot + '20', color: style.dot }}
                        >
                          {style.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868b] mt-0.5 leading-relaxed">{alert.message}</p>
                      <p className="text-[10px] text-[#c7c7cc] mt-1">{alert.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stock list at bottom */}
      <div className="border-t border-[#e5e5e7] p-3">
        <p className="text-[10px] text-[#86868b] font-medium uppercase tracking-wider mb-2 px-1">
          自选列表
        </p>
        <div className="space-y-0.5">
          {['招商银行', '国电电力', '中国移动', '中国电信', '海尔智家', '中信建投', '云南白药'].map(name => (
            <button
              key={name}
              className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedStock?.includes(name)
                  ? 'bg-[#007aff] text-white'
                  : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f5f5f7]'
              }`}
              onClick={() => onSelectStock?.(name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
