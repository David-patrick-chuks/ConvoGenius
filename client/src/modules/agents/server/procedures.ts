import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import {createTRPCRouter, premiumProcedure, protectedProcedure} from "@/trpc/init";
import { agentsInsertSchema, agentsUpdateSchema } from "../schemas";
import { z } from "zod";
import { and, count, desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/constants";
import { TRPCError } from "@trpc/server";

export const agentsRouter = createTRPCRouter({

    update: protectedProcedure
    .input(agentsUpdateSchema)
    .mutation(async ({input, ctx})=> {
        const [updatedAgent] = await db
            .update(agents)
            .set(input)
            .where(
                and(
                    eq(agents.id, input.id),
                    eq(agents.userId, ctx.auth.user.id)
                )
            )
            .returning();

        if (!updatedAgent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
        }
        return updatedAgent;
    }),
    

    remove: protectedProcedure
    .input(z.object({id: z.string() }))
    .mutation(async ({input, ctx})=> {
        const [removedAgent] = await db
            .delete(agents)
            .where(
                and(
                    eq(agents.id, input.id),
                    eq(agents.userId, ctx.auth.user.id)
                )
            )
            .returning();


        if (!removedAgent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
        }
        return removedAgent;
    }),


    getOne: protectedProcedure
    .input(z.object({id: z.string()}))
    .query(async ({input, ctx})=> {
        const [existingAgent] = await db
            .select({
                ...getTableColumns(agents),
            })
            .from(agents)
            .where(
                and(
                    eq(agents.id, input.id),
                    eq(agents.userId, ctx.auth.user.id)
                )
            );

        if (!existingAgent) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Agent not found" });
        }

        // Count the actual meetings for this agent
        const [meetingCountResult] = await db
            .select({ count: count() })
            .from(meetings)
            .where(eq(meetings.agentId, input.id));

        return {
            ...existingAgent,
            meetingCount: meetingCountResult.count,
        };
    }),

    
    getMany: protectedProcedure
    .input(z.object({
        page: z.number().default(DEFAULT_PAGE),
        pageSize: z.number().min(MIN_PAGE_SIZE).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
        search: z.string().optional(),
    })) .query(async ({ctx , input})=> {
        const {search, page, pageSize} = input;
        const data = await db
            .select({
                ...getTableColumns(agents),
                meetingCount: sql<number>`COALESCE(COUNT(${meetings.id}), 0)`,
            })
            .from(agents)
            .leftJoin(meetings, eq(agents.id, meetings.agentId))
            .where(
                and(
                    eq(agents.userId, ctx.auth.user.id),
                    search ? ilike(agents.name, `%${search}%`) : undefined,
                )
            )
            .groupBy(agents.id)
            .orderBy(desc(agents.createdAt), desc(agents.id))
            .limit(pageSize)
            .offset((page - 1) * pageSize);

            const total = await db
                .select({count: count()})
                .from(agents)
                .where(
                    and(
                        eq(agents.userId, ctx.auth.user.id),
                        search ? ilike(agents.name, `%${search}%`) : undefined,
                    )
                );

            const totalPages = Math.ceil(total[0].count / pageSize);
        return{
            items: data,
            total: total[0].count,
            totalPages,
        };
    }),


    create: premiumProcedure("agents")
        .input(agentsInsertSchema)
        .mutation(async ({ input, ctx }) => {
            const [createdAgent] = await db
                .insert(agents)
                .values({
                    ...input,
                    userId: ctx.auth.user.id, 
                })
                .returning();

            return createdAgent; 
        }),
})