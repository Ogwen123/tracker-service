import Joi from "joi";
import express from "express";
import config from "../../config.json";
import { calcEndThreshold, isCompleted } from "../../utils/tasks";
import { validate } from "../../utils/utils";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { RepeatOptions, TokenData } from "../../global/types";
import { prisma } from "../../utils/db";

export default async (req: express.Request, res: express.Response) => {
    const links = await prisma.links.findMany({
        where: {
            user_id: req.user.id,
        },
        select: {
            id: true,
            link: true,
            note: true,
            class_id: true,
            type_id: true,
        },
    });

    const classes = await prisma.link_classes.findMany({
        where: {
            user_id: req.user.id,
        },
        select: {
            id: true,
            name: true,
            colour: true,
        },
    });

    const types = await prisma.link_types.findMany({
        where: {
            user_id: req.user.id,
        },
        select: {
            id: true,
            name: true,
            colour: true,
        },
    });

    success(res, { links, classes, types }, "Successfully fetched tasks.", 200);
};
