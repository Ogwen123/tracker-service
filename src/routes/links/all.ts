import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { calcEndThreshold, isCompleted } from "../../utils/tasks"
import { validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { RepeatOptions, TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

export default async (req: express.Request, res: express.Response) => {
    const token = req.get("Authorization")?.split(" ")[1]

    if (token === undefined) {
        error(res, 401, "Invalid token")
        return
    }

    const tokenRes = await verifyToken(token)

    if (tokenRes === false) {
        error(res, 401, "This is not a valid token.")
        return
    }

    const validToken: TokenData = tokenRes.data

    const links = await prisma.links.findMany({
        where: {
            user_id: validToken.id
        },
        select: {
            id: true,
            link: true,
            note: true,
            class_id: true,
            type_id: true
        }
    })

    const classes = await prisma.link_classes.findMany({
        where: {
            user_id: validToken.id
        },
        select: {
            id: true,
            name: true,
            colour: true
        }
    })

    const types = await prisma.link_types.findMany({
        where: {
            user_id: validToken.id
        },
        select: {
            id: true,
            name: true,
            colour: true
        }
    })

    success(res, { links, classes, types }, "Successfully fetched tasks.", 200)
}