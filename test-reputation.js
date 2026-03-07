const BASE_URL = "http://localhost:3000";

async function makeRequest(method, path, body = null, cookies = null) {
    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };
    
    if (cookies) {
        options.headers["Cookie"] = cookies;
    }
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${BASE_URL}${path}`, options);
        const contentType = response.headers.get("content-type");
        let data = null;
        
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        return { status: response.status, data, headers: response.headers };
    } catch (error) {
        console.error("Request failed:", error.message);
        return { status: 0, data: { error: error.message }, headers: null };
    }
}

async function runTests() {
    console.log("\n========================================");
    console.log("Reputation System Test Suite");
    console.log("========================================\n");
    
    let passCount = 0;
    let totalTests = 0;
    
    // Seed data credentials
    const seedUsers = [
        { username: "alice_dev", email: "alice@example.com", password: "Password123!" },
        { username: "bob_smith", email: "bob@example.com", password: "Password123!" },
        { username: "charlie_code", email: "charlie@example.com", password: "Password123!" }
    ];
    
    // Test 1: Get questions
    console.log("[Test 1] Fetching questions...");
    const questionsRes = await makeRequest("GET", "/api/v1/questions?limit=5");
    
    if (questionsRes.status !== 200 || !questionsRes.data.success) {
        console.error("[FAIL] Could not fetch questions");
        return;
    }
    
    const questions = questionsRes.data.data.questions;
    if (!questions || questions.length === 0) {
        console.error("[FAIL] No questions in database");
        return;
    }
    
    const question = questions[0];
    console.log("✓ Found question:", question.title);
    console.log("  Author:", question.author.username);
    console.log("  ID:", question.id);
    
    const authorId = question.author.id;
    const questionId = question.id;
    
    // Test 2: Use existing seed user for voting
    console.log("\n[Test 2] Getting an existing user for voting...");
    // Just use the first seed user that's not the question author
    const voterEmail = "alice@example.com"; // Alice will vote on other's questions
    const voterId = "69b68773-55f7-495c-a2ec-a1356253437f"; // Alice's ID from seed
    
    console.log("✓ Using voter: alice_dev");
    
    // We won't have session cookies, so tests that need auth will be marked as skipped
    const cookies = null;
    
    // Test 3: Get initial reputation
    console.log("\n[Test 3] Getting user reputation...");
    const userRes = await makeRequest("GET", `/api/v1/users/${authorId}`, null, cookies);
    
    if (userRes.status !== 200 || !userRes.data.success) {
        console.error("[FAIL] Could not fetch user");
        console.error(userRes.data);
        return;
    }
    
    const initialRep = userRes.data.data.reputation;
    console.log("✓ Initial reputation:", initialRep);
    
    // Test 4: Vote on question (upvote)
    totalTests++;
    console.log("\n[Test 4] Voting on question (upvote)...");
    const voteRes1 = await makeRequest("POST", `/api/v1/questions/${questionId}/vote`, 
        { voteType: "upvote" }, cookies);
    
    if (voteRes1.status === 200 && voteRes1.data.success) {
        const userRes2 = await makeRequest("GET", `/api/v1/users/${authorId}`, null, cookies);
        const afterUpvote = userRes2.data.data.reputation;
        
        const passed = afterUpvote === initialRep + 5;
        console.log(passed ? "✓ [PASS]" : "✗ [FAIL]", "Question upvote +5");
        console.log(`  Reputation: ${initialRep} -> ${afterUpvote} (expected ${initialRep + 5})`);
        if (passed) passCount++;
    } else {
        console.log("✗ [FAIL] Vote failed");
        console.error(voteRes1.data);
    }
    
    // Test 5: Switch to downvote
    totalTests++;
    console.log("\n[Test 5] Changing vote to downvote...");
    const voteRes2 = await makeRequest("POST", `/api/v1/questions/${questionId}/vote`, 
        { voteType: "downvote" }, cookies);
    
    if (voteRes2.status === 200) {
        const userRes3 = await makeRequest("GET", `/api/v1/users/${authorId}`, null, cookies);
        const afterDownvote = userRes3.data.data.reputation;
        const afterUpvoteValue = initialRep + 5;
        
        const passed = afterDownvote === afterUpvoteValue - 7;
        console.log(passed ? "✓ [PASS]" : "✗ [FAIL]", "Question downvote (-7 total)");
        console.log(`  Reputation: ${afterUpvoteValue} -> ${afterDownvote} (expected ${afterUpvoteValue - 7})`);
        if (passed) passCount++;
    } else {
        console.log("✗ [FAIL] Vote change failed");
    }
    
    // Test 6: Remove vote
    totalTests++;
    console.log("\n[Test 6] Removing vote...");
    const voteRes3 = await makeRequest("POST", `/api/v1/questions/${questionId}/vote`, 
        { voteType: "downvote" }, cookies);
    
    if (voteRes3.status === 200) {
        const userRes4 = await makeRequest("GET", `/api/v1/users/${authorId}`, null, cookies);
        const afterRemove = userRes4.data.data.reputation;
        
        const passed = afterRemove === initialRep;
        console.log(passed ? "✓ [PASS]" : "✗ [FAIL]", "Vote removal (+2)");
        console.log(`  Reputation: back to ${afterRemove} (expected ${initialRep})`);
        if (passed) passCount++;
    } else {
        console.log("✗ [FAIL] Vote removal failed");
    }
    
    // Test 7: Answer voting (if answer exists)
    if (answerId) {
        totalTests++;
        console.log("\n[Test 7] Voting on answer (upvote)...");
        
        const answer = question.answers[0];
        const answerAuthorId = answer.author.id;
        
        const answerAuthorRes = await makeRequest("GET", `/api/v1/users/${answerAuthorId}`, null, cookies);
        const answerInitialRep = answerAuthorRes.data.data.reputation;
        
        const answerVoteRes = await makeRequest("POST", `/api/v1/answers/${answerId}/vote`, 
            { voteType: "upvote" }, cookies);
        
        if (answerVoteRes.status === 200) {
            const answerAuthorRes2 = await makeRequest("GET", `/api/v1/users/${answerAuthorId}`, null, cookies);
            const afterAnswerVote = answerAuthorRes2.data.data.reputation;
            
            const passed = afterAnswerVote === answerInitialRep + 10;
            console.log(passed ? "✓ [PASS]" : "✗ [FAIL]", "Answer upvote +10");
            console.log(`  Reputation: ${answerInitialRep} -> ${afterAnswerVote} (expected ${answerInitialRep + 10})`);
            if (passed) passCount++;
        } else {
            console.log("✗ [FAIL] Answer vote failed");
        }
    }
    
    // Test 8: Leaderboard
    totalTests++;
    console.log("\n[Test 8] Testing leaderboard...");
    const leaderboardRes = await makeRequest("GET", "/api/v1/leaderboard?limit=5");
    
    if (leaderboardRes.status === 200 && leaderboardRes.data.success) {
        console.log("✓ [PASS] Leaderboard working");
        console.log("  Top 5 users:");
        leaderboardRes.data.data.leaderboard.forEach(user => {
            console.log(`    ${user.rank}. ${user.username} - ${user.reputation} pts (${user.level.level})`);
        });
        passCount++;
    } else {
        console.log("✗ [FAIL] Leaderboard failed");
    }
    
    // Test 9: Reputation history
    totalTests++;
    console.log("\n[Test 9] Testing reputation history...");
    const historyRes = await makeRequest("GET", `/api/v1/users/${authorId}/reputation-history?limit=10`);
    
    if (historyRes.status === 200 && historyRes.data.success) {
        console.log("✓ [PASS] Reputation history working");
        console.log(`  User: ${historyRes.data.data.user.username}`);
        console.log(`  Current reputation: ${historyRes.data.data.user.current_reputation}`);
        if (historyRes.data.data.history.length > 0) {
            console.log("  Recent changes:");
            historyRes.data.data.history.slice(0, 5).forEach(entry => {
                const sign = entry.amount >= 0 ? "+" : "";
                console.log(`    - ${entry.description}: ${sign}${entry.amount}`);
            });
        }
        passCount++;
    } else {
        console.log("✗ [FAIL] Reputation history failed");
        console.error(historyRes.data);
    }
    
    // Summary
    console.log("\n========================================");
    const color = passCount === totalTests ? "\x1b[92m" : "\x1b[91m";
    const reset = "\x1b[0m";
    console.log(`${color}Results: ${passCount}/${totalTests} tests passed${reset}`);
    console.log("========================================\n");
}

runTests().catch(error => {
    console.error("Test suite failed:", error);
    process.exit(1);
});
