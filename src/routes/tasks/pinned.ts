import Joi from "joi";
import express from "express";
import config from "../../config.json";
import { addCompletionData, isCompleted } from "../../utils/tasks";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { RepeatOptions, TokenData } from "../../global/types";
import { prisma } from "../../utils/db";

export default async (req: express.Request, res: express.Response) => {
    const tasks = await prisma.tasks.findMany({
        where: {
            user_id: req.user.id,
            pinned: true,
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc", // newest first
                },
            },
        },
    });

    const filtered = addCompletionData(tasks);

    success(res, filtered, "Successfully fetched pinned tasks.", 200);
};
