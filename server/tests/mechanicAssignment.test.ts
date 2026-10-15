import { describe, it, expect, vi, beforeEach } from 'vitest';
import { assignRandomAvailableMechanic } from '../src/utils/mechanicAssignment';
import { Mechanic } from '../src/models/Mechanic';
import { Order } from '../src/models/Order';
import mongoose from 'mongoose';

vi.mock('../src/models/Mechanic');
vi.mock('../src/models/Order');

describe('Dynamic Mechanic Assignment & Availability Engine', () => {
  const mech1Id = new mongoose.Types.ObjectId();
  const mech2Id = new mongoose.Types.ObjectId();
  const mech3Id = new mongoose.Types.ObjectId();

  const mockMechanics = [
    {
      _id: mech1Id,
      name: 'Subhasish Ghosh',
      phone: '+91 98302 44109',
      workshopName: 'FixOnRoad Kalyani Central Auto Hub',
      vehiclePlate: 'WB-12-AE-4921',
      vehicleModel: 'Hero Splendor Plus (Service Bike)',
      specialization: 'Two-Wheeler Engine & Electrical Diagnostics',
      serviceCategories: ['Flat Tyre / Puncture Repair', 'Minor Engine Breakdown'],
      serviceRadius: 35,
      rating: 4.9,
      isAvailable: true,
      currentLocation: { lat: 22.9750, lng: 88.4340 }
    },
    {
      _id: mech2Id,
      name: 'Rajesh Karmakar',
      phone: '+91 98305 88543',
      workshopName: 'Shantipur Auto Garage & Spares',
      vehiclePlate: 'WB-18-B-6109',
      vehicleModel: 'Hero Glamour 125 Mobile Unit',
      specialization: 'Carburetor & Fuel Injection Calibration',
      serviceCategories: ['Emergency Fuel Delivery', 'Spark Plug & Ignition Fix'],
      serviceRadius: 35,
      rating: 4.8,
      isAvailable: true,
      currentLocation: { lat: 23.2500, lng: 88.4300 }
    },
    {
      _id: mech3Id,
      name: 'Debasish Mondal',
      phone: '+91 98303 66321',
      workshopName: 'Chakdaha Highway Support Station',
      vehiclePlate: 'WB-16-T-3401',
      vehicleModel: 'Honda Shine 125 Service Unit',
      specialization: 'Battery Jumpstart & Electrical Short-Circuit Recovery',
      serviceCategories: ['Battery Jumpstart', 'Electrical Inspection'],
      serviceRadius: 35,
      rating: 4.9,
      isAvailable: true,
      currentLocation: { lat: 23.0800, lng: 88.5200 }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters candidates by service capability match (e.g. Fuel Delivery vs Flat Tyre vs Battery)', async () => {
    // No active busy orders
    // @ts-ignore
    Order.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([])
      })
    });

    // @ts-ignore
    Mechanic.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockMechanics)
    });

    // Request Fuel Delivery -> must match Rajesh Karmakar, not Subhasish Ghosh
    const assignedFuel = await assignRandomAvailableMechanic({
      serviceType: 'fuel-delivery',
      location: { lat: 23.2500, lng: 88.4300 }
    });

    expect(assignedFuel).not.toBeNull();
    expect(assignedFuel.name).toBe('Rajesh Karmakar');
    expect(assignedFuel.vehiclePlate).toBe('WB-18-B-6109');
    expect(assignedFuel.vehicleModel).toBe('Hero Glamour 125 Mobile Unit');

    // Request Battery Jumpstart -> must match Debasish Mondal
    const assignedBattery = await assignRandomAvailableMechanic({
      serviceType: 'battery-jumpstart',
      location: { lat: 23.0800, lng: 88.5200 }
    });

    expect(assignedBattery).not.toBeNull();
    expect(assignedBattery.name).toBe('Debasish Mondal');
    expect(assignedBattery.vehiclePlate).toBe('WB-16-T-3401');
  });

  it('excludes mechanics already busy on an active job to guarantee unique mechanic assignments', async () => {
    // Mechanic 1 (Subhasish Ghosh) is currently on an active order
    // @ts-ignore
    Order.find.mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { mechanicId: mech1Id }
        ])
      })
    });

    // @ts-ignore
    Mechanic.find.mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockMechanics)
    });

    // Subhasish is busy, so next order must NOT get Subhasish Ghosh
    const assigned = await assignRandomAvailableMechanic({
      location: { lat: 22.9750, lng: 88.4340 }
    });

    expect(assigned).not.toBeNull();
    expect(assigned._id.toString()).not.toBe(mech1Id.toString());
    expect(assigned.name).not.toBe('Subhasish Ghosh');
  });
});
