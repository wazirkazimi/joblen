import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, ShieldAlert, Trash2, Eye, X, Download } from 'lucide-react';
import './admin.css';

export default function AdminAnalyses() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState([]);
  
  // Filters state
  const [scoreFilter, setScoreFilter] = useState('all'); // 'all', 'high', 'med', 'low'
  const [spamFilter, setSpamFilter] = useState('all'); // 'all', 'legit', 'spam'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [emailSearch, setEmailSearch] = useState('');

  // Modal states
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc('admin_get_analyses', { admin_pass: savedPass });
      if (rpcError) throw rpcError;
      setAnalyses(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch analyses log');
    } finally {
      setLoading(false);
    }
  }, [savedPass]);

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        fetchAnalyses();
      });
    }
    return () => {
      active = false;
    };
  }, [fetchAnalyses]);

  // Filter application optimized with useMemo
  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];

    // Filter by User Email
    if (emailSearch.trim()) {
      const email = emailSearch.toLowerCase();
      result = result.filter(a => a.email?.toLowerCase().includes(email));
    }

    // Filter by Score
    if (scoreFilter !== 'all') {
      result = result.filter(a => {
        const score = a.result?.fitScore;
        if (typeof score !== 'number') return false;
        if (scoreFilter === 'high') return score >= 7;
        if (scoreFilter === 'med') return score >= 4 && score <= 6;
        if (scoreFilter === 'low') return score >= 1 && score <= 3;
        return true;
      });
    }

    // Filter by Spam/Legit
    if (spamFilter !== 'all') {
      result = result.filter(a => {
        const isSpam = a.result?.isSpam === true;
        if (spamFilter === 'spam') return isSpam;
        if (spamFilter === 'legit') return !isSpam;
        return true;
      });
    }

    // Filter by Date
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(a => new Date(a.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(a => new Date(a.created_at) <= end);
    }

    return result;
  }, [emailSearch, scoreFilter, spamFilter, startDate, endDate, analyses]);

  // View individual JSON in modal
  const handleOpenDetails = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  // Delete analysis
  const confirmDelete = (analysis, e) => {
    e.stopPropagation();
    setItemToDelete(analysis);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.rpc('admin_delete_analysis', {
        admin_pass: savedPass,
        analysis_id: itemToDelete.id
      });
      if (deleteError) throw deleteError;
      
      setShowDeleteModal(false);
      setItemToDelete(null);
      if (selectedAnalysis?.id === itemToDelete.id) {
        setSelectedAnalysis(null);
      }
      await fetchAnalyses();
    } catch (err) {
      alert('Deletion failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredAnalyses.length === 0) return;

    const headers = ['Analysis ID', 'User Email', 'Company', 'Role', 'Fit Score', 'Probability', 'Spam Flag', 'Created Date'];
    const rows = filteredAnalyses.map(a => [
      a.id,
      a.email || 'Anonymous',
      a.result?.company || '-',
      a.result?.role || '-',
      a.result?.fitScore ?? '-',
      a.result?.probability || '-',
      a.result?.isSpam ? 'Yes' : 'No',
      new Date(a.created_at).toISOString().split('T')[0]
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `joblens_analyses_export_${new Date().toISOString().split('T')[0]}.csv`);
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
        <h1>Analyses Log</h1>
        <button
          className="btn btn-secondary admin-export-btn"
          onClick={handleExportCSV}
          disabled={filteredAnalyses.length === 0}
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

      {/* Filters Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filters-left">
          <input
            type="text"
            className="admin-filter-input"
            placeholder="Search user email..."
            value={emailSearch}
            onChange={(e) => setEmailSearch(e.target.value)}
          />
          
          <select 
            className="admin-filter-select"
            value={scoreFilter}
            onChange={(e) => setScoreFilter(e.target.value)}
          >
            <option value="all">All Scores</option>
            <option value="high">High Fit (7-10)</option>
            <option value="med">Medium Fit (4-6)</option>
            <option value="low">Low Fit (1-3)</option>
          </select>

          <select 
            className="admin-filter-select"
            value={spamFilter}
            onChange={(e) => setSpamFilter(e.target.value)}
          >
            <option value="all">All Posts</option>
            <option value="legit">Legit Only</option>
            <option value="spam">Spam Only</option>
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
          Found {filteredAnalyses.length} analyses
        </span>
      </div>

      {/* Analyses Table */}
      <div className="admin-table-card glass-panel">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Fit Score</th>
                <th>Probability</th>
                <th>Spam</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
                  </td>
                </tr>
              ) : filteredAnalyses.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No analyses found matching filters
                  </td>
                </tr>
              ) : (
                filteredAnalyses.map((a) => {
                  const r = a.result || {};
                  return (
                    <tr 
                      key={a.id}
                      className="admin-row-clickable"
                      onClick={() => handleOpenDetails(a)}
                    >
                      <td style={{ fontWeight: 500 }}>{a.email || 'Anonymous'}</td>
                      <td>{r.company || '-'}</td>
                      <td>{r.role || '-'}</td>
                      <td>
                        <span className={`badge ${r.fitScore >= 7 ? 'badge-success' : r.fitScore >= 4 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                          {r.fitScore ?? '?'} / 10
                        </span>
                      </td>
                      <td>{r.probability || '-'}</td>
                      <td>
                        {r.isSpam ? (
                          <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            <ShieldAlert size={14} /> Yes
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No</span>
                        )}
                      </td>
                      <td>{formatDate(a.created_at)}</td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => handleOpenDetails(a)}
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={(e) => confirmDelete(a, e)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analysis Details JSON Card Modal */}
      {selectedAnalysis && (
        <div className="admin-modal-overlay" onClick={() => setSelectedAnalysis(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Analysis Details for {selectedAnalysis.result?.role || 'Job'} @ {selectedAnalysis.result?.company || 'Company'}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedAnalysis(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="admin-modal-grid">
                
                {/* Visual Summary Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                    <h4 className="mb-2" style={{ color: 'var(--accent-secondary)' }}>Job Details</h4>
                    <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-primary)' }}>
                      <strong>Role:</strong> {selectedAnalysis.result?.role}
                    </p>
                    <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0', color: 'var(--text-primary)' }}>
                      <strong>Company:</strong> {selectedAnalysis.result?.company}
                    </p>
                    <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
                      <strong>Run By:</strong> {selectedAnalysis.email}
                    </p>
                    <p style={{ fontSize: '0.88rem', margin: '0.25rem 0 0', color: 'var(--text-secondary)' }}>
                      <strong>Date:</strong> {new Date(selectedAnalysis.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h4 className="mb-2" style={{ color: 'var(--accent-primary)' }}>Analysis Verdict</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div className={`score-circle ${selectedAnalysis.result?.fitScore >= 7 ? 'score-high' : selectedAnalysis.result?.fitScore >= 4 ? 'score-medium' : 'score-low'}`} style={{ width: '56px', height: '56px', fontSize: '1.25rem' }}>
                        {selectedAnalysis.result?.fitScore}
                      </div>
                      <div>
                        <span className={`badge ${selectedAnalysis.result?.probability === 'High' ? 'badge-success' : selectedAnalysis.result?.probability === 'Medium' ? 'badge-warning' : 'badge-danger'}`}>
                          {selectedAnalysis.result?.probability} Probability
                        </span>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          Feedback: {selectedAnalysis.feedback_decision ? (selectedAnalysis.feedback_decision === 'yes' ? '👍 Applied' : '👎 Skipped') : 'No feedback yet'}
                        </div>
                      </div>
                    </div>
                    {Array.isArray(selectedAnalysis.feedback_reasons) && selectedAnalysis.feedback_reasons.length > 0 && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <strong>Feedback Reasons:</strong> {selectedAnalysis.feedback_reasons.join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel" style={{ padding: '1.25rem', maxHeight: '250px', overflowY: 'auto' }}>
                    <h4 className="mb-2" style={{ color: 'var(--warning)' }}>Extracted Job Description</h4>
                    <p style={{ fontSize: '0.82rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, margin: 0 }}>
                      {selectedAnalysis.job_description}
                    </p>
                  </div>
                </div>

                {/* Raw JSON Layout Card */}
                <div>
                  <h4 className="mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Raw JSON Response</span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(selectedAnalysis.result, null, 2))}
                    >
                      Copy JSON
                    </button>
                  </h4>
                  <pre className="admin-json-viewer" style={{ maxHeight: '430px' }}>
                    {JSON.stringify(selectedAnalysis.result, null, 2)}
                  </pre>
                </div>

              </div>
            </div>
            
            <div className="admin-modal-footer">
              <button 
                className="btn btn-danger" 
                onClick={(e) => confirmDelete(selectedAnalysis, e)}
              >
                Delete Entry
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedAnalysis(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="admin-modal-overlay" style={{ zIndex: 600 }}>
          <div className="admin-modal-card" style={{ maxWidth: '400px' }}>
            <div className="admin-modal-header">
              <h3>Delete Analysis Entry?</h3>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <Trash2 size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
              <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Are you sure?
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                This will delete the analysis report run for <strong>{itemToDelete?.result?.role} @ {itemToDelete?.result?.company}</strong>. This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowDeleteModal(false); setItemToDelete(null); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
