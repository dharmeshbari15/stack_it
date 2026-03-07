'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface ReputationLevel {
  level: string;
  color: string;
  nextLevel: string;
  nextThreshold: number;
}

interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  reputation: number;
  level: ReputationLevel;
  questions_count: number;
  answers_count: number;
  answer_upvotes_received?: number;
  question_upvotes_received?: number;
  member_since: string;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'reputation' | 'questions' | 'answers'>('reputation');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/leaderboard?limit=20&page=${page}&sort_by=${sortBy}`);
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
          setTotalPages(data.data.pagination.total_pages);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [page, sortBy]);

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

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '32px' }}>Global Rankings</h1>
        <p style={{ margin: '0', color: '#718096', fontSize: '16px' }}>
          {sortBy === 'reputation'
            ? 'See where you stand in community reputation rankings'
            : sortBy === 'questions'
              ? 'See top members by questions asked'
              : 'See top members by answers provided'}
        </p>
      </div>

      {/* Sort Options */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        {[
          { value: 'reputation' as const, label: 'Top by Reputation' },
          { value: 'questions' as const, label: 'Top Questioners' },
          { value: 'answers' as const, label: 'Top Answerers' }
        ].map(option => (
          <button
            key={option.value}
            onClick={() => {
              setSortBy(option.value);
              setPage(1);
            }}
            style={{
              padding: '10px 20px',
              background: sortBy === option.value ? '#4299E1' : '#E2E8F0',
              color: sortBy === option.value ? 'white' : '#4A5568',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: sortBy === option.value ? '600' : '500',
              transition: 'all 0.2s'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Table */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#718096'
        }}>
          Loading rankings...
        </div>
      ) : (
        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#F7FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#718096', fontWeight: '600' }}>Rank</th>
                  <th style={{ padding: '16px', textAlign: 'left', color: '#718096', fontWeight: '600' }}>User</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>Reputation</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>
                    {sortBy === 'answers' ? 'Answer Upvotes' : sortBy === 'questions' ? 'Question Count' : 'Score'}
                  </th>
                  <th style={{ padding: '16px', textAlign: 'center', color: '#718096', fontWeight: '600' }}>Level</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>Q's Asked</th>
                  <th style={{ padding: '16px', textAlign: 'right', color: '#718096', fontWeight: '600' }}>A's Given</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((user, index) => (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: '1px solid #E2E8F0',
                      background: index % 2 === 0 ? 'white' : '#F9FAFB',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = '#F0F4FF';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLTableRowElement).style.background = index % 2 === 0 ? 'white' : '#F9FAFB';
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: user.rank <= 3 ? getReputationColor(user.level.color) : '#4A5568',
                          minWidth: '24px'
                        }}>
                          {getMedalEmoji(user.rank)}
                        </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: '#4A5568',
                          fontSize: '16px'
                        }}>
                          #{user.rank}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/users/${user.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{ cursor: 'pointer' }}>
                          <p style={{ margin: '0', fontWeight: '600', color: '#2D3748' }}>
                            {user.username}
                          </p>
                          <p style={{
                            margin: '4px 0 0 0',
                            fontSize: '12px',
                            color: '#A0AEC0'
                          }}>
                            Member since {new Date(user.member_since).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: '#4299E1',
                        fontSize: '16px'
                      }}>
                        {user.reputation}
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#A0AEC0' }}>pts</p>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: '700', color: '#2D3748' }}>
                        {sortBy === 'answers'
                          ? (user.answer_upvotes_received ?? 0)
                          : sortBy === 'questions'
                            ? user.questions_count
                            : user.reputation}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '45px',
                        height: '45px',
                        borderRadius: '50%',
                        background: getReputationColor(user.level.color),
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        padding: '4px'
                      }}>
                        <span>{user.level.level}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', color: '#2D3748' }}>
                        {user.questions_count}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <span style={{ fontWeight: '600', color: '#2D3748' }}>
                        {user.answers_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            padding: '20px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                background: page === 1 ? '#E2E8F0' : '#4299E1',
                color: page === 1 ? '#A0AEC0' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              ← Previous
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#718096'
            }}>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page - 2 + i;
                if (pageNum > 0 && pageNum <= totalPages) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      style={{
                        width: '36px',
                        height: '36px',
                        background: page === pageNum ? '#4299E1' : '#E2E8F0',
                        color: page === pageNum ? 'white' : '#4A5568',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px',
                background: page === totalPages ? '#E2E8F0' : '#4299E1',
                color: page === totalPages ? '#A0AEC0' : 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600'
              }}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div style={{
        marginTop: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D3748' }}>
            {sortBy === 'answers' ? 'How To Climb Answer Rankings' : 'How to Earn Reputation'}
          </h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#718096',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            {sortBy === 'answers' ? (
              <>
                <li>💡 Post more helpful answers</li>
                <li>👍 Get your answers upvoted</li>
                <li>✅ Have your answers accepted</li>
                <li>⚡ Stay active and answer quickly</li>
              </>
            ) : (
              <>
                <li>👍 Get your answer upvoted: +10 pts</li>
                <li>📝 Get your question upvoted: +5 pts</li>
                <li>✅ Have your answer accepted: +15 pts</li>
                <li>👎 Get downvoted: -2 pts</li>
              </>
            )}
          </ul>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D3748' }}>Reputation Levels</h3>
          <div style={{
            fontSize: '13px',
            color: '#718096',
            lineHeight: '1.8'
          }}>
            <div>🔵 <strong>Newbie:</strong> 0 pts</div>
            <div>🟢 <strong>Beginner:</strong> 15 pts</div>
            <div>🔵 <strong>Intermediate:</strong> 50 pts</div>
            <div>🟠 <strong>Advanced:</strong> 100 pts</div>
            <div>🔴 <strong>Veteran:</strong> 2000 pts</div>
            <div>⭐ <strong>Expert:</strong> 5000 pts</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: '8px',
          padding: '20px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2D3748' }}>Unlock Permissions</h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#718096',
            fontSize: '14px',
            lineHeight: '1.8'
          }}>
            <li>15 pts: Vote on content</li>
            <li>50 pts: Comment</li>
            <li>100 pts: Edit your posts</li>
            <li>2000 pts: Edit any post</li>
            <li>5000 pts: Delete posts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
