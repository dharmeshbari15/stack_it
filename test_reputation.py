#!/usr/bin/env python3
"""
Reputation System Test Script
Tests the complete reputation and gamification system
"""

import requests
import json
from typing import Any, Dict, Optional

BASE_URL = "http://localhost:3000"

class RepTestRunner:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, name: str, passed: bool, details: str = ""):
        status = "[PASS]" if passed else "[FAIL]"
        self.test_results.append((name, passed))
        color = "\033[92m" if passed else "\033[91m"
        reset = "\033[0m"
        print(f"{color}{status}{reset} {name}")
        if details:
            print(f"       {details}")
    
    def get_questions(self) -> Optional[Dict[str, Any]]:
        """Get a list of questions"""
        print("[Test 1] Fetching questions...")
        resp = self.session.get(f"{BASE_URL}/api/v1/questions?limit=5")
        if resp.status_code != 200:
            print(f"  ERROR: {resp.status_code}")
            return None
        data = resp.json()
        if data.get('success') and data['data'].get('questions'):
            q = data['data']['questions'][0]
            print(f"  Found: {q['title']}")
            print(f"  Author: {q['author']['username']} (ID: {q['author']['id']})")
            if q.get('answers'):
                print(f"  Has {len(q['answers'])} answer(s)")
            return q
        return None
    
    def register_voter(self) -> Optional[str]:
        """Register a new user to vote"""
        print("\n[Test 2] Registering test voter...")
        import random
        rand = random.randint(1000, 99999)
        
        voter_data = {
            "username": f"voter_{rand}",
            "email": f"voter{rand}@test.com",
            "password": "Password123!"
        }
        
        resp = self.session.post(
            f"{BASE_URL}/api/v1/auth/register",
            json=voter_data
        )
        
        if resp.status_code == 201:
            data = resp.json()
            user_id = data['data']['user']['id']
            username = data['data']['user']['username']
            print(f"  Registered: {username} (ID: {user_id})")
            return user_id
        else:
            print(f"  ERROR: {resp.status_code}")
            return None
    
    def get_user_reputation(self, user_id: str) -> Optional[int]:
        """Get a user's reputation"""
        resp = self.session.get(f"{BASE_URL}/api/v1/users/{user_id}")
        if resp.status_code == 200:
            return resp.json()['data']['reputation']
        return None
    
    def vote_on_question(self, question_id: str, vote_type: str) -> bool:
        """Vote on a question"""
        resp = self.session.post(
            f"{BASE_URL}/api/v1/questions/{question_id}/vote",
            json={"voteType": vote_type}
        )
        return resp.status_code == 200
    
    def vote_on_answer(self, answer_id: str, vote_type: str) -> bool:
        """Vote on an answer"""
        resp = self.session.post(
            f"{BASE_URL}/api/v1/answers/{answer_id}/vote",
            json={"voteType": vote_type}
        )
        return resp.status_code == 200
    
    def test_question_voting(self):
        """Test question voting"""
        print("\n[Test 3] Testing question voting...")
        
        # Get questions
        question = self.get_questions()
        if not question:
            self.log_test("Question voting", False, "No questions found")
            return
        
        question_id = question['id']
        author_id = question['author']['id']
        
        # Register voter
        voter_id = self.register_voter()
        if not voter_id:
            self.log_test("Question voting", False, "Could not register voter")
            return
        
        # Get initial reputation
        initial_rep = self.get_user_reputation(author_id)
        print(f"  Initial reputation: {initial_rep}")
        
        # Upvote question
        upvote_ok = self.vote_on_question(question_id, 'upvote')
        if not upvote_ok:
            self.log_test("Question upvote (+5)", False, "[Request failed]")
            return
        
        after_upvote = self.get_user_reputation(author_id)
        upvote_pass = after_upvote == initial_rep + 5
        self.log_test(
            "Question upvote (+5)",
            upvote_pass,
            f"{initial_rep} -> {after_upvote} (expected +5)"
        )
        
        # Downvote (switch vote)
        downvote_ok = self.vote_on_question(question_id, 'downvote')
        if not downvote_ok:
            self.log_test("Question downvote switch (-7)", False, "[Request failed]")
            return
        
        after_downvote = self.get_user_reputation(author_id)
        downvote_pass = after_downvote == after_upvote - 7
        self.log_test(
            "Question downvote switch (-7)",
            downvote_pass,
            f"{after_upvote} -> {after_downvote} (expected -7)"
        )
        
        # Remove vote
        remove_ok = self.vote_on_question(question_id, 'downvote')
        if not remove_ok:
            self.log_test("Question vote removal (+2)", False, "[Request failed]")
            return
        
        after_remove = self.get_user_reputation(author_id)
        remove_pass = after_remove == initial_rep
        self.log_test(
            "Question vote removal (+2)",
            remove_pass,
            f"{after_downvote} -> {after_remove} (expected back to {initial_rep})"
        )
    
    def test_answer_voting(self, question: Dict[str, Any]):
        """Test answer voting"""
        print("\n[Test 4] Testing answer voting...")
        
        if not question.get('answers') or len(question['answers']) == 0:
            self.log_test("Answer voting", False, "No answers found")
            return
        
        answer = question['answers'][0]
        answer_id = answer['id']
        author_id = answer['author']['id']
        
        # Register new voter
        voter_id = self.register_voter()
        if not voter_id:
            self.log_test("Answer upvote (+10)", False, "Could not register voter")
            return
        
        initial_rep = self.get_user_reputation(author_id)
        print(f"  Answer author initial reputation: {initial_rep}")
        
        # Upvote answer
        upvote_ok = self.vote_on_answer(answer_id, 'upvote')
        if not upvote_ok:
            self.log_test("Answer upvote (+10)", False, "[Request failed]")
            return
        
        after_upvote = self.get_user_reputation(author_id)
        upvote_pass = after_upvote == initial_rep + 10
        self.log_test(
            "Answer upvote (+10)",
            upvote_pass,
            f"{initial_rep} -> {after_upvote} (expected +10)"
        )
    
    def test_leaderboard(self):
        """Test leaderboard endpoint"""
        print("\n[Test 5] Testing leaderboard...")
        
        resp = self.session.get(f"{BASE_URL}/api/v1/leaderboard?limit=5")
        if resp.status_code != 200:
            self.log_test("Leaderboard", False, f"HTTP {resp.status_code}")
            return
        
        data = resp.json()
        if data.get('success') and data['data'].get('leaderboard'):
            self.log_test("Leaderboard", True)
            print("  Top 5 users:")
            for user in data['data']['leaderboard'][:5]:
                print(f"    {user['rank']}. {user['username']} - {user['reputation']} pts ({user['level']['level']})")
        else:
            self.log_test("Leaderboard", False, "Invalid response")
    
    def test_reputation_history(self, user_id: str):
        """Test reputation history endpoint"""
        print("\n[Test 6] Testing reputation history...")
        
        resp = self.session.get(f"{BASE_URL}/api/v1/users/{user_id}/reputation-history?limit=10")
        if resp.status_code != 200:
            self.log_test("Reputation history", False, f"HTTP {resp.status_code}")
            return
        
        data = resp.json()
        if data.get('success') and data['data'].get('history') is not None:
            self.log_test("Reputation history", True)
            print(f"  User: {data['data']['user']['username']}")
            print(f"  Current reputation: {data['data']['user']['current_reputation']}")
            if data['data']['history']:
                print("  Recent changes:")
                for entry in data['data']['history'][:5]:
                    sign = "+" if entry['amount'] >= 0 else ""
                    print(f"    - {entry['description']}: {sign}{entry['amount']}")
        else:
            self.log_test("Reputation history", False, "Invalid response")
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 70)
        print("Reputation System Test Suite")
        print("=" * 70)
        
        # Get test question
        question = self.get_questions()
        if not question:
            print("FAILED: Could not fetch questions")
            return
        
        # Run tests
        self.test_question_voting()
        self.test_answer_voting(question)
        self.test_leaderboard()
        
        # Test history with first test's author
        if question:
            self.test_reputation_history(question['author']['id'])
        
        # Summary
        print("\n" + "=" * 70)
        passed = sum(1 for _, p in self.test_results if p)
        total = len(self.test_results)
        color = "\033[92m" if passed == total else "\033[91m"
        reset = "\033[0m"
        print(f"{color}Results: {passed}/{total} tests passed{reset}")
        print("=" * 70)

if __name__ == "__main__":
    runner = RepTestRunner()
    runner.run_all_tests()
