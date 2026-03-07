import { useEffect, useState } from 'react';

interface RankingStats {
  user: {
    id: string;
    username: string;
    reputation: number;
    level: {
      level: string;
      color: string;
      nextLevel: string;
      nextThreshold: number;
    };
    rank: number;
    totalUsers: number;
    member_since: string;
    questions_count: number;
    answers_count: number;
  };
  stats: {
    reputation: number;
    rank: number;
    level: string;
    badges: {
      upvotes_on_answers: number;
      upvotes_on_questions: number;
      downvotes_on_answers: number;
      downvotes_on_questions: number;
      accepted_answers: number;
    };
    points: {
      from_answer_upvotes: number;
      from_question_upvotes: number;
      from_answer_downvotes: number;
      from_question_downvotes: number;
      from_answer_accepted: number;
    };
    content: {
      questions_asked: number;
      answers_provided: number;
    };
  };
}

export default function UserRankingStats({ userId }: { userId: string }) {
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/v1/users/${userId}/ranking`);
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch ranking stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

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
    if (!stats) return 0;
    const currentLevel = stats.user.level;
    const nextThreshold = currentLevel.nextThreshold;
    const currentRep = stats.user.reputation;
    
    const thresholds = [0, 15, 50, 100, 2000, 5000, 10000];
    const currentIndex = thresholds.findIndex(t => t <= currentRep);
    const currentThreshold = thresholds[currentIndex] || 0;
    
    const progress = ((currentRep - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#718096' }}>Loading ranking stats...</div>;
  }

  if (!stats) {
    return null;
  }

  const { user, stats: userStats } = stats;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '20px',
      marginTop: '20px'
    }}>
      {/* Ranking Card */}
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#2D3748' }}>
          Ranking
        </h3>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${getReputationColor(user.level.color)}, ${getReputationColor(user.level.color)}80)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '32px',
            fontWeight: 'bold'
          }}>
            #{user.rank}
          </div>
          <div>
            <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '14px' }}>Global Rank</p>
            <p style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#2D3748' }}>
              {user.rank} of {user.totalUsers}
            </p>
            <p style={{ margin: '8px 0 0 0', color: '#A0AEC0', fontSize: '13px' }}>
              Top {((user.rank / user.totalUsers) * 100).toFixed(1)}%
            </p>
          </div>
        </div>

        <div style={{
          background: '#F7FAFC',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 5px 0', color: '#718096', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Level
          </p>
          <p style={{
            margin: '0',
            fontSize: '20px',
            fontWeight: 'bold',
            color: getReputationColor(user.level.color)
          }}>
            {user.level.level}
          </p>
        </div>
      </div>

      {/* Reputation Card */}
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#2D3748' }}>
          Reputation
        </h3>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{
            margin: '0 0 10px 0',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#4299E1'
          }}>
            {user.reputation}
          </p>
          <p style={{ margin: '0', color: '#718096', fontSize: '14px' }}>points</p>
        </div>

        <div style={{
          background: '#F7FAFC',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#718096', fontSize: '13px', fontWeight: '600' }}>
                Progress to {user.level.nextLevel}
              </span>
              <span style={{ color: '#718096', fontSize: '13px', fontWeight: '600' }}>
                {getProgressToNextLevel().toFixed(0)}%
              </span>
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
                background: getReputationColor(user.level.color),
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <p style={{
            margin: '0',
            fontSize: '12px',
            color: '#A0AEC0'
          }}>
            {user.level.nextThreshold - user.reputation} more points to {user.level.nextLevel}
          </p>
        </div>
      </div>

      {/* Badges Card */}
      <div style={{
        background: 'white',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '600', color: '#2D3748' }}>
          Achievements
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{
            background: '#F0F4FF',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px' }}>👍</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#4299E1' }}>
              {userStats.badges.upvotes_on_answers}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
              Answer Upvotes
            </p>
          </div>

          <div style={{
            background: '#F0FEE0',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px' }}>✅</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#48BB78' }}>
              {userStats.badges.accepted_answers}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
              Answers Accepted
            </p>
          </div>

          <div style={{
            background: '#FDF2F8',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px' }}>📝</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#ED64A6' }}>
              {userStats.content.questions_asked}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
              Questions Asked
            </p>
          </div>

          <div style={{
            background: '#FEF3C7',
            borderRadius: '8px',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '20px' }}>💡</p>
            <p style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 'bold', color: '#F59E0B' }}>
              {userStats.content.answers_provided}
            </p>
            <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
              Answers Provided
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '16px',
          background: '#F8FAFC',
          borderRadius: '8px',
          padding: '12px',
          border: '1px solid #E2E8F0'
        }}>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: '700', color: '#4A5568' }}>
            Points Breakdown
          </p>
          <p style={{ margin: '0', fontSize: '12px', color: '#718096' }}>
            Answer Upvotes: {userStats.points?.from_answer_upvotes ?? 0} pts
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#718096' }}>
            Accepted Answers: {userStats.points?.from_answer_accepted ?? 0} pts
          </p>
        </div>
      </div>
    </div>
  );
}
