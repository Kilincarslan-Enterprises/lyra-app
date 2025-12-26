import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Auth } from './pages/Auth';
import { Chat } from './pages/Chat';
import { SocialAccounts } from './pages/SocialAccounts';
import { Posts } from './pages/Posts';
import { Analytics } from './pages/Analytics';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'chat' | 'accounts' | 'posts' | 'analytics'>('chat');

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'chat':
        return <Chat />;
      case 'accounts':
        return <SocialAccounts />;
      case 'posts':
        return <Posts />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Chat />;
    }
  };

  return (
    <ProtectedRoute>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </Layout>
    </ProtectedRoute>
  );
}

export default App;
