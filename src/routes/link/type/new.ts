import Joi from "joi";
import express from "express";
import { iso, validate } from "../../../utils/utils";
import { error, success } from "../../../utils/api";
import { verifyToken } from "../../../utils/token";
import type { TokenData } from "../../../global/types";
import { prisma } from "../../../utils/db";
import { v4 as uuidv4 } from "uuid";

const SCHEMA = Joi.object({
    name: Joi.string().required(),
    colour: Joi.number().required(),
});

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {});

    if (valid.error) {
        error(res, 400, valid.data);
        return;
    }

    const data = valid.data;

    // get a unique id
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

    await prisma.link_types
        .create({
            data: {
                id: id,
                user_id: req.user.id,
                name: data.name,
                colour: data.colour,
            },
        })
        .catch((e) => {
            console.log(e);
            error(
                res,
                400,
                "An error occured: " + e.meta.cause ||
                    "Could not create new link type.",
            );
        });

    const updatedTypes = await prisma.link_types.findMany({
        where: {
            user_id: req.user.id,
        },
        select: {
            id: true,
            name: true,
            colour: true,
        },
    });

    success(res, updatedTypes, "Successfully created link type.", 200);
};
