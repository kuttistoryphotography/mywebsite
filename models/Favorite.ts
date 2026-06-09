import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IFavorite extends Document {
  userId:     mongoose.Types.ObjectId;
  itemType:   'portfolio' | 'album' | 'media';
  itemId:     string;          // Portfolio/Album _id  OR  media URL (for type='media')
  title:      string;
  coverImage?: string;         // thumbnail shown in favourites page
  mediaUrl?:  string;          // only for itemType='media' — the actual file URL
  mediaType?: 'image' | 'video';
  category?:  string;
  slug?:      string;
  parentTitle?: string;        // album/portfolio title this media came from
  parentType?:  'album' | 'portfolio';
  createdAt:  Date;
}

const FavoriteSchema = new Schema<IFavorite>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    itemType:    { type: String, enum: ['portfolio', 'album', 'media'], required: true },
    itemId:      { type: String, required: true },
    title:       { type: String, required: true },
    coverImage:  { type: String },
    mediaUrl:    { type: String },
    mediaType:   { type: String, enum: ['image', 'video'] },
    category:    { type: String },
    slug:        { type: String },
    parentTitle: { type: String },
    parentType:  { type: String, enum: ['album', 'portfolio'] },
  },
  { timestamps: true }
);

// Unique per user + itemId + itemType (for media, itemId is the URL hash)
FavoriteSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });

const Favorite: Model<IFavorite> =
  mongoose.models.Favorite
    ? (mongoose.models.Favorite as Model<IFavorite>)
    : mongoose.model<IFavorite>('Favorite', FavoriteSchema);

export default Favorite;
