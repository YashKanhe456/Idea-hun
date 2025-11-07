import { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Heart, MessageCircle, Eye, Search, Lightbulb, Users, TrendingUp, Plus, Filter } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  "Technology",
  "Healthcare",
  "Education",
  "Finance",
  "Environment",
  "Social Impact",
  "Entertainment",
  "Business",
  "Other"
];

const Home = () => {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // Check for stored user
    const storedUser = localStorage.getItem('ideahub_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchIdeas();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [selectedCategory, searchQuery]);

  const fetchIdeas = async () => {
    try {
      const params = {};
      if (selectedCategory !== "all") params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API}/ideas`, { params });
      setIdeas(response.data);
    } catch (e) {
      console.error("Error fetching ideas:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (e) {
      console.error("Error fetching stats:", e);
    }
  };

  const handleAuth = async (formData) => {
    try {
      const response = await axios.post(`${API}/users`, formData);
      setCurrentUser(response.data);
      localStorage.setItem('ideahub_user', JSON.stringify(response.data));
      setShowAuth(false);
      toast.success(`Welcome, ${response.data.name}!`);
    } catch (e) {
      toast.error("Authentication failed. Please try again.");
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ideahub_user');
    toast.success("Logged out successfully");
  };

  return (
    <div className="home-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <Lightbulb className="logo-icon" />
            <span className="logo-text">IdeaHub</span>
          </div>
          <div className="header-actions">
            {currentUser ? (
              <>
                {currentUser.user_type === 'student' && (
                  <Button data-testid="post-idea-btn" onClick={() => navigate('/post')} className="btn-primary">
                    <Plus className="btn-icon" />
                    Post Idea
                  </Button>
                )}
                <div className="user-info">
                  <Avatar>
                    <AvatarFallback>{currentUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="user-name">{currentUser.name}</span>
                </div>
                <Button data-testid="logout-btn" variant="outline" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <Button data-testid="get-started-btn" onClick={() => setShowAuth(true)} className="btn-primary">
                Get Started
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Where Student Ideas Meet Opportunity</h1>
          <p className="hero-subtitle">
            A platform connecting innovative student minds with companies seeking fresh perspectives
          </p>
          <div className="hero-stats">
            <div className="stat-card">
              <Lightbulb className="stat-icon" />
              <div className="stat-value">{stats.total_ideas || 0}</div>
              <div className="stat-label">Ideas Shared</div>
            </div>
            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-value">{stats.total_students || 0}</div>
              <div className="stat-label">Student Innovators</div>
            </div>
            <div className="stat-card">
              <TrendingUp className="stat-icon" />
              <div className="stat-value">{stats.total_companies || 0}</div>
              <div className="stat-label">Companies Exploring</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="filters-section">
        <div className="filters-container">
          <div className="search-wrapper">
            <Search className="search-icon" />
            <Input
              data-testid="search-input"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger data-testid="category-filter" className="category-select">
              <Filter className="filter-icon" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Ideas Grid */}
      <section className="ideas-section">
        <div className="ideas-grid">
          {loading ? (
            <div className="loading-state">Loading ideas...</div>
          ) : ideas.length === 0 ? (
            <div className="empty-state">
              <Lightbulb className="empty-icon" />
              <p>No ideas found. Be the first to share!</p>
            </div>
          ) : (
            ideas.map(idea => (
              <IdeaCard key={idea.id} idea={idea} currentUser={currentUser} navigate={navigate} />
            ))
          )}
        </div>
      </section>

      {/* Auth Dialog */}
      <AuthDialog open={showAuth} onOpenChange={setShowAuth} onAuth={handleAuth} />
    </div>
  );
};

const IdeaCard = ({ idea, currentUser, navigate }) => {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(idea.likes);

  useEffect(() => {
    if (currentUser) {
      checkLikeStatus();
    }
  }, [currentUser]);

  const checkLikeStatus = async () => {
    try {
      const response = await axios.get(`${API}/ideas/${idea.id}/liked/${currentUser.id}`);
      setLiked(response.data.liked);
    } catch (e) {
      console.error("Error checking like status:", e);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!currentUser) {
      toast.error("Please sign in to like ideas");
      return;
    }

    try {
      const response = await axios.post(`${API}/ideas/${idea.id}/like`, {
        idea_id: idea.id,
        user_id: currentUser.id
      });
      setLiked(response.data.liked);
      setLocalLikes(prev => response.data.liked ? prev + 1 : prev - 1);
    } catch (e) {
      toast.error("Failed to update like");
      console.error(e);
    }
  };

  return (
    <Card 
      data-testid={`idea-card-${idea.id}`}
      className="idea-card" 
      onClick={() => navigate(`/idea/${idea.id}`)}
    >
      <CardHeader>
        <div className="card-header-top">
          <Badge className="category-badge">{idea.category}</Badge>
          <div className="views-count">
            <Eye className="icon-sm" />
            <span>{idea.views}</span>
          </div>
        </div>
        <CardTitle className="idea-title">{idea.title}</CardTitle>
        <CardDescription className="idea-description">{idea.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="tags-container">
          {idea.tags.slice(0, 3).map((tag, idx) => (
            <span key={idx} className="tag-pill">{tag}</span>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="card-footer-content">
          <div className="author-info">
            <Avatar className="avatar-sm">
              <AvatarFallback>{idea.author_name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="author-name">{idea.author_name}</span>
          </div>
          <div className="engagement-actions">
            <button 
              data-testid={`like-btn-${idea.id}`}
              className="engagement-btn" 
              onClick={handleLike}
            >
              <Heart className={liked ? "icon-liked" : "icon-default"} fill={liked ? "currentColor" : "none"} />
              <span>{localLikes}</span>
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const IdeaDetail = () => {
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [liked, setLiked] = useState(false);
  const ideaId = window.location.pathname.split('/').pop();

  useEffect(() => {
    const storedUser = localStorage.getItem('ideahub_user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    fetchIdea();
    fetchComments();
  }, []);

  useEffect(() => {
    if (currentUser && idea) {
      checkLikeStatus();
    }
  }, [currentUser, idea]);

  const fetchIdea = async () => {
    try {
      const response = await axios.get(`${API}/ideas/${ideaId}`);
      setIdea(response.data);
    } catch (e) {
      console.error("Error fetching idea:", e);
      toast.error("Failed to load idea");
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API}/comments/${ideaId}`);
      setComments(response.data);
    } catch (e) {
      console.error("Error fetching comments:", e);
    }
  };

  const checkLikeStatus = async () => {
    try {
      const response = await axios.get(`${API}/ideas/${idea.id}/liked/${currentUser.id}`);
      setLiked(response.data.liked);
    } catch (e) {
      console.error("Error checking like status:", e);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Please sign in to like ideas");
      return;
    }

    try {
      const response = await axios.post(`${API}/ideas/${idea.id}/like`, {
        idea_id: idea.id,
        user_id: currentUser.id
      });
      setLiked(response.data.liked);
      setIdea(prev => ({
        ...prev,
        likes: response.data.liked ? prev.likes + 1 : prev.likes - 1
      }));
    } catch (e) {
      toast.error("Failed to update like");
      console.error(e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!commentText.trim()) return;

    try {
      const response = await axios.post(`${API}/comments`, {
        idea_id: ideaId,
        author_id: currentUser.id,
        author_name: currentUser.name,
        content: commentText
      });
      setComments([response.data, ...comments]);
      setCommentText("");
      toast.success("Comment posted!");
    } catch (e) {
      toast.error("Failed to post comment");
      console.error(e);
    }
  };

  if (!idea) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="detail-container">
      <header className="detail-header">
        <Button data-testid="back-btn" variant="outline" onClick={() => navigate('/')}>← Back to Ideas</Button>
      </header>

      <div className="detail-content">
        <div className="detail-main">
          <Badge className="category-badge-large">{idea.category}</Badge>
          <h1 className="detail-title">{idea.title}</h1>
          
          <div className="detail-meta">
            <div className="author-section">
              <Avatar>
                <AvatarFallback>{idea.author_name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <div className="author-name-large">{idea.author_name}</div>
                <div className="author-email">{idea.author_email}</div>
              </div>
            </div>
            <div className="detail-stats">
              <div className="stat-item">
                <Eye className="icon-sm" />
                <span>{idea.views} views</span>
              </div>
              <button data-testid="detail-like-btn" className="stat-item-btn" onClick={handleLike}>
                <Heart className={liked ? "icon-liked" : "icon-default"} fill={liked ? "currentColor" : "none"} />
                <span>{idea.likes} likes</span>
              </button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="detail-description">
            {idea.description}
          </div>

          <div className="detail-tags">
            {idea.tags.map((tag, idx) => (
              <span key={idx} className="tag-pill-large">{tag}</span>
            ))}
          </div>

          <Separator className="my-8" />

          {/* Comments Section */}
          <div className="comments-section">
            <h2 className="comments-title">
              <MessageCircle className="icon-md" />
              Comments ({comments.length})
            </h2>

            {currentUser && (
              <form onSubmit={handleComment} className="comment-form">
                <Textarea
                  data-testid="comment-input"
                  placeholder="Share your thoughts..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="comment-textarea"
                />
                <Button data-testid="submit-comment-btn" type="submit" className="btn-primary">Post Comment</Button>
              </form>
            )}

            <div className="comments-list">
              {comments.map(comment => (
                <div key={comment.id} data-testid={`comment-${comment.id}`} className="comment-item">
                  <Avatar className="comment-avatar">
                    <AvatarFallback>{comment.author_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="comment-content">
                    <div className="comment-author">{comment.author_name}</div>
                    <div className="comment-text">{comment.content}</div>
                    <div className="comment-time">{new Date(comment.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PostIdea = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('ideahub_user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.user_type !== 'student') {
        toast.error("Only students can post ideas");
        navigate('/');
        return;
      }
      setCurrentUser(user);
    } else {
      toast.error("Please sign in to post ideas");
      navigate('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await axios.post(`${API}/ideas`, {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: tagsArray,
        author_id: currentUser.id,
        author_name: currentUser.name,
        author_email: currentUser.email
      });
      
      toast.success("Idea posted successfully!");
      navigate('/');
    } catch (e) {
      toast.error("Failed to post idea");
      console.error(e);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="post-container">
      <header className="detail-header">
        <Button data-testid="back-to-home-btn" variant="outline" onClick={() => navigate('/')}>← Back to Home</Button>
      </header>

      <div className="post-content">
        <Card className="post-card">
          <CardHeader>
            <CardTitle className="post-title">Share Your Idea</CardTitle>
            <CardDescription>Tell the world about your innovative concept</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="post-form">
              <div className="form-field">
                <Label htmlFor="title">Title *</Label>
                <Input
                  data-testid="title-input"
                  id="title"
                  placeholder="Enter a catchy title for your idea"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger data-testid="category-select" id="category" className="form-select">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="form-field">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  data-testid="description-input"
                  id="description"
                  placeholder="Describe your idea in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-textarea"
                  rows={8}
                />
              </div>

              <div className="form-field">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  data-testid="tags-input"
                  id="tags"
                  placeholder="e.g., AI, Innovation, Mobile App"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="form-input"
                />
              </div>

              <Button data-testid="submit-idea-btn" type="submit" className="btn-primary btn-large">Publish Idea</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const AuthDialog = ({ open, onOpenChange, onAuth }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    user_type: "student",
    organization: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    onAuth(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="auth-dialog" className="auth-dialog">
        <DialogHeader>
          <DialogTitle>Join IdeaHub</DialogTitle>
          <DialogDescription>Sign up to start sharing or discovering ideas</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-field">
            <Label htmlFor="name">Name *</Label>
            <Input
              data-testid="auth-name-input"
              id="name"
              placeholder="Your full name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="email">Email *</Label>
            <Input
              data-testid="auth-email-input"
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="user_type">I am a *</Label>
            <Select value={formData.user_type} onValueChange={(val) => setFormData({...formData, user_type: val})}>
              <SelectTrigger data-testid="auth-usertype-select" id="user_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="company">Company Representative</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.user_type === 'company' && (
            <div className="form-field">
              <Label htmlFor="organization">Organization</Label>
              <Input
                data-testid="auth-organization-input"
                id="organization"
                placeholder="Company name"
                value={formData.organization}
                onChange={(e) => setFormData({...formData, organization: e.target.value})}
              />
            </div>
          )}

          <Button data-testid="auth-submit-btn" type="submit" className="btn-primary btn-full">Get Started</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/idea/:id" element={<IdeaDetail />} />
          <Route path="/post" element={<PostIdea />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
