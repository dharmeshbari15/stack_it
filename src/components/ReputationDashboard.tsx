import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ReputationLevel {
  level: string;
  color: string;
  nextLevel: string | null;
  nextThreshold: number | null;
}

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  reputation: number;
  level: ReputationLevel;
  questions_count: number;
  answers_count: number;
  member_since: string;
}

interface UserStats {
  id: string;
  username: string;
  reputation: number;
  level: ReputationLevel;
  rank: number;
  questions_count: number;
  answers_count: number;
  member_since: string;
}

interface ReputationHistoryEntry {
  id: string;
  change_type: string;
  description: string;
  amount: number;
  reference_id: string;
  created_at: string;
}

export default function ReputationDashboard() {
  const { data: session } = useSession();
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [reputationHistory, setReputationHistory] = useState<ReputationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'leaderboard' | 'history'>('overview');
  const [page, setPage] = useState(1);

  // Resolve current DB user ID (avoids stale session ids)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!session?.user) return;

      try {
        const response = await fetch('/api/v1/users/me');
        const data = await response.json();
        if (response.ok && data.success && data.data?.id) {
          setResolvedUserId(data.data.id);
        }
      } catch (error) {
        console.error('Failed to resolve current user:', error);
      }
    };

    fetchCurrentUser();
  }, [session?.user]);

  // Fetch user ranking stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!resolvedUserId) return;

      try {
        const response = await fetch(`/api/v1/users/${resolvedUserId}/ranking`);
        const data = await response.json();
        if (response.ok && data.success && data.data?.user) {
          const user = data.data.user;
          setUserStats({
            id: user.id,
            username: user.username,
            reputation: user.reputation ?? 0,
            level: {
              level: user.level?.level ?? 'Newbie',
              color: user.level?.color ?? 'lightgray',
              nextLevel: user.level?.nextLevel ?? null,
              nextThreshold: user.level?.nextThreshold ?? null,
            },
            rank: user.rank ?? 1,
            questions_count: user.questions_count ?? 0,
            answers_count: user.answers_count ?? 0,
            member_since: user.member_since,
          });
        }
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
      }
    };

    fetchUserStats();
  }, [resolvedUserId]);

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`/api/v1/leaderboard?limit=20&page=${page}`);
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      }
    };

    fetchLeaderboard();
  }, [page]);

  // Fetch reputation history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!resolvedUserId) return;

      try {
        const response = await fetch(`/api/v1/users/${resolvedUserId}/reputation-history?limit=10`);
        const data = await response.json();
        if (data.success) {
          setReputationHistory(data.data.history);
        }
      } catch (error) {
        console.error('Failed to fetch reputation history:', error);
      }
    };

    fetchHistory();
  }, [resolvedUserId]);

  useEffect(() => {
    if (userStats && leaderboard.length > 0) {
      setLoading(false);
    }
  }, [userStats, leaderboard]);

  const getReputationColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      lightgray: '#A0AEC0',
      green: '#48BB78',
      blue: '#4299E1',
      orange: '#ED8936',
      red: '#F56565',
      gold: '#ECC94B',
      purple: '#9F7AEA'
    };
    return colorMap[color] || '#A0AEC0';
  };

  const getProgressToNextLevel = () => {
    if (!userStats) return 0;
    const currentLevel = userStats.level;
    const nextThreshold = currentLevel.nextThreshold;
    const currentRep = userStats.reputation;

    if (!nextThreshold || nextThreshold <= currentRep) return 100;
    
    // Find current threshold
    const thresholds = [0, 15, 50, 100, 2000, 5000, 10000];
    const currentIndex = thresholds.findIndex(t => t <= currentRep);
    const currentThreshold = thresholds[currentIndex] || 0;
    
    const progress = ((currentRep - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading reputation dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1>Reputation Dashboard</h1>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '1px solid #E2E8F0'
      }}>
        {['overview', 'leaderboard', 'history'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === tab ? '#4299E1' : 'transparent',
              color: activeTab === tab ? 'white' : '#4A5568',
              cursor: 'pointer',
              fontSize: '16px',
              textTransform: 'capitalize',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && userStats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* User Card */}
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h2>Your Profile</h2>
            <div style={{ marginTop: '20px' }}>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '14px' }}>Username</p>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{userStats.username}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '14px' }}>Rank</p>
                <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>#{userStats.rank} of {leaderboard.length}</p>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: getReputationColor(userStats.level.color),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '12px',
                    textAlign: 'center',
                    padding: '5px'
                  }}>
                    {userStats.level.level}
                  </div>
                  <div>
                    <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '14px' }}>Level</p>
                    <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>{userStats.level.level}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '14px' }}>Reputation</p>
                <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#4299E1' }}>
                  {userStats.reputation} pts
                </p>
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
                    Progress to {userStats.level.nextLevel ?? 'Next level'}
                  </p>
                  <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
                    {getProgressToNextLevel().toFixed(0)}%
                  </p>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#E2E8F0',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${getProgressToNextLevel()}%`,
                    height: '100%',
                    background: getReputationColor(userStats.level.color),
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#718096' }}>
                  {Math.max(0, (userStats.level.nextThreshold ?? userStats.reputation) - userStats.reputation)} pts to reach {userStats.level.nextLevel ?? 'next level'}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div style={{
            background: 'white',
            border: '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}>
            <h2>Your Statistics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#4299E1' }}>
                  {userStats.questions_count}
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#718096', fontSize: '14px' }}>Questions asked</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', color: '#48BB78' }}>
                  {userStats.answers_count}
                </p>
                <p style={{ margin: '10px 0 0 0', color: '#718096', fontSize: '14px' }}>Answers provided</p>
              </div>
            </div>

            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #E2E8F0' }}>
              <h3 style={{ margin: '0 0 15px 0' }}>Reputation Breakdown</h3>
              <div style={{ fontSize: '14px', color: '#718096' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Question Upvote (+5)</span>
                  <span style={{ color: '#48BB78' }}>+5 per vote</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Question Downvote (-2)</span>
                  <span style={{ color: '#F56565' }}>-2 per vote</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Answer Upvote (+10)</span>
                  <span style={{ color: '#48BB78' }}>+10 per vote</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span>Answer Downvote (-2)</span>
                  <span style={{ color: '#F56565' }}>-2 per vote</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Answer Accepted (+15)</span>
                  <span style={{ color: '#ECC94B' }}>+15 when accepted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2>Global Leaderboard</h2>
          <div style={{ overflowX: 'auto', marginTop: '20px' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#718096', fontWeight: '600' }}>Rank</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#718096', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>Reputation</th>
                  <th style={{ padding: '12px', textAlign: 'center', color: '#718096', fontWeight: '600' }}>Level</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>Questions</th>
                  <th style={{ padding: '12px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>Answers</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      background: userStats?.id === user.id ? '#F0F4FF' : 'transparent'
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: index < 3 ? getReputationColor(user.level.color) : '#718096'
                      }}>
                        {index < 3 ? ['🥇', '🥈', '🥉'][index] : ''} #{user.rank}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div>
                        <p style={{ margin: '0', fontWeight: '500' }}>{user.username}</p>
                        <p style={{ margin: '0', fontSize: '12px', color: '#A0AEC0' }}>
                          Member since {new Date(user.member_since).toLocaleDateString()}
                        </p>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <span style={{ fontWeight: 'bold', color: '#4299E1' }}>
                        {user.reputation} pts
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: getReputationColor(user.level.color),
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        padding: '2px'
                      }}>
                        {user.level.level}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{user.questions_count}</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{user.answers_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                background: page === 1 ? '#E2E8F0' : '#4299E1',
                color: page === 1 ? '#A0AEC0' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: page === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 16px', color: '#718096' }}>Page {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              style={{
                padding: '8px 16px',
                background: '#4299E1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h2>Your Reputation History</h2>
          
          {reputationHistory.length === 0 ? (
            <p style={{ color: '#718096', textAlign: 'center', padding: '40px 20px' }}>
              No reputation history yet. Start voting and earning reputation!
            </p>
          ) : (
            <div style={{ marginTop: '20px' }}>
              {reputationHistory.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '15px',
                    borderBottom: '1px solid #E2E8F0',
                    fontSize: '14px'
                  }}
                >
                  <div>
                    <p style={{ margin: '0', fontWeight: '500' }}>{entry.description}</p>
                    <p style={{ margin: '5px 0 0 0', color: '#A0AEC0', fontSize: '12px' }}>
                      {new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: entry.amount >= 0 ? '#48BB78' : '#F56565'
                  }}>
                    {entry.amount >= 0 ? '+' : ''}{entry.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
