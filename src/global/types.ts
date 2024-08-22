export type VerifyResponse = {
    success: boolean,
    code: number,
    message: string,
    data: TokenData
}

export type TokenData = {
    id: string,
    perms: string[]
}

export type RepeatOptions = "NEVER" | "WEEK" | "FORTNIGHT" | "MONTH"
export type Day = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
export type Week = "FIRST" | "SECOND" | "THIRD" | "FOURTH"

export type Task = {
    id: string,
    name: string,
    repeat_period: RepeatOptions,
    date_time: boolean,
    day: Day | null,
    hour: number | null,
    minute: number | null,
    week_of_repeat_period: Week | null,
    user_id: string,
    pinned: boolean,
    completed: boolean,
    completions: number,
    created_at: string
}

export type TaskCompletion = {
    id: string,
    task_id: string,
    completed_at: number
}