import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
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

    const tasks = await prisma.tasks.findMany({
        where: {
            user_id: validToken.id,
            pinned: true
        }
    })

    success(res, tasks, "Successfully fetched pinned tasks.", 200)
}