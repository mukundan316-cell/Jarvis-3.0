import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

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
    secret: process.env.SESSION_SECRET || "jarvis-local-auth-secret-key",
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

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, cb) => cb(null, user));
  passport.deserializeUser((user: any, cb) => cb(null, user));

  passport.use(
    new LocalStrategy(
      {
        usernameField: "username",
        passwordField: "password",
      },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          
          if (!user) {
            return done(null, false, { message: "Invalid username or password" });
          }
          
          if (!user.passwordHash) {
            return done(null, false, { message: "Account requires password reset" });
          }
          
          const isValid = await bcrypt.compare(password, user.passwordHash);
          
          if (!isValid) {
            return done(null, false, { message: "Invalid username or password" });
          }
          
          const sessionUser = {
            claims: {
              sub: user.id,
              email: user.email || "",
              username: user.username || "",
              first_name: user.firstName || "",
              last_name: user.lastName || "",
              profile_image_url: user.profileImageUrl || "",
            },
            id: user.id,
          };
          
          return done(null, sessionUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login error" });
        }
        return res.json({ 
          success: true, 
          user: user.claims 
        });
      });
    })(req, res, next);
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, firstName, lastName } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      if (username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters" });
      }
      
      if (password.length < 5) {
        return res.status(400).json({ message: "Password must be at least 5 characters" });
      }
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      if (email) {
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      
      const user = await storage.createUserWithPassword({
        username,
        password,
        email,
        firstName,
        lastName,
      });
      
      const sessionUser = {
        claims: {
          sub: user.id,
          email: user.email || "",
          username: user.username || "",
          first_name: user.firstName || "",
          last_name: user.lastName || "",
          profile_image_url: user.profileImageUrl || "",
        },
        id: user.id,
      };
      
      req.logIn(sessionUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Registration successful but login failed" });
        }
        return res.json({ 
          success: true, 
          user: sessionUser.claims 
        });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
