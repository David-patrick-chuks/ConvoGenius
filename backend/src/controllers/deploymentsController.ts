
import axios from 'axios';
import { Request, Response } from 'express';
import Deployment from '../models/Deployment';
import deploymentQueue from '../queues/deploymentQueue';
import logger from '../utils/logger'; // Import the logger

// @desc    Get all deployments for an agent
// @route   GET /api/deployments
// @access  Private
export const getDeployments = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const deployments = await Deployment.find({ userId: userId, ...(req.query.agentId ? { agent: req.query.agentId } : {}) });
        res.status(200).json(deployments);
        return;
    } catch (error) {
        logger.error('Error fetching deployments:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

// @desc    Get connected accounts summary
// @route   GET /api/deployments/summary
// @access  Private
export const getDeploymentsSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any).id;
        const deployments = await Deployment.find({ userId, status: 'active' });
        const connectedCount = deployments.length;
        
        // Group by platform
        const platformCounts: Record<string, number> = {};
        deployments.forEach(dep => {
            platformCounts[dep.platform] = (platformCounts[dep.platform] || 0) + 1;
        });

        res.status(200).json({
            connectedCount,
            platformCounts,
            totalDeployments: deployments.length
        });
        return;
    } catch (error) {
        logger.error('Error fetching deployments summary:', error);
        res.status(500).json({ message: 'Server error' });
        return;
    }
};

// @desc    Create a deployment
// @route   POST /api/deployments
// @access  Private
export const createDeployment = async (req: Request, res: Response) => {
    const { agent, platform, config } = req.body;

    const deployment = await Deployment.create({
        agent,
        platform,
        config,
    });

    await deploymentQueue.add({ deploymentId: deployment.id });

    res.status(201).json(deployment);
};

// @desc    Initiate OAuth flow
// @route   GET /api/deployments/oauth/:platform
// @access  Private
export const oauth = async (req: Request, res: Response) => {
    const { platform } = req.params;
    const { deploymentId } = req.query; // Expect deploymentId from frontend
    
    if (!deploymentId) {
        return res.status(400).json({ message: 'Deployment ID is required for OAuth flow' });
    }

    if (platform === 'slack') {
        const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID!;
        const redirectUri = `${process.env.BACKEND_URL}/api/deployments/oauth/slack/callback?deploymentId=${deploymentId}`;
        const scopes = 'chat:write,channels:read,groups:read'; // Example scopes, adjust as needed
        const slackAuthUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${redirectUri}`;
        return res.redirect(slackAuthUrl);
    } else if (platform === 'discord') {
        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
        const redirectUri = `${process.env.BACKEND_URL}/api/deployments/oauth/discord/callback?deploymentId=${deploymentId}`;
        const scopes = 'bot applications.commands'; // Example scopes, adjust as needed
        const discordAuthUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=${scopes}&response_type=code&redirect_uri=${redirectUri}`;
        return res.redirect(discordAuthUrl);
    } else {
        res.status(400).json({ message: `Unsupported platform for OAuth: ${platform}` });
    }
};

// @desc    Handle OAuth callback
// @route   GET /api/deployments/oauth/:platform/callback
// @access  Public
export const oauthCallback = async (req: Request, res: Response) => {
    const { platform } = req.params;
    const { code, deploymentId } = req.query;

    if (!code) {
        logger.error(`OAuth callback for ${platform} failed: No authorization code provided.`);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=${platform}&error=no_code`);
    }

    if (!deploymentId) {
        logger.error(`OAuth callback for ${platform} failed: No deployment ID provided.`);
        return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=${platform}&error=no_deployment_id`);
    }

    try {
        const deployment = await Deployment.findById(deploymentId);
        if (!deployment) {
            logger.error(`OAuth callback for ${platform} failed: Deployment with ID ${deploymentId} not found.`);
            return res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=${platform}&error=deployment_not_found`);
        }

        if (platform === 'slack') {
            const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || 'YOUR_SLACK_CLIENT_ID';
            const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || 'YOUR_SLACK_CLIENT_SECRET';
            const redirectUri = `${process.env.BACKEND_URL}/api/deployments/oauth/slack/callback`;

            try {
                const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
                    params: {
                        client_id: SLACK_CLIENT_ID,
                        client_secret: SLACK_CLIENT_SECRET,
                        code,
                        redirect_uri: redirectUri,
                    },
                });

                if (response.data.ok) {
                    const { access_token, team } = response.data;
                    // Update deployment config with Slack tokens
                    deployment.config = { ...deployment.config, slack: { accessToken: access_token, teamId: team.id } };
                    await deployment.save();

                    logger.info('Slack OAuth successful:', { access_token, team });
                    res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=true&platform=slack`);
                } else {
                    logger.error('Slack OAuth error:', response.data.error);
                    res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=slack&error=${response.data.error}`);
                }
            } catch (error) {
                logger.error('Error during Slack OAuth:', error);
                res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=slack&error=internal_error`);
            }
    } else if (platform === 'discord') {
        const { code } = req.query;
        if (!code) {
            return res.status(400).json({ message: 'Authorization code not provided' });
        }

        const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || 'YOUR_DISCORD_CLIENT_ID';
        const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'YOUR_DISCORD_CLIENT_SECRET';
        const redirectUri = `${process.env.BACKEND_URL}/api/deployments/oauth/discord/callback`;

        try {
            const response = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: DISCORD_CLIENT_ID,
                client_secret: DISCORD_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: redirectUri,
            }).toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            if (response.data) {
                const { access_token, bot_token, guild } = response.data;
                // Update deployment config with Discord tokens
                deployment.config = { ...deployment.config, discord: { accessToken: access_token, botToken: bot_token, guildId: guild.id } };
                await deployment.save();

                logger.info('Discord OAuth successful:', { access_token, bot_token, guild });
                res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=true&platform=discord`);
            } else {
                logger.error('Discord OAuth error:', response.data);
                res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=discord&error=oauth_error`);
            }
            } catch (error) {
                logger.error('Error during Discord OAuth:', error);
                res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=discord&error=internal_error`);
            }
        } else {
            res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=${platform}&error=unsupported_platform`);
        }
    } catch (error) {
        logger.error(`Error during OAuth callback for ${platform}:`, error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard?oauth_success=false&platform=${platform}&error=internal_error`);
    }
};
