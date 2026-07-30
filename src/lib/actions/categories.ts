"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TransactionType } from "@prisma/client";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

const createCategorySchema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export async function createCategory(input: unknown) {
  const userId = await requireUserId();
  const data = createCategorySchema.parse(input);

  const category = await prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type as TransactionType,
      color: data.color,
      icon: data.icon,
    },
  });

  revalidatePath("/dashboard");
  return category;
}

export async function listCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function deleteCategory(categoryId: string) {
  const userId = await requireUserId();
  await prisma.category.deleteMany({ where: { id: categoryId, userId } });
  revalidatePath("/dashboard");
}
