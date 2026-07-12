import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const firstField = Object.keys(fieldErrors)[0] as keyof typeof fieldErrors | undefined;
      const firstMessage = firstField ? fieldErrors[firstField]?.[0] : "Validation failed";
      return NextResponse.json(
        { error: firstMessage, field: firstField },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    const result = await signUp({ email, password, name, role });

    return NextResponse.json({
      user: result.user,
      session: result.session,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Signup error:", message);

    if (message.includes("already registered")) {
      return NextResponse.json(
        { error: "An account with this email already exists", field: "email" },
        { status: 409 }
      );
    }

    if (message.includes("Password should")) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters", field: "password" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Signup failed. Please try again." },
      { status: 500 }
    );
  }
}
