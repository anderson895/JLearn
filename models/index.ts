import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Enrollment ───────────────────────────────────────────────────────────────
export interface IEnrollment extends Document {
  user:      mongoose.Types.ObjectId;
  course:    mongoose.Types.ObjectId;
  enrolledAt: Date;
  paymentId?: string;
  amount:    number;
  status:    "active" | "expired" | "refunded";
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    user:      { type: Schema.Types.ObjectId, ref: "User",   required: true },
    course:    { type: Schema.Types.ObjectId, ref: "Course", required: true },
    enrolledAt: { type: Date, default: Date.now },
    paymentId:  { type: String },
    amount:    { type: Number, default: 0 },
    status:    { type: String, enum: ["active", "expired", "refunded"], default: "active" },
  },
  { timestamps: true }
);
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ course: 1 });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);

// ─── Progress ─────────────────────────────────────────────────────────────────
export interface IProgress extends Document {
  user:   mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  completedLessons: string[];
  currentLesson?:   string;
  watchedSeconds:   Map<string, number>;
  quizScores:       Map<string, { score: number; attempts: number; passed: boolean }>;
  percentComplete:  number;
  completedAt?:     Date;
  notes: { lessonId: string; content: string; timestamp: number; createdAt: Date }[];
}

const ProgressSchema = new Schema<IProgress>(
  {
    user:   { type: Schema.Types.ObjectId, ref: "User",   required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    completedLessons: [String],
    currentLesson:    { type: String },
    watchedSeconds:   { type: Map, of: Number, default: {} },
    quizScores:       { type: Map, of: Schema.Types.Mixed, default: {} },
    percentComplete:  { type: Number, default: 0, min: 0, max: 100 },
    completedAt:      { type: Date },
    notes: [{
      lessonId:  String,
      content:   String,
      timestamp: Number,
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);
ProgressSchema.index({ user: 1, course: 1 }, { unique: true });

export const Progress: Model<IProgress> =
  mongoose.models.Progress || mongoose.model<IProgress>("Progress", ProgressSchema);

// ─── Quiz ─────────────────────────────────────────────────────────────────────
export interface IQuizQuestion {
  _id: mongoose.Types.ObjectId;
  question:    string;
  type:        "single" | "multiple" | "true-false";
  options:     { text: string; isCorrect: boolean }[];
  explanation?: string;
  points:      number;
  order:       number;
}

export interface IQuiz extends Document {
  lesson:      mongoose.Types.ObjectId;
  course:      mongoose.Types.ObjectId;
  title:       string;
  description?: string;
  questions:   IQuizQuestion[];
  passingScore: number;
  timeLimit?:  number;
  maxAttempts: number;
}

const QuizSchema = new Schema<IQuiz>(
  {
    lesson:  { type: Schema.Types.ObjectId },
    course:  { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title:   { type: String, required: true },
    description: { type: String },
    questions: [{
      question:    { type: String, required: true },
      type:        { type: String, enum: ["single", "multiple", "true-false"], default: "single" },
      options:     [{ text: String, isCorrect: Boolean }],
      explanation: { type: String },
      points:      { type: Number, default: 1 },
      order:       { type: Number },
    }],
    passingScore: { type: Number, default: 70 },
    timeLimit:    { type: Number },
    maxAttempts:  { type: Number, default: 3 },
  },
  { timestamps: true }
);

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);

// ─── Review ───────────────────────────────────────────────────────────────────
export interface IReview extends Document {
  user:   mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  rating: number;
  title?: string;
  body:   string;
  verified: boolean;
}

const ReviewSchema = new Schema<IReview>(
  {
    user:   { type: Schema.Types.ObjectId, ref: "User",   required: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title:  { type: String, maxlength: 100 },
    body:   { type: String, required: true, maxlength: 2000 },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);
ReviewSchema.index({ course: 1, createdAt: -1 });
ReviewSchema.index({ user: 1, course: 1 }, { unique: true });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

// ─── Certificate ──────────────────────────────────────────────────────────────
export interface ICertificate extends Document {
  user:           mongoose.Types.ObjectId;
  course:         mongoose.Types.ObjectId;
  certificateId:  string;
  issuedAt:       Date;
  completionDate: Date;
  grade?:         number;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    user:           { type: Schema.Types.ObjectId, ref: "User",   required: true },
    course:         { type: Schema.Types.ObjectId, ref: "Course", required: true },
    certificateId:  { type: String, required: true, unique: true },
    issuedAt:       { type: Date, default: Date.now },
    completionDate: { type: Date, required: true },
    grade:          { type: Number },
  },
  { timestamps: true }
);

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate || mongoose.model<ICertificate>("Certificate", CertificateSchema);
