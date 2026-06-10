import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const checkoutSession = event.data.object as any;
        const userId = checkoutSession.metadata?.userId;
        const subscriptionId = checkoutSession.subscription as string;

        if (userId && subscriptionId) {
          const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as any;

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "ACTIVE",
              stripeSubscriptionId: subscriptionId,
              subscriptionEnd: subscription.current_period_end
                ? new Date(subscription.current_period_end * 1000)
                : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        let userId = subscription.metadata?.userId;

        if (!userId) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          userId = user?.id;
        }

        if (userId) {
          const status =
            subscription.status === "active"
              ? "ACTIVE"
              : subscription.status === "canceled" || subscription.status === "unpaid"
              ? "CANCELLED"
              : "INACTIVE";

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: status as any,
              subscriptionEnd: new Date(subscription.current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        let userId = subscription.metadata?.userId;

        if (!userId) {
          const user = await prisma.user.findFirst({
            where: { stripeCustomerId: subscription.customer as string },
          });
          userId = user?.id;
        }

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: "CANCELLED",
              subscriptionEnd: null,
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: "Error procesando webhook" }, { status: 500 });
  }
}
