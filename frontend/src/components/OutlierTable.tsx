import { useState } from 'react';

interface Post {
  id: string;
  linkedin_post_id?: string | null;
  content_text: string | null;
  content_type: string;
  published_at: string | null;
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  engagement_score: number;
  outlier_ratio: number;
  is_outlier: boolean;
  hook_text: string | null;
  hook_type?: string;
  post_structure?: string;
  comment_like_ratio?: number;
  share_like_ratio?: number;
  post_url: string | null;
}

function getLinkedInUrl(post: Post): string | null {
  if (post.post_url) return post.post_url;
  if (post.linkedin_post_id) return `https://www.linkedin.com/feed/update/${post.linkedin_post_id}/`;
  return null;
}

function ratioBadge(ratio: number) {
  if (ratio >= 10) {
    return (
      <span className="bg-diamond/20 text-diamond px-2 py-0.5 rounded text-xs font-bold shadow-[0_0_8px_rgba(103,232,249,0.3)]">
        {ratio}x
      </span>
    );
  }
  if (ratio >= 3) {
    return (
      <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-bold">
        {ratio}x
      </span>
    );
  }
  return (
    <span className="bg-bg-hover text-text-muted px-2 py-0.5 rounded text-xs">
      {ratio}x
    </span>
  );
}

const hookLabels: Record<string, string> = {
  pattern_interrupt: 'Pattern Int.', belief_breaker: 'Belief Break',
  curiosity_gap: 'Curiosity Gap', data_shock: 'Data Shock', hot_take: 'Hot Take',
  personal_confession: 'Confession', story_opener: 'Story',
  hypothetical_question: 'Hypothetical', why_question: 'Why Q',
  how_question: 'How Q', direct_question: 'Direct Q',
  open_question: 'Open Q', rhetorical_question: 'Rhetorical Q',
  list_promise: 'List Promise', prediction: 'Prediction',
  how_to_framework: 'How-To', bold_claim: 'Bold Claim',
  common_mistake: 'Mistake', direct_callout: 'Callout',
  announcement: 'Announce', social_proof_opener: 'Social Proof',
  analogy: 'Analogy', contrarian_take: 'Contrarian', relatable_moment: 'Relatable',
  motivational: 'Motivational', observation: 'Observation', challenge: 'Challenge',
  other: '--',
};

const structLabels: Record<string, string> = {
  hook_list_cta: 'Hook>List>CTA', hook_story_lesson_cta: 'Story>Lesson>CTA',
  problem_agitate_solve: 'PAS', contrarian_proof_reframe: 'Contrarian>Reframe',
  confession_insight_takeaway: 'Confess>Insight', list_framework: 'List',
  problem_solution: 'Prob>Sol', story_lesson: 'Story>Lesson',
  before_after: 'Before/After', step_by_step: 'Step-by-Step',
  myth_busting: 'Myth Bust', question_answer: 'Q&A',
  observation_insight: 'Observation', prediction_vision: 'Prediction',
  motivational_manifesto: 'Motivational', authority_framework: 'Authority',
  comparison: 'Compare', short_punchy: 'Short',
  long_form_essay: 'Long', narrative_arc: 'Narrative',
  content_with_cta: 'Content+CTA', data_driven: 'Data', other: '--',
};

interface Props {
  posts: Post[];
  title?: string;
}

const typeIcons: Record<string, string> = {
  text_only: '📝', image: '🖼️', carousel: '🎠', video: '🎬',
  poll: '📊', article: '📰', document: '📄',
};

export default function OutlierTable({ posts, title = 'Outlier Posts' }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="bg-bg-card rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {posts.length === 0 ? (
        <p className="text-text-muted">No posts to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary text-left border-b border-border">
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Hook</th>
                <th className="pb-3 font-medium">Hook Type</th>
                <th className="pb-3 font-medium">Structure</th>
                <th className="pb-3 font-medium">Type</th>
                <th className="pb-3 font-medium text-right">Likes</th>
                <th className="pb-3 font-medium text-right">Comments</th>
                <th className="pb-3 font-medium text-right">Reposts</th>
                <th className="pb-3 font-medium text-right">Score</th>
                <th className="pb-3 font-medium text-right">Ratio</th>
                <th className="pb-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <>
                  <tr
                    key={post.id}
                    className="border-b border-border/50 hover:bg-bg-hover cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                  >
                    <td className="py-3 whitespace-nowrap text-text-secondary">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--'}
                    </td>
                    <td className="py-3 max-w-[250px] truncate" title={post.hook_text || ''}>
                      {post.hook_text || '--'}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="text-xs text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
                        {hookLabels[post.hook_type || ''] || post.hook_type || '--'}
                      </span>
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      <span className="text-xs text-text-muted bg-bg-secondary px-1.5 py-0.5 rounded">
                        {structLabels[post.post_structure || ''] || post.post_structure || '--'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span title={post.content_type}>{typeIcons[post.content_type] || '?'}</span>
                    </td>
                    <td className="py-3 text-right tabular-nums">{post.likes_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">{post.comments_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums">{post.reposts_count.toLocaleString()}</td>
                    <td className="py-3 text-right tabular-nums font-medium text-accent">{post.engagement_score.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      {post.outlier_ratio > 0 && ratioBadge(post.outlier_ratio)}
                    </td>
                    <td className="py-3 text-right">
                      {getLinkedInUrl(post) && (
                        <a
                          href={getLinkedInUrl(post)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent-light text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                  {expandedId === post.id && (
                    <tr key={`${post.id}-expanded`}>
                      <td colSpan={11} className="bg-bg-secondary p-4">
                        <div className="flex gap-4 mb-2 text-xs text-text-muted">
                          {post.comment_like_ratio != null && post.comment_like_ratio > 0 && (
                            <span>Comment/Like: {Math.round(post.comment_like_ratio * 100)}%</span>
                          )}
                          {post.share_like_ratio != null && post.share_like_ratio > 0 && (
                            <span>Share/Like: {Math.round(post.share_like_ratio * 100)}%</span>
                          )}
                        </div>
                        <p className="text-text-primary text-sm whitespace-pre-wrap leading-relaxed">
                          {post.content_text || 'No content available'}
                        </p>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
