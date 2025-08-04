import Joi from "joi";
import express from "express";
import { iso, validate } from "../../utils/utils";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { TokenData } from "../../global/types";
import { prisma } from "../../utils/db";
import config from "../../config.json";
import { addCompletionData } from "../../utils/tasks";

const SCHEMA = Joi.object({
    id: Joi.string().required(),
    page: Joi.number().required(),
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
        },
    });

    if (task === null) {
        error(res, 400, "This id does not exist.");
        return;
    }

    if (task.user_id !== req.user.id) {
        error(res, 403, "You are not the owner of this task.");
        return;
    }

    await prisma.tasks.delete({
        where: {
            id: data.id,
            user_id: req.user.id,
        },
    });

    const updatedTasks = await prisma.tasks.findMany({
        where: {
            user_id: req.user.id,
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc", // newest first
                },
            },
        },
        take: (data.page + 1) * config.taskPageSize,
    });

    const filtered = addCompletionData(updatedTasks);

    success(res, filtered, "Successfully deleted task.", 200);
};
