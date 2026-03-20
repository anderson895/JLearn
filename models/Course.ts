import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  title: string;
  type: "video" | "article" | "quiz";
  duration: number;
  videoUrl?: string;
  videoPublicId?: string;
  content?: string;
  isPreview: boolean;
  order: number;
  resources: { title: string; url: string }[];
}

export interface ISection {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  lessons: ILesson[];
}

export interface ICourse extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDesc: string;
  instructor: mongoose.Types.ObjectId;
  category: string;
  level: "beginner" | "intermediate" | "advanced" | "all-levels";
  language: string;
  thumbnail: string;
  thumbnailPublicId?: string;
  previewVideo?: string;
  sections: ISection[];
  price: number;
  originalPrice?: number;
  isFree: boolean;
  currency: string;
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  requirements: string[];
  outcomes: string[];
  featured: boolean;
  bestseller: boolean;
  stats: {
    totalStudents:  number;
    totalReviews:   number;
    averageRating:  number;
    totalLessons:   number;
    totalDuration:  number;
    completionRate: number;
  };
  stripeProductId?: string;
  stripePriceId?:   string;
  createdAt: Date;
  updatedAt: Date;
}

const LessonSchema = new Schema<ILesson>({
  title:    { type: String, required: true },
  type:     { type: String, enum: ["video", "article", "quiz"], default: "video" },
  duration: { type: Number, default: 0 },
  videoUrl: { type: String },
  videoPublicId: { type: String },
  content:  { type: String },
  isPreview: { type: Boolean, default: false },
  order:    { type: Number, required: true },
  resources: [{ title: String, url: String }],
});

const SectionSchema = new Schema<ISection>({
  title:   { type: String, required: true },
  order:   { type: Number, required: true },
  lessons: [LessonSchema],
});

const CourseSchema = new Schema<ICourse>(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDesc:   { type: String, required: true, maxlength: 200 },
    instructor:  { type: Schema.Types.ObjectId, ref: "User", required: true },
    category:    { type: String, required: true },
    level:       { type: String, enum: ["beginner", "intermediate", "advanced", "all-levels"], default: "all-levels" },
    language:    { type: String, default: "English" },
    thumbnail:   { type: String, required: true },
    thumbnailPublicId: { type: String },
    previewVideo: { type: String },
    sections:    [SectionSchema],
    price:       { type: Number, default: 0 },
    originalPrice: { type: Number },
    isFree:      { type: Boolean, default: false },
    currency:    { type: String, default: "usd" },
    status:      { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    publishedAt: { type: Date },
    requirements:   [String],
    outcomes:       [String],
    featured:    { type: Boolean, default: false },
    bestseller:  { type: Boolean, default: false },
    stats: {
      totalStudents:  { type: Number, default: 0 },
      totalReviews:   { type: Number, default: 0 },
      averageRating:  { type: Number, default: 0 },
      totalLessons:   { type: Number, default: 0 },
      totalDuration:  { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
    },
    stripeProductId: { type: String },
    stripePriceId:   { type: String },
  },
  { timestamps: true }
);

CourseSchema.index({ status: 1, category: 1 });
CourseSchema.index({ title: "text", description: "text" });
CourseSchema.index({ "stats.averageRating": -1, "stats.totalStudents": -1 });

const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>("Course", CourseSchema);
export default Course;