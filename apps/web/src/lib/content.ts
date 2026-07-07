import { ContentService, seedContent } from "@core/content";
import { dbClient } from "./db";

// Singleton content service instance
export const contentService = new ContentService(dbClient);

// Separate from app startup, called manually or via dedicated seeder routes
export async function runContentSeeder() {
  await seedContent(contentService);
}
