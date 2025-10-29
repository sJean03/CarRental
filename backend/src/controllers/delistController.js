const DelistRequest = require('../models/DelistRequest');
const Car = require('../models/Car');
const VehicleOwner = require('../models/VehicleOwner');
const notificationService = require('../utils/notificationService');

const createDelistRequest = async (req, res) => {
  try {
  const ownerProfile = req.ownerProfile;
  const ownerId = ownerProfile.id;
  // route param is named `id` in the router -> use it as carId
  const { id: carId } = req.params;
    const { reason } = req.body || {};

    // Ensure owner actually owns the car
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found' });
    }
    if (car.owner_id !== ownerId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delist this car' });
    }

    const result = await DelistRequest.create(ownerId, carId, reason);
    if (!result) {
      return res.status(409).json({ success: false, message: 'A pending delist request already exists for this car' });
    }

    // Notify admin(s) - simple console notification for now
    const ownerUser = await VehicleOwner.findById(ownerId);
    const ownerEmail = ownerUser ? ownerUser.email : null;
    await notificationService.createNotification(
      ownerUser ? ownerUser.user_id : null,
      ownerEmail || 'owner@example.com',
      'delist_requested',
      'Delist Request Submitted',
      `Owner requested to delist ${car.make} ${car.model} (${car.license_plate})`
    );

    return res.status(201).json({ success: true, data: { request: result } });
  } catch (error) {
    console.error('createDelistRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPendingRequests = async (req, res) => {
  try {
    const rows = await DelistRequest.findAllPending();
    return res.status(200).json({ success: true, data: { requests: rows } });
  } catch (error) {
    console.error('getPendingRequests error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params; // delist request id
    const request = await DelistRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Mark request approved
    await DelistRequest.markApproved(id);

    // Mark car as unavailable (safer than deleting)
    await Car.update(request.car_id, { status: 'unavailable' });

    // Notify owner
    const ownerEmail = request.owner_email || 'owner@example.com';
    await notificationService.createNotification(
      request.owner_user_id || null,
      ownerEmail,
      'delist_approved',
      'Delist Request Approved',
      `Your delist request for ${request.make} ${request.model} has been approved. The car is no longer available for browsing.`
    );

    return res.status(200).json({ success: true, message: 'Request approved' });
  } catch (error) {
    console.error('approveRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params; // delist request id
    const request = await DelistRequest.findById(id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    await DelistRequest.markRejected(id);

    // Notify owner
    const ownerEmail = request.owner_email || 'owner@example.com';
    await notificationService.createNotification(
      request.owner_user_id || null,
      ownerEmail,
      'delist_rejected',
      'Delist Request Rejected',
      `Your delist request for ${request.make} ${request.model} was rejected by admin.`
    );

    return res.status(200).json({ success: true, message: 'Request rejected' });
  } catch (error) {
    console.error('rejectRequest error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  createDelistRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
};
