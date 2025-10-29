
import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';
import { IUser } from '../types';

const UserSchema: Schema = new Schema({
    googleId: { type: String, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6 },
    avatar: { type: String },
    company: { type: String, trim: true },
    bio: { type: String, maxlength: 500 },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    lastLogin: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
}, { 
    timestamps: true,
    toJSON: { 
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.emailVerificationToken;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            return ret;
        }
    }
});

// Note: Avoid duplicate indexes; rely on field-level indexes/uniques configured above

// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
    const self: any = this as any;
    if (!self.isModified('password') || !self.password) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(12);
        self.password = await bcrypt.hash(self.password, salt);
        next();
    } catch (error) {
        next(error as Error);
    }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
};

// Static methods typing for the User model
// Static method to find user by email
UserSchema.statics.findByEmail = function(email: string) {
    return (this as any).findOne({ email: email.toLowerCase() });
};

// Static method to find user by Google ID
UserSchema.statics.findByGoogleId = function(googleId: string) {
    return (this as any).findOne({ googleId });
};

export default mongoose.model<IUser>('User', UserSchema);
