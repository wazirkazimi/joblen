import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import BACKEND_URL from '../../lib/config';
import { Settings, Database, Server, RefreshCw, AlertCircle } from 'lucide-react';
import './admin.css';

export default function AdminSystem() {
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState({
    MAX_FREE_ANALYSES_PER_MONTH: '20',
    maintenance_mode: 'false'
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [dbSize, setDbSize] = useState('Loading...');
  
  // Groq API status
  const [groqStatus, setGroqStatus] = useState('unknown'); // 'unknown', 'checking', 'healthy', 'unhealthy'
  const [groqLatency, setGroqLatency] = useState(null);
  const [groqError, setGroqError] = useState('');

  // Error logs
  const [errorLogs, setErrorLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState('');

  const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');

  const fetchErrorLogs = useCallback(async () => {
    setLoadingLogs(true);
    setLogsError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('admin_get_errors', { admin_pass: savedPass });
      if (rpcError) throw rpcError;
      setErrorLogs(data || []);
    } catch (err) {
      setLogsError(err.message || 'Failed to load logs');
    } finally {
      setLoadingLogs(false);
    }
  }, [savedPass]);

  const fetchSystemData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Fetch configs (can read directly because RLS allows select for non-sensitive rows)
      const { data: configData, error: configError } = await supabase
        .from('app_config')
        .select('key, value');
      if (configError) throw configError;

      setConfigs(prev => {
        const loadedConfigs = { ...prev };
        (configData || []).forEach(row => {
          loadedConfigs[row.key] = row.value;
        });
        return loadedConfigs;
      });

      // 2. Fetch DB size
      const { data: sizeData, error: sizeError } = await supabase.rpc('admin_get_db_size', { admin_pass: savedPass });
      if (sizeError) {
        setDbSize('Unavailable');
      } else {
        setDbSize(sizeData || 'Unknown');
      }

      // 3. Fetch error logs
      await fetchErrorLogs();

    } catch (err) {
      console.error('System config fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [savedPass, fetchErrorLogs]);

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        fetchSystemData();
      });
    }
    return () => {
      active = false;
    };
  }, [fetchSystemData]);

  const handleSaveMaxAnalyses = async (value) => {
    setSavingConfig(true);
    try {
      const { error } = await supabase.rpc('admin_set_config', {
        admin_pass: savedPass,
        config_key: 'MAX_FREE_ANALYSES_PER_MONTH',
        config_val: value.toString()
      });
      if (error) throw error;
      setConfigs(prev => ({ ...prev, MAX_FREE_ANALYSES_PER_MONTH: value.toString() }));
    } catch (err) {
      alert('Failed to save config: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleToggleMaintenance = async (checked) => {
    setSavingConfig(true);
    const valueStr = checked ? 'true' : 'false';
    try {
      const { error } = await supabase.rpc('admin_set_config', {
        admin_pass: savedPass,
        config_key: 'maintenance_mode',
        config_val: valueStr
      });
      if (error) throw error;
      setConfigs(prev => ({ ...prev, maintenance_mode: valueStr }));
    } catch (err) {
      alert('Failed to update maintenance mode: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const checkGroqStatus = async () => {
    setGroqStatus('checking');
    setGroqLatency(null);
    setGroqError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/health-check`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setGroqStatus('healthy');
        setGroqLatency(data.latencyMs);
      } else {
        setGroqStatus('unhealthy');
        setGroqError(data.error || 'Server error occurred');
      }
    } catch (err) {
      console.error(err);
      setGroqStatus('unhealthy');
      setGroqError('Backend server is unreachable. Check if it is running.');
    }
  };

  const formatTimestamp = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div>
      <h1>System Panel</h1>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <>
          <div className="admin-system-grid">
            
            {/* Live Settings Config */}
            <div className="admin-system-card glass-panel">
              <div className="admin-chart-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Settings size={18} color="var(--accent-primary)" /> App Configurations
                </span>
              </div>
              
              <div className="admin-config-row">
                <div>
                  <div style={{ fontWeight: 600 }}>Max Free Analyses / Month</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Limit for non-subscribed users</div>
                </div>
                <input
                  type="number"
                  className="admin-filter-input"
                  style={{ width: '90px', padding: '0.4rem 0.6rem', textAlign: 'center' }}
                  value={configs.MAX_FREE_ANALYSES_PER_MONTH}
                  onChange={(e) => handleSaveMaxAnalyses(e.target.value)}
                  disabled={savingConfig}
                />
              </div>

              <div className="admin-config-row">
                <div>
                  <div style={{ fontWeight: 600 }}>Maintenance Mode</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Lock regular user accesses & display banner</div>
                </div>
                <label className="admin-switch">
                  <input
                    type="checkbox"
                    checked={configs.maintenance_mode === 'true'}
                    onChange={(e) => handleToggleMaintenance(e.target.checked)}
                    disabled={savingConfig}
                  />
                  <span className="admin-slider"></span>
                </label>
              </div>
            </div>

            {/* Diagnostics Stats */}
            <div className="admin-system-card glass-panel">
              <div className="admin-chart-header">
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Database size={18} color="var(--accent-secondary)" /> Database & Services
                </span>
              </div>

              <div className="admin-config-row">
                <div>
                  <div style={{ fontWeight: 600 }}>Supabase Database Size</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Allocated storage footprint</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>
                  {dbSize}
                </div>
              </div>

              <div className="admin-config-row">
                <div>
                  <div style={{ fontWeight: 600 }}>Groq API Ping Test</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Check Groq LLM latency</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {groqStatus !== 'unknown' && (
                    <div className="admin-status-indicator">
                      <div className={`admin-indicator-dot ${groqStatus === 'healthy' ? 'green' : groqStatus === 'checking' ? 'grey' : 'red'}`} />
                      <span style={{ fontSize: '0.82rem', color: groqStatus === 'healthy' ? 'var(--success)' : 'var(--danger)' }}>
                        {groqStatus === 'healthy' ? `${groqLatency}ms` : groqStatus === 'checking' ? 'Testing...' : 'Offline'}
                      </span>
                    </div>
                  )}
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={checkGroqStatus}
                    disabled={groqStatus === 'checking'}
                  >
                    <Server size={12} /> Ping
                  </button>
                </div>
              </div>
              {groqStatus === 'unhealthy' && groqError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.76rem', marginTop: '0.5rem', wordBreak: 'break-all' }}>
                  ⚠️ {groqError}
                </div>
              )}
            </div>
          </div>

          {/* System & Application Error Logs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', marginTop: '2.5rem' }}>
            <h2 style={{ margin: 0 }}>Error Logs (Last 50 Events)</h2>
            <button 
              className="btn btn-secondary admin-export-btn"
              onClick={fetchErrorLogs}
              disabled={loadingLogs}
              style={{ gap: '0.4rem' }}
            >
              <RefreshCw size={13} className={loadingLogs ? 'spin-anim' : ''} /> Refresh Logs
            </button>
          </div>

          <div className="admin-table-card glass-panel">
            <div className="admin-table-wrapper" style={{ maxHeight: '350px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '25%' }}>Timestamp</th>
                    <th style={{ width: '25%' }}>User</th>
                    <th style={{ width: '50%' }}>Error Message</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingLogs ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
                      </td>
                    </tr>
                  ) : logsError ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--danger)', padding: '2rem' }}>
                        ⚠️ {logsError}
                      </td>
                    </tr>
                  ) : errorLogs.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                        No errors logged in database. Everything is running smoothly! 🎉
                      </td>
                    </tr>
                  ) : (
                    errorLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          {formatTimestamp(log.log_timestamp || log.timestamp)}
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>
                          {log.email || (log.user_id ? `User: ${log.user_id.slice(0, 8)}...` : 'Anonymous')}
                        </td>
                        <td style={{ color: 'var(--danger)', fontSize: '0.82rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.3rem' }}>
                            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>{log.error}</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .spin-anim { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
