import Joi from "joi";
import express from "express";
import { iso, validate } from "../../../utils/utils";
import { error, success } from "../../../utils/api";
import { verifyToken } from "../../../utils/token";
import type { TokenData } from "../../../global/types";
import { prisma } from "../../../utils/db";

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

    await prisma.link_types
        .delete({
            where: {
                id: data.id,
            },
        })
        .catch((e) => {
            console.log(e);
            error(
                res,
                400,
                "An error occured: " + e.meta.cause ||
                    "Could not delete link type.",
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

    success(res, updatedTypes, "Successfully deleted link type.", 200);
};
