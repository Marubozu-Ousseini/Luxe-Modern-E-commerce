import express, { Router } from 'express';
import Stripe from 'stripe';
import { isDbAvailable } from '../services/db.js';
import { getAllProducts, getAllProductsAsync } from '../services/produitService.js';
import { createOrderAsync, updateOrderStatusAsync } from '../services/orderService.js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || 'usd').toLowerCase();

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

export const paymentsRouter = Router();
export const stripeWebhookRouter = Router();

// Create checkout session: creates a pending order then returns Stripe URL
paymentsRouter.post('/checkout-session', async (req, res) => {
  try {
    if (!stripe) return res.status(501).json({ message: 'Stripe non configuré' });
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Non authentifié' });
    const items = req.body?.items as { productId: number; quantity: number }[];
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'Panier vide' });
    const products = isDbAvailable() ? await getAllProductsAsync() : getAllProducts();
    // Create order locally (paid for now to reuse, or you can implement pending variant)
    const order = await createOrderAsync(userId, products, items);
    const lineItems = items.map(it => {
      const product = products.find(p => p.id === it.productId)!;
      return {
        quantity: it.quantity,
        price_data: {
          currency: STRIPE_CURRENCY,
          product_data: { name: product.name },
          // convert XAF to chosen currency outside scope; for demo use price as cents
          unit_amount: product.price,
        },
      };
    });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: req.body?.successUrl || 'https://example.com/success',
      cancel_url: req.body?.cancelUrl || 'https://example.com/cancel',
      metadata: { orderId: order.id, userId },
    });
    return res.json({ url: session.url, id: session.id });
  } catch (e: any) {
    return res.status(400).json({ message: e?.message || 'Échec de création de la session de paiement' });
  }
});

// Stripe webhook: must use raw body parsing
stripeWebhookRouter.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !STRIPE_WEBHOOK_SECRET) return res.status(501).send('Stripe non configuré');
  const sig = req.headers['stripe-signature'] as string;
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await updateOrderStatusAsync(orderId, 'paid');
      }
    }
    res.json({ received: true });
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

export default paymentsRouter;
