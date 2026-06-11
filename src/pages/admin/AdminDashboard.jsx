import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, LineChart, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './admin.css';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnalyses: 0,
    analysesToday: 0,
    avgFitScore: 0
  });
  const [dailyData, setDailyData] = useState([]);
  const [scoreData, setScoreData] = useState([]);
  const [spamData, setSpamData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const savedPass = sessionStorage.getItem('joblens_admin_pass') || localStorage.getItem('joblens_admin_pass');
        
        // 1. Fetch Users
        const { data: users, error: usersError } = await supabase.rpc('admin_get_users', { admin_pass: savedPass });
        if (usersError) throw usersError;

        // 2. Fetch Analyses
        const { data: analyses, error: analysesError } = await supabase.rpc('admin_get_analyses', { admin_pass: savedPass });
        if (analysesError) throw analysesError;

        if (!active) return;

        // Process statistics
        const totalUsers = users?.length || 0;
        const totalAnalyses = analyses?.length || 0;
        
        // Analyses today (based on local time match)
        const todayStr = new Date().toISOString().split('T')[0];
        const analysesToday = (analyses || []).filter(a => {
          return new Date(a.created_at).toISOString().split('T')[0] === todayStr;
        }).length;

        // Average Fit Score
        let totalScore = 0;
        let scoreCount = 0;
        (analyses || []).forEach(a => {
          const score = a.result?.fitScore;
          if (typeof score === 'number') {
            totalScore += score;
            scoreCount++;
          }
        });
        const avgFitScore = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '0.0';

        setStats({ totalUsers, totalAnalyses, analysesToday, avgFitScore });

        // Chart 1: Daily analyses over the last 30 days
        const last30Days = Array.from({ length: 30 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const dailyMap = {};
        last30Days.forEach(date => { dailyMap[date] = 0; });
        (analyses || []).forEach(a => {
          const dateStr = new Date(a.created_at).toISOString().split('T')[0];
          if (dailyMap[dateStr] !== undefined) {
            dailyMap[dateStr]++;
          }
        });
        const dailyChartData = last30Days.map(date => ({
          date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          Analyses: dailyMap[date]
        }));
        setDailyData(dailyChartData);

        // Chart 2: Fit score distribution (1-10)
        const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({
          score: (i + 1).toString(),
          Count: 0
        }));
        (analyses || []).forEach(a => {
          const score = a.result?.fitScore;
          if (score >= 1 && score <= 10) {
            scoreDistribution[score - 1].Count++;
          }
        });
        setScoreData(scoreDistribution);

        // Chart 3: Spam vs Legit Job Post Ratio
        let spamCount = 0;
        let legitCount = 0;
        (analyses || []).forEach(a => {
          if (a.result?.isSpam === true) spamCount++;
          else legitCount++;
        });
        setSpamData([
          { name: 'Legit', value: legitCount },
          { name: 'Spam', value: spamCount }
        ]);

        // Recent Activity Feed (last 10 analyses)
        setRecentActivity((analyses || []).slice(0, 10));

      } catch (err) {
        if (active) setError(err.message || 'Failed to fetch dashboard data');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: 'var(--accent-primary)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <h3>Error loading Dashboard</h3>
        <p style={{ marginTop: '0.5rem' }}>{error}</p>
      </div>
    );
  }

  const PIE_COLORS = ['#3b82f6', '#ef4444'];

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Overview Dashboard</h1>

      {/* Metric Cards Grid */}
      <div className="admin-metrics-grid">
        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon blue">
            <Users size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Total Users</span>
            <span className="admin-metric-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon purple">
            <LineChart size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Total Analyses</span>
            <span className="admin-metric-value">{stats.totalAnalyses}</span>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon green">
            <TrendingUp size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Analyses Today</span>
            <span className="admin-metric-value">{stats.analysesToday}</span>
          </div>
        </div>

        <div className="admin-metric-card glass-panel">
          <div className="admin-metric-icon orange">
            <Sparkles size={22} />
          </div>
          <div className="admin-metric-info">
            <span className="admin-metric-label">Avg Fit Score</span>
            <span className="admin-metric-value">{stats.avgFitScore} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 10</span></span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="admin-charts-grid">
        <div className="admin-chart-card glass-panel">
          <div className="admin-chart-header">
            <span>Analyses Trend (Last 30 Days)</span>
          </div>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', color: '#fff' }} />
                <Line type="monotone" dataKey="Analyses" stroke="var(--accent-primary)" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card glass-panel">
          <div className="admin-chart-header">
            <span>Fit Score Distribution (1-10)</span>
          </div>
          <div className="admin-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="score" stroke="var(--text-secondary)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', color: '#fff' }} />
                <Bar dataKey="Count" fill="var(--accent-secondary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-chart-card glass-panel">
          <div className="admin-chart-header">
            <span>Legit vs Spam Job Posts Ratio</span>
          </div>
          <div className="admin-chart-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {stats.totalAnalyses === 0 ? (
              <span style={{ color: 'var(--text-secondary)' }}>No analyses data available</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spamData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {spamData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', borderColor: 'var(--border-color)', color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} formatter={(value) => {
                    const count = spamData.find(d => d.name === value)?.value || 0;
                    const percent = stats.totalAnalyses > 0 ? ((count / stats.totalAnalyses) * 100).toFixed(0) : 0;
                    return <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{value}: {count} ({percent}%)</span>;
                  }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <h2 style={{ marginBottom: '1rem', marginTop: '2.5rem' }}>Recent Analyses Feed</h2>
      <div className="admin-table-card glass-panel">
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Company</th>
                <th>Role</th>
                <th>Fit Score</th>
                <th>Type</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No recent analyses found
                  </td>
                </tr>
              ) : (
                recentActivity.map((activity) => (
                  <tr key={activity.id}>
                    <td style={{ fontWeight: 500 }}>{activity.email || 'Anonymous'}</td>
                    <td>{activity.result?.company || '—'}</td>
                    <td>{activity.result?.role || '—'}</td>
                    <td>
                      <span className={`badge ${activity.result?.fitScore >= 7 ? 'badge-success' : activity.result?.fitScore >= 4 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                        {activity.result?.fitScore ?? '?'} / 10
                      </span>
                    </td>
                    <td>
                      {activity.result?.isSpam ? (
                        <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600 }}>
                          <ShieldAlert size={14} /> Spam
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>Legit</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{formatDate(activity.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
