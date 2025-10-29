import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import { AppError, AuthResponse, IUser, LoginRequest, RegisterRequest } from '../types';

export class AuthService {
    private static readonly JWT_SECRET = process.env.JWT_SECRET!;
    private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
    private static readonly JWT_EXPIRE = process.env.JWT_EXPIRE || '15m';
    private static readonly JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '7d';

    /**
     * Generate JWT access token
     */
    static generateAccessToken(userId: string): string {
        return jwt.sign(
            { id: userId, type: 'access' },
            this.JWT_SECRET as unknown as Secret,
            { expiresIn: this.JWT_EXPIRE } as SignOptions
        );
    }

    /**
     * Generate JWT refresh token
     */
    static generateRefreshToken(userId: string): string {
        return jwt.sign(
            { id: userId, type: 'refresh' },
            this.JWT_REFRESH_SECRET as unknown as Secret,
            { expiresIn: this.JWT_REFRESH_EXPIRE } as SignOptions
        );
    }

    /**
     * Verify JWT access token
     */
    static verifyAccessToken(token: string): { id: string; type: string } {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET) as any;
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            throw new AppError('Invalid access token', 401);
        }
    }

    /**
     * Verify JWT refresh token
     */
    static verifyRefreshToken(token: string): { id: string; type: string } {
        try {
            const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET) as any;
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            throw new AppError('Invalid refresh token', 401);
        }
    }

    /**
     * Register a new user
     */
    static async register(data: RegisterRequest): Promise<AuthResponse> {
        const { name, email, password, confirmPassword } = data;

        // Validate passwords match
        if (password !== confirmPassword) {
            throw new AppError('Passwords do not match', 400);
        }

        // Check if user already exists
        const existingUser = await (User as any).findByEmail(email);
        if (existingUser) {
            throw new AppError('User already exists with this email', 400);
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password
        });

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id.toString());
        const refreshToken = this.generateRefreshToken(user._id.toString());

        return {
            user: user.toJSON(),
            token: accessToken
        };
    }

    /**
     * Login user
     */
    static async login(data: LoginRequest): Promise<AuthResponse> {
        const { email, password } = data;

        // Find user by email
        const user = await (User as any).findByEmail(email);
        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const accessToken = this.generateAccessToken(user._id.toString());
        const refreshToken = this.generateRefreshToken(user._id.toString());

        return {
            user: user.toJSON(),
            token: accessToken
        };
    }

    /**
     * Refresh access token
     */
    static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        const decoded = this.verifyRefreshToken(refreshToken);
        
        // Find user
        const user = await User.findById(decoded.id);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Generate new access token
        const accessToken = this.generateAccessToken(user._id.toString());

        return { accessToken };
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string): Promise<IUser | null> {
        return User.findById(userId);
    }

    /**
     * Update user profile
     */
    static async updateProfile(userId: string, updateData: Partial<IUser>): Promise<IUser> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Update allowed fields
        const allowedFields = ['name', 'company', 'bio', 'avatar'];
        allowedFields.forEach(field => {
            if (updateData[field as keyof IUser] !== undefined) {
                (user as any)[field] = updateData[field as keyof IUser];
            }
        });

        await user.save();
        return user;
    }

    /**
     * Change password
     */
    static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            throw new AppError('Current password is incorrect', 400);
        }

        // Update password
        user.password = newPassword;
        await user.save();
    }

    /**
     * Delete user account
     */
    static async deleteAccount(userId: string): Promise<void> {
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // TODO: Delete all related data (agents, deployments, etc.)
        await User.findByIdAndDelete(userId);
    }
}
