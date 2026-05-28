/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from 'react';
import { User, Search, LogIn, ShieldCheck, Link2, Plus, Clock, MessageSquare, Send } from 'lucide-react';

interface Post {
  id: number;
  author: string;
  title: string;
  content: string;
  time: number;
}

export default function App() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLogged, setIsLogged] = useState(false);
  const [username, setUsername] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [showPost, setShowPost] = useState(false);
  
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [botVerified, setBotVerified] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetch('/api/posts')
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) setPosts(data);
        })
        .catch(err => console.error("Failed to load posts", err));

    // Anti-freeze: Keep connection open so the server doesn't get throttled/suspended
    const evtSource = new EventSource("/api/antifreeze");
    evtSource.onmessage = (e) => {
        // Keeps container alive
    };
    return () => evtSource.close();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && botVerified) {
      setIsLogged(true);
      setShowLogin(false);
    }
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (postTitle && postContent && botVerified) {
      fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              author: username,
              title: postTitle,
              content: postContent
          })
      })
      .then(res => res.json())
      .then(newPost => {
          setPosts([newPost, ...posts]);
          setShowPost(false);
          setPostTitle('');
          setPostContent('');
      })
      .catch(err => alert("Failed to post: " + err.message));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsSearching(true);
    setTimeout(() => setIsSearching(false), 300); 
  };

  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (ts: number) => {
      const d = new Date(ts);
      return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-800">Manny's Forum</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <a 
                href="https://www.facebook.com/manny.cololotango" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
                <Link2 className="w-4 h-4" />
                <span>Manny Cololot Ango</span>
            </a>

            {isLogged ? (
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-md border border-gray-200">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold">{username}</span>
              </div>
            ) : (
              <button 
                onClick={() => setShowLogin(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-semibold transition-all shadow-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full sm:w-96">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isSearching ? 'text-blue-500' : 'text-gray-400'}`} />
            <input 
              type="text" 
              placeholder="Search via Internet Database..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900"
            />
          </div>

          <button 
            onClick={() => isLogged ? setShowPost(true) : setShowLogin(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-green-700 transition-colors w-full sm:w-auto justify-center shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>

        <div className="space-y-4">
            {filteredPosts.map(post => (
              <article 
                key={post.id} 
                className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
                <p className="text-gray-700 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium text-gray-600"><User className="w-3.5 h-3.5" /> {post.author}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {formatDate(post.time)}</span>
                  </div>
                  <button className="flex items-center gap-1.5 text-blue-600 font-medium hover:underline">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                </div>
              </article>
            ))}
          
          {filteredPosts.length === 0 && (
            <div className="text-center py-20 text-gray-500 flex flex-col items-center gap-3 bg-white border border-gray-200 rounded-lg">
                <Search className="w-8 h-8 opacity-40" />
                <p className="font-medium">No results found.</p>
            </div>
          )}
        </div>
      </main>

      {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-sm rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-blue-600" /> Sign In
              </h3>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1 block">Username</label>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your name..."
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div onClick={() => setBotVerified(!botVerified)} className={`cursor-pointer flex items-center gap-3 px-4 py-3 rounded-md border transition-colors ${botVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                    <ShieldCheck className={`w-5 h-5 ${botVerified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold">{botVerified ? 'Human Verified' : 'Verify Humanity (Bot Detector)'}</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowLogin(false)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md py-2 text-sm font-bold transition-colors">Cancel</button>
                  <button type="submit" disabled={!botVerified || !username} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md py-2 text-sm font-bold transition-colors shadow-sm">Login</button>
                </div>
              </form>
            </div>
          </div>
      )}

      {showPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 w-full max-w-lg rounded-lg p-6 shadow-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" /> New Thread
              </h3>
              <form onSubmit={handlePost} className="space-y-4">
                <div>
                  <input 
                    type="text" 
                    required
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Subject Title..."
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <textarea 
                    required
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Write your post here..."
                    rows={6}
                    className="w-full bg-white border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div onClick={() => setBotVerified(!botVerified)} className={`cursor-pointer flex items-center gap-3 px-4 py-3 rounded-md border transition-colors ${botVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'}`}>
                    <ShieldCheck className={`w-5 h-5 ${botVerified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="text-sm font-semibold">{botVerified ? 'Human Verified' : 'Verify Humanity (Bot Detector)'}</span>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowPost(false)} className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md py-2 text-sm font-bold transition-colors">Cancel</button>
                  <button type="submit" disabled={!botVerified || !postTitle || !postContent} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md py-2 text-sm font-bold transition-colors shadow-sm">Post to Forum</button>
                </div>
              </form>
            </div>
          </div>
      )}
    </div>
  );
}
