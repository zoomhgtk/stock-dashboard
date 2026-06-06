'use client';

import { useState } from 'react';

const ALERT_RULES = [
  {
    id: 'dividend_buy',
    title: '股息率买入信号',
    description: '股息率 ≥ 6.0% 触发买入建议（基准35万）',
    icon: '🟢',
    active: true,
    color: '#e53935',
  },
  {
    id: 'dividend_add',
    title: '股息率加仓信号',
    description: '股息率 ≥ 5.0% 触发加仓建议',
    icon: '📈',
    active: true,
    color: '#f5a623',
  },
  {
    id: 'dividend_sell',
    title: '股息率卖出信号',
    description: '股息率 < 4.0% 触发卖出建议（或清仓）',
    icon: '🔴',
    active: true,
    color: '#43a047',
  },
  {
    id: 'position',
    title: '仓位约束预警',
    description: '单只股票 > 10%，板块 > 20% 触发警告',
    icon: '⚖️',
    active: true,
    color: '#f5a623',
  },
  {
    id: 'newlow',
    title: '新低跟踪',
    description: '股价创近期新低时标记观察',
    icon: '📉',
    active: true,
    color: '#86868b',
  },
  {
    id: 'huaneng_price',
    title: '华能国际价格预警',
    description: '股价 ≤ 8.00元 触发加急通知 🚨',
    icon: '🏭',
    active: true,
    color: '#e53935',
  },
  {
    id: 'telecom_dividend',
    title: '中国电信股息率预警',
    description: '股息率 ≥ 4.8% 触发通知',
    icon: '📡',
    active: true,
    color: '#f5a623',
  },
  {
    id: 'intrinsic',
    title: '跌破内在价值预警',
    description: '股价低于内在价值时触发提醒',
    icon: '🔔',
    active: true,
    color: '#e53935',
  },
];

const RULE_DETAILS = {
  dividend_buy: {
    threshold: ['条件: 股票股息率 ≥ 6.0%', '基准: 总资金 35万'],
    status: ['当前触发: 无（最高股息率: 伊利股份 5.34%）'],
    explanation: [
      '规则说明: 当任意持仓股票的年化股息率达到6%以上时，系统生成建仓建议。',
      '此时该股票的“持有收益”已超过银行理财的2倍，值得入场。',
    ],
    history: '上次触发: 未触发',
  },
  dividend_add: {
    threshold: ['条件: 股票股息率 ≥ 5.0%', '目标: 优先加仓已有底仓且基本面稳定的标的'],
    status: ['当前触发: 伊利股份 5.34% 达到加仓线', '接近触发: 国电电力约4.9%，中国石化约4.8%'],
    explanation: [
      '规则说明: 股息率达到5%以上时，说明当前价格已具备较好的现金回报安全垫。',
      '系统会提示分批加仓，但仍需结合仓位约束，避免单一股票或板块过度集中。',
    ],
    history: '上次触发: 2026-06-05 15:30（伊利股份）',
  },
  dividend_sell: {
    threshold: ['条件: 股票股息率 < 4.0%', '动作: 触发卖出建议，必要时清仓观察'],
    status: ['当前触发: 中国移动 97.33元，对应股息率约3.9%', '观察对象: 贵州茅台、泸州老窖等低股息消费股'],
    explanation: [
      '规则说明: 当持仓股票股息率跌破4%时，当前价格相对分红回报已经偏贵。',
      '若同时缺少成长性或安全边际，系统建议逐步卖出，把资金切换到更高股息率资产。',
    ],
    history: '上次触发: 2026-06-05 15:30（中国移动）',
  },
  position: {
    threshold: ['条件: 单只 > 10% | 板块 > 20%'],
    status: ['当前超标: 🚨 招商银行 55.1%（上限10%）', '当前超标: 🚨 银行板块 55.1%（上限20%）'],
    explanation: [
      '规则说明: 单只股票仓位超过10%时系统发出严重警告，板块超过20%时提示行业集中风险。',
      '当前招商银行严重超标，建议逐步减仓至10%以内，并把银行板块降至20%以内。',
    ],
    history: '上次触发: 2026-06-05 15:30',
  },
  newlow: {
    threshold: ['条件: 股价创近期新低', '动作: 标记观察，不直接买入'],
    status: ['当前标记: 泸州老窖 87.11元、贵州茅台 1274.05元、中国石化 4.95元', '中国电信 6.01元仍处在低位观察区间'],
    explanation: [
      '规则说明: 新低跟踪用于发现可能进入估值修复区间的股票。',
      '新低本身不是买入理由，必须叠加股息率、内在价值和仓位约束后再做决策。',
    ],
    history: '上次触发: 2026-06-05 15:30',
  },
  huaneng_price: {
    threshold: ['条件: 股价 ≤ 8.00元'],
    status: ['当前价格: 8.30元（还需下跌3.7%）', '检查频率: 每30分钟（盘中）', '通知方式: 飞书应用内加急 🚨'],
    explanation: [
      '规则说明: 当华能国际股价跌破8元时，立即通过飞书发送加急通知。',
      '已设置自动重置机制——跌破后反弹回8元以上可再次触发。',
    ],
    history: '上次触发: 未触发',
  },
  telecom_dividend: {
    threshold: ['条件: 股息率 ≥ 4.8%（即股价 ≤ 5.667元）', '年度分红: 0.272元/股（2025年）'],
    status: ['当前股息率: 4.53%（股价 6.01元）', '还需再跌: 约5.7%'],
    explanation: [
      '规则说明: 中国电信的年化股息率达到4.8%时触发通知。',
      '以0.272元/股的分红计算，对应股价为5.667元；触发后自动重置，股价回升后可再次触发。',
    ],
    history: '上次触发: 未触发',
  },
  intrinsic: {
    threshold: ['条件: 当前股价 < 估算内在价值', '动作: 触发安全边际提醒'],
    status: ['当前触发: 中国移动 97.33元 < 内在价值118.14元', '当前触发: 中国电信 6.01元 < 内在价值7.81元', '当前触发: 国电电力 5.07元 < 内在价值5.60元'],
    explanation: [
      '规则说明: 当市场价格低于估算内在价值时，系统提醒该股票可能存在安全边际。',
      '该信号用于优先排序观察对象，不代表立即买入，仍需结合股息率和仓位上限执行。',
    ],
    history: '上次触发: 2026-06-05 15:30',
  },
};

