import Joi from "joi";
import express from "express";
import config from "../../config.json";
import { calcEndThreshold, isCompleted } from "../../utils/tasks";
import { validate } from "../../utils/utils";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { RepeatOptions, TokenData } from "../../global/types";
import { prisma } from "../../utils/db";

const SCHEMA = Joi.object({
    id: Joi.string().required(),
});

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {});

    if (valid.error) {
        error(res, 400, valid.data);
        return;
    }

    const data = valid.data;

    const task = await prisma.tasks.findUnique({
        where: {
            id: data.id,
            user_id: req.user.id,
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc", // newest first
                },
                take: 10,
            },
        },
    });

    if (task === null) {
        error(res, 400, "This task does not exist");
        return;
    }

    const extendedTask = {
        ...task,
        completed: isCompleted(task),
        completions: task.task_completions.length,
        threshold: calcEndThreshold(task),
    };

    success(res, extendedTask, "Successfully fetched tasks.", 200);
};
