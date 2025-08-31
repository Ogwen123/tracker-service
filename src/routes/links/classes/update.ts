// this route takes all the classes from the frontend instead of only the ones that have changed

import Joi from "joi";
import express from "express";
import { iso, validate } from "../../../utils/utils";
import { error, success } from "../../../utils/api";
import { verifyToken } from "../../../utils/token";
import type { TokenData } from "../../../global/types";
import { prisma } from "../../../utils/db";
import { v4 as uuidv4 } from "uuid";

const SCHEMA = Joi.object({
    items: Joi.array().items(
        Joi.object({
            id: Joi.string().required(),
            name: Joi.string().required(),
            colour: Joi.number().required(),
        }),
    ),
});

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {});

    if (valid.error) {
        error(res, 400, valid.data);
        return;
    }

    const data = valid.data;

    const id = async (): Promise<string> => {
        // ik this is pretty pointless and its never gonna make a dupe id but better to be on the safe side
        let id = "";
        let unique = false;
        while (!unique) {
            id = uuidv4();
            unique =
                (
                    await prisma.link_classes.findMany({
                        where: {
                            id,
                        },
                    })
                ).length === 0;
        }

        return id;
    };

    for (let item of data.items) {
        await prisma.link_classes
            .upsert({
                where: {
                    id: item.id,
                    user_id: req.user.id,
                },
                update: {
                    name: item.name,
                    colour: item.colour,
                },
                create: {
                    id: await id(),
                    user_id: req.user.id,
                    name: item.name,
                    colour: item.colour,
                },
            })
            .catch((e) => {
                console.log(e);
                error(
                    res,
                    400,
                    "An error occured: " + e.meta.cause ||
                        "Could not create new link class.",
                );
            });
    }

    const updatedClasses = await prisma.link_classes.findMany({
        where: {
            user_id: req.user.id,
        },
        select: {
            id: true,
            name: true,
            colour: true,
        },
    });

    success(
        res,
        updatedClasses,
        "Successfully updated all supplied classes.",
        200,
    );
};
