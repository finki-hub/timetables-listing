import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';

import { zValidator } from '@hono/zod-validator';

export const validate = <
  Target extends keyof ValidationTargets,
  Schema extends ZodType,
>(
  target: Target,
  schema: Schema,
) =>
  // eslint-disable-next-line sonarjs/no-inconsistent-returns -- zValidator requires returning a response only when validation fails.
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const errorMessage = result.error.issues[0]?.message ?? 'Invalid input';

      return c.json({ error: errorMessage }, 400);
    }

    // eslint-disable-next-line consistent-return, no-useless-return, sonarjs/no-redundant-jump -- Returning no response tells zValidator to continue to the route handler.
    return;
  });
