import express, { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import Resource from '../models/Resource';
import Agent from '../models/Agent';
import { parseFile, getFileTypeFromMimeType, getFileTypeFromExtension } from '../utils/parseFile';
import { validateFileUpload, generateSecureFilename, SECURITY_CONFIG } from '../utils/security';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();
// All routes require authentication to ensure req.user is populated
router.use(protect);

// Multer configuration for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = process.env.UPLOAD_PATH || './uploads';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const secureFilename = generateSecureFilename(file.originalname);
      cb(null, secureFilename);
    }
  }),
  limits: {
    fileSize: SECURITY_CONFIG.MAX_FILE_SIZE,
    files: SECURITY_CONFIG.MAX_FILES_PER_REQUEST
  },
  fileFilter: (req, file, cb) => {
    const validation = validateFileUpload(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

// Validation middleware for resource requests
const validateResourceRequest = (req: Request, res: Response, next: NextFunction) => {
  const { linkedAgents } = req.body;

  // Validate linked agents if provided
  if (linkedAgents && Array.isArray(linkedAgents)) {
    // Check if all linked agents belong to the user
    const userId = (req.user as any).id;
    Agent.find({ _id: { $in: linkedAgents }, userId })
      .then(agents => {
        if (agents.length !== linkedAgents.length) {
          return res.status(400).json({
            error: 'One or more linked agents not found or access denied'
          });
        }
        return next();
      })
      .catch(error => {
        return res.status(500).json({ error: 'Failed to validate linked agents' });
      });
  } else {
    return next();
  }
};

/**
 * @swagger
 * /api/resources:
 *   post:
 *     summary: Upload a resource file
 *     description: Upload a file to be used as training data for agents
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload
 *               linkedAgents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of agent IDs to link this resource to
 *     responses:
 *       200:
 *         description: Resource uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 originalName:
 *                   type: string
 *                 type:
 *                   type: string
 *                 size:
 *                   type: number
 *                 uploadDate:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [processed, processing, failed]
 *                 url:
 *                   type: string
 *                 linkedAgents:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/', upload.single('file'), validateResourceRequest, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { linkedAgents = [] } = req.body;
    const userId = (req.user as any).id;

    // Determine file type
    const fileType = getFileTypeFromMimeType(req.file.mimetype) || 
                    getFileTypeFromExtension(req.file.originalname);

    // Create resource record
    const resource = new Resource({
      userId,
      name: req.file.filename,
      originalName: req.file.originalname,
      type: fileType,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadDate: new Date(),
      linkedAgents: Array.isArray(linkedAgents) ? linkedAgents : [],
      status: 'processing',
      url: `/uploads/${req.file.filename}`,
      path: req.file.path
    });

    await resource.save();

    // Process file asynchronously
    setImmediate(async () => {
      try {
        const fileBuffer = fs.readFileSync(req.file!.path);
        const parseResult = await parseFile(fileBuffer, fileType);
        
        if (parseResult.success && parseResult.text) {
          await Resource.findByIdAndUpdate(resource._id, {
            status: 'processed',
            metadata: {
              wordCount: parseResult.text.split(/\s+/).length,
              extractedText: parseResult.text.substring(0, 1000) + '...',
              ...parseResult.metadata
            }
          });
        } else {
          await Resource.findByIdAndUpdate(resource._id, {
            status: 'failed',
            metadata: {
              error: parseResult.error || 'Failed to process file'
            }
          });
        }
      } catch (error) {
        await Resource.findByIdAndUpdate(resource._id, {
          status: 'failed',
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    });

    res.status(201).json(resource);
    return;
  } catch (error) {
    console.error('Error uploading resource:', error);
    res.status(500).json({ error: 'Failed to upload resource' });
    return;
  }
});

/**
 * @swagger
 * /api/resources:
 *   get:
 *     summary: Get all resources for a user
 *     description: Retrieve all uploaded resources for the authenticated user
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: agentId
 *         schema:
 *           type: string
 *         description: Filter resources by linked agent ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processed, processing, failed]
 *         description: Filter resources by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter resources by file type
 *     responses:
 *       200:
 *         description: Resources retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   originalName:
 *                     type: string
 *                   type:
 *                     type: string
 *                   size:
 *                     type: number
 *                   uploadDate:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                   linkedAgents:
 *                     type: array
 *                     items:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.user as any).id;
    const { agentId, status, type } = req.query;

    const filter: any = { userId };
    if (agentId) filter.linkedAgents = agentId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    const resources = await Resource.find(filter)
      .sort({ uploadDate: -1 })
      .populate('linkedAgents', 'name');

    res.json(resources);
    return;
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
    return;
  }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   get:
 *     summary: Get a specific resource
 *     description: Retrieve details of a specific resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource retrieved successfully
 *       404:
 *         description: Resource not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const resource = await Resource.findOne({ _id: id, userId })
      .populate('linkedAgents', 'name');

    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    res.json(resource);
    return;
  } catch (error) {
    console.error('Error fetching resource:', error);
    res.status(500).json({ error: 'Failed to fetch resource' });
    return;
  }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   put:
 *     summary: Update a resource
 *     description: Update resource metadata or linked agents
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               linkedAgents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of agent IDs to link this resource to
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       404:
 *         description: Resource not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;
    const { linkedAgents } = req.body;

    // Validate linked agents if provided
    if (linkedAgents && Array.isArray(linkedAgents)) {
      const agents = await Agent.find({ _id: { $in: linkedAgents }, userId });
      if (agents.length !== linkedAgents.length) {
        res.status(400).json({
          error: 'One or more linked agents not found or access denied'
        });
        return;
      }
    }

    const resource = await Resource.findOneAndUpdate(
      { _id: id, userId },
      { linkedAgents },
      { new: true }
    ).populate('linkedAgents', 'name');

    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    res.json(resource);
    return;
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
    return;
  }
});

/**
 * @swagger
 * /api/resources/{id}:
 *   delete:
 *     summary: Delete a resource
 *     description: Delete a resource and its associated file
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const resource = await Resource.findOne({ _id: id, userId });
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    // Delete the physical file
    try {
      if (fs.existsSync(resource.path)) {
        fs.unlinkSync(resource.path);
      }
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
    }

    // Delete the database record
    await Resource.findByIdAndDelete(id);

    res.json({ message: 'Resource deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
    return;
  }
});

/**
 * @swagger
 * /api/resources/{id}/download:
 *   get:
 *     summary: Download a resource file
 *     description: Download the original file for a resource
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Resource ID
 *     responses:
 *       200:
 *         description: File download
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Resource not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/:id/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;

    const resource = await Resource.findOne({ _id: id, userId });
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }

    if (!fs.existsSync(resource.path)) {
      res.status(404).json({ error: 'File not found on disk' });
      return;
    }

    res.download(resource.path, resource.originalName);
    return;
  } catch (error) {
    console.error('Error downloading resource:', error);
    res.status(500).json({ error: 'Failed to download resource' });
    return;
  }
});

export default router;