import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, UserCheck, UserX, X, Download, Eye, FileText } from 'lucide-react';
import './admin.css';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal states
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAnalyses, setUserAnalyses] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');

  const fetchUsersAndAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: usersData, error: usersError } = await supabase.rpc('admin_get_users', { admin_pass: savedPass });
      if (usersError) throw usersError;

      const { data: analysesData, error: analysesError } = await supabase.rpc('admin_get_analyses', { admin_pass: savedPass });
      if (analysesError) throw analysesError;

      setUsers(usersData || []);
      setAnalyses(analysesData || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch users list');
    } finally {
      setLoading(false);
    }
  }, [savedPass]);

  useEffect(() => {
    let active = true;
    if (active) {
      Promise.resolve().then(() => {
        fetchUsersAndAnalyses();
      });
    }
    return () => {
      active = false;
    };
  }, [fetchUsersAndAnalyses]);

  // Filter application optimized with useMemo
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search query (email or profile name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => {
        const emailMatch = u.email?.toLowerCase().includes(q);
        const nameMatch = u.profile_data?.profile?.name?.toLowerCase().includes(q);
        return emailMatch || nameMatch;
      });
    }

    // Joined date filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(u => new Date(u.created_at) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(u => new Date(u.created_at) <= end);
    }

    return result;
  }, [searchQuery, startDate, endDate, users]);

  // Open profile modal
  const handleViewProfile = (userRecord) => {
    setSelectedUser(userRecord);
    // Find all analyses run by this user
    const matchingAnalyses = analyses.filter(a => a.user_id === userRecord.user_id);
    setUserAnalyses(matchingAnalyses);
  };

  // Open delete modal
  const confirmDeleteUser = (userRecord, e) => {
    e.stopPropagation();
    setUserToDelete(userRecord);
    setShowDeleteModal(true);
  };

  // Execute delete user
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      const { error: deleteError } = await supabase.rpc('admin_delete_user', { 
        admin_pass: savedPass, 
        target_user_id: userToDelete.user_id 
      });

      if (deleteError) throw deleteError;

      // Close modal and refresh lists
      setShowDeleteModal(false);
      setUserToDelete(null);
      if (selectedUser?.user_id === userToDelete.user_id) {
        setSelectedUser(null);
      }
      await fetchUsersAndAnalyses();
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Export Users to CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    
    // Headers
    const headers = ['Email', 'Name', 'Joined Date', 'Total Analyses', 'Last Active', 'Onboarding Complete'];
    
    // Rows
    const rows = filteredUsers.map(u => [
      u.email || 'Anonymous',
      u.profile_data?.profile?.name || '-',
      new Date(u.created_at).toISOString().split('T')[0],
      u.total_analyses || 0,
      u.last_active ? new Date(u.last_active).toISOString().split('T')[0] : '-',
      u.profile_data?.profile?.name ? 'Yes' : 'No'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `joblens_users_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Users Management</h1>
        <button 
          className="btn btn-secondary admin-export-btn" 
          onClick={handleExportCSV}
          disabled={filteredUsers.length === 0}
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

      {/* Filter Bar */}
      <div className="admin-filter-bar">
        <div className="admin-filters-left">
          <input
            type="text"
            className="admin-filter-input"
            placeholder="Search email or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          Showing {filteredUsers.length} of {users.length} users
        </span>
      </div>

      {/* Users Table */}
      <div className="admin-table-card glass-panel">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Name</th>
                <th>Joined Date</th>
                <th>Total Analyses</th>
                <th>Last Active</th>
                <th>Onboarding</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%', border: '2px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No users found matching filters
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isOnboarded = !!u.profile_data?.profile?.name;
                  return (
                    <tr 
                      key={u.user_id} 
                      className="admin-row-clickable"
                      onClick={() => handleViewProfile(u)}
                    >
                      <td style={{ fontWeight: 500 }}>{u.email || 'Anonymous'}</td>
                      <td>{u.profile_data?.profile?.name || '-'}</td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
                          {u.total_analyses || 0}
                        </span>
                      </td>
                      <td>{formatDate(u.last_active)}</td>
                      <td>
                        {isOnboarded ? (
                          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                            <UserCheck size={14} /> Complete
                          </span>
                        ) : (
                          <span style={{ color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600 }}>Incomplete</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={() => handleViewProfile(u)}
                          >
                            <Eye size={13} />
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.35rem 0.65rem' }}
                            onClick={(e) => confirmDeleteUser(u, e)}
                          >
                            <UserX size={13} />
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

      {/* User Profile Drill-Down Modal */}
      {selectedUser && (
        <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>User Detail: {selectedUser.email}</h3>
              <button className="admin-modal-close" onClick={() => setSelectedUser(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="admin-modal-body">
              <div className="admin-modal-grid">
                
                {/* Profile Data Info */}
                <div>
                  <h4 className="mb-2" style={{ color: 'var(--accent-primary)', fontSize: '0.95rem' }}>Personal Profile</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Full Name</span>
                      <span style={{ fontWeight: 600 }}>{selectedUser.profile_data?.profile?.name || 'Not filled'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>City / Location</span>
                      <span>{selectedUser.profile_data?.profile?.city || 'Not filled'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Education</span>
                      <span>{selectedUser.profile_data?.profile?.education || '-'} (Grad: {selectedUser.profile_data?.profile?.gradYear || '-'})</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Employment Status</span>
                      <span>{selectedUser.profile_data?.profile?.employed || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Stated Goals</span>
                      <span style={{ fontSize: '0.88rem' }}>{(selectedUser.profile_data?.goals || []).join(', ') || 'None'}</span>
                    </div>
                  </div>

                  <h4 className="mb-2" style={{ color: 'var(--accent-secondary)', fontSize: '0.95rem' }}>Preferences & Job Target</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Target Roles</span>
                      <span style={{ fontSize: '0.88rem' }}>{(selectedUser.profile_data?.targetRoles || []).join(', ') || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Work Types & locations</span>
                      <span style={{ fontSize: '0.88rem' }}>
                        {(selectedUser.profile_data?.preferences?.workTypes || []).join(', ')} | {(selectedUser.profile_data?.preferences?.locations || []).join(', ')}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Salary Expectation</span>
                      <span>{selectedUser.profile_data?.preferences?.stipend || '-'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', display: 'block' }}>Skills & Tools</span>
                      <span style={{ fontSize: '0.82rem', color: '#10b981', display: 'block', wordBreak: 'break-word', marginTop: '0.2rem' }}>
                        Skills: {(selectedUser.profile_data?.selectedSkills || []).join(', ') || '-'}
                      </span>
                      <span style={{ fontSize: '0.82rem', color: '#8b5cf6', display: 'block', wordBreak: 'break-word', marginTop: '0.2rem' }}>
                        Tools: {[(selectedUser.profile_data?.selectedTools || []).join(', '), (selectedUser.profile_data?.selectedAiTools || []).join(', ')].filter(Boolean).join(', ') || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resume and Analyses History */}
                <div>
                  <h4 className="mb-2" style={{ color: 'var(--warning)', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FileText size={16} /> Resume Text Snippet
                  </h4>
                  <div style={{ 
                    maxHeight: '140px', 
                    overflowY: 'auto', 
                    fontSize: '0.75rem', 
                    background: 'rgba(0,0,0,0.3)', 
                    padding: '0.75rem', 
                    borderRadius: '8px', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    whiteSpace: 'pre-wrap',
                    marginBottom: '1.5rem'
                  }}>
                    {selectedUser.profile_data?.links?.resumeText || 'No resume text uploaded.'}
                  </div>

                  <h4 className="mb-2" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>Analyses History ({userAnalyses.length})</h4>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {userAnalyses.length === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>No analyses run yet</span>
                    ) : (
                      userAnalyses.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                            <span style={{ fontWeight: 600 }}>{a.result?.role || 'Role'}</span> @ {a.result?.company || 'Company'}
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <span className={`badge ${a.result?.fitScore >= 7 ? 'badge-success' : a.result?.fitScore >= 4 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                              {a.result?.fitScore}/10
                            </span>
                            {a.feedback_decision && (
                              <span>{a.feedback_decision === 'yes' ? '👍' : '👎'}</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Personality Signal */}
              {selectedUser.profile_data?.personalitySignal && (
                <div style={{ marginTop: '1.5rem', background: 'rgba(245,158,11,0.04)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <h4 style={{ fontSize: '0.88rem', color: 'var(--warning)', marginBottom: '0.4rem' }}>Personality Signal</h4>
                  <p style={{ fontSize: '0.82rem', margin: 0, lineHeight: 1.5 }}>"{selectedUser.profile_data.personalitySignal}"</p>
                </div>
              )}
            </div>
            
            <div className="admin-modal-footer">
              <button 
                className="btn btn-danger" 
                onClick={(e) => confirmDeleteUser(selectedUser, e)}
              >
                Delete User
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
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
              <h3>Delete User?</h3>
            </div>
            <div className="admin-modal-body" style={{ textAlign: 'center' }}>
              <UserX size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
              <p style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Are you absolutely sure?
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                This will delete user <strong style={{ color: 'var(--danger)' }}>{userToDelete?.email}</strong> and completely purge their profiles, uploads, and analyses logs. This action is irreversible.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger" 
                style={{ background: 'var(--danger)', color: 'white' }}
                onClick={handleDeleteUser}
                disabled={deleting}
              >
                {deleting ? 'Purging...' : 'Yes, Purge User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
