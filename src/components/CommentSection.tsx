import { useState, useEffect, useCallback } from 'react';
import { Comment } from '../types';
import { getComments, addComment } from '../services/dataService';
import { DATA_UPDATED_EVENT } from '../services/cloudSync';
import { useLanguage } from '../context/LanguageContext';

export default function CommentSection({ newsId }: { newsId: string }) {
  const { t, formatDateTime, formatNumber } = useLanguage();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [postedNotice, setPostedNotice] = useState(false);

  const loadComments = useCallback(() => {
    setComments([...getComments(newsId)].reverse());
  }, [newsId]);

  useEffect(() => {
    loadComments();
    setPostedNotice(false);
    window.addEventListener(DATA_UPDATED_EVENT, loadComments);
    return () => window.removeEventListener(DATA_UPDATED_EVENT, loadComments);
  }, [loadComments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedAuthor = author.trim();
    const trimmedContent = content.trim();
    if (!trimmedAuthor || !trimmedContent) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      newsId,
      author: trimmedAuthor,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      status: 'approved',
    };
    addComment(newsId, newComment);
    loadComments();
    setContent('');
    setAuthor('');
    setPostedNotice(true);
    setTimeout(() => setPostedNotice(false), 3000);
  };

  return (
    <section className="mt-10 pt-8 border-t border-slate-200">
      <h3 className="text-xl font-bold text-slate-900 mb-5 tabular-nums">
        {t('commentsTitle')} ({formatNumber(comments.length)})
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
        <div>
          <label htmlFor="comment-author" className="block text-xs font-medium text-slate-600 mb-1">
            {t('yourName')}
          </label>
          <input
            id="comment-author"
            type="text"
            placeholder={t('enterYourName')}
            value={author}
            onChange={e => setAuthor(e.target.value)}
            maxLength={80}
            className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 outline-none focus:border-red-700"
            required
          />
        </div>
        <div>
          <label htmlFor="comment-body" className="block text-xs font-medium text-slate-600 mb-1">
            {t('yourComment')}
          </label>
          <textarea
            id="comment-body"
            placeholder={t('shareThoughts')}
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={1500}
            className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-900 h-24 outline-none focus:border-red-700"
            required
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="submit"
            className="bg-red-700 hover:bg-red-800 transition-colors text-white text-sm font-medium px-5 py-2.5 rounded-lg"
          >
            {t('postComment')}
          </button>
          {postedNotice && (
            <span className="text-xs font-medium text-emerald-700">
              {t('commentPosted')}
            </span>
          )}
        </div>
      </form>

      {comments.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">
          {t('noCommentsYet')}
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-slate-200 p-4 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <p className="font-bold text-sm text-slate-900">{c.author}</p>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <p className="text-xs text-slate-500 tabular-nums">
                  {formatDateTime(c.createdAt)}
                </p>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {c.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
