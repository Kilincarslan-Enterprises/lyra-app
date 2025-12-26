import { useState, useEffect } from 'react';
import { Eye, Heart, MessageCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Analytics as AnalyticsType, SocialAccount } from '../lib/supabase';

interface AnalyticsWithAccount extends AnalyticsType {
  account?: SocialAccount;
}

export function Analytics() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsWithAccount[]>([]);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const { data: accountsData, error: accountsError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user!.id);

      if (accountsError) throw accountsError;

      setAccounts(accountsData || []);

      if (!accountsData || accountsData.length === 0) {
        setAnalytics([]);
        setLoading(false);
        return;
      }

      const accountIds = accountsData.map((acc) => acc.id);

      const { data: analyticsData, error: analyticsError } = await supabase
        .from('analytics')
        .select('*')
        .in('account_id', accountIds)
        .order('date', { ascending: false });

      if (analyticsError) throw analyticsError;

      const analyticsWithAccounts = (analyticsData || []).map((item) => ({
        ...item,
        account: accountsData.find((acc) => acc.id === item.account_id),
      }));

      setAnalytics(analyticsWithAccounts);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalytics = analytics.filter((item) => {
    if (selectedAccount === 'all') return true;
    return item.account_id === selectedAccount;
  });

  const totalStats = filteredAnalytics.reduce(
    (acc, item) => ({
      views: acc.views + Number(item.views),
      likes: acc.likes + Number(item.likes),
      comments: acc.comments + Number(item.comments),
      engagement: 0,
    }),
    { views: 0, likes: 0, comments: 0, engagement: 0 }
  );

  totalStats.engagement =
    totalStats.views > 0
      ? ((totalStats.likes + totalStats.comments) / totalStats.views) * 100
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-blue-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-400">Track your social media performance</p>
        </div>

        {accounts.length > 1 && (
          <div className="mb-6">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_name} ({account.platform})
                </option>
              ))}
            </select>
          </div>
        )}

        {analytics.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
            <div className="bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No analytics data</h3>
            <p className="text-gray-400">
              Analytics data will appear here once it's synced from Airtable
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500/10 p-3 rounded-lg">
                    <Eye className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalStats.views.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Views</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-pink-500/10 p-3 rounded-lg">
                    <Heart className="w-6 h-6 text-pink-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalStats.likes.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Likes</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500/10 p-3 rounded-lg">
                    <MessageCircle className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalStats.comments.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Total Comments</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-500/10 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-yellow-400" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalStats.engagement.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-400">Engagement Rate</div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-800 border-b border-gray-700">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                        Account
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                        Platform
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-300">
                        Date
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">
                        Views
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">
                        Likes
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">
                        Comments
                      </th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-300">
                        Engagement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredAnalytics.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-800/50 transition">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-white">
                            {item.account?.account_name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.account?.username || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-300">
                            {item.account?.platform || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-white">
                            {Number(item.views).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-white">
                            {Number(item.likes).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm text-white">
                            {Number(item.comments).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-blue-400">
                            {Number(item.engagement_rate).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