const INITIAL_ALERTS = [
  {
    id: 1,
    type: 'position',
    stock: '招商银行',
    message: '仓位55.1% > 单只10%上限，当前价38.58元，需优先降仓',
    time: '2026-06-05 15:30',
    severity: 'critical',
  },
  {
    id: 2,
    type: 'position',
    stock: '银行板块',
    message: '银行板块55.1% > 20%上限，板块集中度严重超标',
    time: '2026-06-05 15:30',
    severity: 'critical',
  },
  {
    id: 3,
    type: 'intrinsic',
    stock: '中国移动',
    message: '股价97.33 < 内在价值118.14，存在安全边际但股息率接近卖出线',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 4,
    type: 'intrinsic',
    stock: '中国电信',
    message: '股价6.01 < 内在价值7.81，当前股息率4.53%，距4.8%触发线约5.7%',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 5,
    type: 'intrinsic',
    stock: '国电电力',
    message: '股价5.07 < 内在价值5.60，接近高股息加仓观察区',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 6,
    type: 'dividend_add',
    stock: '伊利股份',
    message: '股息率5.34% ≥ 5.0%，触发加仓观察信号',
    time: '2026-06-05 15:30',
    severity: 'warning',
  },
  {
    id: 7,
    type: 'newlow',
    stock: '泸州老窖',
    message: '股价87.11创近期新低，标记观察，等待估值与股息率确认',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
  {
    id: 8,
    type: 'huaneng_price',
    stock: '华能国际',
    message: '当前价8.30元，距离8.00元加急预警线还需下跌约3.7%',
    time: '2026-06-05 15:30',
    severity: 'info',
  },
];

const WATCHLIST = [
  '招商银行',
  '国电电力',
  '海尔智家',
  '中国移动',
  '中信建投',
  '云南白药',
  '兴业银行',
  '东阿阿胶',
  '伊利股份',
  '中国平安',
  '新华保险',
  '中国石油',
  '中国石化',
  '国投电力',
  '长江电力',
  '中国海油',
  '中国电信',
  '中远海控',
  '泸州老窖',
  '华能国际',
];

export default function AlertSidebar({ onSelectStock, selectedStock }) {
  const [activeTab, setActiveTab] = useState('rules'); // rules | history
  const [expandedRule, setExpandedRule] = useState(null);
  const [alerts] = useState(INITIAL_ALERTS);

  const severityStyles = {
    critical: { bg: '#fff1f0', dot: '#e53935', label: '严重' },
    warning: { bg: '#fffbe6', dot: '#f5a623', label: '警告' },
    info: { bg: '#f0f5ff', dot: '#007aff', label: '观察' },
  };

  const handleRuleToggle = ruleId => {
    setExpandedRule(current => (current === ruleId ? null : ruleId));
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
            {ALERT_RULES.map(rule => {
              const details = RULE_DETAILS[rule.id];
              const isExpanded = expandedRule === rule.id;

              return (
                <div
                  key={rule.id}
                  className="p-3 rounded-xl bg-white border border-[#e5e5e7] hover:border-[#c7c7cc] hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleRuleToggle(rule.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleRuleToggle(rule.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{rule.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#1d1d1f]">{rule.title}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${rule.active ? 'bg-[#43a047]' : 'bg-[#c7c7cc]'}`}
                          />
                          <span
                            className={`text-[10px] text-[#86868b] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          >
                            ⌄
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-[#86868b] mt-0.5 truncate">{rule.description}</p>
                    </div>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isExpanded ? 'max-h-[560px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="rounded-lg bg-[#f5f5f7] border border-[#e5e5e7] p-3 text-[11px] leading-relaxed text-[#1d1d1f]">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{rule.icon}</span>
                        <span className="font-semibold">{rule.title}</span>
                        <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: rule.color }} />
                      </div>

                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] font-semibold text-[#86868b] mb-1">阈值条件</p>
                          {details.threshold.map(item => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold text-[#86868b] mb-1">当前状态</p>
                          {details.status.map(item => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>

                        <div>
                          <p className="text-[10px] font-semibold text-[#86868b] mb-1">规则说明</p>
                          {details.explanation.map(item => (
                            <p key={item}>{item}</p>
                          ))}
                        </div>

                        <p className="pt-1 text-[10px] text-[#86868b] border-t border-[#e5e5e7]">
                          {details.history}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
          {WATCHLIST.map(name => (
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
