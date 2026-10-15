import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { Cart, ICartItem } from '../models/Cart';
import { Order } from '../models/Order';
import { verifyCartAuth, requireCustomerCartRole } from '../middleware/auth';
import { generateOrderCode } from '../utils/orderCode';
import { assignRandomAvailableMechanic } from '../utils/mechanicAssignment';
import { getRoadRoute, RouteResult } from '../utils/routing';

const router = Router();

// Apply strict authentication and role checking on all cart routes
router.use(verifyCartAuth);
router.use(requireCustomerCartRole);

const calculateCartTotals = (items: ICartItem[]) => {
  const itemCount = items.reduce((count, item) => count + (item.quantity || 1), 0);
  const baseTotal = items.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
  const platformFee = items.length > 0 ? 10 : 0;
  const gst = Math.round(baseTotal * 0.18);
  const totalAmount = baseTotal + gst + platformFee;
  return { itemCount, baseTotal, gst, platformFee, totalAmount };
};

// 1. GET /api/cart
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    let cart = await Cart.findOne({ userId });
    
    if (!cart) {
      cart = await Cart.create({
        userId,
        items: []
      });
    }

    const totals = calculateCartTotals(cart.items);

    res.json({
      success: true,
      cart: {
        id: cart._id,
        items: cart.items,
        breakdownLocation: cart.breakdownLocation,
        ...totals
      }
    });
  } catch (error: any) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to retrieve roadside cart' });
  }
});

// 2. POST /api/cart/add
router.post('/add', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const itemData = req.body.item || req.body;
    const locationData = req.body.location || req.body.breakdownLocation;

    if (!itemData || !itemData.id || !itemData.name || typeof itemData.price !== 'number') {
      return res.status(400).json({ error: 'Invalid cart item payload. Requires id, name, and price.' });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex(i => i.id === itemData.id);
    const qty = Number(itemData.quantity) || 1;

    if (existingIndex > -1) {
      const isMulti = itemData.id.includes('fuel') || itemData.unit === 'liters';
      if (isMulti) {
        const currentQty = cart.items[existingIndex].quantity || 1;
        cart.items[existingIndex].quantity = Math.min(20, currentQty + qty);
      }
    } else {
      cart.items.push({
        id: itemData.id,
        name: itemData.name,
        nameKey: itemData.nameKey,
        type: itemData.type,
        price: itemData.price,
        quantity: qty,
        eta: itemData.eta,
        note: itemData.note,
        noteKey: itemData.noteKey,
        icon: itemData.icon,
        unit: itemData.unit
      });
    }

    if (locationData) {
      cart.breakdownLocation = {
        lat: Number(locationData.lat) || cart.breakdownLocation?.lat,
        lng: Number(locationData.lng) || cart.breakdownLocation?.lng,
        address: locationData.address || cart.breakdownLocation?.address
      };
    }

    await cart.save();
    const totals = calculateCartTotals(cart.items);

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart: {
        id: cart._id,
        items: cart.items,
        breakdownLocation: cart.breakdownLocation,
        ...totals
      }
    });
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to roadside cart' });
  }
});

// 3. DELETE /api/cart/item
router.delete('/item', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const itemId = (req.query.id as string) || req.body?.id;
    const clearAll = req.query.clearAll === 'true' || req.body?.clearAll === true;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(200).json({
        success: true,
        message: 'Cart is empty',
        cart: { items: [], itemCount: 0, totalAmount: 0 }
      });
    }

    if (clearAll) {
      cart.items = [] as any;
      cart.breakdownLocation = undefined;
    } else if (itemId) {
      cart.items = cart.items.filter(i => i.id !== itemId) as any;
    } else {
      return res.status(400).json({ error: 'Please provide item id to delete or set clearAll' });
    }

    await cart.save();
    const totals = calculateCartTotals(cart.items);

    res.status(200).json({
      success: true,
      message: clearAll ? 'Cart cleared' : 'Item removed from cart',
      cart: {
        id: cart._id,
        items: cart.items,
        breakdownLocation: cart.breakdownLocation,
        ...totals
      }
    });
  } catch (error: any) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// 4. POST /api/cart/checkout
router.post('/checkout', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId || req.user?._id;
    const cart = await Cart.findOne({ userId });

    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cannot checkout an empty roadside cart' });
    }

    const { baseTotal, gst, platformFee, totalAmount } = calculateCartTotals(cart.items);

    // Extract or fallback breakdown location
    const bodyLocation = req.body.location || req.body.breakdownLocation;
    const location = {
      lat: Number(bodyLocation?.lat) || Number(cart.breakdownLocation?.lat) || 22.9750,
      lng: Number(bodyLocation?.lng) || Number(cart.breakdownLocation?.lng) || 88.4340,
      address: bodyLocation?.address || cart.breakdownLocation?.address || 'Current Breakdown Location'
    };

    const serviceType = cart.items.map(i => i.name).join(' + ');

    // Auto-assign nearest available mechanic
    let mechanicId = null;
    let assignedMechanicDoc: any = null;
    try {
      assignedMechanicDoc = await assignRandomAvailableMechanic({
        location: { lat: location.lat, lng: location.lng },
        serviceType
      });
      if (assignedMechanicDoc) {
        mechanicId = assignedMechanicDoc._id;
      }
    } catch (err) {
      console.warn('Mechanic assignment fallback:', err);
    }

    const originCoords = {
      lat: assignedMechanicDoc?.currentLocation?.lat || 22.9750,
      lng: assignedMechanicDoc?.currentLocation?.lng || 88.4340
    };
    const destCoords = {
      lat: location.lat,
      lng: location.lng
    };

    let routeData: RouteResult = {
      distanceKm: 2.5,
      durationMinutes: 12,
      coordinates: [[originCoords.lat, originCoords.lng], [destCoords.lat, destCoords.lng]],
      source: 'fallback'
    };
    try {
      routeData = await getRoadRoute(originCoords, destCoords);
    } catch (err) {
      console.warn('Routing routeData calculation fallback:', err);
    }

    const orderCode = generateOrderCode();


    const newOrder = await Order.create({
      userId,
      orderCode,
      trackingCode: orderCode,
      mechanicId,
      serviceDetails: {
        serviceType,
        basePrice: baseTotal,
        gst,
        platformFee,
        totalAmount
      },
      location,
      paymentMethod: req.body.paymentMethod || 'cod',
      status: mechanicId ? 'CONFIRMED' : 'PENDING',
      roadDistanceKm: routeData.distanceKm,
      estimatedDurationMin: routeData.durationMinutes,
      routePolyline: routeData.coordinates,
      routingEngine: routeData.source,
      expiresAt: new Date(Date.now() + 600000)
    });

    // Clear cart upon successful checkout
    cart.items = [] as any;
    cart.breakdownLocation = undefined;
    await cart.save();

    const populatedOrder = await Order.findById(newOrder._id).populate('mechanicId');

    res.status(201).json({
      success: true,
      message: 'Roadside dispatch checkout confirmed',
      order: populatedOrder || newOrder
    });
  } catch (error: any) {
    console.error('Error during cart checkout:', error);
    res.status(500).json({ error: 'Failed to process roadside dispatch checkout' });
  }
});

export const cartRouter = router;
