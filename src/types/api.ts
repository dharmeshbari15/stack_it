/**
 * Base wrapper for all API responses.
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;
        fields?: Record<string, string[]>;
    };
}

/**
 * Question Data Types
 */
export interface QuestionListItem {
    id: string;
    title: string;
    description: string;
    author: {
        id: string;
        username: string;
    };
    tags: string[];
    answers_count: number;
    accepted_answer_id: string | null;
    duplicate_of_id: string | null;
    created_at: string | Date;
}

export interface QuestionDetail extends Omit<QuestionListItem, 'answers_count'> {
    score?: number;
    userVote?: number;
    comments: CommentListItem[];
    answers: AnswerListItem[];
}

export interface QuestionsResponse {
    questions: QuestionListItem[];
    total_pages: number;
    current_page: number;
    total_questions: number;
}

export interface CreateQuestionResponse {
    id: string;
    title: string;
    created_at: string | Date;
}

/**
 * Answer Data Types
 */
export interface AnswerItem {
    id: string;
    body: string;
    question_id: string;
    author_id: string;
    created_at: string | Date;
    author?: {
        id: string;
        username: string;
    };
}

export interface AnswerListItem {
    id: string;
    body: string;
    score: number;
    created_at: string | Date;
    author: {
        id: string;
        username: string;
    };
    userVote: number;
    comments: CommentListItem[];
}

export interface CommentListItem {
    id: string;
    body: string;
    created_at: string | Date;
    updated_at: string | Date;
    parent_id: string | null;
    author: {
        id: string;
        username: string;
    };
    mentions: {
        id: string;
        username: string;
    }[];
    replies: CommentListItem[];
}

/**
 * Notification Data Types
 */
export interface NotificationItem {
    id: string;
    type: 'ANSWER' | 'COMMENT' | 'UPVOTE';
    is_read: boolean;
    reference_id: string;
    user_id: string;
    actor_id: string;
    created_at: string | Date;
    actor?: {
        id: string;
        username: string;
    };
}

export interface MarkReadResponse {
    updatedCount: number;
}

/**
 * User Data Types
 */
export interface UserStats {
    id: string;
    username: string;
    email?: string;
    two_factor_enabled?: boolean;
    created_at: string | Date;
    _count: {
        questions: number;
        answers: number;
    };
}

export interface UpdateUserRequest {
    username?: string;
    email?: string;
    password?: string;
    two_factor_enabled?: boolean;
}

export interface UpdateUserResponse {
    id: string;
    username: string;
    email: string;
    two_factor_enabled: boolean;
}

export interface UserPost {
    id: string;
    type: 'QUESTION' | 'ANSWER';
    title: string;
    content: string;
    created_at: string | Date;
    metadata: {
        answerCount?: number;
        score?: number;
        questionId?: string;
    };
}

export interface RegisterUserResponse {
    id: string;
    username: string;
    email: string;
    role: string;
    created_at: string | Date;
}

export interface MessageResponse {
    message: string;
}

export interface AcceptAnswerResponse {
    id: string;
    accepted_answer_id: string;
}

export interface VoteResponse {
    id: string;
    score: number;
}

/**
 * Follow System Data Types
 */
export interface FollowResponse {
    success: boolean;
    is_following: boolean;
}

export interface FollowedTagsResponse {
    tags: {
        id: string;
        name: string;
        created_at: string | Date;
    }[];
}

export interface FollowedQuestionsResponse {
    questions: Array<{
        id: string;
        title: string;
        author: {
            id: string;
            username: string;
        };
        created_at: string | Date;
    }>;
}

export interface FollowedUsersResponse {
    users: Array<{
        id: string;
        username: string;
        _count?: {
            questions?: number;
            answers?: number;
        };
        created_at: string | Date;
    }>;
}

export interface UserFollowStats {
    following_count: number;
    followers_count: number;
}
