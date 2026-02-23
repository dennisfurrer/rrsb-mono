import * as runtime from "@prisma/client/runtime/client";
import * as $Class from "./internal/class";
import * as Prisma from "./internal/prismaNamespace";
export * as $Enums from './enums';
export * from "./enums";
/**
 * ## Prisma Client
 *
 * Type-safe database client for TypeScript
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Players
 * const players = await prisma.player.findMany()
 * ```
 *
 * Read more in our [docs](https://pris.ly/d/client).
 */
export declare const PrismaClient: $Class.PrismaClientConstructor;
export type PrismaClient<LogOpts extends Prisma.LogLevel = never, OmitOpts extends Prisma.PrismaClientOptions["omit"] = Prisma.PrismaClientOptions["omit"], ExtArgs extends runtime.Types.Extensions.InternalArgs = runtime.Types.Extensions.DefaultArgs> = $Class.PrismaClient<LogOpts, OmitOpts, ExtArgs>;
export { Prisma };
/**
 * Model Player
 *
 */
export type Player = Prisma.PlayerModel;
/**
 * Model Location
 *
 */
export type Location = Prisma.LocationModel;
/**
 * Model User
 *
 */
export type User = Prisma.UserModel;
/**
 * Model ScoreboardConfig
 *
 */
export type ScoreboardConfig = Prisma.ScoreboardConfigModel;
/**
 * Model NamesList
 *
 */
export type NamesList = Prisma.NamesListModel;
/**
 * Model NamesListEntry
 *
 */
export type NamesListEntry = Prisma.NamesListEntryModel;
/**
 * Model Match
 *
 */
export type Match = Prisma.MatchModel;
/**
 * Model FrameAction
 *
 */
export type FrameAction = Prisma.FrameActionModel;
/**
 * Model MatchAssignment
 *
 */
export type MatchAssignment = Prisma.MatchAssignmentModel;
//# sourceMappingURL=client.d.ts.map