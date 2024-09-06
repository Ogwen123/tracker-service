import Joi from "joi"
import express from "express"
import { iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import config from "../../config.json"
import { addCompletionData } from "../../utils/tasks"

const SCHEMA = Joi.object({
    id: Joi.string().required(),
    page: Joi.number().required()
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

    const task = await prisma.tasks.findUnique({
        where: {
            id: data.id
        }
    })

    if (task === null) {
        error(res, 400, "This id does not exist.")
        return
    }

    if (task.user_id !== validToken.id) {
        error(res, 403, "You are not the owner of this task.")
        return
    }

    await prisma.tasks.delete({
        where: {
            id: data.id,
            user_id: validToken.id
        }
    })

    const updatedTasks = await prisma.tasks.findMany({
        where: {
            user_id: validToken.id
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
        },
        take: (data.page + 1) * config.taskPageSize
    })

    const filtered = addCompletionData(updatedTasks)

    success(res, filtered, "Successfully deleted task.", 200)
}