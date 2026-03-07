/**
 * Reputation System Testing Script
 * Tests the complete reputation and gamification system
 */

const BASE_URL = 'http://localhost:3000';

// Helper function to make API requests
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        console.error('API Request failed:', error.message);
        return { status: 0, data: { error: error.message } };
    }
}

// Test 1: Login and get session
async function loginUser(email, password) {
    console.log('\n📝 Logging in user:', email);
    const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        redirect: 'manual'
    });
    
    const cookies = response.headers.get('set-cookie');
    if (cookies) {
        // Extract session cookie
        const sessionCookie = cookies.split(';')[0];
        console.log('✅ Login successful');
        return sessionCookie;
    }
    console.error('❌ Login failed');
    return null;
}

// Test 2: Get user's current reputation
async function getUserReputation(userId, cookie) {
    console.log('\n💰 Fetching user reputation for:', userId);
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/users/${userId}`, {
        headers: { Cookie: cookie }
    });
    
    if (status === 200 && data.success) {
        console.log(`✅ User: ${data.data.username}`);
        console.log(`   Reputation: ${data.data.reputation || 0}`);
        return data.data.reputation || 0;
    }
    console.error('❌ Failed to fetch user:', data);
    return 0;
}

// Test 3: Vote on a question (upvote)
async function voteOnQuestion(questionId, voteType, cookie) {
    console.log(`\n👍 Voting ${voteType} on question:`, questionId);
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/questions/${questionId}/vote`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify({ voteType })
    });
    
    if (status === 200 && data.success) {
        console.log('✅ Vote successful');
        console.log('   Reputation change:', data.data.reputation_change);
        return data.data;
    }
    console.error('❌ Vote failed:', data);
    return null;
}

// Test 4: Vote on an answer (upvote)
async function voteOnAnswer(answerId, voteType, cookie) {
    console.log(`\n👍 Voting ${voteType} on answer:`, answerId);
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/answers/${answerId}/vote`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify({ voteType })
    });
    
    if (status === 200 && data.success) {
        console.log('✅ Vote successful');
        console.log('   Reputation change:', data.data.reputation_change);
        return data.data;
    }
    console.error('❌ Vote failed:', data);
    return null;
}

// Test 5: Accept an answer
async function acceptAnswer(questionId, answerId, cookie) {
    console.log('\n✨ Accepting answer:', answerId);
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/questions/${questionId}/accept-answer`, {
        method: 'POST',
        headers: { Cookie: cookie },
        body: JSON.stringify({ answerId })
    });
    
    if (status === 200 && data.success) {
        console.log('✅ Answer accepted');
        return data.data;
    }
    console.error('❌ Accept answer failed:', data);
    return null;
}

// Test 6: Get leaderboard
async function getLeaderboard(cookie) {
    console.log('\n🏆 Fetching leaderboard...');
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/leaderboard?limit=5`, {
        headers: { Cookie: cookie }
    });
    
    if (status === 200 && data.success) {
        console.log('✅ Leaderboard retrieved:');
        data.data.leaderboard.forEach((user, idx) => {
            console.log(`   ${idx + 1}. ${user.username} - ${user.reputation} pts (${user.level.name})`);
        });
        return data.data.leaderboard;
    }
    console.error('❌ Leaderboard failed:', data);
    return null;
}

// Test 7: Get reputation history
async function getReputationHistory(userId, cookie) {
    console.log(`\n📊 Fetching reputation history for user:`, userId);
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/users/${userId}/reputation-history?limit=10`, {
        headers: { Cookie: cookie }
    });
    
    if (status === 200 && data.success) {
        console.log('✅ Reputation history retrieved:');
        console.log(`   Current Reputation: ${data.data.user.current_reputation}`);
        console.log('   Recent changes:');
        data.data.history.forEach(entry => {
            const sign = entry.amount >= 0 ? '+' : '';
            console.log(`   - ${entry.description}: ${sign}${entry.amount} (${new Date(entry.created_at).toLocaleString()})`);
        });
        return data.data.history;
    }
    console.error('❌ Reputation history failed:', data);
    return null;
}

