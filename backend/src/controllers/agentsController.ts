
import { Request, Response } from 'express';
import Agent from '../models/Agent';
import TrainJob from '../models/TrainJob';
import Memory from '../models/Memory';
import ChatMessage from '../models/ChatMessage';

// @desc    Get all agents for a user
// @route   GET /api/agents
// @access  Private
export const getAgents = async (req: Request, res: Response) => {
    try {
        const agents = await Agent.find({ userId: (req.user as any).id })
            .sort({ createdAt: -1 });
        
        // Add training and memory statistics
        const agentsWithStats = await Promise.all(
            agents.map(async (agent) => {
                const memoryCount = await Memory.countDocuments({ agentId: agent._id });
                const trainingJobs = await TrainJob.find({ agentId: agent._id }).sort({ createdAt: -1 }).limit(5);
                const conversationCount = await ChatMessage.countDocuments({ agentId: agent._id });
                
                return {
                    ...agent.toObject(),
                    memoryCount,
                    recentTrainingJobs: trainingJobs,
                    conversationCount
                };
            })
        );
        
        res.status(200).json(agentsWithStats);
    } catch (error) {
        console.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
    }
};

// @desc    Get a single agent
// @route   GET /api/agents/:id
// @access  Private
export const getAgent = async (req: Request, res: Response) => {
    try {
        const agent = await Agent.findOne({ 
            _id: req.params.id, 
            userId: (req.user as any).id 
        });
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Add detailed statistics
        const memoryCount = await Memory.countDocuments({ agentId: agent._id });
        const trainingJobs = await TrainJob.find({ agentId: agent._id }).sort({ createdAt: -1 });
        const conversationCount = await ChatMessage.countDocuments({ agentId: agent._id });
        const recentConversations = await ChatMessage.find({ agentId: agent._id })
            .sort({ timestamp: -1 })
            .limit(10);
        
        const agentWithStats = {
            ...agent.toObject(),
            memoryCount,
            trainingJobs,
            conversationCount,
            recentConversations
        };
        
        res.status(200).json(agentWithStats);
    } catch (error) {
        console.error('Error fetching agent:', error);
        res.status(500).json({ error: 'Failed to fetch agent' });
    }
};

// @desc    Create an agent
// @route   POST /api/agents
// @access  Private
export const createAgent = async (req: Request, res: Response) => {
    try {
        const { 
            name, 
            description, 
            type = 'general', 
            tone = 'friendly',
            config = {},
            platforms = [],
            apis = []
        } = req.body;

        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({ 
                error: 'Name and description are required' 
            });
        }

        // Validate type
        const validTypes = ['support', 'sales', 'content', 'general'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ 
                error: `Type must be one of: ${validTypes.join(', ')}` 
            });
        }

        // Validate tone
        const validTones = ['friendly', 'formal', 'techy', 'fun'];
        if (!validTones.includes(tone)) {
            return res.status(400).json({ 
                error: `Tone must be one of: ${validTones.join(', ')}` 
            });
        }

        const agent = await Agent.create({
            name,
            description,
            type,
            tone,
            userId: (req.user as any).id,
            platforms,
            apis,
            config: {
                searchEnabled: config.searchEnabled ?? true,
                newsEnabled: config.newsEnabled ?? false,
                expressAgentEnabled: config.expressAgentEnabled ?? true
            },
            status: 'training'
        });

        res.status(201).json(agent);
    } catch (error) {
        console.error('Error creating agent:', error);
        res.status(500).json({ error: 'Failed to create agent' });
    }
};

// @desc    Update an agent
// @route   PUT /api/agents/:id
// @access  Private
export const updateAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // Remove fields that shouldn't be updated directly
        delete updates._id;
        delete updates.userId;
        delete updates.createdAt;
        delete updates.updatedAt;
        
        const agent = await Agent.findOneAndUpdate(
            { _id: id, userId: (req.user as any).id },
            updates,
            { new: true, runValidators: true }
        );
        
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        res.status(200).json(agent);
    } catch (error) {
        console.error('Error updating agent:', error);
        res.status(500).json({ error: 'Failed to update agent' });
    }
};

// @desc    Delete an agent
// @route   DELETE /api/agents/:id
// @access  Private
export const deleteAgent = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verify agent exists and belongs to user
        const agent = await Agent.findOne({ _id: id, userId: (req.user as any).id });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Delete related data
        await Promise.all([
            Memory.deleteMany({ agentId: id }),
            TrainJob.deleteMany({ agentId: id }),
            ChatMessage.deleteMany({ agentId: id })
        ]);
        
        // Delete the agent
        await Agent.findByIdAndDelete(id);
        
        res.status(200).json({ message: 'Agent deleted successfully' });
    } catch (error) {
        console.error('Error deleting agent:', error);
        res.status(500).json({ error: 'Failed to delete agent' });
    }
};

// @desc    Get agent training status
// @route   GET /api/agents/:id/training
// @access  Private
export const getAgentTrainingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verify agent exists and belongs to user
        const agent = await Agent.findOne({ _id: id, userId: (req.user as any).id });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Get training jobs
        const trainingJobs = await TrainJob.find({ agentId: id })
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Get memory statistics
        const memoryStats = await Memory.getStats(id);
        
        res.status(200).json({
            agent: {
                id: agent._id,
                name: agent.name,
                status: agent.status
            },
            trainingJobs,
            memoryStats: memoryStats[0] || {
                totalMemories: 0,
                totalChunks: 0,
                sources: [],
                avgTextLength: 0
            }
        });
    } catch (error) {
        console.error('Error fetching training status:', error);
        res.status(500).json({ error: 'Failed to fetch training status' });
    }
};

// @desc    Clear agent memory
// @route   DELETE /api/agents/:id/memory
// @access  Private
export const clearAgentMemory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        // Verify agent exists and belongs to user
        const agent = await Agent.findOne({ _id: id, userId: (req.user as any).id });
        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }
        
        // Delete all memories for this agent
        const result = await Memory.deleteMany({ agentId: id });
        
        // Update agent status
        await Agent.findByIdAndUpdate(id, { status: 'training' });
        
        res.status(200).json({ 
            message: 'Agent memory cleared successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error clearing agent memory:', error);
        res.status(500).json({ error: 'Failed to clear agent memory' });
    }
};
