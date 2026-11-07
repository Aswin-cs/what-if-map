import NextAuth from "next-auth";
import { authOptions } from "../lib/auth.js";

const handler = NextAuth(authOptions);

async function testSession() {
  const req = new Request("http://localhost:3000/api/auth/session", {
    method: "GET",
    headers: {
      host: "localhost:3000",
      "user-agent": "test",
    },
  });
  req.nextUrl = new URL("http://localhost:3000/api/auth/session");

  const context = {
    params: Promise.resolve({ nextauth: ["session"] }),
  };

  try {
    const res = await handler(req, context);
    console.log("STATUS:", res.status);
    console.log("HEADERS:", Object.fromEntries(res.headers.entries()));
    const body = await res.text();
    console.log("BODY:", body);
  } catch (err) {
    console.error("CRASH:", err);
  }
}

testSession();
