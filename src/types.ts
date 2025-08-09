export type Request = any;

export const isChromeRequest = (request: Request) : boolean => (typeof (request as any).getContent === 'function')