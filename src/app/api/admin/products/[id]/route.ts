import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUserRole } from "@/lib/role";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (!role || !["ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    description,
    price,
    discount,
    stock,
    isAvailable,
    categoryId,
    images,
    options,
  } = body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      title,
      description,
      price: Number(price),
      discount: Number(discount || 0),
      stock: Number(stock || 0),
      isAvailable: isAvailable ?? true,
      categoryId: categoryId || null,
      images: images || [],
    },
  });

  if (options !== undefined) {
    await prisma.productOption.deleteMany({
      where: { productId: id },
    });

    if (options.length > 0) {
      await prisma.productOption.createMany({
        data: options.map((opt: any) => ({
          name: opt.name,
          price: Number(opt.price),
          image: opt.image || null,
          stock: Number(opt.stock || 0),
          productId: id,
        })),
      });
    }
  }

  const updatedProduct = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      options: true,
    },
  });

  return NextResponse.json(updatedProduct);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const role = await getCurrentUserRole();
  if (!role || !["ADMIN", "STAFF"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  await prisma.productOption.deleteMany({
    where: { productId: id },
  });

  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