// Test 8: Get a list of questions to test with
async function getQuestions(cookie) {
    const { status, data } = await apiRequest(`${BASE_URL}/api/v1/questions?limit=5`, {
        headers: { Cookie: cookie }
    });
    
    if (status === 200 && data.success) {
        return data.data.questions;
    }
    return [];
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Reputation System Tests\n');
    console.log('='.repeat(60));

    // User credentials from seed data
    const voter = { email: 'alice@example.com', password: 'Password123!' };
    const questionAuthor = { email: 'bob@example.com', password: 'Password123!' };

    // Step 1: Login users
    const voterCookie = await loginUser(voter.email, voter.password);
    if (!voterCookie) return;

    const authorCookie = await loginUser(questionAuthor.email, questionAuthor.password);
    if (!authorCookie) return;

    // Step 2: Get questions
    const questions = await getQuestions(voterCookie);
    if (questions.length === 0) {
        console.error('❌ No questions found in database');
        return;
    }

    const testQuestion = questions[0];
    console.log('\n📌 Using test question:', testQuestion.id);
    console.log('   Title:', testQuestion.title);
    console.log('   Author:', testQuestion.author.username);

    // Step 3: Get initial reputation
    const questionAuthorId = testQuestion.author.id;
    const initialReputation = await getUserReputation(questionAuthorId, authorCookie);

    // Step 4: Vote on question (as voter)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Question Upvote (+5 reputation)');
    console.log('='.repeat(60));
    await voteOnQuestion(testQuestion.id, 'upvote', voterCookie);
    const afterUpvote = await getUserReputation(questionAuthorId, authorCookie);
    console.log(`✓ Reputation: ${initialReputation} → ${afterUpvote} (Expected: +5)`);

    // Step 5: Change vote to downvote
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Question Downvote (-2 reputation, removes +5)');
    console.log('='.repeat(60));
    await voteOnQuestion(testQuestion.id, 'downvote', voterCookie);
    const afterDownvote = await getUserReputation(questionAuthorId, authorCookie);
    console.log(`✓ Reputation: ${afterUpvote} → ${afterDownvote} (Expected: -7 total)`);

    // Step 6: Remove vote
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Remove vote (reverses downvote)');
    console.log('='.repeat(60));
    await voteOnQuestion(testQuestion.id, 'downvote', voterCookie); // Toggle removes vote
    const afterRemove = await getUserReputation(questionAuthorId, authorCookie);
    console.log(`✓ Reputation: ${afterDownvote} → ${afterRemove} (Expected: +2, back to initial)`);

    // Step 7: Test answer voting if answers exist
    if (testQuestion.answers && testQuestion.answers.length > 0) {
        const testAnswer = testQuestion.answers[0];
        const answerAuthorId = testAnswer.author.id;
        
        console.log('\n' + '='.repeat(60));
        console.log('TEST 4: Answer Upvote (+10 reputation)');
        console.log('='.repeat(60));
        console.log('   Answer author:', testAnswer.author.username);
        const answerInitial = await getUserReputation(answerAuthorId, authorCookie);
        await voteOnAnswer(testAnswer.id, 'upvote', voterCookie);
        const answerAfter = await getUserReputation(answerAuthorId, authorCookie);
        console.log(`✓ Reputation: ${answerInitial} → ${answerAfter} (Expected: +10)`);

        // Step 8: Accept answer (if question has answers and author is logged in)
        if (testQuestion.author.email === questionAuthor.email) {
            console.log('\n' + '='.repeat(60));
            console.log('TEST 5: Accept Answer (+15 reputation)');
            console.log('='.repeat(60));
            const beforeAccept = await getUserReputation(answerAuthorId, authorCookie);
            await acceptAnswer(testQuestion.id, testAnswer.id, authorCookie);
            const afterAccept = await getUserReputation(answerAuthorId, authorCookie);
            console.log(`✓ Reputation: ${beforeAccept} → ${afterAccept} (Expected: +15)`);
        }
    }

    // Step 9: Test leaderboard
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Leaderboard');
    console.log('='.repeat(60));
    await getLeaderboard(voterCookie);

    // Step 10: Test reputation history
    console.log('\n' + '='.repeat(60));
    console.log('TEST 7: Reputation History');
    console.log('='.repeat(60));
    await getReputationHistory(questionAuthorId, authorCookie);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Tests Complete!');
    console.log('='.repeat(60));
}

// Run the tests
runTests().catch(error => {
    console.error('\n❌ Test suite failed:', error);
});
