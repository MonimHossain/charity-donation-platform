import { Request, Response } from "express";
import {
  activateAccount,
  checkDonorEmail,
  requestDonorAccess,
  resetAccountPassword,
  sendPasswordResetForEmail,
} from "./donorAccess.service.js";

export async function checkDonorEmailHandler(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await checkDonorEmail(email);
    return res.json(result);
  } catch (error) {
    console.error("checkDonorEmail error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function requestDonorAccessHandler(req: Request, res: Response) {
  try {
    const { email, fullName, returnTo } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await requestDonorAccess({ email, fullName, returnTo });
    return res.json(result);
  } catch (error) {
    console.error("requestDonorAccess error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function activateAccountHandler(req: Request, res: Response) {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }
    const session = await activateAccount(res, token, password);
    return res.json(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed";
    const status = message.includes("expired") || message.includes("Invalid") ? 400 : 500;
    return res.status(status).json({ message });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    try {
      await sendPasswordResetForEmail(email);
    } catch (err) {
      console.error("forgotPassword mail error:", err);
    }

    return res.json({
      message: "If an account with that email exists, a reset link has been sent",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token and new password are required" });
    }

    await resetAccountPassword(token, newPassword);
    return res.json({ message: "Password has been reset successfully" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Reset failed";
    const status = message.includes("expired") || message.includes("Invalid") ? 400 : 500;
    return res.status(status).json({ message });
  }
}
