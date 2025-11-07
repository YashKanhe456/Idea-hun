from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    user_type: str  # "student" or "company"
    organization: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    name: str
    email: str
    user_type: str
    organization: Optional[str] = None

class Idea(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: str
    tags: List[str] = []
    author_id: str
    author_name: str
    author_email: str
    likes: int = 0
    views: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class IdeaCreate(BaseModel):
    title: str
    description: str
    category: str
    tags: List[str]
    author_id: str
    author_name: str
    author_email: str

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    idea_id: str
    author_id: str
    author_name: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    idea_id: str
    author_id: str
    author_name: str
    content: str

class LikeCreate(BaseModel):
    idea_id: str
    user_id: str


# User Routes
@api_router.post("/users", response_model=User)
async def create_user(input: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": input.email}, {"_id": 0})
    if existing_user:
        if isinstance(existing_user['created_at'], str):
            existing_user['created_at'] = datetime.fromisoformat(existing_user['created_at'])
        return User(**existing_user)
    
    user_obj = User(**input.model_dump())
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.users.insert_one(doc)
    return user_obj

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if isinstance(user['created_at'], str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    return User(**user)


# Idea Routes
@api_router.post("/ideas", response_model=Idea)
async def create_idea(input: IdeaCreate):
    idea_obj = Idea(**input.model_dump())
    doc = idea_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.ideas.insert_one(doc)
    return idea_obj

@api_router.get("/ideas", response_model=List[Idea])
async def get_ideas(category: Optional[str] = None, search: Optional[str] = None):
    query = {}
    if category and category != "all":
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}}
        ]
    
    ideas = await db.ideas.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for idea in ideas:
        if isinstance(idea['created_at'], str):
            idea['created_at'] = datetime.fromisoformat(idea['created_at'])
    return ideas

@api_router.get("/ideas/{idea_id}", response_model=Idea)
async def get_idea(idea_id: str):
    idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")
    
    # Increment views
    await db.ideas.update_one({"id": idea_id}, {"$inc": {"views": 1}})
    idea['views'] = idea.get('views', 0) + 1
    
    if isinstance(idea['created_at'], str):
        idea['created_at'] = datetime.fromisoformat(idea['created_at'])
    return Idea(**idea)

@api_router.post("/ideas/{idea_id}/like")
async def like_idea(input: LikeCreate):
    # Check if already liked
    existing_like = await db.likes.find_one({"idea_id": input.idea_id, "user_id": input.user_id})
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({"idea_id": input.idea_id, "user_id": input.user_id})
        await db.ideas.update_one({"id": input.idea_id}, {"$inc": {"likes": -1}})
        return {"liked": False}
    else:
        # Like
        like_doc = {"idea_id": input.idea_id, "user_id": input.user_id}
        await db.likes.insert_one(like_doc)
        await db.ideas.update_one({"id": input.idea_id}, {"$inc": {"likes": 1}})
        return {"liked": True}

@api_router.get("/ideas/{idea_id}/liked/{user_id}")
async def check_if_liked(idea_id: str, user_id: str):
    existing_like = await db.likes.find_one({"idea_id": idea_id, "user_id": user_id})
    return {"liked": existing_like is not None}


# Comment Routes
@api_router.post("/comments", response_model=Comment)
async def create_comment(input: CommentCreate):
    comment_obj = Comment(**input.model_dump())
    doc = comment_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.comments.insert_one(doc)
    return comment_obj

@api_router.get("/comments/{idea_id}", response_model=List[Comment])
async def get_comments(idea_id: str):
    comments = await db.comments.find({"idea_id": idea_id}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for comment in comments:
        if isinstance(comment['created_at'], str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
    return comments


# Stats Route
@api_router.get("/stats")
async def get_stats():
    total_ideas = await db.ideas.count_documents({})
    total_users = await db.users.count_documents({})
    total_students = await db.users.count_documents({"user_type": "student"})
    total_companies = await db.users.count_documents({"user_type": "company"})
    
    return {
        "total_ideas": total_ideas,
        "total_users": total_users,
        "total_students": total_students,
        "total_companies": total_companies
    }


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
