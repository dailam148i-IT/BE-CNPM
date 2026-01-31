import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { notificationService } from '../notifications/notification.service.js';

export const sseController = {
    /**
     * GET /api/sse/subscribe?token=xxx
     * Subscribe to real-time notifications via Server-Sent Events
     * 
     * Note: EventSource doesn't support custom headers, so we pass token via query
     */
    async subscribe(req: Request, res: Response, next: NextFunction) {
        try {
            // Get token from query param (EventSource limitation)
            const token = req.query.token as string;
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Token required for SSE subscription',
                });
            }

            // Verify token
            let userId: string | null = null;
            try {
                const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
                userId = payload.role === 'ADMIN' ? null : payload.userId;
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid or expired token',
                });
            }

            // Set SSE headers
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // For nginx

            // Generate unique client ID
            const clientId = randomUUID();

            // Register this client
            notificationService.registerClient(clientId, userId, res);

            // Send initial connection event
            res.write(`data: ${JSON.stringify({
                type: 'connected',
                clientId,
                message: 'SSE connection established',
            })}\n\n`);

            // Keep connection alive with periodic pings
            const pingInterval = setInterval(() => {
                try {
                    res.write(`data: ${JSON.stringify({
                        type: 'ping',
                        timestamp: Date.now(),
                    })}\n\n`);
                } catch (error) {
                    clearInterval(pingInterval);
                }
            }, 30000); // Ping every 30 seconds

            // Handle client disconnect
            req.on('close', () => {
                clearInterval(pingInterval);
                notificationService.unregisterClient(clientId);
                console.log(`SSE Client disconnected: ${clientId}`);
            });

            req.on('error', () => {
                clearInterval(pingInterval);
                notificationService.unregisterClient(clientId);
            });

        } catch (error) {
            next(error);
        }
    },
};
