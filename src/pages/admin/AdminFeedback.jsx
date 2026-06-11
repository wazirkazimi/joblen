import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { ThumbsUp, ThumbsDown, Calendar, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import './admin.css';

export default function AdminFeedback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackList, setFeedbackList] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    yesCount: 0,
    yesPercent: 0,
    noCount: 0,
    noPercent: 0
  });

  // Chart data
  const [reasonsChartData, setReasonsChartData] = useState([]);

  // Filters state
  const [decisionFilter, setDecisionFilter] = useState('all'); // 'all', 'yes', 'no'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');

  const fetchFeedbackData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: analyses, error: rpcError } = await supabase.rpc('admin_get_analyses', { admin_pass: savedPass });
      if (rpcError) throw rpcError;

      // Filter analyses to only get entries that have feedback
      const feedbacks = (analyses || []).filter(a => !!a.feedback_decision);
      setFeedbackList(feedbacks);

      // Compile stats
      const total = feedbacks.length;
      const yesCount = feedbacks.filter(f => f.feedback_decision === 'yes').length;
      const noCount = feedbacks.filter(f => f.feedback_decision === 'no').length;
      const yesPercent = total > 0 ? Math.round((yesCount / total) * 100) : 0;
      const noPercent = total > 0 ? Math.round((noCount / total) * 100) : 0;

      setStats({ total, yesCount, yesPercent, noCount, noPercent });

      // Compile common reasons frequency map
      const reasonsMap = {};
      feedbacks.forEach(f => {
        (f.feedback_reasons || []).forEach(r => {
          if (!reasonsMap[r]) {
            reasonsMap[r] = { name: r, Count: 0, type: f.feedback_decision };
          }
          reasonsMap[r].Count++;
        });
      });

      const chartData = Object.values(reasonsMap)
        .sort((a, b) => b.Count - a.Count)
        .slice(0, 10); // top 10 feedback reasons
      setReasonsChartData(chartData);

    } catch (err) {
      setError(err.message || 'Failed to fetch feedback logs');
    } finally {
      setLoading(false);
    }
  }, [savedPass]);

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        fetchFeedbackData();
      });
    }
    return () => {
      active = false;
    };
  }, [fetchFeedbackData]);

  // Filter application optimized with useMemo
  const filteredFeedback = useMemo(() => {
    let result = [...feedbackList];

    // Filter by decision
    if (decisionFilter !== 'all') {
      result = result.filter(f => f.feedback_decision === decisionFilter);
    }

    // Filter by Date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(f => new Date(f.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(f => new Date(f.created_at) <= end);
    }

    return result;
  }, [decisionFilter, startDate, endDate, feedbackList]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredFeedback.length === 0) return;

    const headers = ['User Email', 'Job Role', 'Company', 'Decision', 'Reasons', 'Date'];
    const rows = filteredFeedback.map(f => [
      f.email || 'Anonymous',
      f.result?.role || '-',
      f.result?.company || '-',
      f.feedback_decision === 'yes' ? 'Applied (Yes)' : 'Skipped (No)',
      (f.feedback_reasons || []).join('; '),
      new Date(f.created_at).toISOString().split('T')[0]
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `joblens_feedback_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>User Feedback Analytics</h1>
        <button
          className="btn btn-secondary admin-export-btn"
          onClick={handleExportCSV}
          disabled={filteredFeedback.length === 0}
          style={{ gap: '0.4rem' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {error && (
        <div className="glass-panel" style={{ padding: '1rem', color: 'var(--danger)', marginBottom: '1.5rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Stats Cards Row */}
      <div className="admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon green">
            <ThumbsUp size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Yes, I'd Apply (👍)</span>
            <span className="admin-metric-value">
              {stats.yesCount} <span style={{ fontSize: '1rem', color: 'var(--success)', fontWeight: 600 }}>({stats.yesPercent}%)</span>
            </span>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon red">
            <ThumbsDown size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Not This One (👎)</span>
            <span className="admin-metric-value">
              {stats.noCount} <span style={{ fontSize: '1rem', color: 'var(--danger)', fontWeight: 600 }}>({stats.noPercent}%)</span>
            </span>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon blue" style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
            <ThumbsUp size={20} style={{ transform: 'rotate(180deg)' }} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Total Feedback Runs</span>
            <span className="admin-metric-value">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Reasons Bar Chart */}
      <div className="admin-chart-card glass-panel mb-8">
        <div className="admin-chart-header">
          <span>Top Common Feedback Reasons (Yes / No Chips)</span>
        </div>
        <div className="admin-chart-container" style={{ height: '340px' }}>
          {reasonsChartData.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No feedback reasons recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reasonsChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={10} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} width={130} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', color: '#fff' }} />
                <Bar dataKey="Count" radius={[0, 4, 4, 0]}>
                  {reasonsChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.type === 'yes' ? 'var(--success)' : 'var(--danger)'} 
                      fillOpacity={0.75}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--success)', opacity: 0.75, borderRadius: '3px' }} />
            <span>Reason to Apply (👍)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '12px', height: '12px', background: 'var(--danger)', opacity: 0.75, borderRadius: '3px' }} />
            <span>Reason to Skip (👎)</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filters-left">
          <select
            className="admin-filter-select"
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
          >
            <option value="all">All Decisions</option>
            <option value="yes">Applied Only (👍)</option>
            <option value="no">Skipped Only (👎)</option>
          </select>

          <div className="admin-filter-date-group">
            <Calendar size={14} />
            <input
              type="date"
              className="admin-filter-input"
              style={{ minWidth: '130px', padding: '0.4rem 0.6rem' }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span>to</span>
            <input
              type="date"
              className="admin-filter-input"
              style={{ minWidth: '130px', padding: '0.4rem 0.6rem' }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          Showing {filteredFeedback.length} logs
        </span>
      </div>

      {/* Feedback Logs Table */}
      <div className="admin-table-card glass-panel">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Job / Company</th>
                <th>Decision</th>
                <th>Reasons Provided</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
                  </td>
                </tr>
              ) : filteredFeedback.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No feedback entries recorded
                  </td>
                </tr>
              ) : (
                filteredFeedback.map((f) => {
                  const r = f.result || {};
                  const isYes = f.feedback_decision === 'yes';
                  return (
                    <tr key={f.id}>
                      <td style={{ fontWeight: 500 }}>{f.email || 'Anonymous'}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>{r.role || 'Role'}</span>
                        <span style={{ color: 'var(--text-secondary)' }}> @ {r.company || 'Company'}</span>
                      </td>
                      <td>
                        {isYes ? (
                          <span style={{ color: 'var(--success)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600, fontSize: '0.82rem' }}>
                            <ArrowUpRight size={14} /> Applied
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600, fontSize: '0.82rem' }}>
                            <ArrowDownRight size={14} /> Skipped
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {(f.feedback_reasons || []).map((chip, idx) => (
                            <span 
                              key={idx} 
                              className="badge" 
                              style={{ 
                                fontSize: '0.72rem', 
                                padding: '0.1rem 0.45rem',
                                background: isYes ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                color: isYes ? 'var(--success)' : 'var(--danger)',
                                border: isYes ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(239, 68, 68, 0.15)'
                              }}
                            >
                              {chip}
                            </span>
                          ))}
                          {(f.feedback_reasons || []).length === 0 && (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>None selected</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(f.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
