import { z } from 'zod';
import { authedQuery, createRouter, publicQuery } from './middleware';
import { buildApsDwgAdapterContract } from '@/lib/dwgApsDesignAutomationContract';
import { buildApsDwgConversionPlan, getApsDwgEnvironmentStatus } from './lib/dwgApsDesignAutomationAdapter';

export const cadRouter = createRouter({
  apsDwgStatus: publicQuery.query(() => ({
    contract: buildApsDwgAdapterContract(),
    environment: getApsDwgEnvironmentStatus(),
  })),

  apsDwgPlan: authedQuery
    .input(z.object({
      fileName: z.string().min(1).max(255),
      contentBase64: z.string().min(1).max(2_000_000),
    }))
    .query(({ input }) => {
      const content = Buffer.from(input.contentBase64, 'base64');
      return buildApsDwgConversionPlan(input.fileName, content);
    }),
});
