export type Roles = 'SUPERADMIN' | 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'DELETION_PENDING' | 'SUSPENDED';
export type Language = 'UZ' | 'EN' | 'RU';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type MediaType = 'IMAGE' | 'VIDEO';
export type FollowStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
export type NotificationType =
  | 'NEW_FOLLOWER'
  | 'FOLLOW_REQUEST'
  | 'FOLLOW_ACCEPTED'
  | 'POST_LIKE'
  | 'NEW_POST';

export interface Author {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  isVerified: boolean;
  isPrivate?: boolean;
}

export interface UserProfile extends Author {
  phone?: string;
  bio: string | null;
  preferredLanguage: Language;
  role: Roles;
  status: UserStatus;
  createdAt: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  collectionsCount?: number;
  isFollowing?: boolean;
  followStatus?: FollowStatus | null;
  canViewContent?: boolean;
  posts?: PostSummary[];
}

export interface PostMedia {
  id: string;
  postId?: string;
  type: MediaType;
  storageKey: string;
  url: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
  fileSize?: string | null;
  position: number;
}

export interface PostTag {
  id: string;
  name: string;
  slug: string;
}

export interface PostSummary {
  id: string;
  title: string | null;
  description: string | null;
  publishedAt: string | null;
  likesCount: number;
  media: PostMedia[];
}

export interface Post {
  id: string;
  userId: string;
  categoryId: string | null;
  title: string | null;
  description: string | null;
  destinationUrl: string | null;
  status: PostStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: Author;
  media: PostMedia[];
  tags: PostTag[];
  likesCount: number;
  isLiked?: boolean;
}

export interface CollectionItem {
  id: string;
  position: number;
  addedAt: string;
  post: Post;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  coverUrl: string | null;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  items?: CollectionItem[];
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string | null;
  readAt: string | null;
  createdAt: string;
  actor: Author | null;
  post: {
    id: string;
    title: string | null;
    thumbnailUrl: string | null;
  } | null;
}

export interface CategoryTranslation {
  language: Language;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Category {
  id: string;
  coverUrl: string | null;
  isActive: boolean;
  translations: CategoryTranslation[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount?: number;
}

