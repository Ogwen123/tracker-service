import Joi from "joi"
import express from "express"
import { calc_threshold, is_completed, iso, now, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { TokenData } from "../../global/types"
import { prisma } from "../../utils/db"
import { v4 as uuidv4 } from "uuid"
import config from "../../config.json"

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
        },
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
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

    if (is_completed(task)) {
        await prisma.task_completions.deleteMany({
            where: {
                task_id: validToken.id,
                completed_at: {
                    gte: calc_threshold(task)
                }
            }
        }).catch((e) => {
            console.log(e)
            error(res, 500, "Something unexpected happened when uncompleting your task. Please try again.")
        })
    } else {

        // get a unique id
        let id = ""
        let unique = false
        while (!unique) {
            id = uuidv4()
            unique = (await prisma.task_completions.findMany({
                where: {
                    id
                }
            })).length === 0
        }

        await prisma.task_completions.create({
            data: {
                id,
                task_id: task.id,
                completed_at: now()
            }
        }).catch((e) => {
            console.log(e)
            error(res, 500, "Something unexpected happened when completing your task. Please try again.")
        })
    }

    const updatedTasks = await prisma.tasks.findMany({
        where: {
            user_id: validToken.id
        },
        take: (data.page + 1) * config.taskPageSize
    })

    if (updatedTasks === null) {
        return error(res, 500, "Something unexpected happened when pinning your task. Please try again.")
    }

    success(res, updatedTasks, "Successfully " + (task.pinned === true ? "unpinned" : "pinned") + " task.", 200)
}