export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import connectDB from "@/lib/db/connect";
import { Enrollment } from "@/models/index";
import Course from "@/models/Course";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" as any });

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const { userId, courseId } = s.metadata!;
    await connectDB();
    await Promise.all([
      Enrollment.create({ user: userId, course: courseId, paymentId: s.payment_intent as string, amount: (s.amount_total || 0) / 100 }),
      User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }),
      Course.findByIdAndUpdate(courseId, { $inc: { "stats.totalStudents": 1 } }),
    ]);
  }

  if (event.type === "charge.refunded") {
    const c = event.data.object as Stripe.Charge;
    await connectDB();
    await Enrollment.findOneAndUpdate({ paymentId: c.payment_intent }, { status: "refunded" });
  }

  return NextResponse.json({ received: true });
}