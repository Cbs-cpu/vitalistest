import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No tienes una subscripción activa" }, { status: 400 });
    }

    await stripe.subscriptions.cancel(user.stripeSubscriptionId);

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionStatus: "CANCELLED" },
    });

    return NextResponse.json({ message: "Subscripción cancelada" });
  } catch (error) {
    return NextResponse.json({ error: "Error al cancelar subscripción" }, { status: 500 });
  }
}
