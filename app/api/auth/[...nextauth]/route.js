import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

async function authHandler(req, context) {
  try {
    // Next.js 15/16 passes standard Web Request where req.nextUrl may be undefined.
    // NextAuth v4 expects req.nextUrl to extract searchParams.
    if (!req.nextUrl && req.url) {
      try {
        req.nextUrl = new URL(req.url);
      } catch {
        const host = req.headers?.get?.("host") || "localhost:3000";
        const protocol = req.headers?.get?.("x-forwarded-proto") || "http";
        req.nextUrl = new URL(req.url, `${protocol}://${host}`);
      }
    }

    // In Next.js 15/16 App Router, context.params is a Promise. Ensure resolved params exist.
    const resolvedParams = context?.params ? await context.params : { nextauth: ["session"] };
    const routeContext = {
      ...context,
      params: resolvedParams,
    };

    const response = await handler(req, routeContext);

    // Guard: /api/auth/session must ALWAYS return JSON, never a redirect or HTML page
    const isSessionRequest = resolvedParams?.nextauth?.[0] === "session";
    if (isSessionRequest) {
      if (response.status === 302 || response.status === 307) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("text/html")) {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return response;
  } catch (error) {
    console.error("[NextAuth Route Handler Error]:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal NextAuth Error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export { authHandler as GET, authHandler as POST };


