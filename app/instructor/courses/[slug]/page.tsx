import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import CourseEditorForm from "@/components/instructor/CourseEditorForm";

export default async function EditInstructorCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/instructor");

  const userId = (session.user as any)?.id;
  const role = (session.user as any)?.role;
  if (!["instructor", "admin"].includes(role)) redirect("/dashboard");

  const { slug } = await params;

  await connectDB();
  const course = await Course.findOne({ slug }).lean() as any;

  if (!course) notFound();
  if (course.instructor?.toString() !== userId && role !== "admin") redirect("/instructor");

  return (
    <CourseEditorForm
      mode="edit"
      slug={course.slug}
      initialData={{
        title: course.title,
        shortDesc: course.shortDesc,
        description: course.description,
        category: course.category,
        level: course.level,
        language: course.language,
        price: course.price,
        isFree: course.isFree,
        thumbnail: course.thumbnail,
        sections: (course.sections || []).map((section: any, index: number) => ({
          id: index + 1,
          title: section.title,
          order: section.order ?? index + 1,
          lessons: section.lessons || [],
        })),
        outcomes: course.outcomes || [],
        requirements: course.requirements || [],
      }}
    />
  );
}
