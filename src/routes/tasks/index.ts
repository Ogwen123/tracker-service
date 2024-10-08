import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { addCompletionData, isCompleted } from "../../utils/tasks"
import { validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

const SCHEMA = Joi.object({
    page: Joi.number().required().min(0)
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

    const pageSize = config.taskPageSize || 20

    const tasks = await prisma.tasks.findMany({
        skip: data.page * pageSize,
        take: pageSize,
        where: {
            user_id: validToken.id
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
        }
    })

    let filtered: any[] = addCompletionData(tasks)

    success(res, filtered, "Successfully fetched tasks.", 200)
}