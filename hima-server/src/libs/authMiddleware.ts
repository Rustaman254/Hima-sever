import express from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../Configs/configs.ts";

export interface AuthRequest extends Request {
    user?: {
        id: string;
        phoneNumber: string;
        role: string;
    };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
            if (err) {
                return res.status(403).json({ error: "Invalid or expired token" });
            }

            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ error: "No authentication token provided" });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: "Admin access required" });
    }
};
