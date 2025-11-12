import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("GitHub OAuth credentials not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(profile: any) {
  await storage.upsertUser({
    id: profile.id,
    email: profile.emails?.[0]?.value || "",
    firstName: profile.displayName?.split(" ")[0] || "",
    lastName: profile.displayName?.split(" ").slice(1).join(" ") || "",
    profileImageUrl: profile.photos?.[0]?.value || "",
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    const callbackURL = `${req.protocol}://${req.get('host')}/api/callback`;
    
    const strategy = new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL,
        scope: ["user:email"],
      },
      async (accessToken: string, refreshToken: string, profile: any, done: any) => {
        try {
          await upsertUser(profile);
          const user = {
            claims: {
              sub: profile.id,
              email: profile.emails?.[0]?.value || "",
              first_name: profile.displayName?.split(" ")[0] || "",
              last_name: profile.displayName?.split(" ").slice(1).join(" ") || "",
              profile_image_url: profile.photos?.[0]?.value || "",
            },
            id: profile.id,
            accessToken,
            profile,
          };
          done(null, user);
        } catch (error) {
          done(error);
        }
      }
    );
    
    passport.use('github-dynamic', strategy);
    passport.authenticate('github-dynamic', { scope: ["user:email"] })(req, res, next);
  });
  
  app.get("/api/callback", (req, res, next) => {
    passport.authenticate('github-dynamic', {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });
  
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
