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