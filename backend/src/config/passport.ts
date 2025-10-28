
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

import User from '../models/User';
import { AuthService } from '../services/authService';

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails?.[0]?.value;
            const name = profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName;
            const avatar = profile.photos?.[0]?.value;

            if (!email) {
                return done(new Error('No email provided by Google'), undefined);
            }

            // Check if user already exists with Google ID
            let user = await User.findByGoogleId(profile.id);
            
            if (user) {
                // Update last login
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }

            // Check if user exists with same email
            user = await User.findByEmail(email);
            
            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.avatar = avatar || user.avatar;
                user.lastLogin = new Date();
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                googleId: profile.id,
                name: name || 'Google User',
                email: email,
                avatar: avatar,
                isEmailVerified: true, // Google emails are verified
                lastLogin: new Date()
            });

            return done(null, user);
        } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error, undefined);
        }
    }
));

// Local Strategy for email/password login
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findByEmail(email);
        
        if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
        }

        const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            return done(null, false, { message: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        return done(null, user);
    } catch (error) {
        logger.error('Local strategy error:', error);
        return done(error, false);
    }
}));

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET!
}, async (payload, done) => {
    try {
        if (payload.type !== 'access') {
            return done(null, false);
        }

        const user = await User.findById(payload.id);
        
        if (!user) {
            return done(null, false);
        }

        return done(null, user);
    } catch (error) {
        logger.error('JWT strategy error:', error);
        return done(error, false);
    }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        logger.error('Deserialize user error:', error);
        done(error, null);
    }
});
