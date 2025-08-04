import Joi from "joi";
import express from "express";
import { iso, validate } from "../../utils/utils";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { TokenData } from "../../global/types";
import { prisma } from "../../utils/db";
import config from "../../config.json";

const SCHEMA = Joi.object({
    id: Joi.string().required(),
    page: Joi.number().required(), // set page to -1 to not return any updated tasks
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

    const pinnedCount = await prisma.tasks.count({
        where: {
            user_id: req.user.id,
            pinned: true,
        },
    });

    if (pinnedCount >= 6 && task.pinned === false) {
        error(res, 400, "You can only have 6 pinned tasks.");
        return;
    }

    await prisma.tasks
        .update({
            where: {
                id: data.id,
                user_id: req.user.id,
            },
            data: {
                pinned: task.pinned === true ? false : true,
            },
        })
        .catch((e) => {
            console.log(e);
            error(
                res,
                500,
                "Something unexpected happened when pinning your task. Please try again.",
            );
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

    if (updatedTasks === null) {
        return error(
            res,
            500,
            "Something unexpected happened when pinning your task. Please try again.",
        );
    }

    success(
        res,
        updatedTasks,
        "Successfully " +
            (task.pinned === true ? "unpinned" : "pinned") +
            " task.",
        200,
    );
};
