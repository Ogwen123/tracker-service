import Joi from "joi"

export const now = (): number => {
    return Date.now()
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