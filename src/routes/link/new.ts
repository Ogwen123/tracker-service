import Joi from "joi";
import express from "express";
import { iso, validate } from "../../utils/utils";
import { error, success } from "../../utils/api";
import { verifyToken } from "../../utils/token";
import type { TokenData } from "../../global/types";
import { prisma } from "../../utils/db";
import { v4 as uuidv4 } from "uuid";
import config from "../../config.json";

const SCHEMA = Joi.object({
    link: Joi.string().required(),
    note: Joi.string().required(),
    class_id: Joi.string().required(),
    type_id: Joi.string().required(),
});

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {});

    if (valid.error) {
        error(res, 400, valid.data);
        return;
    }

    const data = valid.data;

    // check the type and class ids exist

    // get a unique id
    let id = "";
    let unique = false;
    while (!unique) {
        id = uuidv4();
        unique =
            (
                await prisma.links.findMany({
                    where: {
                        id,
                    },
                })
            ).length === 0;
    }

    await prisma.links
        .create({
            data: {
                id: id,
                user_id: req.user.id,
                link: data.link,
                note: data.note,
                class_id: data.class_id,
                type_id: data.type_id,
                created_at: iso(),
                updated_at: iso(),
            },
        })
        .catch((e) => {
            console.log(e);
            error(
                res,
                400,
                "An error occured: " + e.meta.cause ||
                    "Could not create new link.",
            );
        });

    const updatedLinks = await prisma.links.findMany({
        where: {
            user_id: req.user.id,
        },
    });

    success(res, updatedLinks, "Successfully created task.", 200);
};
