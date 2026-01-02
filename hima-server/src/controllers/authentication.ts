import type { Request, Response } from "express";

export const register = (req: Request, res: Response) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone number is required" });
    }

};

export const login = (req: Request, res: Response) => {
    res.send("Login");
};
