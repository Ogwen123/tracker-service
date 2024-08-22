import Joi from "joi"
import express from "express"
import config from "../../config.json"
import { is_completed, iso, validate } from "../../utils/utils"
import { error, success } from "../../utils/api"
import { verifyToken } from "../../utils/token"
import type { RepeatOptions, TokenData } from "../../global/types"
import { prisma } from "../../utils/db"

const SCHEMA = Joi.object({
    query: Joi.string().required()
})

export default async (req: express.Request, res: express.Response) => {
    // validate the request body
    const valid = validate(SCHEMA, req.body || {})

    if (valid.error) {
        error(res, 400, valid.data)
        return
    }

    const data = valid.data

    const token = req.get("Authorization")?.split(" ")[1] // get the token from the bearer auth

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

    // handle special tags
    const specialTagsFound = {
        "pinned": false
    }

    if (data.query.includes("*")) {
        for (let i of Object.keys(specialTagsFound)) {
            if (data.query.includes("*" + i)) {
                specialTagsFound[i as keyof typeof specialTagsFound] = true
            }
        }
    }

    const filteredName: string[] = []

    for (let i of data.query.split(" ")) {
        for (let j of Object.keys(specialTagsFound)) {
            if (i !== "*" + j) {
                filteredName.push(i)
            }
        }
    }

    const query: { [key: string]: any } = { // base query
        name: {
            contains: filteredName.join(" ")
        },
        user_id: validToken.id
    }

    // add special tags to the query
    for (let i of Object.keys(specialTagsFound)) {
        if (specialTagsFound[i as keyof typeof specialTagsFound] === true) query[i] = true
    }

    const results = await prisma.tasks.findMany({
        where: query,
        include: {
            task_completions: {
                orderBy: {
                    completed_at: "desc"// newest first
                }
            }
        }
    })

    const i = results.map((task) => {
        return {
            ...task,
            completed: task.task_completions.length === 0
                ?
                false
                :
                is_completed(task),
            completions: task.task_completions.length
        }
    })

    success(res, i, "Successfully fetched tasks that match the query.", 200)
}