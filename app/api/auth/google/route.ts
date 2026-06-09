import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";

import connectDB from "@/lib/db";
import User from "@/models/User";
import { createToken, setAuthCookie } from "@/lib/auth";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);
console.log(
  "CLIENT ID:---------",
  process.env
    .NEXT_PUBLIC_GOOGLE_CLIENT_ID
);
async function verifyGoogleToken(
  credential: string
) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) return null;

    return {
      email: payload.email,
      emailVerified:
        payload.email_verified,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
      sub: payload.sub,
    };
  } catch (error) {
    console.error(
      "Google verify error:",
      error
    );

    return null;
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const { credential } =
      await request.json();

    if (!credential) {
      return NextResponse.json(
        {
          error:
            "Google credential required",
        },
        { status: 400 }
      );
    }

    const googleUser =
      await verifyGoogleToken(
        credential
      );

    if (!googleUser) {
      return NextResponse.json(
        {
          error:
            "Invalid Google credential",
        },
        { status: 401 }
      );
    }

    if (!googleUser.emailVerified) {
      return NextResponse.json(
        {
          error:
            "Google email not verified",
        },
        { status: 401 }
      );
    }

    await connectDB();

    let user = await User.findOne({
      email:
        googleUser.email?.toLowerCase(),
    });

    let isNewUser = false;

    if (user) {
      if (!user.isActive) {
        return NextResponse.json(
          {
            error:
              "Account deactivated",
          },
          { status: 403 }
        );
      }

      if (
        !user.avatarUrl &&
        googleUser.picture
      ) {
        user.avatarUrl =
          googleUser.picture;

        await user.save();
      }
    } else {
      isNewUser = true;

      user = await User.create({
        email:
          googleUser.email?.toLowerCase(),

        passwordHash: "",

        firstName:
          googleUser.givenName ||
          "User",

        lastName:
          googleUser.familyName ||
          "",

        avatarUrl:
          googleUser.picture || null,

        googleId: googleUser.sub,

        role: "client",

        isActive: true,

        emailVerified: true,
      });
    }

    const token =
      await createToken({
        userId: String(user._id),
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        role: user.role,
      });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,

      message: isNewUser
        ? "Account created successfully"
        : "Login successful",

      user: {
        id: String(user._id),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error(
      "Google auth error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Authentication failed",
      },
      { status: 500 }
    );
  }
}