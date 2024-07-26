import Joi from "joi"
import express from "express"
import { validate } from "../../utils/utils"
import { error } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import { v4 as uuidv4 } from "uuid"

const SCHEMA = Joi.object({
    name: Joi.string().required(),
    repeatPeriod: Joi.string().allow("WEEK", "FORTNIGHT", "MONTH").required(),
    dt: Joi.boolean().required(),
    day: Joi.string().allow("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"),
    hour: Joi.number(),
    minute: Joi.number(),
    weekOfRepeatPeriod: Joi.string().allow("FIRST", "SECOND", "THIRD", "FOURTH")
})

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {})

    if (valid.error) {
        error(res, 400, valid.data)
        return
    }

    const data = valid.data

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

    // get a unique id
    let id = ""
    let unique = false
    while (!unique) {
        id = uuidv4()
        unique = (await prisma.tables.findMany({
            where: {
                id
            }
        })).length === 0
    }
}