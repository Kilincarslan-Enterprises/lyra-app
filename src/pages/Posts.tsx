import { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Post, SocialAccount } from '../lib/supabase';

interface PostWithAccount extends Post {
  account?: SocialAccount;
}

export function Posts() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'posted' | 'scheduled' | 'failed'>('all');

  useEffect(() => {
    if (user) {
      loadPosts();
    }
  }, [user]);

  const loadPosts = async () => {
    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user!.id);

      if (accountsError) throw accountsError;

      if (!accountsData || accountsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      const accountIds = accountsData.map((acc) => acc.id);

      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .in('account_id', accountIds)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const postsWithAccounts = (postsData || []).map((post) => ({
        ...post,
        account: accountsData.find((acc) => acc.id === post.account_id),
      }));

      setPosts(postsWithAccounts);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Post['status']) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'scheduled':
        return <Clock className="w-5 h-5 text-blue-400" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
    }
  };

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'posted':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'scheduled':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (filter === 'all') return true;
    return post.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-blue-400">Loading posts...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Posts Overview</h1>
          <p className="text-gray-400">View and manage your social media posts</p>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(['all', 'posted', 'scheduled', 'failed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition whitespace-nowrap ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400">
              Connect your social media accounts and posts will appear here
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <h3 className="text-xl font-semibold text-white mb-2">
              No {filter} posts
            </h3>
            <p className="text-gray-400">Try selecting a different filter</p>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Platform
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Account
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Content
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Scheduled
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                      Posted
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredPosts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-white">
                          {post.platform}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {post.account?.account_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {post.account?.username || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300 max-w-md truncate">
                          {post.content}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                            post.status
                          )}`}
                        >
                          {getStatusIcon(post.status)}
                          <span className="capitalize">{post.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {post.scheduled_date
                            ? new Date(post.scheduled_date).toLocaleString()
                            : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {post.posted_date
                            ? new Date(post.posted_date).toLocaleString()
                            : '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
