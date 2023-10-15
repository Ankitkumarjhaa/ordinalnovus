// utils/applyMiddlewares.ts
import { NextApiRequest, NextApiResponse } from "next";

export const applyMiddlewares = (
  handler: (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>,
  ...middlewares: Array<
    (
      handler: (
        req: NextApiRequest,
        res: NextApiResponse
      ) => void | Promise<void>
    ) => (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  >
) => {
  return middlewares.reduce((composedHandler, middleware) => {
    return middleware(composedHandler);
  }, handler);
};
