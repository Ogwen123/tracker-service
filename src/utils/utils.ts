import Joi from "joi"
import type { RawTask, RepeatOptions, Task, TaskCompletion } from "../global/types"

export const now = (): number => {
    return Math.floor(Date.now() / 1000) // get unix seconds
}

export const iso = (): string => {
    return (new Date()).toISOString()
}

export const validate = (schema: Joi.Schema, data: any) => {
    const validate = schema.validate(data, { abortEarly: false })

    if (validate.error) {
        return {
            error: true,
            data: validate.error.details.map((error) => {
                return error.message
            })
        }
    }
    return {
        error: false,
        data: validate.value
    }
}

