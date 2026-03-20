export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import Stripe from "stripe";
import connectDB from "@/lib/db/connect";
import Course from "@/models/Course";
import User from "@/models/User";
import { Enrollment } from "@/models/index";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { courseSlug } = await req.json();

  await connectDB();
  const [course, user] = await Promise.all([
    Course.findOne({ slug: courseSlug, status: "published" }),
    User.findById(userId),
  ]);
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

  const alreadyEnrolled = await Enrollment.findOne({ user: userId, course: course._id });
  if (alreadyEnrolled) return NextResponse.json({ error: "Already enrolled" }, { status: 400 });

  // Free enrollment
  if (course.isFree || course.price === 0) {
    await Promise.all([
      Enrollment.create({ user: userId, course: course._id, amount: 0 }),
      User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: course._id } }),
      Course.findByIdAndUpdate(course._id, { $inc: { "stats.totalStudents": 1 } }),
    ]);
    return NextResponse.json({ success: true, enrolled: true });
  }

  // Stripe checkout
  let stripeCustomerId = user?.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: session.user?.email!, name: session.user?.name!, metadata: { userId } });
    stripeCustomerId = customer.id;
    await User.findByIdAndUpdate(userId, { stripeCustomerId });
  }

  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "payment",
    line_items: [{
      price_data: {
        currency: course.currency || "usd",
        unit_amount: Math.round(course.price * 100),
        product_data: { name: course.title, description: course.shortDesc, images: course.thumbnail ? [course.thumbnail] : [] },
      },
      quantity: 1,
    }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?payment=success`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/courses/${courseSlug}?payment=cancelled`,
    metadata: { userId, courseId: course._id.toString(), courseSlug },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: checkout.url });
}