import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Trash2, Search, ExternalLink } from 'lucide-react';
import {
  getAllComments,
  getNews,
  updateCommentModeration,
  deleteComment,
  logAdminActivity,
} from '../../services/dataService';
import { DATA_UPDATED_EVENT } from '../../services/cloudSync';
import { Comment, News } from '../../types';

export default function CommentManagement() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newsMap, setNewsMap] = useState<Record<string, News>>({});
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadComments = useCallback(() => {
    const all = getAllComments().sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
    setComments(all);
    const map: Record<string, News> = {};
    getNews().forEach(n => {
      map[n.id] = n;
    });
    setNewsMap(map);
  }, []);

  useEffect(() => {
    loadComments();
    window.addEventListener(DATA_UPDATED_EVENT, loadComments);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadComments);
  }, [loadComments]);

  const handleToggleStatus = (comment: Comment) => {
    const nextStatus = comment.status === 'hidden' ? 'approved' : 'hidden';
    updateCommentModeration(comment.id, nextStatus);
    logAdminActivity(
      `${nextStatus === 'hidden' ? 'Hidden' : 'Approved'} comment by ${comment.author}`
    );
    loadComments();
  };

  const handleDelete = (comment: Comment) => {
    deleteComment(comment.id);
    logAdminActivity(`Deleted comment by ${comment.author}`);
    loadComments();
  };

  const filtered = comments.filter(c => {
    const effectiveStatus = c.status === 'hidden' ? 'hidden' : 'approved';
    const matchesStatus =
      statusFilter === 'all' || effectiveStatus === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const articleTitle = newsMap[c.newsId]?.title.toLowerCase() || '';
    const matchesSearch =
      !q ||
      c.author.toLowerCase().includes(q) ||
      c.content.toLowerCase().includes(q) ||
      articleTitle.includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Comment Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review reader comments, hide spam/inappropriate remarks, or permanently delete comments.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by author, comment text, or article..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-red-700"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['all', 'approved', 'hidden'] as const).map(status => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Reader</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Comment</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Article</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Status</th>
              <th className="p-3 sm:p-4 text-left font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No comments found matching your filter.
                </td>
              </tr>
            ) : (
              filtered.map(comment => {
                const isHidden = comment.status === 'hidden';
                const article = newsMap[comment.newsId];
                return (
                  <tr key={comment.id} className="border-b border-slate-100 last:border-0 align-top">
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{comment.author}</p>
                      <p className="text-xs text-slate-400 tabular-nums mt-0.5">
                        {new Date(comment.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </td>
                    <td className="p-3 sm:p-4 text-slate-700 max-w-sm">
                      <p className="line-clamp-3 whitespace-pre-line">{comment.content}</p>
                    </td>
                    <td className="p-3 sm:p-4 max-w-xs">
                      {article ? (
                        <Link
                          to={`/article/${article.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline line-clamp-2"
                        >
                          <span>{article.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">Article #{comment.newsId}</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                          isHidden
                            ? 'bg-amber-50 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {isHidden ? 'Hidden' : 'Approved'}
                      </span>
                    </td>
                    <td className="p-3 sm:p-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(comment)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-red-700 bg-slate-100 px-2.5 py-1.5 rounded-md"
                        >
                          {isHidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Approve
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hide
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(comment)}
                          aria-label="Delete comment"
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline px-2 py-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
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
  );
}
