"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, TransactionType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  try {
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
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Категория с таким названием уже существует");
    }
    throw err;
  }
}

export async function listCategories() {
  const userId = await requireUserId();
  return prisma.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

const updateCategorySchema = createCategorySchema.extend({
  id: z.string(),
});

export async function updateCategory(input: unknown) {
  const userId = await requireUserId();
  const data = updateCategorySchema.parse(input);

  try {
    const result = await prisma.category.updateMany({
      where: { id: data.id, userId },
      data: {
        name: data.name,
        type: data.type as TransactionType,
        color: data.color,
        icon: data.icon,
      },
    });

    if (result.count === 0) {
      throw new Error("Категория не найдена");
    }

    revalidatePath("/dashboard");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("Категория с таким названием уже существует");
    }
    throw err;
  }
}

export async function deleteCategory(categoryId: string) {
  const userId = await requireUserId();
  await prisma.category.deleteMany({ where: { id: categoryId, userId } });
  revalidatePath("/dashboard");
}
