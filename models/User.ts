import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  image?: string;
  role: "student" | "instructor" | "admin";
  provider?: string;
  emailVerified?: Date;
  headline?: string;
  bio?: string;
  enrolledCourses: mongoose.Types.ObjectId[];
  createdCourses:  mongoose.Types.ObjectId[];
  certificates:    mongoose.Types.ObjectId[];
  stripeCustomerId?: string;
  stats: {
    totalCoursesCompleted: number;
    totalHoursLearned:     number;
    currentStreak:         number;
    longestStreak:         number;
    lastActiveDate?:       Date;
    points:                number;
    level:                 number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    name:     { type: String, required: true, trim: true },
    image:    { type: String },
    role:     { type: String, enum: ["student", "instructor", "admin"], default: "student" },
    provider: { type: String },
    emailVerified: { type: Date },
    headline: { type: String, maxlength: 120 },
    bio:      { type: String, maxlength: 2000 },
    enrolledCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
    createdCourses:  [{ type: Schema.Types.ObjectId, ref: "Course" }],
    certificates:    [{ type: Schema.Types.ObjectId, ref: "Certificate" }],
    stripeCustomerId: { type: String },
    stats: {
      totalCoursesCompleted: { type: Number, default: 0 },
      totalHoursLearned:     { type: Number, default: 0 },
      currentStreak:         { type: Number, default: 0 },
      longestStreak:         { type: Number, default: 0 },
      lastActiveDate:        { type: Date },
      points:                { type: Number, default: 0 },
      level:                 { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);


const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
export default User;