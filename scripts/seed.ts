import "dotenv/config";
import mongoose from "mongoose";

const URI = process.env.MONGODB_URI || "mongodb://localhost:27017/jlearn";

const COURSES = [
  {
    title: "Complete React Developer Course 2024",
    slug: "complete-react-developer-2024",
    shortDesc: "Master React from scratch — hooks, context, Redux, testing, and deployment.",
    description: "A comprehensive course taking you from absolute beginner to professional React developer. Build 10+ real-world projects, learn the latest patterns, and gain skills employers are looking for.",
    category: "Web Development", level: "beginner", language: "English",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    price: 79.99, originalPrice: 199.99, isFree: false, status: "published", publishedAt: new Date(),
    featured: true, bestseller: true,
    requirements: ["Basic HTML & CSS knowledge", "JavaScript fundamentals"],
    outcomes: ["Build powerful React apps from scratch", "Master React Hooks deeply", "Manage state with Redux Toolkit", "Deploy to Vercel and Netlify"],
    sections: [
      { title: "Getting Started", order: 1, lessons: [
        { title: "Welcome & Overview", type: "video", duration: 480, isPreview: true, order: 1 },
        { title: "Setting Up Your Environment", type: "video", duration: 720, isPreview: true, order: 2 },
        { title: "Creating Your First App", type: "video", duration: 900, isPreview: false, order: 3 },
      ]},
      { title: "React Fundamentals", order: 2, lessons: [
        { title: "JSX Deep Dive", type: "video", duration: 1200, isPreview: false, order: 1 },
        { title: "Props & State", type: "video", duration: 1500, isPreview: false, order: 2 },
        { title: "Fundamentals Quiz", type: "quiz", duration: 0, isPreview: false, order: 3 },
      ]},
    ],
    stats: { totalStudents: 28450, totalReviews: 4200, averageRating: 4.8, totalLessons: 6, totalDuration: 4800 },
  },
  {
    title: "Data Science & ML Bootcamp",
    slug: "data-science-ml-bootcamp",
    shortDesc: "Learn Python, Pandas, NumPy, Scikit-Learn and TensorFlow from scratch.",
    description: "The most comprehensive Data Science bootcamp available. Covers everything you need from Python basics to advanced machine learning.",
    category: "Data Science", level: "intermediate", language: "English",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    price: 94.99, originalPrice: 249.99, isFree: false, status: "published", publishedAt: new Date(),
    featured: true, bestseller: false,
    requirements: ["Basic Python knowledge", "High school mathematics"],
    outcomes: ["Use Python for data analysis", "Build ML models with Scikit-Learn", "Work with neural networks using TensorFlow"],
    sections: [
      { title: "Python for Data Science", order: 1, lessons: [
        { title: "Python Crash Course", type: "video", duration: 3600, isPreview: true, order: 1 },
        { title: "NumPy & Pandas", type: "video", duration: 2400, isPreview: false, order: 2 },
      ]},
    ],
    stats: { totalStudents: 15200, totalReviews: 2800, averageRating: 4.7, totalLessons: 2, totalDuration: 6000 },
  },
  {
    title: "UX Design Fundamentals",
    slug: "ux-design-fundamentals",
    shortDesc: "Learn user research, wireframing, prototyping, and design systems.",
    description: "Master UX Design fundamentals with hands-on projects. Learn to think like a designer, conduct user research, and build design systems.",
    category: "Design", level: "beginner", language: "English",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop",
    price: 0, isFree: true, status: "published", publishedAt: new Date(),
    featured: true, bestseller: false,
    requirements: ["No prior design experience needed"],
    outcomes: ["Understand core UX principles", "Create wireframes and prototypes in Figma", "Build and document design systems"],
    sections: [
      { title: "Introduction to UX", order: 1, lessons: [
        { title: "What is UX Design?", type: "video", duration: 900, isPreview: true, order: 1 },
        { title: "The Design Process", type: "article", duration: 600, isPreview: true, order: 2 },
      ]},
    ],
    stats: { totalStudents: 8900, totalReviews: 1200, averageRating: 4.6, totalLessons: 2, totalDuration: 1500 },
  },
];

async function seed() {
  await mongoose.connect(URI);
  console.log("🔗 Connected to MongoDB");

  const { default: User }   = await import("../models/User");
  const { default: Course } = await import("../models/Course");

  let instructor = await User.findOne({ email: "instructor@jlearn.com" });
  if (!instructor) {
    instructor = await User.create({
      email: "instructor@jlearn.com", name: "Alex Johnson",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      role: "instructor", headline: "Senior Engineer & Educator", emailVerified: new Date(),
      stats: { totalCoursesCompleted: 0, totalHoursLearned: 0, currentStreak: 0, longestStreak: 0, points: 5000, level: 10 },
    });
    console.log("✅ Instructor created");
  }

  for (const data of COURSES) {
    const exists = await Course.findOne({ slug: data.slug });
    if (!exists) {
      await Course.create({ ...data, instructor: instructor._id });
      console.log(`✅ Seeded: ${data.title}`);
    } else {
      console.log(`⏭  Exists: ${data.title}`);
    }
  }

  await mongoose.disconnect();
  console.log("✅ Seed complete");
}

seed().catch(e => { console.error("❌ Seed failed:", e); process.exit(1); });